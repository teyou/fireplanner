# CPF Accuracy Fix + Transparency Design

**Date:** 2026-02-24
**Status:** Approved
**Trigger:** Financial planner feedback — FRS at 55 shows ~$290K instead of ~$300K; RA at 65 shows ~$429K instead of ~$455K; no visibility into calculation assumptions.

## Problem

Two bugs and one missing feature:

### Bug 1: FRS base values mislabeled
`cpfRates.ts` stores 2025 CPF Board published values but labels them as 2024:
- `BRS_2024 = 106500` → actually 2025 BRS
- `FRS_2024 = 213000` → actually 2025 FRS
- `ERS_2024 = 426000` → actually 2025 ERS

Actual published values:
| Year | BRS | FRS | ERS |
|------|-----|-----|-----|
| 2024 | $102,900 | $205,800 | $308,700 |
| 2025 | $106,500 | $213,000 | $426,000 |
| 2026 | $110,200 | $220,400 | $440,800 |

Source: [CPF Board - Retirement Sums](https://www.cpf.gov.sg/service/article/what-are-the-retirement-sums-basic-retirement-sum-brs-full-retirement-sum-frs-and-enhanced-retirement-sum-ers)

### Bug 2: Year offset not applied in FRS projection
`calculateBrsFrsErs()` computes `yearsUntil55 = 55 - currentAge` but doesn't add the offset between the base data year and the current year. Result: each year that passes, the FRS projection falls further behind.

For a 46-year-old in 2026 with 2025 base data:
- Our calc: $213,000 × 1.035^9 = **$290,298** (wrong — 9 years)
- Correct: $213,000 × 1.035^10 = **$300,459** (10 years: 9 to age 55 + 1 year since base)

This cascades to RA at 65 (our: ~$429K, correct: ~$455K).

### Missing: Calculation transparency
No way for users to see what rates, base values, and rules feed into the CPF projection. Financial planners need this to validate against their internal tools.

## Solution

### Part 1: Fix Data (cpfRates.ts)

Update to 2026 published values with correct labeling:

```ts
// Retirement sums — cohort turning 55 in BASE_YEAR
// Source: https://www.cpf.gov.sg/service/article/what-are-the-retirement-sums-basic-retirement-sum-brs-full-retirement-sum-frs-and-enhanced-retirement-sum-ers
export const RETIREMENT_SUM_BASE_YEAR = 2026
export const BRS_BASE = 110200
export const FRS_BASE = 220400
export const ERS_BASE = 440800
export const BRS_GROWTH_RATE = 0.035
```

### Part 2: Fix Year Offset (cpf.ts)

```ts
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

Note: `currentYear` as parameter (not hardcoded `new Date()` inside) keeps the function pure and testable.

### Part 3: Assumptions Panel (new component)

**Component:** `components/cpf/CpfAssumptionsPanel.tsx`
**Location:** Rendered above CpfProjectionTable inside CpfSection advanced mode.
**Default state:** Collapsed.

Content (3-column grid):

| Retirement Sums | Interest Rates | Contribution Rates (Age ≤55) |
|---|---|---|
| Base year: 2026 | OA: 2.50% | Employee: 20% |
| BRS: $110,200 | SA/RA: 4.00% | Employer: 17% |
| FRS: $220,400 | MA: 4.00% | OW ceiling: $8,000/mo |
| ERS: $440,800 | Extra: +1% on first $60K | AW ceiling: $102,000 |
| Growth: 3.5% p.a. | 55+: +2% on first $30K RA | |
| **Your FRS at 55: $X** | | |

Below the grid:
- CPF LIFE row: Plan type, start age, payout rate
- Source link: "Rates from [CPF Board](https://www.cpf.gov.sg/...)" with external link icon

All values imported from `cpfRates.ts` constants — no hardcoding in the component.

### Part 4: Milestone Cell Tooltips

Add InfoTooltip to 3 milestone cells in CpfProjectionTable:

1. **FRS milestone row** (Total column):
   "FRS target at 55: $220,400 (2026) × 1.035^N = $X"

2. **RA created row** (RA column, age 55):
   "SA ($X) → RA. OA top-up: $Y. Target: FRS = $Z"

3. **CPF LIFE start row** (RA/Total column, age 65):
   "RA at 65: $X. Annuitized under {plan} plan. Est. payout: $Y/mo ($Z/yr)"

Implementation: Extend `CpfProjectionRow` type with optional `milestoneFormula: string` field, populated by `useCpfProjection` hook. Table renders InfoTooltip when present.

## Files Changed

| File | Change Type | Description |
|---|---|---|
| `lib/data/cpfRates.ts` | Modify | Fix constant names/values to 2026, add BASE_YEAR, update source comments |
| `lib/calculations/cpf.ts` | Modify | Fix `calculateBrsFrsErs` year offset, rename imports |
| `lib/calculations/cpf.test.ts` | Modify | Update expected values for new base data |
| `hooks/useCpfProjection.ts` | Modify | Add milestoneFormula to milestone rows |
| `hooks/useCpfProjection.test.ts` | Modify | Update expected values |
| `components/cpf/CpfAssumptionsPanel.tsx` | **New** | Assumptions card component |
| `components/cpf/CpfProjectionTable.tsx` | Modify | Add InfoTooltip to milestone cells |
| `components/profile/CpfSection.tsx` | Modify | Render CpfAssumptionsPanel above table |
| `lib/calculations/projection.ts` | Modify | Rename imports (BRS_2024 → BRS_BASE etc.) |

## Testing

### Unit tests (cpf.test.ts)
- `calculateBrsFrsErs(46, 2026)` → FRS ≈ $300,367 (9 years × 3.5% from 2026 base)
- `calculateBrsFrsErs(55, 2026)` → FRS = $220,400 (0 years growth, already at 55)
- `calculateBrsFrsErs(46, 2027)` → FRS ≈ $310,879 (10 years: 9 + 1 year offset)
- `calculateBrsFrsErs(30, 2026)` → FRS ≈ $493,107 (25 years growth)
- Verify BRS = FRS/2, ERS = FRS×2 (ratio preserved)

### Integration test (useCpfProjection.test.ts)
- Milestone formula strings are populated for FRS, RA created, CPF LIFE start rows
- Non-milestone rows have null milestoneFormula

### Manual validation
- Reproduce the financial planner's scenario: age 46, OA $574.8K, SA $260K, MA $76.3K, income $70K at 3% growth
- Verify FRS at 55 ≈ $300K and RA at 65 ≈ $455K

## Annual Maintenance

When CPF Board publishes new values each January:
1. Update `BRS_BASE`, `FRS_BASE`, `ERS_BASE`, `RETIREMENT_SUM_BASE_YEAR` in `cpfRates.ts`
2. Update source comment with new download date
3. Run tests — year offset logic handles the rest automatically

## Official Sources

- Retirement Sums: https://www.cpf.gov.sg/service/article/what-are-the-retirement-sums-basic-retirement-sum-brs-full-retirement-sum-frs-and-enhanced-retirement-sum-ers
- Contribution Rates: https://www.cpf.gov.sg/employer/employer-obligations/how-much-cpf-contributions-to-pay
- Interest Rates: https://www.cpf.gov.sg/member/growing-your-savings/earning-higher-returns/earning-attractive-interest
- CPF LIFE: https://www.cpf.gov.sg/member/retirement-income/monthly-payouts/cpf-life
