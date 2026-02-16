import { Button } from '@/components/ui/button'
import { PersonalSection } from '@/components/profile/PersonalSection'
import { FinancialSection } from '@/components/profile/FinancialSection'
import { FireTargetsSection } from '@/components/profile/FireTargetsSection'
import { AssumptionsSection } from '@/components/profile/AssumptionsSection'
import { CpfSection } from '@/components/profile/CpfSection'
import { useProfileStore } from '@/stores/useProfileStore'

export function ProfilePage() {
  const reset = useProfileStore((s) => s.reset)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">FIRE Profile</h1>
          <p className="text-muted-foreground text-sm">
            Set your personal details, finances, and FIRE targets. All changes save automatically.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          Reset to Defaults
        </Button>
      </div>

      <PersonalSection />
      <FinancialSection />
      <FireTargetsSection />
      <AssumptionsSection />
      <CpfSection />
    </div>
  )
}
