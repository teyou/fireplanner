import { useMemo } from 'react'
import { useFireCalculations } from '@/hooks/useFireCalculations'
import { useProjection } from '@/hooks/useProjection'
import { useProfileStore } from '@/stores/useProfileStore'
import { calculateProjectionFireNumber, normalizeProjectionFireNumber } from '@/lib/calculations/fire'

interface AdjustedFireNumberResult {
  /** Simple formula: effectiveExpenses / SWR */
  simpleFireNumber: number | null
  /** Derived from first retirement year's actual cash flows, normalized to simple formula's dollar basis */
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
 * Normalizes the projection number to the same dollar basis as the
 * simple FIRE number before computing deviation.
 */
export function useAdjustedFireNumber(): AdjustedFireNumberResult {
  const { metrics } = useFireCalculations()
  const { rows } = useProjection()
  const swr = useProfileStore((s) => s.swr)
  const inflation = useProfileStore((s) => s.inflation)
  const currentAge = useProfileStore((s) => s.currentAge)

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

    const rawProjNumber = calculateProjectionFireNumber(firstRetiredRow, swr)
    const simple = metrics.fireNumber

    // Compute basisInflationFactor from the expenses breakdown.
    // This captures whatever inflation the simple formula applied:
    //   "today" → 1, "retirement" → (1+i)^retYears, "fireAge" → converged factor
    const { baseExpenses, parentSupportAnnual, healthcareCashOutlay, effectiveExpenses } = metrics.expensesBreakdown
    const preInflationTotal = baseExpenses + parentSupportAnnual + healthcareCashOutlay
    const basisInflationFactor = preInflationTotal > 0
      ? effectiveExpenses / preInflationTotal
      : 1

    const normalizedProjNumber = normalizeProjectionFireNumber(
      rawProjNumber, firstRetiredRow.age, currentAge, inflation, basisInflationFactor
    )

    const deviation = simple > 0 ? (normalizedProjNumber - simple) / simple : 0
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
      projectionFireNumber: normalizedProjNumber,
      deviationPct: deviation,
      showProjectionNumber: show,
      deviationFactors: factors,
    }
  }, [metrics, rows, swr, inflation, currentAge])
}
