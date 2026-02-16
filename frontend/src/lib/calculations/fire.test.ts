import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateFireNumber,
  calculateYearsToFire,
  calculateCoastFire,
  calculateBaristaFireIncome,
  calculateLeanFire,
  calculateFatFire,
  calculateProgress,
  calculateAllFireMetrics,
  projectPortfolioAtRetirement,
} from './fire'

describe('calculateFireNumber', () => {
  it('computes basic FIRE number: expenses / SWR', () => {
    expect(calculateFireNumber(30000, 0.035)).toBeCloseTo(857142.857, 0)
    expect(calculateFireNumber(96000, 0.04)).toBe(2400000)
    expect(calculateFireNumber(80000, 0.04)).toBe(2000000)
  })

  it('returns 0 for zero/negative expenses or SWR', () => {
    expect(calculateFireNumber(0, 0.04)).toBe(0)
    expect(calculateFireNumber(-10000, 0.04)).toBe(0)
    expect(calculateFireNumber(30000, 0)).toBe(0)
    expect(calculateFireNumber(30000, -0.01)).toBe(0)
  })

  // Integration test vectors from CLAUDE.md
  it('Fresh Graduate: $30K expenses, 3.5% SWR → $857,143', () => {
    expect(calculateFireNumber(30000, 0.035)).toBeCloseTo(857143, 0)
  })

  it('Mid-Career: $96K expenses, 4% SWR → $2,400,000', () => {
    expect(calculateFireNumber(96000, 0.04)).toBe(2400000)
  })

  it('Pre-Retiree: $80K expenses, 4% SWR → $2,000,000', () => {
    expect(calculateFireNumber(80000, 0.04)).toBe(2000000)
  })
})

describe('calculateYearsToFire', () => {
  it('returns 0 when NW already >= FIRE number', () => {
    expect(calculateYearsToFire(0.04, 50000, 1000000, 1000000)).toBe(0)
    expect(calculateYearsToFire(0.04, 50000, 1500000, 1000000)).toBe(0)
  })

  it('returns Infinity when impossible (no savings, no growth)', () => {
    expect(calculateYearsToFire(0, 0, 100000, 1000000)).toBe(Infinity)
    expect(calculateYearsToFire(-0.02, -5000, 100000, 1000000)).toBe(Infinity)
  })

  it('handles r=0 with positive savings (linear)', () => {
    // (1M - 100K) / 50K = 18 years
    expect(calculateYearsToFire(0, 50000, 100000, 1000000)).toBe(18)
  })

  it('Fresh Graduate: NPER with 4.4% return, $18K savings, $50K→$857K', () => {
    // NPER formula: ln((s/r + FN) / (s/r + NW)) / ln(1+r)
    // = ln((18000/0.044 + 857143) / (18000/0.044 + 50000)) / ln(1.044)
    // = ln(1266234 / 459091) / 0.04305 ≈ 23.56
    // Note: CLAUDE.md says "~16 years" but that estimate includes CPF growth.
    // The pure NPER formula with stated inputs gives ~23.6 years.
    const netReal = 0.072 - 0.025 - 0.003 // 0.044
    const years = calculateYearsToFire(netReal, 18000, 50000, 857143)
    expect(years).toBeCloseTo(23.56, 0)
  })

  it('Mid-Career: NPER with 3.9% return, $84K savings, $1.1M→$2.4M', () => {
    // = ln((84000/0.039 + 2400000) / (84000/0.039 + 1100000)) / ln(1.039) ≈ 8.79
    // Note: CLAUDE.md says "~12 years" but the exact NPER with these inputs gives ~8.8.
    const netReal = 0.039
    const years = calculateYearsToFire(netReal, 84000, 1100000, 2400000)
    expect(years).toBeCloseTo(8.79, 0)
  })

  it('Pre-Retiree: 0 years (already at FIRE)', () => {
    expect(calculateYearsToFire(0.03, 0, 2000000, 2000000)).toBe(0)
  })

  it('positive return always produces finite result', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.001, max: 0.2, noNaN: true }),
        fc.double({ min: 1000, max: 500000, noNaN: true }),
        fc.double({ min: 0, max: 5000000, noNaN: true }),
        fc.double({ min: 10000, max: 10000000, noNaN: true }),
        (r, savings, nw, fire) => {
          if (nw >= fire) return true
          const years = calculateYearsToFire(r, savings, nw, fire)
          return years >= 0 && isFinite(years)
        }
      )
    )
  })
})

describe('calculateCoastFire', () => {
  it('discounts FIRE number to present value', () => {
    // $857,143 / (1.044)^16 = $430,373
    const coast = calculateCoastFire(857143, 0.044, 16)
    expect(coast).toBeCloseTo(430373, -2) // within $100
  })

  it('returns FIRE number when years = 0', () => {
    expect(calculateCoastFire(1000000, 0.05, 0)).toBe(1000000)
  })

  it('returns Infinity when return is -100% or worse', () => {
    expect(calculateCoastFire(1000000, -1, 10)).toBe(Infinity)
  })
})

describe('calculateBaristaFireIncome', () => {
  it('Fresh Graduate: $28,250/yr barista income needed', () => {
    // max(0, $30K - $50K * 0.035) = max(0, 30000 - 1750) = $28,250
    expect(calculateBaristaFireIncome(30000, 50000, 0.035)).toBe(28250)
  })

  it('returns 0 when portfolio covers all expenses', () => {
    expect(calculateBaristaFireIncome(80000, 2500000, 0.04)).toBe(0)
  })
})

describe('calculateLeanFire / calculateFatFire', () => {
  it('Lean FIRE = 60% of regular', () => {
    expect(calculateLeanFire(100000, 0.04)).toBeCloseTo(1500000)
  })

  it('Fat FIRE = 150% of regular', () => {
    expect(calculateFatFire(100000, 0.04)).toBeCloseTo(3750000)
  })
})

describe('calculateProgress', () => {
  it('Mid-Career: $1.1M / $2.4M = 45.8%', () => {
    expect(calculateProgress(1100000, 2400000)).toBeCloseTo(0.458, 2)
  })

  it('returns 0 for zero FIRE number', () => {
    expect(calculateProgress(500000, 0)).toBe(0)
  })

  it('can exceed 1.0 when past FIRE', () => {
    expect(calculateProgress(2500000, 2000000)).toBe(1.25)
  })
})

describe('calculateAllFireMetrics', () => {
  it('Fresh Graduate scenario produces expected metrics', () => {
    const m = calculateAllFireMetrics({
      currentAge: 25,
      retirementAge: 65,
      annualIncome: 48000,
      annualExpenses: 30000,
      liquidNetWorth: 50000,
      cpfTotal: 0,
      swr: 0.035,
      expectedReturn: 0.072,
      inflation: 0.025,
      expenseRatio: 0.003,
    })

    expect(m.fireNumber).toBeCloseTo(857143, 0)
    expect(m.savingsRate).toBeCloseTo(0.375, 2)
    expect(m.annualSavings).toBe(18000)
    expect(m.baristaFireIncome).toBe(28250)
    expect(m.yearsToFire).toBeCloseTo(23.56, 0)
  })

  it('Pre-Retiree scenario: 0 years to FIRE', () => {
    const m = calculateAllFireMetrics({
      currentAge: 55,
      retirementAge: 58,
      annualIncome: 0,
      annualExpenses: 80000,
      liquidNetWorth: 2000000,
      cpfTotal: 0,
      swr: 0.04,
      expectedReturn: 0.05,
      inflation: 0.025,
      expenseRatio: 0.003,
    })

    expect(m.fireNumber).toBe(2000000)
    expect(m.yearsToFire).toBe(0)
    expect(m.progress).toBe(1)
  })

  it('Lean FIRE uses 60% of expenses for FIRE number', () => {
    const m = calculateAllFireMetrics({
      currentAge: 30,
      retirementAge: 60,
      annualIncome: 100000,
      annualExpenses: 50000,
      liquidNetWorth: 200000,
      cpfTotal: 0,
      swr: 0.04,
      expectedReturn: 0.07,
      inflation: 0.025,
      expenseRatio: 0.003,
      fireType: 'lean',
    })

    // FIRE number: (50000 * 0.6) / 0.04 = 750,000
    expect(m.fireNumber).toBe(750000)
    // Lean/Fat reference values always use base expenses
    expect(m.leanFireNumber).toBe(750000) // same as FIRE number when lean
    expect(m.fatFireNumber).toBe(1875000) // 50000 * 1.5 / 0.04
  })

  it('Fat FIRE uses 150% of expenses for FIRE number', () => {
    const m = calculateAllFireMetrics({
      currentAge: 30,
      retirementAge: 60,
      annualIncome: 100000,
      annualExpenses: 50000,
      liquidNetWorth: 200000,
      cpfTotal: 0,
      swr: 0.04,
      expectedReturn: 0.07,
      inflation: 0.025,
      expenseRatio: 0.003,
      fireType: 'fat',
    })

    // FIRE number: (50000 * 1.5) / 0.04 = 1,875,000
    expect(m.fireNumber).toBe(1875000)
    expect(m.leanFireNumber).toBe(750000) // reference: 50000 * 0.6 / 0.04
    expect(m.fatFireNumber).toBe(1875000) // same as FIRE number when fat
  })

  it('Coast and Barista FIRE types do not change FIRE number', () => {
    const baseParams = {
      currentAge: 30,
      retirementAge: 60,
      annualIncome: 100000,
      annualExpenses: 50000,
      liquidNetWorth: 200000,
      cpfTotal: 0,
      swr: 0.04,
      expectedReturn: 0.07,
      inflation: 0.025,
      expenseRatio: 0.003,
    }

    const regular = calculateAllFireMetrics({ ...baseParams, fireType: 'regular' })
    const coast = calculateAllFireMetrics({ ...baseParams, fireType: 'coast' })
    const barista = calculateAllFireMetrics({ ...baseParams, fireType: 'barista' })

    expect(coast.fireNumber).toBe(regular.fireNumber)
    expect(barista.fireNumber).toBe(regular.fireNumber)
  })

  it('defaults to regular when fireType is omitted', () => {
    const withType = calculateAllFireMetrics({
      currentAge: 30,
      retirementAge: 60,
      annualIncome: 100000,
      annualExpenses: 50000,
      liquidNetWorth: 200000,
      cpfTotal: 0,
      swr: 0.04,
      expectedReturn: 0.07,
      inflation: 0.025,
      expenseRatio: 0.003,
      fireType: 'regular',
    })
    const without = calculateAllFireMetrics({
      currentAge: 30,
      retirementAge: 60,
      annualIncome: 100000,
      annualExpenses: 50000,
      liquidNetWorth: 200000,
      cpfTotal: 0,
      swr: 0.04,
      expectedReturn: 0.07,
      inflation: 0.025,
      expenseRatio: 0.003,
    })

    expect(without.fireNumber).toBe(withType.fireNumber)
  })
})

describe('property-based tests', () => {
  it('FIRE number > 0 when expenses > 0 and SWR > 0', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 1000000, noNaN: true }),
        fc.double({ min: 0.001, max: 0.1, noNaN: true }),
        (expenses, swr) => {
          return calculateFireNumber(expenses, swr) > 0
        }
      )
    )
  })

  it('years to FIRE >= 0', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.001, max: 0.2, noNaN: true }),
        fc.double({ min: 1000, max: 500000, noNaN: true }),
        fc.double({ min: 0, max: 5000000, noNaN: true }),
        fc.double({ min: 100000, max: 10000000, noNaN: true }),
        (r, savings, nw, fire) => {
          const years = calculateYearsToFire(r, savings, nw, fire)
          return years >= 0
        }
      )
    )
  })
})

describe('projectPortfolioAtRetirement', () => {
  it('normal projection: $100K + $20K/yr savings, 5% return, 10 years', () => {
    // FV lump sum: 100000 * (1.05)^10 = 162,889.46
    // FV annuity: 20000 * ((1.05)^10 - 1) / 0.05 = 251,557.85
    // Total: 414,447.31
    const result = projectPortfolioAtRetirement({
      currentNW: 100000,
      annualSavings: 20000,
      netRealReturn: 0.05,
      yearsToRetirement: 10,
    })
    expect(result).toBeCloseTo(414447, 0)
  })

  it('already retired (n=0): returns currentNW unchanged', () => {
    const result = projectPortfolioAtRetirement({
      currentNW: 500000,
      annualSavings: 20000,
      netRealReturn: 0.05,
      yearsToRetirement: 0,
    })
    expect(result).toBe(500000)
  })

  it('negative years: returns currentNW (already past retirement)', () => {
    const result = projectPortfolioAtRetirement({
      currentNW: 500000,
      annualSavings: 20000,
      netRealReturn: 0.05,
      yearsToRetirement: -5,
    })
    expect(result).toBe(500000)
  })

  it('zero return: linear approximation (currentNW + savings * n)', () => {
    const result = projectPortfolioAtRetirement({
      currentNW: 100000,
      annualSavings: 20000,
      netRealReturn: 0,
      yearsToRetirement: 10,
    })
    // 100000 + 20000 * 10 = 300000
    expect(result).toBeCloseTo(300000, 0)
  })

  it('negative savings: still projects (savings term negative)', () => {
    const result = projectPortfolioAtRetirement({
      currentNW: 500000,
      annualSavings: -10000,
      netRealReturn: 0.05,
      yearsToRetirement: 10,
    })
    // FV lump: 500000 * 1.05^10 = 814,447.31
    // FV annuity: -10000 * (1.05^10 - 1) / 0.05 = -125,778.93
    // Total: ~688,668
    expect(result).toBeCloseTo(688668, 0)
  })

  it('clamps to 0 when projection goes negative', () => {
    const result = projectPortfolioAtRetirement({
      currentNW: 10000,
      annualSavings: -50000,
      netRealReturn: 0.02,
      yearsToRetirement: 10,
    })
    // Would produce negative value; should clamp to 0
    expect(result).toBe(0)
  })

  it('Fresh Graduate integration: $50K NW, $18K savings, 4.4% return, 16 yrs', () => {
    // FV lump: 50000 * 1.044^16 = 99,581.34
    // FV annuity: 18000 * (1.044^16 - 1) / 0.044 = 405,665.54
    // Total: 505,246.88
    const result = projectPortfolioAtRetirement({
      currentNW: 50000,
      annualSavings: 18000,
      netRealReturn: 0.044,
      yearsToRetirement: 16,
    })
    expect(result).toBeCloseTo(505247, -2) // within $100
  })

  it('result is always >= 0', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 5000000, noNaN: true }),
        fc.double({ min: -100000, max: 500000, noNaN: true }),
        fc.double({ min: -0.05, max: 0.2, noNaN: true }),
        fc.double({ min: 0, max: 50, noNaN: true }),
        (nw, savings, r, n) => {
          const result = projectPortfolioAtRetirement({
            currentNW: nw,
            annualSavings: savings,
            netRealReturn: r,
            yearsToRetirement: n,
          })
          return result >= 0
        }
      )
    )
  })
})
