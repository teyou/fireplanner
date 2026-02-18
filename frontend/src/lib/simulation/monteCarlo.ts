/**
 * Monte Carlo simulation engine for retirement planning.
 * TypeScript port of backend/app/core/monte_carlo.py.
 *
 * Supports 3 methods: parametric (Cholesky), historical bootstrap, fat-tail (Student-t df=5).
 * Two-phase simulation: accumulation + decumulation.
 *
 * Formulas from FIRE_PLANNER_MASTER_PLAN_v2.md Section 6.
 */

import { SeededRNG } from '@/lib/math/random.ts'
import { choleskyDecomposition, buildCovarianceMatrix, dot } from '@/lib/math/linalg.ts'
import { percentile, studentTQuantile } from '@/lib/math/stats.ts'
import {
  constantDollar,
  vpw,
  guardrails,
  vanguardDynamic,
  capeBased,
  floorCeiling,
} from '@/lib/calculations/withdrawal.ts'
import {
  HISTORICAL_RETURNS,
  ASSET_KEY_TO_COLUMN,
  type HistoricalReturnRow,
} from '@/lib/data/historicalReturnsFull.ts'
import { ASSET_CLASSES } from '@/lib/data/historicalReturns.ts'
import type { PercentileBands, TerminalStats, FailureDistribution } from '@/lib/types.ts'

// ============================================================
// Types
// ============================================================

export interface MonteCarloEngineParams {
  initialPortfolio: number
  allocationWeights: number[]       // 8 weights summing to 1
  expectedReturns: number[]         // 8 nominal returns
  stdDevs: number[]                 // 8 standard deviations
  correlationMatrix: number[][]     // 8x8
  currentAge: number
  retirementAge: number
  lifeExpectancy: number
  annualSavings: number[]           // one per accumulation year
  postRetirementIncome: number[]    // one per decumulation year
  method: 'parametric' | 'bootstrap' | 'fat_tail'
  nSimulations: number
  seed?: number
  withdrawalStrategy: string
  strategyParams: Record<string, number>
  expenseRatio: number
  inflation: number
}

export interface MonteCarloEngineResult {
  success_rate: number
  percentile_bands: PercentileBands
  terminal_stats: TerminalStats
  failure_distribution: FailureDistribution
}

// ============================================================
// Helpers
// ============================================================

/**
 * Resolve the effective initial withdrawal rate from strategy params.
 * Checks swr, initialRate/initial_rate, targetRate/target_rate in priority order.
 */
export function resolveInitialRate(
  strategyParams: Record<string, number>,
  defaultRate: number = 0.04,
): number {
  return (
    strategyParams.swr
    || strategyParams.initialRate
    || strategyParams.initial_rate
    || strategyParams.targetRate
    || strategyParams.target_rate
    || defaultRate
  )
}

// ============================================================
// Return Generation Methods
// ============================================================

/**
 * Generate portfolio returns via Cholesky decomposition of multivariate normal.
 * Returns a 2D array [nSims][nYears] of portfolio-level returns.
 *
 * Exported for reuse by sequence risk engine (Task 5).
 */
export function generateReturnsParametric(
  rng: SeededRNG,
  nSims: number,
  nYears: number,
  weights: number[],
  expectedReturns: number[],
  stdDevs: number[],
  correlationMatrix: number[][],
): number[][] {
  const nAssets = weights.length
  const covMatrix = buildCovarianceMatrix(stdDevs, correlationMatrix)
  const L = choleskyDecomposition(covMatrix)

  // Transpose L to get L^T
  const LT: number[][] = Array.from({ length: nAssets }, (_, i) =>
    Array.from({ length: nAssets }, (_, j) => L[j][i])
  )

  const portfolioReturns: number[][] = Array.from({ length: nSims }, () =>
    new Array(nYears)
  )

  for (let s = 0; s < nSims; s++) {
    for (let y = 0; y < nYears; y++) {
      // Generate standard normal vector Z of length nAssets
      const Z = rng.nextGaussianArray(nAssets)

      // Correlated returns: assetReturns = Z * L^T + expectedReturns
      // Then portfolio return = dot(assetReturns, weights)
      let portReturn = 0
      for (let a = 0; a < nAssets; a++) {
        // assetReturn[a] = sum(Z[k] * LT[k][a]) + expectedReturns[a]
        let assetReturn = expectedReturns[a]
        for (let k = 0; k < nAssets; k++) {
          assetReturn += Z[k] * LT[k][a]
        }
        portReturn += assetReturn * weights[a]
      }
      portfolioReturns[s][y] = portReturn
    }
  }

  return portfolioReturns
}

/**
 * Generate portfolio returns by bootstrap sampling from historical data.
 * Falls back to parametric if insufficient historical data.
 */
function generateReturnsBootstrap(
  rng: SeededRNG,
  nSims: number,
  nYears: number,
  weights: number[],
  expectedReturns: number[],
  stdDevs: number[],
  correlationMatrix: number[][],
): number[][] {
  // Build the historical returns matrix: rows of [asset1, asset2, ...] for complete rows
  const assetKeys = ASSET_CLASSES.map((ac) => ac.key)
  const columnNames = assetKeys.map((key) => ASSET_KEY_TO_COLUMN[key])

  // Filter to rows where all 8 asset classes have data (non-null)
  const completeRows: number[][] = []
  for (const row of HISTORICAL_RETURNS) {
    const vals: number[] = []
    let allPresent = true
    for (const col of columnNames) {
      const v = row[col as keyof HistoricalReturnRow]
      if (v === null || v === undefined || typeof v !== 'number') {
        allPresent = false
        break
      }
      vals.push(v)
    }
    if (allPresent) {
      completeRows.push(vals)
    }
  }

  if (completeRows.length === 0) {
    // Fallback to parametric
    return generateReturnsParametric(
      rng, nSims, nYears, weights, expectedReturns, stdDevs, correlationMatrix,
    )
  }

  const nHistorical = completeRows.length
  const portfolioReturns: number[][] = Array.from({ length: nSims }, () =>
    new Array(nYears)
  )

  for (let s = 0; s < nSims; s++) {
    for (let y = 0; y < nYears; y++) {
      const idx = rng.nextInt(nHistorical)
      const assetReturns = completeRows[idx]
      portfolioReturns[s][y] = dot(assetReturns, weights)
    }
  }

  return portfolioReturns
}

/**
 * Generate portfolio returns using Student-t distribution (df=5) for fat tails.
 * Portfolio-level returns (univariate), not per-asset.
 */
function generateReturnsFatTail(
  rng: SeededRNG,
  nSims: number,
  nYears: number,
  weights: number[],
  expectedReturns: number[],
  stdDevs: number[],
): number[][] {
  // Portfolio-level moments
  const portReturn = dot(weights, expectedReturns)
  // Portfolio variance = w^T * diag(sigma^2) * w (simplified: no correlation in fat-tail)
  let portVar = 0
  for (let i = 0; i < weights.length; i++) {
    portVar += weights[i] * weights[i] * stdDevs[i] * stdDevs[i]
  }
  const portStd = Math.sqrt(portVar)

  // Student-t: variance = df/(df-2), scale to get unit variance
  const df = 5
  const scaleFactor = Math.sqrt(df / (df - 2))

  const portfolioReturns: number[][] = Array.from({ length: nSims }, () =>
    new Array(nYears)
  )

  for (let s = 0; s < nSims; s++) {
    for (let y = 0; y < nYears; y++) {
      // Generate Student-t variate via inverse CDF transform
      const u = rng.next()
      // Clamp u away from 0 and 1 to avoid infinities
      const uClamped = Math.min(Math.max(u, 1e-10), 1 - 1e-10)
      const tVal = studentTQuantile(uClamped, df)
      portfolioReturns[s][y] = portReturn + portStd * tVal / scaleFactor
    }
  }

  return portfolioReturns
}

// ============================================================
// Withdrawal Dispatch
// ============================================================

/**
 * Compute withdrawal amount for a single simulation at a given decumulation year.
 * Dispatches to the appropriate scalar strategy function.
 *
 * Exported for reuse by sequence risk engine (Task 5).
 */
export function computeWithdrawalsForYear(
  strategy: string,
  portfolio: number,
  year: number,
  nYearsDecum: number,
  initialWithdrawal: number,
  prevWithdrawal: number,
  inflation: number,
  strategyParams: Record<string, number>,
  prevYearReturn: number | undefined,
): number {
  switch (strategy) {
    case 'constant_dollar': {
      const swr = strategyParams.swr ?? 0.04
      const iw = initialWithdrawal > 0 ? initialWithdrawal : portfolio * swr
      return constantDollar(portfolio, year, iw, inflation)
    }
    case 'vpw': {
      const remaining = nYearsDecum - year
      return vpw(
        portfolio,
        remaining,
        strategyParams.expectedRealReturn ?? strategyParams.expected_real_return ?? 0.03,
        strategyParams.targetEndValue ?? strategyParams.target_end_value ?? 0,
      )
    }
    case 'guardrails': {
      const pw = year > 0 ? prevWithdrawal : 0
      return guardrails(
        portfolio,
        year,
        initialWithdrawal,
        pw,
        inflation,
        strategyParams.initialRate ?? strategyParams.initial_rate ?? 0.05,
        strategyParams.ceilingTrigger ?? strategyParams.ceiling_trigger ?? 1.20,
        strategyParams.floorTrigger ?? strategyParams.floor_trigger ?? 0.80,
        strategyParams.adjustmentSize ?? strategyParams.adjustment_size ?? 0.10,
        prevYearReturn,
      )
    }
    case 'vanguard_dynamic': {
      const pw = year > 0 ? prevWithdrawal : 0
      return vanguardDynamic(
        portfolio,
        year,
        initialWithdrawal,
        pw,
        inflation,
        strategyParams.swr ?? 0.04,
        strategyParams.ceiling ?? 0.05,
        strategyParams.floor ?? 0.025,
      )
    }
    case 'cape_based': {
      return capeBased(
        portfolio,
        year,
        strategyParams.baseRate ?? strategyParams.base_rate ?? 0.04,
        strategyParams.capeWeight ?? strategyParams.cape_weight ?? 0.50,
        strategyParams.currentCape ?? strategyParams.current_cape ?? 30,
      )
    }
    case 'floor_ceiling': {
      return floorCeiling(
        portfolio,
        strategyParams.floorAmount ?? strategyParams.floor_amount ?? 60_000,
        strategyParams.ceilingAmount ?? strategyParams.ceiling_amount ?? 150_000,
        strategyParams.targetRate ?? strategyParams.target_rate ?? 0.045,
      )
    }
    default:
      throw new Error(`Unknown strategy: ${strategy}`)
  }
}

// ============================================================
// Main Simulation
// ============================================================

/**
 * Run Monte Carlo retirement simulation.
 *
 * Two-phase simulation: accumulation (savings phase) and decumulation (withdrawal phase).
 * Returns success_rate, percentile_bands, terminal_stats, and failure_distribution
 * with snake_case keys matching the MonteCarloResult type.
 *
 * Exported for reuse by the web worker (Task 6) and sequence risk engine (Task 5).
 */
export function runMonteCarlo(params: MonteCarloEngineParams): MonteCarloEngineResult {
  const {
    initialPortfolio,
    allocationWeights: weights,
    expectedReturns,
    stdDevs,
    correlationMatrix,
    currentAge,
    retirementAge,
    lifeExpectancy,
    annualSavings,
    postRetirementIncome,
    method,
    nSimulations: nSims,
    seed,
    withdrawalStrategy: strategy,
    strategyParams,
    expenseRatio,
    inflation,
  } = params

  const rng = new SeededRNG(seed ?? 42)

  const nYearsAccum = Math.max(0, retirementAge - currentAge)
  const nYearsDecum = Math.max(1, lifeExpectancy - retirementAge)
  const nYearsTotal = nYearsAccum + nYearsDecum

  // Generate portfolio returns: [nSims][nYearsTotal]
  let portfolioReturns: number[][]
  switch (method) {
    case 'parametric':
      portfolioReturns = generateReturnsParametric(
        rng, nSims, nYearsTotal, weights, expectedReturns, stdDevs, correlationMatrix,
      )
      break
    case 'bootstrap':
      portfolioReturns = generateReturnsBootstrap(
        rng, nSims, nYearsTotal, weights, expectedReturns, stdDevs, correlationMatrix,
      )
      break
    case 'fat_tail':
      portfolioReturns = generateReturnsFatTail(
        rng, nSims, nYearsTotal, weights, expectedReturns, stdDevs,
      )
      break
    default:
      throw new Error(`Unknown method: ${method}`)
  }

  // Simulate paths: balances[sim][year] — (nYearsTotal + 1) entries per sim
  const balances: number[][] = Array.from({ length: nSims }, () => {
    const arr = new Array(nYearsTotal + 1).fill(0)
    arr[0] = initialPortfolio
    return arr
  })

  const failed: boolean[] = new Array(nSims).fill(false)
  const failureYear: number[] = new Array(nSims).fill(nYearsTotal)
  const prevWithdrawals: number[] = new Array(nSims).fill(0)

  const swr = resolveInitialRate(strategyParams)
  let initialWithdrawalAmount = 0

  for (let t = 0; t < nYearsTotal; t++) {
    if (t < nYearsAccum) {
      // ACCUMULATION: add savings, grow portfolio
      const savings = t < annualSavings.length ? annualSavings[t] : 0
      for (let s = 0; s < nSims; s++) {
        balances[s][t + 1] =
          balances[s][t] * (1 + portfolioReturns[s][t] - expenseRatio) + savings
      }
    } else {
      // DECUMULATION: subtract withdrawals
      const decumYear = t - nYearsAccum

      if (decumYear === 0) {
        // Set initial withdrawal at start of retirement based on median balance
        const retirementBalances = balances.map((b) => b[t])
        const medianBalance = percentile(retirementBalances, 50)
        initialWithdrawalAmount = medianBalance * swr
      }

      for (let s = 0; s < nSims; s++) {
        const currentBalance = balances[s][t]

        // Previous year return for Guyton-Klinger PMR
        const prevYearReturn = decumYear > 0
          ? portfolioReturns[s][t - 1]
          : undefined

        const withdrawal = computeWithdrawalsForYear(
          strategy,
          currentBalance,
          decumYear,
          nYearsDecum,
          initialWithdrawalAmount,
          prevWithdrawals[s],
          inflation,
          strategyParams,
          prevYearReturn,
        )

        // Subtract post-retirement income
        const income = decumYear < postRetirementIncome.length
          ? postRetirementIncome[decumYear]
          : 0
        let netWithdrawal = Math.max(0, withdrawal - income)

        // Don't withdraw more than the portfolio
        netWithdrawal = Math.min(netWithdrawal, currentBalance)

        prevWithdrawals[s] = withdrawal

        balances[s][t + 1] =
          (currentBalance - netWithdrawal) * (1 + portfolioReturns[s][t] - expenseRatio)

        // Check for failure
        if (balances[s][t + 1] <= 0 && !failed[s]) {
          failed[s] = true
          failureYear[s] = decumYear
        }
        // Clamp to 0
        if (balances[s][t + 1] < 0) {
          balances[s][t + 1] = 0
        }
      }
    }
  }

  // ---- Compute outputs ----

  // Success rate
  const nFailed = failed.filter(Boolean).length
  const successRate = 1 - nFailed / nSims

  // Percentile bands — compute percentile across simulations at each time point
  const nPoints = nYearsTotal + 1
  const years: number[] = []
  const ages: number[] = []
  const p5: number[] = []
  const p10: number[] = []
  const p25: number[] = []
  const p50: number[] = []
  const p75: number[] = []
  const p90: number[] = []
  const p95: number[] = []

  for (let y = 0; y < nPoints; y++) {
    years.push(y)
    ages.push(currentAge + y)

    // Collect all sim balances at this year
    const col: number[] = new Array(nSims)
    for (let s = 0; s < nSims; s++) {
      col[s] = balances[s][y]
    }

    p5.push(percentile(col, 5))
    p10.push(percentile(col, 10))
    p25.push(percentile(col, 25))
    p50.push(percentile(col, 50))
    p75.push(percentile(col, 75))
    p90.push(percentile(col, 90))
    p95.push(percentile(col, 95))
  }

  const percentileBands: PercentileBands = {
    years, ages, p5, p10, p25, p50, p75, p90, p95,
  }

  // Terminal stats
  const terminals: number[] = new Array(nSims)
  for (let s = 0; s < nSims; s++) {
    terminals[s] = balances[s][nYearsTotal]
  }
  const sortedTerminals = [...terminals].sort((a, b) => a - b)

  const terminalStats: TerminalStats = {
    median: percentile(terminals, 50),
    mean: terminals.reduce((a, b) => a + b, 0) / nSims,
    worst: sortedTerminals[0],
    best: sortedTerminals[nSims - 1],
    p5: percentile(terminals, 5),
    p95: percentile(terminals, 95),
  }

  // Failure distribution by decade of retirement
  const failedYears: number[] = []
  for (let s = 0; s < nSims; s++) {
    if (failed[s]) {
      failedYears.push(failureYear[s])
    }
  }

  const decades: [number, number][] = [[0, 10], [10, 20], [20, 30], [30, 40], [40, 50]]
  const bucketLabels: string[] = []
  const bucketCounts: number[] = []
  for (const [start, end] of decades) {
    if (start >= nYearsDecum) break
    const label = `Year ${start + 1}-${Math.min(end, nYearsDecum)}`
    let count = 0
    for (const fy of failedYears) {
      if (fy >= start && fy < end) count++
    }
    bucketLabels.push(label)
    bucketCounts.push(count)
  }

  const failureDistribution: FailureDistribution = {
    buckets: bucketLabels,
    counts: bucketCounts,
    total_failures: failedYears.length,
  }

  return {
    success_rate: successRate,
    percentile_bands: percentileBands,
    terminal_stats: terminalStats,
    failure_distribution: failureDistribution,
  }
}
