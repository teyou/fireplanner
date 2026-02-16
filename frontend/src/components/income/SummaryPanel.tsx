import { Card, CardContent } from '@/components/ui/card'
import type { IncomeSummaryStats } from '@/lib/types'
import { formatCurrency, formatPercent } from '@/lib/utils'

interface SummaryPanelProps {
  summary: IncomeSummaryStats
}

export function SummaryPanel({ summary }: SummaryPanelProps) {
  const metrics = [
    {
      label: 'Peak Earning',
      value: `${formatCurrency(summary.peakEarningAmount)} (age ${summary.peakEarningAge})`,
    },
    {
      label: 'Lifetime Earnings',
      value: formatCurrency(summary.lifetimeEarnings),
    },
    {
      label: 'Avg Savings Rate',
      value: formatPercent(summary.averageSavingsRate),
    },
    {
      label: 'Total CPF Contributions',
      value: formatCurrency(summary.totalCpfContributions),
    },
    {
      label: 'Income Replacement Ratio',
      value: formatPercent(summary.incomeReplacementRatio),
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {metrics.map((m) => (
        <Card key={m.label}>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className="text-sm font-semibold mt-1">{m.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
