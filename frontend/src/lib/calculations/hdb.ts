import { CPF_OA_RATE } from '@/lib/data/hdbRates'

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
