import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useProfileStore } from '@/stores/useProfileStore'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { useUIStore } from '@/stores/useUIStore'
import { calculateFireNumber, calculateYearsToFire } from '@/lib/calculations/fire'
import { Target, TrendingUp, CheckCircle, Clock, CalendarClock, Landmark, ArrowRight, Building, Heart } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
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
  const [draftExpenses, setDraftExpenses] = useState(profileStore.annualExpenses)

  // Compute preliminary FIRE metrics from draft values
  const DEFAULT_SWR = 0.04
  const DEFAULT_RETURN = 0.07
  const DEFAULT_INFLATION = 0.025
  const DEFAULT_EXPENSE_RATIO = 0.003

  const draftFireNumber = calculateFireNumber(draftExpenses, DEFAULT_SWR)
  const draftNetRealReturn = DEFAULT_RETURN - DEFAULT_INFLATION - DEFAULT_EXPENSE_RATIO
  const draftAnnualSavings = draftIncome - draftExpenses
  const draftYearsToFire = calculateYearsToFire(
    draftNetRealReturn,
    draftAnnualSavings,
    draftNetWorth,
    draftFireNumber
  )
  const draftFireAge = draftAge + Math.ceil(draftYearsToFire)
  const draftSavingsRate = draftIncome > 0 ? draftAnnualSavings / draftIncome : 0
  const draftProgress = draftFireNumber > 0 ? Math.min(1, draftNetWorth / draftFireNumber) : 0

  // Show results when inputs are filled and valid
  const showResults = draftAge >= 18 && draftIncome > 0 && draftExpenses > 0
    && draftAnnualSavings > 0 && draftFireNumber > 0
    && isFinite(draftYearsToFire) && draftYearsToFire > 0

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
    setDraftExpenses(profileStore.annualExpenses)
    setDraftNetWorth(profileStore.liquidNetWorth)
  }

  const handleGoalFirstContinue = () => {
    profileStore.setField('currentAge', draftAge)
    profileStore.setField('retirementAge', draftRetirementAge)
    profileStore.setField('annualIncome', draftIncome)
    profileStore.setField('annualExpenses', draftExpenses)
    profileStore.setField('liquidNetWorth', draftNetWorth)
    profileStore.setField('lifeStage', 'pre-fire')
    incomeStore.setField('annualSalary', draftIncome)
    setUIField('sectionOrder', 'goal-first')
    navigate('/inputs')
  }

  const handleStoryFirstContinue = () => {
    profileStore.setField('currentAge', draftAge)
    profileStore.setField('annualIncome', draftIncome)
    profileStore.setField('annualExpenses', draftExpenses)
    profileStore.setField('liquidNetWorth', draftNetWorth)
    profileStore.setField('lifeStage', 'pre-fire')
    incomeStore.setField('annualSalary', draftIncome)
    setUIField('sectionOrder', 'story-first')
    navigate('/inputs')
  }

  const handleAlreadyFirePhase = (phase: RetirementPhase) => {
    profileStore.setField('currentAge', draftAge)
    profileStore.setField('retirementAge', draftAge)
    profileStore.setField('annualIncome', draftIncome)
    profileStore.setField('annualExpenses', draftExpenses)
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
                label="Annual Income"
                value={draftIncome}
                onChange={setDraftIncome}
                tooltip="Total annual income before tax and CPF"
              />
              <CurrencyInput
                label="Annual Expenses"
                value={draftExpenses}
                onChange={setDraftExpenses}
                tooltip="Total annual spending including housing, food, transport, etc."
              />
              <CurrencyInput
                label="Liquid Net Worth"
                value={draftNetWorth}
                onChange={setDraftNetWorth}
                tooltip="Cash, stocks, bonds — excluding CPF and property"
              />
            </div>
            {showResults && <QuickResults fireNumber={draftFireNumber} yearsToFire={draftYearsToFire} fireAge={draftFireAge} savingsRate={draftSavingsRate} progress={draftProgress} />}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
                label="Annual Expenses"
                value={draftExpenses}
                onChange={setDraftExpenses}
                tooltip="Total annual spending including housing, food, transport, etc."
              />
              <CurrencyInput
                label="Liquid Net Worth"
                value={draftNetWorth}
                onChange={setDraftNetWorth}
                tooltip="Cash, stocks, bonds — excluding CPF and property"
              />
            </div>
            {showResults && <QuickResults fireNumber={draftFireNumber} yearsToFire={draftYearsToFire} fireAge={draftFireAge} savingsRate={draftSavingsRate} progress={draftProgress} />}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
                  label="Annual Expenses"
                  value={draftExpenses}
                  onChange={setDraftExpenses}
                  tooltip="Total annual spending including housing, food, transport, etc."
                />
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

function QuickResults({
  fireNumber,
  yearsToFire,
  fireAge,
  savingsRate,
  progress,
}: {
  fireNumber: number
  yearsToFire: number
  fireAge: number
  savingsRate: number
  progress: number
}) {
  return (
    <div className="col-span-full mt-4 p-4 rounded-lg border bg-muted/30 space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
        Preliminary estimate
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-xs text-muted-foreground">FIRE Number</div>
          <div className="text-lg font-semibold">
            ${fireNumber.toLocaleString('en-SG', { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Years to FIRE</div>
          <div className="text-lg font-semibold">
            {Math.ceil(yearsToFire)} years
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">FIRE Age</div>
          <div className="text-lg font-semibold">Age {fireAge}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Savings Rate</div>
          <div className="text-lg font-semibold">
            {(savingsRate * 100).toFixed(1)}%
          </div>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Progress</span>
          <span>{(progress * 100).toFixed(1)}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Based on default assumptions (4% SWR, ~7% return, 2.5% inflation).
        Refine your plan for a more accurate projection.
      </p>
    </div>
  )
}
