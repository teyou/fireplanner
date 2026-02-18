import { useMemo } from 'react'

function getCSSColor(varName: string): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim()
  return raw ? `hsl(${raw})` : ''
}

export interface ChartColors {
  primary: string
  success: string
  warning: string
  danger: string
  muted: string
  fan: [string, string, string, string]
  strategy: [string, string, string, string, string, string]
}

export function useChartColors(): ChartColors {
  return useMemo(() => ({
    primary: getCSSColor('--chart-primary'),
    success: getCSSColor('--chart-success'),
    warning: getCSSColor('--chart-warning'),
    danger: getCSSColor('--chart-danger'),
    muted: getCSSColor('--chart-muted'),
    fan: [
      getCSSColor('--chart-fan-1'),
      getCSSColor('--chart-fan-2'),
      getCSSColor('--chart-fan-3'),
      getCSSColor('--chart-fan-4'),
    ],
    strategy: [
      getCSSColor('--chart-strategy-1'),
      getCSSColor('--chart-strategy-2'),
      getCSSColor('--chart-strategy-3'),
      getCSSColor('--chart-strategy-4'),
      getCSSColor('--chart-strategy-5'),
      getCSSColor('--chart-strategy-6'),
    ],
  }), [])
}

export const STRATEGY_COLORS = [
  'hsl(var(--chart-strategy-1))',
  'hsl(var(--chart-strategy-2))',
  'hsl(var(--chart-strategy-3))',
  'hsl(var(--chart-strategy-4))',
  'hsl(var(--chart-strategy-5))',
  'hsl(var(--chart-strategy-6))',
] as const
