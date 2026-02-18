import { Link } from 'react-router-dom'
import { MetricCard } from '@/components/shared/MetricCard'
import { AnimatedNumber } from '@/components/shared/AnimatedNumber'
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

type MetricAccent = 'primary' | 'success' | 'warning'

function getProgressAccent(progress: number | null): MetricAccent {
  if (progress == null) return 'primary'
  return progress < 0.5 ? 'warning' : 'success'
}

export function StatusPanel(props: StatusPanelProps) {
  const cards: {
    label: string
    value: React.ReactNode
    progress?: number | null
    href?: string
    accent: MetricAccent
  }[] = [
    {
      label: 'FIRE Number',
      value: props.fireNumber != null
        ? <AnimatedNumber value={props.fireNumber} format={formatCurrency} />
        : '—',
      href: '/inputs#section-fire-settings',
      accent: 'primary',
    },
    {
      label: 'Progress',
      value: props.progress != null
        ? <AnimatedNumber value={props.progress} format={formatPercent} />
        : '—',
      progress: props.progress,
      accent: getProgressAccent(props.progress),
    },
    {
      label: 'Years to FIRE',
      value: props.yearsToFire != null
        ? <AnimatedNumber value={props.yearsToFire} format={(n) => `${Math.round(n)} years`} />
        : '—',
      accent: 'primary',
    },
    {
      label: 'FIRE Age',
      value: props.fireAge != null
        ? <AnimatedNumber value={props.fireAge} format={(n) => `Age ${Math.round(n)}`} />
        : '—',
      accent: 'primary',
    },
    {
      label: 'Coast FIRE Number',
      value: props.coastFireNumber != null
        ? <AnimatedNumber value={props.coastFireNumber} format={formatCurrency} />
        : '—',
      accent: 'primary',
    },
    {
      label: 'Barista FIRE Income',
      value: props.baristaFireIncome != null
        ? <AnimatedNumber value={props.baristaFireIncome} format={(n) => `${formatCurrency(n)}/yr`} />
        : '—',
      accent: 'primary',
    },
    {
      label: 'Savings Rate',
      value: props.savingsRate != null
        ? <AnimatedNumber value={props.savingsRate} format={formatPercent} />
        : '—',
      accent: 'primary',
    },
    {
      label: 'Total Net Worth',
      value: props.totalNetWorth != null
        ? <AnimatedNumber value={props.totalNetWorth} format={formatCurrency} />
        : '—',
      href: '/inputs#section-net-worth',
      accent: 'primary',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <MetricCard
          key={card.label}
          label={card.label}
          variant="elevated"
          accent={card.accent}
          className="hover:shadow-md transition-shadow"
          value={
            card.href ? (
              <Link to={card.href} className="hover:underline">
                {card.value}
              </Link>
            ) : (
              card.value
            )
          }
          progress={card.progress}
        />
      ))}
    </div>
  )
}
