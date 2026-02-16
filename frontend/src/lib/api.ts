import type { MonteCarloParams, MonteCarloResult } from '@/lib/types'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => 'Unknown error')
    throw new ApiError(response.status, text)
  }

  return response.json()
}

/** Convert camelCase MonteCarloParams to snake_case for the API */
function toMcRequest(params: MonteCarloParams): Record<string, unknown> {
  const strategy = params.withdrawalStrategy

  // Convert strategy params to snake_case
  const strategyParamsSnake: Record<string, Record<string, unknown>> = {
    constant_dollar: { swr: params.strategyParams.constant_dollar.swr },
    vpw: {
      expected_real_return: params.strategyParams.vpw.expectedRealReturn,
      target_end_value: params.strategyParams.vpw.targetEndValue,
    },
    guardrails: {
      initial_rate: params.strategyParams.guardrails.initialRate,
      ceiling_trigger: params.strategyParams.guardrails.ceilingTrigger,
      floor_trigger: params.strategyParams.guardrails.floorTrigger,
      adjustment_size: params.strategyParams.guardrails.adjustmentSize,
    },
    vanguard_dynamic: {
      swr: params.strategyParams.vanguard_dynamic.swr,
      ceiling: params.strategyParams.vanguard_dynamic.ceiling,
      floor: params.strategyParams.vanguard_dynamic.floor,
    },
    cape_based: {
      base_rate: params.strategyParams.cape_based.baseRate,
      cape_weight: params.strategyParams.cape_based.capeWeight,
      current_cape: params.strategyParams.cape_based.currentCape,
    },
    floor_ceiling: {
      floor: params.strategyParams.floor_ceiling.floor,
      ceiling: params.strategyParams.floor_ceiling.ceiling,
      target_rate: params.strategyParams.floor_ceiling.targetRate,
    },
  }

  return {
    initial_portfolio: params.initialPortfolio,
    allocation_weights: params.allocationWeights,
    expected_returns: params.expectedReturns,
    std_devs: params.stdDevs,
    correlation_matrix: params.correlationMatrix,
    current_age: params.currentAge,
    retirement_age: params.retirementAge,
    life_expectancy: params.lifeExpectancy,
    annual_savings: params.annualSavings,
    post_retirement_income: params.postRetirementIncome,
    method: params.method,
    n_simulations: params.nSimulations,
    seed: params.seed,
    withdrawal_strategy: strategy,
    strategy_params: strategyParamsSnake,
    expense_ratio: params.expenseRatio,
    inflation: params.inflation,
  }
}

export async function runMonteCarlo(params: MonteCarloParams): Promise<MonteCarloResult> {
  return post<MonteCarloResult>('/api/monte-carlo', toMcRequest(params))
}
