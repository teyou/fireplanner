import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface PercentInputProps {
  label: string
  /** Stored as decimal (e.g. 0.04 for 4%) */
  value: number
  onChange: (value: number) => void
  error?: string
  tooltip?: string
  className?: string
  step?: number
  disabled?: boolean
}

export function PercentInput({
  label,
  value,
  onChange,
  error,
  tooltip,
  className,
  step = 0.1,
  disabled,
}: PercentInputProps) {
  // Display as percentage (user sees "4" for 0.04)
  const displayValue = (value * 100).toFixed(1)

  return (
    <div className={cn('space-y-1', className)}>
      <Label className="text-sm flex items-center gap-1">
        {label}
        {tooltip && (
          <span
            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted text-muted-foreground text-xs cursor-help"
            title={tooltip}
          >
            i
          </span>
        )}
      </Label>
      <div className="relative">
        <Input
          type="number"
          value={displayValue}
          onChange={(e) => {
            const pct = parseFloat(e.target.value)
            if (!isNaN(pct)) onChange(pct / 100)
          }}
          step={step}
          className={cn(
            'pr-7 border-blue-300',
            error && 'border-destructive'
          )}
          disabled={disabled}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          %
        </span>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
