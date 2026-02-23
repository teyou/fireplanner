import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DeterministicComparisonResult } from '@/lib/calculations/withdrawal'
import type { WithdrawalStrategyType } from '@/lib/types'
import { getStrategyLabel } from '@/hooks/useWithdrawalComparison'
import { formatCurrency } from '@/lib/utils'

interface ComparisonTableProps {
  results: DeterministicComparisonResult
}

export function ComparisonTable({ results }: ComparisonTableProps) {
  const strategies = Object.keys(results.summaries) as WithdrawalStrategyType[]

  if (strategies.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Strategy Comparison Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4 font-medium">Strategy</th>
                <th className="text-right py-2 px-2 font-medium">Avg Withdrawal</th>
                <th className="text-right py-2 px-2 font-medium">Min</th>
                <th className="text-right py-2 px-2 font-medium">Max</th>
                <th className="text-right py-2 px-2 font-medium">Std Dev</th>
                <th className="text-right py-2 px-2 font-medium">Total Withdrawn</th>
                <th className="text-right py-2 px-2 font-medium">Terminal Portfolio</th>
                <th className="text-right py-2 pl-2 font-medium">Survived</th>
              </tr>
            </thead>
            <tbody>
              {strategies.map((strategy) => {
                const s = results.summaries[strategy]
                return (
                  <tr key={strategy} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{getStrategyLabel(strategy)}</td>
                    <td className="text-right py-2 px-2">{formatCurrency(s.avgWithdrawal)}</td>
                    <td className="text-right py-2 px-2">{formatCurrency(s.minWithdrawal)}</td>
                    <td className="text-right py-2 px-2">{formatCurrency(s.maxWithdrawal)}</td>
                    <td className="text-right py-2 px-2">{formatCurrency(s.stdDevWithdrawal)}</td>
                    <td className="text-right py-2 px-2">{formatCurrency(s.totalWithdrawn)}</td>
                    <td className="text-right py-2 px-2">{formatCurrency(s.terminalPortfolio)}</td>
                    <td className="text-right py-2 pl-2">
                      <span className={s.survived ? 'text-green-600' : 'text-destructive'}>
                        {s.survived ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
