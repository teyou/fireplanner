import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { useChartColors } from '@/lib/chartTheme'
import { formatCurrency } from '@/lib/utils'

interface ProjectionPoint {
  age: number
  balance: number
  phase: 'accumulation' | 'decumulation'
}

interface QuickProjectionChartProps {
  data: ProjectionPoint[]
  fireNumber: number
  fireAge: number
}

export function QuickProjectionChart({ data, fireNumber, fireAge }: QuickProjectionChartProps) {
  const colors = useChartColors()

  // Split into two series so Recharts colors them independently.
  // The crossover point appears in both series so the areas connect.
  const chartData = data.map((pt) => ({
    age: pt.age,
    accumulation: pt.phase === 'accumulation' || pt.age === fireAge ? pt.balance : undefined,
    decumulation: pt.phase === 'decumulation' || pt.age === fireAge ? pt.balance : undefined,
  }))

  return (
    <div className="mt-4 space-y-2">
      <div className="h-48 md:h-56" role="img" aria-label="Net worth projection from current age to life expectancy">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 15 }}>
            <XAxis
              dataKey="age"
              tick={{ fontSize: 11 }}
              label={{ value: 'Age', position: 'insideBottom', offset: -3, fontSize: 11 }}
            />
            <YAxis
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11 }}
              width={60}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(age: number) => `Age ${age}`}
            />
            <Area
              type="monotone"
              dataKey="accumulation"
              name="Growing"
              stroke={colors.primary}
              fill={colors.primary}
              fillOpacity={0.2}
              connectNulls={false}
              isAnimationActive
              animationDuration={800}
            />
            <Area
              type="monotone"
              dataKey="decumulation"
              name="Spending"
              stroke={colors.warning}
              fill={colors.warning}
              fillOpacity={0.2}
              connectNulls={false}
              isAnimationActive
              animationDuration={800}
            />
            <ReferenceLine
              y={fireNumber}
              stroke={colors.success}
              strokeDasharray="5 5"
              label={{ value: 'FIRE #', position: 'right', fill: colors.success, fontSize: 11 }}
            />
            <ReferenceLine
              x={fireAge}
              stroke={colors.warning}
              strokeDasharray="3 3"
              label={{ value: 'FIRE', position: 'top', fill: colors.warning, fontSize: 11 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: colors.primary }} />
          Growing
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: colors.warning }} />
          Spending
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-1 border-t-2 border-dashed" style={{ borderColor: colors.success }} />
          FIRE Number
        </span>
      </div>
    </div>
  )
}
