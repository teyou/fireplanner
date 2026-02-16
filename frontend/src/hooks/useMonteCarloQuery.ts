import { useMutation } from '@tanstack/react-query'
import { runMonteCarlo } from '@/lib/api'
import type { MonteCarloParams, MonteCarloResult } from '@/lib/types'
import { useProfileStore } from '@/stores/useProfileStore'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { useAllocationStore } from '@/stores/useAllocationStore'
import { useSimulationStore } from '@/stores/useSimulationStore'
import { ASSET_CLASSES, CORRELATION_MATRIX } from '@/lib/data/historicalReturns'
import { buildProjectionParams } from '@/hooks/useIncomeProjection'

interface UseMonteCarloQueryResult {
  mutate: () => void
  data: MonteCarloResult | undefined
  isPending: boolean
  error: Error | null
  reset: () => void
  canRun: boolean
  validationErrors: Record<string, string>
}

export function useMonteCarloQuery(): UseMonteCarloQueryResult {
  const profile = useProfileStore()
  const income = useIncomeStore()
  const allocation = useAllocationStore()
  const simulation = useSimulationStore()

  // Gate on upstream validation
  const profileErrors = profile.validationErrors
  const allocationErrors = allocation.validationErrors
  const simulationErrors = simulation.validationErrors
  const allErrors = { ...profileErrors, ...allocationErrors, ...simulationErrors }
  const canRun = Object.keys(allErrors).length === 0

  const mutation = useMutation({
    mutationFn: async () => {
      const projectionParams = buildProjectionParams(profile, income)

      // Build annual savings array from income projection
      const annualSavings: number[] = []
      const postRetirementIncome: number[] = []

      if (projectionParams) {
        const { generateIncomeProjection } = await import('@/lib/calculations/income')
        const projection = generateIncomeProjection(projectionParams)
        for (const row of projection) {
          if (!row.isRetired) {
            annualSavings.push(row.annualSavings)
          } else {
            // Post-retirement income: rental + investment + government (CPF LIFE etc.)
            postRetirementIncome.push(
              row.rentalIncome + row.investmentIncome + row.governmentIncome
            )
          }
        }
      }

      // Get effective returns and std devs (with overrides)
      const expectedReturns = ASSET_CLASSES.map((ac, i) =>
        allocation.returnOverrides[i] ?? ac.expectedReturn
      )
      const stdDevs = ASSET_CLASSES.map((ac, i) =>
        allocation.stdDevOverrides[i] ?? ac.stdDev
      )

      const params: MonteCarloParams = {
        initialPortfolio: profile.liquidNetWorth + profile.cpfOA + profile.cpfSA + profile.cpfMA,
        allocationWeights: allocation.currentWeights,
        expectedReturns,
        stdDevs,
        correlationMatrix: CORRELATION_MATRIX,
        currentAge: profile.currentAge,
        retirementAge: profile.retirementAge,
        lifeExpectancy: profile.lifeExpectancy,
        annualSavings,
        postRetirementIncome,
        method: simulation.mcMethod,
        nSimulations: simulation.nSimulations,
        withdrawalStrategy: simulation.selectedStrategy,
        strategyParams: simulation.strategyParams,
        expenseRatio: profile.expenseRatio,
        inflation: profile.inflation,
      }

      return runMonteCarlo(params)
    },
  })

  return {
    mutate: () => mutation.mutate(),
    data: mutation.data,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
    canRun,
    validationErrors: allErrors,
  }
}
