import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useFireCalculations } from '@/hooks/useFireCalculations'
import { useProjection } from '@/hooks/useProjection'
import { useProfileStore } from '@/stores/useProfileStore'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { useUIStore } from '@/stores/useUIStore'
import { formatCurrency } from '@/lib/utils'
import { Target, TrendingUp, CheckCircle, Clock, CalendarClock, Landmark, ArrowRight, Info, Building, Heart } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { CurrencyInput } from '@/components/shared/CurrencyInput'
import { NumberInput } from '@/components/shared/NumberInput'
import { MetricCard } from '@/components/shared/MetricCard'
import { AnimatedNumber } from '@/components/shared/AnimatedNumber'
import { Label } from '@/components/ui/label'
import type { RetirementPhase } from '@/lib/types'
import { useSectionCompletion } from '@/hooks/useSectionCompletion'

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
  const { sections } = useSectionCompletion()
  const profileStore = useProfileStore()
  const incomeStore = useIncomeStore()
  const setUIField = useUIStore((s) => s.setField)
  const cpfEnabled = useUIStore((s) => s.cpfEnabled)
  const propertyEnabled = useUIStore((s) => s.propertyEnabled)
  const healthcareEnabled = useUIStore((s) => s.healthcareEnabled)
  const navigate = useNavigate()
  const [activePathway, setActivePathway] = useState<ActivePathway>(null)

  // Local draft state for inline forms
  const [draftAge, setDraftAge] = useState(profileStore.currentAge)
  const [draftRetirementAge, setDraftRetirementAge] = useState(profileStore.retirementAge)
  const [draftIncome, setDraftIncome] = useState(profileStore.annualIncome)
  const [draftNetWorth, setDraftNetWorth] = useState(profileStore.liquidNetWorth)

  const usingDefaults = !sections['section-personal'].isComplete
    && !sections['section-income'].isComplete
    && !sections['section-expenses'].isComplete
    && !sections['section-net-worth'].isComplete

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
    profileStore.setField('annualExpenses', Math.round(draftIncome * 0.667 / 1000) * 1000)
    profileStore.setField('liquidNetWorth', draftNetWorth)
    profileStore.setField('lifeStage', 'pre-fire')
    incomeStore.setField('annualSalary', draftIncome)
    setUIField('sectionOrder', 'story-first')
    navigate('/inputs')
  }

  const handleAlreadyFirePhase = (phase: RetirementPhase) => {
    profileStore.setField('currentAge', draftAge)
    profileStore.setField('retirementAge', draftAge)
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
      <div className="py-8">
        <h1 className="text-3xl font-bold">Singapore FIRE Planner</h1>
        <p className="text-muted-foreground mt-2 text-base">
          Plan your path to Financial Independence with Singapore-specific calculations.
        </p>
      </div>

      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Quick Overview
              {usingDefaults && (
                <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                  <Info className="h-3 w-3" />
                  based on defaults
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <MetricCard
                label="FIRE Number"
                variant="elevated"
                accent="primary"
                value={
                  <AnimatedNumber
                    value={metrics.fireNumber}
                    format={formatCurrency}
                    className="text-primary"
                  />
                }
              />
              <MetricCard
                label="Years to FIRE"
                variant="elevated"
                accent="primary"
                value={
                  yearsToFire !== null && yearsToFire === 0
                    ? <span className="text-success">Achieved!</span>
                    : yearsToFire !== null && isFinite(yearsToFire)
                      ? <AnimatedNumber
                          value={Math.ceil(yearsToFire)}
                          format={(n) => `${Math.round(n)} years`}
                          className="text-primary"
                        />
                      : <span>—</span>
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pathway cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pathwayCards.map(({ key, label, description, icon: Icon }, index) => (
          <button
            key={key}
            onClick={() => handlePathwayClick(key as ActivePathway)}
            className="text-left opacity-0 animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <Card className={`h-full transition-all duration-200 cursor-pointer ${
              activePathway === key
                ? 'border-2 border-primary shadow-md'
                : 'hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5'
            }`}>
              <CardContent className="py-6 md:py-6">
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
        <Card className="bg-muted/30">
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
        <Card className="bg-muted/30">
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
          <Card className="bg-muted/30">
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
              {PHASE_CARDS.map(({ phase, label, description, icon: Icon }, index) => (
                <button
                  key={phase}
                  onClick={() => handleAlreadyFirePhase(phase)}
                  disabled={!alreadyFireValid}
                  className="text-left disabled:opacity-50 disabled:cursor-not-allowed opacity-0 animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Card className="h-full hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                    <CardContent className="py-6 md:py-6">
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

      {/* Section toggles — visible after picking a pathway */}
      {activePathway !== null && (
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">Customise your plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Landmark className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">CPF Integration</div>
                  <p className="text-xs text-muted-foreground">CPF balances, contributions, and LIFE payouts</p>
                </div>
              </div>
              <Switch
                checked={cpfEnabled}
                onCheckedChange={(v) => setUIField('cpfEnabled', v)}
              />
            </div>
            {cpfEnabled && (
              <div className="flex items-center justify-between ml-4 pl-4 border-l-2 border-muted-foreground/20">
                <div className="flex items-center gap-3">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Healthcare Planning</div>
                    <p className="text-xs text-muted-foreground">MediShield, CareShield, and out-of-pocket estimates</p>
                  </div>
                </div>
                <Switch
                  checked={healthcareEnabled}
                  onCheckedChange={(v) => setUIField('healthcareEnabled', v)}
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Property Analysis</div>
                  <p className="text-xs text-muted-foreground">Existing property, mortgage tracking, and purchase analysis</p>
                </div>
              </div>
              <Switch
                checked={propertyEnabled}
                onCheckedChange={(v) => setUIField('propertyEnabled', v)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Continue link for returning users */}
      <div className="text-center">
        <Button variant="ghost" size="sm" asChild>
          <Link
            to="/inputs"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Continue planning
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
