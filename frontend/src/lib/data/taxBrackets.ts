// Singapore Progressive Income Tax Brackets — YA 2024+
// Source: IRAS (https://www.iras.gov.sg/taxes/individual-income-tax/basics-of-individual-income-tax/tax-residency-and-tax-rates/individual-income-tax-rates)
// Downloaded: 2024-12-01
// License: Public data
// Note: Brackets above $320K updated for YA 2024. Verify against IRAS annually.

import type { TaxBracket } from '@/lib/types'

export const TAX_BRACKETS: TaxBracket[] = [
  { from: 0, to: 20000, rate: 0, cumulativeTax: 0 },
  { from: 20000, to: 30000, rate: 0.02, cumulativeTax: 0 },
  { from: 30000, to: 40000, rate: 0.035, cumulativeTax: 200 },
  { from: 40000, to: 80000, rate: 0.07, cumulativeTax: 550 },
  { from: 80000, to: 120000, rate: 0.115, cumulativeTax: 3350 },
  { from: 120000, to: 160000, rate: 0.15, cumulativeTax: 7950 },
  { from: 160000, to: 200000, rate: 0.18, cumulativeTax: 13950 },
  { from: 200000, to: 240000, rate: 0.19, cumulativeTax: 21150 },
  { from: 240000, to: 280000, rate: 0.195, cumulativeTax: 28750 },
  { from: 280000, to: 320000, rate: 0.20, cumulativeTax: 36550 },
  { from: 320000, to: 360000, rate: 0.22, cumulativeTax: 44550 },
  { from: 360000, to: 420000, rate: 0.23, cumulativeTax: 53350 },
  { from: 420000, to: 500000, rate: 0.24, cumulativeTax: 67150 },
  { from: 500000, to: 1000000, rate: 0.23, cumulativeTax: 86350 },
  { from: 1000000, to: Infinity, rate: 0.24, cumulativeTax: 201350 },
]

// SRS deduction cap (Singapore Citizens / PR)
export const SRS_ANNUAL_CAP = 15300

// SRS deduction cap (Foreigners)
export const SRS_ANNUAL_CAP_FOREIGNER = 35700

// Common personal reliefs (used as defaults)
export const EARNED_INCOME_RELIEF = 1000
export const NSWAN_RELIEF = 4500
