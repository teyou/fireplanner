import { CPF_OA_RATE } from '@/lib/data/hdbRates'
import { getBalaFactor } from '@/lib/data/balaTable'

interface CpfRefundParams {
  cpfUsedForHousing: number
  yearsOfMortgage: number
  oaInterestRate?: number
}

interface CpfRefundResult {
  principalUsed: number
  accruedInterest: number
  totalRefund: number
}

/**
 * Calculate CPF refund required when selling HDB.
 * Refund = principal used for housing + accrued interest at OA rate.
 */
export function computeHdbCpfRefund(params: CpfRefundParams): CpfRefundResult {
  const { cpfUsedForHousing, yearsOfMortgage, oaInterestRate = CPF_OA_RATE } = params

  if (cpfUsedForHousing <= 0) {
    return { principalUsed: 0, accruedInterest: 0, totalRefund: 0 }
  }

  const accruedInterest = cpfUsedForHousing * (Math.pow(1 + oaInterestRate, yearsOfMortgage) - 1)

  return {
    principalUsed: cpfUsedForHousing,
    accruedInterest,
    totalRefund: cpfUsedForHousing + accruedInterest,
  }
}

interface SublettingParams {
  rooms: number
  monthlyRate: number
}

interface SublettingResult {
  annualGross: number
  annualNet: number
  taxImpact: number
}

/**
 * Calculate HDB subletting income.
 * No property tax deductions for HDB owner-occupied.
 * Rental income is fully taxable.
 */
export function computeHdbSublettingIncome(params: SublettingParams): SublettingResult {
  const { rooms, monthlyRate } = params
  const annualGross = rooms * monthlyRate * 12

  return {
    annualGross,
    annualNet: annualGross,
    taxImpact: annualGross,
  }
}

// ============================================================
// Lease Buyback Scheme (LBS)
// ============================================================

interface LbsParams {
  flatValue: number
  remainingLease: number
  retainedLease: number
  cpfRaBalance: number
  retirementSum: number
}

interface LbsResult {
  totalProceeds: number
  cpfRaTopUp: number
  cashProceeds: number
  estimatedMonthlyLifeBoost: number
}

/**
 * Calculate LBS proceeds from selling tail-end lease back to HDB.
 * Uses Bala's Table to determine value of lease sold.
 * Proceeds go to CPF RA (up to retirement sum shortfall), remainder as cash.
 */
export function computeLbsProceeds(params: LbsParams): LbsResult {
  const { flatValue, remainingLease, retainedLease, cpfRaBalance, retirementSum } = params

  // Value of lease sold = flat value * (current factor - retained factor)
  const currentFactor = getBalaFactor(remainingLease)
  const retainedFactor = getBalaFactor(retainedLease)
  const totalProceeds = Math.max(0, flatValue * (currentFactor - retainedFactor))

  // CPF RA top-up: up to shortfall of retirement sum
  const raShortfall = Math.max(0, retirementSum - cpfRaBalance)
  const cpfRaTopUp = Math.min(totalProceeds, raShortfall)
  const cashProceeds = totalProceeds - cpfRaTopUp

  // Estimated monthly CPF LIFE boost from RA top-up (~6.3% Standard plan rate)
  const estimatedMonthlyLifeBoost = cpfRaTopUp * 0.063 / 12

  return { totalProceeds, cpfRaTopUp, cashProceeds, estimatedMonthlyLifeBoost }
}
