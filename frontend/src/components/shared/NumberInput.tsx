import { useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  /** If true, parse as integer. Default: false (float). */
  integer?: boolean
  min?: number
  max?: number
  step?: number
  className?: string
  disabled?: boolean
}

/**
 * Number input with a local string buffer to prevent leading-zero
 * and cursor-jump issues. The raw string is kept in local state while
 * focused; the parsed number is pushed to the store on every valid
 * keystroke. On blur, the display is normalised back to the store value.
 */
export function NumberInput({
  value,
  onChange,
  integer = false,
  min,
  max,
  step,
  className,
  disabled,
}: NumberInputProps) {
  const format = (v: number) => (integer ? String(Math.round(v)) : String(v))

  const [localValue, setLocalValue] = useState(() => format(value))
  const [prevValue, setPrevValue] = useState(value)
  const [isFocused, setIsFocused] = useState(false)

  // Sync from props when NOT focused (handles resets, rehydration, external changes)
  if (value !== prevValue) {
    setPrevValue(value)
    if (!isFocused) {
      setLocalValue(format(value))
    }
  }

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      setLocalValue(raw)

      const parsed = integer ? parseInt(raw, 10) : parseFloat(raw)
      if (!isNaN(parsed)) {
        onChange(parsed)
      }
    },
    [onChange, integer]
  )

  const handleFocus = useCallback(() => {
    setIsFocused(true)
  }, [])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    const parsed = integer ? parseInt(localValue, 10) : parseFloat(localValue)
    if (isNaN(parsed) || localValue.trim() === '') {
      setLocalValue(format(value))
    } else {
      setLocalValue(format(parsed))
    }
  }, [localValue, value, integer])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.currentTarget.blur()
      }
    },
    []
  )

  return (
    <Input
      type="number"
      inputMode={integer ? "numeric" : "decimal"}
      value={localValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      min={min}
      max={max}
      step={step}
      className={className}
      disabled={disabled}
    />
  )
}
