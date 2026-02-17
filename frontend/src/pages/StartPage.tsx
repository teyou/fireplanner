import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useFireCalculations } from '@/hooks/useFireCalculations'
import { useProjection } from '@/hooks/useProjection'
import { useProfileStore } from '@/stores/useProfileStore'
import { useUIStore } from '@/stores/useUIStore'
import { formatCurrency } from '@/lib/utils'
import { Target, TrendingUp, CheckCircle, Clock, CalendarClock, Landmark, ArrowRight } from 'lucide-react'
import { CurrencyInput } from '@/components/shared/CurrencyInput'
import { NumberInput } from '@/components/shared/NumberInput'
import { Label } from '@/components/ui/label'
import type { RetirementPhase } from '@/lib/types'

type ActivePathway = 'goal-first' | 'story-first' | 'already-fire' | null

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
  const profileStore = useProfileStore()
  const setUIField = useUIStore((s) => s.setField)
  const navigate = useNavigate()
  const [activePathway, setActivePathway] = useState<ActivePathway>(null)

  // Local draft state for inline forms
  const [draftAge, setDraftAge] = useState(profileStore.currentAge)
  const [draftRetirementAge, setDraftRetirementAge] = useState(profileStore.retirementAge)
  const [draftIncome, setDraftIncome] = useState(profileStore.annualIncome)
  const [draftNetWorth, setDraftNetWorth] = useState(profileStore.liquidNetWorth)

  // Prefer projection's simulated FIRE age over NPER estimate
  const projFireAge = projSummary?.fireAchievedAge ?? null
  const yearsToFire = projFireAge !== null
    ? Math.max(0, projFireAge - profileStore.currentAge)
    : metrics?.yearsToFire ?? null

  const handlePathwayClick = (pathway: ActivePathway) => {
    if (activePathway === pathway) {
      // Toggle off if clicking the same one
      setActivePathway(null)
      return
    }
    setActivePathway(pathway)
    // Reset drafts to current store values
    setDraftAge(profileStore.currentAge)
    setDraftRetirementAge(profileStore.retirementAge)
    setDraftIncome(profileStore.annualIncome)
    setDraftNetWorth(profileStore.liquidNetWorth)
  }

  const handleGoalFirstContinue = () => {
    profileStore.setField('currentAge', draftAge)
    profileStore.setField('retirementAge', draftRetirementAge)
    profileStore.setField('liquidNetWorth', draftNetWorth)
    profileStore.setField('lifeStage', 'pre-fire')
    setUIField('sectionOrder', 'goal-first')
    navigate('/inputs')
  }

  const handleStoryFirstContinue = () => {
    profileStore.setField('currentAge', draftAge)
    profileStore.setField('annualIncome', draftIncome)
    profileStore.setField('liquidNetWorth', draftNetWorth)
    profileStore.setField('lifeStage', 'pre-fire')
    setUIField('sectionOrder', 'story-first')
    navigate('/inputs')
  }

  const handleAlreadyFirePhase = (phase: RetirementPhase) => {
    profileStore.setField('currentAge', draftAge)
    profileStore.setField('liquidNetWorth', draftNetWorth)
    profileStore.setField('lifeStage', 'post-fire')
    profileStore.setField('retirementPhase', phase)
    setUIField('sectionOrder', 'already-fire')
    navigate('/inputs')
  }

  const pathwayCards: { key: ActivePathway & string; label: string; description: string; icon: typeof Target }[] = [
    {
      key: 'goal-first',
      label: 'I know when I want to retire',
      description: 'Set your FIRE targets first, then fill in your financial details to see if you\'re on track.',
      icon: Target,
    },
    {
      key: 'story-first',
      label: 'Show me what\'s possible',
      description: 'Enter your financial situation and see what retirement age the numbers support.',
      icon: TrendingUp,
    },
    {
      key: 'already-fire',
      label: 'I already have enough',
      description: 'You\'ve reached or are close to FIRE. Focus on making your money last — withdrawal strategies, allocation, and spending.',
      icon: CheckCircle,
    },
  ]

  const goalFirstValid = draftAge >= 18 && draftAge <= 100
    && draftRetirementAge > draftAge && draftRetirementAge <= 100

  const storyFirstValid = draftAge >= 18 && draftAge <= 100
    && draftIncome >= 0

  const alreadyFireValid = draftAge >= 18 && draftAge <= 100

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
        {pathwayCards.map(({ key, label, description, icon: Icon }) => (
          <button
            key={key}
            onClick={() => handlePathwayClick(key as ActivePathway)}
            className="text-left"
          >
            <Card className={`h-full transition-all cursor-pointer ${
              activePathway === key
                ? 'border-primary shadow-md'
                : 'hover:border-primary/50 hover:shadow-md'
            }`}>
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

      {/* Goal-first inline form */}
      {activePathway === 'goal-first' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-sm">Current Age</Label>
                <NumberInput
                  integer
                  min={18}
                  max={100}
                  value={draftAge}
                  onChange={setDraftAge}
                  className="border-blue-300"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Desired Retirement Age</Label>
                <NumberInput
                  integer
                  min={draftAge + 1}
                  max={100}
                  value={draftRetirementAge}
                  onChange={setDraftRetirementAge}
                  className="border-blue-300"
                />
                {draftRetirementAge <= draftAge && (
                  <p className="text-xs text-destructive">Must be after current age</p>
                )}
              </div>
              <CurrencyInput
                label="Liquid Net Worth"
                value={draftNetWorth}
                onChange={setDraftNetWorth}
                tooltip="Cash, stocks, bonds — excluding CPF and property"
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleGoalFirstContinue}
                disabled={!goalFirstValid}
              >
                Continue to planning
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Story-first inline form */}
      {activePathway === 'story-first' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-sm">Current Age</Label>
                <NumberInput
                  integer
                  min={18}
                  max={100}
                  value={draftAge}
                  onChange={setDraftAge}
                  className="border-blue-300"
                />
              </div>
              <CurrencyInput
                label="Annual Income"
                value={draftIncome}
                onChange={setDraftIncome}
                tooltip="Total annual income before tax and CPF"
              />
              <CurrencyInput
                label="Liquid Net Worth"
                value={draftNetWorth}
                onChange={setDraftNetWorth}
                tooltip="Cash, stocks, bonds — excluding CPF and property"
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleStoryFirstContinue}
                disabled={!storyFirstValid}
              >
                Continue to planning
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Already FIRE: age + net worth, then phase cards */}
      {activePathway === 'already-fire' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                <div className="space-y-1">
                  <Label className="text-sm">Current Age</Label>
                  <NumberInput
                    integer
                    min={18}
                    max={100}
                    value={draftAge}
                    onChange={setDraftAge}
                    className="border-blue-300"
                  />
                </div>
                <CurrencyInput
                  label="Liquid Portfolio"
                  value={draftNetWorth}
                  onChange={setDraftNetWorth}
                  tooltip="Cash, stocks, bonds — excluding CPF and property"
                />
              </div>
            </CardContent>
          </Card>

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
                  onClick={() => handleAlreadyFirePhase(phase)}
                  disabled={!alreadyFireValid}
                  className="text-left disabled:opacity-50 disabled:cursor-not-allowed"
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
