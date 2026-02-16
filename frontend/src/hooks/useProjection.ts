import { useMemo } from 'react'
import type { ProjectionRow, ProjectionSummary } from '@/lib/types'
import { generateProjection } from '@/lib/calculations/projection'
import { calculatePortfolioReturn } from '@/lib/calculations/portfolio'
import { useProfileStore } from '@/stores/useProfileStore'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { useAllocationStore } from '@/stores/useAllocationStore'
import { useSimulationStore } from '@/stores/useSimulationStore'
import { useIncomeProjection } from '@/hooks/useIncomeProjection'
import { useFireCalculations } from '@/hooks/useFireCalculations'
import { ASSET_CLASSES } from '@/lib/data/historicalReturns'

interface ProjectionResult {
  rows: ProjectionRow[] | null
  summary: ProjectionSummary | null
  hasErrors: boolean
  errors: Record<string, string>
}

/**
 * Derived hook: reads profile, income, allocation, and simulation stores,
 * computes the full year-by-year projection combining income engine,
 * portfolio growth, and withdrawal strategy.
 *
 * Returns null rows/summary when upstream validation fails.
 */
export function useProjection(): ProjectionResult {
  const profile = useProfileStore()
  const allocation = useAllocationStore()
  const simulation = useSimulationStore()
  const { projection: incomeProjection, hasErrors: incomeHasErrors, errors: incomeErrors } = useIncomeProjection()
  const { metrics: fireMetrics, hasErrors: fireHasErrors, errors: fireErrors } = useFireCalculations()

  return useMemo(() => {
    // Collect all upstream errors
    const allErrors = { ...incomeErrors, ...fireErrors }

    if (incomeHasErrors || fireHasErrors || !incomeProjection || !fireMetrics) {
      return { rows: null, summary: null, hasErrors: true, errors: allErrors }
    }

    // Compute effective asset returns (with overrides applied)
    const assetReturns = ASSET_CLASSES.map((ac, i) =>
      allocation.returnOverrides[i] ?? ac.expectedReturn
    )

    // Determine effective expected return
    const allocationErrors = allocation.validationErrors
    const allocationHasErrors = Object.keys(allocationErrors).length > 0
    let effectiveReturn = profile.expectedReturn
    if (profile.usePortfolioReturn && !allocationHasErrors) {
      effectiveReturn = calculatePortfolioReturn(allocation.currentWeights, assetReturns)
    }

    const { rows, summary } = generateProjection({
      incomeProjection,
      currentAge: profile.currentAge,
      retirementAge: profile.retirementAge,
      lifeExpectancy: profile.lifeExpectancy,
      initialLiquidNW: profile.liquidNetWorth,
      swr: profile.swr,
      expectedReturn: effectiveReturn,
      usePortfolioReturn: profile.usePortfolioReturn && !allocationHasErrors,
      inflation: profile.inflation,
      expenseRatio: profile.expenseRatio,
      annualExpenses: profile.annualExpenses,
      fireNumber: fireMetrics.fireNumber,
      currentWeights: allocation.currentWeights,
      targetWeights: allocation.targetWeights,
      assetReturns,
      glidePathConfig: allocation.glidePathConfig,
      withdrawalStrategy: simulation.selectedStrategy,
      strategyParams: simulation.strategyParams,
    })

    return { rows, summary, hasErrors: false, errors: {} }
  }, [
    incomeProjection,
    incomeHasErrors,
    incomeErrors,
    fireMetrics,
    fireHasErrors,
    fireErrors,
    profile.currentAge,
    profile.retirementAge,
    profile.lifeExpectancy,
    profile.liquidNetWorth,
    profile.swr,
    profile.expectedReturn,
    profile.usePortfolioReturn,
    profile.inflation,
    profile.expenseRatio,
    profile.annualExpenses,
    allocation.currentWeights,
    allocation.targetWeights,
    allocation.returnOverrides,
    allocation.glidePathConfig,
    allocation.validationErrors,
    simulation.selectedStrategy,
    simulation.strategyParams,
  ])
}
