import type {
  CareerPhase,
  PromotionJump,
  IncomeStream,
  LifeEvent,
  IncomeProjectionRow,
  IncomeSummaryStats,
  SalaryModel,
  EducationLevel,
} from '@/lib/types'
import { getMomSalary } from '@/lib/data/momSalary'
import { calculateCpfContribution, calculateCpfExtraInterest } from './cpf'
import { calculateChargeableIncome, calculateProgressiveTax } from './tax'
import {
  OA_INTEREST_RATE,
  SA_INTEREST_RATE,
  MA_INTEREST_RATE,
} from '@/lib/data/cpfRates'

export const DEFAULT_CAREER_PHASES: CareerPhase[] = [
  { label: 'Early Career', minAge: 22, maxAge: 30, growthRate: 0.08 },
  { label: 'Mid Career', minAge: 30, maxAge: 40, growthRate: 0.05 },
  { label: 'Peak', minAge: 40, maxAge: 50, growthRate: 0.03 },
  { label: 'Plateau', minAge: 50, maxAge: 58, growthRate: 0.01 },
  { label: 'Pre-Retire', minAge: 58, maxAge: 65, growthRate: -0.02 },
]

/**
 * Simple salary model: base salary compounded at a fixed annual growth rate.
 */
export function calculateSimpleSalary(
  baseSalary: number,
  growthRate: number,
  yearsFromStart: number
): number {
  if (baseSalary <= 0 || yearsFromStart < 0) return Math.max(0, baseSalary)
  return baseSalary * Math.pow(1 + growthRate, yearsFromStart)
}

/**
 * Realistic salary model: career-phase growth rates with multiplicative promotion jumps.
 * Compounds year-by-year from currentAge to targetAge using phase-specific growth rates.
 */
export function calculateRealisticSalary(
  baseSalary: number,
  currentAge: number,
  targetAge: number,
  phases: CareerPhase[],
  promotionJumps: PromotionJump[]
): number {
  if (baseSalary <= 0) return 0
  if (targetAge <= currentAge) return baseSalary

  let salary = baseSalary

  for (let age = currentAge; age < targetAge; age++) {
    // Find the phase for this age
    const phase = phases.find((p) => age >= p.minAge && age < p.maxAge)
    const growthRate = phase ? phase.growthRate : 0

    salary *= 1 + growthRate

    // Apply promotion jumps at the next age
    const nextAge = age + 1
    for (const jump of promotionJumps) {
      if (jump.age === nextAge) {
        salary *= 1 + jump.increasePercent
      }
    }
  }

  return salary
}

/**
 * Data-driven salary model: uses MOM salary benchmarks for age and education,
 * scaled by a user adjustment factor.
 */
export function calculateDataDrivenSalary(
  age: number,
  education: EducationLevel,
  adjustment: number
): number {
  const momSalary = getMomSalary(age, education)
  return momSalary * adjustment
}

/**
 * Dispatcher: get salary at a given age based on the selected model.
 */
export function getSalaryAtAge(params: {
  model: SalaryModel
  baseSalary: number
  growthRate: number
  currentAge: number
  targetAge: number
  phases: CareerPhase[]
  promotionJumps: PromotionJump[]
  education: EducationLevel
  momAdjustment: number
}): number {
  switch (params.model) {
    case 'simple':
      return calculateSimpleSalary(
        params.baseSalary,
        params.growthRate,
        params.targetAge - params.currentAge
      )
    case 'realistic':
      return calculateRealisticSalary(
        params.baseSalary,
        params.currentAge,
        params.targetAge,
        params.phases,
        params.promotionJumps
      )
    case 'data-driven':
      return calculateDataDrivenSalary(
        params.targetAge,
        params.education,
        params.momAdjustment
      )
  }
}

/**
 * Get the amount for an income stream at a given age, applying the growth model.
 */
export function getStreamAmountAtAge(
  stream: IncomeStream,
  age: number,
  inflationRate: number
): number {
  if (!stream.isActive) return 0
  if (age < stream.startAge || age >= stream.endAge) return 0

  const yearsActive = age - stream.startAge

  switch (stream.growthModel) {
    case 'fixed':
      return stream.annualAmount * Math.pow(1 + stream.growthRate, yearsActive)
    case 'inflation-linked':
      return stream.annualAmount * Math.pow(1 + inflationRate, yearsActive)
    case 'none':
      return stream.annualAmount
  }
}

/**
 * Apply life events to an income amount at a given age.
 * Returns the modified amount after applying all matching event impacts.
 */
export function applyLifeEvents(
  baseAmount: number,
  age: number,
  streamId: string,
  lifeEvents: LifeEvent[],
  enabled: boolean
): number {
  if (!enabled) return baseAmount

  let amount = baseAmount
  for (const event of lifeEvents) {
    if (age >= event.startAge && age < event.endAge) {
      // If affectedStreamIds is empty, it affects all streams
      if (event.affectedStreamIds.length === 0 || event.affectedStreamIds.includes(streamId)) {
        amount *= event.incomeImpact
      }
    }
  }
  return amount
}

/**
 * Check if CPF should be paused at a given age due to life events.
 */
function isCpfPaused(age: number, lifeEvents: LifeEvent[], enabled: boolean): boolean {
  if (!enabled) return false
  return lifeEvents.some(
    (e) => e.cpfPause && age >= e.startAge && age < e.endAge
  )
}

/**
 * Check if savings should be paused at a given age due to life events.
 */
function isSavingsPaused(age: number, lifeEvents: LifeEvent[], enabled: boolean): boolean {
  if (!enabled) return false
  return lifeEvents.some(
    (e) => e.savingsPause && age >= e.startAge && age < e.endAge
  )
}

/**
 * Get active life event names at a given age.
 */
function getActiveLifeEventNames(age: number, lifeEvents: LifeEvent[], enabled: boolean): string[] {
  if (!enabled) return []
  return lifeEvents
    .filter((e) => age >= e.startAge && age < e.endAge)
    .map((e) => e.name)
}

export interface IncomeProjectionParams {
  currentAge: number
  retirementAge: number
  lifeExpectancy: number
  salaryModel: SalaryModel
  annualSalary: number
  salaryGrowthRate: number
  realisticPhases: CareerPhase[]
  promotionJumps: PromotionJump[]
  momEducation: EducationLevel
  momAdjustment: number
  employerCpfEnabled: boolean
  incomeStreams: IncomeStream[]
  lifeEvents: LifeEvent[]
  lifeEventsEnabled: boolean
  annualExpenses: number
  inflation: number
  personalReliefs: number
  srsAnnualContribution: number
  initialCpfOA: number
  initialCpfSA: number
  initialCpfMA: number
}

/**
 * Generate the complete year-by-year income projection from currentAge to lifeExpectancy.
 */
export function generateIncomeProjection(params: IncomeProjectionParams): IncomeProjectionRow[] {
  const rows: IncomeProjectionRow[] = []
  let cpfOA = params.initialCpfOA
  let cpfSA = params.initialCpfSA
  let cpfMA = params.initialCpfMA
  let cumulativeSavings = 0

  for (let age = params.currentAge; age <= params.lifeExpectancy; age++) {
    const year = age - params.currentAge
    const isRetired = age > params.retirementAge

    // Salary (only pre-retirement employment income)
    let salary = 0
    if (!isRetired) {
      salary = getSalaryAtAge({
        model: params.salaryModel,
        baseSalary: params.annualSalary,
        growthRate: params.salaryGrowthRate,
        currentAge: params.currentAge,
        targetAge: age,
        phases: params.realisticPhases,
        promotionJumps: params.promotionJumps,
        education: params.momEducation,
        momAdjustment: params.momAdjustment,
      })
      salary = applyLifeEvents(salary, age, '__salary__', params.lifeEvents, params.lifeEventsEnabled)
    }

    // Income streams by type
    let rentalIncome = 0
    let investmentIncome = 0
    let businessIncome = 0
    let governmentIncome = 0

    for (const stream of params.incomeStreams) {
      let amount = getStreamAmountAtAge(stream, age, params.inflation)
      amount = applyLifeEvents(amount, age, stream.id, params.lifeEvents, params.lifeEventsEnabled)

      switch (stream.type) {
        case 'rental':
          rentalIncome += amount
          break
        case 'investment':
          investmentIncome += amount
          break
        case 'business':
          businessIncome += amount
          break
        case 'government':
          governmentIncome += amount
          break
        case 'employment':
          // Employment streams add to salary
          salary += amount
          break
      }
    }

    const totalGross = salary + rentalIncome + investmentIncome + businessIncome + governmentIncome

    // CPF contributions (only if employed and not paused)
    let cpfEmployee = 0
    let cpfEmployer = 0
    const cpfPaused = isCpfPaused(age, params.lifeEvents, params.lifeEventsEnabled)

    if (!isRetired && params.employerCpfEnabled && salary > 0 && !cpfPaused) {
      const cpf = calculateCpfContribution(salary, age)
      cpfEmployee = cpf.employee
      cpfEmployer = cpf.employer

      // Allocate to CPF accounts
      cpfOA += cpf.oaAllocation
      cpfSA += cpf.saAllocation
      cpfMA += cpf.maAllocation
    }

    // CPF interest
    const oaInterest = cpfOA * OA_INTEREST_RATE
    const saInterest = cpfSA * SA_INTEREST_RATE
    const maInterest = cpfMA * MA_INTEREST_RATE
    const extraInterest = calculateCpfExtraInterest(cpfOA, cpfSA, cpfMA, age)

    cpfOA += oaInterest
    cpfSA += saInterest + extraInterest
    cpfMA += maInterest

    // Tax: only on taxable income
    const taxableIncome = salary + rentalIncome + businessIncome
    // Investment income and government income may be tax-exempt
    const chargeableIncome = calculateChargeableIncome(
      taxableIncome,
      cpfEmployee,
      params.srsAnnualContribution,
      params.personalReliefs
    )
    const taxResult = calculateProgressiveTax(chargeableIncome)
    const sgTax = taxResult.taxPayable

    // Net income
    const totalNet = totalGross - sgTax - cpfEmployee

    // Savings
    const inflationAdjustedExpenses = params.annualExpenses * Math.pow(1 + params.inflation, year)
    const savingsPaused = isSavingsPaused(age, params.lifeEvents, params.lifeEventsEnabled)
    const annualSavings = savingsPaused ? 0 : Math.max(0, totalNet - inflationAdjustedExpenses)
    cumulativeSavings += annualSavings

    const activeLifeEvents = getActiveLifeEventNames(age, params.lifeEvents, params.lifeEventsEnabled)

    rows.push({
      year,
      age,
      salary,
      rentalIncome,
      investmentIncome,
      businessIncome,
      governmentIncome,
      totalGross,
      sgTax,
      cpfEmployee,
      cpfEmployer,
      totalNet,
      annualSavings,
      cumulativeSavings,
      cpfOA,
      cpfSA,
      cpfMA,
      isRetired,
      activeLifeEvents,
    })
  }

  return rows
}

/**
 * Calculate summary statistics from a complete income projection.
 */
export function calculateIncomeSummary(
  projection: IncomeProjectionRow[],
  annualExpenses: number
): IncomeSummaryStats {
  if (projection.length === 0) {
    return {
      peakEarningAge: 0,
      peakEarningAmount: 0,
      lifetimeEarnings: 0,
      averageSavingsRate: 0,
      totalCpfContributions: 0,
      incomeReplacementRatio: 0,
    }
  }

  let peakEarningAge = projection[0].age
  let peakEarningAmount = 0
  let lifetimeEarnings = 0
  let totalSavings = 0
  let totalIncome = 0
  let totalCpfContributions = 0

  for (const row of projection) {
    if (row.totalGross > peakEarningAmount) {
      peakEarningAmount = row.totalGross
      peakEarningAge = row.age
    }
    lifetimeEarnings += row.totalGross

    if (!row.isRetired) {
      totalSavings += row.annualSavings
      totalIncome += row.totalNet
      totalCpfContributions += row.cpfEmployee + row.cpfEmployer
    }
  }

  const averageSavingsRate = totalIncome > 0
    ? totalSavings / totalIncome
    : 0

  // Income replacement ratio: last pre-retirement income vs annual expenses
  const lastPreRetirementRow = projection.find((r) => r.isRetired)
  const lastPreRetirementIdx = lastPreRetirementRow
    ? projection.indexOf(lastPreRetirementRow) - 1
    : projection.length - 1
  const lastPreRetirementIncome = lastPreRetirementIdx >= 0
    ? projection[lastPreRetirementIdx].totalNet
    : 0
  const incomeReplacementRatio = lastPreRetirementIncome > 0
    ? annualExpenses / lastPreRetirementIncome
    : 0

  return {
    peakEarningAge,
    peakEarningAmount,
    lifetimeEarnings,
    averageSavingsRate,
    totalCpfContributions,
    incomeReplacementRatio,
  }
}
