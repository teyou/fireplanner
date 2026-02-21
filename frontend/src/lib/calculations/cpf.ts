import type { CpfContribution, CpfProjection, CpfLifePlan, CpfRetirementSum } from '@/lib/types'
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
  EXTRA_INTEREST_OA_CAP_55_PLUS,
  EXTRA_INTEREST_RA_ADDITIONAL,
  BRS_2024,
  FRS_2024,
  ERS_2024,
  BRS_GROWTH_RATE,
  CPF_LIFE_BASIC_RATE,
  CPF_LIFE_STANDARD_RATE,
  CPF_LIFE_ESCALATING_RATE,
  CPF_LIFE_ESCALATING_INCREASE,
} from '@/lib/data/cpfRates'

// Re-export CpfLifePlan from types for backward compatibility
export type { CpfLifePlan } from '@/lib/types'

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
 * Age-aware extra interest calculation for CPF balances.
 *
 * Under 55: Extra 1% on first $20K OA, extra 1% on next $40K combined (OA+SA+MA), capped at $60K total.
 * 55 and over: Extra 1% on first $30K OA (raised cap), extra 2% on first $30K of RA,
 *   extra 1% on next $30K combined (OA+SA+MA+RA), capped at $60K total qualifying.
 */
export function calculateCpfExtraInterestWithAge(
  oaBalance: number,
  saBalance: number,
  maBalance: number,
  raBalance: number,
  age: number
): number {
  if (age <= 55) {
    // Under 55: same as original — ignore RA (should be 0 anyway)
    return calculateCpfExtraInterest(oaBalance, saBalance, maBalance, age)
  }

  // 55 and over:
  // Tier 1: Extra 1% on first $30K of OA (raised from $20K)
  const oaQualifying = Math.min(oaBalance, EXTRA_INTEREST_OA_CAP_55_PLUS)

  // Tier 2: Extra 2% on first $30K of RA (additional 1% on top of RA's base extra 1%)
  const raQualifyingForAdditional = Math.min(raBalance, 30000)
  const raAdditionalInterest = raQualifyingForAdditional * EXTRA_INTEREST_RA_ADDITIONAL

  // Tier 3: Extra 1% on remaining combined balances up to $60K total qualifying
  // Total qualifying from OA already counted, now fill from SA, MA, RA
  const remainingCap = EXTRA_INTEREST_COMBINED_CAP - oaQualifying
  const saQualifying = Math.min(saBalance, remainingCap)
  const raForCombined = Math.min(raBalance, Math.max(0, remainingCap - saQualifying))
  const maQualifying = Math.min(maBalance, Math.max(0, remainingCap - saQualifying - raForCombined))

  const totalQualifying = oaQualifying + saQualifying + raForCombined + maQualifying
  const baseExtraInterest = totalQualifying * EXTRA_INTEREST_RATE

  return baseExtraInterest + raAdditionalInterest
}

/**
 * At age 55, transfer SA (then OA) into the new Retirement Account (RA),
 * up to the retirement sum target. SA is always fully closed.
 */
export function performAge55Transfer(
  oaBalance: number,
  saBalance: number,
  retirementSumTarget: number
): { newOA: number; newSA: number; newRA: number } {
  // Step 1: Transfer SA → RA (SA always fully transfers)
  const saToRA = Math.min(saBalance, retirementSumTarget)
  let raBalance = saToRA
  const remainingTarget = retirementSumTarget - saToRA

  // Step 2: Transfer OA → RA for the shortfall
  const oaToRA = Math.min(oaBalance, Math.max(0, remainingTarget))
  raBalance += oaToRA

  return {
    newOA: oaBalance - oaToRA,
    newSA: 0, // SA is always closed at 55
    newRA: raBalance,
  }
}

/**
 * Post-age-55 CPF contributions: redirect SA allocation to RA (if room) or OA.
 * MA allocation unchanged.
 */
export function allocatePostAge55Contribution(
  cpfContribution: CpfContribution,
  raBalance: number,
  retirementSumTarget: number
): { oaAllocation: number; raAllocation: number; maAllocation: number } {
  const raRoom = Math.max(0, retirementSumTarget - raBalance)
  const saPortionToRA = Math.min(cpfContribution.saAllocation, raRoom)
  const saOverflowToOA = cpfContribution.saAllocation - saPortionToRA

  return {
    oaAllocation: cpfContribution.oaAllocation + saOverflowToOA,
    raAllocation: saPortionToRA,
    maAllocation: cpfContribution.maAllocation,
  }
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

/**
 * Calculate CPF LIFE payout at a specific age, accounting for start age and plan type.
 * Returns 0 before cpfLifeStartAge.
 * For escalating plan, compounds 2%/yr from the start age.
 */
export function calculateCpfLifePayoutAtAge(
  retirementSumAt55: number,
  plan: CpfLifePlan,
  startAge: number,
  currentAge: number
): number {
  if (currentAge < startAge) return 0
  if (retirementSumAt55 <= 0) return 0

  const basePayout = estimateCpfLifePayout(retirementSumAt55, plan)

  if (plan === 'escalating') {
    const yearsFromStart = currentAge - startAge
    return basePayout * Math.pow(1 + CPF_LIFE_ESCALATING_INCREASE, yearsFromStart)
  }

  return basePayout
}

/**
 * Get the dollar amount for a retirement sum level, projected to age 55.
 */
export function getRetirementSumAmount(
  level: CpfRetirementSum,
  currentAge: number
): number {
  const projected = calculateBrsFrsErs(currentAge)
  switch (level) {
    case 'brs': return projected.brs
    case 'frs': return projected.frs
    case 'ers': return projected.ers
  }
}

/**
 * Auto-detect which retirement sum level fits the user's projected SA at 55.
 * BRS requires property ownership with long remaining lease.
 */
export function autoDetectRetirementSum(
  projectedSAAt55: number,
  projectedFRSAt55: number,
  ownsPropertyWithLongLease: boolean
): CpfRetirementSum {
  // ERS = 2x FRS, BRS = 0.5x FRS
  const projectedERS = projectedFRSAt55 * 2
  const projectedBRS = projectedFRSAt55 * 0.5

  if (projectedSAAt55 >= projectedERS) return 'ers'
  if (projectedSAAt55 >= projectedFRSAt55) return 'frs'
  if (ownsPropertyWithLongLease && projectedSAAt55 >= projectedBRS) return 'brs'
  return 'frs' // Default to FRS if SA doesn't meet BRS or no property
}
