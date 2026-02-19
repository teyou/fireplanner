import { useMemo } from 'react'
import type { AnalysisMode } from '@/lib/types'
import { useProfileStore } from '@/stores/useProfileStore'
import { useAllocationStore } from '@/stores/useAllocationStore'
import { useSimulationStore } from '@/stores/useSimulationStore'
import { useFireCalculations } from '@/hooks/useFireCalculations'
import { projectPortfolioAtRetirement } from '@/lib/calculations/fire'
import { calculatePortfolioReturn, interpolateGlidePath } from '@/lib/calculations/portfolio'
import { ASSET_CLASSES } from '@/lib/data/historicalReturns'
import { formatCurrency } from '@/lib/utils'

interface AnalysisPortfolioResult {
  initialPortfolio: number
  retirementPortfolio: number
  allocationWeights: number[]
  analysisMode: AnalysisMode
  portfolioLabel: string
  skipAccumulation: boolean
}

/**
 * Central hook for analysis pages. Returns the starting portfolio and allocation
 * weights based on the selected analysis mode.
 *
 * - myPlan: today's total NW as initialPortfolio (MC uses accumulation phase),
 *   deterministically projected NW as retirementPortfolio (for BT/SR)
 * - fireTarget: FIRE number for both initialPortfolio and retirementPortfolio,
 *   retirement-age weights, skips accumulation
 */
export function useAnalysisPortfolio(): AnalysisPortfolioResult {
  const profile = useProfileStore()
  const allocation = useAllocationStore()
  const simulation = useSimulationStore()
  const { metrics } = useFireCalculations()

  const analysisMode = simulation.analysisMode

  return useMemo(() => {
    const currentWeights = allocation.currentWeights
    const totalNW = profile.liquidNetWorth + profile.cpfOA + profile.cpfSA + profile.cpfMA

    // Compute retirement-age weights (for fireTarget and myPlan's retirementPortfolio)
    const retirementWeights = getRetirementAgeWeights(
      allocation.glidePathConfig.enabled,
      allocation.glidePathConfig,
      currentWeights,
      allocation.targetWeights,
      profile.retirementAge,
    )

    if (analysisMode === 'fireTarget') {
      const fireNumber = metrics?.fireNumber ?? 0
      return {
        initialPortfolio: fireNumber,
        retirementPortfolio: fireNumber,
        allocationWeights: retirementWeights,
        analysisMode,
        portfolioLabel: `FIRE Target: ${formatCurrency(fireNumber)}`,
        skipAccumulation: true,
      }
    }

    // myPlan mode: compute deterministic projection for BT/SR
    let portfolioReturn = profile.expectedReturn
    const allocationValid = Object.keys(allocation.validationErrors).length === 0
    if (profile.usePortfolioReturn && allocationValid) {
      const effectiveReturns = ASSET_CLASSES.map((ac, i) =>
        allocation.returnOverrides[i] ?? ac.expectedReturn
      )
      portfolioReturn = calculatePortfolioReturn(retirementWeights, effectiveReturns)
    }
    const netRealReturn = portfolioReturn - profile.inflation - profile.expenseRatio
    const annualSavings = profile.annualIncome - profile.annualExpenses

    const projected = projectPortfolioAtRetirement({
      currentNW: totalNW,
      annualSavings,
      netRealReturn,
      yearsToRetirement: profile.retirementAge - profile.currentAge,
    })

    return {
      initialPortfolio: totalNW,
      retirementPortfolio: projected,
      allocationWeights: currentWeights,
      analysisMode,
      portfolioLabel: `${formatCurrency(totalNW)} today → ~${formatCurrency(projected)} at age ${profile.retirementAge}`,
      skipAccumulation: false,
    }
  }, [
    analysisMode,
    profile.liquidNetWorth,
    profile.cpfOA,
    profile.cpfSA,
    profile.cpfMA,
    profile.currentAge,
    profile.retirementAge,
    profile.annualIncome,
    profile.annualExpenses,
    profile.expectedReturn,
    profile.usePortfolioReturn,
    profile.inflation,
    profile.expenseRatio,
    allocation.currentWeights,
    allocation.targetWeights,
    allocation.glidePathConfig,
    allocation.returnOverrides,
    allocation.validationErrors,
    metrics?.fireNumber,
  ])
}

/**
 * Get allocation weights at retirement age.
 * If glide path is enabled and retirement age falls within range, interpolate.
 * Otherwise return current weights.
 */
function getRetirementAgeWeights(
  glidePathEnabled: boolean,
  glidePathConfig: { startAge: number; endAge: number; method: 'linear' | 'slowStart' | 'fastStart' },
  currentWeights: number[],
  targetWeights: number[],
  retirementAge: number,
): number[] {
  if (!glidePathEnabled) return currentWeights

  const { startAge, endAge, method } = glidePathConfig
  if (retirementAge < startAge) return currentWeights
  if (retirementAge >= endAge) return targetWeights

  const duration = endAge - startAge
  if (duration <= 0) return currentWeights

  const progress = (retirementAge - startAge) / duration
  return interpolateGlidePath(currentWeights, targetWeights, progress, method)
}
