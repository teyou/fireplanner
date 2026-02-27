# Withdrawal Basis Toggle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a toggle that lets users switch between expense-driven and rate-driven withdrawal computation across all simulation engines and the deterministic projection, fixing the bug where SWR changes have zero effect on results.

**Architecture:** New `withdrawalBasis: 'expenses' | 'rate'` field in `useSimulationStore`, read by all 4 hooks (useProjection, useMonteCarloQuery, useBacktestQuery, useSequenceRiskQuery), passed to all 4 engines. A shared `WithdrawalBasisToggle` component is placed inline on each page. When `'rate'`, engines use `portfolio * strategyRate`; when `'expenses'` (default), current behavior is preserved.

**Tech Stack:** React 19, TypeScript 5.9, Zustand 5, Vite 7, Vitest

**Design doc:** `docs/plans/2026-02-27-withdrawal-basis-toggle-design.md`

**Review notes (Codex):** 8 findings addressed in this revision:
1. [Critical] Task 5 rate-mode math now matches MC/SR income-offset pattern
2. [High] BacktestDrillDown threading added to Task 3
3. [High] Heatmap semantics documented (always rate-driven by design)
4. [High] Changelog schema fixed (category not type, section-* IDs)
5. [Medium] Mitigation sizing caveat documented (intentionally expense-based)
6. [Medium] withdrawalBasis is required (not optional) on engine params
7. [Medium] Hint only triggers for expense-anchored strategies
8. [Medium] v5 migration tests and hook stale-detection tests added

**Known limitation (intentional):** Cash-bucket sizing in MC (line 405) and SR mitigation sizing
use `annualExpensesAtRetirement` regardless of `withdrawalBasis`. This is correct: the cash
bucket covers N months of *living expenses* as a liquidity buffer — it should not change just
because the user is testing a different withdrawal rate. If rate-driven users want to test
bucket sizing, that's a separate feature.

---

## Task 1: Add type and store field

**Files:**
- Modify: `frontend/src/lib/types.ts:12` (add type), `:677` (add to SimulationState)
- Modify: `frontend/src/stores/useSimulationStore.ts:26,49-50,117-143`

**Step 1: Add `WithdrawalBasis` type to types.ts**

In `frontend/src/lib/types.ts`, after line 12 (`export type AnalysisMode = 'myPlan' | 'fireTarget'`):

```typescript
export type WithdrawalBasis = 'expenses' | 'rate'
```

In the `SimulationState` interface (line ~677), add after `analysisMode`:

```typescript
withdrawalBasis: WithdrawalBasis
```

**Step 2: Add field to simulation store**

In `frontend/src/stores/useSimulationStore.ts`:

Add `'withdrawalBasis'` to `SIMULATION_DATA_KEYS` array (line 26):
```typescript
const SIMULATION_DATA_KEYS = [
  'mcMethod', 'selectedStrategy', 'strategyParams', 'nSimulations', 'analysisMode',
  'lastMCSuccessRate', 'lastBacktestSuccessRate', 'withdrawalBasis',
] as const
```

Add to `DEFAULT_SIMULATION` (line ~49):
```typescript
withdrawalBasis: 'expenses',
```

Bump store version from `4` to `5` (line 117) and add migration (after existing v4 block):
```typescript
if (version < 5) {
  state.withdrawalBasis ??= 'expenses'
}
```

**Step 3: Add v5 migration test**

Check if simulation store migration tests exist (search for `fireplanner-simulation` or
`useSimulationStore` in test files). If they do, add a test for v4 → v5 migration:

```typescript
it('migrates v4 state to v5 by adding withdrawalBasis', () => {
  const v4State = { /* valid v4 state without withdrawalBasis */ }
  const migrated = migrate(v4State, 4)
  expect(migrated.withdrawalBasis).toBe('expenses')
})
```

If no migration tests exist, create them in a new test file or add to the nearest
simulation store test file.

**Step 4: Run type-check**

Run: `cd frontend && npm run type-check`
Expected: PASS (new field is provided in defaults and migrated for existing users)

**Step 5: Commit**

```bash
git add frontend/src/lib/types.ts frontend/src/stores/useSimulationStore.ts
git commit -m "feat: add withdrawalBasis field to simulation store

Adds 'expenses' | 'rate' toggle state with localStorage migration.
Default 'expenses' preserves current behavior for existing users."
```

---

## Task 2: Update Monte Carlo engine

**Files:**
- Modify: `frontend/src/lib/simulation/monteCarlo.ts:49,305,390-401`
- Modify: `frontend/src/hooks/useMonteCarloQuery.ts:374`
- Test: `frontend/src/lib/simulation/monteCarlo.test.ts`

**Step 1: Write the failing test**

In `frontend/src/lib/simulation/monteCarlo.test.ts`, add a new test:

```typescript
it('uses portfolio × SWR when withdrawalBasis is rate', () => {
  const params = buildTestParams({
    annualExpensesAtRetirement: 48000,
    withdrawalBasis: 'rate' as const,
    // constant_dollar with swr = 0.04, initialPortfolio should be used
  })
  const result = runMonteCarlo(params)
  // With rate-driven: initial withdrawal = portfolio * 0.04
  // With expense-driven: initial withdrawal = 48000
  // These produce different success rates for the same portfolio
  expect(result).toBeDefined()
  // The key assertion: rate-driven with 4% SWR on a large portfolio
  // should produce different results than expense-driven with $48K expenses
})
```

Note: The exact test structure depends on the existing test helpers. Read the existing test file to match patterns.

**Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/lib/simulation/monteCarlo.test.ts --reporter=verbose`
Expected: FAIL — `withdrawalBasis` not recognized in params type

**Step 3: Add `withdrawalBasis` to MonteCarloEngineParams**

In `frontend/src/lib/simulation/monteCarlo.ts`, add to the interface after line 48 (`retirementMitigation`):

```typescript
withdrawalBasis: 'expenses' | 'rate'
```

Update the expense override block (lines 390-401). Replace:

```typescript
if (annualExpensesAtRetirement > 0) {
  initialWithdrawalAmount = annualExpensesAtRetirement
} else {
```

With:

```typescript
if (annualExpensesAtRetirement > 0 && params.withdrawalBasis !== 'rate') {
  initialWithdrawalAmount = annualExpensesAtRetirement
} else {
```

**Step 4: Thread `withdrawalBasis` through useMonteCarloQuery**

In `frontend/src/hooks/useMonteCarloQuery.ts`, add to the params object (after `annualExpensesAtRetirement` around line 374):

```typescript
withdrawalBasis: simulation.withdrawalBasis,
```

Also add `simulation.withdrawalBasis` to the `currentParamsSig` useMemo (for stale detection).

**Step 5: Run tests**

Run: `cd frontend && npx vitest run src/lib/simulation/monteCarlo.test.ts --reporter=verbose`
Expected: PASS

**Step 6: Commit**

```bash
git add frontend/src/lib/simulation/monteCarlo.ts frontend/src/hooks/useMonteCarloQuery.ts frontend/src/lib/simulation/monteCarlo.test.ts
git commit -m "feat: Monte Carlo respects withdrawalBasis toggle

When withdrawalBasis is 'rate', uses portfolio × SWR instead of
annualExpensesAtRetirement for the initial withdrawal amount."
```

---

## Task 3: Update Backtest engine

**Files:**
- Modify: `frontend/src/lib/simulation/backtest.ts:38,158,163,266,309,458`
- Modify: `frontend/src/hooks/useBacktestQuery.ts:12-19,41-55,133`
- Test: `frontend/src/lib/simulation/backtest.test.ts`

**Step 1: Write the failing test**

Add a test in `frontend/src/lib/simulation/backtest.test.ts` that passes `withdrawalBasis: 'rate'` and verifies the initial withdrawal is portfolio-based, not expense-based.

**Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/lib/simulation/backtest.test.ts --reporter=verbose`
Expected: FAIL

**Step 3: Add `withdrawalBasis` to BacktestEngineParams**

In `frontend/src/lib/simulation/backtest.ts`, add to interface after line 38:

```typescript
withdrawalBasis: 'expenses' | 'rate'
```

Update `runSingleWindow` (line 147-158): add `withdrawalBasis: 'expenses' | 'rate' = 'expenses'` as a new positional parameter after `annualExpensesAtRetirement`.

Update condition at line 163:
```typescript
const initialWithdrawal = annualExpensesAtRetirement > 0 && withdrawalBasis !== 'rate'
  ? annualExpensesAtRetirement
  : initialPortfolio * swr
```

Update `runDetailedWindow` — the condition at line 309:
```typescript
const initialWithdrawal = expenses > 0 && params.withdrawalBasis !== 'rate'
  ? expenses
  : initialPortfolio * swr
```

Thread `withdrawalBasis` through the `runSingleWindow` call site at line 458:
```typescript
annualExpensesAtRetirement,
params.withdrawalBasis,
```

**Step 4: Thread through useBacktestQuery**

In `frontend/src/hooks/useBacktestQuery.ts`, add `withdrawalBasis` to the `buildParams` return object (after `annualExpensesAtRetirement`):

```typescript
withdrawalBasis: simulation.withdrawalBasis,
```

The hook needs to read from `useSimulationStore`. If not already imported, add:
```typescript
const simulation = useSimulationStore()
```

Also add to stale detection signature.

**Step 5: Thread through BacktestDrillDown**

In `frontend/src/components/backtest/BacktestDrillDown.tsx`, the `buildParams` callback (line 69-80)
constructs its own `BacktestEngineParams` independently. Add `withdrawalBasis` to it:

```typescript
const simulation = useSimulationStore()
// ...
const buildParams = useCallback((): BacktestEngineParams => ({
  // ... existing fields ...
  withdrawalBasis: simulation.withdrawalBasis,
}), [/* ... existing deps ..., simulation.withdrawalBasis */])
```

Import `useSimulationStore` if not already imported. Without this, drill-down charts won't
match base backtest results after toggle changes.

**Step 6: Address heatmap semantics**

The `generateHeatmap` function in `backtest.ts` (line 542) already forces
`annualExpensesAtRetirement: undefined` to sweep SWR values across the grid. This means
the heatmap is inherently rate-driven regardless of the toggle — each cell tests a different
SWR × duration combination by design. No code change needed, but add a comment:

```typescript
// Heatmap is always rate-driven: each cell tests a specific SWR × duration
// regardless of withdrawalBasis toggle, since annualExpensesAtRetirement is undefined.
```

**Step 7: Run tests**

Run: `cd frontend && npx vitest run src/lib/simulation/backtest.test.ts --reporter=verbose`
Expected: PASS

**Step 8: Commit**

```bash
git add frontend/src/lib/simulation/backtest.ts frontend/src/hooks/useBacktestQuery.ts frontend/src/components/backtest/BacktestDrillDown.tsx frontend/src/lib/simulation/backtest.test.ts
git commit -m "feat: Backtest respects withdrawalBasis toggle

runSingleWindow, runDetailedWindow, and BacktestDrillDown all thread
withdrawalBasis. Heatmap remains always rate-driven by design."
```

---

## Task 4: Update Sequence Risk engine

**Files:**
- Modify: `frontend/src/lib/simulation/sequenceRisk.ts:48,114-115,158,301-344,399-442`
- Modify: `frontend/src/hooks/useSequenceRiskQuery.ts:254`
- Test: `frontend/src/lib/simulation/sequenceRisk.test.ts`

**Step 1: Write the failing test**

Add test in `frontend/src/lib/simulation/sequenceRisk.test.ts` that passes `withdrawalBasis: 'rate'` and verifies rate-driven behavior.

**Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/lib/simulation/sequenceRisk.test.ts --reporter=verbose`
Expected: FAIL

**Step 3: Add `withdrawalBasis` to SequenceRiskEngineParams**

In `frontend/src/lib/simulation/sequenceRisk.ts`, add to interface after line 48:

```typescript
withdrawalBasis: 'expenses' | 'rate'
```

Add `withdrawalBasis` parameter to `runSingleScenario` (after `portfolioInjections` at line 115).
Note: this is a positional function param, not an interface field, so use standard param syntax:

```typescript
withdrawalBasis: 'expenses' | 'rate' = 'expenses',
```

Update condition at line 158:
```typescript
const initialWithdrawalAmount = expenses > 0 && withdrawalBasis !== 'rate'
  ? expenses
  : initialPortfolio * swr
```

Thread `withdrawalBasis` through all 4 call sites of `runSingleScenario` (lines ~301, ~324, ~399, ~422). Each call adds `withdrawalBasis` as the last argument, reading from `params.withdrawalBasis`.

**Step 4: Thread through useSequenceRiskQuery**

In `frontend/src/hooks/useSequenceRiskQuery.ts`, add `withdrawalBasis` to the params object (after `annualExpensesAtRetirement` at line 254):

```typescript
withdrawalBasis: simulation.withdrawalBasis,
```

Import `useSimulationStore` and read `withdrawalBasis`:
```typescript
const simulation = useSimulationStore()
```

Add to `currentParamsSig` for stale detection.

**Step 5: Run tests**

Run: `cd frontend && npx vitest run src/lib/simulation/sequenceRisk.test.ts --reporter=verbose`
Expected: PASS

**Step 6: Commit**

```bash
git add frontend/src/lib/simulation/sequenceRisk.ts frontend/src/hooks/useSequenceRiskQuery.ts frontend/src/lib/simulation/sequenceRisk.test.ts
git commit -m "feat: Sequence Risk respects withdrawalBasis toggle

All 4 runSingleScenario call sites now thread withdrawalBasis
through to the initial withdrawal computation."
```

---

## Task 5: Update Projection engine

**Files:**
- Modify: `frontend/src/lib/calculations/projection.ts:94,548-556`
- Modify: `frontend/src/hooks/useProjection.ts:92-93,124,153`
- Test: `frontend/src/lib/calculations/projection.test.ts`

**Step 1: Write the failing tests**

Add tests in `frontend/src/lib/calculations/projection.test.ts` that pass `withdrawalBasis: 'rate'` in ProjectionParams:

Test A — Basic rate-driven behavior:
- Verifies Terminal NW differs from expense-driven mode
- Verifies `withdrawalAmount` in retirement rows uses the strategy withdrawal, not the expense gap

Test B — High income, low expense scenario in rate mode:
- Set postRetirementIncome significantly higher than expenses (e.g. $60K income, $30K expenses)
- Use a strategy with 5% SWR ($50K withdrawal on $1M portfolio)
- In rate mode: net draw = max(0, $50K - $60K) = $0, surplus $10K reinvested
- In expense mode: expense gap = max(0, $30K - $60K) = $0, surplus $30K reinvested
- Verify rate-mode Terminal NW is lower than expense-mode (less surplus reinvested)
- This validates that income offsets strategy withdrawal correctly in rate mode

Test C — Rate-driven income offset consistency with MC:
- Same inputs as Test A, but compute expected initial net withdrawal manually:
  `max(0, portfolio * swr - postRetirementIncome)`
- Verify the first retirement row's withdrawalAmount matches this formula
- This validates projection matches MC/SR income offset semantics

**Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/lib/calculations/projection.test.ts --reporter=verbose`
Expected: FAIL

**Step 3: Add `withdrawalBasis` to ProjectionParams**

In `frontend/src/lib/calculations/projection.ts`, add to interface after line 94 (`cpfLifePlan`):

```typescript
withdrawalBasis: 'expenses' | 'rate'
```

Update the `actualDraw` computation (lines 548-556). Replace:

```typescript
const expenseGap = Math.max(0, inflationAdjustedExpenses - postRetirementIncome)
const actualDraw = Math.min(expenseGap, startLiquidNW)
const surplusIncome = Math.max(0, postRetirementIncome - inflationAdjustedExpenses)
```

With:

```typescript
const expenseGap = Math.max(0, inflationAdjustedExpenses - postRetirementIncome)
let actualDraw: number
let surplusIncome: number

if (params.withdrawalBasis === 'rate') {
  // Rate-driven: income offsets strategy withdrawal (matching MC/SR engines).
  // MC: netWithdrawal = max(0, withdrawal - income)  (monteCarlo.ts:444)
  // SR: netWithdrawal = max(0, (withdrawal + oneTime) - income)  (sequenceRisk.ts:201)
  // Projection mirrors this: draw = max(0, strategyWithdrawal - income).
  const netStrategyDraw = Math.max(0, strategyWithdrawal - postRetirementIncome)
  actualDraw = Math.min(netStrategyDraw, startLiquidNW)
  surplusIncome = Math.max(0, postRetirementIncome - strategyWithdrawal)
} else {
  // Expense-driven (default): withdraw what you need to spend
  actualDraw = Math.min(expenseGap, startLiquidNW)
  surplusIncome = Math.max(0, postRetirementIncome - inflationAdjustedExpenses)
}
```

Note: `strategyWithdrawal` is computed just above this block (lines 511-520), so it's available.

**Why income offsets the withdrawal (not ignored):** MC and SR engines compute
`netWithdrawal = max(0, withdrawal - income)` — post-retirement income reduces the
portfolio draw. The projection must match this so results are consistent across pages.
If strategy withdrawal is $40K and income is $60K, net draw is $0 and surplus $20K
is reinvested. This is materially different from ignoring income entirely.

**Step 4: Thread through useProjection**

In `frontend/src/hooks/useProjection.ts`, add to the projectionParams object (after `strategyParams` at line 93):

```typescript
withdrawalBasis: simulation.withdrawalBasis,
```

Add `simulation.withdrawalBasis` to the useMemo dependency array (after `simulation.strategyParams` at line 153).

**Step 5: Run tests**

Run: `cd frontend && npx vitest run src/lib/calculations/projection.test.ts --reporter=verbose`
Expected: PASS

Run: `cd frontend && npm run test`
Expected: ALL PASS (check no regressions)

**Step 6: Commit**

```bash
git add frontend/src/lib/calculations/projection.ts frontend/src/hooks/useProjection.ts frontend/src/lib/calculations/projection.test.ts
git commit -m "feat: Projection respects withdrawalBasis toggle

When 'rate', actualDraw uses strategyWithdrawal instead of expenseGap.
Terminal NW and Depleted Age now respond to SWR/strategy changes."
```

---

## Task 6: Create WithdrawalBasisToggle component

**Files:**
- Create: `frontend/src/components/shared/WithdrawalBasisToggle.tsx`

**Step 1: Create the toggle component**

Create `frontend/src/components/shared/WithdrawalBasisToggle.tsx`:

```typescript
import { useSimulationStore } from '@/stores/useSimulationStore'
import type { WithdrawalBasis } from '@/lib/types'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const MODES: { value: WithdrawalBasis; label: string; tooltip: string }[] = [
  {
    value: 'expenses',
    label: 'My Expenses',
    tooltip: 'Withdrawals match your planned annual expenses, adjusted for inflation. Tests whether your portfolio can sustain your actual spending.',
  },
  {
    value: 'rate',
    label: 'Custom Rate',
    tooltip: 'Withdrawals based on portfolio × withdrawal rate (e.g. the 4% rule). Tests whether a specific withdrawal rate is sustainable.',
  },
]

export function WithdrawalBasisToggle() {
  const withdrawalBasis = useSimulationStore((s) => s.withdrawalBasis)
  const setField = useSimulationStore((s) => s.setField)

  return (
    <TooltipProvider delayDuration={200}>
      <div className="inline-flex rounded-lg border bg-muted p-0.5">
        {MODES.map((mode) => (
          <Tooltip key={mode.value}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setField('withdrawalBasis', mode.value)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  withdrawalBasis === mode.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {mode.label}
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">{mode.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/shared/WithdrawalBasisToggle.tsx
git commit -m "feat: add WithdrawalBasisToggle component

Pill-shaped segmented control matching AnalysisModeToggle pattern.
Reads/writes withdrawalBasis from simulation store."
```

---

## Task 7: Place toggle on all 4 pages

**Files:**
- Modify: `frontend/src/components/simulation/SimulationControls.tsx:111`
- Modify: `frontend/src/components/backtest/BacktestControls.tsx:~153`
- Modify: `frontend/src/pages/StressTestPage.tsx:~453` (SequenceRiskTab)
- Modify: `frontend/src/pages/ProjectionPage.tsx` (near strategy dropdown)

**Step 1: Add toggle to SimulationControls (Monte Carlo tab)**

In `frontend/src/components/simulation/SimulationControls.tsx`, add import:

```typescript
import { WithdrawalBasisToggle } from '@/components/shared/WithdrawalBasisToggle'
```

After `<StrategyParams />` (line 111), add:

```tsx
<WithdrawalBasisToggle />
```

**Step 2: Add toggle to BacktestControls**

In `frontend/src/components/backtest/BacktestControls.tsx`, add the same import and place `<WithdrawalBasisToggle />` after the strategy params section (before the Run Heatmap button area).

**Step 3: Add toggle to SequenceRiskTab**

In `frontend/src/pages/StressTestPage.tsx`, inside `SequenceRiskTab()`, add import at the top of the file and place `<WithdrawalBasisToggle />` inside the Card content area before the Run button (around line 453).

**Step 4: Add toggle to ProjectionPage**

In `frontend/src/pages/ProjectionPage.tsx`, add the import and place the toggle near the withdrawal strategy dropdown selector. Look for the `<Select>` that controls `simulation.selectedStrategy` and place the toggle adjacent to it.

**Step 5: Run type-check and visual verification**

Run: `cd frontend && npm run type-check`
Expected: PASS

Start dev server and visually verify toggle appears on all 4 pages:
Run: `cd frontend && npm run dev -- --port 5173`

**Step 6: Commit**

```bash
git add frontend/src/components/simulation/SimulationControls.tsx frontend/src/components/backtest/BacktestControls.tsx frontend/src/pages/StressTestPage.tsx frontend/src/pages/ProjectionPage.tsx
git commit -m "feat: place WithdrawalBasisToggle on all 4 pages

Toggle appears inline near relevant controls:
- Monte Carlo: below strategy params
- Backtest: after strategy controls
- Sequence Risk: above Run button
- Projection: near strategy dropdown"
```

---

## Task 8: Add contextual hint when SWR changes in expense mode

**Files:**
- Modify: `frontend/src/components/simulation/SimulationControls.tsx`

**Step 1: Add a one-time hint**

In `SimulationControls.tsx`, in the `StrategyParams` component, detect when the user changes SWR while `withdrawalBasis === 'expenses'` and show a dismissible inline hint:

```tsx
const withdrawalBasis = useSimulationStore((s) => s.withdrawalBasis)
const [showHint, setShowHint] = useState(false)

// Only show hint for strategies where the toggle has a meaningful effect.
// Dynamic strategies (VPW, one_over_n, hebeler_autopilot) compute withdrawals
// from portfolio size / remaining years, so the toggle has little/no impact.
const EXPENSE_ANCHORED_FIELDS = new Set(['swr', 'initialRate', 'targetRate', 'rate', 'baseRate'])

const setParam = (field: string, value: number) => {
  // existing logic...
  if (withdrawalBasis === 'expenses' && EXPENSE_ANCHORED_FIELDS.has(field)) {
    setShowHint(true)
  }
}
```

Below the strategy params grid, conditionally render:

```tsx
{showHint && withdrawalBasis === 'expenses' && (
  <p className="text-xs text-muted-foreground">
    Switch to <button className="underline font-medium" onClick={() => { simulation.setField('withdrawalBasis', 'rate'); setShowHint(false) }}>Custom Rate</button> to test different withdrawal rates.
    <button className="ml-1 text-muted-foreground/60 hover:text-muted-foreground" onClick={() => setShowHint(false)}>✕</button>
  </p>
)}
```

**Step 2: Commit**

```bash
git add frontend/src/components/simulation/SimulationControls.tsx
git commit -m "feat: show contextual hint when SWR changed in expense mode

Helps users discover the Custom Rate toggle when they adjust SWR
parameters that would otherwise have no effect."
```

---

## Task 9: Full test suite, stale-detection tests, and type-check

**Files:**
- All test files
- Hook test files (if they exist) for stale detection coverage

**Step 1: Verify withdrawalBasis is in stale-detection signatures**

Grep all hooks for `currentParamsSig` or equivalent stale detection and confirm
`withdrawalBasis` is included in each:
- `useMonteCarloQuery.ts` — `currentParamsSig` useMemo
- `useBacktestQuery.ts` — stale detection signature
- `useSequenceRiskQuery.ts` — `currentParamsSig` useMemo
- `useProjection.ts` — useMemo dependency array

If any hook is missing `withdrawalBasis` in its signature, add it. This ensures
toggling the mode marks existing results as stale.

**Step 2: Run full type-check**

Run: `cd frontend && npm run type-check`
Expected: Zero errors. Because `withdrawalBasis` is **required** (not optional) on engine
params, any missed call site will fail at compile time.

**Step 3: Run full test suite**

Run: `cd frontend && npm run test`
Expected: ALL PASS

**Step 4: Run lint**

Run: `cd frontend && npm run lint`
Expected: PASS

**Step 5: Fix any issues found**

If any tests fail, investigate and fix. Existing tests should pass unchanged because the
default `withdrawalBasis` is `'expenses'` which preserves current behavior. However, since
`withdrawalBasis` is required on engine params, existing test helpers that build params may
need `withdrawalBasis: 'expenses'` added explicitly.

**Step 6: Commit any fixes**

```bash
git commit -m "fix: address test/lint issues from withdrawal basis toggle"
```

---

## Task 10: Update changelog

**Files:**
- Modify: `frontend/src/lib/data/changelog.ts`

**Step 1: Add changelog entry**

Add a new entry to `frontend/src/lib/data/changelog.ts` describing the feature:

```typescript
{
  date: '2026-02-27',
  title: 'Withdrawal Basis Toggle',
  description: 'New toggle on all simulation and projection pages: choose between "My Expenses" (withdrawals match your planned spending) or "Custom Rate" (withdrawals based on portfolio × strategy rate, e.g. the 4% rule). Previously, changing SWR had no effect on results.',
  category: 'feature' as const,
  affectedSections: ['section-stress-test', 'section-projection'],
},
```

**Step 2: Commit**

```bash
git add frontend/src/lib/data/changelog.ts
git commit -m "docs: add changelog entry for withdrawal basis toggle"
```
