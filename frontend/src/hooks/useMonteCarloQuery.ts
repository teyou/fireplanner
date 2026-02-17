import { useState, useMemo } from 'react'
import { useMutation } from '@tanstack/react-query'
import { runMonteCarlo } from '@/lib/api'
import type { MonteCarloParams, MonteCarloResult } from '@/lib/types'
import { useProfileStore } from '@/stores/useProfileStore'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { useAllocationStore } from '@/stores/useAllocationStore'
import { useSimulationStore } from '@/stores/useSimulationStore'
import { ASSET_CLASSES, CORRELATION_MATRIX } from '@/lib/data/historicalReturns'
import { buildProjectionParams } from '@/hooks/useIncomeProjection'
import { useAnalysisPortfolio } from '@/hooks/useAnalysisPortfolio'

interface UseMonteCarloQueryResult {
  mutate: () => void
  data: MonteCarloResult | undefined
  isPending: boolean
  error: Error | null
  reset: () => void
  canRun: boolean
  validationErrors: Record<string, string>
  isStale: boolean
}

export function useMonteCarloQuery(): UseMonteCarloQueryResult {
  const profile = useProfileStore()
  const income = useIncomeStore()
  const allocation = useAllocationStore()
  const simulation = useSimulationStore()
  const analysisPortfolio = useAnalysisPortfolio()

  // Gate on upstream validation
  const profileErrors = profile.validationErrors
  const allocationErrors = allocation.validationErrors
  const simulationErrors = simulation.validationErrors
  const allErrors = { ...profileErrors, ...allocationErrors, ...simulationErrors }
  const canRun = Object.keys(allErrors).length === 0

  // Stale detection: snapshot params at run time, compare to current
  const [lastRunParams, setLastRunParams] = useState<string | null>(null)

  const currentParamsSig = useMemo(() => JSON.stringify({
    initialPortfolio: analysisPortfolio.initialPortfolio,
    allocationWeights: analysisPortfolio.allocationWeights,
    skipAccumulation: analysisPortfolio.skipAccumulation,
    currentAge: profile.currentAge,
    retirementAge: profile.retirementAge,
    lifeExpectancy: profile.lifeExpectancy,
    mcMethod: simulation.mcMethod,
    nSimulations: simulation.nSimulations,
    selectedStrategy: simulation.selectedStrategy,
    strategyParams: simulation.strategyParams,
    expenseRatio: profile.expenseRatio,
    inflation: profile.inflation,
    returnOverrides: allocation.returnOverrides,
    stdDevOverrides: allocation.stdDevOverrides,
    annualSalary: income.annualSalary,
    salaryModel: income.salaryModel,
    incomeStreams: income.incomeStreams,
  }), [
    analysisPortfolio.initialPortfolio, analysisPortfolio.allocationWeights, analysisPortfolio.skipAccumulation,
    profile.currentAge, profile.retirementAge, profile.lifeExpectancy, profile.expenseRatio, profile.inflation,
    simulation.mcMethod, simulation.nSimulations, simulation.selectedStrategy, simulation.strategyParams,
    allocation.returnOverrides, allocation.stdDevOverrides,
    income.annualSalary, income.salaryModel, income.incomeStreams,
  ])

  const mutation = useMutation({
    mutationFn: async () => {
      setLastRunParams(currentParamsSig)

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
        initialPortfolio: analysisPortfolio.initialPortfolio,
        allocationWeights: analysisPortfolio.allocationWeights,
        expectedReturns,
        stdDevs,
        correlationMatrix: CORRELATION_MATRIX,
        // When skipping accumulation, start simulation at retirement age
        currentAge: analysisPortfolio.skipAccumulation ? profile.retirementAge : profile.currentAge,
        retirementAge: profile.retirementAge,
        lifeExpectancy: profile.lifeExpectancy,
        // When skipping accumulation, no pre-retirement savings (post-retirement income still included)
        annualSavings: analysisPortfolio.skipAccumulation ? [] : annualSavings,
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

  const isStale = mutation.data !== undefined && lastRunParams !== currentParamsSig

  return {
    mutate: () => mutation.mutate(),
    data: mutation.data,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
    canRun,
    validationErrors: allErrors,
    isStale,
  }
}
