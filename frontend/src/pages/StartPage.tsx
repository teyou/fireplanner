import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFireCalculations } from '@/hooks/useFireCalculations'
import { useProjection } from '@/hooks/useProjection'
import { useProfileStore } from '@/stores/useProfileStore'
import { useUIStore } from '@/stores/useUIStore'
import { formatCurrency } from '@/lib/utils'
import { Target, TrendingUp, CheckCircle, Clock, CalendarClock, Landmark } from 'lucide-react'
import type { RetirementPhase } from '@/lib/types'

const PHASE_CARDS: { phase: RetirementPhase; label: string; description: string; icon: typeof Clock }[] = [
  {
    phase: 'before-55',
    label: 'Before 55',
    description: 'CPF still accumulating. No CPF LIFE yet — you\'ll need your portfolio to bridge the gap.',
    icon: Clock,
  },
  {
    phase: '55-to-64',
    label: '55 to 64',
    description: 'Retirement sum locked in. CPF LIFE plan chosen, waiting for payouts to begin.',
    icon: CalendarClock,
  },
  {
    phase: '65-plus',
    label: '65 and above',
    description: 'CPF LIFE payouts active. Enter your known monthly amount directly.',
    icon: Landmark,
  },
]

export function StartPage() {
  const { metrics } = useFireCalculations()
  const { summary: projSummary } = useProjection()
  const currentAge = useProfileStore((s) => s.currentAge)
  const setUIField = useUIStore((s) => s.setField)
  const navigate = useNavigate()
  const [showPhaseCards, setShowPhaseCards] = useState(false)

  // Prefer projection's simulated FIRE age over NPER estimate
  const projFireAge = projSummary?.fireAchievedAge ?? null
  const yearsToFire = projFireAge !== null
    ? Math.max(0, projFireAge - currentAge)
    : metrics?.yearsToFire ?? null

  const setProfileField = useProfileStore((s) => s.setField)

  const handlePathway = (order: 'goal-first' | 'story-first' | 'already-fire') => {
    if (order === 'already-fire') {
      setProfileField('lifeStage', 'post-fire')
      setUIField('sectionOrder', order)
      setShowPhaseCards(true)
      return
    }
    setShowPhaseCards(false)
    setUIField('sectionOrder', order)
    navigate('/inputs')
  }

  const handlePhaseSelect = (phase: RetirementPhase) => {
    setProfileField('retirementPhase', phase)
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

      {/* Retirement phase selection (Already FIRE pathway) */}
      {showPhaseCards && (
        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold">What's your CPF stage?</h2>
            <p className="text-sm text-muted-foreground">
              This determines which CPF inputs are relevant for you.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PHASE_CARDS.map(({ phase, label, description, icon: Icon }) => (
              <button
                key={phase}
                onClick={() => handlePhaseSelect(phase)}
                className="text-left"
              >
                <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg bg-primary/10 p-3">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-lg">{label}</div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </div>
      )}

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
