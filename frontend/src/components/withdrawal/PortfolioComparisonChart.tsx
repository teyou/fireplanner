import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts'
import type { DeterministicComparisonResult } from '@/lib/calculations/withdrawal'
import type { WithdrawalStrategyType } from '@/lib/types'
import { getStrategyLabel } from '@/hooks/useWithdrawalComparison'
import { formatCurrency } from '@/lib/utils'

const STRATEGY_COLORS: Record<string, string> = {
  constant_dollar: '#2563eb',
  vpw: '#16a34a',
  guardrails: '#ea580c',
  vanguard_dynamic: '#9333ea',
  cape_based: '#dc2626',
  floor_ceiling: '#0891b2',
}

interface PortfolioComparisonChartProps {
  results: DeterministicComparisonResult
}

export function PortfolioComparisonChart({ results }: PortfolioComparisonChartProps) {
  const strategies = Object.keys(results.yearResults) as WithdrawalStrategyType[]
  if (strategies.length === 0) return null

  const firstStrategy = strategies[0]
  const years = results.yearResults[firstStrategy]
  const data = years.map((yr, i) => {
    const row: Record<string, number> = { age: yr.age }
    for (const s of strategies) {
      row[s] = results.yearResults[s][i]?.portfolio ?? 0
    }
    return row
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Balance Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="age" label={{ value: 'Age', position: 'insideBottom', offset: -5 }} />
            <YAxis tickFormatter={(v: number) => formatCurrency(v)} width={90} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend formatter={(value: string) => getStrategyLabel(value as WithdrawalStrategyType)} />
            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" label="Ruin" />
            {strategies.map((s) => (
              <Line
                key={s}
                type="monotone"
                dataKey={s}
                stroke={STRATEGY_COLORS[s] ?? '#666'}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
