# CPF Voluntary Top-Ups + Age-Gated Locked Assets

**Date:** 2026-02-24
**Status:** Approved
**Origin:** User feedback requesting (1) CPF top-up inputs for accurate projections, (2) customisable liquid/illiquid asset classification for early retirees.

## Feature 1: Voluntary CPF Top-Ups (OA/SA/MA)

### Problem

Users who regularly top up their CPF SA, MA, or OA see inaccurate projections because the app only models employer contributions. Voluntary top-ups (especially RSTU for SA) are a common optimisation strategy in Singapore.

### Data Model

Three new fields in `ProfileState`:

```typescript
cpfTopUpOA: number    // Annual voluntary OA top-up (default 0)
cpfTopUpSA: number    // Annual voluntary SA top-up / RSTU (default 0)
cpfTopUpMA: number    // Annual voluntary MA top-up (default 0)
```

Applied **pre-retirement only** (no top-ups after retirement age).

### New Constants in `cpfRates.ts`

```typescript
export const RSTU_TAX_RELIEF_CAP = 8000        // Self top-up tax relief cap
export const RSTU_FAMILY_TAX_RELIEF_CAP = 8000  // Family member top-up relief cap
export const CPF_ANNUAL_LIMIT = 37740            // Total CPF contributions cap/year
```

### Data Fix: MEDISAVE_BHS

`MEDISAVE_BHS` in `healthcarePremiums.ts` is currently `37740` (labelled "As of: 2025"). This is wrong: $37,740 is the CPF Annual Limit, not the BHS. Correct values:
- 2025 BHS: $75,500
- 2026 BHS: **$79,000**

Fix: Update `MEDISAVE_BHS = 79000` with correct source and date.

### Calculation Changes

#### `income.ts` projection loop (~line 458)

After employer CPF contributions are added, apply voluntary top-ups for pre-retirement years:

```
if (!isRetired) {
  cpfOA += params.cpfTopUpOA
  // SA top-up: if SA closed (age >= 55), overflow to RA (up to ERS), then OA
  if (saClosed) {
    // Route through post-55 allocation logic (RA if room, else OA)
    cpfRA += min(params.cpfTopUpSA, retirementSumTarget - cpfRA)
    cpfOA += max(0, params.cpfTopUpSA - (retirementSumTarget - cpfRA))
  } else {
    cpfSA += params.cpfTopUpSA
  }
  // MA top-up: capped at BHS - current MA balance
  cpfMA += min(params.cpfTopUpMA, max(0, MEDISAVE_BHS - cpfMA))
}
```

#### `tax.ts` — RSTU tax relief

`calculateChargeableIncome` gets a new optional parameter:

```typescript
cpfCashTopUpSA?: number  // voluntary SA top-up amount
```

Deduction: `min(cpfCashTopUpSA, RSTU_TAX_RELIEF_CAP)` is subtracted from chargeable income, alongside existing CPF employee and SRS deductions.

#### `income.ts` — net savings impact

Voluntary top-ups come from take-home pay. They reduce `annualSavings` (the amount flowing into the liquid portfolio). The projection already computes savings as income minus expenses minus contributions. Top-ups must be subtracted from the liquid savings line:

```
netSavings = grossIncome - expenses - cpfEmployee - srsContribution
           - cpfTopUpOA - cpfTopUpSA - cpfTopUpMA
```

### Validation

| Field | Min | Max | Notes |
|-------|-----|-----|-------|
| `cpfTopUpOA` | 0 | CPF_ANNUAL_LIMIT | Rarely used; no specific scheme |
| `cpfTopUpSA` | 0 | 8,000 | RSTU self top-up cap (tax relief limit) |
| `cpfTopUpMA` | 0 | 79,000 | BHS cap; effective cap is BHS - current MA |

### UI

In `CpfSection.tsx`, add a collapsible "Voluntary Top-Ups" subsection with three `CurrencyInput` fields:
- Annual SA Top-Up (RSTU) — tooltip: "Cash top-up to SA (or RA if 55+). Up to $8,000/year qualifies for tax relief."
- Annual MA Top-Up — tooltip: "Voluntary MediSave contribution. Capped at BHS ($79,000) minus your current MA balance."
- Annual OA Top-Up — tooltip: "Voluntary cash top-up to OA. No specific tax relief for OA top-ups."

### Tests

- `cpf.test.ts`: SA top-up adds to SA balance each year; overflows to RA post-55
- `tax.test.ts`: RSTU deduction reduces chargeable income; capped at $8,000
- `income.test.ts`: Top-ups reduce net savings; MA top-up capped at BHS
- Projection integration: user with $8K SA top-up has higher SA balance at 55 than without

---

## Feature 2: Age-Gated Locked Assets

### Problem

Early retirees (before 55/65) can't access CPF, but may also have other illiquid assets: employer RSUs with vesting schedules, fixed deposits, foreign pensions, property sale proceeds at a future date. Currently there's no way to model these. The `cpfDependency` flag handles CPF specifically but nothing else.

### Data Model

New type in `types.ts`:

```typescript
interface LockedAsset {
  id: string           // UUID
  name: string         // e.g. "Employer RSUs", "Fixed Deposit"
  amount: number       // Current value
  unlockAge: number    // Age at which this becomes accessible
  growthRate: number   // Expected annual growth rate (default 0)
}
```

Add to `ProfileState`:

```typescript
lockedAssets: LockedAsset[]  // default []
```

**Additive model:** Locked assets are entered *separately* from `liquidNetWorth`. Users enter their accessible liquid NW as today's number, then add locked assets on top. No double-counting risk.

### Calculation Changes

#### `fire.ts` — accessible net worth

New derived values in `FireMetrics`:

```typescript
lockedAssetsTotal: number       // sum of all locked assets (current value)
accessibleNetWorth: number      // liquidNetWorth (excludes locked + CPF)
totalNetWorthWithLocked: number // liquidNetWorth + cpfTotal + lockedAssetsTotal
```

FIRE progress uses `totalNetWorthWithLocked` (your full picture). Bridge gap analysis uses `accessibleNetWorth` (what you can actually spend).

#### Bridge gap generalisation

Currently `cpfDependency` checks `liquidProgress < 1 && progress >= 1`. Generalise:

- At retirement age, compute `accessibleAtRetirement = liquidNW_projected + sum(locked assets where unlockAge <= retirementAge, grown at their rate)`
- Assets that unlock between retirement and CPF LIFE start age reduce the bridge gap
- The bridge gap warning message lists which locked assets help and when

#### Year-by-year projection

Each locked asset grows at its `growthRate`. At `unlockAge`, the grown value transfers into the liquid portfolio:

```
for each locked asset:
  if age == asset.unlockAge:
    liquidNW += asset.amount * (1 + asset.growthRate)^(age - currentAge)
```

This appears as a one-time inflow in the projection row for that year.

### Validation

| Field | Rule |
|-------|------|
| `name` | Non-empty string, max 50 chars |
| `amount` | > 0 |
| `unlockAge` | > currentAge, <= lifeExpectancy |
| `growthRate` | 0 to 0.20 (0-20%) |
| Array length | Max 10 entries |

### UI

In the Financial Snapshot section of `ProfilePage`, add a "Locked Assets" subsection (collapsible, hidden when empty). Table with columns: Name, Amount, Unlock Age, Growth Rate, Remove button. "Add Locked Asset" button below.

Each row: text input, CurrencyInput, number input, PercentInput, trash icon.

### Tests

- `fire.test.ts`: locked assets excluded from accessible NW; included in total NW
- `fire.test.ts`: bridge gap reduced when locked asset unlocks before CPF LIFE
- `income.test.ts`: locked asset value appears in projection at unlock age
- Validation: rejects unlockAge <= currentAge, amount <= 0

---

## Files Touched

### Feature 1 (CPF Top-Ups)
- `lib/types.ts` — add 3 fields to ProfileState
- `lib/data/cpfRates.ts` — add RSTU and annual limit constants
- `lib/data/healthcarePremiums.ts` — fix MEDISAVE_BHS to 79000
- `lib/calculations/income.ts` — apply top-ups in projection loop, reduce net savings
- `lib/calculations/tax.ts` — add RSTU deduction
- `lib/validation/schemas.ts` — add validation for 3 new fields
- `lib/validation/rules.ts` — cross-store rule: top-ups only pre-retirement
- `stores/useProfileStore.ts` — add defaults, persist migration
- `hooks/useIncomeProjection.ts` — pass new params
- `components/profile/CpfSection.tsx` — add Voluntary Top-Ups UI
- Tests: `cpf.test.ts`, `tax.test.ts`, `income.test.ts`, `schemas.test.ts`, `rules.test.ts`

### Feature 2 (Locked Assets)
- `lib/types.ts` — add LockedAsset interface, add to ProfileState and FireMetrics
- `lib/calculations/fire.ts` — accessible NW, bridge gap generalisation
- `lib/calculations/income.ts` — unlock events in projection
- `lib/validation/schemas.ts` — locked asset validation
- `stores/useProfileStore.ts` — add defaults, persist migration
- `hooks/useFireCalculations.ts` — pass locked assets
- `components/profile/FinancialSection.tsx` — add Locked Assets table
- Tests: `fire.test.ts`, `income.test.ts`, `schemas.test.ts`

### Shared
- `lib/data/healthcarePremiums.ts` — BHS fix (used by both features' validation)

## Parallelism

These two features are **mostly independent**:
- Feature 1 touches CPF projection + tax. Feature 2 touches FIRE metrics + bridge gap.
- Shared touchpoints: `types.ts`, `useProfileStore.ts`, `schemas.ts` (merge carefully).
- Can be developed in parallel by two agents, with a merge step at the end.
