import { useMutation } from '@tanstack/react-query'
import { runSequenceRisk } from '@/lib/api'
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

  const mutation = useMutation({
    mutationFn: async (crisis: CrisisScenario) => {
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

      // Use first selected strategy
      const strategy = withdrawal.selectedStrategies[0] ?? 'constant_dollar'

      return runSequenceRisk({
        initialPortfolio: analysisPortfolio.initialPortfolio,
        allocationWeights: analysisPortfolio.allocationWeights,
        expectedReturns,
        stdDevs,
        correlationMatrix: CORRELATION_MATRIX,
        retirementAge: profile.retirementAge,
        lifeExpectancy: profile.lifeExpectancy,
        withdrawalStrategy: strategy,
        strategyParams: withdrawal.strategyParams,
        crisis,
        nSimulations: 2000,
        expenseRatio: profile.expenseRatio,
        inflation: profile.inflation,
        postRetirementIncome,
      })
    },
  })

  return {
    mutate: (crisis: CrisisScenario) => mutation.mutate(crisis),
    data: mutation.data,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
    canRun,
    validationErrors: allErrors,
  }
}
