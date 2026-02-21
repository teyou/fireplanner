// CPF Contribution Rates — 2024
// Source: CPF Board (https://www.cpf.gov.sg/employer/employer-obligations/how-much-cpf-contributions-to-pay)
// Downloaded: 2024-12-01
// License: Public data

import type { CpfRateEntry } from '@/lib/types'

export const CPF_RATES: CpfRateEntry[] = [
  {
    ageGroup: '55 and below',
    minAge: 0,
    maxAge: 55,
    employeeRate: 0.20,
    employerRate: 0.17,
    totalRate: 0.37,
    oaRate: 0.23,
    saRate: 0.06,
    maRate: 0.08,
  },
  {
    ageGroup: '55-60',
    minAge: 55,
    maxAge: 60,
    employeeRate: 0.15,
    employerRate: 0.145,
    totalRate: 0.295,
    oaRate: 0.115,
    saRate: 0.045,
    maRate: 0.135,
  },
  {
    ageGroup: '60-65',
    minAge: 60,
    maxAge: 65,
    employeeRate: 0.095,
    employerRate: 0.11,
    totalRate: 0.205,
    oaRate: 0.035,
    saRate: 0.03,
    maRate: 0.14,
  },
  {
    ageGroup: '65-70',
    minAge: 65,
    maxAge: 70,
    employeeRate: 0.075,
    employerRate: 0.085,
    totalRate: 0.16,
    oaRate: 0.01,
    saRate: 0.01,
    maRate: 0.14,
  },
  {
    ageGroup: 'Above 70',
    minAge: 70,
    maxAge: Infinity,
    employeeRate: 0.05,
    employerRate: 0.075,
    totalRate: 0.125,
    oaRate: 0.01,
    saRate: 0.01,
    maRate: 0.105,
  },
]

// Ordinary Wage (OW) ceiling: $6,800/month
export const OW_CEILING_MONTHLY = 6800
export const OW_CEILING_ANNUAL = OW_CEILING_MONTHLY * 12 // $81,600

// Additional Wage (AW) ceiling: $102,000 - total OW subject to CPF for the year
export const AW_CEILING_TOTAL = 102000

// Interest rates
export const OA_INTEREST_RATE = 0.025 // 2.5%
export const SA_INTEREST_RATE = 0.04 // 4.0%
export const MA_INTEREST_RATE = 0.04 // 4.0%

// Extra interest on first $60K combined (up to $20K from OA)
export const EXTRA_INTEREST_RATE = 0.01 // 1% extra
export const EXTRA_INTEREST_COMBINED_CAP = 60000
export const EXTRA_INTEREST_OA_CAP = 20000

// Retirement Account (RA) — created at age 55
export const RA_INTEREST_RATE = 0.04 // 4.0%, same as SA
export const EXTRA_INTEREST_OA_CAP_55_PLUS = 30000 // raised from $20K post-55
export const EXTRA_INTEREST_RA_ADDITIONAL = 0.01 // extra 1% on first $30K of RA (total 2% extra)

// BRS/FRS/ERS (2024 values)
export const BRS_2024 = 106500
export const FRS_2024 = 213000
export const ERS_2024 = 426000
export const BRS_GROWTH_RATE = 0.035 // 3.5% p.a.

// CPF LIFE payout rates (annual rate applied to retirement sum at 55)
export const CPF_LIFE_BASIC_RATE = 0.054 // ~5.4%
export const CPF_LIFE_STANDARD_RATE = 0.063 // ~6.3%
export const CPF_LIFE_ESCALATING_RATE = 0.048 // ~4.8% initial, increases 2%/yr
export const CPF_LIFE_ESCALATING_INCREASE = 0.02 // 2% annual increase for escalating plan
export const CPF_LIFE_START_AGE = 65 // Default; user can configure 65-75 via cpfLifeStartAge

/**
 * Get CPF contribution rates for a given age.
 * Age boundaries: rates change when crossing into the next bracket.
 * e.g., age 55 uses "55 and below" rates, age 56 uses "55-60" rates.
 */
export function getCpfRatesForAge(age: number): CpfRateEntry {
  // The first matching bracket where age <= maxAge
  const entry = CPF_RATES.find((r) => age <= r.maxAge)
  if (!entry) {
    return CPF_RATES[CPF_RATES.length - 1]
  }
  return entry
}
