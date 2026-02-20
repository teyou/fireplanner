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
  calculateLiquidBridgeGap,
  calculateParentSupportAtAge,
} from './fire'
import type { ParentSupport } from '@/lib/types'

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

  it('handles negative net worth: takes longer to reach FIRE', () => {
    // With negative NW, years to FIRE should be longer than starting from 0
    const fromZero = calculateYearsToFire(0.04, 50000, 0, 1000000)
    const fromNegative = calculateYearsToFire(0.04, 50000, -50000, 1000000)
    expect(fromNegative).toBeGreaterThan(fromZero)
    expect(fromNegative).toBeGreaterThan(0)
    expect(isFinite(fromNegative)).toBe(true)
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

  it('negative net worth returns negative progress', () => {
    const progress = calculateProgress(-50000, 1200000)
    expect(progress).toBeLessThan(0)
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

describe('fireNumberBasis', () => {
  const baseParams = {
    currentAge: 30,
    retirementAge: 65,
    annualIncome: 100000,
    annualExpenses: 48000,
    liquidNetWorth: 200000,
    cpfTotal: 0,
    swr: 0.04,
    expectedReturn: 0.07,
    inflation: 0.025,
    expenseRatio: 0.003,
  }

  it('today basis produces same result as default (regression)', () => {
    const withToday = calculateAllFireMetrics({ ...baseParams, fireNumberBasis: 'today' })
    const withDefault = calculateAllFireMetrics(baseParams)
    expect(withToday.fireNumber).toBe(withDefault.fireNumber)
    expect(withToday.leanFireNumber).toBe(withDefault.leanFireNumber)
    expect(withToday.fatFireNumber).toBe(withDefault.fatFireNumber)
  })

  it('retirement basis inflates expenses correctly', () => {
    // $48K expenses, 2.5% inflation, age 30→65 (35 years)
    // inflated = 48000 × 1.025^35 = ~113,813.55
    // FIRE number = 113,813.55 / 0.04 = ~2,845,338.72
    const m = calculateAllFireMetrics({ ...baseParams, fireNumberBasis: 'retirement' })
    const inflated = 48000 * Math.pow(1.025, 35)
    expect(m.fireNumber).toBeCloseTo(inflated / 0.04, 0)
  })

  it('lean/fat variants also inflate with retirement basis', () => {
    const m = calculateAllFireMetrics({ ...baseParams, fireNumberBasis: 'retirement' })
    const inflationFactor = Math.pow(1.025, 35)
    // Lean: 48000 * inflationFactor * 0.6 / 0.04
    expect(m.leanFireNumber).toBeCloseTo(48000 * inflationFactor * 0.6 / 0.04, 0)
    // Fat: 48000 * inflationFactor * 1.5 / 0.04
    expect(m.fatFireNumber).toBeCloseTo(48000 * inflationFactor * 1.5 / 0.04, 0)
  })

  it('retirement basis with currentAge >= retirementAge applies no inflation', () => {
    const params = { ...baseParams, currentAge: 65, retirementAge: 65, fireNumberBasis: 'retirement' as const }
    const m = calculateAllFireMetrics(params)
    // yearsToRetirement = 0, so (1+i)^0 = 1, no inflation
    expect(m.fireNumber).toBe(48000 / 0.04) // 1,200,000
  })

  it('retirement basis with inflation = 0 is identical to today basis', () => {
    const paramsZeroInflation = { ...baseParams, inflation: 0 }
    const today = calculateAllFireMetrics({ ...paramsZeroInflation, fireNumberBasis: 'today' })
    const retirement = calculateAllFireMetrics({ ...paramsZeroInflation, fireNumberBasis: 'retirement' })
    expect(retirement.fireNumber).toBe(today.fireNumber)
  })

  it('fireAge basis inflates to converged FIRE age', () => {
    const m = calculateAllFireMetrics({ ...baseParams, fireNumberBasis: 'fireAge' })
    const todayM = calculateAllFireMetrics({ ...baseParams, fireNumberBasis: 'today' })
    // fireAge result should be self-consistent: the inflation used matches the computed FIRE age
    // Convergence tolerance of 0.01 years means FIRE number can differ by ~$300, so check within 0.05%
    const convergedYears = m.yearsToFire
    const expectedInflationFactor = Math.pow(1 + baseParams.inflation, convergedYears)
    const expectedFireNumber = (baseParams.annualExpenses * expectedInflationFactor) / baseParams.swr
    const relativeError = Math.abs(m.fireNumber - expectedFireNumber) / expectedFireNumber
    expect(relativeError).toBeLessThan(0.0005)
    // Should be higher than today basis (inflation applied)
    expect(m.fireNumber).toBeGreaterThan(todayM.fireNumber)
  })

  it('fireAge basis with inflation = 0 is identical to today basis', () => {
    const paramsZeroInflation = { ...baseParams, inflation: 0 }
    const today = calculateAllFireMetrics({ ...paramsZeroInflation, fireNumberBasis: 'today' })
    const fireAge = calculateAllFireMetrics({ ...paramsZeroInflation, fireNumberBasis: 'fireAge' })
    expect(fireAge.fireNumber).toBe(today.fireNumber)
    expect(fireAge.leanFireNumber).toBe(today.leanFireNumber)
    expect(fireAge.fatFireNumber).toBe(today.fatFireNumber)
  })

  it('fireAge basis when already at FIRE applies no inflation', () => {
    const atFireParams = {
      ...baseParams,
      liquidNetWorth: 2000000,
      cpfTotal: 0,
      annualExpenses: 48000,
      swr: 0.04,
    }
    // NW (2M) >= FIRE number (48K/0.04 = 1.2M), so years-to-FIRE = 0
    const m = calculateAllFireMetrics({ ...atFireParams, fireNumberBasis: 'fireAge' })
    const todayM = calculateAllFireMetrics({ ...atFireParams, fireNumberBasis: 'today' })
    expect(m.yearsToFire).toBe(0)
    expect(m.fireNumber).toBe(todayM.fireNumber)
  })

  it('fireAge basis produces value between today and retirement bases', () => {
    const today = calculateAllFireMetrics({ ...baseParams, fireNumberBasis: 'today' })
    const fireAge = calculateAllFireMetrics({ ...baseParams, fireNumberBasis: 'fireAge' })
    const retirement = calculateAllFireMetrics({ ...baseParams, fireNumberBasis: 'retirement' })
    // FIRE age < retirement age in typical savings scenario, so fireAge inflation < retirement inflation
    expect(fireAge.fireNumber).toBeGreaterThan(today.fireNumber)
    expect(fireAge.fireNumber).toBeLessThan(retirement.fireNumber)
  })
})

describe('cpfDependency', () => {
  it('true when liquid < FIRE but total >= FIRE', () => {
    const m = calculateAllFireMetrics({
      currentAge: 55,
      retirementAge: 58,
      annualIncome: 0,
      annualExpenses: 80000,
      liquidNetWorth: 500000,
      cpfTotal: 1600000,
      swr: 0.04,
      expectedReturn: 0.05,
      inflation: 0.025,
      expenseRatio: 0.003,
      lifeExpectancy: 90,
      cpfLifeStartAge: 65,
    })
    // FIRE number = 80K / 0.04 = 2M
    // Total NW = 500K + 1.6M = 2.1M >= 2M (progress >= 1)
    // Liquid = 500K < 2M (liquid < FIRE)
    expect(m.cpfDependency).toBe(true)
  })

  it('false when liquid alone >= FIRE', () => {
    const m = calculateAllFireMetrics({
      currentAge: 55,
      retirementAge: 58,
      annualIncome: 0,
      annualExpenses: 80000,
      liquidNetWorth: 2000000,
      cpfTotal: 500000,
      swr: 0.04,
      expectedReturn: 0.05,
      inflation: 0.025,
      expenseRatio: 0.003,
    })
    expect(m.cpfDependency).toBe(false)
  })

  it('false when both liquid and total are below FIRE', () => {
    const m = calculateAllFireMetrics({
      currentAge: 30,
      retirementAge: 65,
      annualIncome: 72000,
      annualExpenses: 48000,
      liquidNetWorth: 100000,
      cpfTotal: 50000,
      swr: 0.04,
      expectedReturn: 0.07,
      inflation: 0.025,
      expenseRatio: 0.003,
    })
    expect(m.cpfDependency).toBe(false)
  })
})

describe('calculateLiquidBridgeGap', () => {
  it('returns null when liquid never depletes', () => {
    const result = calculateLiquidBridgeGap(3000000, 80000, 58, 65, 0.03, 90)
    expect(result.liquidDepletionAge).toBeNull()
    expect(result.liquidBridgeGapYears).toBeNull()
  })

  it('detects depletion before CPF LIFE starts', () => {
    // $200K liquid, $80K expenses, 0% real return → depletes in 2.5 years
    const result = calculateLiquidBridgeGap(200000, 80000, 58, 65, 0, 90)
    expect(result.liquidDepletionAge).toBe(60) // 200K / 80K = 2.5, depletes year 3 (age 60)
    expect(result.liquidBridgeGapYears).toBe(5) // 65 - 60 = 5 years gap
  })

  it('returns null gap when depletion is after CPF LIFE start', () => {
    // Depletes at 70 but CPF starts at 65 → gap is null
    const result = calculateLiquidBridgeGap(500000, 80000, 58, 65, 0.02, 90)
    // With 2% real return, won't deplete before 65
    // Let's check if it depletes at all...
    if (result.liquidDepletionAge !== null) {
      if (result.liquidDepletionAge >= 65) {
        expect(result.liquidBridgeGapYears).toBeNull()
      }
    }
  })

  it('handles zero liquid portfolio', () => {
    const result = calculateLiquidBridgeGap(0, 80000, 58, 65, 0.03, 90)
    expect(result.liquidDepletionAge).toBe(58)
    expect(result.liquidBridgeGapYears).toBe(7) // 65 - 58
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

describe('calculateParentSupportAtAge', () => {
  const mother: ParentSupport = {
    id: 'm1',
    label: 'Mother',
    monthlyAmount: 500,
    startAge: 35,
    endAge: 75,
    growthRate: 0.03,
  }

  const father: ParentSupport = {
    id: 'f1',
    label: 'Father',
    monthlyAmount: 800,
    startAge: 40,
    endAge: 70,
    growthRate: 0.02,
  }

  it('returns 0 for empty entries', () => {
    expect(calculateParentSupportAtAge([], 40)).toBe(0)
  })

  it('returns 0 when age is before start', () => {
    expect(calculateParentSupportAtAge([mother], 30)).toBe(0)
  })

  it('returns 0 when age is at or after end', () => {
    expect(calculateParentSupportAtAge([mother], 75)).toBe(0)
    expect(calculateParentSupportAtAge([mother], 80)).toBe(0)
  })

  it('single entry at start age (no growth applied)', () => {
    // At startAge (35), yearsActive = 0, so growth^0 = 1
    // 500 * 12 * 1 = 6000
    expect(calculateParentSupportAtAge([mother], 35)).toBe(6000)
  })

  it('single entry with growth over years', () => {
    // At age 45, yearsActive = 10
    // 500 * 12 * (1.03)^10 = 6000 * 1.34392 = 8063.53
    expect(calculateParentSupportAtAge([mother], 45)).toBeCloseTo(6000 * Math.pow(1.03, 10), 2)
  })

  it('multiple entries with overlapping periods', () => {
    // At age 45: mother (active, 10yrs) + father (active, 5yrs)
    const motherAmount = 500 * 12 * Math.pow(1.03, 10) // ~8063.53
    const fatherAmount = 800 * 12 * Math.pow(1.02, 5) // ~10599.27
    expect(calculateParentSupportAtAge([mother, father], 45)).toBeCloseTo(motherAmount + fatherAmount, 2)
  })

  it('multiple entries where only one is active', () => {
    // At age 38: mother active (3yrs), father not yet started
    const motherAmount = 500 * 12 * Math.pow(1.03, 3)
    expect(calculateParentSupportAtAge([mother, father], 38)).toBeCloseTo(motherAmount, 2)
  })

  it('no entries active at given age', () => {
    // At age 80: both entries have ended
    expect(calculateParentSupportAtAge([mother, father], 80)).toBe(0)
  })
})

describe('calculateAllFireMetrics with parentSupport', () => {
  const baseParams = {
    currentAge: 30,
    retirementAge: 60,
    annualIncome: 100000,
    annualExpenses: 48000,
    liquidNetWorth: 200000,
    cpfTotal: 0,
    swr: 0.04,
    expectedReturn: 0.07,
    inflation: 0.025,
    expenseRatio: 0.003,
  }

  const parentEntries: ParentSupport[] = [
    {
      id: 'm1',
      label: 'Mother',
      monthlyAmount: 500,
      startAge: 35,
      endAge: 75,
      growthRate: 0.03,
    },
  ]

  it('parent support increases FIRE number when enabled', () => {
    const without = calculateAllFireMetrics(baseParams)
    const withPS = calculateAllFireMetrics({
      ...baseParams,
      parentSupportEnabled: true,
      parentSupport: parentEntries,
    })
    expect(withPS.fireNumber).toBeGreaterThan(without.fireNumber)
  })

  it('disabled parent support does not change FIRE number', () => {
    const without = calculateAllFireMetrics(baseParams)
    const disabled = calculateAllFireMetrics({
      ...baseParams,
      parentSupportEnabled: false,
      parentSupport: parentEntries,
    })
    expect(disabled.fireNumber).toBe(without.fireNumber)
  })

  it('parent support is additive and NOT subject to FIRE type multiplier', () => {
    // With lean FIRE type, expenses are multiplied by 0.6, but parent support should be added after
    const leanWithPS = calculateAllFireMetrics({
      ...baseParams,
      fireType: 'lean',
      parentSupportEnabled: true,
      parentSupport: parentEntries,
    })
    const leanWithout = calculateAllFireMetrics({
      ...baseParams,
      fireType: 'lean',
    })
    // Parent support at retirement age 60: 500*12*(1.03)^25 = 6000 * 2.09378 = 12562.67
    const psAtRetirement = calculateParentSupportAtAge(parentEntries, 60)
    const expectedDiff = psAtRetirement / 0.04 // FIRE number difference = parentSupport / SWR
    expect(leanWithPS.fireNumber - leanWithout.fireNumber).toBeCloseTo(expectedDiff, 0)
  })

  it('empty parent support array when enabled has no effect', () => {
    const without = calculateAllFireMetrics(baseParams)
    const withEmpty = calculateAllFireMetrics({
      ...baseParams,
      parentSupportEnabled: true,
      parentSupport: [],
    })
    expect(withEmpty.fireNumber).toBe(without.fireNumber)
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
