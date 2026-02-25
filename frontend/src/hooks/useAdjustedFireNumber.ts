import { useMemo } from 'react'
import { useFireCalculations } from '@/hooks/useFireCalculations'
import { useProjection } from '@/hooks/useProjection'
import { useProfileStore } from '@/stores/useProfileStore'
import { calculateProjectionFireNumber } from '@/lib/calculations/fire'

interface AdjustedFireNumberResult {
  /** Simple formula: effectiveExpenses / SWR */
  simpleFireNumber: number | null
  /** Derived from first retirement year's actual cash flows */
  projectionFireNumber: number | null
  /** (projection - simple) / simple, e.g. 0.12 = 12% higher */
  deviationPct: number | null
  /** True when |deviationPct| > 0.05 (5%) */
  showProjectionNumber: boolean
  /** Human-readable factors causing the deviation */
  deviationFactors: string[]
}

/**
 * Combines the simple FIRE number from useFireCalculations with a
 * projection-derived FIRE number from the first retirement year row.
 * Returns both numbers and deviation info for UI annotation.
 */
export function useAdjustedFireNumber(): AdjustedFireNumberResult {
  const { metrics } = useFireCalculations()
  const { rows } = useProjection()
  const swr = useProfileStore((s) => s.swr)

  return useMemo(() => {
    if (!metrics || !rows || rows.length === 0) {
      return {
        simpleFireNumber: metrics?.fireNumber ?? null,
        projectionFireNumber: null,
        deviationPct: null,
        showProjectionNumber: false,
        deviationFactors: [],
      }
    }

    const firstRetiredRow = rows.find((r) => r.isRetired)
    if (!firstRetiredRow) {
      return {
        simpleFireNumber: metrics.fireNumber,
        projectionFireNumber: null,
        deviationPct: null,
        showProjectionNumber: false,
        deviationFactors: [],
      }
    }

    const projNumber = calculateProjectionFireNumber(firstRetiredRow, swr)
    const simple = metrics.fireNumber

    const deviation = simple > 0 ? (projNumber - simple) / simple : 0
    const show = Math.abs(deviation) > 0.05

    // Build human-readable factor list
    const factors: string[] = []
    if (firstRetiredRow.mortgageCashPayment > 0) {
      factors.push('mortgage cash payments')
    }
    if (firstRetiredRow.cpfLifePayout > 0) {
      factors.push('CPF LIFE payout')
    }
    if (firstRetiredRow.rentalIncome > 0) {
      factors.push('rental income')
    }

    return {
      simpleFireNumber: simple,
      projectionFireNumber: projNumber,
      deviationPct: deviation,
      showProjectionNumber: show,
      deviationFactors: factors,
    }
  }, [metrics, rows, swr])
}
