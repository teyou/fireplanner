import type { FireMetrics, FireType, FireNumberBasis, ParentSupport } from '@/lib/types'

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

/**
 * Calculate total annual parent support at a given age.
 * Each entry is active when startAge <= age < endAge.
 * Growth is compounded from startAge: amount * (1 + growthRate)^(age - startAge).
 * Parent support is additive to expenses and NOT subject to retirementSpendingAdjustment.
 */
export function calculateParentSupportAtAge(entries: ParentSupport[], age: number): number {
  let total = 0
  for (const entry of entries) {
    if (age >= entry.startAge && age < entry.endAge) {
      const yearsActive = age - entry.startAge
      const annualAmount = entry.monthlyAmount * 12 * Math.pow(1 + entry.growthRate, yearsActive)
      total += annualAmount
    }
  }
  return total
}

/** Progress toward FIRE target: NW / fireNumber (0 to 1+) */
export function calculateProgress(currentNW: number, fireNumber: number): number {
  if (fireNumber <= 0) return 0
  return currentNW / fireNumber
}

/**
 * Project portfolio value at retirement using FV of lump sum + FV of annuity in real terms.
 *
 * projectedNW = currentNW × (1+r)^n + annualSavings × ((1+r)^n - 1) / r
 * where r = expectedReturn - inflation - expenseRatio, n = retirementAge - currentAge
 *
 * Edge cases:
 * - n <= 0 (already at/past retirement): returns currentNW
 * - r ≈ 0: linear approximation (currentNW + annualSavings × n)
 * - Result clamped to max(0, ...)
 */
export function projectPortfolioAtRetirement(params: {
  currentNW: number
  annualSavings: number
  netRealReturn: number
  yearsToRetirement: number
}): number {
  const { currentNW, annualSavings, netRealReturn: r, yearsToRetirement: n } = params

  if (n <= 0) return currentNW

  if (Math.abs(r) < 1e-10) {
    // r ≈ 0: linear
    return Math.max(0, currentNW + annualSavings * n)
  }

  const growthFactor = Math.pow(1 + r, n)
  const fvLumpSum = currentNW * growthFactor
  const fvAnnuity = annualSavings * (growthFactor - 1) / r

  return Math.max(0, fvLumpSum + fvAnnuity)
}

/**
 * Calculate the age at which liquid-only portfolio depletes,
 * assuming annual withdrawals of `annualExpenses` starting at `retirementAge`.
 * Returns null if liquid portfolio never depletes before `lifeExpectancy`.
 */
export function calculateLiquidBridgeGap(
  liquidNW: number,
  annualExpenses: number,
  retirementAge: number,
  cpfLifeStartAge: number,
  realReturn: number,
  lifeExpectancy: number
): { liquidDepletionAge: number | null; liquidBridgeGapYears: number | null } {
  if (liquidNW <= 0) {
    return { liquidDepletionAge: retirementAge, liquidBridgeGapYears: Math.max(0, cpfLifeStartAge - retirementAge) }
  }

  let balance = liquidNW
  for (let age = retirementAge; age <= lifeExpectancy; age++) {
    balance = balance * (1 + realReturn) - annualExpenses
    if (balance <= 0) {
      const gapYears = age < cpfLifeStartAge ? cpfLifeStartAge - age : null
      return { liquidDepletionAge: age, liquidBridgeGapYears: gapYears }
    }
  }
  return { liquidDepletionAge: null, liquidBridgeGapYears: null }
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
  fireNumberBasis?: FireNumberBasis
  cpfLifeStartAge?: number
  lifeExpectancy?: number
  retirementSpendingAdjustment?: number
  propertyEquity?: number
  parentSupport?: ParentSupport[]
  parentSupportEnabled?: boolean
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
    fireNumberBasis = 'today',
    cpfLifeStartAge = 65,
    lifeExpectancy = 90,
    retirementSpendingAdjustment = 1.0,
    propertyEquity = 0,
    parentSupport = [],
    parentSupportEnabled = false,
  } = params

  const totalNetWorth = liquidNetWorth + cpfTotal
  const totalNWIncProperty = totalNetWorth + propertyEquity
  const annualSavings = annualIncome - annualExpenses
  const savingsRate = annualIncome > 0 ? annualSavings / annualIncome : 0

  // Apply retirement spending adjustment and FIRE type multiplier to expenses for the FIRE number
  const multiplier = FIRE_TYPE_MULTIPLIERS[fireType]
  let effectiveExpenses = annualExpenses * retirementSpendingAdjustment * multiplier

  // Add parent support at retirement age (additive, NOT subject to adjustment/multiplier)
  const parentSupportAnnual = parentSupportEnabled
    ? calculateParentSupportAtAge(parentSupport, retirementAge)
    : 0
  effectiveExpenses += parentSupportAnnual

  // Net real return = nominal - inflation - expense ratio
  const netRealReturn = expectedReturn - inflation - expenseRatio

  // Inflate expenses to retirement age if using retirement-dollar basis
  const yearsToRetirement = Math.max(0, retirementAge - currentAge)
  if (fireNumberBasis === 'retirement' && yearsToRetirement > 0 && inflation > 0) {
    effectiveExpenses *= Math.pow(1 + inflation, yearsToRetirement)
  }

  // fireAge basis: iterative fixed-point convergence
  // FIRE number depends on FIRE age (inflation target), FIRE age depends on FIRE number (NPER).
  // Start with today's expenses, compute FIRE age, inflate to that age, recompute, repeat.
  let inflationFactor = 1
  if (fireNumberBasis === 'fireAge' && inflation > 0) {
    let prevYearsToFire = 0
    const MAX_ITERATIONS = 10
    const TOLERANCE = 0.01

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const currentFireNumber = calculateFireNumber(annualExpenses * multiplier * inflationFactor, swr)
      const currentYearsToFire = calculateYearsToFire(netRealReturn, annualSavings, totalNetWorth, currentFireNumber)

      const yearsForInflation = isFinite(currentYearsToFire) ? Math.max(0, currentYearsToFire) : 0
      inflationFactor = Math.pow(1 + inflation, yearsForInflation)

      if (Math.abs(currentYearsToFire - prevYearsToFire) < TOLERANCE) break
      prevYearsToFire = currentYearsToFire
    }

    effectiveExpenses = annualExpenses * multiplier * inflationFactor
  }

  const fireNumber = calculateFireNumber(effectiveExpenses, swr)
  // Lean/Fat reference values also include retirement adjustment and inflate when using retirement or fireAge basis
  let leanExpenses = annualExpenses * retirementSpendingAdjustment
  let fatExpenses = annualExpenses * retirementSpendingAdjustment
  if (fireNumberBasis === 'retirement' && yearsToRetirement > 0 && inflation > 0) {
    const retirementInflationFactor = Math.pow(1 + inflation, yearsToRetirement)
    leanExpenses *= retirementInflationFactor
    fatExpenses *= retirementInflationFactor
  } else if (fireNumberBasis === 'fireAge' && inflation > 0) {
    leanExpenses *= inflationFactor
    fatExpenses *= inflationFactor
  }
  const leanFireNumber = calculateLeanFire(leanExpenses, swr)
  const fatFireNumber = calculateFatFire(fatExpenses, swr)

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

  // CPF dependency detection
  const liquidProgress = fireNumber > 0 ? liquidNetWorth / fireNumber : 0
  const cpfDependency = liquidProgress < 1 && progress >= 1

  // Bridge gap analysis (only relevant when CPF-dependent)
  let liquidBridgeGapYears: number | null = null
  let liquidDepletionAge: number | null = null
  if (cpfDependency) {
    const bridgeResult = calculateLiquidBridgeGap(
      liquidNetWorth,
      effectiveExpenses,
      retirementAge,
      cpfLifeStartAge,
      netRealReturn,
      lifeExpectancy
    )
    liquidBridgeGapYears = bridgeResult.liquidBridgeGapYears
    liquidDepletionAge = bridgeResult.liquidDepletionAge
  }

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
    propertyEquity,
    totalNWIncProperty,
    cpfDependency,
    liquidBridgeGapYears,
    liquidDepletionAge,
  }
}
