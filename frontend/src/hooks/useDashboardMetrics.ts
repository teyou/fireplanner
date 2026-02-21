import { useMemo } from 'react'
import { useFireCalculations } from '@/hooks/useFireCalculations'
import { useProjection } from '@/hooks/useProjection'
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
 * Prefers projection's simulated FIRE age over NPER estimate when available.
 * No state stored — purely computed from other stores.
 */
export function useDashboardMetrics(): DashboardMetrics {
  const { metrics } = useFireCalculations()
  const { summary: projSummary } = useProjection()
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

    // Prefer projection's simulated FIRE age over NPER estimate
    const projFireAge = projSummary?.fireAchievedAge ?? null
    const fireAge = projFireAge ?? metrics.fireAge
    const yearsToFire = projFireAge !== null
      ? Math.max(0, projFireAge - profile.currentAge)
      : metrics.yearsToFire

    return {
      fireNumber: metrics.fireNumber,
      progress: metrics.progress,
      yearsToFire,
      fireAge,
      coastFireNumber: metrics.coastFireNumber,
      baristaFireIncome: metrics.baristaFireIncome,
      savingsRate: metrics.savingsRate,
      totalNetWorth: profile.liquidNetWorth + profile.cpfOA + profile.cpfSA + profile.cpfMA + profile.cpfRA,
    }
  }, [metrics, projSummary, profile.currentAge, profile.liquidNetWorth, profile.cpfOA, profile.cpfSA, profile.cpfMA, profile.cpfRA])
}
