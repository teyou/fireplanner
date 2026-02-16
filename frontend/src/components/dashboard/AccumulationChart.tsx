import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import { useDashboardCharts } from '@/hooks/useDashboardCharts'
import { useProfileStore } from '@/stores/useProfileStore'
import { formatCurrency } from '@/lib/utils'

export function AccumulationChart() {
  const { accumulationData, fireNumberLine } = useDashboardCharts()
  const currentAge = useProfileStore((s) => s.currentAge)
  const retirementAge = useProfileStore((s) => s.retirementAge)

  if (accumulationData.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Projection</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={accumulationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="age" label={{ value: 'Age', position: 'insideBottom', offset: -5 }} />
            <YAxis tickFormatter={(v: number) => formatCurrency(v)} width={90} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Area type="monotone" dataKey="value" name="Net Worth" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.2} />
            {fireNumberLine && (
              <ReferenceLine
                y={fireNumberLine}
                stroke="#16a34a"
                strokeDasharray="5 5"
                label={{ value: 'FIRE Number', position: 'right', fill: '#16a34a' }}
              />
            )}
            <ReferenceLine
              x={currentAge}
              stroke="#6b7280"
              strokeDasharray="3 3"
              label={{ value: 'Now', position: 'top', fill: '#6b7280' }}
            />
            <ReferenceLine
              x={retirementAge}
              stroke="#ea580c"
              strokeDasharray="3 3"
              label={{ value: 'Retire', position: 'top', fill: '#ea580c' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
