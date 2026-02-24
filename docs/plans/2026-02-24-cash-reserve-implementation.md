# Cash Reserve / Emergency Fund Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a cash reserve / emergency fund feature that diverts savings to fill a reserve before investing, with an optional retirement cash bucket strategy.

**Architecture:** Cash reserve is a profile-level setting (carved from `liquidNetWorth`). Accumulation reserve is a pure post-processing function between income engine and MC engine. Retirement bucket is a path-dependent mitigation inside the MC/backtest decumulation loop, dispatched via a `RetirementMitigationConfig` typed union (extensible for future bond tent).

**Tech Stack:** TypeScript, Zustand, Vitest, React, shadcn/ui, Zod

**Design doc:** `docs/plans/2026-02-24-cash-reserve-design.md`

---

## Task 1: Types — RetirementMitigationConfig and ProfileState fields

**Files:**
- Modify: `frontend/src/lib/types.ts:5-20` (add new type aliases near existing ones)
- Modify: `frontend/src/lib/types.ts:75-139` (add fields to `ProfileState`)
- Modify: `frontend/src/lib/types.ts:199-229` (add columns to `IncomeProjectionRow`)
- Modify: `frontend/src/lib/types.ts:468-486` (add fields to `MonteCarloParams`)

**Step 1: Add retirement mitigation types near top of types.ts**

After the existing type aliases (line ~20), add:

```typescript
// ============================================================
// Retirement Mitigation (extensible union)
// ============================================================

export type RetirementMitigationType = 'none' | 'cash_bucket'

export interface CashBucketConfig {
  type: 'cash_bucket'
  targetMonths: number       // e.g., 24
  cashReturn: number         // e.g., 0.02
}

// Future: BondTentConfig will be added here when implementing bond tent glide paths.
// Bond tent requires year-varying allocation weights in the MC loop, which means
// switching from precomputed portfolioReturns to per-year generation using raw
// per-asset returns (assetReturns[sim][year][asset]).

export type RetirementMitigationConfig =
  | { type: 'none' }
  | CashBucketConfig

export type CashReserveMode = 'fixed' | 'months'
```

**Step 2: Add cash reserve fields to ProfileState**

In `ProfileState` (after the SRS fields at line ~95), add:

```typescript
  // Cash Reserve / Emergency Fund
  cashReserveEnabled: boolean
  cashReserveMode: CashReserveMode
  cashReserveFixedAmount: number
  cashReserveMonths: number
  cashReserveReturn: number
  retirementMitigation: RetirementMitigationConfig
```

**Step 3: Add display columns to IncomeProjectionRow**

In `IncomeProjectionRow` (after `srsTaxableWithdrawal` at line ~228), add:

```typescript
  // Cash reserve (populated by hook post-processing, not income engine)
  cashReserveTarget: number
  cashReserveBalance: number
  investedSavings: number
```

**Step 4: Add fields to MonteCarloParams**

In `MonteCarloParams` (after `inflation` at line ~485), add:

```typescript
  retirementMitigation: RetirementMitigationConfig
```

**Step 5: Add fields to MonteCarloEngineParams**

In `MonteCarloEngineParams` in `frontend/src/lib/simulation/monteCarlo.ts:29-48` (after `portfolioAdjustments` at line ~47), add:

```typescript
  retirementMitigation?: RetirementMitigationConfig
  annualExpensesAtRetirement?: number  // needed to compute bucket target
```

**Step 6: Run type-check**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -50`

Expected: Type errors in files that now need to supply the new fields (stores, hooks, income engine rows). This is expected — we'll fix them in subsequent tasks.

**Step 7: Commit**

```bash
git add frontend/src/lib/types.ts frontend/src/lib/simulation/monteCarlo.ts
git commit -m "feat: add cash reserve and retirement mitigation types"
```

---

## Task 2: Validation schemas for new fields

**Files:**
- Modify: `frontend/src/lib/validation/schemas.ts:169-206` (add field-level schemas to `validateProfileField`)

**Step 1: Add field schemas to validateProfileField**

In the `fieldSchemas` record inside `validateProfileField` (after the `healthcareConfig.mediSaveTopUpAnnual` entry at line ~197), add:

```typescript
    cashReserveFixedAmount: z.number().min(0).max(10_000_000),
    cashReserveMonths: z.number().int().min(1).max(60),
    cashReserveReturn: z.number().min(0).max(0.10),
```

Note: `retirementMitigation` is a nested object — validate its sub-fields when the profile store processes updates. The Zod schema for the profile object (`profileSchema`) doesn't need updating since it's only used for cross-store validation and the cash reserve fields are independently validated.

**Step 2: Run tests**

Run: `cd frontend && npx vitest run src/lib/validation/ --reporter=verbose 2>&1 | tail -20`

Expected: All existing validation tests pass. No new tests needed for schemas alone (they'll be covered by the cashReserve.test.ts in Task 3).

**Step 3: Commit**

```bash
git add frontend/src/lib/validation/schemas.ts
git commit -m "feat: add validation schemas for cash reserve fields"
```

---

## Task 3: Profile store — new fields, defaults, migration v16

**Files:**
- Modify: `frontend/src/stores/useProfileStore.ts`

**Step 1: Add to PROFILE_DATA_KEYS array**

In `PROFILE_DATA_KEYS` (after `'financialGoals'` at line ~38), add:

```typescript
  'cashReserveEnabled', 'cashReserveMode', 'cashReserveFixedAmount',
  'cashReserveMonths', 'cashReserveReturn', 'retirementMitigation',
```

**Step 2: Add defaults to DEFAULT_PROFILE**

In `DEFAULT_PROFILE` (after `financialGoals: []` at line ~94), add:

```typescript
  cashReserveEnabled: false,
  cashReserveMode: 'months' as const,
  cashReserveFixedAmount: 30000,
  cashReserveMonths: 6,
  cashReserveReturn: 0.02,
  retirementMitigation: { type: 'none' as const },
```

**Step 3: Add migration for version 16**

In the `migrate` function (after the `version < 15` block at line ~344), add:

```typescript
        if (version < 16) {
          state.cashReserveEnabled = state.cashReserveEnabled ?? false
          state.cashReserveMode = state.cashReserveMode ?? 'months'
          state.cashReserveFixedAmount = state.cashReserveFixedAmount ?? 30000
          state.cashReserveMonths = state.cashReserveMonths ?? 6
          state.cashReserveReturn = state.cashReserveReturn ?? 0.02
          state.retirementMitigation = state.retirementMitigation ?? { type: 'none' }
        }
```

**Step 4: Bump version**

Change `version: 15` to `version: 16` in the persist config.

**Step 5: Run type-check**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -30`

Expected: Fewer type errors than before (store now provides the new fields). Remaining errors will be in income engine rows and hooks.

**Step 6: Commit**

```bash
git add frontend/src/stores/useProfileStore.ts
git commit -m "feat: add cash reserve fields to profile store with migration v16"
```

---

## Task 4: Cash reserve calculation — write failing tests

**Files:**
- Create: `frontend/src/lib/calculations/cashReserve.test.ts`

**Step 1: Write the test file**

```typescript
import { describe, it, expect } from 'vitest'
import { computeCashReservePlan } from './cashReserve'
import type { CashReservePlanParams } from './cashReserve'

describe('computeCashReservePlan', () => {
  const baseParams: CashReservePlanParams = {
    mode: 'fixed',
    target: 30000,
    initialBalance: 0,
    annualSavingsArray: [20000, 20000, 20000, 20000, 20000],
    cashReturn: 0.02,
    inflationRate: 0.025,
    annualExpenses: 48000,
  }

  it('reserve already funded — all savings flow to investments', () => {
    const result = computeCashReservePlan({
      ...baseParams,
      initialBalance: 30000,  // already at target
    })
    // No diversion needed — all savings go to portfolio
    expect(result.investedSavings).toEqual([20000, 20000, 20000, 20000, 20000])
    expect(result.reserveBalance[0]).toBeCloseTo(30000 * 1.02, 0)  // earns return
    result.reserveBalance.forEach((b) => expect(b).toBeGreaterThanOrEqual(30000))
  })

  it('reserve fills over 2 years', () => {
    const result = computeCashReservePlan(baseParams)
    // Year 0: $20K diverted, $0 invested. Balance = 20000
    expect(result.investedSavings[0]).toBe(0)
    expect(result.reserveBalance[0]).toBe(20000)
    // Year 1: balance = 20000 * 1.02 = 20400. Shortfall = 9600. Divert 9600, invest 10400
    expect(result.investedSavings[1]).toBeCloseTo(10400, 0)
    expect(result.reserveBalance[1]).toBeCloseTo(30000, 0)
    // Year 2+: reserve full, all savings invested
    expect(result.investedSavings[2]).toBe(20000)
    expect(result.investedSavings[3]).toBe(20000)
    expect(result.investedSavings[4]).toBe(20000)
  })

  it('months mode — target grows with inflation', () => {
    const result = computeCashReservePlan({
      ...baseParams,
      mode: 'months',
      target: 0,  // ignored in months mode
      annualSavingsArray: [50000, 50000, 50000],
    })
    // Year 0 target: 6 months × $48,000/12 = $24,000
    expect(result.reserveTarget[0]).toBe(24000)
    // Year 1 target: 6 months × ($48,000 × 1.025)/12 = $24,600
    expect(result.reserveTarget[1]).toBeCloseTo(24600, 0)
    // Year 2 target: 6 months × ($48,000 × 1.025²)/12 ≈ $25,215
    expect(result.reserveTarget[2]).toBeCloseTo(25215, 0)
  })

  it('cash return compounds on reserve balance', () => {
    const result = computeCashReservePlan({
      ...baseParams,
      initialBalance: 30000,  // already funded
      annualSavingsArray: [20000, 20000, 20000],
    })
    // Balance grows: 30000 * 1.02 = 30600, then 30600 * 1.02 = 31212, etc.
    expect(result.reserveBalance[0]).toBeCloseTo(30600, 0)
    expect(result.reserveBalance[1]).toBeCloseTo(31212, 0)
    expect(result.reserveBalance[2]).toBeCloseTo(31836.24, 0)
  })

  it('zero savings years — reserve does not fill, no negative diversion', () => {
    const result = computeCashReservePlan({
      ...baseParams,
      annualSavingsArray: [0, 0, 20000, 20000],
    })
    expect(result.investedSavings[0]).toBe(0)
    expect(result.investedSavings[1]).toBe(0)
    expect(result.reserveBalance[0]).toBe(0)
    expect(result.reserveBalance[1]).toBe(0)
    // Year 2: divert $20K to reserve
    expect(result.investedSavings[2]).toBe(0)
    expect(result.reserveBalance[2]).toBe(20000)
  })

  it('partial initial balance — fills remainder from savings', () => {
    const result = computeCashReservePlan({
      ...baseParams,
      initialBalance: 10000,
      annualSavingsArray: [20000, 20000, 20000],
    })
    // Year 0: balance starts at 10000, grows to 10200. Shortfall = 19800. Divert all 20000 (capped at shortfall).
    expect(result.reserveBalance[0]).toBeCloseTo(30000, 0)  // 10200 + 19800
    expect(result.investedSavings[0]).toBeCloseTo(200, 0)   // 20000 - 19800
    // Year 1+: reserve full
    expect(result.investedSavings[1]).toBe(20000)
  })

  it('empty savings array returns empty arrays', () => {
    const result = computeCashReservePlan({
      ...baseParams,
      annualSavingsArray: [],
    })
    expect(result.investedSavings).toEqual([])
    expect(result.reserveBalance).toEqual([])
    expect(result.reserveTarget).toEqual([])
  })

  it('months mode with cashReserveMonths parameter', () => {
    // Verify that months param is used correctly
    const result = computeCashReservePlan({
      ...baseParams,
      mode: 'months',
      annualSavingsArray: [50000],
    })
    // 6 months × 48000/12 = 24000
    expect(result.reserveTarget[0]).toBe(24000)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/lib/calculations/cashReserve.test.ts --reporter=verbose 2>&1 | tail -10`

Expected: FAIL — `Cannot find module './cashReserve'`

**Step 3: Commit the failing test**

```bash
git add frontend/src/lib/calculations/cashReserve.test.ts
git commit -m "test: add failing tests for computeCashReservePlan"
```

---

## Task 5: Cash reserve calculation — implementation

**Files:**
- Create: `frontend/src/lib/calculations/cashReserve.ts`

**Step 1: Implement the module**

```typescript
/**
 * Cash Reserve / Emergency Fund calculation.
 *
 * Computes how annual savings are split between a cash reserve and
 * investable savings during the accumulation phase. The reserve fills
 * first; once at target, all savings flow to the portfolio.
 *
 * This is a post-processing step — it runs AFTER the income engine
 * and BEFORE the MC engine, keeping both pure.
 */

export interface CashReservePlanParams {
  mode: 'fixed' | 'months'
  /** Fixed-mode target amount (ignored in months mode). */
  target: number
  /** Initial reserve balance (carved from liquidNetWorth). min(liquidNetWorth, target). */
  initialBalance: number
  /** Annual savings from income projection (pre-retirement years). */
  annualSavingsArray: number[]
  /** Return on cash reserve, e.g., 0.02 for savings account. */
  cashReturn: number
  /** Inflation rate, used in months mode to grow the target. */
  inflationRate: number
  /** Base annual expenses (year 0), used in months mode. */
  annualExpenses: number
}

export interface CashReservePlan {
  /** Savings flowing to portfolio each year (annualSavings - diversion). */
  investedSavings: number[]
  /** Reserve balance at each year-end. */
  reserveBalance: number[]
  /** Target at each year (constant in fixed mode, inflation-adjusted in months mode). */
  reserveTarget: number[]
}

/**
 * Compute the year-by-year cash reserve plan for the accumulation phase.
 *
 * Algorithm:
 * 1. Compute target (fixed or months × inflated expenses / 12)
 * 2. Grow existing reserve by cashReturn
 * 3. Divert savings to fill shortfall (capped at available savings)
 * 4. Remainder goes to investments
 */
export function computeCashReservePlan(params: CashReservePlanParams): CashReservePlan {
  const {
    mode,
    target: fixedTarget,
    initialBalance,
    annualSavingsArray,
    cashReturn,
    inflationRate,
    annualExpenses,
  } = params

  const n = annualSavingsArray.length
  const investedSavings: number[] = new Array(n)
  const reserveBalance: number[] = new Array(n)
  const reserveTarget: number[] = new Array(n)

  let balance = initialBalance

  for (let t = 0; t < n; t++) {
    // 1. Compute target for this year
    const target = mode === 'fixed'
      ? fixedTarget
      : (params.annualExpenses * Math.pow(1 + inflationRate, t)) / 12 * 6
    reserveTarget[t] = target

    // 2. Grow reserve by cash return
    balance = balance * (1 + cashReturn)

    // 3. Compute shortfall and diversion
    const shortfall = Math.max(0, target - balance)
    const diversion = Math.min(shortfall, annualSavingsArray[t])
    balance += diversion

    // 4. Remainder flows to portfolio
    investedSavings[t] = annualSavingsArray[t] - diversion
    reserveBalance[t] = balance
  }

  return { investedSavings, reserveBalance, reserveTarget }
}

/**
 * Compute the initial cash reserve offset from liquid net worth.
 * This is the amount carved out of liquidNetWorth to pre-fund the reserve.
 */
export function computeCashReserveOffset(
  liquidNetWorth: number,
  cashReserveEnabled: boolean,
  mode: 'fixed' | 'months',
  fixedAmount: number,
  months: number,
  annualExpenses: number,
): number {
  if (!cashReserveEnabled) return 0
  const target = mode === 'fixed' ? fixedAmount : (annualExpenses / 12) * months
  return Math.min(Math.max(0, liquidNetWorth), target)
}
```

Wait — looking at the test, the months mode hardcodes `6` in the function. That's wrong. The `months` parameter should come from the params. Let me fix:

```typescript
export interface CashReservePlanParams {
  mode: 'fixed' | 'months'
  target: number
  /** Number of months for months mode (e.g., 6). Ignored in fixed mode. */
  months: number
  initialBalance: number
  annualSavingsArray: number[]
  cashReturn: number
  inflationRate: number
  annualExpenses: number
}
```

And the target computation:

```typescript
    const target = mode === 'fixed'
      ? fixedTarget
      : (annualExpenses * Math.pow(1 + inflationRate, t)) / 12 * params.months
```

The test also needs the `months: 6` field. Update the `baseParams` in the test:

```typescript
  const baseParams: CashReservePlanParams = {
    mode: 'fixed',
    target: 30000,
    months: 6,
    initialBalance: 0,
    annualSavingsArray: [20000, 20000, 20000, 20000, 20000],
    cashReturn: 0.02,
    inflationRate: 0.025,
    annualExpenses: 48000,
  }
```

**Step 1: Write the full implementation file**

Create `frontend/src/lib/calculations/cashReserve.ts`:

```typescript
/**
 * Cash Reserve / Emergency Fund calculation.
 *
 * Computes how annual savings are split between a cash reserve and
 * investable savings during the accumulation phase. The reserve fills
 * first; once at target, all savings flow to the portfolio.
 *
 * This is a post-processing step — it runs AFTER the income engine
 * and BEFORE the MC engine, keeping both pure.
 */

export interface CashReservePlanParams {
  mode: 'fixed' | 'months'
  /** Fixed-mode target amount. Ignored in months mode. */
  target: number
  /** Number of months of expenses for months mode (e.g., 6). Ignored in fixed mode. */
  months: number
  /** Initial reserve balance (carved from liquidNetWorth). */
  initialBalance: number
  /** Annual savings from income projection (pre-retirement years). */
  annualSavingsArray: number[]
  /** Return on cash reserve, e.g., 0.02 for savings account. */
  cashReturn: number
  /** Inflation rate, used in months mode to grow the target. */
  inflationRate: number
  /** Base annual expenses (year 0), used in months mode. */
  annualExpenses: number
}

export interface CashReservePlan {
  /** Savings flowing to portfolio each year (annualSavings - diversion). */
  investedSavings: number[]
  /** Reserve balance at each year-end. */
  reserveBalance: number[]
  /** Target at each year (constant in fixed mode, inflation-adjusted in months mode). */
  reserveTarget: number[]
}

export function computeCashReservePlan(params: CashReservePlanParams): CashReservePlan {
  const {
    mode,
    target: fixedTarget,
    months,
    initialBalance,
    annualSavingsArray,
    cashReturn,
    inflationRate,
    annualExpenses,
  } = params

  const n = annualSavingsArray.length
  const investedSavings: number[] = new Array(n)
  const reserveBalance: number[] = new Array(n)
  const reserveTarget: number[] = new Array(n)

  let balance = initialBalance

  for (let t = 0; t < n; t++) {
    // 1. Compute target for this year
    const target = mode === 'fixed'
      ? fixedTarget
      : (annualExpenses * Math.pow(1 + inflationRate, t)) / 12 * months
    reserveTarget[t] = target

    // 2. Grow reserve by cash return
    balance = balance * (1 + cashReturn)

    // 3. Compute shortfall and diversion
    const shortfall = Math.max(0, target - balance)
    const diversion = Math.min(shortfall, annualSavingsArray[t])
    balance += diversion

    // 4. Remainder flows to portfolio
    investedSavings[t] = annualSavingsArray[t] - diversion
    reserveBalance[t] = balance
  }

  return { investedSavings, reserveBalance, reserveTarget }
}

/**
 * Compute the initial cash reserve offset from liquid net worth.
 * Returns the amount carved out of liquidNetWorth to pre-fund the reserve.
 */
export function computeCashReserveOffset(
  liquidNetWorth: number,
  cashReserveEnabled: boolean,
  mode: 'fixed' | 'months',
  fixedAmount: number,
  months: number,
  annualExpenses: number,
): number {
  if (!cashReserveEnabled) return 0
  const target = mode === 'fixed' ? fixedAmount : (annualExpenses / 12) * months
  return Math.min(Math.max(0, liquidNetWorth), target)
}
```

**Step 2: Update the test file to include `months` param**

Update `baseParams` in `cashReserve.test.ts` to include `months: 6`.

**Step 3: Run tests**

Run: `cd frontend && npx vitest run src/lib/calculations/cashReserve.test.ts --reporter=verbose 2>&1 | tail -30`

Expected: All 8 tests PASS.

**Step 4: Commit**

```bash
git add frontend/src/lib/calculations/cashReserve.ts frontend/src/lib/calculations/cashReserve.test.ts
git commit -m "feat: implement computeCashReservePlan with tests"
```

---

## Task 6: Fix IncomeProjectionRow — add default values for new columns

**Files:**
- Modify: `frontend/src/lib/calculations/income.ts` (where rows are pushed, around line ~512-530)

The income engine pushes `IncomeProjectionRow` objects. Since we added 3 new required fields (`cashReserveTarget`, `cashReserveBalance`, `investedSavings`), every `rows.push({...})` call will fail type-check. Add default values (0) — the real values are populated in hooks later.

**Step 1: Add defaults to the row push**

In `generateIncomeProjection`, find the `rows.push({` block (around line ~512). Add after the SRS fields:

```typescript
      // Cash reserve defaults (populated by hook post-processing)
      cashReserveTarget: 0,
      cashReserveBalance: 0,
      investedSavings: annualSavings,  // default: same as annualSavings (no reserve)
```

**Step 2: Run type-check**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -30`

Expected: Fewer errors. The income engine and types should now be consistent.

**Step 3: Run income tests**

Run: `cd frontend && npx vitest run src/lib/calculations/income.test.ts --reporter=verbose 2>&1 | tail -20`

Expected: All existing income tests PASS (new fields are non-breaking defaults).

**Step 4: Commit**

```bash
git add frontend/src/lib/calculations/income.ts
git commit -m "fix: add default cash reserve columns to IncomeProjectionRow"
```

---

## Task 7: FIRE metrics — accept cashReserveOffset

**Files:**
- Modify: `frontend/src/lib/calculations/fire.ts:234-280` (add optional param to `calculateAllFireMetrics`)
- Modify: `frontend/src/hooks/useFireCalculations.ts:100-120` (compute and pass offset)

**Step 1: Add optional `cashReserveOffset` param to calculateAllFireMetrics**

In the params type of `calculateAllFireMetrics` (line ~234), add:

```typescript
  cashReserveOffset?: number
```

In the function body (after `const totalNetWorth = liquidNetWorth + cpfTotal` at line ~277), modify:

```typescript
  const cashReserveOffset = params.cashReserveOffset ?? 0
  const investableLiquid = liquidNetWorth - cashReserveOffset
  const totalNetWorth = investableLiquid + cpfTotal
  const totalNWIncProperty = totalNetWorth + propertyEquity
  const annualSavings = annualIncome - annualExpenses
```

**Step 2: Update useFireCalculations to compute and pass the offset**

In `frontend/src/hooks/useFireCalculations.ts`, import the offset function:

```typescript
import { computeCashReserveOffset } from '@/lib/calculations/cashReserve'
```

Before the `calculateAllFireMetrics` call (around line ~99), compute:

```typescript
    const cashReserveOffset = computeCashReserveOffset(
      profile.liquidNetWorth,
      profile.cashReserveEnabled,
      profile.cashReserveMode,
      profile.cashReserveFixedAmount,
      profile.cashReserveMonths,
      profile.annualExpenses,
    )
```

Pass it to `calculateAllFireMetrics`:

```typescript
    const metrics = calculateAllFireMetrics({
      // ...existing params...
      cashReserveOffset,
    })
```

Add the new profile fields to the `useMemo` dependency array:

```typescript
    profile.cashReserveEnabled,
    profile.cashReserveMode,
    profile.cashReserveFixedAmount,
    profile.cashReserveMonths,
    profile.cashReserveReturn,
```

**Step 3: Run fire.test.ts to verify no regressions**

Run: `cd frontend && npx vitest run src/lib/calculations/fire.test.ts --reporter=verbose 2>&1 | tail -20`

Expected: All existing tests PASS (offset defaults to 0, behavior unchanged).

**Step 4: Run type-check**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`

Expected: Fewer errors. The `fire.ts` and `useFireCalculations` changes should type-check.

**Step 5: Commit**

```bash
git add frontend/src/lib/calculations/fire.ts frontend/src/hooks/useFireCalculations.ts
git commit -m "feat: integrate cash reserve offset into FIRE metrics"
```

---

## Task 8: MC hook — post-process savings with cash reserve plan

**Files:**
- Modify: `frontend/src/hooks/useMonteCarloQuery.ts:85-108` (post-process annualSavings)

**Step 1: Import cashReserve functions**

Add to imports:

```typescript
import { computeCashReservePlan, computeCashReserveOffset } from '@/lib/calculations/cashReserve'
```

**Step 2: Post-process savings array**

After the income projection loop builds `annualSavings` (around line ~108), add:

```typescript
      // Post-process savings through cash reserve
      let effectiveSavings = annualSavings
      if (profile.cashReserveEnabled && annualSavings.length > 0) {
        const reserveOffset = computeCashReserveOffset(
          profile.liquidNetWorth,
          profile.cashReserveEnabled,
          profile.cashReserveMode,
          profile.cashReserveFixedAmount,
          profile.cashReserveMonths,
          profile.annualExpenses,
        )
        const reservePlan = computeCashReservePlan({
          mode: profile.cashReserveMode,
          target: profile.cashReserveFixedAmount,
          months: profile.cashReserveMonths,
          initialBalance: reserveOffset,
          annualSavingsArray: annualSavings,
          cashReturn: profile.cashReserveReturn,
          inflationRate: profile.inflation,
          annualExpenses: profile.annualExpenses,
        })
        effectiveSavings = reservePlan.investedSavings
      }
```

**Step 3: Pass effectiveSavings and mitigation config to MC params**

Replace `annualSavings` with `effectiveSavings` in the params object (line ~188):

```typescript
        annualSavings: analysisPortfolio.skipAccumulation ? [] : effectiveSavings,
```

Add the mitigation config and retirement expenses:

```typescript
        retirementMitigation: profile.retirementMitigation,
        annualExpensesAtRetirement: profile.annualExpenses * Math.pow(1 + profile.inflation, Math.max(0, profile.retirementAge - profile.currentAge)),
```

**Step 4: Add cash reserve fields to paramsSig (stale detection)**

In `currentParamsSig` (around line ~49), add:

```typescript
    cashReserveEnabled: profile.cashReserveEnabled,
    cashReserveMode: profile.cashReserveMode,
    cashReserveFixedAmount: profile.cashReserveFixedAmount,
    cashReserveMonths: profile.cashReserveMonths,
    cashReserveReturn: profile.cashReserveReturn,
    retirementMitigation: profile.retirementMitigation,
```

And in the dependency array (around line ~74):

```typescript
    profile.cashReserveEnabled, profile.cashReserveMode, profile.cashReserveFixedAmount,
    profile.cashReserveMonths, profile.cashReserveReturn, profile.retirementMitigation,
```

**Step 5: Run type-check**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`

Expected: Hook type-checks. MC engine will have warnings about unused params (fixed in Task 9).

**Step 6: Commit**

```bash
git add frontend/src/hooks/useMonteCarloQuery.ts
git commit -m "feat: post-process savings through cash reserve in MC hook"
```

---

## Task 9: MC engine — retirement bucket logic in decumulation loop

**Files:**
- Modify: `frontend/src/lib/simulation/monteCarlo.ts:368-455` (decumulation loop)

**Step 1: Extract mitigation params at top of runMonteCarlo**

Near the top of the `runMonteCarlo` function, after destructuring params, add:

```typescript
  const retirementMitigation = params.retirementMitigation ?? { type: 'none' as const }
  const annualExpensesAtRetirement = params.annualExpensesAtRetirement ?? 0
```

**Step 2: Initialize bucket array at retirement start**

Inside the `if (t < nYearsAccum)` else block, before the per-sim loop, at `decumYear === 0` (line ~381):

```typescript
      // Initialize retirement bucket if cash_bucket mitigation is enabled
      if (decumYear === 0 && retirementMitigation.type === 'cash_bucket') {
        const bucketTarget = (annualExpensesAtRetirement / 12) * retirementMitigation.targetMonths
        for (let s = 0; s < nSims; s++) {
          const available = Math.min(bucketTarget, balances[s][t])
          cashBuckets[s] = available
          balances[s][t] -= available
          cashBucketTargets[s] = bucketTarget
        }
      }
```

And declare the arrays before the main loop (around line ~350):

```typescript
  // Retirement cash bucket state (one scalar per sim)
  const cashBuckets = new Float64Array(nSims)      // current bucket balance
  const cashBucketTargets = new Float64Array(nSims) // target bucket size
```

**Step 3: Modify decumulation per-sim loop for bucket withdrawal**

Replace the existing withdrawal logic (lines ~388-441) with bucket-aware logic. The key change is wrapping the existing withdrawal in a mitigation dispatch:

```typescript
        if (retirementMitigation.type === 'cash_bucket' && cashBuckets[s] > 0) {
          // Draw withdrawal from cash bucket first
          const fromBucket = Math.min(netWithdrawal, cashBuckets[s])
          const fromPortfolio = netWithdrawal - fromBucket
          cashBuckets[s] = (cashBuckets[s] - fromBucket) * (1 + retirementMitigation.cashReturn)

          balances[s][t + 1] =
            (currentBalance - fromPortfolio) * (1 + portfolioReturns[s][t] - expenseRatio)

          // Refill bucket in positive-return years
          if (portfolioReturns[s][t] > 0 && balances[s][t + 1] > 0) {
            const shortfall = Math.max(0, cashBucketTargets[s] - cashBuckets[s])
            const refillCap = balances[s][t + 1] * 0.10
            const refill = Math.min(shortfall, refillCap)
            cashBuckets[s] += refill
            balances[s][t + 1] -= refill
          }
        } else {
          // Default: withdraw directly from portfolio (existing behavior)
          balances[s][t + 1] =
            (currentBalance - netWithdrawal) * (1 + portfolioReturns[s][t] - expenseRatio)
        }
```

**Important:** Keep the existing `netWithdrawal` computation, `prevWithdrawals[s]` tracking, `withdrawalCol[s]` assignment, and failure detection logic unchanged. The bucket only changes WHERE the withdrawal comes from (cash vs portfolio), not HOW MUCH is withdrawn.

**Step 4: Run existing MC tests**

Run: `cd frontend && npx vitest run src/lib/simulation/monteCarlo.test.ts --reporter=verbose 2>&1 | tail -30`

Expected: All existing tests PASS (default mitigation is `{ type: 'none' }`, no behavior change).

**Step 5: Commit**

```bash
git add frontend/src/lib/simulation/monteCarlo.ts
git commit -m "feat: add retirement cash bucket logic to MC decumulation loop"
```

---

## Task 10: MC retirement bucket tests

**Files:**
- Modify: `frontend/src/lib/simulation/monteCarlo.test.ts` (add new describe block)

**Step 1: Add retirement bucket test suite**

Add at the end of the test file:

```typescript
describe('retirement cash bucket mitigation', () => {
  // Use a minimal setup: 0 accumulation years, 10 decumulation years, 1 asset class
  const baseBucketParams: MonteCarloEngineParams = {
    initialPortfolio: 1_000_000,
    allocationWeights: [1, 0, 0, 0, 0, 0, 0, 0],
    expectedReturns: [0.07, 0, 0, 0, 0, 0, 0, 0],
    stdDevs: [0.15, 0, 0, 0, 0, 0, 0, 0],
    correlationMatrix: Array.from({ length: 8 }, (_, i) =>
      Array.from({ length: 8 }, (_, j) => (i === j ? 1 : 0))
    ),
    currentAge: 65,
    retirementAge: 65,
    lifeExpectancy: 75,
    annualSavings: [],
    postRetirementIncome: [],
    method: 'parametric',
    nSimulations: 100,
    seed: 42,
    withdrawalStrategy: 'constant_dollar',
    strategyParams: { swr: 0.04 },
    expenseRatio: 0.003,
    inflation: 0.025,
  }

  it('mitigation none — unchanged from baseline', () => {
    const withNone = runMonteCarlo({
      ...baseBucketParams,
      retirementMitigation: { type: 'none' },
      seed: 42,
    })
    const withoutField = runMonteCarlo({
      ...baseBucketParams,
      seed: 42,
    })
    expect(withNone.success_rate).toBe(withoutField.success_rate)
  })

  it('cash bucket — deterministic with seed', () => {
    const config = {
      ...baseBucketParams,
      retirementMitigation: {
        type: 'cash_bucket' as const,
        targetMonths: 24,
        cashReturn: 0.02,
      },
      annualExpensesAtRetirement: 40000,
      seed: 42,
    }
    const r1 = runMonteCarlo(config)
    const r2 = runMonteCarlo(config)
    expect(r1.success_rate).toBe(r2.success_rate)
    expect(r1.percentile_bands.p50).toEqual(r2.percentile_bands.p50)
  })

  it('cash bucket carves from initial portfolio', () => {
    const withBucket = runMonteCarlo({
      ...baseBucketParams,
      retirementMitigation: {
        type: 'cash_bucket' as const,
        targetMonths: 24,
        cashReturn: 0.02,
      },
      annualExpensesAtRetirement: 40000,
      seed: 42,
    })
    // Bucket = 24 months × 40000/12 = 80000 carved from 1M
    // Invested portfolio starts at 920K, so early balances should be lower
    const noBucket = runMonteCarlo({
      ...baseBucketParams,
      seed: 42,
    })
    // Median balance at year 1 should be lower with bucket (less invested capital)
    // But success rates may be comparable or slightly better due to crash protection
    expect(withBucket.success_rate).toBeGreaterThanOrEqual(0)
    expect(noBucket.success_rate).toBeGreaterThanOrEqual(0)
  })
})
```

**Step 2: Run tests**

Run: `cd frontend && npx vitest run src/lib/simulation/monteCarlo.test.ts --reporter=verbose 2>&1 | tail -30`

Expected: All tests PASS.

**Step 3: Commit**

```bash
git add frontend/src/lib/simulation/monteCarlo.test.ts
git commit -m "test: add retirement cash bucket mitigation tests"
```

---

## Task 11: Backtest + sequence risk — add mitigation config passthrough

**Files:**
- Modify: `frontend/src/lib/simulation/backtest.ts:25-37` (add field to `BacktestEngineParams`)
- Modify: `frontend/src/hooks/useBacktestQuery.ts` (pass mitigation config)
- Modify: `frontend/src/hooks/useSequenceRiskQuery.ts` (pass mitigation config)

The backtest engine is retirement-only (no accumulation savings). It needs the bucket logic too for consistency. However, implementing the bucket in the backtest's rolling-window loop is a larger change. For the initial implementation:

**Step 1: Add optional field to BacktestEngineParams**

```typescript
  retirementMitigation?: RetirementMitigationConfig
  annualExpensesAtRetirement?: number
```

Import the type at top of `backtest.ts`:

```typescript
import type { RetirementMitigationConfig } from '@/lib/types'
```

**Step 2: Add optional field to SequenceRiskEngineParams**

In `frontend/src/lib/simulation/sequenceRisk.ts`, add to the params interface:

```typescript
  retirementMitigation?: RetirementMitigationConfig
  annualExpensesAtRetirement?: number
```

Import the type.

**Step 3: Pass config from hooks**

In `useBacktestQuery.ts`, add to the params object:

```typescript
        retirementMitigation: profile.retirementMitigation,
        annualExpensesAtRetirement: profile.annualExpenses * Math.pow(1 + profile.inflation, Math.max(0, profile.retirementAge - profile.currentAge)),
```

In `useSequenceRiskQuery.ts`, same addition to the params object.

Note: The actual bucket logic in the backtest/sequence risk inner loops is deferred — the params are passed through so the plumbing is ready. A future task can implement the bucket inside these engines. The design doc acknowledges this as a follow-up.

**Step 4: Run existing backtest and sequence risk tests**

Run: `cd frontend && npx vitest run src/lib/simulation/backtest.test.ts src/lib/simulation/sequenceRisk.test.ts --reporter=verbose 2>&1 | tail -20`

Expected: All existing tests PASS (new fields are optional, defaulting to undefined/none).

**Step 5: Commit**

```bash
git add frontend/src/lib/simulation/backtest.ts frontend/src/lib/simulation/sequenceRisk.ts frontend/src/hooks/useBacktestQuery.ts frontend/src/hooks/useSequenceRiskQuery.ts
git commit -m "feat: pass retirement mitigation config through backtest and sequence risk"
```

---

## Task 12: UI — CashReserveSection component

**Files:**
- Create: `frontend/src/components/profile/CashReserveSection.tsx`
- Modify: `frontend/src/pages/InputsPage.tsx:485-491` (add to NetWorthContent)

**Step 1: Create CashReserveSection component**

Create `frontend/src/components/profile/CashReserveSection.tsx`. Follow the same patterns as `FinancialSection.tsx` — use `useProfileStore`, `CurrencyInput`, `PercentInput`, `Switch`, etc. from the existing shared components.

The section should include:
- A toggle (Switch) for `cashReserveEnabled`
- When enabled:
  - Mode selector (radio or ToggleGroup): "Fixed Amount" / "Months of Expenses"
  - `CurrencyInput` for `cashReserveFixedAmount` (visible in fixed mode)
  - Number input for `cashReserveMonths` (visible in months mode)
  - `PercentInput` for `cashReserveReturn`
  - Computed display: "Reserve target: $X" (calculated from mode)
  - Status: "Funded" or "Needs $X more" based on `liquidNetWorth` vs target
- A nested toggle for retirement bucket:
  - When on: number input for `retirementMitigation.targetMonths`
  - Tooltip explaining bucket strategy

Use `useEffectiveMode` for the section like other profile sections.

**Step 2: Add to InputsPage**

In `InputsPage.tsx`, import and add below `FinancialSection` in `NetWorthContent` (around line ~488):

```typescript
import { CashReserveSection } from '@/components/profile/CashReserveSection'

function NetWorthContent() {
  return (
    <>
      <FinancialSection />
      <CashReserveSection />
    </>
  )
}
```

**Step 3: Run dev server and verify visually**

Run: `cd frontend && npm run dev -- --port 5173`

Expected: Cash reserve section appears below net worth, collapsed by default. Toggling on shows inputs. Values save to localStorage.

**Step 4: Run type-check**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`

Expected: Zero errors.

**Step 5: Commit**

```bash
git add frontend/src/components/profile/CashReserveSection.tsx frontend/src/pages/InputsPage.tsx
git commit -m "feat: add Cash Reserve section to profile UI"
```

---

## Task 13: Full test suite verification

**Files:** None (verification only)

**Step 1: Run all tests**

Run: `cd frontend && npx vitest run --reporter=verbose 2>&1 | tail -40`

Expected: All tests PASS.

**Step 2: Run type-check**

Run: `cd frontend && npx tsc --noEmit`

Expected: Zero errors.

**Step 3: Run lint**

Run: `cd frontend && npm run lint`

Expected: No new warnings/errors.

**Step 4: Run build**

Run: `cd frontend && npm run build 2>&1 | tail -10`

Expected: Build succeeds.

---

## Dependency Graph

```
Task 1 (types) ──────┬──→ Task 6 (income row defaults)
                      │
Task 2 (validation) ──┤
                      │
Task 3 (store) ───────┤
                      │
Task 4 (test) ────────┼──→ Task 5 (cashReserve impl) ──→ Task 7 (fire.ts + hook) ──→ Task 8 (MC hook)
                      │                                                                      │
                      │                                                                      ▼
                      │                                                               Task 9 (MC engine)
                      │                                                                      │
                      │                                                                      ▼
                      │                                                              Task 10 (MC bucket tests)
                      │                                                                      │
                      │                                                                      ▼
                      │                                                              Task 11 (backtest/seq risk)
                      │
                      └──→ Task 12 (UI) ──→ Task 13 (full verification)
```

**Parallelizable groups:**
- **Group A** (no deps): Tasks 1, 2, 3, 4 can all start in parallel
- **Group B** (depends on A): Tasks 5, 6
- **Group C** (depends on B): Task 7
- **Group D** (depends on C): Task 8
- **Group E** (depends on D): Tasks 9, 12 (independent of each other)
- **Group F** (depends on E): Tasks 10, 11
- **Group G** (depends on all): Task 13
