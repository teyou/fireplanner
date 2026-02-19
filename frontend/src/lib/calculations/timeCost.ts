import { calculateFireNumber, calculateYearsToFire } from './fire'

export interface TimeCostBaseInput {
  annualExpenses: number
  annualIncome: number
  liquidNetWorth: number
  cpfTotal: number
  swr: number
  netRealReturn: number
  retirementAge: number
  currentAge: number
}

export interface OneTimeCostResult {
  delayYears: number
  delayMonths: number
  opportunityCost: number
}

export interface RecurringCostResult {
  delayYears: number
  delayMonths: number
  newFireNumber: number
  annualCost: number
}

/**
 * Calculate the FIRE delay from a one-time expense.
 * Subtracts amount from net worth and recalculates years-to-FIRE.
 */
export function calculateOneTimeCost(
  input: TimeCostBaseInput,
  amount: number
): OneTimeCostResult {
  if (amount <= 0) return { delayYears: 0, delayMonths: 0, opportunityCost: 0 }

  const fireNumber = calculateFireNumber(input.annualExpenses, input.swr)
  const totalNW = input.liquidNetWorth + input.cpfTotal
  const annualSavings = input.annualIncome - input.annualExpenses

  const baseYears = calculateYearsToFire(input.netRealReturn, annualSavings, totalNW, fireNumber)
  const reducedNW = totalNW - amount
  const newYears = calculateYearsToFire(input.netRealReturn, annualSavings, reducedNW, fireNumber)

  const delay = isFinite(newYears) && isFinite(baseYears)
    ? newYears - baseYears
    : isFinite(baseYears) ? Infinity : 0

  const delayYears = isFinite(delay) ? Math.floor(delay) : Infinity
  const delayMonths = isFinite(delay) ? Math.round((delay - Math.floor(delay)) * 12) : 0

  // Opportunity cost: what this amount would grow to by retirement
  const yearsToRetirement = Math.max(0, input.retirementAge - input.currentAge)
  const opportunityCost = input.netRealReturn > -1
    ? amount * Math.pow(1 + input.netRealReturn, yearsToRetirement)
    : amount

  return { delayYears, delayMonths, opportunityCost }
}

/**
 * Calculate the FIRE delay from a recurring monthly expense.
 * Adds to annual expenses (increasing FIRE number) and reduces savings.
 */
export function calculateRecurringCost(
  input: TimeCostBaseInput,
  monthlyAmount: number
): RecurringCostResult {
  if (monthlyAmount <= 0) return { delayYears: 0, delayMonths: 0, newFireNumber: 0, annualCost: 0 }

  const annualCost = monthlyAmount * 12
  const fireNumber = calculateFireNumber(input.annualExpenses, input.swr)
  const newFireNumber = calculateFireNumber(input.annualExpenses + annualCost, input.swr)
  const totalNW = input.liquidNetWorth + input.cpfTotal
  const annualSavings = input.annualIncome - input.annualExpenses

  const baseYears = calculateYearsToFire(input.netRealReturn, annualSavings, totalNW, fireNumber)
  const newSavings = annualSavings - annualCost
  const newYears = calculateYearsToFire(input.netRealReturn, newSavings, totalNW, newFireNumber)

  const delay = isFinite(newYears) && isFinite(baseYears)
    ? newYears - baseYears
    : isFinite(baseYears) ? Infinity : 0

  const delayYears = isFinite(delay) ? Math.floor(delay) : Infinity
  const delayMonths = isFinite(delay) ? Math.round((delay - Math.floor(delay)) * 12) : 0

  return { delayYears, delayMonths, newFireNumber, annualCost }
}
