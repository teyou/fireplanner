import { Card, CardContent } from '@/components/ui/card'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
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
      tooltip: summary.peakEarningAge >= 65
        ? 'Highest annual gross income across all years. If still working at or after 65, CPF LIFE payouts are included and may contribute to the peak.'
        : 'Highest annual gross income across all years, including salary and all income streams.',
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
      tooltip: 'How much of your last working year\'s net income your expenses represent. Below 100% means your final salary covers expenses; above 100% means you\'ll need investment income to bridge the gap.',
      formula: 'Annual Expenses / Last Pre-Retirement Net Income',
    },
  ]

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {metrics.map((m) => (
        <Card key={m.label} className="w-[calc(50%-0.375rem)] md:w-[calc(33.333%-0.5rem)] xl:w-[calc(20%-0.6rem)]">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">
              {m.label}
              {'tooltip' in m && m.tooltip && (
                <InfoTooltip text={m.tooltip} formula={'formula' in m ? m.formula : undefined} />
              )}
            </p>
            <p className="text-sm font-semibold mt-1">{m.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
