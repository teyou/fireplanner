import { useMemo } from 'react'
import { useFireCalculations } from '@/hooks/useFireCalculations'
import { useProfileStore } from '@/stores/useProfileStore'

interface DashboardMetrics {
  fireNumber: number | null
  progress: number | null
  yearsToFire: number | null
  fireAge: number | null
  coastFireNumber: number | null
  baristaFireIncome: number | null
  savingsRate: number | null
  totalNetWorth: number | null
}

/**
 * Derived hook: computes dashboard headline numbers from profile + FIRE calculations.
 * No state stored — purely computed from other stores.
 */
export function useDashboardMetrics(): DashboardMetrics {
  const { metrics } = useFireCalculations()
  const profile = useProfileStore()

  return useMemo(() => {
    if (!metrics) {
      return {
        fireNumber: null,
        progress: null,
        yearsToFire: null,
        fireAge: null,
        coastFireNumber: null,
        baristaFireIncome: null,
        savingsRate: null,
        totalNetWorth: null,
      }
    }

    return {
      fireNumber: metrics.fireNumber,
      progress: metrics.progress,
      yearsToFire: metrics.yearsToFire,
      fireAge: metrics.fireAge,
      coastFireNumber: metrics.coastFireNumber,
      baristaFireIncome: metrics.baristaFireIncome,
      savingsRate: metrics.savingsRate,
      totalNetWorth: profile.liquidNetWorth + profile.cpfOA + profile.cpfSA + profile.cpfMA,
    }
  }, [metrics, profile.liquidNetWorth, profile.cpfOA, profile.cpfSA, profile.cpfMA])
}
