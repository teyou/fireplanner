import { useMemo } from 'react'
import { useFireCalculations } from '@/hooks/useFireCalculations'
import { useProfileStore } from '@/stores/useProfileStore'

interface ChartDataPoint {
  age: number
  value: number
}

interface DashboardChartData {
  accumulationData: ChartDataPoint[]
  fireNumberLine: number | null
}

/**
 * Derived hook: computes chart data for dashboard accumulation visualization.
 * Projects net worth growth from current age to retirement at expected return.
 */
export function useDashboardCharts(): DashboardChartData {
  const { metrics } = useFireCalculations()
  const profile = useProfileStore()

  return useMemo(() => {
    if (!metrics) {
      return { accumulationData: [], fireNumberLine: null }
    }

    const currentNW = profile.liquidNetWorth + profile.cpfOA + profile.cpfSA + profile.cpfMA + profile.cpfRA
    const annualSavings = metrics.annualSavings
    const realReturn = profile.expectedReturn - profile.inflation - profile.expenseRatio
    const years = profile.lifeExpectancy - profile.currentAge

    const data: ChartDataPoint[] = []
    let balance = currentNW
    for (let y = 0; y <= years; y++) {
      data.push({ age: profile.currentAge + y, value: Math.max(0, balance) })
      if (profile.currentAge + y < profile.retirementAge) {
        balance = balance * (1 + realReturn) + annualSavings
      } else {
        balance = balance * (1 + realReturn) - profile.annualExpenses
      }
    }

    return {
      accumulationData: data,
      fireNumberLine: metrics.fireNumber,
    }
  }, [
    metrics,
    profile.liquidNetWorth,
    profile.cpfOA,
    profile.cpfSA,
    profile.cpfMA,
    profile.cpfRA,
    profile.currentAge,
    profile.retirementAge,
    profile.lifeExpectancy,
    profile.expectedReturn,
    profile.inflation,
    profile.expenseRatio,
    profile.annualExpenses,
  ])
}
