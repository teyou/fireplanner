import type {
  CareerPhase,
  PromotionJump,
  IncomeStream,
  LifeEvent,
  IncomeProjectionRow,
  IncomeSummaryStats,
  SalaryModel,
  EducationLevel,
  CpfLifePlan,
  CpfRetirementSum,
  CpfHousingMode,
} from '@/lib/types'
import { getMomSalary } from '@/lib/data/momSalary'
import { calculateCpfContribution, calculateCpfExtraInterestWithAge, calculateCpfLifePayoutAtAge, getRetirementSumAmount, performAge55Transfer, allocatePostAge55Contribution } from './cpf'
import { calculateChargeableIncome, calculateProgressiveTax } from './tax'
import {
  OA_INTEREST_RATE,
  SA_INTEREST_RATE,
  MA_INTEREST_RATE,
  RA_INTEREST_RATE,
  CPF_LIFE_BASIC_PREMIUM_RATE,
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
 * scaled by a user adjustment factor and inflated to future nominal dollars.
 *
 * MOM benchmarks are in today's dollars. When projecting forward, we inflate
 * by (1 + inflation)^yearsForward to convert to nominal (future) dollars,
 * keeping the projection consistent with how expenses are inflated.
 */
export function calculateDataDrivenSalary(
  age: number,
  education: EducationLevel,
  adjustment: number,
  inflation: number = 0,
  yearsForward: number = 0
): number {
  const momSalary = getMomSalary(age, education)
  const inflationFactor = yearsForward > 0 ? Math.pow(1 + inflation, yearsForward) : 1
  return momSalary * adjustment * inflationFactor
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
  inflation?: number
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
        params.momAdjustment,
        params.inflation ?? 0,
        params.targetAge - params.currentAge
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
  initialCpfRA?: number
  // CPF LIFE configuration
  cpfLifeStartAge?: number
  cpfLifePlan?: CpfLifePlan
  cpfRetirementSum?: CpfRetirementSum
  // CPF OA Housing deduction
  cpfHousingMode?: CpfHousingMode
  cpfHousingMonthly?: number
  cpfMortgageYearsLeft?: number
  // 65+ users can enter their actual CPF LIFE payout directly
  cpfLifeActualMonthlyPayout?: number
  // Residency status for correct SRS cap
  residencyStatus?: 'citizen' | 'pr' | 'foreigner'
  // SRS lifecycle
  srsBalance?: number
  srsInvestmentReturn?: number
  srsDrawdownStartAge?: number
}

/**
 * Generate the complete year-by-year income projection from currentAge to lifeExpectancy.
 */
export function generateIncomeProjection(params: IncomeProjectionParams): IncomeProjectionRow[] {
  const rows: IncomeProjectionRow[] = []
  let cpfOA = params.initialCpfOA
  let cpfSA = params.initialCpfSA
  let cpfMA = params.initialCpfMA
  let cpfRA = params.initialCpfRA ?? 0
  let cumulativeSavings = 0
  let saClosed = false
  let raBalanceAtLifeStart = 0

  // SRS lifecycle tracking
  let srsBalance = params.srsBalance ?? 0
  const srsReturn = params.srsInvestmentReturn ?? 0.04
  const srsDrawdownStart = params.srsDrawdownStartAge ?? 63
  const srsDrawdownEnd = srsDrawdownStart + 10
  const srsCap = params.residencyStatus === 'foreigner' ? 35700 : 15300

  // CPF LIFE configuration (defaults for backward compat)
  const cpfLifeStartAge = params.cpfLifeStartAge ?? 65
  const cpfLifePlan = params.cpfLifePlan ?? 'standard'
  const cpfRetirementSum = params.cpfRetirementSum ?? 'frs'
  const cpfHousingMode = params.cpfHousingMode ?? 'none'
  const cpfHousingMonthly = params.cpfHousingMonthly ?? 0
  const cpfHousingEndAge = params.currentAge + (params.cpfMortgageYearsLeft ?? 25)
  const cpfLifeActualMonthlyPayout = params.cpfLifeActualMonthlyPayout ?? 0

  // Check if user has a manual CPF LIFE government income stream
  const hasManualCpfLife = params.incomeStreams.some(
    (s) => s.type === 'government' && s.isActive && s.name.toLowerCase().includes('cpf life')
  )

  // Retirement sum target for RA transfer and post-55 contribution routing
  const retirementSumTarget = getRetirementSumAmount(cpfRetirementSum, params.currentAge)

  // For users already past 55: SA should have been transferred to RA
  if (params.currentAge > 55) {
    saClosed = true
    if (cpfSA > 0 && cpfRA === 0) {
      const transfer = performAge55Transfer(cpfOA, cpfSA, retirementSumTarget)
      cpfOA = transfer.newOA
      cpfSA = transfer.newSA
      cpfRA = transfer.newRA
    }
  }

  for (let age = params.currentAge; age <= params.lifeExpectancy; age++) {
    const year = age - params.currentAge
    const isRetired = age > params.retirementAge

    // CPF OA Housing deduction (before contributions and interest)
    let cpfOaHousingDeduction = 0
    let cpfOaShortfall = 0
    if (cpfHousingMode !== 'none' && cpfHousingMonthly > 0 && age < cpfHousingEndAge) {
      const annualDeduction = cpfHousingMonthly * 12
      cpfOaHousingDeduction = Math.min(annualDeduction, cpfOA)
      cpfOaShortfall = Math.max(0, annualDeduction - cpfOA)
      cpfOA = Math.max(0, cpfOA - cpfOaHousingDeduction)
    }

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
        inflation: params.inflation,
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

    // At age 55: transfer SA → RA (Retirement Account)
    if (age === 55 && !saClosed) {
      const transfer = performAge55Transfer(cpfOA, cpfSA, retirementSumTarget)
      cpfOA = transfer.newOA
      cpfSA = transfer.newSA
      cpfRA = transfer.newRA
      saClosed = true
    }

    // CPF LIFE annuitization at start age
    if (age === cpfLifeStartAge) {
      raBalanceAtLifeStart = cpfRA
      if (cpfLifePlan === 'basic') {
        // Basic: ~15% goes to annuity premium, rest stays in RA for direct drawdown
        cpfRA = cpfRA * (1 - CPF_LIFE_BASIC_PREMIUM_RATE)
      } else {
        // Standard/Escalating: full RA goes to annuity
        cpfRA = 0
      }
    }

    // Automated CPF LIFE payout (skip if user has manual stream)
    let cpfLifePayout = 0
    if (!hasManualCpfLife && age >= cpfLifeStartAge) {
      if (cpfLifeActualMonthlyPayout > 0) {
        // 65+ users enter their known monthly payout directly
        cpfLifePayout = cpfLifeActualMonthlyPayout * 12
      } else {
        cpfLifePayout = calculateCpfLifePayoutAtAge(raBalanceAtLifeStart, cpfLifePlan, cpfLifeStartAge, age)
      }
      governmentIncome += cpfLifePayout
    }

    // SRS lifecycle: accumulation before drawdown start, drawdown from startAge to +10 years
    let srsContribution = 0
    let srsWithdrawal = 0
    let srsTaxableWithdrawal = 0
    if (age < srsDrawdownStart) {
      // Accumulation: contribute + earn returns
      srsContribution = !isRetired ? Math.min(params.srsAnnualContribution, srsCap) : 0
      srsBalance = (srsBalance + srsContribution) * (1 + srsReturn)
    } else if (age >= srsDrawdownStart && age < srsDrawdownEnd && srsBalance > 0) {
      // Drawdown: spread evenly over remaining drawdown years
      const remainingDrawdownYears = srsDrawdownEnd - age
      srsWithdrawal = srsBalance / remainingDrawdownYears
      srsBalance -= srsWithdrawal
      srsBalance = Math.max(0, srsBalance)
      srsTaxableWithdrawal = srsWithdrawal * 0.5 // 50% tax concession
      // SRS withdrawal tracked separately — not folded into governmentIncome
    }

    const totalGross = salary + rentalIncome + investmentIncome + businessIncome + governmentIncome + srsWithdrawal

    // CPF contributions (only if employed and not paused)
    let cpfEmployee = 0
    let cpfEmployer = 0
    const cpfPaused = isCpfPaused(age, params.lifeEvents, params.lifeEventsEnabled)

    if (!isRetired && params.employerCpfEnabled && salary > 0 && !cpfPaused) {
      const cpf = calculateCpfContribution(salary, age)
      cpfEmployee = cpf.employee
      cpfEmployer = cpf.employer

      if (saClosed) {
        if (age >= cpfLifeStartAge) {
          // Post-LIFE: no more RA accumulation, SA portion → OA
          cpfOA += cpf.oaAllocation + cpf.saAllocation
          cpfMA += cpf.maAllocation
        } else {
          // Post-55, pre-LIFE: SA allocation goes to RA (if room) or overflows to OA
          const alloc = allocatePostAge55Contribution(cpf, cpfRA, retirementSumTarget)
          cpfOA += alloc.oaAllocation
          cpfRA += alloc.raAllocation
          cpfMA += alloc.maAllocation
        }
      } else {
        cpfOA += cpf.oaAllocation
        cpfSA += cpf.saAllocation
        cpfMA += cpf.maAllocation
      }
    }

    // CPF interest
    const oaInterest = cpfOA * OA_INTEREST_RATE
    const saInterest = saClosed ? 0 : cpfSA * SA_INTEREST_RATE
    const maInterest = cpfMA * MA_INTEREST_RATE
    const raInterest = cpfRA * RA_INTEREST_RATE
    const extraInterest = calculateCpfExtraInterestWithAge(cpfOA, cpfSA, cpfMA, cpfRA, age)

    cpfOA += oaInterest
    if (saClosed) {
      if (age >= cpfLifeStartAge) {
        if (cpfLifePlan === 'basic' && cpfRA > 0) {
          // Basic: RA earns 4% interest + extra interest, then payout is deducted
          cpfRA += raInterest + extraInterest
          cpfRA = Math.max(0, cpfRA - cpfLifePayout)
        } else {
          // Standard/Escalating, or Basic with depleted RA: extra interest → OA
          cpfOA += extraInterest
        }
      } else {
        cpfRA += raInterest + extraInterest
      }
    } else {
      cpfSA += saInterest + extraInterest
    }
    cpfMA += maInterest

    // Tax: only on taxable income
    // SRS drawdown: only 50% is taxable (srsTaxableWithdrawal = withdrawal * 0.5)
    const taxableIncome = salary + rentalIncome + businessIncome + srsTaxableWithdrawal
    // Investment income and CPF LIFE are tax-exempt
    // Use actual SRS contribution this year (0 during drawdown/post-retirement)
    const chargeableIncome = calculateChargeableIncome(
      taxableIncome,
      cpfEmployee,
      srsContribution,
      params.personalReliefs,
      params.residencyStatus
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

    // Record annuity premium on the LIFE start row
    let cpfLifeAnnuityPremium = 0
    if (age === cpfLifeStartAge && raBalanceAtLifeStart > 0) {
      cpfLifeAnnuityPremium = cpfLifePlan === 'basic'
        ? raBalanceAtLifeStart * CPF_LIFE_BASIC_PREMIUM_RATE
        : raBalanceAtLifeStart
    }

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
      cpfRA,
      isRetired,
      activeLifeEvents,
      cpfLifePayout,
      cpfOaHousingDeduction,
      cpfOaShortfall,
      cpfLifeAnnuityPremium,
      srsBalance,
      srsContribution,
      srsWithdrawal,
      srsTaxableWithdrawal,
      // Cash reserve defaults (populated by hook post-processing)
      cashReserveTarget: 0,
      cashReserveBalance: 0,
      investedSavings: annualSavings,
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
