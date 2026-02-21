/**
 * SRS (Supplementary Retirement Scheme) lifecycle calculations.
 * Accumulation projection, drawdown schedule, early withdrawal penalty,
 * and SRS vs RSTU (CPF SA top-up) comparison.
 */

// ============================================================
// Accumulation Projection
// ============================================================

interface SrsProjectionParams {
  currentBalance: number
  annualContribution: number
  investmentReturn: number
  years: number
  contributionCap: number
}

interface SrsProjectionRow {
  year: number
  balance: number
  contribution: number
  growth: number
}

export function projectSrsBalance(params: SrsProjectionParams): SrsProjectionRow[] {
  const { currentBalance, annualContribution, investmentReturn, years, contributionCap } = params
  const rows: SrsProjectionRow[] = []
  let balance = currentBalance

  for (let y = 1; y <= years; y++) {
    const contribution = Math.min(annualContribution, contributionCap)
    const preGrowthBalance = balance + contribution
    const growth = preGrowthBalance * investmentReturn
    balance = preGrowthBalance + growth
    rows.push({ year: y, balance, contribution, growth })
  }
  return rows
}

// ============================================================
// Drawdown Schedule
// ============================================================

interface SrsDrawdownParams {
  balance: number
  startAge: number
  durationYears: number
}

interface SrsDrawdownRow {
  age: number
  withdrawal: number
  taxableAmount: number
  remainingBalance: number
}

export function computeSrsDrawdownSchedule(params: SrsDrawdownParams): SrsDrawdownRow[] {
  const { balance, startAge, durationYears } = params
  const annualWithdrawal = balance / durationYears
  const rows: SrsDrawdownRow[] = []
  let remaining = balance

  for (let i = 0; i < durationYears; i++) {
    const withdrawal = Math.min(annualWithdrawal, remaining)
    remaining -= withdrawal
    rows.push({
      age: startAge + i,
      withdrawal,
      taxableAmount: withdrawal * 0.5, // 50% tax concession
      remainingBalance: Math.max(0, remaining),
    })
  }
  return rows
}

// ============================================================
// Early Withdrawal Penalty
// ============================================================

export function computeSrsEarlyPenalty(amount: number): {
  penalty: number
  taxableAmount: number
} {
  return {
    penalty: amount * 0.05,
    taxableAmount: amount, // No 50% concession on early withdrawal
  }
}

// ============================================================
// SRS vs RSTU (CPF SA top-up) Comparison
// ============================================================

interface SrsVsRstuParams {
  currentIncome: number
  currentMarginalRate: number
  amount: number
}

interface SrsVsRstuResult {
  srsNetBenefit: number
  rstuNetBenefit: number
  recommendation: string
}

export function compareSrsVsRstu(params: SrsVsRstuParams): SrsVsRstuResult {
  const { currentMarginalRate, amount } = params
  const ASSUMED_RETIREMENT_RATE = 0.02

  // SRS: tax saved now - tax paid on 50% at retirement
  const srsTaxSavedNow = amount * currentMarginalRate
  const srsTaxOnWithdrawal = amount * 0.5 * ASSUMED_RETIREMENT_RATE
  const srsNetBenefit = srsTaxSavedNow - srsTaxOnWithdrawal

  // RSTU: tax saved now, no withdrawal tax (but locked until 55)
  const rstuNetBenefit = amount * currentMarginalRate

  const recommendation = rstuNetBenefit > srsNetBenefit
    ? 'CPF SA top-up (RSTU) gives higher net benefit, but funds are locked until age 55.'
    : 'SRS gives comparable benefit with more flexibility for withdrawal after 63.'

  return { srsNetBenefit, rstuNetBenefit, recommendation }
}
