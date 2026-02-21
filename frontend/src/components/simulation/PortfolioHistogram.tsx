import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import { formatCurrency } from '@/lib/utils'
import type { HistogramSnapshot } from '@/lib/types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'

interface PortfolioHistogramProps {
  snapshots: HistogramSnapshot[]
}

export function PortfolioHistogram({ snapshots }: PortfolioHistogramProps) {
  const [selectedAge, setSelectedAge] = useState(String(snapshots[0]?.age ?? 0))

  const snapshot = snapshots.find(s => String(s.age) === selectedAge) ?? snapshots[0]
  if (!snapshot) return null

  const chartData = snapshot.buckets.map((bucket, i) => ({
    range: formatBucketLabel(bucket.min, bucket.max, i === snapshot.buckets.length - 1),
    count: bucket.count,
    min: bucket.min,
    max: bucket.max,
  }))

  // Summary stats from buckets
  const totalCount = snapshot.buckets.reduce((sum, b) => sum + b.count, 0)
  const weightedSum = snapshot.buckets.reduce((sum, b) => {
    const mid = (b.min + b.max) / 2
    return sum + mid * b.count
  }, 0)
  const mean = totalCount > 0 ? weightedSum / totalCount : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            Portfolio Value Distribution
            <InfoTooltip text="Distribution of portfolio values across all simulations at a selected age. Shows how likely different outcomes are." />
          </CardTitle>
          <Select value={selectedAge} onValueChange={setSelectedAge}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {snapshots.map(s => (
                <SelectItem key={s.age} value={String(s.age)}>
                  Age {s.age}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="range"
              tick={{ fontSize: 10 }}
              interval={Math.max(0, Math.floor(chartData.length / 5) - 1)}
            />
            <YAxis tick={{ fontSize: 11 }} />
            <RechartsTooltip
              formatter={(value: number) => [value, 'Simulations']}
              labelFormatter={(label: string) => `Range: ${label}`}
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-6 mt-2 text-sm text-muted-foreground">
          <span>Mean: <span className="font-medium text-foreground">{formatCurrency(mean)}</span></span>
          <span>Simulations: <span className="font-medium text-foreground">{totalCount.toLocaleString()}</span></span>
        </div>
      </CardContent>
    </Card>
  )
}

function formatBucketLabel(min: number, _max: number, isLast: boolean): string {
  const fmt = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`
    return `$${v.toFixed(0)}`
  }
  if (isLast) return `${fmt(min)}+`
  return fmt(min)
}
