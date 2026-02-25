import { useMemo } from 'react'
import { useFireCalculations } from '@/hooks/useFireCalculations'
import { useProjection } from '@/hooks/useProjection'
import { useProfileStore } from '@/stores/useProfileStore'
import { calculateProjectionFireNumber } from '@/lib/calculations/fire'

interface DashboardMetrics {
  fireNumber: number | null
  progress: number | null
  yearsToFire: number | null
  fireAge: number | null
  coastFireNumber: number | null
  baristaFireIncome: number | null
  savingsRate: number | null
  totalNetWorth: number | null
  portfolioDepletedAge: number | null
  lifeExpectancy: number
  projectionFireNumber: number | null
  deviationPct: number | null
  showProjectionNumber: boolean
  deviationFactors: string[]
}

/**
 * Derived hook: computes dashboard headline numbers from profile + FIRE calculations.
 * Prefers projection's simulated FIRE age over NPER estimate when available.
 * No state stored — purely computed from other stores.
 */
export function useDashboardMetrics(): DashboardMetrics {
  const { metrics } = useFireCalculations()
  const { summary: projSummary, rows: projRows } = useProjection()
  const profile = useProfileStore()

  return useMemo(() => {
    const nullProjection = {
      projectionFireNumber: null as number | null,
      deviationPct: null as number | null,
      showProjectionNumber: false,
      deviationFactors: [] as string[],
    }

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
        portfolioDepletedAge: null,
        lifeExpectancy: profile.lifeExpectancy,
        ...nullProjection,
      }
    }

    // Prefer projection's simulated FIRE age over NPER estimate
    const projFireAge = projSummary?.fireAchievedAge ?? null
    const fireAge = projFireAge ?? metrics.fireAge
    const yearsToFire = projFireAge !== null
      ? Math.max(0, projFireAge - profile.currentAge)
      : metrics.yearsToFire

    // Projection-derived FIRE number from first retired row
    let projectionData = nullProjection
    if (projRows && projRows.length > 0) {
      const firstRetiredRow = projRows.find((r) => r.isRetired)
      if (firstRetiredRow) {
        const projNumber = calculateProjectionFireNumber(firstRetiredRow, profile.swr)
        const simple = metrics.fireNumber
        const deviation = simple > 0 ? (projNumber - simple) / simple : 0
        const factors: string[] = []
        if (firstRetiredRow.mortgageCashPayment > 0) factors.push('mortgage cash payments')
        if (firstRetiredRow.cpfLifePayout > 0) factors.push('CPF LIFE payout')
        if (firstRetiredRow.rentalIncome > 0) factors.push('rental income')
        projectionData = {
          projectionFireNumber: projNumber,
          deviationPct: deviation,
          showProjectionNumber: Math.abs(deviation) > 0.05,
          deviationFactors: factors,
        }
      }
    }

    return {
      fireNumber: metrics.fireNumber,
      progress: metrics.progress,
      yearsToFire,
      fireAge,
      coastFireNumber: metrics.coastFireNumber,
      baristaFireIncome: metrics.baristaFireIncome,
      savingsRate: metrics.savingsRate,
      totalNetWorth: profile.liquidNetWorth + profile.cpfOA + profile.cpfSA + profile.cpfMA + profile.cpfRA,
      portfolioDepletedAge: projSummary?.portfolioDepletedAge ?? null,
      lifeExpectancy: profile.lifeExpectancy,
      ...projectionData,
    }
  }, [metrics, projSummary, projRows, profile.currentAge, profile.lifeExpectancy, profile.liquidNetWorth, profile.cpfOA, profile.cpfSA, profile.cpfMA, profile.cpfRA, profile.swr])
}
