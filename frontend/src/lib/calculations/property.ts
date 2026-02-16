/**
 * Property analysis calculations for Singapore.
 * BSD, ABSD, Bala's Table decay, LTV, mortgage, rental yield, NPV.
 *
 * All rates from IRAS and URA as of 2024.
 */

import { getBalaFactor } from '@/lib/data/balaTable'

// ============================================================
// Buyer's Stamp Duty (BSD)
// ============================================================

const BSD_BRACKETS: [number, number][] = [
  [180000, 0.01],
  [180000, 0.02],
  [640000, 0.03],
  [500000, 0.04],
  [1500000, 0.05],
  [Infinity, 0.06],
]

export function calculateBSD(purchasePrice: number): number {
  let remaining = purchasePrice
  let bsd = 0
  for (const [bracket, rate] of BSD_BRACKETS) {
    const taxable = Math.min(remaining, bracket)
    bsd += taxable * rate
    remaining -= taxable
    if (remaining <= 0) break
  }
  return bsd
}

// ============================================================
// Additional Buyer's Stamp Duty (ABSD)
// ============================================================

type ResidencyType = 'citizen' | 'pr' | 'foreigner'

const ABSD_RATES: Record<ResidencyType, number[]> = {
  citizen: [0, 0.20, 0.30],      // 1st, 2nd, 3rd+
  pr: [0.05, 0.30, 0.35],
  foreigner: [0.60, 0.60, 0.60],
}

export function calculateABSD(
  purchasePrice: number,
  residency: ResidencyType,
  propertyCount: number,
): number {
  const rates = ABSD_RATES[residency]
  const index = Math.min(propertyCount, rates.length - 1)
  return purchasePrice * rates[index]
}

// ============================================================
// Bala's Table Leasehold Decay
// ============================================================

export function leaseDecayFactor(
  originalLease: number,
  yearsOwned: number,
): number {
  const remaining = Math.max(0, originalLease - yearsOwned)
  return getBalaFactor(remaining)
}

// ============================================================
// Loan-to-Value (LTV)
// ============================================================

export function calculateLTV(
  loanAmount: number,
  propertyValue: number,
): number {
  if (propertyValue <= 0) return 0
  return loanAmount / propertyValue
}

// ============================================================
// Mortgage Amortization
// ============================================================

export interface MortgageResult {
  monthlyPayment: number
  totalInterest: number
  totalPayment: number
  schedule: { year: number; principalPaid: number; interestPaid: number; balance: number }[]
}

export function mortgageAmortization(
  loanAmount: number,
  annualRate: number,
  termYears: number,
): MortgageResult {
  const monthlyRate = annualRate / 12
  const nPayments = termYears * 12

  let monthlyPayment: number
  if (monthlyRate === 0) {
    monthlyPayment = loanAmount / nPayments
  } else {
    monthlyPayment = loanAmount * (monthlyRate * (1 + monthlyRate) ** nPayments) / ((1 + monthlyRate) ** nPayments - 1)
  }

  const schedule: MortgageResult['schedule'] = []
  let balance = loanAmount
  let totalInterest = 0

  for (let year = 1; year <= termYears; year++) {
    let yearPrincipal = 0
    let yearInterest = 0
    for (let month = 0; month < 12; month++) {
      if (balance <= 0) break
      const interest = balance * monthlyRate
      const principal = Math.min(monthlyPayment - interest, balance)
      yearInterest += interest
      yearPrincipal += principal
      balance -= principal
    }
    totalInterest += yearInterest
    schedule.push({
      year,
      principalPaid: yearPrincipal,
      interestPaid: yearInterest,
      balance: Math.max(0, balance),
    })
  }

  return {
    monthlyPayment,
    totalInterest,
    totalPayment: loanAmount + totalInterest,
    schedule,
  }
}

// ============================================================
// Rental Yield
// ============================================================

export function calculateRentalYield(
  annualRental: number,
  propertyValue: number,
): number {
  if (propertyValue <= 0) return 0
  return annualRental / propertyValue
}

// ============================================================
// Property NPV (simplified)
// ============================================================

export function calculatePropertyNPV(
  purchasePrice: number,
  annualAppreciation: number,
  annualRental: number,
  mortgageAnnualPayment: number,
  annualExpenses: number,
  holdingYears: number,
  discountRate: number,
  leaseYears: number,
): number {
  let npv = -purchasePrice
  const sellingPrice = purchasePrice * (1 + annualAppreciation) ** holdingYears * getBalaFactor(leaseYears - holdingYears) / getBalaFactor(leaseYears)

  for (let y = 1; y <= holdingYears; y++) {
    const netCashFlow = annualRental - mortgageAnnualPayment - annualExpenses
    npv += netCashFlow / (1 + discountRate) ** y
  }

  // Sale proceeds at end
  npv += sellingPrice / (1 + discountRate) ** holdingYears

  return npv
}
