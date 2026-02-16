import { useMemo } from 'react'
import type { WithdrawalStrategyType } from '@/lib/types'
import {
  runDeterministicComparison,
  type DeterministicComparisonResult,
} from '@/lib/calculations/withdrawal'
import { calculatePortfolioReturn } from '@/lib/calculations/portfolio'
import { useProfileStore } from '@/stores/useProfileStore'
import { useAllocationStore } from '@/stores/useAllocationStore'
import { useWithdrawalStore } from '@/stores/useWithdrawalStore'
import { validateWithdrawalCrossStoreRules } from '@/lib/validation/rules'
import { ASSET_CLASSES } from '@/lib/data/historicalReturns'

interface WithdrawalComparisonResult {
  results: DeterministicComparisonResult | null
  hasErrors: boolean
  errors: Record<string, string>
}

/**
 * Derived hook: reads profile + allocation + withdrawal stores,
 * checks validation, runs deterministic withdrawal comparison.
 */
export function useWithdrawalComparison(): WithdrawalComparisonResult {
  const profile = useProfileStore()
  const allocation = useAllocationStore()
  const withdrawal = useWithdrawalStore()

  return useMemo(() => {
    const profileErrors = profile.validationErrors
    const withdrawalErrors = withdrawal.validationErrors
    const crossErrors = validateWithdrawalCrossStoreRules(
      {
        annualExpenses: profile.annualExpenses,
        retirementAge: profile.retirementAge,
        lifeExpectancy: profile.lifeExpectancy,
      },
      { strategyParams: withdrawal.strategyParams }
    )
    const allErrors = { ...profileErrors, ...withdrawalErrors, ...crossErrors }

    if (Object.keys(allErrors).length > 0) {
      return { results: null, hasErrors: true, errors: allErrors }
    }

    // Use portfolio expected return from allocation when available
    let expectedReturn = profile.expectedReturn
    const allocationErrors = allocation.validationErrors
    if (Object.keys(allocationErrors).length === 0) {
      const effectiveReturns = ASSET_CLASSES.map((ac, i) =>
        allocation.returnOverrides[i] ?? ac.expectedReturn
      )
      expectedReturn = calculatePortfolioReturn(allocation.currentWeights, effectiveReturns)
    }

    const results = runDeterministicComparison({
      initialPortfolio: profile.liquidNetWorth,
      retirementAge: profile.retirementAge,
      lifeExpectancy: profile.lifeExpectancy,
      expectedReturn,
      inflation: profile.inflation,
      expenseRatio: profile.expenseRatio,
      swr: profile.swr,
      strategies: withdrawal.selectedStrategies as string[],
      strategyParams: withdrawal.strategyParams as unknown as Record<string, Record<string, number>>,
    })

    return { results, hasErrors: false, errors: {} }
  }, [
    profile.liquidNetWorth,
    profile.retirementAge,
    profile.lifeExpectancy,
    profile.annualExpenses,
    profile.expectedReturn,
    profile.inflation,
    profile.expenseRatio,
    profile.swr,
    profile.validationErrors,
    allocation.currentWeights,
    allocation.returnOverrides,
    allocation.validationErrors,
    withdrawal.selectedStrategies,
    withdrawal.strategyParams,
    withdrawal.validationErrors,
  ])
}

const STRATEGY_LABELS: Record<WithdrawalStrategyType, string> = {
  constant_dollar: 'Constant Dollar (4% Rule)',
  vpw: 'Variable Percentage (VPW)',
  guardrails: 'Guardrails (Guyton-Klinger)',
  vanguard_dynamic: 'Vanguard Dynamic',
  cape_based: 'CAPE-Based',
  floor_ceiling: 'Floor & Ceiling',
}

export function getStrategyLabel(strategy: WithdrawalStrategyType): string {
  return STRATEGY_LABELS[strategy] ?? strategy
}
