# CPF Accuracy Fix + Transparency Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix FRS projection time-drift bug, update to 2026 base data, and add an assumptions panel + milestone tooltips for financial planner auditability.

**Architecture:** Pure data + calculation fix (cpfRates.ts, cpf.ts), one new presentational component (CpfAssumptionsPanel), and tooltip enrichment on CpfProjectionTable. All changes are client-side.

**Tech Stack:** TypeScript, React, Vitest, shadcn/ui, TanStack Table

---

### Task 1: Update cpfRates.ts Constants

**Files:**
- Modify: `frontend/src/lib/data/cpfRates.ts:89-93`

**Step 1: Update the BRS/FRS/ERS constants**

Replace lines 89-93:

```ts
// BRS/FRS/ERS (2024 values)
export const BRS_2024 = 106500
export const FRS_2024 = 213000
export const ERS_2024 = 426000
export const BRS_GROWTH_RATE = 0.035 // 3.5% p.a.
```

With:

```ts
// BRS/FRS/ERS — base year values for cohort turning 55 in RETIREMENT_SUM_BASE_YEAR
// Source: https://www.cpf.gov.sg/service/article/what-are-the-retirement-sums-basic-retirement-sum-brs-full-retirement-sum-frs-and-enhanced-retirement-sum-ers
// Downloaded: 2026-02-24
// Note: ERS changed from 3x to 4x BRS starting 2025
export const RETIREMENT_SUM_BASE_YEAR = 2026
export const BRS_BASE = 110200
export const FRS_BASE = 220400
export const ERS_BASE = 440800
export const BRS_GROWTH_RATE = 0.035 // 3.5% p.a.
```

Also update the file header comment at line 1 from `2024` to `2026` and downloaded date to `2026-02-24`.

**Step 2: Verify file compiles**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`
Expected: Errors about missing `BRS_2024`/`FRS_2024`/`ERS_2024` in cpf.ts and CpfSection.tsx (expected — we rename those next).

---

### Task 2: Update cpf.ts Imports and Fix calculateBrsFrsErs

**Files:**
- Modify: `frontend/src/lib/calculations/cpf.ts:1-22, 233-249`

**Step 1: Update imports (lines 14-16)**

Replace:

```ts
  BRS_2024,
  FRS_2024,
  ERS_2024,
```

With:

```ts
  RETIREMENT_SUM_BASE_YEAR,
  BRS_BASE,
  FRS_BASE,
  ERS_BASE,
```

**Step 2: Fix calculateBrsFrsErs function (lines 233-249)**

Replace the entire function:

```ts
/**
 * Calculate projected BRS/FRS/ERS at age 55, given 3.5% annual growth.
 */
export function calculateBrsFrsErs(
  currentAge: number,
  referenceYear: number = 2024
): { brs: number; frs: number; ers: number } {
  const yearsUntil55 = Math.max(0, 55 - currentAge)
  // BRS/FRS/ERS grow at 3.5% p.a. from the reference year values
  const currentYearOffset = 0 // Assume reference year is current
  const totalGrowthYears = yearsUntil55 + currentYearOffset
  void referenceYear // used for documentation clarity

  const growthFactor = Math.pow(1 + BRS_GROWTH_RATE, totalGrowthYears)
  return {
    brs: BRS_2024 * growthFactor,
    frs: FRS_2024 * growthFactor,
    ers: ERS_2024 * growthFactor,
  }
}
```

With:

```ts
/**
 * Calculate projected BRS/FRS/ERS at age 55, given 3.5% annual growth.
 *
 * Accounts for calendar time elapsed since the base data year so projections
 * stay accurate as years pass without a data update.
 *
 * @param currentAge - user's current age
 * @param currentYear - the calendar year (injectable for testing; defaults to now)
 */
export function calculateBrsFrsErs(
  currentAge: number,
  currentYear: number = new Date().getFullYear()
): { brs: number; frs: number; ers: number } {
  const yearsUntil55 = Math.max(0, 55 - currentAge)
  const yearsSinceBase = Math.max(0, currentYear - RETIREMENT_SUM_BASE_YEAR)
  const totalGrowthYears = yearsUntil55 + yearsSinceBase

  const growthFactor = Math.pow(1 + BRS_GROWTH_RATE, totalGrowthYears)
  return {
    brs: BRS_BASE * growthFactor,
    frs: FRS_BASE * growthFactor,
    ers: ERS_BASE * growthFactor,
  }
}
```

**Step 3: Verify file compiles**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`
Expected: Errors only in CpfSection.tsx (still importing old names). cpf.ts should compile clean.

---

### Task 3: Update CpfSection.tsx Imports

**Files:**
- Modify: `frontend/src/components/profile/CpfSection.tsx:14, 51-53, 327`

**Step 1: Update import (line 14)**

Replace:

```ts
import { getCpfRatesForAge, BRS_2024, FRS_2024, ERS_2024, SA_INTEREST_RATE } from '@/lib/data/cpfRates'
```

With:

```ts
import { getCpfRatesForAge, RETIREMENT_SUM_BASE_YEAR, BRS_BASE, FRS_BASE, ERS_BASE, SA_INTEREST_RATE } from '@/lib/data/cpfRates'
```

**Step 2: Update baseline references (lines 51-53)**

Replace:

```ts
    { key: 'brs', label: 'BRS', value: brsFrsErs.brs, baseline: BRS_2024 },
    { key: 'frs', label: 'FRS', value: brsFrsErs.frs, baseline: FRS_2024 },
    { key: 'ers', label: 'ERS', value: brsFrsErs.ers, baseline: ERS_2024 },
```

With:

```ts
    { key: 'brs', label: 'BRS', value: brsFrsErs.brs, baseline: BRS_BASE },
    { key: 'frs', label: 'FRS', value: brsFrsErs.frs, baseline: FRS_BASE },
    { key: 'ers', label: 'ERS', value: brsFrsErs.ers, baseline: ERS_BASE },
```

**Step 3: Update the tooltip text (line 327)**

Replace:

```ts
            <InfoTooltip text="Based on 2024 values growing at 3.5% p.a. These are the amounts needed in your Retirement Account at 55." />
```

With:

```ts
            <InfoTooltip text={`Based on ${RETIREMENT_SUM_BASE_YEAR} CPF Board published values growing at 3.5% p.a. These are the amounts needed in your Retirement Account at 55.`} />
```

**Step 4: Update the baseline label (line 335)**

Replace:

```ts
                  2024: {formatCurrency(s.baseline)}
```

With:

```ts
                  {RETIREMENT_SUM_BASE_YEAR}: {formatCurrency(s.baseline)}
```

**Step 5: Verify full project compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: Zero errors.

**Step 6: Commit**

```bash
cd frontend && git add src/lib/data/cpfRates.ts src/lib/calculations/cpf.ts src/components/profile/CpfSection.tsx
git commit -m "$(cat <<'EOF'
fix: update CPF FRS base data to 2026 and fix year-offset projection bug

FRS_2024 constants were actually 2025 values. Updated to 2026 published
data (BRS $110,200, FRS $220,400, ERS $440,800). Fixed calculateBrsFrsErs
to account for calendar years elapsed since the base data year, preventing
time-drift that caused ~$10K underestimate in FRS projections.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Update cpf.test.ts for New Base Values

**Files:**
- Modify: `frontend/src/lib/calculations/cpf.test.ts`

**Step 1: Update calculateBrsFrsErs tests (lines 183-202)**

Replace the entire `calculateBrsFrsErs` describe block:

```ts
describe('calculateBrsFrsErs', () => {
  // Pin currentYear to 2026 so tests don't drift with calendar time
  const YEAR = 2026

  it('age 55 in base year → no growth needed', () => {
    const result = calculateBrsFrsErs(55, YEAR)
    expect(result.brs).toBeCloseTo(110200, 0)
    expect(result.frs).toBeCloseTo(220400, 0)
    expect(result.ers).toBeCloseTo(440800, 0)
  })

  it('age 46 in 2026 → 9 years growth (matching financial planner feedback)', () => {
    const result = calculateBrsFrsErs(46, YEAR)
    const growthFactor = Math.pow(1.035, 9)
    expect(result.frs).toBeCloseTo(220400 * growthFactor, 0)
    // Should be ~$300K, not ~$290K
    expect(result.frs).toBeGreaterThan(295000)
    expect(result.frs).toBeLessThan(305000)
  })

  it('age 30 in 2026 → 25 years growth', () => {
    const result = calculateBrsFrsErs(30, YEAR)
    const growthFactor = Math.pow(1.035, 25)
    expect(result.brs).toBeCloseTo(110200 * growthFactor, 0)
    expect(result.frs).toBeCloseTo(220400 * growthFactor, 0)
  })

  it('age >= 55 → no further growth (already past)', () => {
    const result = calculateBrsFrsErs(60, YEAR)
    // Still applies yearsSinceBase: 2026 - 2026 = 0, yearsUntil55 = 0
    expect(result.brs).toBeCloseTo(110200, 0)
  })

  it('future year adds offset: age 46 in 2027 → 10 years growth', () => {
    const result = calculateBrsFrsErs(46, 2027)
    const growthFactor = Math.pow(1.035, 10) // 9 years to 55 + 1 year offset
    expect(result.frs).toBeCloseTo(220400 * growthFactor, 0)
  })

  it('ERS = 2x FRS, BRS = 0.5x FRS at any age', () => {
    const result = calculateBrsFrsErs(40, YEAR)
    expect(result.ers).toBeCloseTo(result.frs * 2, 0)
    expect(result.brs).toBeCloseTo(result.frs / 2, 0)
  })
})
```

**Step 2: Update getRetirementSumAmount tests (lines 282-305)**

Replace the entire `getRetirementSumAmount` describe block. The function now calls `calculateBrsFrsErs` which uses `new Date().getFullYear()` by default, so we need to pin values:

```ts
describe('getRetirementSumAmount', () => {
  it('returns projected BRS/FRS/ERS (uses current year internally)', () => {
    const brs = getRetirementSumAmount('brs', 55)
    const frs = getRetirementSumAmount('frs', 55)
    const ers = getRetirementSumAmount('ers', 55)
    // At age 55, only yearsSinceBase matters. In 2026 with base 2026, that's 0.
    // These will shift if run in a different year, so check ratios instead.
    expect(ers).toBeCloseTo(frs * 2, 0)
    expect(brs).toBeCloseTo(frs / 2, 0)
    expect(frs).toBeGreaterThan(200000)
  })

  it('returns grown values for younger ages', () => {
    const frs30 = getRetirementSumAmount('frs', 30)
    const frs55 = getRetirementSumAmount('frs', 55)
    expect(frs30).toBeGreaterThan(frs55) // younger = more growth years
  })

  it('ERS = 2x FRS, BRS = 0.5x FRS at any age', () => {
    const brs = getRetirementSumAmount('brs', 40)
    const frs = getRetirementSumAmount('frs', 40)
    const ers = getRetirementSumAmount('ers', 40)
    expect(ers).toBeCloseTo(frs * 2, 0)
    expect(brs).toBeCloseTo(frs / 2, 0)
  })
})
```

**Step 3: Update estimateCpfLifePayout and related tests**

These tests use hardcoded `213000` as input (not from constants), so they remain correct — no changes needed. The payout rate functions are independent of the base data.

**Step 4: Run tests**

Run: `cd frontend && npx vitest run src/lib/calculations/cpf.test.ts`
Expected: All tests pass.

**Step 5: Commit**

```bash
cd frontend && git add src/lib/calculations/cpf.test.ts
git commit -m "$(cat <<'EOF'
test: update cpf tests for 2026 base data and year-offset fix

Pin calculateBrsFrsErs tests to explicit currentYear to avoid calendar
drift. Added test for financial planner's scenario (age 46, FRS ~$300K).
Ratio-based assertions for getRetirementSumAmount to stay valid across years.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Update useCpfProjection.test.ts

**Files:**
- Modify: `frontend/src/hooks/useCpfProjection.test.ts`

The hook tests don't hardcode FRS values — they check structural properties (rows exist, milestones fire, balances grow). They should pass without changes.

**Step 1: Run the hook tests**

Run: `cd frontend && npx vitest run src/hooks/useCpfProjection.test.ts`
Expected: All tests pass.

**Step 2: If any test fails, update expected values**

Most likely no changes needed since tests check structural properties, not exact dollar amounts.

---

### Task 6: Run Full Test Suite

**Step 1: Run all tests**

Run: `cd frontend && npx vitest run`
Expected: All tests pass. Check for any test that hardcodes `213000`, `106500`, or `426000` as expected output from `calculateBrsFrsErs` — those need updating to `220400`, `110200`, `440800`.

**Step 2: Run type check**

Run: `cd frontend && npx tsc --noEmit`
Expected: Zero errors.

---

### Task 7: Create CpfAssumptionsPanel Component

**Files:**
- Create: `frontend/src/components/cpf/CpfAssumptionsPanel.tsx`

**Step 1: Write the component**

```tsx
import { useState } from 'react'
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import { useProfileStore } from '@/stores/useProfileStore'
import { calculateBrsFrsErs } from '@/lib/calculations/cpf'
import { getCpfRatesForAge } from '@/lib/data/cpfRates'
import {
  RETIREMENT_SUM_BASE_YEAR,
  BRS_BASE,
  FRS_BASE,
  ERS_BASE,
  BRS_GROWTH_RATE,
  OA_INTEREST_RATE,
  SA_INTEREST_RATE,
  MA_INTEREST_RATE,
  RA_INTEREST_RATE,
  EXTRA_INTEREST_RATE,
  EXTRA_INTEREST_COMBINED_CAP,
  EXTRA_INTEREST_OA_CAP,
  EXTRA_INTEREST_OA_CAP_55_PLUS,
  EXTRA_INTEREST_RA_ADDITIONAL,
  OW_CEILING_MONTHLY,
  AW_CEILING_TOTAL,
} from '@/lib/data/cpfRates'
import { formatCurrency, formatPercent } from '@/lib/utils'

const CPF_SOURCES = {
  retirementSums: 'https://www.cpf.gov.sg/service/article/what-are-the-retirement-sums-basic-retirement-sum-brs-full-retirement-sum-frs-and-enhanced-retirement-sum-ers',
  contributionRates: 'https://www.cpf.gov.sg/employer/employer-obligations/how-much-cpf-contributions-to-pay',
  interestRates: 'https://www.cpf.gov.sg/member/growing-your-savings/earning-higher-returns/earning-attractive-interest',
}

export function CpfAssumptionsPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const currentAge = useProfileStore((s) => s.currentAge)
  const cpfLifeStartAge = useProfileStore((s) => s.cpfLifeStartAge)
  const cpfLifePlan = useProfileStore((s) => s.cpfLifePlan)

  const rates = getCpfRatesForAge(currentAge)
  const brsFrsErs = calculateBrsFrsErs(currentAge)

  const planLabels: Record<string, string> = {
    basic: 'Basic (~5.4%)',
    standard: 'Standard (~6.3%)',
    escalating: 'Escalating (~4.8%, +2%/yr)',
  }

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        CPF Assumptions & Rates
      </button>

      {isOpen && (
        <div className="mt-2 p-3 bg-muted/30 border rounded-md text-sm space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column 1: Retirement Sums */}
            <div className="space-y-1">
              <h5 className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Retirement Sums</h5>
              <div className="space-y-0.5">
                <div>Base year: {RETIREMENT_SUM_BASE_YEAR}</div>
                <div>BRS: {formatCurrency(BRS_BASE)}</div>
                <div>FRS: {formatCurrency(FRS_BASE)}</div>
                <div>ERS: {formatCurrency(ERS_BASE)}</div>
                <div>Growth: {formatPercent(BRS_GROWTH_RATE)} p.a.</div>
                <div className="pt-1 font-medium">
                  Your FRS at 55: {formatCurrency(brsFrsErs.frs)}
                </div>
              </div>
            </div>

            {/* Column 2: Interest Rates */}
            <div className="space-y-1">
              <h5 className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Interest Rates</h5>
              <div className="space-y-0.5">
                <div>OA: {formatPercent(OA_INTEREST_RATE)}</div>
                <div>SA/RA: {formatPercent(SA_INTEREST_RATE)}</div>
                <div>MA: {formatPercent(MA_INTEREST_RATE)}</div>
                <div>Extra: +{formatPercent(EXTRA_INTEREST_RATE)} on first {formatCurrency(EXTRA_INTEREST_COMBINED_CAP)}</div>
                <div className="text-xs text-muted-foreground pl-2">
                  (max {formatCurrency(EXTRA_INTEREST_OA_CAP)} from OA; {formatCurrency(EXTRA_INTEREST_OA_CAP_55_PLUS)} if 55+)
                </div>
                <div>55+: +{formatPercent(EXTRA_INTEREST_RA_ADDITIONAL)} extra on first $30K RA</div>
              </div>
            </div>

            {/* Column 3: Contribution Rates */}
            <div className="space-y-1">
              <h5 className="font-medium text-xs text-muted-foreground uppercase tracking-wider">
                Contribution Rates (Age {currentAge}, {rates.ageGroup})
              </h5>
              <div className="space-y-0.5">
                <div>Employee: {formatPercent(rates.employeeRate)}</div>
                <div>Employer: {formatPercent(rates.employerRate)}</div>
                <div>Total: {formatPercent(rates.totalRate)}</div>
                <div>OW ceiling: {formatCurrency(OW_CEILING_MONTHLY)}/mo</div>
                <div>AW ceiling: {formatCurrency(AW_CEILING_TOTAL)}</div>
              </div>
            </div>
          </div>

          {/* CPF LIFE row */}
          <div className="pt-1 border-t text-xs text-muted-foreground">
            CPF LIFE: {planLabels[cpfLifePlan]} from age {cpfLifeStartAge} &middot; RA earns {formatPercent(RA_INTEREST_RATE)} until payout starts
          </div>

          {/* Source links */}
          <div className="pt-1 border-t text-xs text-muted-foreground flex flex-wrap gap-3">
            <span>Sources:</span>
            <a href={CPF_SOURCES.retirementSums} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 hover:text-foreground">
              Retirement Sums <ExternalLink className="w-3 h-3" />
            </a>
            <a href={CPF_SOURCES.contributionRates} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 hover:text-foreground">
              Contribution Rates <ExternalLink className="w-3 h-3" />
            </a>
            <a href={CPF_SOURCES.interestRates} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 hover:text-foreground">
              Interest Rates <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Verify it compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: Zero errors.

---

### Task 8: Add Assumptions Panel to CpfSection

**Files:**
- Modify: `frontend/src/components/profile/CpfSection.tsx:16, 484-489`

**Step 1: Add import (after line 16)**

Add after the existing CpfProjectionTable import:

```ts
import { CpfAssumptionsPanel } from '@/components/cpf/CpfAssumptionsPanel'
```

**Step 2: Render panel above the projection table (line 489)**

Replace lines 484-489:

```tsx
            <div>
              <h4 className="text-sm font-medium flex items-center mb-2">
                Year-by-Year CPF Projection
                <InfoTooltip text="Projected CPF balances based on your income model, contribution rates, and CPF LIFE configuration. Milestone rows are highlighted when balances cross BRS/FRS/ERS thresholds." />
              </h4>
              <CpfProjectionTable />
            </div>
```

With:

```tsx
            <div>
              <h4 className="text-sm font-medium flex items-center mb-2">
                Year-by-Year CPF Projection
                <InfoTooltip text="Projected CPF balances based on your income model, contribution rates, and CPF LIFE configuration. Milestone rows are highlighted when balances cross BRS/FRS/ERS thresholds." />
              </h4>
              <CpfAssumptionsPanel />
              <CpfProjectionTable />
            </div>
```

**Step 3: Verify it compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: Zero errors.

**Step 4: Commit**

```bash
cd frontend && git add src/components/cpf/CpfAssumptionsPanel.tsx src/components/profile/CpfSection.tsx
git commit -m "$(cat <<'EOF'
feat: add CPF assumptions panel above projection table

Collapsible panel showing all rates, base values, and source links used
in the CPF projection. Helps financial planners validate calculations
against their internal tools.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Add Milestone Formula Text to useCpfProjection

**Files:**
- Modify: `frontend/src/hooks/useCpfProjection.ts:6-19, 52-128`

**Step 1: Add milestoneFormula to CpfProjectionRow type (line 19)**

Add after `milestone`:

```ts
  milestoneFormula: string | null
```

**Step 2: Import RETIREMENT_SUM_BASE_YEAR and formatCurrency**

Add at top:

```ts
import { RETIREMENT_SUM_BASE_YEAR, BRS_BASE, FRS_BASE, ERS_BASE, BRS_GROWTH_RATE } from '@/lib/data/cpfRates'
import { formatCurrency } from '@/lib/utils'
```

**Step 3: Populate milestoneFormula in the map callback**

After the milestone detection logic (around line 84) and bequest computation (around line 112), before the return statement, add:

```ts
      // Build formula text for milestone rows
      let milestoneFormula: string | null = null
      if (milestone === 'frs') {
        const years = Math.max(0, 55 - currentAge) + Math.max(0, new Date().getFullYear() - RETIREMENT_SUM_BASE_YEAR)
        milestoneFormula = `FRS at 55: ${formatCurrency(FRS_BASE)} (${RETIREMENT_SUM_BASE_YEAR}) × 1.035^${years} = ${formatCurrency(brsFrsErs.frs)}`
      } else if (milestone === 'brs') {
        const years = Math.max(0, 55 - currentAge) + Math.max(0, new Date().getFullYear() - RETIREMENT_SUM_BASE_YEAR)
        milestoneFormula = `BRS at 55: ${formatCurrency(BRS_BASE)} (${RETIREMENT_SUM_BASE_YEAR}) × 1.035^${years} = ${formatCurrency(brsFrsErs.brs)}`
      } else if (milestone === 'ers') {
        const years = Math.max(0, 55 - currentAge) + Math.max(0, new Date().getFullYear() - RETIREMENT_SUM_BASE_YEAR)
        milestoneFormula = `ERS at 55: ${formatCurrency(ERS_BASE)} (${RETIREMENT_SUM_BASE_YEAR}) × 1.035^${years} = ${formatCurrency(brsFrsErs.ers)}`
      } else if (milestone === 'raCreated') {
        milestoneFormula = `SA (${formatCurrency(row.cpfSA > 0 ? prevRow?.cpfSA ?? 0 : 0)}) → RA. Target: FRS = ${formatCurrency(brsFrsErs.frs)}`
      } else if (milestone === 'cpfLifeStart') {
        milestoneFormula = `RA at ${row.age}: ${formatCurrency(totalBalance)}. ${cpfLifePlan.charAt(0).toUpperCase() + cpfLifePlan.slice(1)} plan. Payout: ${formatCurrency(row.cpfLifePayout / 12)}/mo (${formatCurrency(row.cpfLifePayout)}/yr)`
      }
```

And add `milestoneFormula` to the return object.

**Step 4: Verify it compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: Zero errors.

---

### Task 10: Render Milestone Tooltips in CpfProjectionTable

**Files:**
- Modify: `frontend/src/components/cpf/CpfProjectionTable.tsx:9, 194-202`

**Step 1: Import InfoTooltip (add after line 12)**

```ts
import { InfoTooltip } from '@/components/shared/InfoTooltip'
```

**Step 2: Update milestone label cells (lines 194-202)**

Replace:

```tsx
                {isMilestone && (
                  <td className="px-2 py-1.5 text-xs text-muted-foreground whitespace-nowrap">
                    {original.milestone === 'brs' && 'BRS reached'}
                    {original.milestone === 'frs' && 'FRS reached'}
                    {original.milestone === 'ers' && 'ERS reached'}
                    {original.milestone === 'cpfLifeStart' && 'CPF LIFE starts'}
                    {original.milestone === 'raCreated' && 'RA created'}
                  </td>
                )}
```

With:

```tsx
                {isMilestone && (
                  <td className="px-2 py-1.5 text-xs text-muted-foreground whitespace-nowrap">
                    <span className="inline-flex items-center gap-0.5">
                      {original.milestone === 'brs' && 'BRS reached'}
                      {original.milestone === 'frs' && 'FRS reached'}
                      {original.milestone === 'ers' && 'ERS reached'}
                      {original.milestone === 'cpfLifeStart' && 'CPF LIFE starts'}
                      {original.milestone === 'raCreated' && 'RA created'}
                      {original.milestoneFormula && (
                        <InfoTooltip text={original.milestoneFormula} />
                      )}
                    </span>
                  </td>
                )}
```

**Step 3: Verify it compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: Zero errors.

**Step 4: Commit**

```bash
cd frontend && git add src/hooks/useCpfProjection.ts src/components/cpf/CpfProjectionTable.tsx
git commit -m "$(cat <<'EOF'
feat: add formula tooltips to CPF milestone rows

Milestone rows (BRS/FRS/ERS reached, RA created, CPF LIFE starts) now
show an info tooltip with the formula that produced the milestone value.
Helps financial planners trace exactly how projections are computed.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Final Verification

**Step 1: Run full test suite**

Run: `cd frontend && npx vitest run`
Expected: All tests pass.

**Step 2: Run type check**

Run: `cd frontend && npx tsc --noEmit`
Expected: Zero errors.

**Step 3: Run lint**

Run: `cd frontend && npx eslint src/ --max-warnings=0 2>&1 | tail -5`
Expected: No new errors (some existing warnings may appear).

**Step 4: Manual smoke test**

Run: `cd frontend && npm run dev -- --port 5173`

Verify:
1. Navigate to Profile page, CPF section, advanced mode
2. Set age to 46, check that FRS at 55 shows ~$300K (not ~$290K)
3. Click "CPF Assumptions & Rates" toggle — panel expands with correct values
4. Source links point to CPF Board pages
5. In the projection table, milestone rows show info icons
6. Hover/click info icon on FRS milestone — tooltip shows formula
7. RA at 65 should be closer to ~$455K (with appropriate income/contribution inputs)
