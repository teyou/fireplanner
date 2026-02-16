import { Button } from '@/components/ui/button'
import { SalaryModelSection } from '@/components/income/SalaryModelSection'
import { IncomeStreamsSection } from '@/components/income/IncomeStreamsSection'
import { LifeEventsSection } from '@/components/income/LifeEventsSection'
import { ProjectionTable } from '@/components/income/ProjectionTable'
import { SummaryPanel } from '@/components/income/SummaryPanel'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { useIncomeProjection } from '@/hooks/useIncomeProjection'
import { CurrencyInput } from '@/components/shared/CurrencyInput'

export function IncomePage() {
  const resetIncome = useIncomeStore((s) => s.reset)
  const income = useIncomeStore()
  const profile = useProfileStore()
  const { projection, summary, hasErrors, errors } = useIncomeProjection()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Income Engine</h1>
          <p className="text-muted-foreground text-sm">
            Model your salary progression, additional income streams, and life events. All changes save automatically.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={resetIncome}>
          Reset to Defaults
        </Button>
      </div>

      {hasErrors && Object.keys(errors).length > 0 && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm font-medium text-destructive">
            Fix validation errors to see the projection table:
          </p>
          <ul className="text-xs text-destructive/80 mt-1 list-disc list-inside">
            {Object.entries(errors).slice(0, 5).map(([key, msg]) => (
              <li key={key}>{msg}</li>
            ))}
            {Object.keys(errors).length > 5 && (
              <li>...and {Object.keys(errors).length - 5} more</li>
            )}
          </ul>
        </div>
      )}

      <SalaryModelSection />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CurrencyInput
          label="Personal Reliefs"
          value={income.personalReliefs}
          onChange={(v) => income.setField('personalReliefs', v)}
          error={income.validationErrors.personalReliefs}
          tooltip="Annual personal tax reliefs (earned income, NSman, etc.)"
        />
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={income.employerCpfEnabled}
              onChange={(e) => income.setField('employerCpfEnabled', e.target.checked)}
            />
            Employer CPF Contributions
          </label>
        </div>
      </div>

      <IncomeStreamsSection />
      <LifeEventsSection />

      {projection && summary && (
        <>
          <SummaryPanel summary={summary} />
          <div>
            <h2 className="text-lg font-semibold mb-2">Year-by-Year Projection</h2>
            <ProjectionTable data={projection} retirementAge={profile.retirementAge} />
          </div>
        </>
      )}
    </div>
  )
}
