# Design: UX Simplification + SRS Lifecycle + HDB Monetization

**Date:** 2026-02-21
**Status:** Approved
**Scope:** 4 workstreams to transform FirePlanner from power tool to approachable Singapore retirement planner

---

## Context

FirePlanner is asymmetrically engineered: institutional-grade simulation depth (12 withdrawal strategies, 3 stress engines, Cholesky decomposition on 8×8 covariance) but missing two features that would help the most Singaporeans (SRS drawdown planning and HDB monetization). The UI exposes all complexity upfront with no progressive path from simple to advanced.

**Goal:** Make the tool approachable for a 35-year-old Singaporean Googling "when can I retire" while preserving full power for finance-literate users.

---

## Workstream 1: Global Simple/Advanced Toggle

### State Changes — `useUIStore`

Add to store (bump version 2 → 3):
```ts
mode: 'simple' | 'advanced'  // default: 'simple'
```

Migration v2 → v3:
- Map `statsPosition: 'sidebar'` → `'bottom'`
- Fold `allocationAdvanced: true` → `mode: 'advanced'`
- Remove `allocationAdvanced` field

### New Hook — `useEffectiveMode()`

Returns global mode. Extensible for per-section overrides in a future version.

```ts
export function useEffectiveMode(): 'simple' | 'advanced' {
  return useUIStore((s) => s.mode);
}
```

### Toggle Placement

Pill toggle in the sidebar header: `Simple | Advanced`. Styled as a segmented control.

### Per-Section Behavior

| Section | Simple Mode | Advanced Mode (current behavior) |
|---------|-------------|----------------------------------|
| Withdrawal | 4 strategies as flat list: Constant Dollar, Guardrails, VPW, Floor & Ceiling. No comparison table/charts. | All 12 in Basic/Adaptive/Smoothed groups with comparison table + 2 charts |
| Allocation | Template selector + portfolio stats only | Full 8-slider builder, glide path, correlation matrix, return overrides |
| Income | Simple salary model only | All 3 models, life events, detailed projection table |
| CPF | CPF LIFE payout + key summary numbers | Full projection table, extra interest details, housing deduction config |
| Property | Summary fields + strategy selector | BSD/ABSD calculator detail, Bala's Table, amortization schedule |
| Expenses & Withdrawal | Selected strategy params only | Full comparison table + 2 charts |
| FIRE Settings | Classic FIRE + auto return | 5 FIRE types, manual return override |

Sections not affected: Personal, Net Worth (already simple).

### Data Preservation Rule

Switching to Simple preserves all store data (just hides UI). If the active withdrawal strategy is one of the 8 hidden in Simple mode, show the strategy name with "(Advanced strategy)" label. User cannot select new hidden strategies but their existing choice is preserved and functional.

### FireStatsStrip Change

- Remove `'sidebar'` from `statsPosition` type (keep `'top' | 'bottom'` only)
- Default remains `'bottom'`

### Files to Modify

- `frontend/src/stores/useUIStore.ts` — add `mode`, migration v3, remove `allocationAdvanced`, remove `'sidebar'` from statsPosition
- `frontend/src/hooks/useEffectiveMode.ts` — new hook
- `frontend/src/components/layout/Sidebar.tsx` — add Simple/Advanced pill toggle
- `frontend/src/components/layout/AppLayout.tsx` — remove sidebar stats strip rendering
- `frontend/src/pages/InputsPage.tsx` — gate section content by mode
- `frontend/src/components/withdrawal/StrategyParamsSection.tsx` — filter strategies by mode
- `frontend/src/components/allocation/AllocationBuilder.tsx` — gate advanced controls by mode (replaces `allocationAdvanced`)
- `frontend/src/components/income/SalaryModelSection.tsx` — gate model selector by mode
- `frontend/src/components/profile/CpfSection.tsx` — gate projection table by mode
- `frontend/src/components/profile/FireTargetsSection.tsx` — gate FIRE type selector by mode

---

## Workstream 2: Quick Plan Results on StartPage

### Flow Change

**Current:** Pathway → 5 inputs → "Continue to planning" → navigate `/inputs`
**New:** Pathway → 5 inputs → **preliminary results card appears** → "Refine your plan →" → navigate `/inputs`

### Results Card Contents

- FIRE Number (e.g., "$1,200,000")
- Years to FIRE (e.g., "12 years")
- FIRE Age (e.g., "Age 42")
- Savings Rate (e.g., "37.5%")
- Simple progress bar (current NW / FIRE number)
- Label: *"Preliminary estimate using default assumptions (4% SWR, balanced portfolio at ~7% return, 2.5% inflation). Refine your plan for a more accurate projection."*

### Implementation

- Call `computeFireNumber()` and `computeYearsToFire()` from `lib/calculations/fire.ts` directly with draft values
- No store writes until "Refine your plan" is clicked (same as current)
- No new components — conditional card within existing StartPage pathway form
- Show card with a slide-in animation after user fills all 5 inputs

### Files to Modify

- `frontend/src/pages/StartPage.tsx` — add results card with fire.ts calculations

---

## Workstream 3: SRS Full Lifecycle

### Bug Fix (Ship Immediately)

`calculateSrsDeduction()` in the income pipeline uses `SRS_ANNUAL_CAP` (15,300) unconditionally. Should use `SRS_ANNUAL_CAP_FOREIGNER` (35,700) when `residencyStatus === 'foreigner'`. Both constants exist in `taxBrackets.ts` but the foreigner cap is never imported.

Also fix UI tooltip in FinancialSection.tsx that hardcodes "max $15,300 for citizens/PR" — should be dynamic based on residency.

### New Module — `lib/calculations/srs.ts`

**Accumulation:**
```ts
projectSrsBalance(
  currentBalance: number,
  annualContribution: number,
  investmentReturn: number,
  years: number,
  contributionCap: number  // from residencyStatus
): { year: number; balance: number; contribution: number; growth: number }[]
```
- Year-by-year SRS balance with investment returns
- Contribution capped per year (enforced in function, not just UI)

**Drawdown:**
```ts
computeSrsDrawdownSchedule(
  balance: number,
  startAge: number,    // default 63, user-editable
  durationYears: number // default 10
): { age: number; withdrawal: number; taxableAmount: number; remainingBalance: number }[]
```
- Equal annual withdrawals over 10 years (v1 simplification)
- `taxableAmount` = 50% of withdrawal (the concession)
- Future enhancement: tax-bracket-optimized unequal withdrawals

**Early Withdrawal:**
```ts
computeSrsEarlyPenalty(amount: number): { penalty: number; taxableAmount: number }
```
- 5% penalty + full amount taxable (100%, no 50% concession)

**SRS vs RSTU Comparison (Directional):**
```ts
compareSrsVsRstu(
  currentIncome: number,
  currentMarginalRate: number,
  amount: number
): { srsNetBenefit: number; rstuNetBenefit: number; recommendation: string }
```
- SRS: tax saved now at current marginal rate × amount, minus tax on withdrawal (50% × assumed 2% retirement rate × amount)
- RSTU: tax saved now at current marginal rate × amount, no withdrawal tax, but locked until 55+
- Returns directional comparison with one-line recommendation
- Uses current-year income for "now" bracket, assumes lowest bracket (0-2%) for retirement

### SRS as Separate Tracked Balance

SRS is tracked as a **separate balance** in the projection engine (like CPF OA/SA), NOT as part of the investable portfolio. Reasons:
- Different investment return rate (user-configurable, defaults 4%)
- Different tax treatment on withdrawals (50% concession)
- Fixed 10-year drawdown window
- Cannot be combined with portfolio rebalancing

### Projection Integration

- `generateProjection()` gains a new parallel track: `srsBalance`, `srsContribution`, `srsGrowth`, `srsWithdrawal`, `srsTaxableWithdrawal`
- During accumulation years: SRS grows by contribution + returns
- At drawdown start age: 10-year equal withdrawal schedule begins
- SRS withdrawals reduce required portfolio withdrawal (net spending need)
- Post-drawdown: SRS balance = 0

### Simulation Engine Integration

SRS drawdowns are treated as a **fixed income stream** during retirement in all simulation engines (MC, backtest, sequence risk) — identical to how CPF LIFE payouts are handled. They reduce the required portfolio withdrawal in each year of the drawdown window.

### Tax Integration

Modify `calculateChargeableIncome()` in the income pipeline:
- Accumulation years: deduct SRS contribution (already done, but fix cap by residency)
- Drawdown years: add 50% of SRS withdrawal to taxable income (**new**)

### Store Changes — `useProfileStore`

Add fields (bump store version):
```ts
srsInvestmentReturn: number   // default: 0.04
srsDrawdownStartAge: number   // default: 63
```

Existing fields stay: `srsBalance`, `srsAnnualContribution`

### UI Changes

- **Net Worth section**: Add `srsInvestmentReturn` input (Advanced mode only). Tooltip: "Expected return on SRS investments. Default 4% assumes a balanced portfolio."
- **Net Worth section**: Dynamic SRS cap tooltip based on residencyStatus
- **Projection table**: New expandable column group: SRS Balance, SRS Withdrawal (visible when SRS balance > 0)
- **Income section** (Advanced mode): SRS vs RSTU directional comparison card
- **Dashboard**: SRS withdrawals in `PassiveIncomePanel` during drawdown years

### Simple vs Advanced

| Mode | SRS visibility |
|------|---------------|
| Simple | SRS balance + contribution inputs. Auto-computed drawdown from 63 with defaults. No investment return override. |
| Advanced | Above + investment return, drawdown start age, SRS vs RSTU comparison card, detailed drawdown schedule |

### Tests

- `srs.test.ts` — accumulation projection, drawdown schedule, early penalty, tax concession, cap enforcement by residency
- Update `integration.test.ts` — add SRS to the 3 user journey scenarios
- Update income/tax tests — verify 50% concession in chargeable income

### Files to Create

- `frontend/src/lib/calculations/srs.ts`
- `frontend/src/lib/calculations/__tests__/srs.test.ts`

### Files to Modify

- `frontend/src/stores/useProfileStore.ts` — add `srsInvestmentReturn`, `srsDrawdownStartAge`, bump version
- `frontend/src/lib/calculations/income.ts` or tax pipeline — fix SRS cap by residency, add drawdown taxable income
- `frontend/src/components/profile/FinancialSection.tsx` — dynamic tooltip, investment return input
- `frontend/src/hooks/useProjection.ts` or `lib/calculations/projection.ts` — add SRS balance track
- `frontend/src/lib/simulation/monteCarlo.ts` — SRS as fixed income stream
- `frontend/src/lib/simulation/backtest.ts` — SRS as fixed income stream
- `frontend/src/lib/simulation/sequenceRisk.ts` — SRS as fixed income stream
- `frontend/src/lib/simulation/workerClient.ts` — pass SRS params

---

## Workstream 4: HDB Monetization (Phased)

### Implementation Order

| Phase | Feature | Rationale |
|-------|---------|-----------|
| P1 | Sale-and-Rent + CPF refund | Extends existing `calculateSellAndRent()`, highest impact |
| P2 | Subletting income | Simplest new feature, user-input-driven |
| P3 | Lease Buyback Scheme | Complex but high value for HDB retirees |
| P4 | Silver Housing Bonus | Lowest priority, policy-dependent, smallest impact — defer |

### New Data File — `lib/data/hdbRates.ts`

Source all values from current HDB website before implementation. Include URLs in header comments.

```ts
// LBS retained lease options
export const LBS_RETAINED_LEASE_OPTIONS = [20, 25, 30, 35]; // years

// Silver Housing Bonus amounts by flat type transition (deferred to P4)
export const SILVER_HOUSING_BONUS: Record<string, number> = { ... };

// Subletting: no data lookup — user-input driven with placeholder suggestions
export const SUBLETTING_RATE_SUGGESTIONS: Record<HdbFlatType, { low: number; high: number }> = { ... };
```

### Store Changes — `usePropertyStore`

Add fields (conditional on `propertyType === 'hdb'`):
```ts
hdbFlatType: '2-room' | '3-room' | '4-room' | '5-room' | 'executive'
hdbMonetizationStrategy: 'none' | 'lbs' | 'silver-housing' | 'sublet' | 'sell-and-rent'
hdbLbsRetainedLease: number      // default: 30
hdbSublettingRooms: number       // default: 1
hdbSublettingRate: number        // default: 800
hdbCpfUsedForHousing: number     // default: 0 (manual entry v1)
```

Strategies are mutually exclusive in v1. UI note: "Select the primary strategy you're considering."

### P1: Sale-and-Rent + CPF Refund

**Extends** existing `calculateSellAndRent()` in `property.ts`.

New function:
```ts
computeHdbCpfRefund(
  cpfUsedForHousing: number,
  yearsOfMortgage: number,
  oaInterestRate: number  // 2.5%
): number
```
- Refund = principal used + accrued interest at OA rate
- Deducted from sale proceeds before calculating investable amount

Changes to `calculateSellAndRent()`:
- Accept optional `cpfRefund` parameter
- Net proceeds = sale price - outstanding mortgage - agent fees - CPF refund
- Break-even analysis unchanged but with reduced initial capital

**Input:** `hdbCpfUsedForHousing` as manual entry with tooltip: "Check your CPF statement for the total OA amount used for housing." Default 0. Future enhancement: mini-calculator.

### P2: Subletting Income

New function:
```ts
computeHdbSublettingIncome(
  rooms: number,
  monthlyRate: number
): { annualGross: number; annualNet: number; taxImpact: number }
```
- `annualGross` = rooms × rate × 12
- `annualNet` = annualGross (no deductions for HDB — no property tax deduction, no maintenance deduction for owner-occupied)
- `taxImpact` = annualGross added to taxable income

**Input:** `rooms` (1-3 spinner) and `monthlyRate` (currency input with placeholder suggestions from `SUBLETTING_RATE_SUGGESTIONS` by flat type).

**Projection integration:** Subletting income as annual income stream from configured start age.

### P3: Lease Buyback Scheme

New function:
```ts
computeLbsProceeds(
  flatValue: number,        // market value (user input)
  remainingLease: number,
  retainedLease: number,    // from LBS_RETAINED_LEASE_OPTIONS
  currentAge: number,
  cpfRaBalance: number,
  retirementSum: number     // FRS target
): {
  totalProceeds: number;
  cpfRaTopUp: number;       // goes to RA up to FRS
  cashProceeds: number;     // remainder
  estimatedLifeBoost: number; // additional monthly CPF LIFE payout
}
```
- Proceeds = flatValue × (Bala's factor for remaining lease - Bala's factor for retained lease)
- CPF RA top-up = min(proceeds, retirementSum - cpfRaBalance)
- Cash = proceeds - cpfRaTopUp
- LIFE boost = estimated from RA top-up using existing `calculateCpfLifePayoutAtAge()`

**Tooltip on flatValue:** "HDB's assessed value may differ from market value. Results are indicative."

**Projection integration:** LBS proceeds as lump sum event at trigger age. Enhanced CPF LIFE payout as ongoing income.

### P4: Silver Housing Bonus (Deferred)

Not built in initial release. Note in design doc for future consideration. Policy-dependent, smallest financial impact, changes frequently.

### Simple vs Advanced

| Mode | HDB visibility |
|------|---------------|
| Simple | Strategy selector + key result summary (e.g., "Selling + renting could add ~$X to your investable portfolio"). Auto-computed with defaults. |
| Advanced | Full parameter inputs, CPF refund detail, break-even analysis, amortization schedule |

### Tests

- `hdb.test.ts` — CPF refund calculation, subletting income, LBS proceeds
- Update property tests — ensure CPF refund integration doesn't break existing flows
- Update integration tests — add HDB scenario

### Files to Create

- `frontend/src/lib/calculations/hdb.ts`
- `frontend/src/lib/calculations/__tests__/hdb.test.ts`
- `frontend/src/lib/data/hdbRates.ts`

### Files to Modify

- `frontend/src/stores/usePropertyStore.ts` — add HDB fields, bump version
- `frontend/src/lib/calculations/property.ts` — extend `calculateSellAndRent()` with CPF refund
- `frontend/src/components/property/PropertyInputForm.tsx` — HDB monetization sub-section
- `frontend/src/components/property/PropertyAnalysisPanel.tsx` — HDB results display
- `frontend/src/hooks/useProjection.ts` — HDB income streams + lump sums
- `frontend/src/lib/validation/schemas.ts` — HDB field validation
- `frontend/src/lib/validation/rules.ts` — HDB cross-store rules

---

## Implementation Order

| Phase | Workstream | Estimated Scope |
|-------|-----------|-----------------|
| **Phase 1** | Workstream 1: Simple/Advanced toggle | ~10 files, UI gating |
| **Phase 2** | Workstream 2: Quick Plan on StartPage | 1 file (StartPage.tsx) |
| **Phase 3** | Workstream 3: SRS lifecycle + bug fix | ~12 files, new calc module + projection/sim integration |
| **Phase 4** | Workstream 4 P1: HDB Sale-and-Rent + CPF refund | ~6 files, extends existing property |
| **Phase 5** | Workstream 4 P2: HDB Subletting | ~3 files, simple addition |
| **Phase 6** | Workstream 4 P3: HDB LBS | ~4 files, new calc + Bala's integration |

Phase 1 ships first because it's the cross-cutting infrastructure that all subsequent features need to be designed for (Simple vs Advanced gating).

---

## Verification Plan

After each phase:
1. `npm run type-check` — zero errors
2. `npm run lint` — passes
3. `npm run test` — all tests green, coverage ≥ 95% for calculations
4. Manual verification: toggle Simple/Advanced and confirm correct UI gating
5. Manual verification: new user flow (StartPage → Quick Plan → /inputs in Simple mode) is clean and unintimidating

Cross-cutting validation after all phases:
- Simple mode user journey: a new user in Simple mode should see ≤ 20 inputs on the entire /inputs page
- SRS: verify drawdown appears in projection table, reduces portfolio withdrawal in MC simulation
- HDB: verify CPF refund reduces sale proceeds correctly, subletting shows as income stream

---

## Deferred / Future Enhancements

- Per-section Simple/Advanced overrides
- Contextual explanation panel (right 1/3)
- SRS tax-bracket-optimized unequal drawdowns
- HDB CPF refund mini-calculator
- HDB monetization strategy combinations
- Silver Housing Bonus (P4)
