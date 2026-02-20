import { describe, it, expect } from 'vitest'
import {
  outstandingMortgageAtAge,
  calculateSellAndDownsize,
  calculateSellAndRent,
  calculateBSD,
  calculateABSD,
  leaseDecayFactor,
} from './property'

describe('outstandingMortgageAtAge', () => {
  it('returns current balance when yearsElapsed = 0', () => {
    expect(outstandingMortgageAtAge(500000, 2500, 0.035, 0)).toBe(500000)
  })

  it('returns 0 when balance is already 0', () => {
    expect(outstandingMortgageAtAge(0, 2500, 0.035, 10)).toBe(0)
  })

  it('reduces balance over time with amortization', () => {
    // $500K loan, 3.5%, 25yr term, monthly payment $2,503
    // After 10 years, outstanding should be between 300K-400K
    const balance = outstandingMortgageAtAge(500000, 2503, 0.035, 10)
    expect(balance).toBeLessThan(500000)
    expect(balance).toBeGreaterThan(200000)
    // Computed: ~$350,161
    expect(balance).toBeCloseTo(350161, -3) // within $1K
  })

  it('reaches near 0 when loan is fully paid off', () => {
    // $500K at 3.5% over 25 years, monthly payment $2,503
    // Slight residual due to rounding (exact payment is $2,503.53)
    const balance = outstandingMortgageAtAge(500000, 2503, 0.035, 25)
    expect(balance).toBeLessThan(100) // near zero
  })

  it('handles 0% interest rate', () => {
    // $500K, $2000/mo payment, 0% rate, 10 years
    // 10 * 12 * 2000 = 240,000 paid off
    const balance = outstandingMortgageAtAge(500000, 2000, 0, 10)
    expect(balance).toBeCloseTo(260000, 0)
  })

  it('does not go negative', () => {
    // Overpay scenario
    const balance = outstandingMortgageAtAge(10000, 5000, 0, 5)
    expect(balance).toBe(0)
  })
})

describe('calculateSellAndDownsize', () => {
  it('computes net equity correctly', () => {
    const result = calculateSellAndDownsize({
      salePrice: 1500000,
      outstandingMortgage: 300000,
      newPropertyCost: 800000,
      newLtv: 0.75,
      newMortgageRate: 0.035,
      newMortgageTerm: 20,
      residency: 'citizen',
      propertyCount: 0, // first property after selling
    })

    // Gross proceeds = 1,500,000
    // BSD on 800K: 180K*0.01 + 180K*0.02 + 440K*0.03 = 1800 + 3600 + 13200 = 18600
    const bsd = calculateBSD(800000)
    expect(result.bsdOnNewProperty).toBe(bsd)
    expect(result.absdOnNewProperty).toBe(0) // citizen, 1st property
    expect(result.downPayment).toBe(200000) // 800K * (1 - 0.75)
    expect(result.newLoanAmount).toBe(600000) // 800K * 0.75
    // Net: 1.5M - 300K - bsd - 0 - 200K
    const expectedNet = 1500000 - 300000 - bsd - 0 - 200000
    expect(result.netEquityToPortfolio).toBe(expectedNet)
    expect(result.newMonthlyPayment).toBeGreaterThan(0)
  })

  it('clamps net equity to 0 when costs exceed proceeds', () => {
    const result = calculateSellAndDownsize({
      salePrice: 100000,
      outstandingMortgage: 500000,
      newPropertyCost: 800000,
      newLtv: 0.75,
      newMortgageRate: 0.035,
      newMortgageTerm: 20,
      residency: 'citizen',
      propertyCount: 0,
    })
    expect(result.netEquityToPortfolio).toBe(0)
  })

  it('includes ABSD for PR buyers', () => {
    const result = calculateSellAndDownsize({
      salePrice: 1500000,
      outstandingMortgage: 0,
      newPropertyCost: 800000,
      newLtv: 0.75,
      newMortgageRate: 0.035,
      newMortgageTerm: 20,
      residency: 'pr',
      propertyCount: 0, // first property for PR = 5% ABSD
    })
    expect(result.absdOnNewProperty).toBe(800000 * 0.05) // 40,000
  })
})

describe('calculateSellAndRent', () => {
  it('computes net proceeds and annual rent', () => {
    const result = calculateSellAndRent({
      salePrice: 1500000,
      outstandingMortgage: 300000,
      monthlyRent: 2500,
    })

    expect(result.grossProceeds).toBe(1500000)
    expect(result.outstandingMortgage).toBe(300000)
    expect(result.netProceedsToPortfolio).toBe(1200000)
    expect(result.annualRent).toBe(30000) // 2500 * 12
  })

  it('clamps net proceeds to 0 when mortgage exceeds sale price', () => {
    const result = calculateSellAndRent({
      salePrice: 300000,
      outstandingMortgage: 500000,
      monthlyRent: 2000,
    })
    expect(result.netProceedsToPortfolio).toBe(0)
  })
})

describe('calculateABSD', () => {
  it('citizen 1st property: 0% ABSD', () => {
    expect(calculateABSD(1000000, 'citizen', 0)).toBe(0)
  })

  it('citizen 2nd property: 20% ABSD', () => {
    expect(calculateABSD(1000000, 'citizen', 1)).toBe(200000)
  })

  it('citizen 3rd+ property: 30% ABSD', () => {
    expect(calculateABSD(1000000, 'citizen', 2)).toBe(300000)
    expect(calculateABSD(1000000, 'citizen', 5)).toBe(300000) // capped at 3rd+ rate
  })

  it('PR 1st property: 5% ABSD', () => {
    expect(calculateABSD(1000000, 'pr', 0)).toBe(50000)
  })

  it('PR 2nd property: 30% ABSD', () => {
    expect(calculateABSD(1000000, 'pr', 1)).toBe(300000)
  })

  it('PR 3rd+ property: 35% ABSD', () => {
    expect(calculateABSD(1000000, 'pr', 2)).toBe(350000)
  })

  it('foreigner: 60% ABSD on all properties', () => {
    expect(calculateABSD(1000000, 'foreigner', 0)).toBe(600000)
    expect(calculateABSD(1000000, 'foreigner', 1)).toBe(600000)
    expect(calculateABSD(1000000, 'foreigner', 2)).toBe(600000)
  })

  it('scales linearly with purchase price', () => {
    expect(calculateABSD(2000000, 'citizen', 1)).toBe(400000) // 20% of 2M
    expect(calculateABSD(500000, 'foreigner', 0)).toBe(300000) // 60% of 500K
  })
})

describe('calculateBSD edge cases', () => {
  it('BSD on first $180K tier: 1%', () => {
    expect(calculateBSD(180000)).toBeCloseTo(1800, 0)
  })

  it('BSD on $360K spans first two tiers', () => {
    // 180K * 0.01 + 180K * 0.02 = 1800 + 3600 = 5400
    expect(calculateBSD(360000)).toBeCloseTo(5400, 0)
  })

  it('BSD on $1M spans three tiers', () => {
    // 180K * 0.01 + 180K * 0.02 + 640K * 0.03 = 1800 + 3600 + 19200 = 24600
    expect(calculateBSD(1000000)).toBeCloseTo(24600, 0)
  })

  it('BSD is 0 for $0 purchase price', () => {
    expect(calculateBSD(0)).toBe(0)
  })
})

describe('leaseDecayFactor', () => {
  it('returns 1.0 for brand new 99-year lease', () => {
    // 99 years remaining = factor should be 1.0 or very close
    expect(leaseDecayFactor(99, 0)).toBeCloseTo(1.0, 1)
  })

  it('returns lower factor as years pass', () => {
    const factor0 = leaseDecayFactor(99, 0)
    const factor30 = leaseDecayFactor(99, 30)
    const factor60 = leaseDecayFactor(99, 60)
    expect(factor30).toBeLessThan(factor0)
    expect(factor60).toBeLessThan(factor30)
  })

  it('returns 0 when lease fully expired', () => {
    expect(leaseDecayFactor(99, 99)).toBe(0)
    expect(leaseDecayFactor(99, 120)).toBe(0) // beyond lease term
  })

  it('decay accelerates in last 30 years (Bala curve)', () => {
    // The decay from year 60→70 should be larger than from year 20→30
    const diff_early = leaseDecayFactor(99, 20) - leaseDecayFactor(99, 30)
    const diff_late = leaseDecayFactor(99, 60) - leaseDecayFactor(99, 70)
    expect(diff_late).toBeGreaterThan(diff_early)
  })
})
