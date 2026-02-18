import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

type MetricCardVariant = 'default' | 'elevated' | 'flat'
type MetricCardAccent = 'primary' | 'success' | 'warning' | 'destructive'

interface MetricCardProps {
  label: string
  value: React.ReactNode
  subtitle?: string
  progress?: number | null
  variant?: MetricCardVariant
  accent?: MetricCardAccent
  className?: string
  children?: React.ReactNode
}

const ACCENT_BORDER: Record<MetricCardAccent, string> = {
  primary: 'border-l-primary',
  success: 'border-l-success',
  warning: 'border-l-warning',
  destructive: 'border-l-destructive',
}

export function MetricCard({
  label,
  value,
  subtitle,
  progress,
  variant = 'default',
  accent,
  className,
  children,
}: MetricCardProps) {
  const isElevated = variant === 'elevated'
  const isFlat = variant === 'flat'

  return (
    <Card
      className={cn(
        'transition-shadow',
        isElevated && 'shadow-elevated hover:shadow-md',
        isElevated && accent && `border-l-[3px] ${ACCENT_BORDER[accent]}`,
        isFlat && 'bg-muted/30 shadow-none border-transparent',
        className,
      )}
    >
      <CardContent className="pt-5 pb-4 md:pt-5 md:pb-4">
        <p className="text-xs text-muted-foreground mb-1.5">{label}</p>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {progress != null && (
          <Progress value={Math.min(progress * 100, 100)} className="mt-2 h-2" />
        )}
        {children}
      </CardContent>
    </Card>
  )
}
