import { useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface PercentInputProps {
  label?: string
  /** Stored as decimal (e.g. 0.04 for 4%) */
  value: number
  onChange: (value: number) => void
  error?: string
  tooltip?: string
  className?: string
  step?: number
  disabled?: boolean
}

function toDisplay(decimal: number): string {
  return (decimal * 100).toFixed(1)
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
  const [localValue, setLocalValue] = useState(() => toDisplay(value))
  const [prevValue, setPrevValue] = useState(value)
  const [isFocused, setIsFocused] = useState(false)

  // Sync from props during render when NOT focused (handles resets, rehydration, external changes)
  if (value !== prevValue) {
    setPrevValue(value)
    if (!isFocused) {
      setLocalValue(toDisplay(value))
    }
  }

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      setLocalValue(raw)

      const pct = parseFloat(raw)
      if (!isNaN(pct)) {
        onChange(pct / 100)
      }
    },
    [onChange]
  )

  const handleFocus = useCallback(() => {
    setIsFocused(true)
  }, [])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    const pct = parseFloat(localValue)
    if (isNaN(pct) || localValue.trim() === '') {
      // Revert to current store value
      setLocalValue(toDisplay(value))
    } else {
      // Reformat to canonical display
      setLocalValue(toDisplay(pct / 100))
    }
  }, [localValue, value])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.currentTarget.blur()
      }
    },
    []
  )

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <Label className="text-sm flex items-center gap-1">
          {label}
          {tooltip && (
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-muted-foreground text-xs cursor-help"
              title={tooltip}
            >
              i
            </span>
          )}
        </Label>
      )}
      <div className="relative">
        <Input
          type="number"
          inputMode="decimal"
          value={localValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
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
