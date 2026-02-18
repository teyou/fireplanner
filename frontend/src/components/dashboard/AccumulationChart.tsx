import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import { useDashboardCharts } from '@/hooks/useDashboardCharts'
import { useProfileStore } from '@/stores/useProfileStore'
import { useChartColors } from '@/lib/chartTheme'
import { ChartSkeleton } from '@/components/shared/ChartSkeleton'
import { formatCurrency } from '@/lib/utils'

export function AccumulationChart() {
  const { accumulationData, fireNumberLine } = useDashboardCharts()
  const currentAge = useProfileStore((s) => s.currentAge)
  const retirementAge = useProfileStore((s) => s.retirementAge)
  const colors = useChartColors()

  if (accumulationData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartSkeleton className="h-56 md:h-72 lg:h-[350px]" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Projection</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56 md:h-72 lg:h-[350px]" role="img" aria-label="Portfolio projection chart showing liquid and CPF net worth over time">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={accumulationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="age" label={{ value: 'Age', position: 'insideBottom', offset: -5 }} />
            <YAxis tickFormatter={(v: number) => formatCurrency(v)} width={90} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Area
              type="monotone"
              dataKey="value"
              name="Net Worth"
              stroke={colors.primary}
              fill={colors.primary}
              fillOpacity={0.2}
              isAnimationActive
              animationDuration={800}
            />
            {fireNumberLine && (
              <ReferenceLine
                y={fireNumberLine}
                stroke={colors.success}
                strokeDasharray="5 5"
                label={{ value: 'FIRE Number', position: 'right', fill: colors.success }}
              />
            )}
            <ReferenceLine
              x={currentAge}
              stroke={colors.muted}
              strokeDasharray="3 3"
              label={{ value: 'Now', position: 'top', fill: colors.muted }}
            />
            <ReferenceLine
              x={retirementAge}
              stroke={colors.warning}
              strokeDasharray="3 3"
              label={{ value: 'Retire', position: 'top', fill: colors.warning }}
            />
          </AreaChart>
        </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
