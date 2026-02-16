import type { CpfContribution, CpfProjection } from '@/lib/types'
import {
  getCpfRatesForAge,
  OW_CEILING_ANNUAL,
  AW_CEILING_TOTAL,
  OA_INTEREST_RATE,
  SA_INTEREST_RATE,
  MA_INTEREST_RATE,
  EXTRA_INTEREST_RATE,
  EXTRA_INTEREST_COMBINED_CAP,
  EXTRA_INTEREST_OA_CAP,
  BRS_2024,
  FRS_2024,
  ERS_2024,
  BRS_GROWTH_RATE,
  CPF_LIFE_BASIC_RATE,
  CPF_LIFE_STANDARD_RATE,
  CPF_LIFE_ESCALATING_RATE,
} from '@/lib/data/cpfRates'

/**
 * Calculate annual CPF contribution for a given salary and age.
 * Applies OW ceiling and AW ceiling. Bonus is treated as Additional Wages.
 */
export function calculateCpfContribution(
  annualSalary: number,
  age: number,
  annualBonus: number = 0
): CpfContribution {
  if (annualSalary <= 0 && annualBonus <= 0) {
    return { employee: 0, employer: 0, total: 0, oaAllocation: 0, saAllocation: 0, maAllocation: 0 }
  }

  const rates = getCpfRatesForAge(age)

  // OW (Ordinary Wages) — capped at $6,800/month ($81,600/year)
  const owSubjectToCpf = Math.min(annualSalary, OW_CEILING_ANNUAL)

  // AW (Additional Wages, e.g. bonus) — capped at $102,000 - total OW subject to CPF
  const awCeiling = Math.max(0, AW_CEILING_TOTAL - owSubjectToCpf)
  const awSubjectToCpf = Math.min(annualBonus, awCeiling)

  const totalWagesSubjectToCpf = owSubjectToCpf + awSubjectToCpf

  const employee = totalWagesSubjectToCpf * rates.employeeRate
  const employer = totalWagesSubjectToCpf * rates.employerRate
  const total = employee + employer

  // Allocate to OA/SA/MA based on allocation ratios
  // The allocation rates represent the proportion of TOTAL wages going to each account
  const oaAllocation = totalWagesSubjectToCpf * rates.oaRate
  const saAllocation = totalWagesSubjectToCpf * rates.saRate
  const maAllocation = totalWagesSubjectToCpf * rates.maRate

  return { employee, employer, total, oaAllocation, saAllocation, maAllocation }
}

/**
 * Calculate extra interest earned on CPF balances (under age 55 rules).
 * Extra 1% on first $60K combined, with max $20K from OA.
 *
 * For age 55+, there's additional extra interest, but that's deferred to W2.
 */
export function calculateCpfExtraInterest(
  oaBalance: number,
  saBalance: number,
  maBalance: number,
  _age: number // Will use age-specific extra interest rules in W2
): number {
  // Step 1: Determine how much OA qualifies (max $20K)
  const oaQualifying = Math.min(oaBalance, EXTRA_INTEREST_OA_CAP)

  // Step 2: Remaining cap from SA + MA (priority order: SA, MA, then OA)
  const remainingCap = EXTRA_INTEREST_COMBINED_CAP - oaQualifying
  const saQualifying = Math.min(saBalance, remainingCap)
  const maQualifying = Math.min(maBalance, Math.max(0, remainingCap - saQualifying))

  const totalQualifying = oaQualifying + saQualifying + maQualifying
  return totalQualifying * EXTRA_INTEREST_RATE
}

/**
 * Project CPF balances year-by-year from startAge to endAge.
 */
export function projectCpfBalances(
  startAge: number,
  endAge: number,
  initialOA: number,
  initialSA: number,
  initialMA: number,
  annualSalary: number,
  salaryGrowth: number
): CpfProjection[] {
  const projections: CpfProjection[] = []
  let oa = initialOA
  let sa = initialSA
  let ma = initialMA
  let salary = annualSalary

  for (let age = startAge; age <= endAge; age++) {
    const contribution = calculateCpfContribution(salary, age)

    // Add contributions
    oa += contribution.oaAllocation
    sa += contribution.saAllocation
    ma += contribution.maAllocation

    // Calculate interest (base + extra)
    const oaInterest = oa * OA_INTEREST_RATE
    const saInterest = sa * SA_INTEREST_RATE
    const maInterest = ma * MA_INTEREST_RATE
    const extraInterest = calculateCpfExtraInterest(oa, sa, ma, age)

    // Add interest (extra interest goes to the respective accounts proportionally,
    // but for simplicity we add it to SA as CPF Board does for under-55)
    oa += oaInterest
    sa += saInterest + extraInterest
    ma += maInterest

    const totalBalance = oa + sa + ma
    const annualInterest = oaInterest + saInterest + maInterest + extraInterest

    projections.push({
      age,
      oaBalance: oa,
      saBalance: sa,
      maBalance: ma,
      totalBalance,
      annualContribution: contribution.total,
      annualInterest,
    })

    salary *= 1 + salaryGrowth
  }

  return projections
}

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

export type CpfLifePlan = 'basic' | 'standard' | 'escalating'

/**
 * Estimate annual CPF LIFE payout starting at age 65.
 * Based on retirement sum at age 55 and selected plan.
 *
 * - Basic: ~5.4% annual payout rate (flat, higher bequest)
 * - Standard: ~6.3% annual payout rate (flat, lower bequest)
 * - Escalating: ~4.8% initial rate, increases 2%/yr (hedges inflation)
 */
export function estimateCpfLifePayout(
  retirementSumAt55: number,
  plan: CpfLifePlan = 'standard'
): number {
  const rates: Record<CpfLifePlan, number> = {
    basic: CPF_LIFE_BASIC_RATE,
    standard: CPF_LIFE_STANDARD_RATE,
    escalating: CPF_LIFE_ESCALATING_RATE,
  }
  return retirementSumAt55 * rates[plan]
}
