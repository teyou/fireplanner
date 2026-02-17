import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFireCalculations } from '@/hooks/useFireCalculations'
import { useProjection } from '@/hooks/useProjection'
import { useProfileStore } from '@/stores/useProfileStore'
import { useUIStore } from '@/stores/useUIStore'
import { formatCurrency } from '@/lib/utils'
import { Target, TrendingUp, CheckCircle } from 'lucide-react'

export function StartPage() {
  const { metrics } = useFireCalculations()
  const { summary: projSummary } = useProjection()
  const currentAge = useProfileStore((s) => s.currentAge)
  const setUIField = useUIStore((s) => s.setField)
  const navigate = useNavigate()

  // Prefer projection's simulated FIRE age over NPER estimate
  const projFireAge = projSummary?.fireAchievedAge ?? null
  const yearsToFire = projFireAge !== null
    ? Math.max(0, projFireAge - currentAge)
    : metrics?.yearsToFire ?? null

  const setProfileField = useProfileStore((s) => s.setField)

  const handlePathway = (order: 'goal-first' | 'story-first' | 'already-fire') => {
    setUIField('sectionOrder', order)
    if (order === 'already-fire') {
      setProfileField('lifeStage', 'post-fire')
    }
    navigate('/inputs')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Singapore FIRE Planner</h1>
        <p className="text-muted-foreground mt-2">
          Plan your path to Financial Independence with Singapore-specific calculations.
        </p>
      </div>

      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(metrics.fireNumber)}
                </div>
                <div className="text-sm text-muted-foreground">FIRE Number</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {yearsToFire !== null && yearsToFire === 0
                    ? 'Achieved!'
                    : yearsToFire !== null && isFinite(yearsToFire)
                      ? `${Math.ceil(yearsToFire)} years`
                      : '—'}
                </div>
                <div className="text-sm text-muted-foreground">Years to FIRE</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pathway cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => handlePathway('goal-first')}
          className="text-left"
        >
          <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-lg">I know when I want to retire</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Set your FIRE targets first, then fill in your financial details to see if you're on track.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </button>

        <button
          onClick={() => handlePathway('story-first')}
          className="text-left"
        >
          <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-lg">Show me what's possible</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter your financial situation and see what retirement age the numbers support.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </button>

        <button
          onClick={() => handlePathway('already-fire')}
          className="text-left"
        >
          <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-lg">I already have enough</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    You've reached or are close to FIRE. Focus on making your money last — withdrawal strategies, allocation, and spending.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </button>
      </div>

      {/* Continue link for returning users */}
      <div className="text-center">
        <Link
          to="/inputs"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Continue planning &rarr;
        </Link>
      </div>
    </div>
  )
}
