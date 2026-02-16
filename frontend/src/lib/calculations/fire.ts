import type { FireMetrics, FireType } from '@/lib/types'

/** Expense multiplier for each FIRE type */
const FIRE_TYPE_MULTIPLIERS: Record<FireType, number> = {
  regular: 1.0,
  lean: 0.6,
  fat: 1.5,
  coast: 1.0,
  barista: 1.0,
}

/**
 * FIRE Number = annual expenses / SWR
 * This is the portfolio size needed to fund retirement indefinitely.
 */
export function calculateFireNumber(annualExpenses: number, swr: number): number {
  if (swr <= 0 || annualExpenses <= 0) return 0
  return annualExpenses / swr
}

/**
 * Years to FIRE using the NPER formula (future value of growing annuity).
 *
 * Formula: ln((savings/r + fireNumber) / (savings/r + currentNW)) / ln(1+r)
 * where r = net real return (after inflation and expense ratio).
 *
 * Edge cases:
 * - r = 0: simple linear savings: (fireNumber - currentNW) / annualSavings
 * - currentNW >= fireNumber: 0 (already at FIRE)
 * - impossible (negative savings, zero growth, etc.): Infinity
 */
export function calculateYearsToFire(
  netRealReturn: number,
  annualSavings: number,
  currentNW: number,
  fireNumber: number
): number {
  if (currentNW >= fireNumber) return 0
  if (annualSavings <= 0 && netRealReturn <= 0) return Infinity

  if (Math.abs(netRealReturn) < 1e-10) {
    // r ≈ 0: simple linear
    if (annualSavings <= 0) return Infinity
    return (fireNumber - currentNW) / annualSavings
  }

  const r = netRealReturn
  const s = annualSavings
  const numerator = s / r + fireNumber
  const denominator = s / r + currentNW

  if (denominator <= 0 || numerator <= 0) return Infinity
  if (numerator / denominator <= 0) return Infinity

  const years = Math.log(numerator / denominator) / Math.log(1 + r)
  if (!isFinite(years) || years < 0) return Infinity
  return years
}

/**
 * Coast FIRE Number: the amount you need NOW such that compound growth
 * alone will reach your FIRE number by retirement.
 *
 * coastFire = fireNumber / (1 + netReturn)^yearsToRetirement
 */
export function calculateCoastFire(
  fireNumber: number,
  netReturn: number,
  yearsToRetirement: number
): number {
  if (yearsToRetirement <= 0) return fireNumber
  if (netReturn <= -1) return Infinity
  return fireNumber / Math.pow(1 + netReturn, yearsToRetirement)
}

/**
 * Barista FIRE Income: the minimum employment income needed if you
 * stop full-time work but let your portfolio cover part of expenses.
 *
 * baristaIncome = max(0, retirementExpenses - portfolio * swr)
 */
export function calculateBaristaFireIncome(
  retirementExpenses: number,
  liquidPortfolio: number,
  swr: number
): number {
  return Math.max(0, retirementExpenses - liquidPortfolio * swr)
}

/** Lean FIRE = 60% of expenses / SWR */
export function calculateLeanFire(annualExpenses: number, swr: number): number {
  return calculateFireNumber(annualExpenses * 0.6, swr)
}

/** Fat FIRE = 150% of expenses / SWR */
export function calculateFatFire(annualExpenses: number, swr: number): number {
  return calculateFireNumber(annualExpenses * 1.5, swr)
}

/** Progress toward FIRE target: NW / fireNumber (0 to 1+) */
export function calculateProgress(currentNW: number, fireNumber: number): number {
  if (fireNumber <= 0) return 0
  return currentNW / fireNumber
}

/**
 * Calculate all FIRE metrics from profile inputs.
 */
export function calculateAllFireMetrics(params: {
  currentAge: number
  retirementAge: number
  annualIncome: number
  annualExpenses: number
  liquidNetWorth: number
  cpfTotal: number
  swr: number
  expectedReturn: number
  inflation: number
  expenseRatio: number
  fireType?: FireType
}): FireMetrics {
  const {
    currentAge,
    retirementAge,
    annualIncome,
    annualExpenses,
    liquidNetWorth,
    cpfTotal,
    swr,
    expectedReturn,
    inflation,
    expenseRatio,
    fireType = 'regular',
  } = params

  const totalNetWorth = liquidNetWorth + cpfTotal
  const annualSavings = annualIncome - annualExpenses
  const savingsRate = annualIncome > 0 ? annualSavings / annualIncome : 0

  // Apply FIRE type multiplier to expenses for the main FIRE number
  const multiplier = FIRE_TYPE_MULTIPLIERS[fireType]
  const effectiveExpenses = annualExpenses * multiplier

  const fireNumber = calculateFireNumber(effectiveExpenses, swr)
  // Lean/Fat reference values always use base expenses
  const leanFireNumber = calculateLeanFire(annualExpenses, swr)
  const fatFireNumber = calculateFatFire(annualExpenses, swr)

  // Net real return = nominal - inflation - expense ratio
  const netRealReturn = expectedReturn - inflation - expenseRatio
  const yearsToRetirement = retirementAge - currentAge

  const yearsToFire = calculateYearsToFire(
    netRealReturn,
    annualSavings,
    totalNetWorth,
    fireNumber
  )
  const fireAge = currentAge + yearsToFire

  const coastFireNumber = calculateCoastFire(fireNumber, netRealReturn, yearsToRetirement)
  const baristaFireIncome = calculateBaristaFireIncome(effectiveExpenses, liquidNetWorth, swr)
  const progress = calculateProgress(totalNetWorth, fireNumber)

  return {
    fireNumber,
    leanFireNumber,
    fatFireNumber,
    coastFireNumber,
    baristaFireIncome,
    yearsToFire,
    fireAge,
    progress,
    savingsRate,
    annualSavings,
    totalNetWorth,
  }
}
