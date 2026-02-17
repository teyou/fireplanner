import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { PercentileBands } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

interface CrisisComparisonChartProps {
  normalBands: PercentileBands
  crisisBands: PercentileBands
}

export function CrisisComparisonChart({ normalBands, crisisBands }: CrisisComparisonChartProps) {
  const data = normalBands.ages.map((age, i) => ({
    age,
    normalP50: normalBands.p50[i],
    normalP25: normalBands.p25[i],
    normalP75: normalBands.p75[i],
    crisisP50: crisisBands.p50[i],
    crisisP25: crisisBands.p25[i],
    crisisP75: crisisBands.p75[i],
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Normal vs Crisis Portfolio Path</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 md:h-80 lg:h-[400px]" role="img" aria-label="Chart comparing normal portfolio path versus crisis scenario">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="age" label={{ value: 'Age', position: 'insideBottom', offset: -5 }} />
            <YAxis tickFormatter={(v: number) => formatCurrency(v)} width={90} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Line type="monotone" dataKey="normalP50" name="Normal (p50)" stroke="#16a34a" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="normalP25" name="Normal (p25)" stroke="#16a34a" strokeWidth={1} strokeDasharray="4 4" dot={false} />
            <Line type="monotone" dataKey="normalP75" name="Normal (p75)" stroke="#16a34a" strokeWidth={1} strokeDasharray="4 4" dot={false} />
            <Line type="monotone" dataKey="crisisP50" name="Crisis (p50)" stroke="#dc2626" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="crisisP25" name="Crisis (p25)" stroke="#dc2626" strokeWidth={1} strokeDasharray="4 4" dot={false} />
            <Line type="monotone" dataKey="crisisP75" name="Crisis (p75)" stroke="#dc2626" strokeWidth={1} strokeDasharray="4 4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
