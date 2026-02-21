import { useState, useMemo } from 'react'
import { useMutation } from '@tanstack/react-query'
import { runSequenceRiskWorker, flattenStrategyParams } from '@/lib/simulation/workerClient'
import type { CrisisScenario, SequenceRiskResult } from '@/lib/types'
import { useProfileStore } from '@/stores/useProfileStore'
import { useAllocationStore } from '@/stores/useAllocationStore'
import { useWithdrawalStore } from '@/stores/useWithdrawalStore'
import { ASSET_CLASSES, CORRELATION_MATRIX } from '@/lib/data/historicalReturns'
import { buildProjectionParams } from '@/hooks/useIncomeProjection'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { useAnalysisPortfolio } from '@/hooks/useAnalysisPortfolio'

interface UseSequenceRiskQueryResult {
  mutate: (crisis: CrisisScenario) => void
  data: SequenceRiskResult | undefined
  isPending: boolean
  error: Error | null
  reset: () => void
  canRun: boolean
  validationErrors: Record<string, string>
  isStale: boolean
}

export function useSequenceRiskQuery(): UseSequenceRiskQueryResult {
  const profile = useProfileStore()
  const income = useIncomeStore()
  const allocation = useAllocationStore()
  const withdrawal = useWithdrawalStore()
  const analysisPortfolio = useAnalysisPortfolio()

  const profileErrors = profile.validationErrors
  const allocationErrors = allocation.validationErrors
  const withdrawalErrors = withdrawal.validationErrors
  const allErrors = { ...profileErrors, ...allocationErrors, ...withdrawalErrors }
  const canRun = Object.keys(allErrors).length === 0

  // Stale detection
  const [lastRunParams, setLastRunParams] = useState<string | null>(null)

  const strategy = withdrawal.selectedStrategies[0] ?? 'constant_dollar'

  const currentParamsSig = useMemo(() => JSON.stringify({
    initialPortfolio: analysisPortfolio.retirementPortfolio,
    allocationWeights: analysisPortfolio.allocationWeights,
    retirementAge: profile.retirementAge,
    lifeExpectancy: profile.lifeExpectancy,
    returnOverrides: allocation.returnOverrides,
    stdDevOverrides: allocation.stdDevOverrides,
    strategy,
    strategyParams: withdrawal.strategyParams,
    expenseRatio: profile.expenseRatio,
    inflation: profile.inflation,
    retirementWithdrawals: profile.retirementWithdrawals,
  }), [
    analysisPortfolio.initialPortfolio, analysisPortfolio.allocationWeights,
    profile.retirementAge, profile.lifeExpectancy, profile.expenseRatio, profile.inflation,
    allocation.returnOverrides, allocation.stdDevOverrides,
    strategy, withdrawal.strategyParams,
    profile.retirementWithdrawals,
  ])

  const mutation = useMutation({
    mutationFn: async (crisis: CrisisScenario) => {
      // Include crisis id in the snapshot so switching crisis also triggers stale
      setLastRunParams(JSON.stringify({
        params: JSON.parse(currentParamsSig),
        crisisId: crisis.id,
      }))

      const projectionParams = buildProjectionParams(profile, income)
      const postRetirementIncome: number[] = []

      if (projectionParams) {
        const { generateIncomeProjection } = await import('@/lib/calculations/income')
        const projection = generateIncomeProjection(projectionParams)
        for (const row of projection) {
          if (row.isRetired) {
            postRetirementIncome.push(
              row.rentalIncome + row.investmentIncome + row.governmentIncome
            )
          }
        }
      }

      const expectedReturns = ASSET_CLASSES.map((ac, i) =>
        allocation.returnOverrides[i] ?? ac.expectedReturn
      )
      const stdDevs = ASSET_CLASSES.map((ac, i) =>
        allocation.stdDevOverrides[i] ?? ac.stdDev
      )

      // Convert retirement withdrawals to year-offset based one-time withdrawals
      // Expand durationYears > 1 into multiple year entries
      const retirementDuration = profile.lifeExpectancy - profile.retirementAge
      const oneTimeWithdrawals: { year: number; amount: number }[] = []
      for (const rw of profile.retirementWithdrawals) {
        for (let d = 0; d < (rw.durationYears ?? 1); d++) {
          const yearOffset = (rw.age + d) - profile.retirementAge
          if (yearOffset >= 0 && yearOffset < retirementDuration) {
            oneTimeWithdrawals.push({ year: yearOffset, amount: rw.amount })
          }
        }
      }

      const params = {
        initialPortfolio: analysisPortfolio.retirementPortfolio,
        allocationWeights: analysisPortfolio.allocationWeights,
        expectedReturns,
        stdDevs,
        correlationMatrix: CORRELATION_MATRIX,
        retirementAge: profile.retirementAge,
        lifeExpectancy: profile.lifeExpectancy,
        withdrawalStrategy: strategy,
        strategyParams: flattenStrategyParams(strategy, withdrawal.strategyParams),
        crisis,
        nSimulations: 2000,
        expenseRatio: profile.expenseRatio,
        inflation: profile.inflation,
        postRetirementIncome,
        oneTimeWithdrawals: oneTimeWithdrawals.length > 0 ? oneTimeWithdrawals : undefined,
      }

      return runSequenceRiskWorker(params)
    },
  })

  // For sequence risk, stale means either params changed OR we can't compare crisis
  // (since crisis is passed at call time). We check if lastRunParams starts with current params.
  const isStale = mutation.data !== undefined && (
    lastRunParams === null ||
    !lastRunParams.startsWith(`{"params":${currentParamsSig}`)
  )

  return {
    mutate: (crisis: CrisisScenario) => mutation.mutate(crisis),
    data: mutation.data,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
    canRun,
    validationErrors: allErrors,
    isStale,
  }
}
