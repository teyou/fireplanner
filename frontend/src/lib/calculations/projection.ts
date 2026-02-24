/**
 * Year-by-year deterministic projection combining income engine, portfolio growth,
 * and withdrawal strategy into a single trajectory from currentAge to lifeExpectancy.
 *
 * Reuses pre-computed IncomeProjectionRow[] from income.ts — no recomputation.
 * Adds the portfolio/withdrawal dimension on top.
 */

import type {
  IncomeProjectionRow,
  ProjectionRow,
  ProjectionSummary,
  WithdrawalStrategyType,
  StrategyParamsMap,
  GlidePathConfig,
  ParentSupport,
  RetirementWithdrawal,
  FinancialGoal,
  DownsizingConfig,
  HealthcareConfig,
  CpfLifePlan,
} from '@/lib/types'
import { calculateParentSupportAtAge } from './fire'
import { calculateBrsFrsErs } from './cpf'
import { calculateHealthcareCostAtAge } from './healthcare'
import {
  outstandingMortgageAtAge,
  calculateSellAndDownsize,
  calculateSellAndRent,
} from './property'
import { calculatePortfolioReturn, interpolateGlidePath } from './portfolio'
import {
  constantDollar,
  vpw,
  guardrails,
  vanguardDynamic,
  capeBased,
  floorCeiling,
} from './withdrawal'

export interface ProjectionParams {
  incomeProjection: IncomeProjectionRow[]
  currentAge: number
  retirementAge: number
  lifeExpectancy: number
  initialLiquidNW: number
  swr: number
  expectedReturn: number
  usePortfolioReturn: boolean
  inflation: number
  expenseRatio: number
  annualExpenses: number
  retirementSpendingAdjustment: number
  fireNumber: number
  currentWeights: number[]
  targetWeights: number[]
  assetReturns: number[]
  glidePathConfig: GlidePathConfig
  withdrawalStrategy: WithdrawalStrategyType
  strategyParams: StrategyParamsMap
  // Property
  propertyEquity: number
  annualMortgagePayment: number
  annualRentalIncome: number
  // Downsizing
  downsizing: DownsizingConfig | null
  existingMortgageBalance: number
  existingMortgageRate: number
  existingMonthlyPayment: number
  existingMortgageRemainingYears: number
  residencyForAbsd: 'citizen' | 'pr' | 'foreigner'
  // Parent support
  parentSupport: ParentSupport[]
  parentSupportEnabled: boolean
  // Healthcare
  healthcareConfig: HealthcareConfig | null
  // One-time retirement withdrawals
  retirementWithdrawals?: RetirementWithdrawal[]
  // Financial goals (pre- and post-retirement)
  financialGoals?: FinancialGoal[]
  // CPF LIFE (for bequest + milestone computation)
  cpfLifeStartAge: number
  cpfLifePlan: CpfLifePlan
}

export interface ProjectionResult {
  rows: ProjectionRow[]
  summary: ProjectionSummary
}

/**
 * Determine allocation weights at a given age, accounting for glide path.
 * Pre-retirement uses currentWeights, post-retirement uses targetWeights,
 * with glide path interpolation when enabled and age is in range.
 */
function getWeightsAtAge(
  age: number,
  isRetired: boolean,
  currentWeights: number[],
  targetWeights: number[],
  glidePathConfig: GlidePathConfig,
): number[] {
  if (glidePathConfig.enabled) {
    if (age >= glidePathConfig.startAge && age <= glidePathConfig.endAge) {
      const duration = glidePathConfig.endAge - glidePathConfig.startAge
      const progress = duration > 0 ? (age - glidePathConfig.startAge) / duration : 1
      return interpolateGlidePath(currentWeights, targetWeights, progress, glidePathConfig.method)
    }
    if (age > glidePathConfig.endAge) {
      return targetWeights
    }
  }
  return isRetired ? targetWeights : currentWeights
}

/**
 * Compute the initial withdrawal amount at retirement start.
 * For expense-based strategies (constant_dollar, guardrails, vanguard_dynamic),
 * uses actual retirement expenses so withdrawals track real spending needs.
 * For portfolio-based strategies, falls back to portfolio * rate.
 */
function computeInitialWithdrawal(
  portfolio: number,
  strategy: WithdrawalStrategyType,
  strategyParams: StrategyParamsMap,
  defaultSwr: number,
  _retirementExpenses?: number,
): number {
  // Always use each strategy's own rate parameter so that tuning
  // the SWR / initial-rate input is reflected in Max Withdrawal.
  // The projection already caps actualDraw = min(expenseGap, strategyWithdrawal),
  // so the user only withdraws what they need regardless.
  switch (strategy) {
    case 'constant_dollar':
      return portfolio * strategyParams.constant_dollar.swr
    case 'guardrails':
      return portfolio * strategyParams.guardrails.initialRate
    case 'vanguard_dynamic':
      return portfolio * strategyParams.vanguard_dynamic.swr
    case 'floor_ceiling':
      return portfolio * strategyParams.floor_ceiling.targetRate
    default:
      return portfolio * defaultSwr
  }
}

/**
 * Dispatch to the correct withdrawal strategy function.
 */
function computeWithdrawal(
  portfolio: number,
  retirementYear: number,
  strategy: WithdrawalStrategyType,
  strategyParams: StrategyParamsMap,
  initialWithdrawal: number,
  prevWithdrawal: number,
  inflation: number,
  remainingYears: number,
): number {
  switch (strategy) {
    case 'constant_dollar':
      return constantDollar(portfolio, retirementYear, initialWithdrawal, inflation)
    case 'vpw':
      return vpw(
        portfolio, remainingYears,
        strategyParams.vpw.expectedRealReturn, strategyParams.vpw.targetEndValue,
      )
    case 'guardrails': {
      const gp = strategyParams.guardrails
      return guardrails(
        portfolio, retirementYear, initialWithdrawal, prevWithdrawal, inflation,
        gp.initialRate, gp.ceilingTrigger, gp.floorTrigger, gp.adjustmentSize,
      )
    }
    case 'vanguard_dynamic': {
      const vd = strategyParams.vanguard_dynamic
      return vanguardDynamic(
        portfolio, retirementYear, initialWithdrawal, prevWithdrawal, inflation,
        vd.swr, vd.ceiling, vd.floor,
      )
    }
    case 'cape_based': {
      const cb = strategyParams.cape_based
      return capeBased(portfolio, retirementYear, cb.baseRate, cb.capeWeight, cb.currentCape)
    }
    case 'floor_ceiling': {
      const fc = strategyParams.floor_ceiling
      return floorCeiling(portfolio, fc.floor, fc.ceiling, fc.targetRate)
    }
    default:
      return constantDollar(portfolio, retirementYear, initialWithdrawal, inflation)
  }
}

/**
 * Generate the complete year-by-year projection from currentAge to lifeExpectancy.
 *
 * Pre-retirement: liquidNW = liquidNW × (1 + rate) + annualSavings
 * Post-retirement: liquidNW = (liquidNW - netWithdrawal) × (1 + rate), clamped to ≥ 0
 *   where netWithdrawal = withdrawalAmount - postRetirementIncome
 */
export function generateProjection(params: ProjectionParams): ProjectionResult {
  const {
    incomeProjection,
    currentAge,
    retirementAge,
    lifeExpectancy,
    initialLiquidNW,
    swr,
    expectedReturn,
    usePortfolioReturn,
    inflation,
    expenseRatio,
    annualExpenses,
    retirementSpendingAdjustment,
    fireNumber,
    currentWeights,
    targetWeights,
    assetReturns,
    glidePathConfig,
    withdrawalStrategy,
    strategyParams,
    propertyEquity,
    annualMortgagePayment,
    annualRentalIncome,
    downsizing,
    existingMortgageBalance,
    existingMortgageRate,
    existingMonthlyPayment,
    residencyForAbsd,
    parentSupport,
    parentSupportEnabled,
    healthcareConfig,
    cpfLifeStartAge,
    cpfLifePlan,
  } = params

  const rows: ProjectionRow[] = []
  let liquidNW = initialLiquidNW
  let prevWithdrawal = 0
  let initialWithdrawal = 0
  let retirementYearCounter = -1
  let fireAchievedAge: number | null = null
  let peakTotalNW = 0
  let peakTotalNWAge = currentAge
  let portfolioDepletedAge: number | null = null

  // CPF milestone + bequest tracking
  const brsFrsErs = calculateBrsFrsErs(currentAge)
  let brsReached = false
  let frsReached = false
  let ersReached = false
  let cpfLifeStarted = false
  let annuityPremium = 0
  let payoutsFromAnnuity = 0
  let raFullyDepleted = false
  let prevCpfTotal = 0

  // Mortgage ends after the remaining term
  const mortgageEndAge = currentAge + Math.ceil(params.existingMortgageRemainingYears)

  // Pre-compute downsizing results
  const dsActive = downsizing && downsizing.scenario !== 'none'
  const dsSellAge = dsActive ? downsizing.sellAge : Infinity
  let dsNetEquity = 0
  let dsNewMonthlyPayment = 0
  let dsAnnualRent = 0

  if (dsActive && downsizing) {
    const yearsToSell = dsSellAge - currentAge
    const outstandingAtSell = outstandingMortgageAtAge(
      existingMortgageBalance,
      existingMonthlyPayment,
      existingMortgageRate,
      Math.max(0, yearsToSell),
    )

    if (downsizing.scenario === 'sell-and-downsize') {
      const result = calculateSellAndDownsize({
        salePrice: downsizing.expectedSalePrice,
        outstandingMortgage: outstandingAtSell,
        newPropertyCost: downsizing.newPropertyCost,
        newLtv: downsizing.newLtv,
        newMortgageRate: downsizing.newMortgageRate,
        newMortgageTerm: downsizing.newMortgageTerm,
        residency: residencyForAbsd,
        propertyCount: 0, // selling existing, buying replacement = still 1st property
      })
      dsNetEquity = result.netEquityToPortfolio
      dsNewMonthlyPayment = result.newMonthlyPayment
    } else if (downsizing.scenario === 'sell-and-rent') {
      const result = calculateSellAndRent({
        salePrice: downsizing.expectedSalePrice,
        outstandingMortgage: outstandingAtSell,
        monthlyRent: downsizing.monthlyRent,
      })
      dsNetEquity = result.netProceedsToPortfolio
      dsAnnualRent = result.annualRent
    }
  }

  const totalYears = lifeExpectancy - currentAge

  for (let i = 0; i <= totalYears; i++) {
    const age = currentAge + i
    const year = i
    const isRetired = age > retirementAge
    const incomeRow = incomeProjection[i]
    if (!incomeRow) break

    // Track retirement year (0-indexed from first retired year)
    if (isRetired) retirementYearCounter++
    const retirementYear = retirementYearCounter

    // Weights for this age
    const weights = getWeightsAtAge(age, isRetired, currentWeights, targetWeights, glidePathConfig)

    // Return rate (nominal, net of expense ratio)
    let returnRate: number
    if (usePortfolioReturn && assetReturns.length === weights.length) {
      returnRate = calculatePortfolioReturn(weights, assetReturns) - expenseRatio
    } else {
      returnRate = expectedReturn - expenseRatio
    }

    // Downsizing: inject lump sum at sell age (before capturing startLiquidNW)
    const soldProperty = dsActive && age >= dsSellAge
    if (dsActive && age === dsSellAge) {
      liquidNW += dsNetEquity
    }

    const startLiquidNW = liquidNW
    let withdrawalAmount = 0
    let maxPermittedWithdrawal = 0
    let withdrawalExcess = 0
    let portfolioReturnDollar: number
    let savingsOrWithdrawal: number
    let totalIncome: number
    let goalDeduction = 0

    // Parent support at this age (uses its own growth rate, not inflation)
    const parentSupportExpense = parentSupportEnabled
      ? calculateParentSupportAtAge(parentSupport, age)
      : 0

    // Healthcare cash outlay at this age (age-dependent, not inflation-adjusted — premiums are already age-based)
    const healthcareCost = healthcareConfig?.enabled
      ? calculateHealthcareCostAtAge(healthcareConfig, age)
      : null
    const healthcareCashOutlay = healthcareCost?.cashOutlay ?? 0

    // Property cashflows depend on whether property has been sold
    let effectiveMortgagePayment = age >= mortgageEndAge ? 0 : annualMortgagePayment
    // When CPF OA can't cover its mortgage share, the shortfall spills to cash
    effectiveMortgagePayment += incomeRow.cpfOaShortfall
    let effectiveRentalIncome = annualRentalIncome
    let effectivePropertyEquity = propertyEquity
    let downsizingRentExpense = 0

    if (soldProperty && downsizing) {
      // After selling, no existing mortgage or rental income
      effectiveRentalIncome = 0
      if (downsizing.scenario === 'sell-and-downsize') {
        effectiveMortgagePayment = dsNewMonthlyPayment * 12
        // New property equity grows from down payment
        const yearsSinceSell = age - dsSellAge
        const newDownPayment = downsizing.newPropertyCost * (1 - downsizing.newLtv)
        const newMortgageBalance = outstandingMortgageAtAge(
          downsizing.newPropertyCost * downsizing.newLtv,
          dsNewMonthlyPayment,
          downsizing.newMortgageRate,
          yearsSinceSell,
        )
        effectivePropertyEquity = newDownPayment + (downsizing.newPropertyCost * downsizing.newLtv - newMortgageBalance)
      } else if (downsizing.scenario === 'sell-and-rent') {
        effectiveMortgagePayment = 0
        effectivePropertyEquity = 0
        // Rent grows over time from sell age
        const yearsSinceSell = age - dsSellAge
        downsizingRentExpense = dsAnnualRent * Math.pow(1 + (downsizing.rentGrowthRate ?? 0.03), yearsSinceSell)
      }
    }

    const baseExpenses = isRetired ? annualExpenses * retirementSpendingAdjustment : annualExpenses
    const inflationAdjustedExpenses = baseExpenses * Math.pow(1 + inflation, year) + parentSupportExpense + downsizingRentExpense + healthcareCashOutlay

    if (!isRetired) {
      // Pre-retirement: accumulation
      const netPropertyCashflow = effectiveRentalIncome - effectiveMortgagePayment
      // Extra expenses (parent support, healthcare, downsizing rent) are computed by the
      // projection but NOT included in income projection's annualSavings — deduct them here.
      const extraExpenses = parentSupportExpense + healthcareCashOutlay + downsizingRentExpense
      // When income < base expenses, income projection clamps annualSavings to max(0, ...).
      // The shortfall must still be deducted from the portfolio.
      const baseExpInflated = annualExpenses * Math.pow(1 + inflation, year)
      const incomeShortfall = Math.max(0, baseExpInflated - incomeRow.totalNet)

      // Financial goals that fall in this year (pre-retirement)
      goalDeduction = 0
      for (const goal of params.financialGoals ?? []) {
        const endAge = goal.targetAge + goal.durationYears
        if (age >= goal.targetAge && age < endAge) {
          const yearlyAmount = goal.inflationAdjusted
            ? (goal.amount / goal.durationYears) * Math.pow(1 + inflation, year)
            : goal.amount / goal.durationYears
          goalDeduction += yearlyAmount
        }
      }

      const adjustedSavings = incomeRow.annualSavings + netPropertyCashflow - extraExpenses - incomeShortfall - goalDeduction
      portfolioReturnDollar = startLiquidNW * returnRate
      liquidNW = Math.max(0, startLiquidNW * (1 + returnRate) + adjustedSavings)
      savingsOrWithdrawal = adjustedSavings
      totalIncome = incomeRow.totalNet + effectiveRentalIncome
    } else {
      // Post-retirement: decumulation

      // Compute initial withdrawal at the start of retirement.
      // Use full inflation-adjusted expenses (including parent support, healthcare,
      // downsizing rent) so the strategy covers actual spending needs.
      if (retirementYear === 0) {
        initialWithdrawal = computeInitialWithdrawal(
          startLiquidNW, withdrawalStrategy, strategyParams, swr, inflationAdjustedExpenses,
        )
      }

      // Post-retirement income from active streams + existing property rental + SRS drawdown
      const postRetirementIncome = incomeRow.rentalIncome + incomeRow.investmentIncome +
        incomeRow.businessIncome + incomeRow.governmentIncome + incomeRow.srsWithdrawal + effectiveRentalIncome

      // Compute max permitted withdrawal from strategy
      let strategyWithdrawal = 0
      if (startLiquidNW > 0) {
        const remainingYears = lifeExpectancy - age
        strategyWithdrawal = computeWithdrawal(
          startLiquidNW, retirementYear, withdrawalStrategy, strategyParams,
          initialWithdrawal, prevWithdrawal, inflation, remainingYears,
        )
        // Can't withdraw more than portfolio
        strategyWithdrawal = Math.min(strategyWithdrawal, startLiquidNW)
      }

      // One-time retirement withdrawals at this age (supports durationYears range)
      let oneTimeWithdrawalTotal = 0
      for (const rw of params.retirementWithdrawals ?? []) {
        const endAge = rw.age + (rw.durationYears ?? 1)
        if (age >= rw.age && age < endAge) {
          const amount = rw.inflationAdjusted
            ? rw.amount * Math.pow(1 + inflation, year)
            : rw.amount
          oneTimeWithdrawalTotal += amount
        }
      }

      // Financial goals that fall in retirement
      goalDeduction = 0
      for (const goal of params.financialGoals ?? []) {
        const endAge = goal.targetAge + goal.durationYears
        if (age >= goal.targetAge && age < endAge) {
          const yearlyAmount = goal.inflationAdjusted
            ? (goal.amount / goal.durationYears) * Math.pow(1 + inflation, year)
            : goal.amount / goal.durationYears
          goalDeduction += yearlyAmount
        }
      }
      oneTimeWithdrawalTotal += goalDeduction

      // Actual draw = expense gap after passive income (always fund expenses from portfolio).
      // maxPermittedWithdrawal (strategy-based) is advisory — shown alongside for comparison.
      const expenseGap = Math.max(0, inflationAdjustedExpenses - postRetirementIncome)
      const actualDraw = Math.min(expenseGap, startLiquidNW)
      const surplusIncome = Math.max(0, postRetirementIncome - inflationAdjustedExpenses)

      // Portfolio: loses actual draw + one-time withdrawals + mortgage, gains surplus passive income.
      // Mortgage is deducted here (property rental already reduces expenseGap via postRetirementIncome).
      const netPortfolioDraw = actualDraw + oneTimeWithdrawalTotal + effectiveMortgagePayment - surplusIncome
      const afterDraw = startLiquidNW - netPortfolioDraw
      portfolioReturnDollar = afterDraw * returnRate
      liquidNW = Math.max(0, afterDraw * (1 + returnRate))

      // Feed uncapped strategy amount back for strategy continuity
      prevWithdrawal = strategyWithdrawal
      withdrawalAmount = actualDraw
      maxPermittedWithdrawal = strategyWithdrawal
      withdrawalExcess = strategyWithdrawal - actualDraw
      savingsOrWithdrawal = -netPortfolioDraw
      totalIncome = postRetirementIncome
    }

    // CPF and totals
    const cpfTotal = incomeRow.cpfOA + incomeRow.cpfSA + incomeRow.cpfMA + incomeRow.cpfRA
    const totalNW = liquidNW + cpfTotal

    // FIRE progress
    const fireProgress = fireNumber > 0 ? totalNW / fireNumber : 0

    // Track FIRE achievement
    if (fireProgress >= 1 && fireAchievedAge === null) {
      fireAchievedAge = age
    }

    // Track peak NW
    if (totalNW > peakTotalNW) {
      peakTotalNW = totalNW
      peakTotalNWAge = age
    }

    // Track depletion
    if (isRetired && liquidNW <= 0 && portfolioDepletedAge === null) {
      portfolioDepletedAge = age
    }

    // CPF detail: interest, milestones, bequest
    const annualContribution = incomeRow.cpfEmployee + incomeRow.cpfEmployer
    const cpfInterest = i > 0
      ? Math.max(0, cpfTotal - prevCpfTotal - annualContribution + incomeRow.cpfOaHousingDeduction)
      : 0

    let cpfMilestone: ProjectionRow['cpfMilestone'] = null
    if (!brsReached && cpfTotal >= brsFrsErs.brs) {
      cpfMilestone = 'brs'
      brsReached = true
    }
    if (!frsReached && cpfTotal >= brsFrsErs.frs) {
      cpfMilestone = 'frs'
      frsReached = true
    }
    if (!ersReached && cpfTotal >= brsFrsErs.ers) {
      cpfMilestone = 'ers'
      ersReached = true
    }
    if (!cpfLifeStarted && age === cpfLifeStartAge) {
      cpfMilestone = 'cpfLifeStart'
      cpfLifeStarted = true
    }
    if (age === 55 && incomeRow.cpfRA > 0 && cpfMilestone === null) {
      cpfMilestone = 'raCreated'
    }

    if (incomeRow.cpfLifeAnnuityPremium > 0) {
      annuityPremium = incomeRow.cpfLifeAnnuityPremium
    }
    let cpfBequest = 0
    if (age >= cpfLifeStartAge && annuityPremium > 0) {
      if (cpfLifePlan === 'basic') {
        if (incomeRow.cpfRA > 0) {
          cpfBequest = incomeRow.cpfRA + annuityPremium
        } else {
          if (!raFullyDepleted) {
            raFullyDepleted = true
            payoutsFromAnnuity = 0
          }
          payoutsFromAnnuity += incomeRow.cpfLifePayout
          cpfBequest = Math.max(0, annuityPremium - payoutsFromAnnuity)
        }
      } else {
        payoutsFromAnnuity += incomeRow.cpfLifePayout
        cpfBequest = Math.max(0, annuityPremium - payoutsFromAnnuity)
      }
    }

    prevCpfTotal = cpfTotal

    rows.push({
      age,
      year,
      isRetired,
      totalIncome,
      annualExpenses: inflationAdjustedExpenses,
      savingsOrWithdrawal,
      portfolioReturnDollar,
      portfolioReturnPct: returnRate,
      liquidNW,
      cpfTotal,
      totalNW,
      fireProgress,
      salary: incomeRow.salary,
      rentalIncome: incomeRow.rentalIncome,
      investmentIncome: incomeRow.investmentIncome,
      businessIncome: incomeRow.businessIncome,
      governmentIncome: incomeRow.governmentIncome,
      srsWithdrawal: incomeRow.srsWithdrawal,
      totalGross: incomeRow.totalGross,
      sgTax: incomeRow.sgTax,
      cpfEmployee: incomeRow.cpfEmployee,
      cpfEmployer: incomeRow.cpfEmployer,
      totalNet: incomeRow.totalNet,
      cpfOA: incomeRow.cpfOA,
      cpfSA: incomeRow.cpfSA,
      cpfMA: incomeRow.cpfMA,
      cpfRA: incomeRow.cpfRA,
      cpfInterest,
      cpfOaHousingDeduction: incomeRow.cpfOaHousingDeduction,
      cpfOaShortfall: incomeRow.cpfOaShortfall,
      cpfLifePayout: incomeRow.cpfLifePayout,
      cpfBequest,
      cpfMilestone,
      propertyEquity: effectivePropertyEquity,
      totalNWIncProperty: totalNW + effectivePropertyEquity,
      withdrawalAmount,
      maxPermittedWithdrawal,
      withdrawalExcess,
      baseInflatedExpenses: baseExpenses * Math.pow(1 + inflation, year),
      parentSupportExpense,
      healthcareCashOutlay,
      mortgageCashPayment: effectiveMortgagePayment,
      downsizingRentExpense,
      goalExpense: goalDeduction,
      cumulativeSavings: incomeRow.cumulativeSavings,
      activeLifeEvents: incomeRow.activeLifeEvents,
    })
  }

  const lastRow = rows[rows.length - 1]
  const summary: ProjectionSummary = {
    fireAchievedAge,
    peakTotalNW,
    peakTotalNWAge,
    terminalLiquidNW: lastRow?.liquidNW ?? 0,
    terminalTotalNW: lastRow?.totalNW ?? 0,
    portfolioDepletedAge,
  }

  return { rows, summary }
}
