import { useState, useMemo } from 'react'
import { useMutation } from '@tanstack/react-query'
import { runMonteCarloWorker, flattenStrategyParams } from '@/lib/simulation/workerClient'
import { getEffectiveExpenses } from '@/lib/calculations/expenses'
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
import { computeCashReservePlan, computeCashReserveOffset } from '@/lib/calculations/cashReserve'

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
    cashReserveEnabled: profile.cashReserveEnabled,
    cashReserveMode: profile.cashReserveMode,
    cashReserveFixedAmount: profile.cashReserveFixedAmount,
    cashReserveMonths: profile.cashReserveMonths,
    cashReserveReturn: profile.cashReserveReturn,
    retirementMitigation: profile.retirementMitigation,
    annualExpenses: profile.annualExpenses,
    expenseAdjustments: profile.expenseAdjustments,
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
    profile.cashReserveEnabled, profile.cashReserveMode, profile.cashReserveFixedAmount,
    profile.cashReserveMonths, profile.cashReserveReturn, profile.retirementMitigation,
    profile.annualExpenses, profile.expenseAdjustments,
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

      // Post-process savings through cash reserve
      let effectiveSavings = annualSavings
      if (profile.cashReserveEnabled && annualSavings.length > 0) {
        const reserveOffset = computeCashReserveOffset(
          profile.liquidNetWorth,
          profile.cashReserveEnabled,
          profile.cashReserveMode,
          profile.cashReserveFixedAmount,
          profile.cashReserveMonths,
          profile.annualExpenses,
        )
        const reservePlan = computeCashReservePlan({
          mode: profile.cashReserveMode,
          target: profile.cashReserveFixedAmount,
          months: profile.cashReserveMonths,
          initialBalance: reserveOffset,
          annualSavingsArray: annualSavings,
          cashReturn: profile.cashReserveReturn,
          inflationRate: profile.inflation,
          annualExpenses: profile.annualExpenses,
        })
        effectiveSavings = reservePlan.investedSavings
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
      // Expand durationYears > 1 into multiple year entries
      const effectiveStartAge = analysisPortfolio.skipAccumulation
        ? profile.retirementAge : profile.currentAge
      const nYearsTotal = profile.lifeExpectancy - effectiveStartAge
      for (const rw of profile.retirementWithdrawals) {
        for (let d = 0; d < (rw.durationYears ?? 1); d++) {
          const mcYear = (rw.age + d) - effectiveStartAge
          if (mcYear >= 0 && mcYear < nYearsTotal) {
            portfolioAdjustments.push({ year: mcYear, amount: -rw.amount })
          }
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
        annualSavings: analysisPortfolio.skipAccumulation ? [] : effectiveSavings,
        postRetirementIncome,
        method: simulation.mcMethod,
        nSimulations: simulation.nSimulations,
        withdrawalStrategy: simulation.selectedStrategy,
        strategyParams: flattenStrategyParams(simulation.selectedStrategy, simulation.strategyParams),
        expenseRatio: profile.expenseRatio,
        inflation: profile.inflation,
        portfolioAdjustments,
        retirementMitigation: profile.retirementMitigation,
        annualExpensesAtRetirement: getEffectiveExpenses(profile.retirementAge, profile.annualExpenses, profile.expenseAdjustments, profile.lifeExpectancy) * Math.pow(1 + profile.inflation, Math.max(0, profile.retirementAge - profile.currentAge)),
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
