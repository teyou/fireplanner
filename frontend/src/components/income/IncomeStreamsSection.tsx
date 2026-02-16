import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CurrencyInput } from '@/components/shared/CurrencyInput'
import { PercentInput } from '@/components/shared/PercentInput'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { cn } from '@/lib/utils'
import type { IncomeStream, IncomeStreamType, GrowthModel, TaxTreatment } from '@/lib/types'

const MAX_STREAMS = 5

function createStream(id: string): IncomeStream {
  return {
    id,
    name: '',
    annualAmount: 0,
    startAge: 30,
    endAge: 65,
    growthRate: 0.02,
    type: 'rental',
    growthModel: 'fixed',
    taxTreatment: 'taxable',
    isCpfApplicable: false,
    isActive: true,
  }
}

export function IncomeStreamsSection() {
  const income = useIncomeStore()
  const errors = income.validationErrors

  const addStream = () => {
    if (income.incomeStreams.length >= MAX_STREAMS) return
    const id = `stream-${Date.now()}`
    income.addIncomeStream(createStream(id))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            Income Streams
            <InfoTooltip text="Additional income beyond your primary salary" />
          </CardTitle>
          {income.incomeStreams.length < MAX_STREAMS && (
            <Button variant="outline" size="sm" onClick={addStream}>
              Add Stream
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {income.incomeStreams.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No additional income streams. Click "Add Stream" to add rental income, investments, etc.
          </p>
        ) : (
          <div className="space-y-4">
            {income.incomeStreams.map((stream) => (
              <StreamRow
                key={stream.id}
                stream={stream}
                errors={errors}
                onUpdate={(updates) => income.updateIncomeStream(stream.id, updates)}
                onRemove={() => income.removeIncomeStream(stream.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StreamRow({
  stream, errors, onUpdate, onRemove,
}: {
  stream: IncomeStream
  errors: Record<string, string>
  onUpdate: (updates: Partial<IncomeStream>) => void
  onRemove: () => void
}) {
  const prefix = `incomeStream_${stream.id}`

  return (
    <div className={cn(
      'p-3 border rounded-md space-y-3',
      !stream.isActive && 'opacity-50'
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Input
            value={stream.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Stream name"
            className="w-48 border-blue-300"
          />
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={stream.isActive}
              onChange={(e) => onUpdate({ isActive: e.target.checked })}
            />
            Active
          </label>
        </div>
        <Button variant="ghost" size="sm" onClick={onRemove}>Remove</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <select
            value={stream.type}
            onChange={(e) => onUpdate({ type: e.target.value as IncomeStreamType })}
            className="flex h-9 w-full rounded-md border border-blue-300 bg-background px-2 py-1 text-sm"
          >
            <option value="employment">Employment</option>
            <option value="rental">Rental</option>
            <option value="investment">Investment</option>
            <option value="business">Business</option>
            <option value="government">Government</option>
          </select>
        </div>

        <CurrencyInput
          label="Annual Amount"
          value={stream.annualAmount}
          onChange={(v) => onUpdate({ annualAmount: v })}
          error={errors[`${prefix}_annualAmount`]}
        />

        <div className="space-y-1">
          <Label className="text-xs">Growth Model</Label>
          <select
            value={stream.growthModel}
            onChange={(e) => onUpdate({ growthModel: e.target.value as GrowthModel })}
            className="flex h-9 w-full rounded-md border border-blue-300 bg-background px-2 py-1 text-sm"
          >
            <option value="fixed">Fixed Rate</option>
            <option value="inflation-linked">Inflation-Linked</option>
            <option value="none">No Growth</option>
          </select>
        </div>

        <PercentInput
          label="Growth Rate"
          value={stream.growthRate}
          onChange={(v) => onUpdate({ growthRate: v })}
          disabled={stream.growthModel !== 'fixed'}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Start Age</Label>
          <Input
            type="number"
            value={stream.startAge}
            onChange={(e) => onUpdate({ startAge: parseInt(e.target.value) || 0 })}
            className={cn('border-blue-300', errors[`${prefix}_startAge`] && 'border-destructive')}
          />
          {errors[`${prefix}_startAge`] && (
            <p className="text-xs text-destructive">{errors[`${prefix}_startAge`]}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-xs">End Age</Label>
          <Input
            type="number"
            value={stream.endAge}
            onChange={(e) => onUpdate({ endAge: parseInt(e.target.value) || 0 })}
            className={cn('border-blue-300', errors[`${prefix}_endAge`] && 'border-destructive')}
          />
          {errors[`${prefix}_endAge`] && (
            <p className="text-xs text-destructive">{errors[`${prefix}_endAge`]}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Tax Treatment</Label>
          <select
            value={stream.taxTreatment}
            onChange={(e) => onUpdate({ taxTreatment: e.target.value as TaxTreatment })}
            className="flex h-9 w-full rounded-md border border-blue-300 bg-background px-2 py-1 text-sm"
          >
            <option value="taxable">Taxable</option>
            <option value="tax-exempt">Tax-Exempt</option>
            <option value="cpf">CPF</option>
            <option value="srs">SRS</option>
          </select>
        </div>

        <div className="flex items-end pb-1">
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={stream.isCpfApplicable}
              onChange={(e) => onUpdate({ isCpfApplicable: e.target.checked })}
            />
            CPF Applicable
          </label>
        </div>
      </div>
    </div>
  )
}
