import { Button } from '@/components/ui/button'
import { PropertyInputForm } from '@/components/property/PropertyInputForm'
import { PropertyAnalysisPanel } from '@/components/property/PropertyAnalysisPanel'
import { usePropertyStore } from '@/stores/usePropertyStore'

export function PropertyPage() {
  const reset = usePropertyStore((s) => s.reset)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Property Analysis</h1>
          <p className="text-muted-foreground text-sm">
            Analyze Singapore property purchases with BSD/ABSD, mortgage, Bala's Table leasehold decay, and rental yield calculations.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          Reset to Defaults
        </Button>
      </div>

      <PropertyInputForm />
      <PropertyAnalysisPanel />
    </div>
  )
}
