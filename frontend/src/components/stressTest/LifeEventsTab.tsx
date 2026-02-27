import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { AlertTriangle, Info, Plus, RotateCcw } from 'lucide-react'
import { useProfileStore } from '@/stores/useProfileStore'
import { useIncomeStore } from '@/stores/useIncomeStore'
import {
  useDisruptionImpact,
  DISRUPTION_TEMPLATES,
} from '@/hooks/useDisruptionImpact'
import { formatCurrency, cn } from '@/lib/utils'

const MAX_EVENTS = 4

function DeltaBadge({ value, format, invert }: { value: number; format: (v: number) => string; invert?: boolean }) {
  if (!isFinite(value) || Math.abs(value) < 0.001) return null
  const isPositive = value > 0
  const isGood = invert ? !isPositive : isPositive
  return (
    <span className={cn(
      'text-xs font-medium ml-2 px-1.5 py-0.5 rounded',
      isGood ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    )}>
      {isPositive ? '+' : ''}{format(value)}
    </span>
  )
}

function ProbabilityBadge({ probability, byAge }: { probability?: number; byAge?: number }) {
  if (!probability) return null
  const pct = (probability * 100).toFixed(0)
  const label = byAge ? `~${pct}% by age ${byAge}` : `~${pct}% per recession`
  return (
    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded ml-2">
      {label}
    </span>
  )
}

// Codex fix #6: Use explicit category field from DisruptionTemplate instead of brittle string matching
const CATEGORY_ORDER = ['career', 'health', 'family'] as const
type Category = typeof CATEGORY_ORDER[number]

const CATEGORY_LABELS: Record<Category, string> = {
  career: 'Career & Income',
  health: 'Health',
  family: 'Family',
}

export function LifeEventsTab() {
  const profile = useProfileStore()
  const income = useIncomeStore()
  const {
    selectedIndex,
    startAge,
    baseMetrics,
    disruptedMetrics,
    deltas,
    selectTemplate,
    setStartAge,
  } = useDisruptionImpact()

  if (!baseMetrics) return null

  const currentAge = profile.currentAge
  const retirementAge = profile.retirementAge
  const lifeEventsCount = income.lifeEvents.length
  const atEventLimit = lifeEventsCount >= MAX_EVENTS
  const selectedTemplate = selectedIndex !== null ? DISRUPTION_TEMPLATES[selectedIndex] : null

  // Codex fix #1 (Critical): Clamp endAge to lifeExpectancy to pass cross-store validation
  const lifeExpectancy = profile.lifeExpectancy

  const handleAddToPlan = () => {
    if (!selectedTemplate || atEventLimit) return
    const clampedStartAge = Math.max(currentAge + 1, startAge)
    const endAge = Math.min(lifeExpectancy, clampedStartAge + selectedTemplate.durationYears)
    const id = `event-${crypto.randomUUID()}`

    income.addLifeEvent({
      id,
      name: selectedTemplate.event.name,
      startAge: clampedStartAge,
      endAge,
      incomeImpact: selectedTemplate.event.incomeImpact,
      affectedStreamIds: [],
      savingsPause: selectedTemplate.event.savingsPause,
      cpfPause: selectedTemplate.event.cpfPause,
      additionalAnnualExpense: selectedTemplate.additionalAnnualExpense,
      lumpSumCost: selectedTemplate.lumpSumCost,
      expenseReductionPercent: selectedTemplate.expenseReductionPercent,
    })

    if (!income.lifeEventsEnabled) {
      income.setField('lifeEventsEnabled', true)
    }
    selectTemplate(null)
  }

  // Group templates by category
  const grouped = CATEGORY_ORDER.map(cat => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    templates: DISRUPTION_TEMPLATES.map((t, i) => ({ ...t, index: i })).filter(t => t.category === cat),
  })).filter(g => g.templates.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2 text-sm text-muted-foreground">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <p>
          Stress-test your plan against life disruptions. Select a scenario to preview its impact on your FIRE timeline, then optionally add it to your plan.
        </p>
      </div>

      {/* Scenario cards grouped by category */}
      {grouped.map(({ category, label, templates }) => (
        <div key={category} className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">{label}</h4>
          <div className="flex flex-wrap gap-2">
            {templates.map((tmpl) => (
              <Button
                key={tmpl.label}
                variant={selectedIndex === tmpl.index ? 'default' : 'outline'}
                size="sm"
                onClick={() => selectTemplate(selectedIndex === tmpl.index ? null : tmpl.index)}
                className="text-xs"
              >
                {selectedIndex === tmpl.index && <AlertTriangle className="h-3 w-3 mr-1" />}
                {tmpl.label}
                <ProbabilityBadge probability={tmpl.probability} byAge={tmpl.probabilityByAge} />
              </Button>
            ))}
          </div>
        </div>
      ))}

      {/* Age slider + description when template is selected */}
      {selectedTemplate && (
        <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Disruption Start Age</Label>
              <span className="text-sm font-medium tabular-nums text-blue-600 dark:text-blue-400">
                Age {Math.round(startAge)}
                {selectedTemplate.durationYears < 90
                  ? ` (${selectedTemplate.durationYears}yr duration)`
                  : ' (permanent)'}
              </span>
            </div>
            <Slider
              value={[startAge]}
              min={currentAge + 1}
              max={Math.max(currentAge + 1, retirementAge - 1)}
              step={1}
              onValueChange={([v]) => setStartAge(v)}
            />
          </div>

          {/* Impact breakdown */}
          {selectedTemplate.event.incomeImpact === 0 && selectedTemplate.event.savingsPause && (
            <p className="text-xs text-muted-foreground">Income: Paused (0% of salary)</p>
          )}
          {selectedTemplate.event.incomeImpact > 0 && selectedTemplate.event.incomeImpact < 1 && (
            <p className="text-xs text-muted-foreground">Income: Reduced to {(selectedTemplate.event.incomeImpact * 100).toFixed(0)}%</p>
          )}
          {selectedTemplate.additionalAnnualExpense ? (
            <p className="text-xs text-muted-foreground">
              Additional expenses: {formatCurrency(selectedTemplate.additionalAnnualExpense)}/yr
              {selectedTemplate.durationYears < 90 ? ` for ${selectedTemplate.durationYears} years` : ''}
            </p>
          ) : null}
          {selectedTemplate.lumpSumCost ? (
            <p className="text-xs text-muted-foreground">One-time cost: {formatCurrency(selectedTemplate.lumpSumCost)}</p>
          ) : null}
          {selectedTemplate.expenseReductionPercent ? (
            <p className="text-xs text-muted-foreground">
              Lifestyle reduction: {(selectedTemplate.expenseReductionPercent * 100).toFixed(0)}% lower expenses
            </p>
          ) : null}
        </div>
      )}

      {/* Impact delta cards */}
      {deltas && disruptedMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground">FIRE Number</p>
            <p className="text-sm font-semibold tabular-nums">
              {formatCurrency(baseMetrics.fireNumber + deltas.fireNumber)}
              <DeltaBadge value={deltas.fireNumber} format={formatCurrency} invert />
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Years to FIRE</p>
            <p className="text-sm font-semibold tabular-nums">
              {isFinite(baseMetrics.yearsToFire + (isNaN(deltas.yearsToFire) ? 0 : deltas.yearsToFire))
                ? `${(baseMetrics.yearsToFire + (isNaN(deltas.yearsToFire) ? 0 : deltas.yearsToFire)).toFixed(1)} yrs`
                : 'Never'}
              {!isNaN(deltas.yearsToFire) && (
                <DeltaBadge value={deltas.yearsToFire} format={(v) => `${v.toFixed(1)} yrs`} invert />
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">FIRE Age</p>
            <p className="text-sm font-semibold tabular-nums">
              {isFinite(baseMetrics.fireAge + (isNaN(deltas.fireAge) ? 0 : deltas.fireAge))
                ? `Age ${Math.round(baseMetrics.fireAge + (isNaN(deltas.fireAge) ? 0 : deltas.fireAge))}`
                : 'Never'}
              {!isNaN(deltas.fireAge) && (
                <DeltaBadge value={deltas.fireAge} format={(v) => `${v.toFixed(1)} yrs`} invert />
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Portfolio at Retirement</p>
            <p className="text-sm font-semibold tabular-nums">
              {formatCurrency(baseMetrics.portfolioAtRetirement + deltas.portfolioAtRetirement)}
              <DeltaBadge value={deltas.portfolioAtRetirement} format={formatCurrency} />
            </p>
          </div>
        </div>
      )}

      {/* Add to Plan / Reset buttons */}
      {selectedTemplate && (
        <div className="flex items-center gap-2 pt-2">
          <Button
            size="sm"
            onClick={handleAddToPlan}
            disabled={atEventLimit}
            title={atEventLimit ? `Maximum ${MAX_EVENTS} life events reached` : undefined}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add to My Plan
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectTemplate(null)}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset
          </Button>
          {atEventLimit && (
            <span className="text-xs text-muted-foreground">
              Max {MAX_EVENTS} events reached
            </span>
          )}
        </div>
      )}
    </div>
  )
}
