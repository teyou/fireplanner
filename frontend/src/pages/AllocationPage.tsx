import { Button } from '@/components/ui/button'
import { AllocationBuilder } from '@/components/allocation/AllocationBuilder'
import { PortfolioStatsPanel } from '@/components/allocation/PortfolioStatsPanel'
import { AdvancedOverrides } from '@/components/allocation/AdvancedOverrides'
import { GlidePathSection } from '@/components/allocation/GlidePathSection'
import { CorrelationHeatmap } from '@/components/allocation/CorrelationHeatmap'
import { useAllocationStore } from '@/stores/useAllocationStore'

export function AllocationPage() {
  const reset = useAllocationStore((s) => s.reset)
  const validationErrors = useAllocationStore((s) => s.validationErrors)
  const hasErrors = Object.keys(validationErrors).length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Asset Allocation</h1>
          <p className="text-muted-foreground text-sm">
            Build your portfolio across 8 asset classes. Choose a template or customize weights. All changes save automatically.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          Reset to Defaults
        </Button>
      </div>

      {hasErrors && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive font-medium">
            Fix the validation errors below before portfolio statistics can be computed.
          </p>
        </div>
      )}

      <AllocationBuilder />
      <PortfolioStatsPanel />
      <AdvancedOverrides />
      <GlidePathSection />
      <CorrelationHeatmap />
    </div>
  )
}
