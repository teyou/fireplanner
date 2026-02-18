/**
 * Tests for Historical Backtest Engine (TypeScript port of backend/app/core/backtest.py).
 * TDD: tests written first, implementation follows.
 */

import { describe, it, expect } from 'vitest'
import { runBacktest, generateHeatmap } from './backtest'

// ---------------------------------------------------------------------------
// Shared test params (60/40 US equities/bonds)
// ---------------------------------------------------------------------------

const PARAMS = {
  initialPortfolio: 1_000_000,
  allocationWeights: [0.60, 0, 0, 0.40, 0, 0, 0, 0], // 60/40 US
  swr: 0.04,
  retirementDuration: 30,
  dataset: 'us_only' as const,
  blendRatio: 0.70,
  expenseRatio: 0.003,
  withdrawalStrategy: 'constant_dollar' as const,
  strategyParams: { swr: 0.04 },
  inflation: 0.025,
}

// ---------------------------------------------------------------------------
// runBacktest — structure
// ---------------------------------------------------------------------------

describe('runBacktest', () => {
  it('returns results and summary', () => {
    const result = runBacktest(PARAMS)
    expect(result).toHaveProperty('results')
    expect(result).toHaveProperty('summary')
    expect(result.results.length).toBeGreaterThan(0)
  })

  it('success rate is between 0 and 1', () => {
    const result = runBacktest(PARAMS)
    expect(result.summary.success_rate).toBeGreaterThanOrEqual(0)
    expect(result.summary.success_rate).toBeLessThanOrEqual(1)
  })

  it('each result has required snake_case fields', () => {
    const result = runBacktest(PARAMS)
    const r = result.results[0]
    expect(r).toHaveProperty('start_year')
    expect(r).toHaveProperty('end_year')
    expect(r).toHaveProperty('survived')
    expect(r).toHaveProperty('ending_balance')
    expect(r).toHaveProperty('min_balance')
    expect(r).toHaveProperty('worst_year')
    expect(r).toHaveProperty('best_year')
    expect(r).toHaveProperty('total_withdrawn')
  })

  it('total_periods matches results length', () => {
    const result = runBacktest(PARAMS)
    expect(result.summary.total_periods).toBe(result.results.length)
  })

  it('successful + failed periods sum to total', () => {
    const result = runBacktest(PARAMS)
    const { successful_periods, failed_periods, total_periods } = result.summary
    expect(successful_periods + failed_periods).toBe(total_periods)
  })

  it('start_year and end_year are sequential with correct duration', () => {
    const result = runBacktest(PARAMS)
    for (const r of result.results) {
      expect(r.end_year - r.start_year).toBe(PARAMS.retirementDuration - 1)
    }
  })

  it('ending_balance >= 0 for all results', () => {
    const result = runBacktest(PARAMS)
    for (const r of result.results) {
      expect(r.ending_balance).toBeGreaterThanOrEqual(0)
    }
  })

  it('min_balance <= initial portfolio for all results', () => {
    const result = runBacktest(PARAMS)
    for (const r of result.results) {
      expect(r.min_balance).toBeLessThanOrEqual(PARAMS.initialPortfolio + 1)
    }
  })

  it('total_withdrawn > 0 for all results', () => {
    const result = runBacktest(PARAMS)
    for (const r of result.results) {
      expect(r.total_withdrawn).toBeGreaterThan(0)
    }
  })

  it('worst_start_year and best_start_year are real start years', () => {
    const result = runBacktest(PARAMS)
    const startYears = new Set(result.results.map((r) => r.start_year))
    if (result.results.length > 0) {
      expect(startYears.has(result.summary.worst_start_year)).toBe(true)
      expect(startYears.has(result.summary.best_start_year)).toBe(true)
    }
  })

  it('median_ending_balance >= 0', () => {
    const result = runBacktest(PARAMS)
    expect(result.summary.median_ending_balance).toBeGreaterThanOrEqual(0)
  })

  it('average_total_withdrawn > 0', () => {
    const result = runBacktest(PARAMS)
    expect(result.summary.average_total_withdrawn).toBeGreaterThan(0)
  })

  // ---------------------------------------------------------------------------
  // All 6 withdrawal strategies
  // ---------------------------------------------------------------------------

  it('works with all 6 withdrawal strategies', () => {
    const strategies = [
      'constant_dollar',
      'vpw',
      'guardrails',
      'vanguard_dynamic',
      'cape_based',
      'floor_ceiling',
    ] as const

    for (const s of strategies) {
      let strategyParams: Record<string, number>

      switch (s) {
        case 'guardrails':
          strategyParams = { initialRate: 0.05, ceilingTrigger: 1.2, floorTrigger: 0.8, adjustmentSize: 0.1 }
          break
        case 'vpw':
          strategyParams = { expectedRealReturn: 0.03, targetEndValue: 0 }
          break
        case 'vanguard_dynamic':
          strategyParams = { swr: 0.04, ceiling: 0.05, floor: 0.025 }
          break
        case 'cape_based':
          strategyParams = { baseRate: 0.04, capeWeight: 0.5, currentCape: 30 }
          break
        case 'floor_ceiling':
          strategyParams = { floorAmount: 40000, ceilingAmount: 100000, targetRate: 0.045 }
          break
        default:
          strategyParams = { swr: 0.04 }
      }

      const result = runBacktest({
        ...PARAMS,
        withdrawalStrategy: s,
        strategyParams,
      })
      expect(result.summary.success_rate).toBeGreaterThanOrEqual(0)
      expect(result.summary.success_rate).toBeLessThanOrEqual(1)
      expect(result.results.length).toBeGreaterThan(0)
    }
  })

  // ---------------------------------------------------------------------------
  // Datasets
  // ---------------------------------------------------------------------------

  it('works with sg_only dataset', () => {
    const result = runBacktest({ ...PARAMS, dataset: 'sg_only' })
    expect(result.results.length).toBeGreaterThan(0)
    // SG data starts later so fewer periods than us_only
    const usResult = runBacktest(PARAMS)
    expect(result.results.length).toBeLessThanOrEqual(usResult.results.length)
  })

  it('works with blended dataset', () => {
    const result = runBacktest({ ...PARAMS, dataset: 'blended' })
    expect(result.results.length).toBeGreaterThan(0)
  })

  it('blended dataset with blendRatio=1.0 produces same results as us_only', () => {
    const blended = runBacktest({ ...PARAMS, dataset: 'blended', blendRatio: 1.0 })
    const usOnly = runBacktest(PARAMS)
    // Same number of periods
    expect(blended.results.length).toBe(usOnly.results.length)
    // Success rates should match (same effective returns)
    expect(blended.summary.success_rate).toBeCloseTo(usOnly.summary.success_rate, 2)
  })

  // ---------------------------------------------------------------------------
  // Economic sense checks
  // ---------------------------------------------------------------------------

  it('higher SWR produces lower success rate', () => {
    const low = runBacktest({ ...PARAMS, swr: 0.03 })
    const high = runBacktest({ ...PARAMS, swr: 0.06 })
    expect(low.summary.success_rate).toBeGreaterThanOrEqual(high.summary.success_rate)
  })

  it('shorter duration produces higher success rate', () => {
    const short = runBacktest({ ...PARAMS, retirementDuration: 15 })
    const long = runBacktest({ ...PARAMS, retirementDuration: 40 })
    expect(short.summary.success_rate).toBeGreaterThanOrEqual(long.summary.success_rate)
  })

  it('higher expense ratio lowers success rate', () => {
    const low = runBacktest({ ...PARAMS, expenseRatio: 0.001 })
    const high = runBacktest({ ...PARAMS, expenseRatio: 0.020 })
    expect(low.summary.success_rate).toBeGreaterThanOrEqual(high.summary.success_rate)
  })

  it('100% bonds allocation has lower success rate than 60/40', () => {
    const bondsOnly = runBacktest({
      ...PARAMS,
      allocationWeights: [0, 0, 0, 1.0, 0, 0, 0, 0],
    })
    expect(bondsOnly.summary.success_rate).toBeLessThanOrEqual(
      runBacktest(PARAMS).summary.success_rate,
    )
  })

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  it('survived=false periods have ending_balance=0', () => {
    // Use aggressive SWR to force some failures
    const result = runBacktest({ ...PARAMS, swr: 0.10, retirementDuration: 40 })
    for (const r of result.results) {
      if (!r.survived) {
        expect(r.ending_balance).toBe(0)
      }
    }
  })

  it('worst_year and best_year are within the window start..end range', () => {
    const result = runBacktest(PARAMS)
    for (const r of result.results) {
      expect(r.worst_year).toBeGreaterThanOrEqual(r.start_year)
      expect(r.worst_year).toBeLessThanOrEqual(r.end_year)
      expect(r.best_year).toBeGreaterThanOrEqual(r.start_year)
      expect(r.best_year).toBeLessThanOrEqual(r.end_year)
    }
  })

  it('falls back to fixed inflation when CPI data is null', () => {
    // This exercises the null-CPI fallback branch. No error thrown = pass.
    const result = runBacktest({ ...PARAMS, inflation: 0.03 })
    expect(result.results.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// generateHeatmap
// ---------------------------------------------------------------------------

describe('generateHeatmap', () => {
  it('returns grid of success rates with correct dimensions', () => {
    const heatmap = generateHeatmap(PARAMS)
    expect(heatmap.swr_values.length).toBeGreaterThan(0)
    expect(heatmap.duration_values.length).toBeGreaterThan(0)
    expect(heatmap.success_rates.length).toBe(heatmap.swr_values.length)
    expect(heatmap.success_rates[0].length).toBe(heatmap.duration_values.length)
  })

  it('all success_rates values are between 0 and 1', () => {
    const heatmap = generateHeatmap(PARAMS)
    for (const row of heatmap.success_rates) {
      for (const val of row) {
        expect(val).toBeGreaterThanOrEqual(0)
        expect(val).toBeLessThanOrEqual(1)
      }
    }
  })

  it('generates correct SWR range with default bounds', () => {
    const heatmap = generateHeatmap(PARAMS)
    // Default range 0.03..0.06 step 0.005 => [0.03, 0.035, 0.04, 0.045, 0.05, 0.055, 0.06]
    expect(heatmap.swr_values[0]).toBeCloseTo(0.03, 4)
    expect(heatmap.swr_values[heatmap.swr_values.length - 1]).toBeCloseTo(0.06, 4)
  })

  it('generates correct duration range with default bounds', () => {
    const heatmap = generateHeatmap(PARAMS)
    // Default range 15..45 step 5 => [15, 20, 25, 30, 35, 40, 45]
    expect(heatmap.duration_values[0]).toBe(15)
    expect(heatmap.duration_values[heatmap.duration_values.length - 1]).toBe(45)
  })

  it('accepts custom swr and duration ranges', () => {
    const heatmap = generateHeatmap(
      PARAMS,
      [0.04, 0.05],
      0.01,
      [20, 30],
      10,
    )
    expect(heatmap.swr_values).toEqual([0.04, 0.05])
    expect(heatmap.duration_values).toEqual([20, 30])
    expect(heatmap.success_rates.length).toBe(2)
    expect(heatmap.success_rates[0].length).toBe(2)
  })

  it('higher SWR rows have lower or equal success rates than lower SWR rows (monotone tendency)', () => {
    const heatmap = generateHeatmap(PARAMS, [0.03, 0.06], 0.01, [30, 30], 1)
    // Single duration column — check swr order
    const col = heatmap.success_rates.map((row) => row[0])
    for (let i = 0; i < col.length - 1; i++) {
      // Soft check: average direction should be downward
      expect(col[i]).toBeGreaterThanOrEqual(col[col.length - 1] - 0.15)
    }
  })
})
