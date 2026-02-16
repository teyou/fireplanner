import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { MitigationImpact } from '@/lib/types'
import { formatPercent } from '@/lib/utils'

interface MitigationPanelProps {
  mitigations: MitigationImpact[]
  baseNormalRate: number
  baseCrisisRate: number
}

export function MitigationPanel({ mitigations, baseNormalRate, baseCrisisRate }: MitigationPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mitigation Strategies</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Baseline reference */}
          <div className="rounded-lg border p-4 space-y-2 bg-muted/30">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Baseline</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Current strategy without mitigation</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Normal:</span>{' '}
                <span className="font-medium">{formatPercent(baseNormalRate, 1)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Crisis:</span>{' '}
                <span className="font-medium">{formatPercent(baseCrisisRate, 1)}</span>
              </div>
            </div>
          </div>

          {mitigations.map((m) => {
            const improvement = m.crisis_success_rate - baseCrisisRate
            return (
              <div key={m.strategy} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={improvement > 0 ? 'default' : 'secondary'}>{m.strategy}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{m.description}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Normal:</span>{' '}
                    <span className="font-medium">{formatPercent(m.normal_success_rate, 1)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Crisis:</span>{' '}
                    <span className="font-medium">{formatPercent(m.crisis_success_rate, 1)}</span>
                  </div>
                </div>
                <div className="text-xs">
                  <span className={improvement > 0 ? 'text-green-600' : improvement < 0 ? 'text-destructive' : 'text-muted-foreground'}>
                    {improvement > 0 ? '+' : ''}{formatPercent(improvement, 1)} crisis success rate
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
