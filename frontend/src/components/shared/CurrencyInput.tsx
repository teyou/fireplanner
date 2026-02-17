import { Label } from '@/components/ui/label'
import { NumberInput } from '@/components/shared/NumberInput'
import { cn } from '@/lib/utils'

interface CurrencyInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  error?: string
  tooltip?: string
  className?: string
  disabled?: boolean
}

export function CurrencyInput({
  label,
  value,
  onChange,
  error,
  tooltip,
  className,
  disabled,
}: CurrencyInputProps) {
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
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          $
        </span>
        <NumberInput
          value={value}
          onChange={onChange}
          className={cn(
            'pl-7 border-blue-300',
            error && 'border-destructive'
          )}
          disabled={disabled}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
