import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import type { SpendingMetrics } from '@/lib/types'
import { formatPercent } from '@/lib/utils'

interface SpendingMetricsPanelProps {
  metrics: SpendingMetrics
  nSimulations: number
}

function metricColor(value: number, invert = false): string {
  const threshold = invert ? 1 - value : value
  if (threshold <= 0.1) return 'text-green-600'
  if (threshold <= 0.3) return 'text-yellow-600'
  return 'text-red-600'
}

export function SpendingMetricsPanel({ metrics, nSimulations }: SpendingMetricsPanelProps) {
  const count = (frac: number) => Math.round(frac * nSimulations).toLocaleString()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          Spending & Portfolio Metrics
          <InfoTooltip text="Additional insights from the simulation: how stable is your spending, and how does your portfolio end up across scenarios?" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Volatile Spending"
            value={formatPercent(metrics.volatileSpending, 1)}
            color={metricColor(metrics.volatileSpending)}
            description={`${count(metrics.volatileSpending)} of ${nSimulations.toLocaleString()} sims had a year with >25% spending change`}
          />
          <MetricCard
            label="Low Spending Risk"
            value={formatPercent(metrics.smallSpending, 1)}
            color={metricColor(metrics.smallSpending)}
            description={`${count(metrics.smallSpending)} sims had spending drop below 50% of initial`}
          />
          <MetricCard
            label="Large End Portfolio"
            value={formatPercent(metrics.largeEndPortfolio, 1)}
            color={metricColor(metrics.largeEndPortfolio, true)}
            description={`${count(metrics.largeEndPortfolio)} sims ended with >2x initial portfolio`}
          />
          <MetricCard
            label="Small End Portfolio"
            value={formatPercent(metrics.smallEndPortfolio, 1)}
            color={metricColor(metrics.smallEndPortfolio)}
            description={`${count(metrics.smallEndPortfolio)} sims ended with <50% of initial (nonzero)`}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function MetricCard({ label, value, color, description }: {
  label: string
  value: string
  color: string
  description: string
}) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
      <div className="text-xs text-muted-foreground mt-1">{description}</div>
    </div>
  )
}
