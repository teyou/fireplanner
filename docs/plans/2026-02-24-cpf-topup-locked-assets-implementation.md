# CPF Voluntary Top-Ups + Age-Gated Locked Assets — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add voluntary CPF top-up inputs (OA/SA/MA) and age-gated locked asset tracking so projections accurately reflect common Singapore savings strategies and illiquid holdings.

**Architecture:** Two mostly independent features sharing `types.ts`, `useProfileStore.ts`, and `schemas.ts`. Feature 1 (CPF top-ups) modifies the income projection loop and tax calculation. Feature 2 (locked assets) modifies FIRE metrics and bridge gap analysis. Both add UI to the Profile page.

**Tech Stack:** React 18, TypeScript, Zustand, Zod validation, Vitest

**Design doc:** `docs/plans/2026-02-24-cpf-topup-locked-assets-design.md`

---

## Phase 0: Data Fix (BHS Bug)

### Task 0.1: Fix MEDISAVE_BHS constant

**Files:**
- Modify: `frontend/src/lib/data/healthcarePremiums.ts:26-31`
- Modify: `frontend/src/lib/data/cpfRates.ts:98` (add new constant after ERS_BASE)
- Modify: `frontend/src/lib/validation/schemas.ts:200`

**Step 1: Fix the BHS value in healthcarePremiums.ts**

Change `MEDISAVE_BHS` from `37740` to `79000`. Update the comment to say "2026" and fix the description (it says "annual contribution limit" but BHS is actually the balance cap).

```typescript
// Before (line 26-31):
/**
 * MediSave Basic Healthcare Sum (BHS) — annual contribution limit.
 * Source: CPF Board (https://www.cpf.gov.sg/member/healthcare-financing/medisave)
 * As of: 2025
 */
export const MEDISAVE_BHS = 37740

// After:
/**
 * MediSave Basic Healthcare Sum (BHS) — maximum MediSave balance.
 * Once MA reaches BHS, further contributions overflow to OA/SA.
 * Source: https://www.cpf.gov.sg/member/infohub/news/news-releases/cpf-interest-rates-from-1-january-to-31-march-2026-and-basic-healthcare-sum-for-2026
 * As of: 2026
 */
export const MEDISAVE_BHS = 79000
```

**Step 2: Add CPF_ANNUAL_LIMIT to cpfRates.ts**

After `ERS_BASE` (line 98), add:

```typescript
// CPF Annual Limit — total mandatory + voluntary contributions cap per calendar year
// Source: https://www.cpf.gov.sg/member/growing-your-savings/saving-more-with-cpf/top-up-ordinary-special-and-medisave-savings
// As of: 2026
export const CPF_ANNUAL_LIMIT = 37740
```

**Step 3: Update schema that references old BHS**

In `schemas.ts` line 200, the MediSave top-up max is hardcoded as `37740`. Change to import `MEDISAVE_BHS`:

```typescript
// Before:
'healthcareConfig.mediSaveTopUpAnnual': z.number().min(0).max(37740),

// After:
'healthcareConfig.mediSaveTopUpAnnual': z.number().min(0).max(MEDISAVE_BHS),
```

Add import at top of schemas.ts: `import { MEDISAVE_BHS } from '@/lib/data/healthcarePremiums'`

**Step 4: Update validation rules that reference old BHS**

In `rules.ts` line 57, the validation message hardcodes `$37,740`. Update to use the constant:

```typescript
// Before:
if (profile.healthcareConfig.mediSaveTopUpAnnual < 0 || profile.healthcareConfig.mediSaveTopUpAnnual > MEDISAVE_BHS) {
  errors['healthcareConfig.mediSaveTopUpAnnual'] = `MediSave top-up must be between $0 and $${MEDISAVE_BHS.toLocaleString()}`
}
```

Check that `rules.ts` already imports `MEDISAVE_BHS` from the correct location. If it imports from `healthcarePremiums.ts`, the fix propagates automatically. If it hardcodes the value, update it.

**Step 5: Run tests**

Run: `cd frontend && npm run test -- --run`

All existing tests should pass. The BHS value change may break a test in `rules.test.ts` if it uses the old value — update the test's expected value.

**Step 6: Commit**

```bash
git add frontend/src/lib/data/healthcarePremiums.ts frontend/src/lib/data/cpfRates.ts frontend/src/lib/validation/schemas.ts frontend/src/lib/validation/rules.ts
git commit -m "fix: correct MEDISAVE_BHS to $79,000 (2026) and add CPF_ANNUAL_LIMIT constant"
```

---

## Phase 1: CPF Voluntary Top-Ups — Types & Constants

### Task 1.1: Add RSTU constants to cpfRates.ts

**Files:**
- Modify: `frontend/src/lib/data/cpfRates.ts:98` (after the CPF_ANNUAL_LIMIT added in Task 0.1)

**Step 1: Add constants**

```typescript
// Retirement Sum Top-Up (RSTU) — voluntary SA/RA cash top-up
// Tax relief: up to $8,000 for self, $8,000 for family members
// Source: https://www.iras.gov.sg/taxes/individual-income-tax/basics-of-individual-income-tax/tax-reliefs-rebates-and-deductions/tax-reliefs/central-provident-fund-(cpf)-cash-top-up-relief
// As of: 2026
export const RSTU_TAX_RELIEF_CAP = 8000
export const RSTU_FAMILY_TAX_RELIEF_CAP = 8000
```

**Step 2: Commit**

```bash
git add frontend/src/lib/data/cpfRates.ts
git commit -m "feat: add RSTU tax relief cap constants"
```

### Task 1.2: Add cpfTopUp fields to types and store

**Files:**
- Modify: `frontend/src/lib/types.ts:136` (after cpfRA line)
- Modify: `frontend/src/stores/useProfileStore.ts:32` (PROFILE_DATA_KEYS)
- Modify: `frontend/src/stores/useProfileStore.ts:73` (DEFAULT_PROFILE, after cpfRA)
- Modify: `frontend/src/stores/useProfileStore.ts:320` (bump persist version)

**Step 1: Add fields to ProfileState in types.ts**

After line 136 (`cpfRA: number`), add:

```typescript
  // Voluntary CPF Top-Ups (annual cash top-ups from take-home pay, pre-retirement only)
  cpfTopUpOA: number
  cpfTopUpSA: number   // RSTU: up to $8,000/yr tax relief
  cpfTopUpMA: number   // Capped at BHS minus current MA balance
```

**Step 2: Add to PROFILE_DATA_KEYS in useProfileStore.ts**

In the `PROFILE_DATA_KEYS` array (line 32), after `'srsDrawdownStartAge'`, add:

```typescript
  'cpfTopUpOA', 'cpfTopUpSA', 'cpfTopUpMA',
```

**Step 3: Add defaults in DEFAULT_PROFILE**

After `cpfRA: 0,` (line 73), add:

```typescript
  cpfTopUpOA: 0,
  cpfTopUpSA: 0,
  cpfTopUpMA: 0,
```

**Step 4: Bump persist version**

Change `version: 17` to `version: 18` on line 320. Add a migration case in the migrate function:

```typescript
if (version < 18) {
  const s = persisted as Record<string, unknown>
  if (s.cpfTopUpOA === undefined) s.cpfTopUpOA = 0
  if (s.cpfTopUpSA === undefined) s.cpfTopUpSA = 0
  if (s.cpfTopUpMA === undefined) s.cpfTopUpMA = 0
}
```

**Step 5: Commit**

```bash
git add frontend/src/lib/types.ts frontend/src/stores/useProfileStore.ts
git commit -m "feat: add voluntary CPF top-up fields to profile store"
```

---

## Phase 2: CPF Top-Ups — Validation

### Task 2.1: Add validation schemas for top-up fields

**Files:**
- Modify: `frontend/src/lib/validation/schemas.ts:196` (after cpfisSaReturn entry)
- Test: `frontend/src/lib/validation/schemas.test.ts`

**Step 1: Write the failing tests**

Add tests to `schemas.test.ts`:

```typescript
describe('cpfTopUp validation', () => {
  it('accepts valid SA top-up within RSTU cap', () => {
    expect(validateProfileField('cpfTopUpSA', 8000)).toBeNull()
  })

  it('rejects SA top-up exceeding RSTU cap', () => {
    expect(validateProfileField('cpfTopUpSA', 9000)).toBeTruthy()
  })

  it('accepts zero top-up', () => {
    expect(validateProfileField('cpfTopUpSA', 0)).toBeNull()
  })

  it('rejects negative top-up', () => {
    expect(validateProfileField('cpfTopUpSA', -100)).toBeTruthy()
  })

  it('accepts valid OA top-up', () => {
    expect(validateProfileField('cpfTopUpOA', 5000)).toBeNull()
  })

  it('accepts valid MA top-up', () => {
    expect(validateProfileField('cpfTopUpMA', 10000)).toBeNull()
  })

  it('rejects MA top-up exceeding BHS', () => {
    expect(validateProfileField('cpfTopUpMA', 80000)).toBeTruthy()
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run src/lib/validation/schemas.test.ts`

Expected: FAIL — `validateProfileField` returns null for unknown fields.

**Step 3: Add schemas**

In `schemas.ts`, add to the `fieldSchemas` object inside `validateProfileField` (after cpfisSaReturn entry ~line 197):

```typescript
import { RSTU_TAX_RELIEF_CAP, CPF_ANNUAL_LIMIT } from '@/lib/data/cpfRates'
import { MEDISAVE_BHS } from '@/lib/data/healthcarePremiums'

// Inside fieldSchemas:
cpfTopUpOA: z.number().min(0).max(CPF_ANNUAL_LIMIT),
cpfTopUpSA: z.number().min(0).max(RSTU_TAX_RELIEF_CAP),
cpfTopUpMA: z.number().min(0).max(MEDISAVE_BHS),
```

**Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run src/lib/validation/schemas.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/lib/validation/schemas.ts frontend/src/lib/validation/schemas.test.ts
git commit -m "feat: add validation schemas for CPF voluntary top-up fields"
```

---

## Phase 3: CPF Top-Ups — Tax Integration

### Task 3.1: Add RSTU deduction to tax calculation

**Files:**
- Modify: `frontend/src/lib/calculations/tax.ts:48-56`
- Test: `frontend/src/lib/calculations/tax.test.ts`

**Step 1: Write the failing test**

```typescript
describe('RSTU tax relief', () => {
  it('deducts SA top-up from chargeable income', () => {
    // $100K income, $20K CPF, $0 SRS, $0 reliefs, $8K RSTU
    const chargeable = calculateChargeableIncome(100000, 20000, 0, 0, 'citizen', 8000)
    // 100000 - 20000 - 8000 = 72000
    expect(chargeable).toBe(72000)
  })

  it('caps RSTU deduction at $8,000', () => {
    // Even if someone tops up more (impossible with validation, but defensive)
    const chargeable = calculateChargeableIncome(100000, 20000, 0, 0, 'citizen', 15000)
    // Still only 8000 deducted: 100000 - 20000 - 8000 = 72000
    expect(chargeable).toBe(72000)
  })

  it('handles zero RSTU top-up', () => {
    const chargeable = calculateChargeableIncome(100000, 20000, 0, 0, 'citizen', 0)
    expect(chargeable).toBe(80000)
  })

  it('handles undefined RSTU (backward compat)', () => {
    const chargeable = calculateChargeableIncome(100000, 20000, 0, 0, 'citizen')
    expect(chargeable).toBe(80000)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run src/lib/calculations/tax.test.ts`

Expected: FAIL — `calculateChargeableIncome` doesn't accept 6th parameter.

**Step 3: Add RSTU deduction**

Modify `calculateChargeableIncome` in `tax.ts` (line 48-57):

```typescript
import { RSTU_TAX_RELIEF_CAP } from '@/lib/data/cpfRates'

export function calculateChargeableIncome(
  totalIncome: number,
  cpfEmployee: number,
  srsContribution: number,
  personalReliefs: number,
  residencyStatus: 'citizen' | 'pr' | 'foreigner' = 'citizen',
  cpfCashTopUpSA: number = 0
): number {
  const srsDeduction = calculateSrsDeduction(srsContribution, residencyStatus)
  const rstuDeduction = Math.min(cpfCashTopUpSA, RSTU_TAX_RELIEF_CAP)
  return Math.max(0, totalIncome - cpfEmployee - srsDeduction - rstuDeduction - personalReliefs)
}
```

**Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run src/lib/calculations/tax.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/lib/calculations/tax.ts frontend/src/lib/calculations/tax.test.ts
git commit -m "feat: add RSTU tax relief deduction (up to $8K) for voluntary SA top-ups"
```

---

## Phase 4: CPF Top-Ups — Projection Integration

### Task 4.1: Wire top-ups into income projection

**Files:**
- Modify: `frontend/src/lib/calculations/income.ts:222-267` (IncomeProjectionParams — add 3 optional fields)
- Modify: `frontend/src/lib/calculations/income.ts:~458` (projection loop — add top-ups after employer contributions)
- Modify: `frontend/src/lib/calculations/income.ts:~517-523` (tax call — pass cpfTopUpSA)
- Modify: `frontend/src/lib/calculations/income.ts:~533` (savings calc — subtract top-ups)
- Test: `frontend/src/lib/calculations/income.test.ts`

**Step 1: Write the failing test**

```typescript
describe('voluntary CPF top-ups in projection', () => {
  it('SA top-up increases SA balance each pre-retirement year', () => {
    const params = {
      ...baseParams,          // a minimal valid params object
      cpfTopUpSA: 8000,
      initialCpfSA: 50000,
    }
    const withTopUp = generateIncomeProjection(params)
    const paramsNoTopUp = { ...params, cpfTopUpSA: 0 }
    const withoutTopUp = generateIncomeProjection(paramsNoTopUp)

    // At year 1 (second row), SA should be higher with top-up
    expect(withTopUp[1].cpfSA).toBeGreaterThan(withoutTopUp[1].cpfSA)
    // Difference should be approximately $8,000 + interest
    const diff = withTopUp[1].cpfSA - withoutTopUp[1].cpfSA
    expect(diff).toBeGreaterThanOrEqual(8000)
  })

  it('top-ups reduce annual savings (liquid portfolio contribution)', () => {
    const params = { ...baseParams, cpfTopUpSA: 8000, cpfTopUpOA: 2000 }
    const withTopUp = generateIncomeProjection(params)
    const paramsNoTopUp = { ...params, cpfTopUpSA: 0, cpfTopUpOA: 0 }
    const withoutTopUp = generateIncomeProjection(paramsNoTopUp)

    // Savings should be lower with top-ups (by approximately the sum minus tax benefit)
    expect(withTopUp[0].annualSavings).toBeLessThan(withoutTopUp[0].annualSavings)
  })

  it('MA top-up is capped at BHS minus current MA', () => {
    const params = {
      ...baseParams,
      cpfTopUpMA: 50000,
      initialCpfMA: 60000,  // close to BHS ($79,000)
    }
    const rows = generateIncomeProjection(params)
    // MA after year 0 should not exceed BHS (79000) + interest
    // With initial 60K + employer contributions + top-up capped at (79K - current MA),
    // MA should be near but not wildly above BHS
    expect(rows[0].cpfMA).toBeLessThanOrEqual(85000) // BHS + modest interest
  })

  it('no top-ups applied after retirement', () => {
    const params = {
      ...baseParams,
      currentAge: 60,
      retirementAge: 62,
      cpfTopUpSA: 8000,
      initialCpfSA: 0,  // SA closed at 60 (post-55), but testing RA overflow
    }
    const rows = generateIncomeProjection(params)
    // Find the first retired year
    const retiredRow = rows.find(r => r.isRetired)
    const preRetiredRow = rows.findLast(r => !r.isRetired)
    // RA or OA should not jump by $8K in retired years
    if (retiredRow && preRetiredRow) {
      // Post-retirement, the only RA changes should be interest and LIFE payout
      // Not an additional $8K top-up
      const raDiff = retiredRow.cpfRA - preRetiredRow.cpfRA
      expect(Math.abs(raDiff)).toBeLessThan(8000) // no top-up spike
    }
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run src/lib/calculations/income.test.ts`

Expected: FAIL — `cpfTopUpSA` not recognized in params or has no effect.

**Step 3: Add params and wire into projection**

3a. Add to `IncomeProjectionParams` (after line 266, before closing `}`):

```typescript
  // Voluntary CPF top-ups (pre-retirement only)
  cpfTopUpOA?: number
  cpfTopUpSA?: number
  cpfTopUpMA?: number
```

3b. In `generateIncomeProjection`, after the employer CPF contribution block (after line ~458, the closing `}` of the employer CPF section), add:

```typescript
    // Voluntary CPF top-ups (pre-retirement only)
    if (!isRetired) {
      const topUpOA = params.cpfTopUpOA ?? 0
      const topUpSA = params.cpfTopUpSA ?? 0
      const topUpMA = params.cpfTopUpMA ?? 0

      cpfOA += topUpOA

      if (saClosed) {
        // Post-55: SA top-up goes to RA (up to retirement sum target), overflow to OA
        const raRoom = Math.max(0, retirementSumTarget - cpfRA)
        const toRA = Math.min(topUpSA, raRoom)
        cpfRA += toRA
        cpfOA += topUpSA - toRA
      } else {
        cpfSA += topUpSA
      }

      // MA top-up capped at BHS - current MA
      const maRoom = Math.max(0, MEDISAVE_BHS - cpfMA)
      cpfMA += Math.min(topUpMA, maRoom)
    }
```

Import `MEDISAVE_BHS` at top of `income.ts`:
```typescript
import { MEDISAVE_BHS } from '@/lib/data/healthcarePremiums'
```

3c. Pass RSTU to tax calculation. In the `calculateChargeableIncome` call (~line 517-522), add 6th argument:

```typescript
    const chargeableIncome = calculateChargeableIncome(
      taxableIncome,
      cpfEmployee,
      srsContribution,
      params.personalReliefs,
      params.residencyStatus,
      (!isRetired ? (params.cpfTopUpSA ?? 0) : 0)
    )
```

3d. Adjust savings calculation (~line 533). Currently:
```typescript
const annualSavings = savingsPaused ? 0 : Math.max(0, totalNet - inflationAdjustedExpenses)
```

Change to:
```typescript
    const voluntaryTopUps = !isRetired
      ? (params.cpfTopUpOA ?? 0) + (params.cpfTopUpSA ?? 0) + (params.cpfTopUpMA ?? 0)
      : 0
    const annualSavings = savingsPaused ? 0 : Math.max(0, totalNet - inflationAdjustedExpenses - voluntaryTopUps)
```

Note: `totalNet` already has CPF employee deducted (line 528: `totalGross - sgTax - cpfEmployee`). The voluntary top-ups are additional cash outflows the user chooses to make, reducing what flows to the liquid portfolio. Tax benefit from RSTU is already reflected in the lower `sgTax`.

**Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run src/lib/calculations/income.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/lib/calculations/income.ts frontend/src/lib/calculations/income.test.ts
git commit -m "feat: integrate voluntary CPF top-ups into income projection and tax"
```

### Task 4.2: Pass top-up params from hooks

**Files:**
- Modify: `frontend/src/hooks/useIncomeProjection.ts:55-75` (buildProjectionParams)
- Modify: `frontend/src/hooks/useFireCalculations.ts:47-76` (inline projection call)

**Step 1: Add params to buildProjectionParams**

In `useIncomeProjection.ts`, after `cpfisSaReturn` (line 74), add:

```typescript
    cpfTopUpOA: profile.cpfTopUpOA,
    cpfTopUpSA: profile.cpfTopUpSA,
    cpfTopUpMA: profile.cpfTopUpMA,
```

**Step 2: Add params to useFireCalculations inline projection**

In `useFireCalculations.ts`, inside the `generateIncomeProjection({...})` call (~line 47-76), add after `cpfMortgageYearsLeft`:

```typescript
        cpfTopUpOA: profile.cpfTopUpOA,
        cpfTopUpSA: profile.cpfTopUpSA,
        cpfTopUpMA: profile.cpfTopUpMA,
```

Also add these to the useMemo dependency array at the bottom of the hook.

**Step 3: Run full test suite**

Run: `cd frontend && npm run test -- --run`

Expected: PASS (no behavioral change yet since defaults are 0)

**Step 4: Commit**

```bash
git add frontend/src/hooks/useIncomeProjection.ts frontend/src/hooks/useFireCalculations.ts
git commit -m "feat: pass CPF top-up params from profile store to projection hooks"
```

---

## Phase 5: CPF Top-Ups — UI

### Task 5.1: Add Voluntary Top-Ups UI to CpfSection

**Files:**
- Modify: `frontend/src/components/profile/CpfSection.tsx`

**Step 1: Add the UI**

In `CpfSection.tsx`, destructure the new fields from the store (line 26):

```typescript
const {
  currentAge, annualIncome, cpfOA, cpfSA, cpfMA, cpfRA,
  cpfTopUpOA, cpfTopUpSA, cpfTopUpMA,  // ADD THESE
  cpfLifeStartAge, cpfLifePlan, cpfRetirementSum,
  // ... rest
} = useProfileStore()
```

Add a "Voluntary Top-Ups" collapsible section. Place it after the "Current CPF Status" card but before the CPF LIFE section. Use the existing UI patterns (Card + CardContent):

```tsx
{/* Voluntary Top-Ups */}
<Card>
  <CardHeader>
    <CardTitle className="text-lg">Voluntary Top-Ups</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <CurrencyInput
        label="Annual SA Top-Up (RSTU)"
        value={cpfTopUpSA}
        onChange={(v) => setField('cpfTopUpSA', v)}
        error={validationErrors.cpfTopUpSA}
        tooltip="Cash top-up to SA (or RA if 55+). Up to $8,000/year qualifies for tax relief. Source: IRAS."
      />
      <CurrencyInput
        label="Annual MA Top-Up"
        value={cpfTopUpMA}
        onChange={(v) => setField('cpfTopUpMA', v)}
        error={validationErrors.cpfTopUpMA}
        tooltip="Voluntary MediSave contribution. Capped at BHS ($79,000) minus your current MA balance each year."
      />
      <CurrencyInput
        label="Annual OA Top-Up"
        value={cpfTopUpOA}
        onChange={(v) => setField('cpfTopUpOA', v)}
        error={validationErrors.cpfTopUpOA}
        tooltip="Voluntary cash top-up to OA. No specific tax relief for OA top-ups."
      />
    </div>
    <p className="text-xs text-muted-foreground mt-2">
      Top-ups are applied pre-retirement only and reduce your annual liquid savings.
    </p>
  </CardContent>
</Card>
```

**Step 2: Run type-check and dev server**

Run: `cd frontend && npm run type-check`
Run: `cd frontend && npm run dev -- --port 5173`

Verify the UI renders correctly in the browser.

**Step 3: Commit**

```bash
git add frontend/src/components/profile/CpfSection.tsx
git commit -m "feat: add Voluntary Top-Ups UI section for OA/SA/MA"
```

---

## Phase 6: Locked Assets — Types & Store

### Task 6.1: Add LockedAsset type and ProfileState field

**Files:**
- Modify: `frontend/src/lib/types.ts` (add interface before ProfileState; add field to ProfileState)
- Modify: `frontend/src/lib/types.ts:316-340` (add fields to FireMetrics)
- Modify: `frontend/src/stores/useProfileStore.ts` (add defaults, actions, migration)

**Step 1: Add LockedAsset interface to types.ts**

Before `ProfileState` (before line 120), add:

```typescript
export interface LockedAsset {
  id: string
  name: string
  amount: number
  unlockAge: number
  growthRate: number
}
```

**Step 2: Add to ProfileState**

After `financialGoals: FinancialGoal[]` (line 196), add:

```typescript
  // Age-Gated Locked Assets (illiquid holdings that become accessible at a specific age)
  lockedAssets: LockedAsset[]
```

**Step 3: Add to FireMetrics**

After `liquidDepletionAge: number | null` (line 332), add:

```typescript
  lockedAssetsTotal: number
  accessibleNetWorth: number
  totalNetWorthWithLocked: number
```

**Step 4: Add to store**

In `useProfileStore.ts`:

4a. Import `LockedAsset` in the import line (line 3).

4b. Add CRUD actions to `ProfileActions` interface (after `clearFinancialGoals`):

```typescript
  addLockedAsset: (asset: LockedAsset) => void
  removeLockedAsset: (id: string) => void
  updateLockedAsset: (id: string, updates: Partial<Omit<LockedAsset, 'id'>>) => void
```

4c. Add `'lockedAssets'` to `PROFILE_DATA_KEYS` array (after `'financialGoals'`).

4d. Add default in `DEFAULT_PROFILE` (after `financialGoals: []`):

```typescript
  lockedAssets: [],
```

4e. Implement the CRUD actions in the store (follow the `financialGoals` pattern exactly — `addFinancialGoal`, `removeFinancialGoal`, `updateFinancialGoal`):

```typescript
addLockedAsset: (asset) =>
  set((state) => ({
    lockedAssets: [...state.lockedAssets, asset],
  })),
removeLockedAsset: (id) =>
  set((state) => ({
    lockedAssets: state.lockedAssets.filter((a) => a.id !== id),
  })),
updateLockedAsset: (id, updates) =>
  set((state) => ({
    lockedAssets: state.lockedAssets.map((a) =>
      a.id === id ? { ...a, ...updates } : a
    ),
  })),
```

4f. Bump persist version to 19 (or whatever is current + 1). Add migration:

```typescript
if (version < 19) {
  const s = persisted as Record<string, unknown>
  if (s.lockedAssets === undefined) s.lockedAssets = []
}
```

**Step 5: Commit**

```bash
git add frontend/src/lib/types.ts frontend/src/stores/useProfileStore.ts
git commit -m "feat: add LockedAsset type, ProfileState field, and store CRUD actions"
```

---

## Phase 7: Locked Assets — Validation

### Task 7.1: Add validation for locked assets

**Files:**
- Modify: `frontend/src/lib/validation/schemas.ts`
- Modify: `frontend/src/lib/validation/rules.ts`
- Test: `frontend/src/lib/validation/schemas.test.ts`
- Test: `frontend/src/lib/validation/rules.test.ts`

**Step 1: Write failing tests**

In `schemas.test.ts`:

```typescript
describe('lockedAsset validation', () => {
  it('accepts valid locked asset fields', () => {
    expect(validateProfileField('lockedAsset.amount', 50000)).toBeNull()
    expect(validateProfileField('lockedAsset.unlockAge', 55)).toBeNull()
    expect(validateProfileField('lockedAsset.growthRate', 0.05)).toBeNull()
  })

  it('rejects invalid locked asset fields', () => {
    expect(validateProfileField('lockedAsset.amount', -100)).toBeTruthy()
    expect(validateProfileField('lockedAsset.amount', 0)).toBeTruthy()
    expect(validateProfileField('lockedAsset.unlockAge', 15)).toBeTruthy()
    expect(validateProfileField('lockedAsset.growthRate', 0.25)).toBeTruthy()
  })
})
```

In `rules.test.ts`:

```typescript
describe('locked assets cross-store rules', () => {
  it('catches locked asset with unlockAge <= currentAge', () => {
    const profile = {
      ...validProfile,
      currentAge: 35,
      lockedAssets: [{ id: '1', name: 'Test', amount: 10000, unlockAge: 30, growthRate: 0 }],
    }
    const errors = validateProfileConsistency(profile)
    expect(errors['lockedAssets.0.unlockAge']).toBeTruthy()
  })

  it('accepts locked asset with unlockAge > currentAge', () => {
    const profile = {
      ...validProfile,
      currentAge: 35,
      lockedAssets: [{ id: '1', name: 'Test', amount: 10000, unlockAge: 55, growthRate: 0 }],
    }
    const errors = validateProfileConsistency(profile)
    expect(errors['lockedAssets.0.unlockAge']).toBeUndefined()
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run src/lib/validation`

**Step 3: Add schemas**

In `schemas.ts` `validateProfileField`, add to `fieldSchemas`:

```typescript
'lockedAsset.name': z.string().min(1).max(50),
'lockedAsset.amount': z.number().gt(0).max(100_000_000),
'lockedAsset.unlockAge': z.number().int().min(18).max(120),
'lockedAsset.growthRate': z.number().min(0).max(0.20),
```

In `rules.ts` `validateProfileConsistency`, add a loop for locked assets:

```typescript
// Locked asset cross-store rules
if (profile.lockedAssets) {
  for (let i = 0; i < profile.lockedAssets.length; i++) {
    const asset = profile.lockedAssets[i]
    if (asset.unlockAge <= profile.currentAge) {
      errors[`lockedAssets.${i}.unlockAge`] = 'Unlock age must be greater than current age'
    }
    if (asset.unlockAge > profile.lifeExpectancy) {
      errors[`lockedAssets.${i}.unlockAge`] = 'Unlock age must not exceed life expectancy'
    }
  }
  if (profile.lockedAssets.length > 10) {
    errors['lockedAssets'] = 'Maximum 10 locked assets'
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run src/lib/validation`

**Step 5: Commit**

```bash
git add frontend/src/lib/validation/schemas.ts frontend/src/lib/validation/schemas.test.ts frontend/src/lib/validation/rules.ts frontend/src/lib/validation/rules.test.ts
git commit -m "feat: add validation for locked asset fields and cross-store rules"
```

---

## Phase 8: Locked Assets — FIRE Calculation Integration

### Task 8.1: Add locked assets to FIRE metrics

**Files:**
- Modify: `frontend/src/lib/calculations/fire.ts:240-414` (calculateAllFireMetrics)
- Test: `frontend/src/lib/calculations/fire.test.ts`

**Step 1: Write failing tests**

```typescript
describe('locked assets in FIRE metrics', () => {
  it('includes locked assets in total net worth', () => {
    const metrics = calculateAllFireMetrics({
      ...baseFireParams,
      liquidNetWorth: 500000,
      cpfTotal: 200000,
      lockedAssets: [
        { id: '1', name: 'RSUs', amount: 100000, unlockAge: 40, growthRate: 0 },
      ],
    })
    expect(metrics.totalNetWorthWithLocked).toBe(500000 + 200000 + 100000)
  })

  it('excludes locked assets from accessible net worth', () => {
    const metrics = calculateAllFireMetrics({
      ...baseFireParams,
      liquidNetWorth: 500000,
      lockedAssets: [
        { id: '1', name: 'RSUs', amount: 100000, unlockAge: 40, growthRate: 0 },
      ],
    })
    // accessibleNetWorth should equal liquidNetWorth (locked assets not accessible yet)
    expect(metrics.accessibleNetWorth).toBe(500000)
  })

  it('returns zero lockedAssetsTotal when no locked assets', () => {
    const metrics = calculateAllFireMetrics({ ...baseFireParams })
    expect(metrics.lockedAssetsTotal).toBe(0)
    expect(metrics.totalNetWorthWithLocked).toBe(metrics.totalNetWorth)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run src/lib/calculations/fire.test.ts`

Expected: FAIL — `lockedAssets` not in params, `totalNetWorthWithLocked` not in result.

**Step 3: Implement**

In `calculateAllFireMetrics` params type (around line 240), add:

```typescript
  lockedAssets?: LockedAsset[]
```

Import `LockedAsset` from types.

In the function body (~line 276-280), after `const totalNetWorth = investableLiquid + cpfTotal`:

```typescript
  const lockedAssets = params.lockedAssets ?? []
  const lockedAssetsTotal = lockedAssets.reduce((sum, a) => sum + a.amount, 0)
  const accessibleNetWorth = investableLiquid  // liquid NW minus cash reserve
  const totalNetWorthWithLocked = totalNetWorth + lockedAssetsTotal
```

In the return object (~line 390-413), add after `totalNWIncProperty`:

```typescript
    lockedAssetsTotal,
    accessibleNetWorth,
    totalNetWorthWithLocked,
```

**Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run src/lib/calculations/fire.test.ts`

**Step 5: Commit**

```bash
git add frontend/src/lib/calculations/fire.ts frontend/src/lib/calculations/fire.test.ts
git commit -m "feat: add locked assets to FIRE metrics (total NW, accessible NW)"
```

### Task 8.2: Pass locked assets from hook

**Files:**
- Modify: `frontend/src/hooks/useFireCalculations.ts:110-131`

**Step 1: Pass lockedAssets to calculateAllFireMetrics**

In `useFireCalculations.ts`, in the `calculateAllFireMetrics({...})` call (~line 110-131), add after `cashReserveOffset`:

```typescript
      lockedAssets: profile.lockedAssets,
```

Add `profile.lockedAssets` to the useMemo dependency array.

**Step 2: Run type-check**

Run: `cd frontend && npm run type-check`

Expected: PASS

**Step 3: Commit**

```bash
git add frontend/src/hooks/useFireCalculations.ts
git commit -m "feat: pass locked assets from profile store to FIRE calculations hook"
```

---

## Phase 9: Locked Assets — Projection Integration

### Task 9.1: Add locked asset unlock events to projection

**Files:**
- Modify: `frontend/src/lib/calculations/income.ts` (IncomeProjectionParams, projection loop)
- Modify: `frontend/src/lib/types.ts` (add `lockedAssetUnlock` to IncomeProjectionRow)
- Modify: `frontend/src/hooks/useIncomeProjection.ts` (pass lockedAssets)
- Test: `frontend/src/lib/calculations/income.test.ts`

**Step 1: Write failing test**

```typescript
describe('locked asset unlock in projection', () => {
  it('adds unlocked asset value to liquid NW at unlock age', () => {
    const params = {
      ...baseParams,
      currentAge: 30,
      lockedAssets: [
        { id: '1', name: 'RSUs', amount: 50000, unlockAge: 35, growthRate: 0.05 },
      ],
    }
    const rows = generateIncomeProjection(params)
    const unlockRow = rows.find(r => r.age === 35)
    // At age 35 (5 years growth at 5%): 50000 * 1.05^5 ≈ 63814
    expect(unlockRow?.lockedAssetUnlock).toBeCloseTo(50000 * Math.pow(1.05, 5), 0)
  })

  it('returns 0 for lockedAssetUnlock in non-unlock years', () => {
    const params = {
      ...baseParams,
      currentAge: 30,
      lockedAssets: [
        { id: '1', name: 'RSUs', amount: 50000, unlockAge: 35, growthRate: 0 },
      ],
    }
    const rows = generateIncomeProjection(params)
    const nonUnlockRow = rows.find(r => r.age === 32)
    expect(nonUnlockRow?.lockedAssetUnlock).toBe(0)
  })
})
```

**Step 2: Run tests to verify they fail**

**Step 3: Implement**

3a. Add to `IncomeProjectionRow` in `types.ts` (after `srsWithdrawal` field):

```typescript
  lockedAssetUnlock: number  // Value of locked assets that unlock at this age
```

3b. Add to `IncomeProjectionParams` in `income.ts`:

```typescript
  lockedAssets?: LockedAsset[]
```

Import `LockedAsset` from types.

3c. In the projection loop body, before the `rows.push({...})` call (~line 546), calculate unlock amount:

```typescript
    // Locked asset unlocks
    let lockedAssetUnlock = 0
    for (const asset of (params.lockedAssets ?? [])) {
      if (age === asset.unlockAge) {
        const yearsGrown = asset.unlockAge - params.currentAge
        lockedAssetUnlock += asset.amount * Math.pow(1 + asset.growthRate, yearsGrown)
      }
    }
```

3d. Add `lockedAssetUnlock` to the `rows.push({...})` object.

3e. In `useIncomeProjection.ts` `buildProjectionParams`, add:

```typescript
    lockedAssets: profile.lockedAssets,
```

And in the `useFireCalculations.ts` inline projection call, add:

```typescript
        lockedAssets: profile.lockedAssets,
```

**Step 4: Run tests**

Run: `cd frontend && npx vitest run src/lib/calculations/income.test.ts`

**Step 5: Commit**

```bash
git add frontend/src/lib/types.ts frontend/src/lib/calculations/income.ts frontend/src/lib/calculations/income.test.ts frontend/src/hooks/useIncomeProjection.ts frontend/src/hooks/useFireCalculations.ts
git commit -m "feat: add locked asset unlock events to income projection"
```

---

## Phase 10: Locked Assets — UI

### Task 10.1: Add Locked Assets table to FinancialSection

**Files:**
- Modify: `frontend/src/components/profile/FinancialSection.tsx`

**Step 1: Add the UI**

Import needed components and the store's locked asset actions. Add a "Locked Assets" section after the existing financial inputs. Follow the existing pattern used for `cpfOaWithdrawals` or `financialGoals` (editable table with Add/Remove).

```tsx
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { PercentInput } from '@/components/shared/PercentInput'
import { NumberInput } from '@/components/shared/NumberInput'
import { Input } from '@/components/ui/input'
import { InfoTooltip } from '@/components/shared/InfoTooltip'

// Inside the component, destructure:
const { lockedAssets, addLockedAsset, removeLockedAsset, updateLockedAsset } = useProfileStore()

// After the existing CurrencyInput fields, add:
{/* Locked Assets */}
{(lockedAssets.length > 0 || mode === 'advanced') && (
  <div className="col-span-full mt-4">
    <div className="flex items-center gap-2 mb-3">
      <h4 className="text-sm font-medium">Locked Assets</h4>
      <InfoTooltip content="Illiquid holdings that become accessible at a specific age (e.g., employer RSUs, fixed deposits, foreign pensions). Entered separately from Liquid Net Worth — not double-counted." />
    </div>
    {lockedAssets.map((asset, i) => (
      <div key={asset.id} className="grid grid-cols-[1fr_120px_80px_80px_32px] gap-2 mb-2 items-end">
        <div>
          {i === 0 && <Label className="text-xs text-muted-foreground mb-1">Name</Label>}
          <Input
            value={asset.name}
            onChange={(e) => updateLockedAsset(asset.id, { name: e.target.value })}
            placeholder="e.g., Employer RSUs"
            className="h-9"
          />
        </div>
        <div>
          {i === 0 && <Label className="text-xs text-muted-foreground mb-1">Amount</Label>}
          <CurrencyInput
            value={asset.amount}
            onChange={(v) => updateLockedAsset(asset.id, { amount: v })}
          />
        </div>
        <div>
          {i === 0 && <Label className="text-xs text-muted-foreground mb-1">Unlock Age</Label>}
          <NumberInput
            value={asset.unlockAge}
            onChange={(v) => updateLockedAsset(asset.id, { unlockAge: v })}
          />
        </div>
        <div>
          {i === 0 && <Label className="text-xs text-muted-foreground mb-1">Growth</Label>}
          <PercentInput
            value={asset.growthRate}
            onChange={(v) => updateLockedAsset(asset.id, { growthRate: v })}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-9 w-9", i === 0 && "mt-5")}
          onClick={() => removeLockedAsset(asset.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ))}
    {lockedAssets.length < 10 && (
      <Button
        variant="outline"
        size="sm"
        onClick={() => addLockedAsset({
          id: crypto.randomUUID(),
          name: '',
          amount: 0,
          unlockAge: store.currentAge + 10,
          growthRate: 0,
        })}
        className="mt-1"
      >
        <Plus className="h-4 w-4 mr-1" /> Add Locked Asset
      </Button>
    )}
  </div>
)}
```

**Step 2: Run type-check and dev server**

Run: `cd frontend && npm run type-check`
Run: `cd frontend && npm run dev -- --port 5173`

Verify the locked assets table renders, Add/Remove works, inputs update the store.

**Step 3: Commit**

```bash
git add frontend/src/components/profile/FinancialSection.tsx
git commit -m "feat: add Locked Assets editable table to Financial Snapshot section"
```

---

## Phase 11: Final Verification

### Task 11.1: Full test suite and type-check

**Step 1: Run all checks**

```bash
cd frontend && npm run type-check && npm run lint && npm run test -- --run
```

All must pass.

**Step 2: Manual verification**

Open the app at `http://localhost:5173`, navigate to Profile:
- Verify Voluntary Top-Ups section appears in CPF section with 3 inputs
- Enter $8,000 SA top-up, check that projection shows higher SA balance
- Verify tax calculation reflects RSTU relief
- Add a locked asset, verify it shows in Financial Snapshot
- Check that FIRE metrics on the dashboard reflect locked assets in total NW

**Step 3: Commit any final fixes**

---

## Parallelism Analysis

**Two independent workstreams:**

| Agent | Tasks | Shared Files |
|-------|-------|-------------|
| Agent 1: CPF Top-Ups | 0.1, 1.1, 1.2, 2.1, 3.1, 4.1, 4.2, 5.1 | types.ts, useProfileStore.ts, schemas.ts |
| Agent 2: Locked Assets | 6.1, 7.1, 8.1, 8.2, 9.1, 10.1 | types.ts, useProfileStore.ts, schemas.ts, fire.ts |

**Dependency edges:**
- Task 0.1 (BHS fix) must complete before both agents start (shared constant)
- Agent 2 Task 6.1 modifies `types.ts` which Agent 1 Task 1.2 also modifies — run Task 0.1 first, then 1.2 and 6.1 concurrently (they touch different sections of the file)
- Both agents bump `useProfileStore` persist version — the second agent to finish must merge the migration

**Recommended: Run sequentially** (Agent 1 then Agent 2) to avoid merge conflicts on shared files. Total is ~13 tasks, each 2-5 minutes = ~45-60 min.
