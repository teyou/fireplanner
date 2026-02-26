import { describe, it, expect } from 'vitest'
import { computeHdbCpfRefund, computeHdbSublettingIncome, computeLbsProceeds, getPropertyRentalIncome } from './hdb'

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

describe('computeLbsProceeds', () => {
  it('calculates proceeds from selling tail-end lease', () => {
    // 60-year remaining lease, retaining 30 years
    // Bala factor at 60 = 0.82, at 30 = 0.48
    // Proceeds = $500K * (0.82 - 0.48) = $170,000
    const result = computeLbsProceeds({
      flatValue: 500000,
      remainingLease: 60,
      retainedLease: 30,
      cpfRaBalance: 100000,
      retirementSum: 213000,
    })
    expect(result.totalProceeds).toBeCloseTo(170000, -2)
    // RA shortfall = 213000 - 100000 = 113000
    // cpfRaTopUp = min(170000, 113000) = 113000
    expect(result.cpfRaTopUp).toBe(113000)
    expect(result.cashProceeds).toBeCloseTo(170000 - 113000, -2)
    expect(result.totalProceeds).toBe(result.cpfRaTopUp + result.cashProceeds)
  })

  it('caps RA top-up at total proceeds when proceeds < shortfall', () => {
    // Small flat: $200K * (0.82 - 0.48) = $68K proceeds
    // RA shortfall = 213000 - 100000 = $113K > $68K
    const result = computeLbsProceeds({
      flatValue: 200000,
      remainingLease: 60,
      retainedLease: 30,
      cpfRaBalance: 100000,
      retirementSum: 213000,
    })
    expect(result.cpfRaTopUp).toBeCloseTo(68000, -2)
    expect(result.cashProceeds).toBeCloseTo(0, 0)
  })

  it('gives all proceeds as cash when RA already meets retirement sum', () => {
    const result = computeLbsProceeds({
      flatValue: 500000,
      remainingLease: 60,
      retainedLease: 30,
      cpfRaBalance: 250000,
      retirementSum: 213000,
    })
    expect(result.cpfRaTopUp).toBe(0)
    expect(result.cashProceeds).toBe(result.totalProceeds)
  })

  it('returns zero proceeds when retained equals remaining lease', () => {
    const result = computeLbsProceeds({
      flatValue: 500000,
      remainingLease: 30,
      retainedLease: 30,
      cpfRaBalance: 100000,
      retirementSum: 213000,
    })
    expect(result.totalProceeds).toBe(0)
    expect(result.cpfRaTopUp).toBe(0)
    expect(result.cashProceeds).toBe(0)
  })

  it('calculates estimated CPF LIFE boost from RA top-up', () => {
    const result = computeLbsProceeds({
      flatValue: 500000,
      remainingLease: 60,
      retainedLease: 30,
      cpfRaBalance: 100000,
      retirementSum: 213000,
    })
    // Boost = cpfRaTopUp * 0.063 / 12 (monthly)
    expect(result.estimatedMonthlyLifeBoost).toBeCloseTo(113000 * 0.063 / 12, 0)
  })
})

// ============================================================
// getPropertyRentalIncome — convenience wrapper
// ============================================================

describe('getPropertyRentalIncome', () => {
  const hdbSubletProperty = {
    ownsProperty: true,
    propertyType: 'hdb',
    hdbMonetizationStrategy: 'sublet',
    hdbSublettingRooms: 2,
    hdbSublettingRate: 1000,
  }

  it('returns rooms * monthlyRate * 12 when HDB subletting is active', () => {
    expect(getPropertyRentalIncome(hdbSubletProperty)).toBe(24000)
  })

  it('returns 0 when ownsProperty is false', () => {
    expect(getPropertyRentalIncome({ ...hdbSubletProperty, ownsProperty: false })).toBe(0)
  })

  it('returns 0 when propertyType is not hdb', () => {
    expect(getPropertyRentalIncome({ ...hdbSubletProperty, propertyType: 'condo' })).toBe(0)
  })

  it('returns 0 when strategy is not sublet', () => {
    expect(getPropertyRentalIncome({ ...hdbSubletProperty, hdbMonetizationStrategy: 'lbs' })).toBe(0)
  })
})
