import { useCallback } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { CurrencyInput } from '@/components/shared/CurrencyInput'
import { PercentInput } from '@/components/shared/PercentInput'
import { NumberInput } from '@/components/shared/NumberInput'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import { useProfileStore } from '@/stores/useProfileStore'
import { formatCurrency } from '@/lib/utils'
import { calculateParentSupportAtAge } from '@/lib/calculations/fire'
import type { ParentSupport } from '@/lib/types'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export function ParentSupportSection() {
  const enabled = useProfileStore((s) => s.parentSupportEnabled)
  const entries = useProfileStore((s) => s.parentSupport)
  const retirementAge = useProfileStore((s) => s.retirementAge)
  const setField = useProfileStore((s) => s.setField)
  const addEntry = useProfileStore((s) => s.addParentSupport)
  const removeEntry = useProfileStore((s) => s.removeParentSupport)
  const updateEntry = useProfileStore((s) => s.updateParentSupport)
  const validationErrors = useProfileStore((s) => s.validationErrors)

  const handleToggle = useCallback((checked: boolean) => {
    setField('parentSupportEnabled', checked)
  }, [setField])

  const handleAdd = useCallback(() => {
    const entry: ParentSupport = {
      id: generateId(),
      label: entries.length === 0 ? 'Mother' : entries.length === 1 ? 'Father' : `Parent ${entries.length + 1}`,
      monthlyAmount: 500,
      startAge: 35,
      endAge: 75,
      growthRate: 0.03,
    }
    addEntry(entry)
  }, [entries.length, addEntry])

  const totalAtRetirement = enabled ? calculateParentSupportAtAge(entries, retirementAge) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1">
            Aging Parent Support
            <InfoTooltip text="Model financial support for aging parents as a time-bounded expense that affects your FIRE number. This is added on top of your regular expenses." />
          </div>
          <Switch checked={enabled} onCheckedChange={handleToggle} />
        </CardTitle>
      </CardHeader>
      {enabled && (
        <CardContent className="space-y-4">
          {entries.map((entry) => (
            <ParentSupportEntry
              key={entry.id}
              entry={entry}
              onUpdate={updateEntry}
              onRemove={removeEntry}
              errors={validationErrors}
            />
          ))}

          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <Plus className="h-4 w-4" />
            Add parent
          </button>

          {entries.length > 0 && totalAtRetirement > 0 && (
            <div className="p-2 bg-muted/50 rounded text-sm">
              <span className="text-muted-foreground">Total at retirement (age {retirementAge}): </span>
              <span className="font-semibold">{formatCurrency(totalAtRetirement)}/yr</span>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

function ParentSupportEntry({
  entry,
  onUpdate,
  onRemove,
  errors,
}: {
  entry: ParentSupport
  onUpdate: (id: string, updates: Partial<Omit<ParentSupport, 'id'>>) => void
  onRemove: (id: string) => void
  errors: Record<string, string>
}) {
  return (
    <div className="border rounded-md p-3 space-y-3">
      <div className="flex items-center justify-between">
        <input
          type="text"
          value={entry.label}
          onChange={(e) => onUpdate(entry.id, { label: e.target.value })}
          className="text-sm font-medium bg-transparent border-b border-transparent hover:border-muted-foreground/30 focus:border-primary focus:outline-none px-0 py-0.5 w-32"
        />
        <button
          onClick={() => onRemove(entry.id)}
          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
          title="Remove"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <CurrencyInput
          label="Monthly Amount"
          value={entry.monthlyAmount}
          onChange={(v) => onUpdate(entry.id, { monthlyAmount: v })}
          tooltip="Monthly support amount in today's dollars"
        />
        <PercentInput
          label="Annual Growth"
          value={entry.growthRate}
          onChange={(v) => onUpdate(entry.id, { growthRate: v })}
          tooltip="Annual growth rate for this expense (e.g., 3% for rising care costs)"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-sm flex items-center gap-1">
            Your Age: Start
            <InfoTooltip text="Your age when you begin providing this support" />
          </Label>
          <NumberInput
            value={entry.startAge}
            onChange={(v) => onUpdate(entry.id, { startAge: v })}
            integer
          />
          {errors[`parentSupport_${entry.id}_startAge`] && (
            <p className="text-xs text-destructive">{errors[`parentSupport_${entry.id}_startAge`]}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label className="text-sm flex items-center gap-1">
            Your Age: End
            <InfoTooltip text="Your age when this support obligation ends" />
          </Label>
          <NumberInput
            value={entry.endAge}
            onChange={(v) => onUpdate(entry.id, { endAge: v })}
            integer
          />
          {errors[`parentSupport_${entry.id}_endAge`] && (
            <p className="text-xs text-destructive">{errors[`parentSupport_${entry.id}_endAge`]}</p>
          )}
        </div>
      </div>
    </div>
  )
}
