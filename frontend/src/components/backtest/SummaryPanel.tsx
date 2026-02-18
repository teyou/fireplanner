import { Card, CardContent } from '@/components/ui/card'
import type { BacktestSummary } from '@/lib/types'
import { formatCurrency, formatPercent } from '@/lib/utils'

interface SummaryPanelProps {
  summary: BacktestSummary
  computationTimeMs: number
}

export function SummaryPanel({ summary, computationTimeMs }: SummaryPanelProps) {
  const rateColor = summary.success_rate >= 0.95
    ? 'text-green-600'
    : summary.success_rate >= 0.80
    ? 'text-yellow-600'
    : 'text-destructive'

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6 md:pt-6 text-center">
          <p className="text-sm text-muted-foreground">Success Rate</p>
          <p className={`text-3xl font-bold ${rateColor}`}>
            {formatPercent(summary.success_rate, 1)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {summary.successful_periods}/{summary.total_periods} periods
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6 md:pt-6 text-center">
          <p className="text-sm text-muted-foreground">Median Ending Balance</p>
          <p className="text-2xl font-bold">{formatCurrency(summary.median_ending_balance)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6 md:pt-6 text-center">
          <p className="text-sm text-muted-foreground">Worst Start Year</p>
          <p className="text-2xl font-bold text-destructive">{summary.worst_start_year}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6 md:pt-6 text-center">
          <p className="text-sm text-muted-foreground">Avg Total Withdrawn</p>
          <p className="text-2xl font-bold">{formatCurrency(summary.average_total_withdrawn)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Computed in {(computationTimeMs / 1000).toFixed(1)}s
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
