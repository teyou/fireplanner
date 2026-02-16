import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useProfileStore } from '@/stores/useProfileStore'
import { useAllocationStore } from '@/stores/useAllocationStore'
import { PercentInput } from '@/components/shared/PercentInput'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import { calculatePortfolioReturn } from '@/lib/calculations/portfolio'
import { ASSET_CLASSES } from '@/lib/data/historicalReturns'
import type { RebalanceFrequency } from '@/lib/types'

export function AssumptionsSection() {
  const store = useProfileStore()
  const allocation = useAllocationStore()

  const { isOverridden, effectiveReturn, portfolioReturnDisplay } = useMemo(() => {
    const allocationErrors = allocation.validationErrors
    const hasErrors = Object.keys(allocationErrors).length > 0

    if (!hasErrors) {
      const effectiveReturns = ASSET_CLASSES.map((ac, i) =>
        allocation.returnOverrides[i] ?? ac.expectedReturn
      )
      const portfolioReturn = calculatePortfolioReturn(allocation.currentWeights, effectiveReturns)
      return {
        isOverridden: true,
        effectiveReturn: portfolioReturn,
        portfolioReturnDisplay: (portfolioReturn * 100).toFixed(1),
      }
    }

    return {
      isOverridden: false,
      effectiveReturn: store.expectedReturn,
      portfolioReturnDisplay: null,
    }
  }, [
    allocation.validationErrors,
    allocation.currentWeights,
    allocation.returnOverrides,
    store.expectedReturn,
  ])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Assumptions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <PercentInput
              label="Expected Nominal Return"
              value={isOverridden ? effectiveReturn : store.expectedReturn}
              onChange={(v) => store.setField('expectedReturn', v)}
              error={store.validationErrors.expectedReturn}
              tooltip="Expected annual portfolio return before inflation. Depends on asset allocation."
              disabled={isOverridden}
            />
            {isOverridden ? (
              <p className="text-xs text-green-600 mt-1">
                Derived from Asset Allocation ({portfolioReturnDisplay}%). Edit weights in Asset Allocation to change.
              </p>
            ) : (
              <p className="text-xs text-amber-600 mt-1">
                Manual override — fix Asset Allocation weights to auto-derive.
              </p>
            )}
          </div>

          <PercentInput
            label="Inflation Rate"
            value={store.inflation}
            onChange={(v) => store.setField('inflation', v)}
            error={store.validationErrors.inflation}
            tooltip="Expected annual inflation. Singapore historical average ~2.5%."
          />

          <PercentInput
            label="Expense Ratio"
            value={store.expenseRatio}
            onChange={(v) => store.setField('expenseRatio', v)}
            error={store.validationErrors.expenseRatio}
            tooltip="Weighted average expense ratio of your portfolio funds. Typically 0.1%-0.5%."
            step={0.05}
          />

          <div className="space-y-1">
            <Label className="text-sm flex items-center">
              Rebalancing Frequency
              <InfoTooltip text="How often you rebalance your portfolio. Note: simulations use annual steps regardless of this setting." />
            </Label>
            <select
              value={store.rebalanceFrequency}
              onChange={(e) =>
                store.setField('rebalanceFrequency', e.target.value as RebalanceFrequency)
              }
              className="flex h-10 w-full rounded-md border border-blue-300 bg-background px-3 py-2 text-sm"
            >
              <option value="annual">Annual</option>
              <option value="semi-annual">Semi-Annual</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-3">
          Net real return: {((effectiveReturn - store.inflation - store.expenseRatio) * 100).toFixed(1)}%
          ({(effectiveReturn * 100).toFixed(1)}% nominal - {(store.inflation * 100).toFixed(1)}% inflation - {(store.expenseRatio * 100).toFixed(1)}% fees)
        </p>
      </CardContent>
    </Card>
  )
}
