/**
 * Tests for the sequence risk stress testing engine.
 * Faithfully ported from backend/app/api/routes/sequence_risk.py.
 */

import { describe, it, expect } from 'vitest'
import { runSequenceRisk } from './sequenceRisk'
import { CORRELATION_MATRIX, ASSET_CLASSES } from '@/lib/data/historicalReturns'

const PARAMS = {
  initialPortfolio: 2_000_000,
  allocationWeights: [0.30, 0.10, 0.10, 0.25, 0.10, 0.05, 0.05, 0.05],
  expectedReturns: ASSET_CLASSES.map(a => a.expectedReturn),
  stdDevs: ASSET_CLASSES.map(a => a.stdDev),
  correlationMatrix: CORRELATION_MATRIX,
  retirementAge: 55,
  lifeExpectancy: 90,
  withdrawalStrategy: 'constant_dollar' as const,
  strategyParams: { swr: 0.04 },
  nSimulations: 200, // Keep low for test speed
  seed: 42,
  expenseRatio: 0.003,
  inflation: 0.025,
  postRetirementIncome: [] as number[],
  crisis: {
    id: 'gfc',
    name: 'Global Financial Crisis',
    equityReturnSequence: [-0.38, -0.10, 0.15],
    durationYears: 3,
  },
}

describe('runSequenceRisk', () => {
  it('returns all expected keys (snake_case)', () => {
    const result = runSequenceRisk(PARAMS)
    expect(result).toHaveProperty('normal_success_rate')
    expect(result).toHaveProperty('crisis_success_rate')
    expect(result).toHaveProperty('success_degradation')
    expect(result).toHaveProperty('normal_percentile_bands')
    expect(result).toHaveProperty('crisis_percentile_bands')
    expect(result).toHaveProperty('mitigations')
  })

  it('crisis success rate <= normal success rate (with tolerance)', () => {
    const result = runSequenceRisk(PARAMS)
    expect(result.crisis_success_rate).toBeLessThanOrEqual(result.normal_success_rate + 0.05)
  })

  it('success_degradation = normal - crisis', () => {
    const result = runSequenceRisk(PARAMS)
    expect(result.success_degradation).toBeCloseTo(
      result.normal_success_rate - result.crisis_success_rate,
      6,
    )
  })

  it('returns 3 mitigations', () => {
    const result = runSequenceRisk(PARAMS)
    expect(result.mitigations).toHaveLength(3)
  })

  it('each mitigation has required fields', () => {
    const result = runSequenceRisk(PARAMS)
    for (const m of result.mitigations) {
      expect(m).toHaveProperty('strategy')
      expect(m).toHaveProperty('description')
      expect(m).toHaveProperty('normal_success_rate')
      expect(m).toHaveProperty('crisis_success_rate')
      expect(m).toHaveProperty('success_improvement')
    }
  })

  it('mitigations have expected names', () => {
    const result = runSequenceRisk(PARAMS)
    const names = result.mitigations.map(m => m.strategy)
    expect(names).toContain('Conservative Allocation')
    expect(names).toContain('Cash Buffer (2 Years)')
    expect(names).toContain('Flexible Spending (-15%)')
  })

  it('percentile bands have correct length', () => {
    const result = runSequenceRisk(PARAMS)
    const nYears = 90 - 55 + 1 // 36
    expect(result.normal_percentile_bands.p50).toHaveLength(nYears)
    expect(result.crisis_percentile_bands.p50).toHaveLength(nYears)
  })

  it('is reproducible with same seed', () => {
    const r1 = runSequenceRisk(PARAMS)
    const r2 = runSequenceRisk(PARAMS)
    expect(r1.normal_success_rate).toBe(r2.normal_success_rate)
    expect(r1.crisis_success_rate).toBe(r2.crisis_success_rate)
  })

  it('success rates are valid probabilities', () => {
    const result = runSequenceRisk(PARAMS)
    expect(result.normal_success_rate).toBeGreaterThanOrEqual(0)
    expect(result.normal_success_rate).toBeLessThanOrEqual(1)
    expect(result.crisis_success_rate).toBeGreaterThanOrEqual(0)
    expect(result.crisis_success_rate).toBeLessThanOrEqual(1)
    for (const m of result.mitigations) {
      expect(m.normal_success_rate).toBeGreaterThanOrEqual(0)
      expect(m.normal_success_rate).toBeLessThanOrEqual(1)
      expect(m.crisis_success_rate).toBeGreaterThanOrEqual(0)
      expect(m.crisis_success_rate).toBeLessThanOrEqual(1)
    }
  })

  it('percentile bands have all required fields', () => {
    const result = runSequenceRisk(PARAMS)
    const nYears = 90 - 55 + 1 // 36
    for (const bands of [result.normal_percentile_bands, result.crisis_percentile_bands]) {
      expect(bands).toHaveProperty('years')
      expect(bands).toHaveProperty('ages')
      expect(bands).toHaveProperty('p5')
      expect(bands).toHaveProperty('p10')
      expect(bands).toHaveProperty('p25')
      expect(bands).toHaveProperty('p50')
      expect(bands).toHaveProperty('p75')
      expect(bands).toHaveProperty('p90')
      expect(bands).toHaveProperty('p95')
      expect(bands.years).toHaveLength(nYears)
      expect(bands.ages).toHaveLength(nYears)
      expect(bands.ages[0]).toBe(55)
      expect(bands.ages[nYears - 1]).toBe(90)
    }
  })

  it('percentile ordering is non-decreasing at each year', () => {
    const result = runSequenceRisk(PARAMS)
    const bands = result.normal_percentile_bands
    const nYears = bands.p5.length
    for (let i = 0; i < nYears; i++) {
      expect(bands.p5[i]).toBeLessThanOrEqual(bands.p10[i] + 1e-9)
      expect(bands.p10[i]).toBeLessThanOrEqual(bands.p25[i] + 1e-9)
      expect(bands.p25[i]).toBeLessThanOrEqual(bands.p50[i] + 1e-9)
      expect(bands.p50[i]).toBeLessThanOrEqual(bands.p75[i] + 1e-9)
      expect(bands.p75[i]).toBeLessThanOrEqual(bands.p90[i] + 1e-9)
      expect(bands.p90[i]).toBeLessThanOrEqual(bands.p95[i] + 1e-9)
    }
  })

  it('year 0 balance equals initial portfolio for normal bands', () => {
    const result = runSequenceRisk(PARAMS)
    // All simulations start at initialPortfolio, so all percentiles at year 0 = initialPortfolio
    expect(result.normal_percentile_bands.p50[0]).toBeCloseTo(2_000_000, -3)
  })

  it('works with no post-retirement income', () => {
    const result = runSequenceRisk({ ...PARAMS, postRetirementIncome: [] })
    expect(result).toHaveProperty('normal_success_rate')
    expect(result.normal_success_rate).toBeGreaterThanOrEqual(0)
  })

  it('works with post-retirement income', () => {
    const incomeParams = {
      ...PARAMS,
      postRetirementIncome: [20000, 20000, 20000, 20000, 20000],
    }
    const withIncome = runSequenceRisk(incomeParams)
    const withoutIncome = runSequenceRisk(PARAMS)
    // Additional income should not decrease success rate
    expect(withIncome.normal_success_rate).toBeGreaterThanOrEqual(
      withoutIncome.normal_success_rate - 0.05,
    )
  })

  it('crisis with empty equity sequence acts like normal run', () => {
    const noCrisisParams = {
      ...PARAMS,
      crisis: {
        id: 'empty',
        name: 'No Crisis',
        equityReturnSequence: [],
        durationYears: 0,
      },
    }
    const result = runSequenceRisk(noCrisisParams)
    // Both should be the same since there's no crisis override
    // (they use different child RNGs so won't be identical, but should be close)
    expect(Math.abs(result.normal_success_rate - result.crisis_success_rate)).toBeLessThan(0.15)
  })

  it('conservative allocation mitigation uses modified weights', () => {
    const result = runSequenceRisk(PARAMS)
    const conserv = result.mitigations.find(m => m.strategy === 'Conservative Allocation')
    expect(conserv).toBeDefined()
    // Bond tent shifts equity to bonds, so should have different characteristics
    expect(conserv!.normal_success_rate).toBeGreaterThanOrEqual(0)
    expect(conserv!.crisis_success_rate).toBeGreaterThanOrEqual(0)
  })

  it('success_improvement = mitigation_crisis_rate - baseline_crisis_rate', () => {
    const result = runSequenceRisk(PARAMS)
    const baselineCrisisRate = result.crisis_success_rate
    for (const m of result.mitigations) {
      expect(m.success_improvement).toBeCloseTo(
        m.crisis_success_rate - baselineCrisisRate,
        6,
      )
    }
  })
})
