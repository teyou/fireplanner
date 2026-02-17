import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSimulationStore } from '@/stores/useSimulationStore'
import { useWithdrawalComparison, getStrategyLabel } from '@/hooks/useWithdrawalComparison'
import { formatCurrency } from '@/lib/utils'

export function StrategyCard() {
  const selectedStrategy = useSimulationStore((s) => s.selectedStrategy)
  const { results } = useWithdrawalComparison()

  const summary = results?.summaries[selectedStrategy] ?? null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Withdrawal Strategy
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-semibold">{getStrategyLabel(selectedStrategy)}</p>
        {summary ? (
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg. Withdrawal</span>
              <span className="font-medium">{formatCurrency(summary.avgWithdrawal)}/yr</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Survived</span>
              <span className={summary.survived ? 'text-green-600 font-medium' : 'text-destructive font-medium'}>
                {summary.survived ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">
            Set up expenses and net worth to see strategy results.
          </p>
        )}
        <Link
          to="/inputs#section-expenses"
          className="text-xs text-primary hover:underline mt-3 inline-block"
        >
          Compare all 6 strategies
        </Link>
      </CardContent>
    </Card>
  )
}
