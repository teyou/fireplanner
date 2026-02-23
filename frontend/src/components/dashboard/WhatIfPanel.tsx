import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { SlidersHorizontal, RotateCcw } from 'lucide-react'
import { useProfileStore } from '@/stores/useProfileStore'
import { useWhatIfMetrics, type WhatIfOverrides } from '@/hooks/useWhatIfMetrics'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface SliderConfig {
  key: keyof WhatIfOverrides
  label: string
  min: number
  max: number
  step: number
  format: (v: number) => string
}

function getSliderConfigs(profile: {
  annualExpenses: number
  annualIncome: number
  swr: number
  expectedReturn: number
  retirementAge: number
  liquidNetWorth: number
}): SliderConfig[] {
  return [
    {
      key: 'annualExpenses',
      label: 'Annual Expenses',
      min: Math.max(6000, Math.round(profile.annualExpenses * 0.25)),
      max: Math.round(profile.annualExpenses * 3),
      step: 1000,
      format: (v) => formatCurrency(v),
    },
    {
      key: 'annualIncome',
      label: 'Annual Income',
      min: 0,
      max: Math.round(profile.annualIncome * 3),
      step: 1000,
      format: (v) => formatCurrency(v),
    },
    {
      key: 'swr',
      label: 'Safe Withdrawal Rate',
      min: 0.02,
      max: 0.08,
      step: 0.001,
      format: (v) => `${(v * 100).toFixed(1)}%`,
    },
    {
      key: 'expectedReturn',
      label: 'Expected Return',
      min: 0.02,
      max: 0.12,
      step: 0.005,
      format: (v) => `${(v * 100).toFixed(1)}%`,
    },
    {
      key: 'retirementAge',
      label: 'Retirement Age',
      min: Math.max(profile.retirementAge - 20, 25),
      max: Math.min(profile.retirementAge + 20, 85),
      step: 1,
      format: (v) => `Age ${Math.round(v)}`,
    },
    {
      key: 'liquidNetWorth',
      label: 'Liquid Net Worth',
      min: 0,
      max: Math.max(Math.round(profile.liquidNetWorth * 5), 1000000),
      step: 10000,
      format: (v) => formatCurrency(v),
    },
  ]
}

function DeltaBadge({ value, format, invert }: { value: number; format: (v: number) => string; invert?: boolean }) {
  if (!isFinite(value) || Math.abs(value) < 0.001) return null
  const isPositive = value > 0
  // For expenses: increase is bad. For income/NW: increase is good.
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

export function WhatIfPanel() {
  const profile = useProfileStore()
  const [overrides, setOverrides] = useState<WhatIfOverrides>({})
  const [isOpen, setIsOpen] = useState(false)
  const { baseMetrics, deltas, hasData } = useWhatIfMetrics(overrides)

  const sliderConfigs = getSliderConfigs(profile)

  const handleSliderChange = useCallback((key: keyof WhatIfOverrides, value: number) => {
    setOverrides((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleReset = useCallback(() => {
    setOverrides({})
  }, [])

  if (!hasData || !baseMetrics) return null

  const hasOverrides = Object.keys(overrides).length > 0

  const getBaseValue = (key: keyof WhatIfOverrides): number => {
    switch (key) {
      case 'annualExpenses': return profile.annualExpenses
      case 'annualIncome': return profile.annualIncome
      case 'swr': return profile.swr
      case 'expectedReturn': return profile.expectedReturn
      case 'retirementAge': return profile.retirementAge
      case 'liquidNetWorth': return profile.liquidNetWorth
    }
  }

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle className="flex items-center gap-2 text-base">
          <SlidersHorizontal className="h-4 w-4" />
          What-If Explorer
          <span className="text-xs font-normal text-muted-foreground ml-auto">
            {isOpen ? 'Click to collapse' : 'Click to expand'}
          </span>
        </CardTitle>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Drag the sliders to explore how changes affect your FIRE timeline. These are temporary — your saved inputs are not modified.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            {sliderConfigs.map((config) => {
              const baseValue = getBaseValue(config.key)
              const currentValue = overrides[config.key] ?? baseValue
              const isModified = overrides[config.key] !== undefined

              return (
                <div key={config.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{config.label}</Label>
                    <span className={cn(
                      'text-sm font-medium tabular-nums',
                      isModified && 'text-blue-600 dark:text-blue-400'
                    )}>
                      {config.format(currentValue)}
                    </span>
                  </div>
                  <Slider
                    value={[currentValue]}
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    onValueChange={([v]) => handleSliderChange(config.key, v)}
                  />
                  {isModified && (
                    <p className="text-xs text-muted-foreground">
                      Base: {config.format(baseValue)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Delta summary */}
          {deltas && (
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

          {hasOverrides && (
            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Reset All
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
