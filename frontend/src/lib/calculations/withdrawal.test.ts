/**
 * Shared test vectors for withdrawal strategies.
 * Same inputs/outputs as backend/tests/test_withdrawal_strategies.py for parity.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  constantDollar,
  vpw,
  guardrails,
  vanguardDynamic,
  capeBased,
  floorCeiling,
  percentOfPortfolio,
  oneOverN,
  sensibleWithdrawals,
  ninetyFivePercent,
  endowment,
  hebelerAutopilot,
  computeWithdrawal,
  runDeterministicComparison,
} from './withdrawal'

const PORTFOLIO = 2_000_000
const INFLATION = 0.025
const SWR = 0.04
const INITIAL_WITHDRAWAL = PORTFOLIO * SWR // $80,000

describe('constantDollar', () => {
  it('year 0: returns initial withdrawal', () => {
    expect(constantDollar(PORTFOLIO, 0, INITIAL_WITHDRAWAL, INFLATION)).toBeCloseTo(80_000, 0)
  })

  it('year 1: inflation-adjusted', () => {
    expect(constantDollar(PORTFOLIO, 1, INITIAL_WITHDRAWAL, INFLATION)).toBeCloseTo(82_000, 0)
  })

  it('year 10: compound inflation', () => {
    const expected = 80_000 * 1.025 ** 10
    expect(constantDollar(PORTFOLIO, 10, INITIAL_WITHDRAWAL, INFLATION)).toBeCloseTo(expected, 0)
  })

  it('ignores portfolio value', () => {
    const r1 = constantDollar(1_000_000, 5, INITIAL_WITHDRAWAL, INFLATION)
    const r2 = constantDollar(5_000_000, 5, INITIAL_WITHDRAWAL, INFLATION)
    expect(r1).toBeCloseTo(r2, 6)
  })
})

describe('vpw', () => {
  it('30 years, 3% real: ~5.1% rate', () => {
    const result = vpw(PORTFOLIO, 30, 0.03)
    expect(result / PORTFOLIO).toBeCloseTo(0.05102, 2)
  })

  it('20 years, 3% real: ~6.7% rate', () => {
    const result = vpw(PORTFOLIO, 20, 0.03)
    expect(result / PORTFOLIO).toBeCloseTo(0.06722, 2)
  })

  it('10 years, 3% real: ~11.7% rate', () => {
    const result = vpw(PORTFOLIO, 10, 0.03)
    expect(result / PORTFOLIO).toBeCloseTo(0.11723, 2)
  })

  it('0 years: withdraws entire portfolio', () => {
    expect(vpw(PORTFOLIO, 0)).toBeCloseTo(PORTFOLIO, 0)
  })

  it('zero return: simple linear', () => {
    expect(vpw(PORTFOLIO, 20, 0)).toBeCloseTo(PORTFOLIO / 20, 0)
  })

  it('property: rate increases as years decrease', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 100_000, max: 10_000_000, noNaN: true }),
        (p) => {
          const r30 = vpw(p, 30, 0.03)
          const r20 = vpw(p, 20, 0.03)
          const r10 = vpw(p, 10, 0.03)
          return r10 > r20 && r20 > r30
        }
      )
    )
  })
})

describe('guardrails', () => {
  it('year 0: returns initial withdrawal', () => {
    expect(guardrails(PORTFOLIO, 0, 100_000, 0, INFLATION)).toBeCloseTo(100_000, 0)
  })

  it('normal: inflation-adjusted', () => {
    expect(guardrails(PORTFOLIO, 1, 100_000, 100_000, INFLATION, 0.05)).toBeCloseTo(102_500, 0)
  })

  it('capital preservation cut', () => {
    // Portfolio crashed, spending rate > ceiling → cut
    const result = guardrails(800_000, 1, 100_000, 100_000, INFLATION, 0.05, 1.20, 0.80, 0.10)
    expect(result).toBeCloseTo(102_500 * 0.90, 0)
  })

  it('prosperity raise', () => {
    // Portfolio soared, spending rate < floor → raise
    const result = guardrails(5_000_000, 1, 100_000, 100_000, INFLATION, 0.05, 1.20, 0.80, 0.10)
    expect(result).toBeCloseTo(102_500 * 1.10, 0)
  })
})

describe('guardrails PMR', () => {
  it('negative return: skips inflation adjustment', () => {
    const result = guardrails(PORTFOLIO, 1, 100_000, 100_000, INFLATION, 0.05, 1.20, 0.80, 0.10, -0.20)
    // base = prev_withdrawal (no inflation), within guardrails → return base
    expect(result).toBeCloseTo(100_000, 0)
  })

  it('positive return: applies inflation normally', () => {
    const result = guardrails(PORTFOLIO, 1, 100_000, 100_000, INFLATION, 0.05, 1.20, 0.80, 0.10, 0.10)
    expect(result).toBeCloseTo(102_500, 0)
  })

  it('undefined return: applies inflation normally (backward compat)', () => {
    const result = guardrails(PORTFOLIO, 1, 100_000, 100_000, INFLATION, 0.05, 1.20, 0.80, 0.10)
    expect(result).toBeCloseTo(102_500, 0)
  })
})

describe('vanguardDynamic', () => {
  it('year 0: returns initial withdrawal', () => {
    expect(vanguardDynamic(PORTFOLIO, 0, INITIAL_WITHDRAWAL, 0, INFLATION)).toBeCloseTo(INITIAL_WITHDRAWAL, 0)
  })

  it('target within bounds: uses target', () => {
    const result = vanguardDynamic(PORTFOLIO, 1, INITIAL_WITHDRAWAL, INITIAL_WITHDRAWAL, INFLATION, SWR, 0.05, 0.025)
    expect(result).toBeCloseTo(80_000, 0)
  })

  it('ceiling hit', () => {
    const result = vanguardDynamic(3_000_000, 1, INITIAL_WITHDRAWAL, INITIAL_WITHDRAWAL, INFLATION, SWR, 0.05, 0.025)
    expect(result).toBeCloseTo(82_000 * 1.05, 0)
  })

  it('floor hit', () => {
    const result = vanguardDynamic(1_000_000, 1, INITIAL_WITHDRAWAL, INITIAL_WITHDRAWAL, INFLATION, SWR, 0.05, 0.025)
    expect(result).toBeCloseTo(82_000 * 0.975, 0)
  })
})

describe('capeBased', () => {
  it('year 0 with high CAPE (30)', () => {
    const expectedRate = 0.5 * (1 / 30) + 0.5 * 0.04
    expect(capeBased(PORTFOLIO, 0, 0.04, 0.50, 30)).toBeCloseTo(PORTFOLIO * expectedRate, 0)
  })

  it('year 10: mean-reverted to 17', () => {
    const expectedRate = 0.5 * (1 / 17) + 0.5 * 0.04
    expect(capeBased(PORTFOLIO, 10, 0.04, 0.50, 30)).toBeCloseTo(PORTFOLIO * expectedRate, 0)
  })

  it('year 5: midway reversion', () => {
    const midCape = 30 + (17 - 30) * 0.5
    const expectedRate = 0.5 * (1 / midCape) + 0.5 * 0.04
    expect(capeBased(PORTFOLIO, 5, 0.04, 0.50, 30)).toBeCloseTo(PORTFOLIO * expectedRate, 0)
  })

  it('year 20: still at mean', () => {
    const expectedRate = 0.5 * (1 / 17) + 0.5 * 0.04
    expect(capeBased(PORTFOLIO, 20, 0.04, 0.50, 30)).toBeCloseTo(PORTFOLIO * expectedRate, 0)
  })
})

describe('floorCeiling', () => {
  it('within bounds: uses target', () => {
    expect(floorCeiling(PORTFOLIO, 60_000, 150_000, 0.045)).toBeCloseTo(90_000, 0)
  })

  it('floor hit', () => {
    expect(floorCeiling(500_000, 60_000, 150_000, 0.045)).toBeCloseTo(60_000, 0)
  })

  it('ceiling hit', () => {
    expect(floorCeiling(5_000_000, 60_000, 150_000, 0.045)).toBeCloseTo(150_000, 0)
  })

  it('property: floor <= result <= ceiling', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 10_000_000, noNaN: true }),
        (p) => {
          const result = floorCeiling(p, 60_000, 150_000, 0.045)
          return result >= 60_000 && result <= 150_000
        }
      )
    )
  })
})

describe('runDeterministicComparison', () => {
  it('runs all 6 strategies', () => {
    const result = runDeterministicComparison({
      initialPortfolio: PORTFOLIO,
      retirementAge: 55,
      lifeExpectancy: 90,
      expectedReturn: 0.072,
      inflation: 0.025,
      expenseRatio: 0.003,
      swr: SWR,
      strategies: ['constant_dollar', 'vpw', 'guardrails', 'vanguard_dynamic', 'cape_based', 'floor_ceiling'],
      strategyParams: {
        constant_dollar: { swr: 0.04 },
        vpw: { expectedRealReturn: 0.03, targetEndValue: 0 },
        guardrails: { initialRate: 0.05, ceilingTrigger: 1.20, floorTrigger: 0.80, adjustmentSize: 0.10 },
        vanguard_dynamic: { swr: 0.04, ceiling: 0.05, floor: 0.025 },
        cape_based: { baseRate: 0.04, capeWeight: 0.50, currentCape: 30 },
        floor_ceiling: { floor: 60_000, ceiling: 150_000, targetRate: 0.045 },
      },
    })

    expect(Object.keys(result.yearResults)).toHaveLength(6)
    expect(Object.keys(result.summaries)).toHaveLength(6)

    // Each strategy should have 35 years (90-55)
    for (const strategy of Object.keys(result.yearResults)) {
      expect(result.yearResults[strategy]).toHaveLength(35)
    }

    // All strategies should produce positive avg withdrawal
    for (const summary of Object.values(result.summaries)) {
      expect(summary.avgWithdrawal).toBeGreaterThan(0)
    }
  })

  it('property: withdrawal >= 0 for all years', () => {
    const result = runDeterministicComparison({
      initialPortfolio: PORTFOLIO,
      retirementAge: 55,
      lifeExpectancy: 90,
      expectedReturn: 0.072,
      inflation: 0.025,
      expenseRatio: 0.003,
      swr: SWR,
      strategies: ['constant_dollar', 'vpw'],
      strategyParams: {
        constant_dollar: { swr: 0.04 },
        vpw: { expectedRealReturn: 0.03, targetEndValue: 0 },
      },
    })

    for (const years of Object.values(result.yearResults)) {
      for (const yr of years) {
        expect(yr.withdrawal).toBeGreaterThanOrEqual(0)
      }
    }
  })
})

// ============================================================
// Strategy 7: Percent of Portfolio
// ============================================================

describe('percentOfPortfolio', () => {
  it('returns portfolio * rate', () => {
    expect(percentOfPortfolio(PORTFOLIO, 0.04)).toBeCloseTo(80_000, 0)
  })

  it('scales with portfolio', () => {
    expect(percentOfPortfolio(500_000, 0.04)).toBeCloseTo(20_000, 0)
  })

  it('zero portfolio: returns 0', () => {
    expect(percentOfPortfolio(0, 0.04)).toBeCloseTo(0, 0)
  })

  it('property: withdrawal >= 0', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 10_000_000, noNaN: true }),
        fc.double({ min: 0.01, max: 0.20, noNaN: true }),
        (p, r) => percentOfPortfolio(p, r) >= 0,
      ),
    )
  })
})

// ============================================================
// Strategy 8: 1/N (Remaining Years)
// ============================================================

describe('oneOverN', () => {
  it('30 years: withdraws 1/30th', () => {
    expect(oneOverN(PORTFOLIO, 30)).toBeCloseTo(PORTFOLIO / 30, 0)
  })

  it('1 year: withdraws entire portfolio', () => {
    expect(oneOverN(PORTFOLIO, 1)).toBeCloseTo(PORTFOLIO, 0)
  })

  it('0 remaining years: clamps to 1', () => {
    expect(oneOverN(PORTFOLIO, 0)).toBeCloseTo(PORTFOLIO, 0)
  })

  it('negative remaining years: clamps to 1', () => {
    expect(oneOverN(PORTFOLIO, -5)).toBeCloseTo(PORTFOLIO, 0)
  })

  it('property: withdrawal >= 0', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 10_000_000, noNaN: true }),
        fc.integer({ min: 1, max: 60 }),
        (p, n) => oneOverN(p, n) >= 0,
      ),
    )
  })
})

// ============================================================
// Strategy 9: Sensible Withdrawals
// ============================================================

describe('sensibleWithdrawals', () => {
  it('year 0 (no prior gains): base rate only', () => {
    expect(sensibleWithdrawals(PORTFOLIO, 0.03, 0.10, 0)).toBeCloseTo(60_000, 0)
  })

  it('with positive gains: base + extras share', () => {
    const gains = 200_000
    const expected = PORTFOLIO * 0.03 + gains * 0.10
    expect(sensibleWithdrawals(PORTFOLIO, 0.03, 0.10, gains)).toBeCloseTo(expected, 0)
  })

  it('negative gains: extras are 0', () => {
    expect(sensibleWithdrawals(PORTFOLIO, 0.03, 0.10, -100_000)).toBeCloseTo(60_000, 0)
  })

  it('zero portfolio: returns 0', () => {
    expect(sensibleWithdrawals(0, 0.03, 0.10, 0)).toBeCloseTo(0, 0)
  })

  it('property: withdrawal >= 0', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 10_000_000, noNaN: true }),
        fc.double({ min: -500_000, max: 500_000, noNaN: true }),
        (p, gains) => sensibleWithdrawals(p, 0.03, 0.10, gains) >= 0,
      ),
    )
  })
})

// ============================================================
// Strategy 10: 95% Rule
// ============================================================

describe('ninetyFivePercent', () => {
  it('year 0 (prevWithdrawal=0): portfolio * swr', () => {
    expect(ninetyFivePercent(PORTFOLIO, 0, 0.04)).toBeCloseTo(80_000, 0)
  })

  it('good year: uses market-based amount', () => {
    // 3M * 0.04 = 120K > 80K * 0.95 = 76K → uses 120K
    expect(ninetyFivePercent(3_000_000, 80_000, 0.04)).toBeCloseTo(120_000, 0)
  })

  it('bad year: uses 95% floor', () => {
    // 500K * 0.04 = 20K < 80K * 0.95 = 76K → uses 76K
    expect(ninetyFivePercent(500_000, 80_000, 0.04)).toBeCloseTo(76_000, 0)
  })

  it('zero portfolio: uses 95% floor', () => {
    expect(ninetyFivePercent(0, 80_000, 0.04)).toBeCloseTo(76_000, 0)
  })
})

// ============================================================
// Strategy 11: Endowment (Yale Model)
// ============================================================

describe('endowment', () => {
  it('year 0 (prevWithdrawal=0): (1-w) * portfolio * swr', () => {
    // w=0.70, (1-0.70) * 2M * 0.04 = 0.30 * 80K = 24K
    expect(endowment(PORTFOLIO, 0, INFLATION, 0.04, 0.70)).toBeCloseTo(24_000, 0)
  })

  it('year 1: blends inflation-adjusted prior with market target', () => {
    const prev = 80_000
    const w = 0.70
    const expected = w * prev * (1 + INFLATION) + (1 - w) * PORTFOLIO * 0.04
    expect(endowment(PORTFOLIO, prev, INFLATION, 0.04, w)).toBeCloseTo(expected, 0)
  })

  it('high smoothing: heavily weighted to prior', () => {
    const prev = 80_000
    const result = endowment(PORTFOLIO, prev, INFLATION, 0.04, 0.90)
    // 0.90 * 80K * 1.025 + 0.10 * 80K = 73800 + 8000 = 81800
    expect(result).toBeCloseTo(0.90 * prev * 1.025 + 0.10 * PORTFOLIO * 0.04, 0)
  })

  it('property: withdrawal >= 0', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 10_000_000, noNaN: true }),
        fc.double({ min: 0, max: 200_000, noNaN: true }),
        (p, prev) => endowment(p, prev, 0.025, 0.04, 0.70) >= 0,
      ),
    )
  })
})

// ============================================================
// Strategy 12: Hebeler Autopilot II
// ============================================================

describe('hebelerAutopilot', () => {
  it('year 0 (prevWithdrawal=0): 0.25 * PMT component', () => {
    const pmt = vpw(PORTFOLIO, 30, 0.03, 0)
    expect(hebelerAutopilot(PORTFOLIO, 0, INFLATION, 30, 0.03)).toBeCloseTo(0.25 * pmt, 0)
  })

  it('year 1: blends prior inflation-adjusted with PMT', () => {
    const prev = 80_000
    const pmt = vpw(PORTFOLIO, 29, 0.03, 0)
    const expected = 0.75 * prev * (1 + INFLATION) + 0.25 * pmt
    expect(hebelerAutopilot(PORTFOLIO, prev, INFLATION, 29, 0.03)).toBeCloseTo(expected, 0)
  })

  it('0 remaining years: PMT returns full portfolio', () => {
    const prev = 80_000
    const pmt = vpw(PORTFOLIO, 0, 0.03, 0) // = portfolio
    const expected = 0.75 * prev * (1 + INFLATION) + 0.25 * pmt
    expect(hebelerAutopilot(PORTFOLIO, prev, INFLATION, 0, 0.03)).toBeCloseTo(expected, 0)
  })

  it('property: withdrawal >= 0', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 10_000_000, noNaN: true }),
        fc.double({ min: 0, max: 200_000, noNaN: true }),
        fc.integer({ min: 1, max: 40 }),
        (p, prev, n) => hebelerAutopilot(p, prev, 0.025, n, 0.03) >= 0,
      ),
    )
  })
})

// ============================================================
// computeWithdrawal dispatch
// ============================================================

describe('computeWithdrawal dispatch', () => {
  const baseCtx = {
    portfolio: PORTFOLIO,
    year: 0,
    remainingYears: 30,
    initialWithdrawal: INITIAL_WITHDRAWAL,
    prevWithdrawal: 0,
    inflation: INFLATION,
    strategyParams: {} as Record<string, number>,
  }

  it('constant_dollar: matches direct call', () => {
    const direct = constantDollar(PORTFOLIO, 5, INITIAL_WITHDRAWAL, INFLATION)
    const dispatched = computeWithdrawal('constant_dollar', {
      ...baseCtx,
      year: 5,
      strategyParams: { swr: SWR },
    })
    expect(dispatched).toBeCloseTo(direct, 6)
  })

  it('vpw: matches direct call', () => {
    const direct = vpw(PORTFOLIO, 25, 0.03, 0)
    const dispatched = computeWithdrawal('vpw', {
      ...baseCtx,
      remainingYears: 25,
      strategyParams: { expectedRealReturn: 0.03, targetEndValue: 0 },
    })
    expect(dispatched).toBeCloseTo(direct, 6)
  })

  it('guardrails: matches direct call at year 1', () => {
    const direct = guardrails(PORTFOLIO, 1, 100_000, 100_000, INFLATION, 0.05, 1.20, 0.80, 0.10)
    const dispatched = computeWithdrawal('guardrails', {
      ...baseCtx,
      year: 1,
      initialWithdrawal: 100_000,
      prevWithdrawal: 100_000,
      strategyParams: { initialRate: 0.05, ceilingTrigger: 1.20, floorTrigger: 0.80, adjustmentSize: 0.10 },
    })
    expect(dispatched).toBeCloseTo(direct, 6)
  })

  it('vanguard_dynamic: matches direct call', () => {
    const direct = vanguardDynamic(PORTFOLIO, 1, INITIAL_WITHDRAWAL, INITIAL_WITHDRAWAL, INFLATION, 0.04, 0.05, 0.025)
    const dispatched = computeWithdrawal('vanguard_dynamic', {
      ...baseCtx,
      year: 1,
      prevWithdrawal: INITIAL_WITHDRAWAL,
      strategyParams: { swr: 0.04, ceiling: 0.05, floor: 0.025 },
    })
    expect(dispatched).toBeCloseTo(direct, 6)
  })

  it('cape_based: matches direct call', () => {
    const direct = capeBased(PORTFOLIO, 5, 0.04, 0.50, 30)
    const dispatched = computeWithdrawal('cape_based', {
      ...baseCtx,
      year: 5,
      strategyParams: { baseRate: 0.04, capeWeight: 0.50, currentCape: 30 },
    })
    expect(dispatched).toBeCloseTo(direct, 6)
  })

  it('floor_ceiling: matches direct call with floorAmount/ceilingAmount', () => {
    const direct = floorCeiling(PORTFOLIO, 60_000, 150_000, 0.045)
    const dispatched = computeWithdrawal('floor_ceiling', {
      ...baseCtx,
      strategyParams: { floorAmount: 60_000, ceilingAmount: 150_000, targetRate: 0.045 },
    })
    expect(dispatched).toBeCloseTo(direct, 6)
  })

  it('floor_ceiling: handles raw store params (floor/ceiling)', () => {
    const direct = floorCeiling(PORTFOLIO, 60_000, 150_000, 0.045)
    const dispatched = computeWithdrawal('floor_ceiling', {
      ...baseCtx,
      strategyParams: { floor: 60_000, ceiling: 150_000, targetRate: 0.045 },
    })
    expect(dispatched).toBeCloseTo(direct, 6)
  })

  it('percent_of_portfolio: matches direct call', () => {
    const direct = percentOfPortfolio(PORTFOLIO, 0.05)
    const dispatched = computeWithdrawal('percent_of_portfolio', {
      ...baseCtx,
      strategyParams: { rate: 0.05 },
    })
    expect(dispatched).toBeCloseTo(direct, 6)
  })

  it('one_over_n: matches direct call', () => {
    const direct = oneOverN(PORTFOLIO, 25)
    const dispatched = computeWithdrawal('one_over_n', {
      ...baseCtx,
      remainingYears: 25,
      strategyParams: {},
    })
    expect(dispatched).toBeCloseTo(direct, 6)
  })

  it('sensible_withdrawals: matches direct call', () => {
    const gains = 150_000
    const direct = sensibleWithdrawals(PORTFOLIO, 0.03, 0.10, gains)
    const dispatched = computeWithdrawal('sensible_withdrawals', {
      ...baseCtx,
      strategyParams: { baseRate: 0.03, extrasRate: 0.10 },
      prevYearGains: gains,
    })
    expect(dispatched).toBeCloseTo(direct, 6)
  })

  it('ninety_five_percent: matches direct call', () => {
    const direct = ninetyFivePercent(PORTFOLIO, 80_000, 0.04)
    const dispatched = computeWithdrawal('ninety_five_percent', {
      ...baseCtx,
      year: 1,
      prevWithdrawal: 80_000,
      strategyParams: { swr: 0.04 },
    })
    expect(dispatched).toBeCloseTo(direct, 6)
  })

  it('endowment: matches direct call', () => {
    const direct = endowment(PORTFOLIO, 80_000, INFLATION, 0.04, 0.70)
    const dispatched = computeWithdrawal('endowment', {
      ...baseCtx,
      year: 1,
      prevWithdrawal: 80_000,
      strategyParams: { swr: 0.04, smoothingWeight: 0.70 },
    })
    expect(dispatched).toBeCloseTo(direct, 6)
  })

  it('hebeler_autopilot: matches direct call', () => {
    const direct = hebelerAutopilot(PORTFOLIO, 80_000, INFLATION, 29, 0.03)
    const dispatched = computeWithdrawal('hebeler_autopilot', {
      ...baseCtx,
      year: 1,
      remainingYears: 29,
      prevWithdrawal: 80_000,
      strategyParams: { expectedRealReturn: 0.03 },
    })
    expect(dispatched).toBeCloseTo(direct, 6)
  })

  it('throws on unknown strategy', () => {
    expect(() => computeWithdrawal('unknown_strategy', baseCtx)).toThrow('Unknown withdrawal strategy')
  })
})
