import { Button } from '@/components/ui/button'
import { CpfSection } from '@/components/profile/CpfSection'
import { useProfileStore } from '@/stores/useProfileStore'

export function CpfPage() {
  const reset = useProfileStore((s) => s.reset)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CPF</h1>
          <p className="text-muted-foreground text-sm">
            View your CPF contribution rates, balances, CPF LIFE projections, and housing deductions.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          Reset to Defaults
        </Button>
      </div>

      <CpfSection />
    </div>
  )
}
