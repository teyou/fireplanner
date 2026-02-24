# Cash Reserve / Emergency Fund Design

**Date:** 2026-02-24
**Status:** Approved design, not yet implemented

## Motivation

The app currently treats all savings (income minus expenses) as fully invested into the portfolio each year. In reality, most people maintain a cash reserve / emergency fund that sits outside the investable portfolio. This feature lets users model that behavior, resulting in more realistic FIRE timelines.

A Reddit commenter suggested adding a "DCA / investing section." Rather than a separate investing flow, the cash reserve is the missing piece — once the reserve is funded, 100% of savings flow to investments automatically.

## Feature Summary

1. **Accumulation cash reserve**: User sets a target (fixed dollar amount or N months of expenses). Savings are diverted to fill the reserve first; once full, all savings flow to investments. The reserve earns a low return (savings account rate).

2. **Retirement cash bucket** (optional): A bucket strategy for decumulation. Withdrawals come from cash first. In positive-return years, the bucket is refilled from the portfolio. In negative-return years, the bucket drains — avoiding selling equities at a loss.

3. **Retirement mitigation framework**: The retirement bucket is implemented as the first variant of a `RetirementMitigationConfig` typed union, designed to support bond tent glide paths in the future.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Reserve source | Carved from `liquidNetWorth` | Most people's liquid NW already includes their savings account. No new "current balance" input needed. |
| Income engine impact | None — stays pure | Reserve diversion is a post-processing step between income engine and MC engine. Keeps `generateIncomeProjection` deterministic and pure. |
| Income projection display | New columns populated in hook | `cashReserveTarget`, `cashReserveBalance`, `investedSavings` added to `IncomeProjectionRow` but filled after income projection returns. Visible when enabled, hidden otherwise. |
| Deterministic limitation | Acknowledged | The income projection table shows a single deterministic reserve path. The reserve filling is deterministic anyway (fixed savings diversion, independent of market returns), so this is accurate for accumulation. |
| Retirement bucket | Path-dependent, inside MC loop | Bucket behavior depends on per-simulation market returns (draw on bad years, refill on good years). Must live in the MC/backtest decumulation loop. |
| Retirement mitigation extensibility | Typed union dispatch | `RetirementMitigationConfig` union supports `'none' | 'cash_bucket'` now, extensible to `'bond_tent'` later. MC loop dispatches on type. |
| UI placement | Profile page | Cash reserve is a profile-level setting near net worth / expenses inputs. Affects all downstream calculations. |
| Memory overhead | ~80KB for retirement bucket | One `Float64` per sim for 10K sims. Less overhead than bond tent mitigation in sequence risk (which runs an entire separate simulation). |

## Data Model

### Profile Store — New Fields

```typescript
// Accumulation reserve
cashReserveEnabled: boolean              // Master toggle (default: false)
cashReserveMode: 'fixed' | 'months'      // How to specify target
cashReserveFixedAmount: number            // e.g., 30000
cashReserveMonths: number                 // e.g., 6
cashReserveReturn: number                 // Savings account rate (default: 0.02)

// Retirement mitigation (extensible union)
retirementMitigation: RetirementMitigationConfig  // default: { type: 'none' }
```

**Defaults:**
- `cashReserveEnabled: false`
- `cashReserveMode: 'months'`
- `cashReserveMonths: 6`
- `cashReserveFixedAmount: 30000`
- `cashReserveReturn: 0.02`
- `retirementMitigation: { type: 'none' }`

**Store version:** Bump to 16. Migration sets new fields to defaults (feature off — no impact on existing users).

### Types (`lib/types.ts`)

```typescript
// Retirement mitigation — extensible union
export type RetirementMitigationType = 'none' | 'cash_bucket'

export interface CashBucketConfig {
  type: 'cash_bucket'
  targetMonths: number       // e.g., 24
  cashReturn: number         // e.g., 0.02
}

export type RetirementMitigationConfig =
  | { type: 'none' }
  | CashBucketConfig

// Added to IncomeProjectionRow (display columns)
cashReserveTarget: number     // Required reserve this year
cashReserveBalance: number    // Actual reserve balance at year-end
investedSavings: number       // annualSavings minus reserve diversion

// Added to MonteCarloParams
cashReserveBalance: number                    // Reserve balance at retirement start
retirementMitigation: RetirementMitigationConfig
```

### Future: Bond Tent Config (not implemented now)

```typescript
// When implementing bond tent, add to the union:
export interface BondTentConfig {
  type: 'bond_tent'
  peakBondAllocation: number    // e.g., 0.70 (70% bonds at retirement)
  glideDurationYears: number    // e.g., 15 (years to glide back to target)
  targetAllocation: number[]    // Final allocation weights to glide toward
}

export type RetirementMitigationConfig =
  | { type: 'none' }
  | CashBucketConfig
  | BondTentConfig
```

**Architectural note for bond tent:** The MC engine currently precomputes all portfolio returns upfront with fixed allocation weights:
```
portfolioReturns[sim][year] = weighted sum of correlated asset returns (fixed weights)
```
Bond tent needs year-varying weights during the glide period. Implementation would require:
1. Store raw per-asset returns: `assetReturns[sim][year][asset]` (8 assets)
2. Compute weighted portfolio return inside the decumulation loop with interpolated weights
3. Keep precomputed returns for non-glide years (accumulation + post-glide)

This is a ~10x memory increase for the returns array (8 assets instead of 1 portfolio return) but enables any allocation-varying strategy. Not needed for cash bucket.

## Calculation Logic

### New file: `lib/calculations/cashReserve.ts`

```typescript
export interface CashReservePlanParams {
  target: number              // Fixed amount or months × annualExpenses
  initialBalance: number      // min(liquidNetWorth, target) — pre-funded from LNW
  annualSavingsArray: number[] // From income projection (pre-retirement years)
  cashReturn: number           // e.g., 0.02
  inflationRate: number        // For months-mode: target grows with expenses
  annualExpenses: number       // Base expenses for months-mode recalc
  mode: 'fixed' | 'months'
}

export interface CashReservePlan {
  investedSavings: number[]    // What flows to portfolio each year
  reserveBalance: number[]     // Reserve balance at each year-end
  reserveTarget: number[]      // Target at each year
}

export function computeCashReservePlan(params: CashReservePlanParams): CashReservePlan
```

**Algorithm (accumulation):**
```
for each year t:
  1. Compute target:
     - fixed mode: target = fixedAmount (constant)
     - months mode: target = months × (annualExpenses × (1 + inflation)^t) / 12
  2. Reserve grows by cashReturn: balance *= (1 + cashReturn)
  3. Shortfall = max(0, target - balance)
  4. Diversion = min(shortfall, annualSavings[t])
  5. balance += diversion
  6. investedSavings[t] = annualSavings[t] - diversion
```

### FIRE Metrics Impact (`fire.ts`)

When `cashReserveEnabled`:
- `initialPortfolio` = `liquidNetWorth - min(liquidNetWorth, reserveTarget)`
- FIRE progress uses the reduced investable portfolio
- Years-to-FIRE uses `investedSavings[0]` (first year) instead of raw `annualSavings`
- `calculateAllFireMetrics` accepts an optional `cashReserveOffset: number` param (amount carved from LNW)

### Monte Carlo — Accumulation Phase

No change to the MC accumulation loop itself. The savings array passed in is already the post-reserve `investedSavings` array (computed in the hook).

### Monte Carlo — Retirement Bucket (Decumulation Phase)

When `retirementMitigation.type === 'cash_bucket'`:

```
At retirement start (decumYear === 0):
  bucketTarget = targetMonths × (annualExpenses at retirement) / 12
  bucket[s] = min(bucketTarget, balances[s][t])
  balances[s][t] -= bucket[s]  // carve from portfolio

Each decumulation year:
  1. requiredWithdrawal = computeWithdrawalsForYear(strategy, ...)
  2. fromBucket = min(requiredWithdrawal, bucket[s])
  3. fromPortfolio = requiredWithdrawal - fromBucket
  4. balances[s][t+1] = (balances[s][t] - fromPortfolio) × (1 + return - fees)
  5. bucket[s] = (bucket[s] - fromBucket) × (1 + cashReturn)
  6. If portfolioReturns[s][t] > 0:
       refillAmount = min(bucketTarget - bucket[s], balances[s][t+1] × 0.10)
       bucket[s] += refillAmount
       balances[s][t+1] -= refillAmount
```

The refill cap (10% of portfolio) prevents over-draining the portfolio to refill the bucket in a single good year.

**Dispatch pattern in MC loop:**
```typescript
if (mitigation.type === 'cash_bucket') {
  // cash bucket withdrawal + refill logic
} else {
  // default: withdraw directly from portfolio (existing behavior)
}
// Future: else if (mitigation.type === 'bond_tent') { ... }
```

## UI Design

### Profile Page — Cash Reserve Section

Placed after the net worth inputs, before the FIRE settings. Collapsible, hidden by default.

**When collapsed (disabled):** Single toggle row: "Cash Reserve / Emergency Fund [OFF]"

**When expanded (enabled):**
- Mode selector: "Fixed Amount" / "Months of Expenses" (radio/toggle)
- Amount input: `$30,000` (fixed mode) or `6 months` (months mode)
- Return rate: `2.0%` (with tooltip: "Savings account or money market rate")
- Computed display: "Reserve target: $24,000" (when months mode, shows calculated amount)
- Status badge: "Funded ✓" or "Needs $X more (est. Y months to fill)"

**Retirement Bucket sub-section** (nested toggle, only visible when cash reserve is enabled):
- Toggle: "Retirement Cash Bucket [OFF]"
- When on: "Bucket size: 24 months of retirement expenses"
- Tooltip explaining the bucket strategy

### Income Projection Table — New Columns

Three new columns, visible when cash reserve is enabled:
| Column | Description |
|--------|-------------|
| Reserve Target | Required reserve this year |
| Reserve Balance | Actual reserve at year-end |
| Invested Savings | Savings flowing to portfolio (= annualSavings - diversion) |

Hidden when `cashReserveEnabled === false` to avoid clutter.

## Validation

Add to `lib/validation/schemas.ts`:
- `cashReserveFixedAmount`: number, >= 0, <= 10,000,000
- `cashReserveMonths`: integer, 1-60
- `cashReserveReturn`: number, 0-0.10
- `retirementMitigation.targetMonths`: integer, 6-60 (when type === 'cash_bucket')
- `retirementMitigation.cashReturn`: number, 0-0.10

## Testing

### Unit tests (`lib/calculations/cashReserve.test.ts`)

1. **Reserve already funded**: liquidNW >= target → investedSavings === annualSavings (no diversion)
2. **Reserve fills over 2 years**: target $30K, savings $20K/yr → year 1: $20K diverted, $0 invested; year 2: $10K diverted, $10K invested
3. **Months mode inflation**: target grows with expenses → diversion extends slightly
4. **Cash return compounds**: reserve earns 2% → fills slightly faster
5. **Zero savings years**: life event pauses savings → reserve doesn't fill, no negative diversion
6. **Reserve exceeds liquidNW**: liquidNW $10K, target $30K → start with $10K, fill remainder from savings

### MC retirement bucket tests

7. **Bucket drains in crash**: 3 consecutive negative-return years → bucket depletes, withdrawals switch to portfolio
8. **Bucket refills in recovery**: positive return year → bucket partially refilled up to target
9. **Refill cap**: bucket refill never exceeds 10% of portfolio value
10. **Mitigation none**: default behavior unchanged when `retirementMitigation.type === 'none'`
11. **Deterministic with seed**: same seed + same inputs → same bucket balance trajectory

## Files Changed

| File | Change | New? |
|------|--------|------|
| `lib/types.ts` | Add `RetirementMitigationConfig`, `CashBucketConfig`, fields on `ProfileState`, `IncomeProjectionRow`, `MonteCarloParams` | No |
| `stores/useProfileStore.ts` | New fields, defaults, migration v16 | No |
| `lib/calculations/cashReserve.ts` | Pure functions for accumulation reserve plan | **Yes** |
| `lib/calculations/cashReserve.test.ts` | Unit tests | **Yes** |
| `lib/calculations/fire.ts` | Accept optional `cashReserveOffset` in `calculateAllFireMetrics` | No |
| `hooks/useFireCalculations.ts` | Compute reserve offset, pass reduced portfolio + savings | No |
| `hooks/useMonteCarloQuery.ts` | Post-process savings via `computeCashReservePlan`, pass mitigation config | No |
| `hooks/useBacktestQuery.ts` | Same savings post-processing | No |
| `hooks/useSequenceRiskQuery.ts` | Same savings post-processing | No |
| `lib/simulation/monteCarlo.ts` | Mitigation dispatch + cash bucket logic in decumulation loop | No |
| `lib/simulation/backtest.ts` | Same mitigation dispatch | No |
| `components/profile/CashReserveSection.tsx` | New UI section | **Yes** |
| `lib/validation/schemas.ts` | Validation rules for new fields | No |

**Total: 13 files (3 new, 10 modified)**

## Implementation Phases

Given the 3-file-per-task rule, this breaks into ~5 phases:

1. **Types + Store** (3 files): `types.ts`, `useProfileStore.ts`, `schemas.ts`
2. **Cash Reserve Calc + Tests** (2 files): `cashReserve.ts`, `cashReserve.test.ts`
3. **FIRE Metrics + Hooks** (3 files): `fire.ts`, `useFireCalculations.ts`, `useMonteCarloQuery.ts`
4. **Simulation Engines** (3 files): `monteCarlo.ts`, `backtest.ts`, hooks for backtest/sequence risk
5. **UI** (1-2 files): `CashReserveSection.tsx`, profile page integration

Phases 1-2 can run in parallel (no dependencies). Phase 3 depends on both. Phase 4 depends on 3. Phase 5 depends on 1.
