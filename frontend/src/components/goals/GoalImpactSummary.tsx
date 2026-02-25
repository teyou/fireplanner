import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import { useProjection } from '@/hooks/useProjection'
import { generateProjection } from '@/lib/calculations/projection'
import { useProfileStore } from '@/stores/useProfileStore'
import { formatCurrency } from '@/lib/utils'

/**
 * Shows the impact of financial goals on FIRE timeline by comparing
 * projection with goals vs projection without goals.
 *
 * Reuses the exact ProjectionParams from useProjection to ensure
 * an apples-to-apples comparison — only financialGoals differs.
 */
export function GoalImpactSummary() {
  const profile = useProfileStore()
  const { summary: withGoalsSummary, params: projectionParams } = useProjection()

  const noGoalsSummary = useMemo(() => {
    if (!projectionParams) return null
    if (profile.financialGoals.length === 0) return null

    const { summary } = generateProjection({
      ...projectionParams,
      financialGoals: [],  // Only difference: no goals
    })

    return summary
  }, [projectionParams, profile.financialGoals])

  // Don't show if there are no goals or no data
  if (profile.financialGoals.length === 0) return null
  if (!withGoalsSummary || !noGoalsSummary) return null

  const fireAgeWith = withGoalsSummary.fireAchievedAge
  const fireAgeWithout = noGoalsSummary.fireAchievedAge
  const terminalWith = withGoalsSummary.terminalLiquidNW
  const terminalWithout = noGoalsSummary.terminalLiquidNW

  const totalGoalCost = profile.financialGoals.reduce((sum, g) => sum + g.amount, 0)

  // Compute FIRE delay
  let fireDelayText: string
  let fireDelayColor: string
  if (fireAgeWith === null && fireAgeWithout === null) {
    fireDelayText = 'FIRE not achieved in either scenario'
    fireDelayColor = 'text-muted-foreground'
  } else if (fireAgeWith === null && fireAgeWithout !== null) {
    fireDelayText = `Goals prevent FIRE (was age ${fireAgeWithout})`
    fireDelayColor = 'text-destructive'
  } else if (fireAgeWith !== null && fireAgeWithout === null) {
    fireDelayText = `FIRE at age ${fireAgeWith} (not reachable without goals adjustment)`
    fireDelayColor = 'text-muted-foreground'
  } else if (fireAgeWith !== null && fireAgeWithout !== null) {
    const delay = fireAgeWith - fireAgeWithout
    if (delay === 0) {
      fireDelayText = `No delay — FIRE at age ${fireAgeWith}`
      fireDelayColor = 'text-green-600 dark:text-green-400'
    } else if (delay > 0) {
      fireDelayText = `FIRE delayed from age ${fireAgeWithout} to ${fireAgeWith} (+${delay} year${delay > 1 ? 's' : ''})`
      fireDelayColor = 'text-amber-600 dark:text-amber-400'
    } else {
      // Goals somehow accelerate FIRE (unlikely but handle)
      fireDelayText = `FIRE at age ${fireAgeWith} (${Math.abs(delay)} year${Math.abs(delay) > 1 ? 's' : ''} earlier)`
      fireDelayColor = 'text-green-600 dark:text-green-400'
    }
  } else {
    fireDelayText = ''
    fireDelayColor = ''
  }

  const portfolioDelta = terminalWith - terminalWithout

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Goal Impact
          <InfoTooltip text="Shows how your financial goals affect your FIRE timeline and terminal portfolio." />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Total Goal Cost</p>
            <p className="text-lg font-semibold">{formatCurrency(totalGoalCost)}</p>
            <p className="text-xs text-muted-foreground">
              across {profile.financialGoals.length} goal{profile.financialGoals.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">FIRE Timeline</p>
            <p className={`text-sm font-medium ${fireDelayColor}`}>{fireDelayText}</p>
          </div>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Terminal Portfolio Impact</p>
          <p className="text-sm">
            <span className="font-semibold">{formatCurrency(terminalWith)}</span>
            <span className="text-muted-foreground"> vs </span>
            <span className="font-semibold">{formatCurrency(terminalWithout)}</span>
            <span className="text-muted-foreground"> without goals </span>
            <span className={portfolioDelta < 0 ? 'text-destructive' : 'text-green-600 dark:text-green-400'}>
              ({portfolioDelta >= 0 ? '+' : ''}{formatCurrency(portfolioDelta)})
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
