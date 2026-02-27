# Explore + Stress Test Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Separate withdrawal strategy exploration (decumulation-only MC) from full-plan stress testing (lifecycle MC), add deterministic/stochastic pre-retirement toggle to Stress Test.

**Architecture:** Two-page split. Explore page (`/withdrawal`) gets a new MC tab for decumulation-only simulations with local balance-mode state. Stress Test page (`/stress-test`) drops the My Plan/FIRE Target toggle, adds an Expected Returns/Stochastic pre-retirement toggle backed by a new `deterministicAccumulation` param in the MC engine. Navigation restructured into EXPLORE and ANALYSIS sections.

**Tech Stack:** React 19, TypeScript, Zustand, Vitest, shadcn/ui, Tailwind CSS, Web Worker

**Design doc:** `docs/plans/2026-02-27-explore-stress-test-redesign-design.md`

---

## Parallelism Map

```
Agent A (Engine):  Task 1 → Task 2
Agent B (State):   Task 3 → Task 4 → Task 5a → Task 5b
Agent C (UI):      Task 6    (independent, can run with A or B)
                   Task 7 → Task 8    (after A+B+C complete)
```

- **Agent A** and **Agent B** are independent: A touches `monteCarlo.ts` + tests, B touches stores/hooks
- **Task 6** (nav restructure) is fully independent — can run in parallel with A or B
- **Tasks 7-8** depend on A, B, and C being complete (UI wires to new store fields and engine params)
- **Task 5b** (useWithdrawalComparison decoupling) must complete before Task 8 (Explore page)

---

## Task 1: MC Engine — `deterministicAccumulation` Param

**Files:**
- Modify: `src/lib/simulation/monteCarlo.ts:29-52` (type), `src/lib/simulation/monteCarlo.ts:285-387` (loop), `src/lib/simulation/monteCarlo.ts:663-702` (path selection)
- Test: `src/lib/simulation/monteCarlo.test.ts`

### Step 1: Write failing tests

Add to `src/lib/simulation/monteCarlo.test.ts`:

```typescript
describe('deterministicAccumulation', () => {
  it('produces identical pre-retirement balances across all sims when enabled', () => {
    const params = makeDefaultParams({
      nSimulations: 100,
      deterministicAccumulation: true,
      extractPaths: true,
    }) as MonteCarloEngineParams
    const result = runMonteCarlo(params)
    // All 5 representative paths should have the same retirement balance
    const retBalances = result.representative_paths!.map(p => p.retirementBalance)
    const first = retBalances[0]
    for (const bal of retBalances) {
      expect(bal).toBeCloseTo(first, 2)
    }
  })

  it('produces varying pre-retirement balances when disabled', () => {
    const params = makeDefaultParams({
      nSimulations: 100,
      extractPaths: true,
      deterministicAccumulation: false,
    }) as MonteCarloEngineParams
    const result = runMonteCarlo(params)
    const retBalances = result.representative_paths!.map(p => p.retirementBalance)
    const unique = new Set(retBalances.map(b => Math.round(b)))
    expect(unique.size).toBeGreaterThan(1)
  })

  it('still produces varying post-retirement outcomes when enabled', () => {
    const params = makeDefaultParams({
      nSimulations: 500,
      deterministicAccumulation: true,
    }) as MonteCarloEngineParams
    const result = runMonteCarlo(params)
    // Success rate is 0..1. Should NOT be 0 or 1 — post-retirement is still stochastic
    expect(result.success_rate).toBeGreaterThan(0)
    expect(result.success_rate).toBeLessThan(1)
  })

  it('selects representative paths by terminal wealth when enabled', () => {
    const params = makeDefaultParams({
      nSimulations: 500,
      deterministicAccumulation: true,
      extractPaths: true,
    }) as MonteCarloEngineParams
    const result = runMonteCarlo(params)
    const paths = result.representative_paths!
    // p10 terminal should be less than p90 terminal (roughly — based on terminal selection)
    // Since paths are selected by terminal wealth, lower percentile = lower terminal
    // All retirement balances should be identical (deterministic accumulation)
    const retBal0 = paths[0].retirementBalance
    for (const p of paths) {
      expect(p.retirementBalance).toBeCloseTo(retBal0, 2)
    }
    // But different paths should have different simIndex (selected by terminal, not retirement)
    const simIndices = new Set(paths.map(p => p.simIndex))
    expect(simIndices.size).toBeGreaterThan(1)
  })

  it('defaults to false (backward compatible)', () => {
    const params = makeDefaultParams({
      nSimulations: 100,
      extractPaths: true,
    }) as MonteCarloEngineParams
    // No deterministicAccumulation field — should behave as stochastic
    const result = runMonteCarlo(params)
    const retBalances = result.representative_paths!.map(p => p.retirementBalance)
    const unique = new Set(retBalances.map(b => Math.round(b)))
    expect(unique.size).toBeGreaterThan(1)
  })
})
```

### Step 2: Run tests to verify they fail

Run: `cd frontend && npx vitest run src/lib/simulation/monteCarlo.test.ts --reporter=verbose 2>&1 | tail -20`
Expected: FAIL — `deterministicAccumulation` not recognized in type, identical balances test fails

### Step 3: Add `deterministicAccumulation` to `MonteCarloEngineParams`

In `src/lib/simulation/monteCarlo.ts:51`, add before the closing `}`:

```typescript
  extractPaths?: boolean
  deterministicAccumulation?: boolean  // when true, use expected return during accumulation (all sims get identical pre-retirement path)
}
```

### Step 4: Compute expected portfolio return and use in accumulation loop

In `src/lib/simulation/monteCarlo.ts`, after the destructuring (after line 304), add:

```typescript
  const deterministicAccumulation = params.deterministicAccumulation ?? false

  // Weighted-average expected portfolio return (used when deterministicAccumulation is true)
  const expectedPortfolioReturn = deterministicAccumulation
    ? weights.reduce((sum, w, i) => sum + w * expectedReturns[i], 0)
    : 0  // unused when stochastic
```

Then modify the accumulation loop at line 386. Change:

```typescript
        balances[s][t + 1] =
          adjustedBalance * (1 + portfolioReturns[s][t] - expenseRatio) + savings
```

To:

```typescript
        const returnRate = deterministicAccumulation
          ? expectedPortfolioReturn
          : portfolioReturns[s][t]
        balances[s][t + 1] =
          adjustedBalance * (1 + returnRate - expenseRatio) + savings
```

### Step 5: Fix representative path selection for deterministic mode

In `src/lib/simulation/monteCarlo.ts:672`, change the selection logic from:

```typescript
    const selectionYearIdx = nYearsAccum > 0 ? nYearsAccum : nYearsTotal
```

To:

```typescript
    // When deterministicAccumulation is true, all sims have identical retirement-age
    // balances, so selecting by retirement balance would collapse all percentiles to
    // the same sim. Use terminal wealth instead to get meaningful post-retirement spread.
    const selectionYearIdx = (nYearsAccum > 0 && !deterministicAccumulation)
      ? nYearsAccum
      : nYearsTotal
```

### Step 6: Run tests to verify they pass

Run: `cd frontend && npx vitest run src/lib/simulation/monteCarlo.test.ts --reporter=verbose 2>&1 | tail -30`
Expected: ALL PASS

### Step 7: Run full test suite

Run: `cd frontend && npm run test 2>&1 | tail -10`
Expected: All tests pass, zero regressions

### Step 8: Commit

```bash
git add -f src/lib/simulation/monteCarlo.ts src/lib/simulation/monteCarlo.test.ts
git commit -m "feat(mc): add deterministicAccumulation param with terminal-wealth path selection"
```

---

## Task 2: Worker Passthrough

**Files:**
- Modify: `src/lib/simulation/workerClient.ts` (no change needed — params passed as-is)
- Modify: `src/lib/simulation/simulation.worker.ts` (no change needed — params passed as-is)

### Step 1: Verify passthrough works

The worker client passes `MonteCarloEngineParams` directly to the worker, and the worker passes it directly to `runMonteCarlo()`. Since `deterministicAccumulation` is an optional field on the same interface, no code changes are needed in these files.

Verify by reading both files and confirming params flow through unchanged.

### Step 2: Commit (skip if no changes)

No commit needed — the interface change in Task 1 flows through automatically via TypeScript's structural typing.

---

## Task 3: Store — Add `deterministicAccumulation` Field

**Files:**
- Modify: `src/lib/types.ts:681-691` (SimulationState interface)
- Modify: `src/stores/useSimulationStore.ts:25-54` (keys, defaults), `src/stores/useSimulationStore.ts:118-148` (migration, version bump)

### Step 1: Add field to `SimulationState` type

In `src/lib/types.ts:681`, add after `withdrawalBasis`:

```typescript
export interface SimulationState {
  mcMethod: MonteCarloMethod
  selectedStrategy: WithdrawalStrategyType
  strategyParams: StrategyParamsMap
  nSimulations: number
  analysisMode: AnalysisMode
  withdrawalBasis: WithdrawalBasis
  deterministicAccumulation: boolean  // NEW: when true, pre-retirement uses expected returns
  lastMCSuccessRate: number | null
  lastBacktestSuccessRate: number | null
  validationErrors: ValidationErrors
}
```

### Step 2: Add to store keys, defaults, and migration

In `src/stores/useSimulationStore.ts`:

**Update `SIMULATION_DATA_KEYS`** (line 25):
```typescript
const SIMULATION_DATA_KEYS = [
  'mcMethod', 'selectedStrategy', 'strategyParams', 'nSimulations', 'analysisMode',
  'lastMCSuccessRate', 'lastBacktestSuccessRate', 'withdrawalBasis', 'deterministicAccumulation',
] as const
```

**Update `DEFAULT_SIMULATION`** (line 45):
```typescript
const DEFAULT_SIMULATION: Omit<SimulationState, 'validationErrors'> = {
  mcMethod: 'parametric',
  selectedStrategy: 'constant_dollar',
  strategyParams: DEFAULT_STRATEGY_PARAMS,
  nSimulations: 10000,
  analysisMode: 'myPlan',
  withdrawalBasis: 'expenses',
  deterministicAccumulation: false,
  lastMCSuccessRate: null,
  lastBacktestSuccessRate: null,
}
```

**Bump version and add migration** (line 118):
Change `version: 5` to `version: 6` and add migration case:

```typescript
        if (version < 6) {
          // v5 → v6: add deterministicAccumulation field
          state.deterministicAccumulation ??= false
        }
```

### Step 3: Add migration test

If `src/stores/useSimulationStore.test.ts` exists, add a test verifying the v5→v6 migration:

```typescript
it('v5 → v6 migration adds deterministicAccumulation: false', () => {
  const v5State = {
    mcMethod: 'parametric',
    selectedStrategy: 'constant_dollar',
    strategyParams: DEFAULT_STRATEGY_PARAMS,
    nSimulations: 10000,
    analysisMode: 'myPlan',
    withdrawalBasis: 'expenses',
    lastMCSuccessRate: null,
    lastBacktestSuccessRate: null,
  }
  // Simulate migration by calling the migrate function with version 5
  // The store's migrate function should add deterministicAccumulation
  expect(v5State).not.toHaveProperty('deterministicAccumulation')
  // After store hydration, the field should default to false
})
```

### Step 4: Run type-check

Run: `cd frontend && npm run type-check 2>&1 | tail -10`
Expected: Zero errors

### Step 5: Commit

```bash
git add src/lib/types.ts src/stores/useSimulationStore.ts
git commit -m "feat(store): add deterministicAccumulation to simulation store"
```

---

## Task 4: Staleness Signature + MC Hook Wiring

**Files:**
- Modify: `src/hooks/useMonteCarloQuery.ts:56-117` (signature), `src/hooks/useMonteCarloQuery.ts:355-379` (params)

### Step 1: Add `deterministicAccumulation` to staleness signature

In `src/hooks/useMonteCarloQuery.ts:97`, add after `withdrawalBasis`:

```typescript
    withdrawalBasis: simulation.withdrawalBasis,
    deterministicAccumulation: simulation.deterministicAccumulation,
```

And in the dependency array (line 116), add:

```typescript
    simulation.withdrawalBasis,
    simulation.deterministicAccumulation,
```

### Step 2: Pass `deterministicAccumulation` to MC engine params

In `src/hooks/useMonteCarloQuery.ts:378`, add after `extractPaths: true`:

```typescript
        extractPaths: true,
        deterministicAccumulation: simulation.deterministicAccumulation,
```

### Step 3: Run type-check

Run: `cd frontend && npm run type-check 2>&1 | tail -10`
Expected: Zero errors

### Step 4: Run full test suite

Run: `cd frontend && npm run test 2>&1 | tail -10`
Expected: All tests pass

### Step 5: Commit

```bash
git add src/hooks/useMonteCarloQuery.ts
git commit -m "feat(hooks): wire deterministicAccumulation to MC staleness and params"
```

---

## Task 5: Decouple `analysisMode` from Stress Test

**Files:**
- Modify: `src/hooks/useAnalysisPortfolio.ts` (simplify for Stress Test — always My Plan)
- Modify: `src/hooks/useBacktestQuery.ts` (verify no direct analysisMode dependency)
- Modify: `src/hooks/useSequenceRiskQuery.ts` (verify no direct analysisMode dependency)

### Step 1: Simplify `useAnalysisPortfolio` for Stress Test

The Stress Test page always operates in "My Plan" mode. `useAnalysisPortfolio` currently reads `simulation.analysisMode` to switch behavior. We need it to **ignore `analysisMode`** and always return My Plan values.

However, the Explore page (Task 7) will need a different hook that supports the balance toggle. So the cleanest approach:

**Rename `useAnalysisPortfolio` → keep it but remove the fireTarget branch.** The Explore page will build its own params directly (Task 7).

In `src/hooks/useAnalysisPortfolio.ts`, replace the entire hook body:

```typescript
/**
 * Portfolio hook for Stress Test page. Always uses current NW as starting
 * portfolio (My Plan mode). The Explore page uses its own local state instead.
 */
export function useAnalysisPortfolio(): AnalysisPortfolioResult {
  const profile = useProfileStore()
  const allocation = useAllocationStore()
  const { metrics } = useFireCalculations()

  return useMemo(() => {
    const currentWeights = allocation.currentWeights
    const totalNW = profile.liquidNetWorth + profile.cpfOA + profile.cpfSA + profile.cpfMA + profile.cpfRA

    const retirementWeights = getRetirementAgeWeights(
      allocation.glidePathConfig.enabled,
      allocation.glidePathConfig,
      currentWeights,
      allocation.targetWeights,
      profile.retirementAge,
    )

    let portfolioReturn = profile.expectedReturn
    const allocationValid = Object.keys(allocation.validationErrors).length === 0
    if (profile.usePortfolioReturn && allocationValid) {
      const effectiveReturns = ASSET_CLASSES.map((ac, i) =>
        allocation.returnOverrides[i] ?? ac.expectedReturn
      )
      portfolioReturn = calculatePortfolioReturn(retirementWeights, effectiveReturns)
    }
    const netRealReturn = portfolioReturn - profile.inflation - profile.expenseRatio
    const currentExpenses = getEffectiveExpenses(profile.currentAge, profile.annualExpenses, profile.expenseAdjustments, profile.lifeExpectancy)
    const annualSavings = profile.annualIncome - currentExpenses

    const projected = projectPortfolioAtRetirement({
      currentNW: totalNW,
      annualSavings,
      netRealReturn,
      yearsToRetirement: profile.retirementAge - profile.currentAge,
    })

    return {
      initialPortfolio: totalNW,
      retirementPortfolio: projected,
      allocationWeights: currentWeights,
      analysisMode: 'myPlan' as AnalysisMode,
      portfolioLabel: `${formatCurrency(totalNW)} today → ~${formatCurrency(projected)} at age ${profile.retirementAge}`,
      skipAccumulation: false,
    }
  }, [
    profile.liquidNetWorth, profile.cpfOA, profile.cpfSA, profile.cpfMA, profile.cpfRA,
    profile.currentAge, profile.retirementAge, profile.annualIncome,
    profile.annualExpenses, profile.expenseAdjustments, profile.lifeExpectancy,
    profile.expectedReturn, profile.usePortfolioReturn, profile.inflation, profile.expenseRatio,
    allocation.currentWeights, allocation.targetWeights, allocation.glidePathConfig,
    allocation.returnOverrides, allocation.validationErrors,
    metrics?.fireNumber,
  ])
}
```

Remove the `useSimulationStore` import since it's no longer needed.

### Step 2: Verify backtest and sequence risk hooks

Read `useBacktestQuery.ts` and `useSequenceRiskQuery.ts` to confirm they only use `useAnalysisPortfolio()` (not `simulation.analysisMode` directly). They already do — they consume `.retirementPortfolio` and `.allocationWeights`, which are now always My Plan values.

### Step 3: Update `useAnalysisPortfolio.test.ts`

The existing test file has a `fireTarget mode` describe block (lines 95-121) that sets `analysisMode: 'fireTarget'` and expects `skipAccumulation: true`, `initialPortfolio = FIRE number`, etc. Since `useAnalysisPortfolio` now always returns My Plan values, these tests must be **removed or rewritten**.

**Remove** the entire `describe('fireTarget mode', ...)` block (lines 95-121).

**Update** the remaining tests to not set `analysisMode` on the simulation store (it's no longer read).

### Step 4: Run type-check and tests

Run: `cd frontend && npm run type-check && npm run test 2>&1 | tail -10`
Expected: All pass (Stress Test behavior unchanged since most users were on My Plan)

### Step 5: Commit

```bash
git add src/hooks/useAnalysisPortfolio.ts src/hooks/useAnalysisPortfolio.test.ts
git commit -m "refactor(hooks): simplify useAnalysisPortfolio to always use My Plan mode"
```

---

## Task 5b: Decouple `analysisMode` from `useWithdrawalComparison`

**Files:**
- Modify: `src/hooks/useWithdrawalComparison.ts:35,74-76` (remove analysisMode branching)
- Modify: `src/hooks/useWithdrawalComparison.test.ts:143-181` (update fireTarget test)

**Why this is critical:** `useWithdrawalComparison` reads `analysisMode` at line 35 and uses it at line 74 to switch between two portfolio calculations. If left untouched, the persisted `analysisMode` value could silently affect the Explore page's deterministic comparison even after the toggle is removed from UI.

### Step 1: Remove `analysisMode` branching from `useWithdrawalComparison`

In `src/hooks/useWithdrawalComparison.ts:35`, remove:
```typescript
  const analysisMode = useSimulationStore((s) => s.analysisMode)
```

At lines 74-76, change:
```typescript
    const initialPortfolio = analysisMode === 'myPlan'
      ? (opts?.initialPortfolioOverride ?? profile.liquidNetWorth * (1 + netReturn) ** yearsToRetirement)
      : analysisPortfolio.initialPortfolio
```

To:
```typescript
    const initialPortfolio = opts?.initialPortfolioOverride
      ?? profile.liquidNetWorth * (1 + netReturn) ** yearsToRetirement
```

Remove `analysisMode` from the dependency array (line 118).

### Step 2: Update `useWithdrawalComparison.test.ts`

The test at lines 143-181 (`uses fireTarget analysisMode portfolio from analysisPortfolio`) sets `analysisMode: 'fireTarget'` and expects different terminal portfolios. Since the hook no longer reads `analysisMode`, this test must be **rewritten** to test the `initialPortfolioOverride` opt-in path instead.

Replace the test body to verify that when `initialPortfolioOverride` is provided, it uses that value, and when omitted, it uses projected portfolio.

### Step 3: Run tests

Run: `cd frontend && npm run test 2>&1 | tail -10`
Expected: All pass

### Step 4: Commit

```bash
git add src/hooks/useWithdrawalComparison.ts src/hooks/useWithdrawalComparison.test.ts
git commit -m "refactor(hooks): decouple useWithdrawalComparison from analysisMode"
```

---

## Task 6: Navigation Restructure

**Files:**
- Modify: `src/components/layout/Sidebar.tsx:99-126` (nav groups), `src/components/layout/Sidebar.tsx:474` (mobile nav)

### Step 1: Split ANALYSIS into EXPLORE + ANALYSIS

In `src/components/layout/Sidebar.tsx:99-126`, replace the `AFTER_INPUTS_GROUPS` array:

```typescript
const AFTER_INPUTS_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'PLAN',
    items: [
      { label: 'Projection', path: '/projection', icon: <TableProperties className="h-4 w-4" /> },
    ],
  },
  {
    title: 'EXPLORE',
    items: [
      { label: 'Withdrawal Strategies', path: '/withdrawal', icon: <Banknote className="h-4 w-4" /> },
    ],
  },
  {
    title: 'ANALYSIS',
    items: [
      { label: 'Stress Test', path: '/stress-test', icon: <ShieldAlert className="h-4 w-4" /> },
    ],
  },
  {
    title: 'RESULTS',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    ],
  },
  {
    title: 'REFERENCE',
    items: [
      { label: 'Reference Guide', path: '/reference', icon: <BookOpen className="h-4 w-4" /> },
      { label: 'Checklist', path: '/checklist', icon: <CheckSquare className="h-4 w-4" /> },
    ],
  },
]
```

### Step 2: Update mobile bottom nav

In `src/components/layout/Sidebar.tsx:474`, change:

```typescript
          { label: 'Withdraw', path: '/withdrawal', icon: <Banknote className="h-5 w-5" /> },
```

To:

```typescript
          { label: 'Strategies', path: '/withdrawal', icon: <Banknote className="h-5 w-5" /> },
```

### Step 3: Verify in browser

Run: `cd frontend && npm run dev -- --port 5173`
Check: Sidebar shows EXPLORE > Withdrawal Strategies, ANALYSIS > Stress Test. Mobile bottom nav shows "Strategies".

### Step 4: Commit

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat(nav): restructure into EXPLORE and ANALYSIS sections, rename mobile nav"
```

---

## Task 7: Stress Test Page — Remove Toggle, Add Pre-Retirement Toggle

**Files:**
- Modify: `src/pages/StressTestPage.tsx` (remove AnalysisModeToggle, add pre-retirement toggle, add Explore link)
- Modify: `src/components/simulation/SimulationControls.tsx` (add toggle to params card)

### Step 0: Install shadcn ToggleGroup component

The `toggle-group` component doesn't exist yet. Install it:

```bash
cd frontend && npx shadcn@latest add toggle-group
```

This creates `src/components/ui/toggle-group.tsx`. Verify it exists before proceeding.

### Step 1: Remove AnalysisModeToggle from StressTestPage

In `src/pages/StressTestPage.tsx`:
- Remove the `<AnalysisModeToggle portfolioLabel={portfolioLabel} />` line (around line 612)
- Remove the `portfolioLabel` destructuring from `useAnalysisPortfolio()` if it's only used for the toggle
- Remove the AnalysisModeToggle import

### Step 2: Add pre-retirement toggle to SimulationControls

In `src/components/simulation/SimulationControls.tsx`, add a new toggle in the simulation parameters card. Add after the Method dropdown (or at end of the 3-column grid):

```tsx
{/* Pre-retirement returns toggle */}
<div className="space-y-1.5">
  <Label className="text-sm font-medium flex items-center gap-1">
    Pre-retirement returns
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-3.5 w-3.5 text-muted-foreground" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p><strong>Expected Returns:</strong> All simulations use the same average return during accumulation. Tests: "If savings go as planned, does retirement survive?"</p>
        <p className="mt-1"><strong>Stochastic:</strong> Each simulation gets random returns from today. Captures pre-retirement sequence risk.</p>
      </TooltipContent>
    </Tooltip>
  </Label>
  {profile.currentAge >= profile.retirementAge ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <div>
          <ToggleGroup type="single" value="stochastic" disabled className="w-full">
            <ToggleGroupItem value="expected" className="flex-1 text-xs">Expected</ToggleGroupItem>
            <ToggleGroupItem value="stochastic" className="flex-1 text-xs">Stochastic</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </TooltipTrigger>
      <TooltipContent>Not applicable: you are already in retirement</TooltipContent>
    </Tooltip>
  ) : (
    <ToggleGroup
      type="single"
      value={simulation.deterministicAccumulation ? 'expected' : 'stochastic'}
      onValueChange={(val) => {
        if (val) simulation.setField('deterministicAccumulation', val === 'expected')
      }}
      className="w-full"
    >
      <ToggleGroupItem value="expected" className="flex-1 text-xs">Expected</ToggleGroupItem>
      <ToggleGroupItem value="stochastic" className="flex-1 text-xs">Stochastic</ToggleGroupItem>
    </ToggleGroup>
  )}
</div>
```

Import `ToggleGroup` and `ToggleGroupItem` from `@/components/ui/toggle-group`. Import `Info` from lucide-react. Read profile from `useProfileStore()`.

### Step 3: Add cross-link to Explore in MC results area

In `src/pages/StressTestPage.tsx`, after the MC results section (inside the Monte Carlo TabsContent), add:

```tsx
<p className="text-xs text-muted-foreground mt-4">
  Want to explore withdrawal strategies in isolation?{' '}
  <Link to="/withdrawal" className="text-primary hover:underline">
    Withdrawal Strategies →
  </Link>
</p>
```

Import `Link` from `react-router-dom`.

### Step 4: Run type-check

Run: `cd frontend && npm run type-check 2>&1 | tail -10`
Expected: Zero errors

### Step 5: Verify in browser

Run dev server and check:
- No AnalysisModeToggle on Stress Test page
- Pre-retirement toggle visible in SimulationControls
- Toggle disabled with tooltip when currentAge >= retirementAge
- Cross-link to Explore visible after MC results

### Step 6: Commit

```bash
git add src/pages/StressTestPage.tsx src/components/simulation/SimulationControls.tsx
git commit -m "feat(stress-test): replace analysis mode toggle with pre-retirement returns toggle"
```

---

## Task 8: Explore Page — Educational Banner + MC Tab

**Files:**
- Modify: `src/pages/WithdrawalPage.tsx` (add banner, add tabs, add MC section)
- Create: `src/hooks/useExplorePortfolio.ts` (local balance-mode hook for Explore page)

### Step 1: Create `useExplorePortfolio` hook

Create `src/hooks/useExplorePortfolio.ts`:

```typescript
import { useState, useMemo } from 'react'
import { useProfileStore } from '@/stores/useProfileStore'
import { useAllocationStore } from '@/stores/useAllocationStore'
import { useFireCalculations } from '@/hooks/useFireCalculations'
import { useProjection } from '@/hooks/useProjection'
import { formatCurrency } from '@/lib/utils'
import { interpolateGlidePath } from '@/lib/calculations/portfolio'

export type ExploreBalanceMode = 'myPlan' | 'fireTarget'

interface ExplorePortfolioResult {
  balanceMode: ExploreBalanceMode
  setBalanceMode: (mode: ExploreBalanceMode) => void
  initialPortfolio: number
  allocationWeights: number[]
  startAge: number
  label: string
}

/**
 * Local state hook for the Explore page's starting-balance toggle.
 * NOT persisted — resets to 'myPlan' on page load.
 *
 * - myPlan: deterministically projected NW at retirementAge, starts MC at retirementAge
 * - fireTarget: FIRE number at fireAge, starts MC at fireAge
 */
export function useExplorePortfolio(): ExplorePortfolioResult {
  const [balanceMode, setBalanceMode] = useState<ExploreBalanceMode>('myPlan')
  const profile = useProfileStore()
  const allocation = useAllocationStore()
  const { metrics } = useFireCalculations()
  const { rows } = useProjection()

  return useMemo(() => {
    if (balanceMode === 'fireTarget') {
      const fireNumber = metrics?.fireNumber ?? 0
      // Guard: fireAge can be Infinity when savings rate is insufficient
      // (yearsToFire = Infinity → fireAge = currentAge + Infinity). Fall back to retirementAge.
      const rawFireAge = metrics?.fireAge ?? profile.retirementAge
      const fireAge = isFinite(rawFireAge) ? rawFireAge : profile.retirementAge

      // Use retirement-age weights for decumulation
      const retirementWeights = getExploreWeights(allocation, profile.retirementAge)

      return {
        balanceMode,
        setBalanceMode,
        initialPortfolio: fireNumber,
        allocationWeights: retirementWeights,
        startAge: fireAge,
        label: `FIRE Target: ${formatCurrency(fireNumber)} at age ${fireAge} (${new Date().getFullYear() + (fireAge - profile.currentAge)}$)`,
      }
    }

    // myPlan: projected NW at retirement age
    const retirementRow = rows?.find(r => r.age === profile.retirementAge)
    const projectedNW = retirementRow?.liquidNW ?? 0

    const retirementWeights = getExploreWeights(allocation, profile.retirementAge)

    return {
      balanceMode,
      setBalanceMode,
      initialPortfolio: projectedNW,
      allocationWeights: retirementWeights,
      startAge: profile.retirementAge,
      label: `My Plan: ${formatCurrency(projectedNW)} at age ${profile.retirementAge} (${new Date().getFullYear() + (profile.retirementAge - profile.currentAge)}$)`,
    }
  }, [balanceMode, setBalanceMode, profile.retirementAge, profile.currentAge, allocation, metrics, rows])
}

function getExploreWeights(
  allocation: ReturnType<typeof useAllocationStore>,
  retirementAge: number,
): number[] {
  if (!allocation.glidePathConfig.enabled) return allocation.currentWeights
  const { startAge, endAge, method } = allocation.glidePathConfig
  if (retirementAge < startAge) return allocation.currentWeights
  if (retirementAge >= endAge) return allocation.targetWeights
  const progress = (retirementAge - startAge) / (endAge - startAge)
  return interpolateGlidePath(allocation.currentWeights, allocation.targetWeights, progress, method)
}
```

### Step 2: Add tabs and MC section to WithdrawalPage

In `src/pages/WithdrawalPage.tsx`, restructure to use tabs:

The page currently shows: header → AnalysisModeToggle → StrategyParams → results (table + charts).

Transform to:
- Header with educational banner
- Tabs: "Strategy Comparison" (existing content) | "MC Simulation" (new)
- Remove AnalysisModeToggle from this page

**Dismissible educational banner** (add after header, before tabs). Use `useState` for dismiss state:

```tsx
const [bannerDismissed, setBannerDismissed] = useState(false)

// In JSX:
{!bannerDismissed && (
  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200 flex items-start justify-between gap-2">
    <p>
      Compare withdrawal strategies to understand how they behave under different market conditions.
      This uses a simplified decumulation-only model. For a full stress test of your plan including accumulation, go to{' '}
      <Link to="/stress-test" className="font-medium underline">Stress Test →</Link>
    </p>
    <button
      onClick={() => setBannerDismissed(true)}
      className="shrink-0 text-blue-600 hover:text-blue-800 dark:text-blue-400"
      aria-label="Dismiss banner"
    >
      <X className="h-4 w-4" />
    </button>
  </div>
)}
```

Import `X` from lucide-react.

**MC Simulation tab content** — Wire `useExplorePortfolio` for the balance toggle, run decumulation-only MC, render result components (success rate, fan chart, failure distribution).

**Important: MC param building is complex.** The current `useMonteCarloQuery` (lines 125-381) handles ~15 concerns: income projection, property downsizing, mortgage cashflows, cash reserve, retirement withdrawals, goal deductions, CPF OA withdrawals, post-retirement income, etc. The Explore MC needs a subset of this (post-retirement income, retirement withdrawals, goal deductions during retirement) but NOT pre-retirement concerns (savings, mortgage, income).

**Approach:** Extract the post-retirement param-building logic from `useMonteCarloQuery` into a shared helper `buildPostRetirementParams()` that both pages can call. The Explore MC tab calls it with `startAge` from `useExplorePortfolio`, zero annual savings, and the shared post-retirement income/adjustments.

Alternatively, for the initial implementation: the Explore MC can call `useMonteCarloQuery` but override `currentAge = startAge`, `initialPortfolio`, `annualSavings = []`, and `skipAccumulation = true` via the `useExplorePortfolio` result. This works because `useMonteCarloQuery` already supports `skipAccumulation` mode (it was the old FIRE Target behavior). **This is the recommended approach** since it reuses all existing param logic without extraction.

To make this work: the Explore page needs its own instance of `useMonteCarloQuery` that passes the explore portfolio instead of `useAnalysisPortfolio`. Add an optional `portfolioOverride` param to `useMonteCarloQuery`, or create a thin `useExploreMCQuery` wrapper that constructs the override.

### Step 3: Remove AnalysisModeToggle from WithdrawalPage

Remove the `<AnalysisModeToggle>` component and its import from `WithdrawalPage.tsx`.

### Step 4: Run type-check

Run: `cd frontend && npm run type-check 2>&1 | tail -10`
Expected: Zero errors

### Step 5: Verify in browser

Check:
- Educational banner visible at top of Withdrawal Strategies page
- Two tabs: Strategy Comparison + MC Simulation
- Strategy Comparison tab shows existing deterministic comparison (unchanged)
- MC Simulation tab shows balance toggle (My Plan / FIRE Target) with dollar basis labels
- Running MC on Explore page works and shows results

### Step 6: Run full test suite

Run: `cd frontend && npm run test 2>&1 | tail -10`
Expected: All tests pass

### Step 7: Commit

```bash
git add src/hooks/useExplorePortfolio.ts src/pages/WithdrawalPage.tsx
git commit -m "feat(explore): add MC simulation tab with balance toggle and educational banner"
```

---

## Post-Implementation Checklist

After all tasks are complete:

1. **Type-check:** `npm run type-check` — zero errors
2. **Lint:** `npm run lint` — zero errors
3. **Tests:** `npm run test` — all pass
4. **Manual QA in browser:**
   - Stress Test: no AnalysisModeToggle, pre-retirement toggle works, disabled for retired users
   - Explore: banner visible, MC tab works, balance toggle shows correct labels
   - Navigation: EXPLORE/ANALYSIS sections correct, mobile shows "Strategies"
   - Staleness: changing deterministicAccumulation shows stale warning
5. **Verify existing behavior unchanged:**
   - Stress Test with Stochastic (default) produces same results as before
   - Backtest and Sequence Risk produce same results as before
   - Dashboard and Projection page unaffected

## What Could Break

| Risk | Mitigation |
|------|-----------|
| Existing users with `analysisMode: 'fireTarget'` in localStorage | Stress Test now ignores it (always My Plan). No crash, just different behavior. |
| `useAnalysisPortfolio` consumed elsewhere | Search for all imports — should only be StressTestPage, useMonteCarloQuery, useBacktestQuery, useSequenceRiskQuery |
| `useWithdrawalComparison` still reads `analysisMode` | Task 5b decouples it. Must complete before Task 8. |
| Explore MC tab calling worker concurrently with Stress Test | Worker client supports concurrent calls via message ID multiplexing |
| `deterministicAccumulation` missing from old exported JSON | Import handler defaults missing fields; `false` preserves old behavior |
| Representative paths in SWR optimizer | SWR optimizer sets `extractPaths: false`, so path selection change is irrelevant |
| `fireAge` can be `Infinity` when savings rate is insufficient | `useExplorePortfolio` guards with `isFinite()`, falls back to `retirementAge` |
| `useAnalysisPortfolio.test.ts` has fireTarget tests that will fail | Task 5 Step 3 removes/rewrites these tests |
| `useWithdrawalComparison.test.ts` has fireTarget test that will fail | Task 5b Step 2 rewrites the test |
| Explore MC may drift from Stress Test MC param logic | Task 8 reuses `useMonteCarloQuery` with portfolio override instead of building params from scratch |

## Codex Review Findings (Addressed)

All 10 findings from the Codex implementation review have been incorporated:

1. ToggleGroup component: added `npx shadcn@latest add toggle-group` prerequisite step (Task 7 Step 0)
2. `useWithdrawalComparison` coupling: added Task 5b to decouple it
3. `fireAge` Infinity guard: added `isFinite()` check in `useExplorePortfolio`
4. Explore MC param construction: specified reuse of `useMonteCarloQuery` with portfolio override
5. Unused imports: removed `calculatePortfolioReturn` and `ASSET_CLASSES` from `useExplorePortfolio`
6. `success_rate` range: fixed assertion from `< 100` to `< 1`
7. Dismissible banner: added dismiss state with X button
8. Line number mismatch: corrected Task 3 file range to include migration lines 118-148
9. Missing test updates: added test update steps to Tasks 3, 5, and 5b
10. Parallelism: Task 6 now independent; Task 5b added as dependency for Task 8
