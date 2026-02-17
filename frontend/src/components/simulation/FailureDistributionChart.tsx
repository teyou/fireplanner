import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { FailureDistribution } from '@/lib/types'

interface FailureDistributionChartProps {
  distribution: FailureDistribution
  nSimulations: number
}

export function FailureDistributionChart({ distribution, nSimulations }: FailureDistributionChartProps) {
  if (distribution.total_failures === 0) {
    return null
  }

  const data = distribution.buckets.map((bucket, i) => ({
    name: bucket,
    failures: distribution.counts[i],
    pct: ((distribution.counts[i] / nSimulations) * 100).toFixed(1),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Failure Distribution by Decade</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48 md:h-56 lg:h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis />
            <Tooltip
              formatter={(value: number) => [
                `${value} failures`,
                'Ruin probability',
              ]}
            />
            <Bar dataKey="failures" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
