import { useState, useCallback, useEffect } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAllocationStore } from '@/stores/useAllocationStore'
import { ASSET_CLASSES } from '@/lib/data/historicalReturns'
import { cn } from '@/lib/utils'

/** Format a decimal (0.072) to a display string ("7.2") */
function toDisplay(decimal: number): string {
  return (decimal * 100).toFixed(1)
}

/**
 * A single numeric cell that keeps local string state while editing,
 * and syncs to the store on blur. Arrows start from the default value.
 */
function OverrideCell({
  override,
  defaultValue,
  onCommit,
  min,
}: {
  override: number | null
  defaultValue: number
  onCommit: (value: number | null) => void
  min?: number
}) {
  const displayDefault = toDisplay(defaultValue)
  const isCustom = override !== null

  // Local string state for free-form editing
  const [localValue, setLocalValue] = useState(
    isCustom ? toDisplay(override) : ''
  )
  const [isFocused, setIsFocused] = useState(false)

  // Sync from store when override changes externally (e.g. reset button)
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(override !== null ? toDisplay(override) : '')
    }
  }, [override, isFocused])

  const handleFocus = useCallback(() => {
    setIsFocused(true)
    // If no custom value, populate with default so arrows work from it
    if (override === null) {
      setLocalValue(displayDefault)
    }
  }, [override, displayDefault])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    if (localValue === '' || localValue === '-') {
      onCommit(null)
      setLocalValue('')
      return
    }
    // If user typed back the exact default, treat as "no override"
    const pct = parseFloat(localValue)
    if (isNaN(pct)) {
      onCommit(null)
      setLocalValue('')
      return
    }
    if (localValue === displayDefault) {
      onCommit(null)
      setLocalValue('')
      return
    }
    onCommit(pct / 100)
    setLocalValue(pct.toFixed(1))
  }, [localValue, displayDefault, onCommit])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setLocalValue(raw)
    // Also commit on arrow key changes (they fire onChange with clean values)
    const pct = parseFloat(raw)
    if (!isNaN(pct) && raw !== '' && raw !== '-') {
      if (raw === displayDefault) {
        onCommit(null)
      } else {
        onCommit(pct / 100)
      }
    }
  }, [displayDefault, onCommit])

  return (
    <Input
      type="number"
      placeholder={displayDefault}
      value={localValue}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      step={0.1}
      min={min}
      className={cn(
        'text-right h-8',
        isCustom ? 'border-blue-500' : 'border-muted'
      )}
    />
  )
}

export function AdvancedOverrides() {
  const {
    returnOverrides,
    stdDevOverrides,
    setReturnOverride,
    setStdDevOverride,
  } = useAllocationStore()

  const hasAnyOverride = returnOverrides.some((v) => v !== null) || stdDevOverrides.some((v) => v !== null)

  function resetAll() {
    for (let i = 0; i < 8; i++) {
      setReturnOverride(i, null)
      setStdDevOverride(i, null)
    }
  }

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="overrides" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-medium">
          Override Default Return Assumptions
          {hasAnyOverride && (
            <span className="ml-2 text-xs text-blue-600 font-normal">(custom overrides active)</span>
          )}
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Override the default expected returns and standard deviations for individual asset classes.
              Leave blank to use defaults.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium">Asset Class</th>
                    <th className="text-right py-2 px-2 font-medium w-32">Expected Return %</th>
                    <th className="text-right py-2 pl-2 font-medium w-32">Std Dev %</th>
                  </tr>
                </thead>
                <tbody>
                  {ASSET_CLASSES.map((ac, i) => {
                    if (ac.key === 'cpf') return null
                    return (
                    <tr key={ac.key} className="border-b last:border-b-0">
                      <td className="py-2 pr-4">{ac.label}</td>
                      <td className="py-2 px-2">
                        <OverrideCell
                          override={returnOverrides[i]}
                          defaultValue={ac.expectedReturn}
                          onCommit={(v) => setReturnOverride(i, v)}
                        />
                      </td>
                      <td className="py-2 pl-2">
                        <OverrideCell
                          override={stdDevOverrides[i]}
                          defaultValue={ac.stdDev}
                          onCommit={(v) => setStdDevOverride(i, v)}
                          min={0}
                        />
                      </td>
                    </tr>
                  )
                  })}
                </tbody>
              </table>
            </div>

            {hasAnyOverride && (
              <Button variant="outline" size="sm" onClick={resetAll}>
                Reset to Defaults
              </Button>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
