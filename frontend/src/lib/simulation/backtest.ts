/**
 * Historical Backtesting Engine.
 * TypeScript port of backend/app/core/backtest.py.
 *
 * Bengen-style rolling window analysis over every possible start year.
 * Uses the embedded historical return data from historicalReturnsFull.ts.
 *
 * Supports 3 dataset modes: us_only, sg_only, blended.
 * All 6 withdrawal strategies are dispatched directly (no coupling to MC internals).
 */

import {
  HISTORICAL_RETURNS,
  type HistoricalReturnRow,
} from '@/lib/data/historicalReturnsFull.ts'
import {
  constantDollar,
  vpw,
  guardrails,
  vanguardDynamic,
  capeBased,
  floorCeiling,
} from '@/lib/calculations/withdrawal.ts'
import type { PerYearResult, BacktestSummary, HeatmapData } from '@/lib/types.ts'

// ============================================================
// Types
// ============================================================

export interface BacktestEngineParams {
  initialPortfolio: number
  allocationWeights: number[]        // 8 weights in asset class order
  swr: number
  retirementDuration: number
  dataset: 'us_only' | 'sg_only' | 'blended'
  blendRatio: number                 // weight on US side when dataset='blended'
  expenseRatio: number
  withdrawalStrategy: string
  strategyParams: Record<string, number>
  inflation: number
}

export interface BacktestEngineResult {
  results: PerYearResult[]
  summary: BacktestSummary
}

// ============================================================
// Asset column order
// The 8 weights correspond to the columns in this exact order,
// mirroring COLUMNS_ORDER in the Python backtest.py:
//   [usEquities, sgEquities, intlEquities, usBonds, reits, gold, cash, cpfBlended]
// ============================================================

type ReturnColumn = keyof Pick<
  HistoricalReturnRow,
  'usEquities' | 'sgEquities' | 'intlEquities' | 'usBonds' | 'reits' | 'gold' | 'cash' | 'cpfBlended'
>

const ASSET_COLUMNS: ReturnColumn[] = [
  'usEquities',
  'sgEquities',
  'intlEquities',
  'usBonds',
  'reits',
  'gold',
  'cash',
  'cpfBlended',
]

// ============================================================
// Portfolio return computation
// ============================================================

/**
 * Compute annual portfolio returns for each historical year, applying
 * allocation weights and dataset-mode adjustments.
 *
 * Returns a tuple [portfolioReturns, inflationRates] aligned by row index.
 * portfolioReturns[i] = weighted sum of asset returns for HISTORICAL_RETURNS[i].
 * inflationRates[i]   = CPI for that year (null when unavailable).
 */
function getPortfolioReturns(
  weights: number[],
  dataset: BacktestEngineParams['dataset'],
  blendRatio: number,
): { portfolioReturns: number[]; inflationRates: (number | null)[]; years: number[] } {
  const portfolioReturns: number[] = []
  const inflationRates: (number | null)[] = []
  const years: number[] = []

  for (const row of HISTORICAL_RETURNS) {
    // Collect the 8 raw returns (default null → 0 for computation purposes)
    const raw: number[] = ASSET_COLUMNS.map((col) => {
      const v = row[col]
      return v !== null ? v : 0
    })

    // Apply dataset-mode adjustments (matching Python _get_portfolio_returns)
    let returns = [...raw]

    if (dataset === 'sg_only') {
      // Replace US Eq (idx 0) and Intl Eq (idx 2) with SG Eq (idx 1)
      returns[0] = raw[1] // US Eq → SG Eq
      returns[2] = raw[1] // Intl Eq → SG Eq
    } else if (dataset === 'blended') {
      const blended = blendRatio * raw[0] + (1 - blendRatio) * raw[1]
      returns[0] = blended // US Eq slot → blended
      returns[2] = blended // Intl Eq slot → blended
    }
    // 'us_only' uses returns as-is

    // Portfolio return = dot(weights, returns)
    let portReturn = 0
    for (let i = 0; i < 8; i++) {
      portReturn += weights[i] * returns[i]
    }

    portfolioReturns.push(portReturn)

    // Pick CPI series: SG for sg_only, US otherwise
    const cpi = dataset === 'sg_only' ? row.sgCpi : row.usCpi
    inflationRates.push(cpi)
    years.push(row.year)
  }

  return { portfolioReturns, inflationRates, years }
}

// ============================================================
// Withdrawal dispatch
// ============================================================

/**
 * Compute the withdrawal for a single year in a backtest window.
 * Mirrors the Python _run_single_window dispatch.
 */
function computeWithdrawal(
  strategy: string,
  strategyParams: Record<string, number>,
  portfolio: number,
  year: number,
  remaining: number,
  initialWithdrawal: number,
  prevWithdrawal: number,
  inflation: number,
): number {
  switch (strategy) {
    case 'constant_dollar':
      return constantDollar(portfolio, year, initialWithdrawal, inflation)

    case 'vpw':
      return vpw(
        portfolio,
        remaining,
        strategyParams.expectedRealReturn ?? 0.03,
        strategyParams.targetEndValue ?? 0,
      )

    case 'guardrails':
      return guardrails(
        portfolio,
        year,
        initialWithdrawal,
        prevWithdrawal,
        inflation,
        strategyParams.initialRate ?? 0.05,
        strategyParams.ceilingTrigger ?? 1.20,
        strategyParams.floorTrigger ?? 0.80,
        strategyParams.adjustmentSize ?? 0.10,
      )

    case 'vanguard_dynamic':
      return vanguardDynamic(
        portfolio,
        year,
        initialWithdrawal,
        prevWithdrawal,
        inflation,
        strategyParams.swr ?? 0.04,
        strategyParams.ceiling ?? 0.05,
        strategyParams.floor ?? 0.025,
      )

    case 'cape_based':
      return capeBased(
        portfolio,
        year,
        strategyParams.baseRate ?? 0.04,
        strategyParams.capeWeight ?? 0.50,
        strategyParams.currentCape ?? 30,
      )

    case 'floor_ceiling':
      return floorCeiling(
        portfolio,
        strategyParams.floorAmount ?? 60000,
        strategyParams.ceilingAmount ?? 150000,
        strategyParams.targetRate ?? 0.045,
      )

    default:
      // Fallback to constant dollar
      return constantDollar(portfolio, year, initialWithdrawal, inflation)
  }
}

// ============================================================
// Single rolling window
// ============================================================

interface WindowResult {
  survived: boolean
  endingBalance: number
  minBalance: number
  worstYearOffset: number
  bestYearOffset: number
  totalWithdrawn: number
}

function runSingleWindow(
  portfolioReturns: number[],
  inflationRates: (number | null)[],
  startIdx: number,
  duration: number,
  initialPortfolio: number,
  swr: number,
  expenseRatio: number,
  inflationFixed: number,
  strategy: string,
  strategyParams: Record<string, number>,
): WindowResult {
  let portfolio = initialPortfolio
  const initialWithdrawal = initialPortfolio * swr
  let prevWithdrawal = 0
  let totalWithdrawn = 0
  let minBalance = initialPortfolio
  let worstYearOffset = 0
  let bestYearOffset = 0
  let bestBalance = initialPortfolio
  let survived = true

  for (let y = 0; y < duration; y++) {
    const idx = startIdx + y
    if (idx >= portfolioReturns.length) break

    if (portfolio <= 0) {
      survived = false
      break
    }

    const ret = portfolioReturns[idx]
    const rawCpi = inflationRates[idx]
    const inf = rawCpi !== null ? rawCpi : inflationFixed
    const remaining = duration - y

    let withdrawal = computeWithdrawal(
      strategy,
      strategyParams,
      portfolio,
      y,
      remaining,
      initialWithdrawal,
      prevWithdrawal,
      inf,
    )

    // Cap withdrawal at current portfolio value
    withdrawal = Math.min(withdrawal, portfolio)
    totalWithdrawn += withdrawal
    prevWithdrawal = withdrawal

    portfolio = (portfolio - withdrawal) * (1 + ret - expenseRatio)

    if (portfolio < minBalance) {
      minBalance = portfolio
      worstYearOffset = y
    }
    if (portfolio > bestBalance) {
      bestBalance = portfolio
      bestYearOffset = y
    }

    if (portfolio <= 0) {
      survived = false
      portfolio = 0
      break
    }
  }

  return {
    survived,
    endingBalance: Math.max(0, portfolio),
    minBalance: Math.max(0, minBalance),
    worstYearOffset,
    bestYearOffset,
    totalWithdrawn,
  }
}

// ============================================================
// Median helper (avoids dependency on stats module)
// ============================================================

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

// ============================================================
// Main backtest function
// ============================================================

/**
 * Run Bengen-style rolling window backtest over all available historical start years.
 *
 * For each start year, simulates a `retirementDuration`-year window using
 * actual historical returns and inflation. Returns per-period results and
 * aggregate summary statistics.
 */
export function runBacktest(params: BacktestEngineParams): BacktestEngineResult {
  const {
    initialPortfolio,
    allocationWeights,
    swr,
    retirementDuration,
    dataset,
    blendRatio,
    expenseRatio,
    inflation: inflationFixed,
    withdrawalStrategy,
    strategyParams,
  } = params

  const { portfolioReturns, inflationRates, years } = getPortfolioReturns(
    allocationWeights,
    dataset,
    blendRatio,
  )

  const results: PerYearResult[] = []
  const nTotal = portfolioReturns.length - retirementDuration + 1

  for (let i = 0; i < Math.max(1, nTotal); i++) {
    if (i >= years.length) break

    const startYear = years[i]
    const endYear = startYear + retirementDuration - 1

    const w = runSingleWindow(
      portfolioReturns,
      inflationRates,
      i,
      retirementDuration,
      initialPortfolio,
      swr,
      expenseRatio,
      inflationFixed,
      withdrawalStrategy,
      strategyParams,
    )

    results.push({
      start_year: startYear,
      end_year: endYear,
      survived: w.survived,
      ending_balance: w.endingBalance,
      min_balance: w.minBalance,
      worst_year: startYear + w.worstYearOffset,
      best_year: startYear + w.bestYearOffset,
      total_withdrawn: w.totalWithdrawn,
    })
  }

  // Summary statistics
  const successful = results.filter((r) => r.survived).length
  const failed = results.length - successful
  const successRate = results.length > 0 ? successful / results.length : 0

  const endingBalances = results.map((r) => r.ending_balance)
  const totalWithdrawals = results.map((r) => r.total_withdrawn)

  const worstStart = results.length > 0
    ? results.reduce((acc, r) => (r.ending_balance < acc.ending_balance ? r : acc)).start_year
    : 0
  const bestStart = results.length > 0
    ? results.reduce((acc, r) => (r.ending_balance > acc.ending_balance ? r : acc)).start_year
    : 0

  const avgWithdrawn = totalWithdrawals.length > 0
    ? totalWithdrawals.reduce((a, b) => a + b, 0) / totalWithdrawals.length
    : 0

  const summary: BacktestSummary = {
    total_periods: results.length,
    successful_periods: successful,
    failed_periods: failed,
    success_rate: successRate,
    worst_start_year: worstStart,
    best_start_year: bestStart,
    median_ending_balance: median(endingBalances),
    average_total_withdrawn: avgWithdrawn,
  }

  return { results, summary }
}

// ============================================================
// Heatmap generation
// ============================================================

/**
 * Generate a success-rate heatmap over a grid of SWR values × retirement durations.
 *
 * Runs `runBacktest` for each (swr, duration) combination.
 * Rows = SWR values; columns = duration values.
 */
export function generateHeatmap(
  params: BacktestEngineParams,
  swrRange: [number, number] = [0.03, 0.06],
  swrStep: number = 0.005,
  durationRange: [number, number] = [15, 45],
  durationStep: number = 5,
): HeatmapData {
  // Build SWR values array
  const swrValues: number[] = []
  let s = swrRange[0]
  while (s <= swrRange[1] + 1e-9) {
    swrValues.push(Math.round(s * 10000) / 10000)
    s += swrStep
  }

  // Build duration values array
  const durationValues: number[] = []
  for (let d = durationRange[0]; d <= durationRange[1]; d += durationStep) {
    durationValues.push(d)
  }

  // Compute success rates grid
  const successRates: number[][] = swrValues.map((swr) =>
    durationValues.map((duration) => {
      const result = runBacktest({
        ...params,
        swr,
        retirementDuration: duration,
      })
      return result.summary.success_rate
    }),
  )

  return {
    swr_values: swrValues,
    duration_values: durationValues,
    success_rates: successRates,
  }
}
