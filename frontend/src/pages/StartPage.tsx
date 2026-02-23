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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { RetirementPhase } from '@/lib/types'

type ActivePathway = 'goal-first' | 'story-first' | 'already-fire' | null

const PATHWAY_TITLES: Record<NonNullable<ActivePathway>, string> = {
  'goal-first': 'Set your targets',
  'story-first': 'Tell us about your finances',
  'already-fire': 'Your current situation',
}

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

  // Check if returning user (has saved profile in localStorage)
  const [isReturningUser] = useState(
    () => localStorage.getItem('fireplanner-profile') !== null
  )

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

  // Shared section toggles — rendered inline within each pathway's form card
  const sectionToggles = (
    <div className="space-y-4 pt-4 border-t">
      <div className="text-sm font-medium">What should we include?</div>
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
    </div>
  )

  return (
    <div className="space-y-8">
      <div className="py-8">
        <h1 className="text-3xl font-bold">Singapore FIRE Planner</h1>
        <p className="text-muted-foreground mt-2 text-base">
          Plan your path to Financial Independence with Singapore-specific calculations.
        </p>
      </div>

      {/* Pathway cards */}
      <div className="grid grid-cols-1 @2xl:grid-cols-3 gap-4">
        {pathwayCards.map(({ key, label, description, icon: Icon }, index) => (
          <button
            key={key}
            onClick={() => handlePathwayClick(key as ActivePathway)}
            className="text-left h-full opacity-0 animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <Card className={`h-full transition-all duration-200 cursor-pointer ${
              activePathway === key
                ? 'bg-primary/5 ring-2 ring-primary/20 border-primary shadow-md'
                : activePathway !== null
                  ? 'opacity-75 hover:opacity-100 hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5'
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
            <CardTitle className="text-lg">{PATHWAY_TITLES['goal-first']}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <Label className="text-sm">Current Age</Label>
                <NumberInput
                  integer
                  min={18}
                  max={100}
                  value={draftAge}
                  onChange={setDraftAge}
                  className="mt-auto border-blue-300"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm">Desired Retirement Age</Label>
                <NumberInput
                  integer
                  min={draftAge + 1}
                  max={100}
                  value={draftRetirementAge}
                  onChange={setDraftRetirementAge}
                  className="mt-auto border-blue-300"
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
                label="Annual Expenses (excl. healthcare & mortgage)"
                value={draftExpenses}
                onChange={setDraftExpenses}
                tooltip="Healthcare insurance and mortgage payments are modelled separately in their own sections."
              />
              <CurrencyInput
                label="Savings & Investments"
                value={draftNetWorth}
                onChange={setDraftNetWorth}
                tooltip="Cash, savings, stocks, bonds, and other investments — excluding CPF and property"
              />
            </div>
            {showResults && <QuickResults fireNumber={draftFireNumber} yearsToFire={draftYearsToFire} fireAge={draftFireAge} savingsRate={draftSavingsRate} progress={draftProgress} />}
            {sectionToggles}
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
            <CardTitle className="text-lg">{PATHWAY_TITLES['story-first']}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 @md:grid-cols-2 @2xl:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1">
                <Label className="text-sm">Current Age</Label>
                <NumberInput
                  integer
                  min={18}
                  max={100}
                  value={draftAge}
                  onChange={setDraftAge}
                  className="mt-auto border-blue-300"
                />
              </div>
              <CurrencyInput
                label="Annual Income"
                value={draftIncome}
                onChange={setDraftIncome}
                tooltip="Total annual income before tax and CPF"
              />
              <CurrencyInput
                label="Annual Expenses (excl. healthcare & mortgage)"
                value={draftExpenses}
                onChange={setDraftExpenses}
                tooltip="Healthcare insurance and mortgage payments are modelled separately in their own sections."
              />
              <CurrencyInput
                label="Savings & Investments"
                value={draftNetWorth}
                onChange={setDraftNetWorth}
                tooltip="Cash, savings, stocks, bonds, and other investments — excluding CPF and property"
              />
            </div>
            {showResults && <QuickResults fireNumber={draftFireNumber} yearsToFire={draftYearsToFire} fireAge={draftFireAge} savingsRate={draftSavingsRate} progress={draftProgress} />}
            {sectionToggles}
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
              <CardTitle className="text-lg">{PATHWAY_TITLES['already-fire']}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 @md:grid-cols-2 @2xl:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1">
                  <Label className="text-sm">Current Age</Label>
                  <NumberInput
                    integer
                    min={18}
                    max={100}
                    value={draftAge}
                    onChange={setDraftAge}
                    className="mt-auto border-blue-300"
                  />
                </div>
                <CurrencyInput
                  label="Annual Income"
                  value={draftIncome}
                  onChange={setDraftIncome}
                  tooltip="Total annual income before tax and CPF"
                />
                <CurrencyInput
                  label="Annual Expenses (excl. healthcare & mortgage)"
                  value={draftExpenses}
                  onChange={setDraftExpenses}
                  tooltip="Healthcare insurance and mortgage payments are modelled separately in their own sections."
                />
                <CurrencyInput
                  label="Savings & Investments"
                  value={draftNetWorth}
                  onChange={setDraftNetWorth}
                  tooltip="Cash, savings, stocks, bonds, and other investments — excluding CPF and property"
                />
              </div>
              {sectionToggles}
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div>
              <h2 className="text-xl font-semibold">What's your CPF stage?</h2>
              <p className="text-sm text-muted-foreground">
                This determines which CPF inputs are relevant for you.
              </p>
            </div>
            <div className="grid grid-cols-1 @2xl:grid-cols-3 gap-4">
              {PHASE_CARDS.map(({ phase, label, description, icon: Icon }, index) => (
                <button
                  key={phase}
                  onClick={() => handleAlreadyFirePhase(phase)}
                  disabled={!alreadyFireValid}
                  className="text-left h-full disabled:opacity-50 disabled:cursor-not-allowed opacity-0 animate-fade-in-up"
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

      {/* Continue link for returning users only */}
      {isReturningUser && (
        <div className="text-center">
          <Button variant="ghost" size="sm" asChild>
            <Link
              to="/inputs"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Welcome back — continue where you left off
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      )}
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
  const pct = (progress * 100).toFixed(1)
  return (
    <div className="col-span-full mt-4 p-4 rounded-lg border bg-muted/30 space-y-3">
      {/* Hero: FIRE Age */}
      <div className="text-center space-y-1">
        <div className="text-2xl font-bold">
          You could retire at Age {fireAge}
        </div>
        <div className="text-sm text-muted-foreground">
          That's {Math.ceil(yearsToFire)} years from now
        </div>
      </div>

      {/* Supporting metrics row */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div>
          <span className="text-muted-foreground">FIRE Number: </span>
          <span className="font-semibold">
            ${fireNumber.toLocaleString('en-SG', { maximumFractionDigits: 0 })}
          </span>
        </div>
        <span className="text-muted-foreground">|</span>
        <div>
          <span className="text-muted-foreground">Savings Rate: </span>
          <span className="font-semibold">{(savingsRate * 100).toFixed(1)}%</span>
        </div>
        <span className="text-muted-foreground">|</span>
        <div>
          <span className="text-muted-foreground">Progress: </span>
          <span className="font-semibold">{pct}%</span>
        </div>
      </div>

      {/* Progress bar with percentage at end */}
      <div className="flex items-center gap-2">
        <div className="h-2 rounded-full bg-muted overflow-hidden flex-1">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{pct}%</span>
      </div>

      {/* Disclaimer as tooltip on badge */}
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground cursor-help">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Preliminary estimate
            </span>
          </TooltipTrigger>
          <TooltipContent>
            Based on 4% SWR, ~7% return, 2.5% inflation. Refine your plan for accuracy.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
