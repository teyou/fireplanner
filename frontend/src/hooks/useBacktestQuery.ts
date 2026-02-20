import { useState, useMemo } from 'react'
import { useMutation } from '@tanstack/react-query'
import { runBacktestWorker, flattenStrategyParams } from '@/lib/simulation/workerClient'
import type { BacktestResult, BacktestDataset, WithdrawalStrategyType, HeatmapConfig } from '@/lib/types'
import { useProfileStore } from '@/stores/useProfileStore'
import { useAllocationStore } from '@/stores/useAllocationStore'
import { useWithdrawalStore } from '@/stores/useWithdrawalStore'
import { useAnalysisPortfolio } from '@/hooks/useAnalysisPortfolio'

interface BacktestConfig {
  swr: number
  retirementDuration: number
  dataset: BacktestDataset
  blendRatio: number
  includeHeatmap: boolean
  heatmapConfig: HeatmapConfig
}

interface UseBacktestQueryResult {
  mutate: () => void
  data: BacktestResult | undefined
  isPending: boolean
  error: Error | null
  reset: () => void
  canRun: boolean
  validationErrors: Record<string, string>
  config: BacktestConfig
  setConfig: (update: Partial<BacktestConfig>) => void
  isStale: boolean
}

const DEFAULT_CONFIG: BacktestConfig = {
  swr: 0.04,
  retirementDuration: 30,
  dataset: 'us_only',
  blendRatio: 0.70,
  includeHeatmap: true,
  heatmapConfig: {
    swrMin: 0.01,
    swrMax: 0.06,
    swrStep: 0.005,
    durationMin: 15,
    durationMax: 45,
    durationStep: 5,
  },
}

export function useBacktestQuery(): UseBacktestQueryResult {
  const profile = useProfileStore()
  const allocation = useAllocationStore()
  const withdrawal = useWithdrawalStore()
  const analysisPortfolio = useAnalysisPortfolio()
  const [config, setConfigState] = useState<BacktestConfig>(DEFAULT_CONFIG)

  const profileErrors = profile.validationErrors
  const allocationErrors = allocation.validationErrors
  const allErrors = { ...profileErrors, ...allocationErrors }
  const canRun = Object.keys(allErrors).length === 0

  const setConfig = (update: Partial<BacktestConfig>) => {
    setConfigState((prev) => ({ ...prev, ...update }))
  }

  const strategy: WithdrawalStrategyType = withdrawal.selectedStrategies[0] ?? 'constant_dollar'

  // Stale detection
  const [lastRunParams, setLastRunParams] = useState<string | null>(null)

  const currentParamsSig = useMemo(() => JSON.stringify({
    initialPortfolio: analysisPortfolio.retirementPortfolio,
    allocationWeights: analysisPortfolio.allocationWeights,
    config,
    expenseRatio: profile.expenseRatio,
    strategy,
    strategyParams: withdrawal.strategyParams,
    inflation: profile.inflation,
  }), [
    analysisPortfolio.initialPortfolio, analysisPortfolio.allocationWeights,
    config, profile.expenseRatio, strategy, withdrawal.strategyParams, profile.inflation,
  ])

  const mutation = useMutation({
    mutationFn: async () => {
      setLastRunParams(currentParamsSig)

      const params = {
        initialPortfolio: analysisPortfolio.retirementPortfolio,
        allocationWeights: analysisPortfolio.allocationWeights,
        swr: config.swr,
        retirementDuration: config.retirementDuration,
        dataset: config.dataset,
        blendRatio: config.blendRatio,
        expenseRatio: profile.expenseRatio,
        withdrawalStrategy: strategy,
        strategyParams: flattenStrategyParams(strategy, withdrawal.strategyParams),
        inflation: profile.inflation,
      }

      return runBacktestWorker(params, config.includeHeatmap, config.heatmapConfig)
    },
  })

  const isStale = mutation.data !== undefined && lastRunParams !== currentParamsSig

  return {
    mutate: () => mutation.mutate(),
    data: mutation.data,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
    canRun,
    validationErrors: allErrors,
    config,
    setConfig,
    isStale,
  }
}
