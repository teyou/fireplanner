import { useState, useMemo } from 'react'
import { useProfileStore } from '@/stores/useProfileStore'
import { useAllocationStore } from '@/stores/useAllocationStore'
import { useFireCalculations } from '@/hooks/useFireCalculations'
import { useProjection } from '@/hooks/useProjection'
import { formatCurrency } from '@/lib/utils'

export type ExploreBalanceMode = 'myPlan' | 'fireTarget'

interface ExplorePortfolioResult {
  balanceMode: ExploreBalanceMode
  setBalanceMode: (mode: ExploreBalanceMode) => void
  initialPortfolio: number
  allocationWeights: number[]
  startAge: number
  label: string
}

/**
 * Local state hook for the Explore page's starting-balance toggle.
 * NOT persisted — resets to 'myPlan' on page load.
 *
 * - myPlan: deterministically projected NW at retirementAge, starts MC at retirementAge
 * - fireTarget: FIRE number at fireAge, starts MC at fireAge
 */
export function useExplorePortfolio(): ExplorePortfolioResult {
  const [balanceMode, setBalanceMode] = useState<ExploreBalanceMode>('myPlan')
  const profile = useProfileStore()
  const allocation = useAllocationStore()
  const { metrics } = useFireCalculations()
  const { rows } = useProjection()

  return useMemo(() => {
    if (balanceMode === 'fireTarget') {
      const fireNumber = metrics?.fireNumber ?? 0
      const rawFireAge = metrics?.fireAge ?? profile.retirementAge
      const fireAge = isFinite(rawFireAge)
        ? Math.min(profile.lifeExpectancy, Math.max(profile.currentAge, Math.round(rawFireAge)))
        : profile.retirementAge

      return {
        balanceMode,
        setBalanceMode,
        initialPortfolio: fireNumber,
        allocationWeights: allocation.currentWeights,
        startAge: fireAge,
        label: `FIRE Target: ${formatCurrency(fireNumber)} at age ${fireAge}`,
      }
    }

    // myPlan: projected NW at retirement age
    const retirementRow = rows?.find(r => r.age === profile.retirementAge)
    const projectedNW = retirementRow?.liquidNW ?? 0

    return {
      balanceMode,
      setBalanceMode,
      initialPortfolio: projectedNW,
      allocationWeights: allocation.currentWeights,
      startAge: profile.retirementAge,
      label: `My Plan: ${formatCurrency(projectedNW)} at age ${profile.retirementAge}`,
    }
  }, [balanceMode, setBalanceMode, profile.retirementAge, profile.currentAge, profile.lifeExpectancy, allocation.currentWeights, metrics, rows])
}
