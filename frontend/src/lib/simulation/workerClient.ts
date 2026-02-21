/**
 * Worker client: typed interface for calling the simulation Web Worker.
 *
 * Lazily creates a single Worker instance and multiplexes calls via message IDs.
 */

import type { MonteCarloResult, BacktestResult, SequenceRiskResult, HeatmapConfig } from '@/lib/types'
import type {
  WithdrawalStrategyType,
  StrategyParamsMap,
  FloorCeilingParams,
} from '@/lib/types'
import type { MonteCarloEngineParams } from './monteCarlo'
import type { BacktestEngineParams, DetailedWindowResult } from './backtest'
import type { SequenceRiskEngineParams } from './sequenceRisk'

// ============================================================
// Strategy Params Flattening
// ============================================================

/**
 * Flatten a StrategyParamsMap entry to the flat Record<string, number>
 * expected by the TS simulation engines.
 *
 * Special handling for floor_ceiling: the store uses `floor` and `ceiling`
 * but the engine expects `floorAmount` and `ceilingAmount`.
 */
export function flattenStrategyParams(
  strategy: WithdrawalStrategyType,
  paramsMap: StrategyParamsMap,
): Record<string, number> {
  const sp = paramsMap[strategy]
  if (strategy === 'floor_ceiling') {
    const fc = sp as FloorCeilingParams
    return { floorAmount: fc.floor, ceilingAmount: fc.ceiling, targetRate: fc.targetRate }
  }
  return sp as unknown as Record<string, number>
}

// ============================================================
// Worker Singleton
// ============================================================

let worker: Worker | null = null

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(
      new URL('./simulation.worker.ts', import.meta.url),
      { type: 'module' },
    )
  }
  return worker
}

// ============================================================
// Generic call helper
// ============================================================

let nextId = 0

function callWorker<T>(message: Record<string, unknown>): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = String(nextId++)
    const w = getWorker()

    const handler = (e: MessageEvent) => {
      if (e.data.id !== id) return
      w.removeEventListener('message', handler)
      w.removeEventListener('error', errorHandler)
      if (e.data.type === 'error') {
        reject(new Error(e.data.error))
      } else {
        resolve(e.data.result as T)
      }
    }

    const errorHandler = (err: ErrorEvent) => {
      w.removeEventListener('message', handler)
      w.removeEventListener('error', errorHandler)
      reject(new Error(err.message || 'Worker error'))
    }

    w.addEventListener('message', handler)
    w.addEventListener('error', errorHandler)
    w.postMessage({ ...message, id })
  })
}

// ============================================================
// Typed public API
// ============================================================

export function runMonteCarloWorker(params: MonteCarloEngineParams): Promise<MonteCarloResult> {
  return callWorker<MonteCarloResult>({ type: 'monteCarlo', params })
}

export function runBacktestWorker(
  params: BacktestEngineParams,
  includeHeatmap: boolean,
  heatmapConfig?: HeatmapConfig,
): Promise<BacktestResult> {
  return callWorker<BacktestResult>({ type: 'backtest', params, includeHeatmap, heatmapConfig })
}

export function runDetailedWindowWorker(
  params: BacktestEngineParams,
  startYear: number,
): Promise<DetailedWindowResult> {
  return callWorker<DetailedWindowResult>({ type: 'backtest-window-detail', params, startYear })
}

export function runSequenceRiskWorker(
  params: SequenceRiskEngineParams,
): Promise<SequenceRiskResult> {
  return callWorker<SequenceRiskResult>({ type: 'sequenceRisk', params })
}
