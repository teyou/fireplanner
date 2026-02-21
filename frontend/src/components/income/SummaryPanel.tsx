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
    <div className="flex flex-wrap justify-center gap-3">
      {metrics.map((m) => (
        <Card key={m.label} className="w-[calc(50%-0.375rem)] md:w-[calc(33.333%-0.5rem)] xl:w-[calc(20%-0.6rem)]">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className="text-sm font-semibold mt-1">{m.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
