import { describe, it, expect } from 'vitest'
import { runMonteCarlo, resolveInitialRate, generateReturnsParametric, computeWithdrawalsForYear } from './monteCarlo.ts'
import { CORRELATION_MATRIX, ASSET_CLASSES } from '@/lib/data/historicalReturns.ts'
import { SeededRNG } from '@/lib/math/random.ts'

// Standard test params for a mid-career professional
function makeDefaultParams(overrides: Record<string, unknown> = {}) {
  return {
    initialPortfolio: 1_000_000,
    allocationWeights: [0.30, 0.10, 0.10, 0.25, 0.05, 0.05, 0.10, 0.05],
    expectedReturns: ASSET_CLASSES.map((a) => a.expectedReturn),
    stdDevs: ASSET_CLASSES.map((a) => a.stdDev),
    correlationMatrix: CORRELATION_MATRIX,
    currentAge: 35,
    retirementAge: 55,
    lifeExpectancy: 90,
    annualSavings: Array(20).fill(50_000),
    postRetirementIncome: Array(35).fill(0),
    method: 'parametric' as const,
    nSimulations: 500,
    seed: 42,
    withdrawalStrategy: 'constant_dollar' as const,
    strategyParams: { swr: 0.04 },
    expenseRatio: 0.003,
    inflation: 0.025,
    ...overrides,
  }
}

describe('resolveInitialRate', () => {
  it('returns swr when present', () => {
    expect(resolveInitialRate({ swr: 0.035 })).toBe(0.035)
  })

  it('falls back to initialRate', () => {
    expect(resolveInitialRate({ initialRate: 0.05 })).toBe(0.05)
  })

  it('falls back to initial_rate (snake_case)', () => {
    expect(resolveInitialRate({ initial_rate: 0.05 })).toBe(0.05)
  })

  it('falls back to targetRate', () => {
    expect(resolveInitialRate({ targetRate: 0.045 })).toBe(0.045)
  })

  it('falls back to target_rate (snake_case)', () => {
    expect(resolveInitialRate({ target_rate: 0.045 })).toBe(0.045)
  })

  it('returns default 0.04 when no keys present', () => {
    expect(resolveInitialRate({})).toBe(0.04)
  })

  it('returns custom default', () => {
    expect(resolveInitialRate({}, 0.05)).toBe(0.05)
  })
})

describe('runMonteCarlo', () => {
  it('returns all expected keys', () => {
    const result = runMonteCarlo(makeDefaultParams())
    expect(result).toHaveProperty('success_rate')
    expect(result).toHaveProperty('percentile_bands')
    expect(result).toHaveProperty('terminal_stats')
    expect(result).toHaveProperty('failure_distribution')
  })

  it('success_rate is between 0 and 1', () => {
    const result = runMonteCarlo(makeDefaultParams())
    expect(result.success_rate).toBeGreaterThanOrEqual(0)
    expect(result.success_rate).toBeLessThanOrEqual(1)
  })

  it('percentile_bands has correct length (lifeExpectancy - currentAge + 1)', () => {
    const params = makeDefaultParams()
    const result = runMonteCarlo(params)
    const expectedLength = params.lifeExpectancy - params.currentAge + 1
    expect(result.percentile_bands.years.length).toBe(expectedLength)
    expect(result.percentile_bands.ages.length).toBe(expectedLength)
    expect(result.percentile_bands.p5.length).toBe(expectedLength)
    expect(result.percentile_bands.p50.length).toBe(expectedLength)
    expect(result.percentile_bands.p95.length).toBe(expectedLength)
  })

  it('percentile_bands years start at 0', () => {
    const result = runMonteCarlo(makeDefaultParams())
    expect(result.percentile_bands.years[0]).toBe(0)
  })

  it('percentile_bands ages start at currentAge', () => {
    const params = makeDefaultParams()
    const result = runMonteCarlo(params)
    expect(result.percentile_bands.ages[0]).toBe(params.currentAge)
  })

  it('percentile bands are monotonically ordered (p5 <= p10 <= ... <= p95) at each year', () => {
    const result = runMonteCarlo(makeDefaultParams())
    const bands = result.percentile_bands
    for (let i = 0; i < bands.years.length; i++) {
      expect(bands.p5[i]).toBeLessThanOrEqual(bands.p10[i] + 1e-6)
      expect(bands.p10[i]).toBeLessThanOrEqual(bands.p25[i] + 1e-6)
      expect(bands.p25[i]).toBeLessThanOrEqual(bands.p50[i] + 1e-6)
      expect(bands.p50[i]).toBeLessThanOrEqual(bands.p75[i] + 1e-6)
      expect(bands.p75[i]).toBeLessThanOrEqual(bands.p90[i] + 1e-6)
      expect(bands.p90[i]).toBeLessThanOrEqual(bands.p95[i] + 1e-6)
    }
  })

  it('initial portfolio matches at year 0 (all percentiles equal initialPortfolio)', () => {
    const params = makeDefaultParams()
    const result = runMonteCarlo(params)
    // At year 0, all simulations start with the same initial portfolio
    expect(result.percentile_bands.p5[0]).toBeCloseTo(params.initialPortfolio, -1)
    expect(result.percentile_bands.p50[0]).toBeCloseTo(params.initialPortfolio, -1)
    expect(result.percentile_bands.p95[0]).toBeCloseTo(params.initialPortfolio, -1)
  })

  it('is reproducible with the same seed', () => {
    const params = makeDefaultParams({ seed: 123 })
    const r1 = runMonteCarlo(params)
    const r2 = runMonteCarlo(params)
    expect(r1.success_rate).toBe(r2.success_rate)
    expect(r1.terminal_stats.median).toBe(r2.terminal_stats.median)
    expect(r1.percentile_bands.p50).toEqual(r2.percentile_bands.p50)
  })

  it('produces different results with different seeds', () => {
    const r1 = runMonteCarlo(makeDefaultParams({ seed: 42 }))
    const r2 = runMonteCarlo(makeDefaultParams({ seed: 99 }))
    // Very unlikely to be exactly equal with different seeds
    expect(r1.success_rate).not.toBe(r2.success_rate)
  })

  it('terminal_stats has all required fields', () => {
    const result = runMonteCarlo(makeDefaultParams())
    expect(typeof result.terminal_stats.median).toBe('number')
    expect(typeof result.terminal_stats.mean).toBe('number')
    expect(typeof result.terminal_stats.worst).toBe('number')
    expect(typeof result.terminal_stats.best).toBe('number')
    expect(typeof result.terminal_stats.p5).toBe('number')
    expect(typeof result.terminal_stats.p95).toBe('number')
  })

  it('terminal_stats worst <= median <= best', () => {
    const result = runMonteCarlo(makeDefaultParams())
    expect(result.terminal_stats.worst).toBeLessThanOrEqual(result.terminal_stats.median)
    expect(result.terminal_stats.median).toBeLessThanOrEqual(result.terminal_stats.best)
  })

  it('terminal_stats p5 <= p95', () => {
    const result = runMonteCarlo(makeDefaultParams())
    expect(result.terminal_stats.p5).toBeLessThanOrEqual(result.terminal_stats.p95)
  })

  it('failure_distribution has all required fields', () => {
    const result = runMonteCarlo(makeDefaultParams())
    expect(Array.isArray(result.failure_distribution.buckets)).toBe(true)
    expect(Array.isArray(result.failure_distribution.counts)).toBe(true)
    expect(typeof result.failure_distribution.total_failures).toBe('number')
  })

  it('failure_distribution total_failures is consistent with success_rate', () => {
    const params = makeDefaultParams()
    const result = runMonteCarlo(params)
    const expectedFailures = Math.round((1 - result.success_rate) * params.nSimulations)
    expect(result.failure_distribution.total_failures).toBe(expectedFailures)
  })

  it('failure_distribution bucket counts sum to total_failures', () => {
    const result = runMonteCarlo(makeDefaultParams())
    const sumCounts = result.failure_distribution.counts.reduce((a, b) => a + b, 0)
    expect(sumCounts).toBe(result.failure_distribution.total_failures)
  })
})

describe('runMonteCarlo — bootstrap method', () => {
  it('runs successfully with bootstrap method', () => {
    const result = runMonteCarlo(makeDefaultParams({ method: 'bootstrap' }))
    expect(result.success_rate).toBeGreaterThanOrEqual(0)
    expect(result.success_rate).toBeLessThanOrEqual(1)
    expect(result.percentile_bands.years.length).toBe(90 - 35 + 1)
  })

  it('is reproducible with same seed', () => {
    const params = makeDefaultParams({ method: 'bootstrap', seed: 77 })
    const r1 = runMonteCarlo(params)
    const r2 = runMonteCarlo(params)
    expect(r1.success_rate).toBe(r2.success_rate)
    expect(r1.terminal_stats.median).toBe(r2.terminal_stats.median)
  })
})

describe('runMonteCarlo — fat_tail method', () => {
  it('runs successfully with fat_tail method', () => {
    const result = runMonteCarlo(makeDefaultParams({ method: 'fat_tail' }))
    expect(result.success_rate).toBeGreaterThanOrEqual(0)
    expect(result.success_rate).toBeLessThanOrEqual(1)
    expect(result.percentile_bands.years.length).toBe(90 - 35 + 1)
  })

  it('is reproducible with same seed', () => {
    const params = makeDefaultParams({ method: 'fat_tail', seed: 55 })
    const r1 = runMonteCarlo(params)
    const r2 = runMonteCarlo(params)
    expect(r1.success_rate).toBe(r2.success_rate)
    expect(r1.terminal_stats.median).toBe(r2.terminal_stats.median)
  })
})

describe('runMonteCarlo — already-retired scenario', () => {
  it('handles currentAge == retirementAge (pure decumulation)', () => {
    const params = makeDefaultParams({
      currentAge: 55,
      retirementAge: 55,
      lifeExpectancy: 90,
      annualSavings: [],
      postRetirementIncome: Array(35).fill(10_000),
    })
    const result = runMonteCarlo(params)
    expect(result.success_rate).toBeGreaterThanOrEqual(0)
    expect(result.success_rate).toBeLessThanOrEqual(1)
    // Should be 36 points (90 - 55 + 1)
    expect(result.percentile_bands.years.length).toBe(36)
    expect(result.percentile_bands.ages[0]).toBe(55)
  })
})

describe('runMonteCarlo — VPW strategy', () => {
  it('runs VPW strategy successfully', () => {
    const result = runMonteCarlo(
      makeDefaultParams({
        withdrawalStrategy: 'vpw',
        strategyParams: { expectedRealReturn: 0.03, targetEndValue: 0 },
      })
    )
    expect(result.success_rate).toBeGreaterThanOrEqual(0)
    expect(result.success_rate).toBeLessThanOrEqual(1)
  })
})

describe('runMonteCarlo — guardrails strategy', () => {
  it('runs guardrails strategy successfully', () => {
    const result = runMonteCarlo(
      makeDefaultParams({
        withdrawalStrategy: 'guardrails',
        strategyParams: {
          initialRate: 0.05,
          ceilingTrigger: 1.20,
          floorTrigger: 0.80,
          adjustmentSize: 0.10,
        },
      })
    )
    expect(result.success_rate).toBeGreaterThanOrEqual(0)
    expect(result.success_rate).toBeLessThanOrEqual(1)
  })
})

describe('runMonteCarlo — vanguard_dynamic strategy', () => {
  it('runs vanguard_dynamic strategy successfully', () => {
    const result = runMonteCarlo(
      makeDefaultParams({
        withdrawalStrategy: 'vanguard_dynamic',
        strategyParams: { swr: 0.04, ceiling: 0.05, floor: 0.025 },
      })
    )
    expect(result.success_rate).toBeGreaterThanOrEqual(0)
    expect(result.success_rate).toBeLessThanOrEqual(1)
  })
})

describe('runMonteCarlo — cape_based strategy', () => {
  it('runs cape_based strategy successfully', () => {
    const result = runMonteCarlo(
      makeDefaultParams({
        withdrawalStrategy: 'cape_based',
        strategyParams: { baseRate: 0.04, capeWeight: 0.50, currentCape: 30 },
      })
    )
    expect(result.success_rate).toBeGreaterThanOrEqual(0)
    expect(result.success_rate).toBeLessThanOrEqual(1)
  })
})

describe('runMonteCarlo — floor_ceiling strategy', () => {
  it('runs floor_ceiling strategy successfully', () => {
    const result = runMonteCarlo(
      makeDefaultParams({
        withdrawalStrategy: 'floor_ceiling',
        strategyParams: { floorAmount: 60_000, ceilingAmount: 150_000, targetRate: 0.045 },
      })
    )
    expect(result.success_rate).toBeGreaterThanOrEqual(0)
    expect(result.success_rate).toBeLessThanOrEqual(1)
  })
})

describe('generateReturnsParametric', () => {
  it('returns array of correct shape (nSims x nYears)', () => {
    const rng = new SeededRNG(42)
    const returns = generateReturnsParametric(
      rng,
      100,
      10,
      [0.30, 0.10, 0.10, 0.25, 0.05, 0.05, 0.10, 0.05],
      ASSET_CLASSES.map((a) => a.expectedReturn),
      ASSET_CLASSES.map((a) => a.stdDev),
      CORRELATION_MATRIX,
    )
    expect(returns.length).toBe(100)
    expect(returns[0].length).toBe(10)
  })

  it('returns are finite numbers', () => {
    const rng = new SeededRNG(42)
    const returns = generateReturnsParametric(
      rng,
      50,
      5,
      [0.30, 0.10, 0.10, 0.25, 0.05, 0.05, 0.10, 0.05],
      ASSET_CLASSES.map((a) => a.expectedReturn),
      ASSET_CLASSES.map((a) => a.stdDev),
      CORRELATION_MATRIX,
    )
    for (let s = 0; s < 50; s++) {
      for (let y = 0; y < 5; y++) {
        expect(Number.isFinite(returns[s][y])).toBe(true)
      }
    }
  })
})

describe('computeWithdrawalsForYear', () => {
  it('dispatches constant_dollar correctly', () => {
    const withdrawal = computeWithdrawalsForYear(
      'constant_dollar',
      1_000_000,
      3,
      30,
      40_000,
      38_000,
      0.025,
      { swr: 0.04 },
      undefined,
    )
    // constant_dollar: initialWithdrawal * (1 + inflation)^year = 40000 * 1.025^3
    const expected = 40_000 * 1.025 ** 3
    expect(withdrawal).toBeCloseTo(expected, 2)
  })

  it('dispatches vpw correctly', () => {
    const withdrawal = computeWithdrawalsForYear(
      'vpw',
      1_000_000,
      0,
      30,
      40_000,
      0,
      0.025,
      { expectedRealReturn: 0.03, targetEndValue: 0 },
      undefined,
    )
    // VPW: remaining = 30 - 0 = 30, rate = r*(1-0)/( 1 - (1+r)^-n )
    expect(withdrawal).toBeGreaterThan(0)
    expect(withdrawal).toBeLessThan(1_000_000)
  })

  it('throws on unknown strategy', () => {
    expect(() =>
      computeWithdrawalsForYear(
        'unknown_strategy',
        1_000_000,
        0,
        30,
        40_000,
        0,
        0.025,
        {},
        undefined,
      )
    ).toThrow('Unknown strategy')
  })
})
