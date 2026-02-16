import { useMemo } from 'react'
import type { FireMetrics } from '@/lib/types'
import { calculateAllFireMetrics } from '@/lib/calculations/fire'
import { useProfileStore } from '@/stores/useProfileStore'

interface FireCalculationsResult {
  metrics: FireMetrics | null
  hasErrors: boolean
  errors: Record<string, string>
}

/**
 * Derived hook: reads profile store, checks validation, computes FIRE metrics.
 * Returns null metrics when upstream validation fails.
 */
export function useFireCalculations(): FireCalculationsResult {
  const profile = useProfileStore()

  return useMemo(() => {
    const errors = profile.validationErrors

    // If there are validation errors, don't compute
    if (Object.keys(errors).length > 0) {
      return { metrics: null, hasErrors: true, errors }
    }

    const cpfTotal = profile.cpfOA + profile.cpfSA + profile.cpfMA

    const metrics = calculateAllFireMetrics({
      currentAge: profile.currentAge,
      retirementAge: profile.retirementAge,
      annualIncome: profile.annualIncome,
      annualExpenses: profile.annualExpenses,
      liquidNetWorth: profile.liquidNetWorth,
      cpfTotal,
      swr: profile.swr,
      expectedReturn: profile.expectedReturn,
      inflation: profile.inflation,
      expenseRatio: profile.expenseRatio,
    })

    return { metrics, hasErrors: false, errors: {} }
  }, [
    profile.currentAge,
    profile.retirementAge,
    profile.annualIncome,
    profile.annualExpenses,
    profile.liquidNetWorth,
    profile.cpfOA,
    profile.cpfSA,
    profile.cpfMA,
    profile.swr,
    profile.expectedReturn,
    profile.inflation,
    profile.expenseRatio,
    profile.validationErrors,
  ])
}
