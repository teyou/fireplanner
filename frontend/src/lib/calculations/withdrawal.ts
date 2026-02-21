/**
 * 6 withdrawal strategies — deterministic client-side implementation.
 * Must produce identical outputs to backend/app/core/withdrawal_strategies.py
 * for identical inputs. Parity enforced via shared test vectors.
 *
 * Formulas from FIRE_PLANNER_MASTER_PLAN_v2.md Section 7.
 */

// ============================================================
// Strategy 1: Constant Dollar (4% Rule)
// ============================================================

export function constantDollar(
  _portfolio: number,
  year: number,
  initialWithdrawal: number,
  inflation: number,
): number {
  return initialWithdrawal * (1 + inflation) ** year
}

// ============================================================
// Strategy 2: Variable Percentage Withdrawal (VPW)
// ============================================================

export function vpw(
  portfolio: number,
  remainingYears: number,
  expectedRealReturn: number = 0.03,
  targetEndValue: number = 0,
): number {
  if (remainingYears <= 0) return portfolio

  const r = expectedRealReturn
  const n = remainingYears

  if (Math.abs(r) < 1e-10) {
    const rate = targetEndValue === 0 ? 1 / n : Math.max(0, (1 - targetEndValue) / n)
    return portfolio * rate
  }

  const pvFactor = (1 + r) ** (-n)
  const rate = Math.max(0, (r * (1 - targetEndValue * pvFactor)) / (1 - pvFactor))
  return portfolio * rate
}

// ============================================================
// Strategy 3: Guardrails (Guyton-Klinger)
// ============================================================

export function guardrails(
  portfolio: number,
  year: number,
  initialWithdrawal: number,
  prevWithdrawal: number,
  inflation: number,
  initialRate: number = 0.05,
  ceilingTrigger: number = 1.20,
  floorTrigger: number = 0.80,
  adjustmentSize: number = 0.10,
  prevYearReturn?: number,
): number {
  if (year === 0) return initialWithdrawal

  // PMR: skip inflation adjustment if prior year return was negative
  const base = (prevYearReturn !== undefined && prevYearReturn < 0)
    ? prevWithdrawal
    : prevWithdrawal * (1 + inflation)

  const safePortfolio = Math.max(portfolio, 1)
  const currentRate = base / safePortfolio

  const ceiling = initialRate * ceilingTrigger
  const floor = initialRate * floorTrigger

  if (currentRate > ceiling) {
    return base * (1 - adjustmentSize)
  } else if (currentRate < floor) {
    return base * (1 + adjustmentSize)
  }
  return base
}

// ============================================================
// Strategy 4: Vanguard Dynamic Spending
// ============================================================

export function vanguardDynamic(
  portfolio: number,
  year: number,
  initialWithdrawal: number,
  prevWithdrawal: number,
  inflation: number,
  swr: number = 0.04,
  ceiling: number = 0.05,
  floor: number = 0.025,
): number {
  if (year === 0) return initialWithdrawal

  const target = portfolio * swr
  const inflationAdjusted = prevWithdrawal * (1 + inflation)
  const ceilingLimit = inflationAdjusted * (1 + ceiling)
  const floorLimit = inflationAdjusted * (1 - floor)

  if (target > ceilingLimit) return ceilingLimit
  if (target < floorLimit) return floorLimit
  return target
}

// ============================================================
// Strategy 5: CAPE-Based
// ============================================================

export function capeBased(
  portfolio: number,
  year: number,
  baseRate: number = 0.04,
  capeWeight: number = 0.50,
  currentCape: number = 30,
): number {
  const longTermCape = 17
  const cape = year < 10
    ? currentCape + (longTermCape - currentCape) * (year / 10)
    : longTermCape

  const capeRate = 1 / cape
  const blendedRate = capeWeight * capeRate + (1 - capeWeight) * baseRate
  return portfolio * blendedRate
}

// ============================================================
// Strategy 6: Floor-and-Ceiling
// ============================================================

export function floorCeiling(
  portfolio: number,
  floorAmount: number = 60000,
  ceilingAmount: number = 150000,
  targetRate: number = 0.045,
): number {
  const target = portfolio * targetRate
  return Math.max(floorAmount, Math.min(ceilingAmount, target))
}

// ============================================================
// Shared Withdrawal Dispatch
// ============================================================

/**
 * Context object for the shared withdrawal dispatch.
 * All 3 call sites (deterministic, MC, backtest) build this from their
 * local state and delegate to `computeWithdrawal`.
 */
export interface WithdrawalContext {
  portfolio: number
  year: number               // decumulation year (0-based)
  remainingYears: number     // duration - year
  initialWithdrawal: number  // portfolio * swr at start of decumulation
  prevWithdrawal: number     // 0 at year 0
  inflation: number
  strategyParams: Record<string, number>
  prevYearReturn?: number    // for Guardrails PMR rule
  prevYearGains?: number     // for sensible_withdrawals (added in sub-task 1)
}

/**
 * Single shared dispatch for all withdrawal strategies.
 * Replaces 3 duplicate switch blocks (withdrawal.ts, monteCarlo.ts, backtest.ts).
 *
 * Uses camelCase param keys. The `floor_ceiling` strategy supports both
 * `floorAmount`/`ceilingAmount` (from workerClient flattening) and
 * `floor`/`ceiling` (raw store params) via fallback.
 */
export function computeWithdrawal(strategy: string, ctx: WithdrawalContext): number {
  const {
    portfolio, year, remainingYears, initialWithdrawal, prevWithdrawal,
    inflation, strategyParams: sp, prevYearReturn,
  } = ctx

  switch (strategy) {
    case 'constant_dollar': {
      const swr = sp.swr ?? 0.04
      const iw = initialWithdrawal > 0 ? initialWithdrawal : portfolio * swr
      return constantDollar(portfolio, year, iw, inflation)
    }
    case 'vpw':
      return vpw(
        portfolio,
        remainingYears,
        sp.expectedRealReturn ?? 0.03,
        sp.targetEndValue ?? 0,
      )
    case 'guardrails': {
      const pw = year > 0 ? prevWithdrawal : 0
      return guardrails(
        portfolio, year, initialWithdrawal, pw, inflation,
        sp.initialRate ?? 0.05,
        sp.ceilingTrigger ?? 1.20,
        sp.floorTrigger ?? 0.80,
        sp.adjustmentSize ?? 0.10,
        prevYearReturn,
      )
    }
    case 'vanguard_dynamic': {
      const pw = year > 0 ? prevWithdrawal : 0
      return vanguardDynamic(
        portfolio, year, initialWithdrawal, pw, inflation,
        sp.swr ?? 0.04,
        sp.ceiling ?? 0.05,
        sp.floor ?? 0.025,
      )
    }
    case 'cape_based':
      return capeBased(
        portfolio, year,
        sp.baseRate ?? 0.04,
        sp.capeWeight ?? 0.50,
        sp.currentCape ?? 30,
      )
    case 'floor_ceiling':
      return floorCeiling(
        portfolio,
        sp.floorAmount ?? sp.floor ?? 60_000,
        sp.ceilingAmount ?? sp.ceiling ?? 150_000,
        sp.targetRate ?? 0.045,
      )
    default:
      throw new Error(`Unknown withdrawal strategy: ${strategy}`)
  }
}

// ============================================================
// Deterministic Comparison (single median-return path)
// ============================================================

export interface WithdrawalYearResult {
  year: number
  age: number
  portfolio: number
  withdrawal: number
}

export interface WithdrawalSummary {
  strategyName: string
  avgWithdrawal: number
  minWithdrawal: number
  maxWithdrawal: number
  stdDevWithdrawal: number
  terminalPortfolio: number
  survived: boolean
}

export interface DeterministicComparisonResult {
  yearResults: Record<string, WithdrawalYearResult[]>
  summaries: Record<string, WithdrawalSummary>
}

export function runDeterministicComparison(params: {
  initialPortfolio: number
  retirementAge: number
  lifeExpectancy: number
  expectedReturn: number
  inflation: number
  expenseRatio: number
  swr: number
  strategies: string[]
  strategyParams: Record<string, Record<string, number>>
}): DeterministicComparisonResult {
  const {
    initialPortfolio, retirementAge, lifeExpectancy,
    expectedReturn, inflation, expenseRatio, swr,
    strategies, strategyParams,
  } = params

  const duration = lifeExpectancy - retirementAge
  const netReturn = expectedReturn - expenseRatio
  const yearResults: Record<string, WithdrawalYearResult[]> = {}
  const summaries: Record<string, WithdrawalSummary> = {}

  for (const strategy of strategies) {
    const years: WithdrawalYearResult[] = []
    let portfolio = initialPortfolio
    let prevWithdrawal = 0
    const sp = strategyParams[strategy] ?? {}
    const initialW = initialPortfolio * (sp.swr ?? sp.initialRate ?? sp.targetRate ?? swr)
    let survived = true

    for (let y = 0; y < duration; y++) {
      if (portfolio <= 0) {
        survived = false
        years.push({ year: y, age: retirementAge + y, portfolio: 0, withdrawal: 0 })
        continue
      }

      const remaining = duration - y

      let withdrawal = computeWithdrawal(strategy, {
        portfolio,
        year: y,
        remainingYears: remaining,
        initialWithdrawal: initialW,
        prevWithdrawal,
        inflation,
        strategyParams: sp,
      })

      withdrawal = Math.min(withdrawal, portfolio)
      years.push({ year: y, age: retirementAge + y, portfolio, withdrawal })
      prevWithdrawal = withdrawal
      portfolio = (portfolio - withdrawal) * (1 + netReturn)
    }

    yearResults[strategy] = years

    const withdrawals = years.map((r) => r.withdrawal).filter((w) => w > 0)
    const avg = withdrawals.length > 0 ? withdrawals.reduce((a, b) => a + b, 0) / withdrawals.length : 0
    const variance = withdrawals.length > 0
      ? withdrawals.reduce((a, w) => a + (w - avg) ** 2, 0) / withdrawals.length
      : 0

    summaries[strategy] = {
      strategyName: strategy,
      avgWithdrawal: avg,
      minWithdrawal: withdrawals.length > 0 ? Math.min(...withdrawals) : 0,
      maxWithdrawal: withdrawals.length > 0 ? Math.max(...withdrawals) : 0,
      stdDevWithdrawal: Math.sqrt(variance),
      terminalPortfolio: Math.max(0, portfolio),
      survived,
    }
  }

  return { yearResults, summaries }
}
