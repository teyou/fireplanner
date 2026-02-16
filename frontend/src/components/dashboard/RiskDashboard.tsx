import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRiskAssessment } from '@/hooks/useRiskAssessment'

const LEVEL_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
}

export function RiskDashboard() {
  const risks = useRiskAssessment()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Assessment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {risks.map((risk) => (
            <div key={risk.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{risk.label}</span>
                <Badge className={LEVEL_COLORS[risk.level]}>
                  {risk.level.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{risk.description}</p>
              <p className="text-xs">{risk.recommendation}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
