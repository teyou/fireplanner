import { describe, it, expect } from 'vitest'
import { computeHdbCpfRefund, computeHdbSublettingIncome } from './hdb'

describe('computeHdbCpfRefund', () => {
  it('calculates refund with accrued interest', () => {
    // $100K used for housing over 10 years at 2.5% OA rate
    const result = computeHdbCpfRefund({
      cpfUsedForHousing: 100000,
      yearsOfMortgage: 10,
      oaInterestRate: 0.025,
    })
    // Accrued interest = 100000 * (1.025^10 - 1) ≈ 28008
    // Total refund = 100000 + 28008 = ~128008
    expect(result.totalRefund).toBeGreaterThan(100000)
    expect(result.principalUsed).toBe(100000)
    expect(result.accruedInterest).toBeCloseTo(28008, -1)
    expect(result.totalRefund).toBeCloseTo(128008, -1)
  })

  it('returns zero for zero CPF used', () => {
    const result = computeHdbCpfRefund({
      cpfUsedForHousing: 0,
      yearsOfMortgage: 10,
      oaInterestRate: 0.025,
    })
    expect(result.totalRefund).toBe(0)
    expect(result.principalUsed).toBe(0)
    expect(result.accruedInterest).toBe(0)
  })

  it('uses default OA rate when not specified', () => {
    const result = computeHdbCpfRefund({
      cpfUsedForHousing: 100000,
      yearsOfMortgage: 10,
    })
    // Default rate is 2.5%, same as explicit test
    expect(result.totalRefund).toBeCloseTo(128008, -1)
  })

  it('handles zero years of mortgage', () => {
    const result = computeHdbCpfRefund({
      cpfUsedForHousing: 100000,
      yearsOfMortgage: 0,
    })
    // No time = no accrued interest, just principal refund
    expect(result.principalUsed).toBe(100000)
    expect(result.accruedInterest).toBe(0)
    expect(result.totalRefund).toBe(100000)
  })
})

describe('computeHdbSublettingIncome', () => {
  it('calculates annual income from room rental', () => {
    const result = computeHdbSublettingIncome({
      rooms: 2,
      monthlyRate: 1000,
    })
    expect(result.annualGross).toBe(24000)
    expect(result.annualNet).toBe(24000) // No deductions for HDB
    expect(result.taxImpact).toBe(24000) // Fully taxable
  })

  it('handles single room rental', () => {
    const result = computeHdbSublettingIncome({
      rooms: 1,
      monthlyRate: 800,
    })
    expect(result.annualGross).toBe(9600)
    expect(result.annualNet).toBe(9600)
  })

  it('returns zero for zero rooms', () => {
    const result = computeHdbSublettingIncome({
      rooms: 0,
      monthlyRate: 1000,
    })
    expect(result.annualGross).toBe(0)
    expect(result.annualNet).toBe(0)
    expect(result.taxImpact).toBe(0)
  })
})
