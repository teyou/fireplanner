import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatCurrency, formatPercent } from '@/lib/utils'

interface StatusPanelProps {
  fireNumber: number | null
  progress: number | null
  yearsToFire: number | null
  fireAge: number | null
  coastFireNumber: number | null
  baristaFireIncome: number | null
  savingsRate: number | null
  totalNetWorth: number | null
}

export function StatusPanel(props: StatusPanelProps) {
  const cards = [
    { label: 'FIRE Number', value: props.fireNumber != null ? formatCurrency(props.fireNumber) : '—' },
    { label: 'Progress', value: props.progress != null ? formatPercent(props.progress) : '—', progress: props.progress },
    { label: 'Years to FIRE', value: props.yearsToFire != null ? `${props.yearsToFire} years` : '—' },
    { label: 'FIRE Age', value: props.fireAge != null ? `Age ${props.fireAge}` : '—' },
    { label: 'Coast FIRE Number', value: props.coastFireNumber != null ? formatCurrency(props.coastFireNumber) : '—' },
    { label: 'Barista FIRE Income', value: props.baristaFireIncome != null ? `${formatCurrency(props.baristaFireIncome)}/yr` : '—' },
    { label: 'Savings Rate', value: props.savingsRate != null ? formatPercent(props.savingsRate) : '—' },
    { label: 'Total Net Worth', value: props.totalNetWorth != null ? formatCurrency(props.totalNetWorth) : '—' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
            <p className="text-xl font-bold">{card.value}</p>
            {card.progress != null && (
              <Progress value={Math.min(card.progress * 100, 100)} className="mt-2 h-2" />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
