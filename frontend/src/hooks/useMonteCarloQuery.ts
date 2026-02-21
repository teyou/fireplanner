import { useState, useMemo } from 'react'
import { useMutation } from '@tanstack/react-query'
import { runMonteCarloWorker, flattenStrategyParams } from '@/lib/simulation/workerClient'
import type { MonteCarloResult } from '@/lib/types'
import type { MonteCarloEngineParams } from '@/lib/simulation/monteCarlo'
import { useProfileStore } from '@/stores/useProfileStore'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { useAllocationStore } from '@/stores/useAllocationStore'
import { useSimulationStore } from '@/stores/useSimulationStore'
import { usePropertyStore } from '@/stores/usePropertyStore'
import { ASSET_CLASSES, CORRELATION_MATRIX } from '@/lib/data/historicalReturns'
import { buildProjectionParams } from '@/hooks/useIncomeProjection'
import { useAnalysisPortfolio } from '@/hooks/useAnalysisPortfolio'
import {
  outstandingMortgageAtAge,
  calculateSellAndDownsize,
  calculateSellAndRent,
} from '@/lib/calculations/property'

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
  const propertyStore = usePropertyStore()
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
    parentSupportEnabled: profile.parentSupportEnabled,
    parentSupport: profile.parentSupport,
    downsizing: propertyStore.downsizing,
    ownsProperty: propertyStore.ownsProperty,
    healthcareConfig: profile.healthcareConfig,
    retirementWithdrawals: profile.retirementWithdrawals,
  }), [
    analysisPortfolio.initialPortfolio, analysisPortfolio.allocationWeights, analysisPortfolio.skipAccumulation,
    profile.currentAge, profile.retirementAge, profile.lifeExpectancy, profile.expenseRatio, profile.inflation,
    simulation.mcMethod, simulation.nSimulations, simulation.selectedStrategy, simulation.strategyParams,
    allocation.returnOverrides, allocation.stdDevOverrides,
    income.annualSalary, income.salaryModel, income.incomeStreams,
    profile.parentSupportEnabled, profile.parentSupport,
    propertyStore.downsizing, propertyStore.ownsProperty,
    profile.healthcareConfig,
    profile.retirementWithdrawals,
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

      // Compute downsizing equity injection for MC
      const portfolioAdjustments: { year: number; amount: number }[] = []
      const ds = propertyStore.downsizing
      if (ds && ds.scenario !== 'none' && propertyStore.ownsProperty) {
        const effectiveStartAge = analysisPortfolio.skipAccumulation
          ? profile.retirementAge : profile.currentAge
        const mcYear = ds.sellAge - effectiveStartAge
        const nYearsTotal = profile.lifeExpectancy - effectiveStartAge
        if (mcYear >= 0 && mcYear < nYearsTotal) {
          const yearsToSell = ds.sellAge - profile.currentAge
          const outstandingAtSell = outstandingMortgageAtAge(
            propertyStore.existingMortgageBalance,
            propertyStore.existingMonthlyPayment,
            propertyStore.existingMortgageRate,
            Math.max(0, yearsToSell),
          )

          let netEquity = 0
          if (ds.scenario === 'sell-and-downsize') {
            const result = calculateSellAndDownsize({
              salePrice: ds.expectedSalePrice,
              outstandingMortgage: outstandingAtSell,
              newPropertyCost: ds.newPropertyCost,
              newLtv: ds.newLtv,
              newMortgageRate: ds.newMortgageRate,
              newMortgageTerm: ds.newMortgageTerm,
              residency: propertyStore.residencyForAbsd,
              propertyCount: 0,
            })
            netEquity = result.netEquityToPortfolio
          } else if (ds.scenario === 'sell-and-rent') {
            const result = calculateSellAndRent({
              salePrice: ds.expectedSalePrice,
              outstandingMortgage: outstandingAtSell,
              monthlyRent: ds.monthlyRent,
            })
            netEquity = result.netProceedsToPortfolio
          }

          if (netEquity > 0) {
            portfolioAdjustments.push({ year: mcYear, amount: netEquity })
          }
        }
      }

      // Convert retirement withdrawals to negative portfolio adjustments
      const effectiveStartAge = analysisPortfolio.skipAccumulation
        ? profile.retirementAge : profile.currentAge
      for (const rw of profile.retirementWithdrawals) {
        const mcYear = rw.age - effectiveStartAge
        const nYearsTotal = profile.lifeExpectancy - effectiveStartAge
        if (mcYear >= 0 && mcYear < nYearsTotal) {
          // Negative amount = withdrawal from portfolio
          // Inflation adjustment is handled per-sim in the engine via the adjustments array
          portfolioAdjustments.push({ year: mcYear, amount: -rw.amount })
        }
      }

      const params: MonteCarloEngineParams = {
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
        strategyParams: flattenStrategyParams(simulation.selectedStrategy, simulation.strategyParams),
        expenseRatio: profile.expenseRatio,
        inflation: profile.inflation,
        portfolioAdjustments,
      }

      return runMonteCarloWorker(params)
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
