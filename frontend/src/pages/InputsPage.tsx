import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp, CheckCircle2, Circle, ArrowRight } from 'lucide-react'

// Profile sections
import { PersonalSection } from '@/components/profile/PersonalSection'
import { FinancialSection } from '@/components/profile/FinancialSection'
import { FireTargetsSection } from '@/components/profile/FireTargetsSection'
import { AssumptionsSection } from '@/components/profile/AssumptionsSection'
import { CpfSection } from '@/components/profile/CpfSection'
import { ParentSupportSection } from '@/components/profile/ParentSupportSection'

// Income sections
import { SalaryModelSection } from '@/components/income/SalaryModelSection'
import { IncomeStreamsSection } from '@/components/income/IncomeStreamsSection'
import { LifeEventsSection } from '@/components/income/LifeEventsSection'
import { ProjectionTable } from '@/components/income/ProjectionTable'
import { SummaryPanel } from '@/components/income/SummaryPanel'

// Allocation sections
import { AllocationBuilder } from '@/components/allocation/AllocationBuilder'
import { PortfolioStatsPanel } from '@/components/allocation/PortfolioStatsPanel'
import { AdvancedOverrides } from '@/components/allocation/AdvancedOverrides'
import { GlidePathSection } from '@/components/allocation/GlidePathSection'
import { CorrelationHeatmap } from '@/components/allocation/CorrelationHeatmap'

// Withdrawal sections
import { StrategyParamsSection } from '@/components/withdrawal/StrategyParamsSection'
import { ComparisonTable } from '@/components/withdrawal/ComparisonTable'
import { WithdrawalChart } from '@/components/withdrawal/WithdrawalChart'
import { PortfolioComparisonChart } from '@/components/withdrawal/PortfolioComparisonChart'

// Healthcare sections
import { HealthcareSection } from '@/components/healthcare/HealthcareSection'
import { HealthcareCostChart } from '@/components/healthcare/HealthcareCostChart'

// Property sections
import { PropertyInputForm } from '@/components/property/PropertyInputForm'
import { PropertyAnalysisPanel } from '@/components/property/PropertyAnalysisPanel'
import { DownsizingScenarioForm } from '@/components/property/DownsizingScenarioForm'
import { DownsizingResultsPanel } from '@/components/property/DownsizingResultsPanel'

// Shared
import { CurrencyInput } from '@/components/shared/CurrencyInput'
import { PercentInput } from '@/components/shared/PercentInput'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import { AnalysisModeToggle } from '@/components/shared/AnalysisModeToggle'

// Stores
import { useProfileStore } from '@/stores/useProfileStore'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { useAllocationStore } from '@/stores/useAllocationStore'
import { useWithdrawalStore } from '@/stores/useWithdrawalStore'
import { usePropertyStore } from '@/stores/usePropertyStore'
import { useSimulationStore } from '@/stores/useSimulationStore'
import { useUIStore } from '@/stores/useUIStore'

// Hooks
import { useSectionCompletion } from '@/hooks/useSectionCompletion'
import { useIncomeProjection } from '@/hooks/useIncomeProjection'
import { useWithdrawalComparison } from '@/hooks/useWithdrawalComparison'
import { useAnalysisPortfolio } from '@/hooks/useAnalysisPortfolio'

import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { pushUndo } from '@/lib/undo'
import { formatCurrency } from '@/lib/utils'
import type { WithdrawalStrategyType } from '@/lib/types'

const STRATEGY_LABELS: Record<WithdrawalStrategyType, string> = {
  constant_dollar: 'Constant Dollar (4% Rule)',
  vpw: 'Variable Percentage (VPW)',
  guardrails: 'Guardrails (Guyton-Klinger)',
  vanguard_dynamic: 'Vanguard Dynamic',
  cape_based: 'CAPE-Based',
  floor_ceiling: 'Floor & Ceiling',
}

type SectionId =
  | 'section-personal'
  | 'section-fire-settings'
  | 'section-income'
  | 'section-expenses'
  | 'section-net-worth'
  | 'section-cpf'
  | 'section-property'
  | 'section-allocation'

interface SectionDef {
  id: SectionId
  title: string
  description: string
  resetLabel: string
  onReset: () => void
  content: React.ReactNode
}

const GOAL_FIRST_ORDER: SectionId[] = [
  'section-personal',
  'section-fire-settings',
  'section-income',
  'section-expenses',
  'section-net-worth',
  'section-cpf',
  'section-property',
  'section-allocation',
]

const STORY_FIRST_ORDER: SectionId[] = [
  'section-personal',
  'section-income',
  'section-expenses',
  'section-net-worth',
  'section-cpf',
  'section-property',
  'section-allocation',
  'section-fire-settings',
]

const ALREADY_FIRE_ORDER: SectionId[] = [
  'section-personal',
  'section-net-worth',
  'section-property',
  'section-expenses',
  'section-allocation',
  'section-fire-settings',
  'section-cpf',
  'section-income',
]

// --- Individual section content components ---

function PersonalContent() {
  return (
    <>
      <PersonalSection />
    </>
  )
}

function FireSettingsContent() {
  return (
    <>
      <FireTargetsSection />
      <AssumptionsSection />
    </>
  )
}

function IncomeContent() {
  const income = useIncomeStore()
  const profile = useProfileStore()
  const { projection, summary, hasErrors, errors } = useIncomeProjection()

  // Sync salary model's annualSalary → profile.annualIncome
  useEffect(() => {
    if (income.annualSalary !== profile.annualIncome) {
      profile.setField('annualIncome', income.annualSalary)
    }
  }, [income.annualSalary])

  return (
    <>
      {hasErrors && Object.keys(errors).length > 0 && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm font-medium text-destructive">
            Fix validation errors to see the projection table:
          </p>
          <ul className="text-xs text-destructive/80 mt-1 list-disc list-inside">
            {Object.entries(errors).slice(0, 5).map(([key, msg]) => (
              <li key={key}>{msg}</li>
            ))}
            {Object.keys(errors).length > 5 && (
              <li>...and {Object.keys(errors).length - 5} more</li>
            )}
          </ul>
        </div>
      )}

      <SalaryModelSection />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CurrencyInput
          label="Personal Reliefs"
          value={income.personalReliefs}
          onChange={(v) => income.setField('personalReliefs', v)}
          error={income.validationErrors.personalReliefs}
          tooltip="Annual personal tax reliefs (earned income, NSman, etc.)"
        />
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={income.employerCpfEnabled}
              onChange={(e) => income.setField('employerCpfEnabled', e.target.checked)}
            />
            Employer CPF Contributions
          </label>
        </div>
      </div>

      <IncomeStreamsSection />
      <LifeEventsSection />

      {projection && summary && (
        <>
          <SummaryPanel summary={summary} />
          <div>
            <h3 className="text-lg font-semibold mb-2">Year-by-Year Projection</h3>
            <ProjectionTable data={projection} retirementAge={profile.retirementAge} />
          </div>
        </>
      )}
    </>
  )
}

function ExpensesContent() {
  const annualExpenses = useProfileStore((s) => s.annualExpenses)
  const retirementSpendingAdjustment = useProfileStore((s) => s.retirementSpendingAdjustment)
  const setProfileField = useProfileStore((s) => s.setField)
  const expensesError = useProfileStore((s) => s.validationErrors.annualExpenses)
  const adjustmentError = useProfileStore((s) => s.validationErrors.retirementSpendingAdjustment)

  const retirementExpenses = annualExpenses * retirementSpendingAdjustment

  const activeStrategy = useSimulationStore((s) => s.selectedStrategy)
  const setSimField = useSimulationStore((s) => s.setField)

  const { results, hasErrors, errors } = useWithdrawalComparison()
  const { portfolioLabel } = useAnalysisPortfolio()

  const [strategyExpanded, setStrategyExpanded] = useState(false)

  const handleActiveStrategyChange = (value: string) => {
    setSimField('selectedStrategy', value as WithdrawalStrategyType)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm">
            <CurrencyInput
              label="Annual Expenses"
              value={annualExpenses}
              onChange={(v) => setProfileField('annualExpenses', v)}
              error={expensesError}
              tooltip="Total annual spending. This determines your FIRE number."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            Retirement Spending
            <InfoTooltip text="Adjust how much of your current spending you expect in retirement. Many retirees spend less (no commute, paid-off mortgage) — a common estimate is 70-80% of working expenses." />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="max-w-sm">
            <PercentInput
              label="Retirement Spending Adjustment"
              value={retirementSpendingAdjustment}
              onChange={(v) => setProfileField('retirementSpendingAdjustment', v)}
              error={adjustmentError}
              tooltip="Percentage of current expenses expected in retirement (e.g. 80% = lower spending)"
            />
          </div>
          <div className="p-2 bg-muted/50 rounded text-sm">
            <span className="text-muted-foreground">Retirement expenses: </span>
            <span className="font-semibold">{formatCurrency(retirementExpenses)}/yr</span>
            <span className="text-muted-foreground">
              {' '}({(retirementSpendingAdjustment * 100).toFixed(0)}% of {formatCurrency(annualExpenses)})
            </span>
          </div>
        </CardContent>
      </Card>

      <ParentSupportSection />

      <Separator className="my-2" />

      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Withdrawal Strategy</h3>
        <button
          onClick={() => setStrategyExpanded(!strategyExpanded)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {strategyExpanded ? (
            <>Hide strategies <ChevronUp className="h-4 w-4" /></>
          ) : (
            <>Show withdrawal strategies <ChevronDown className="h-4 w-4" /></>
          )}
        </button>
      </div>

      <Card>
        <CardContent className="pt-4 pb-4 md:pt-4 md:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium whitespace-nowrap">Active Strategy:</span>
              <Select value={activeStrategy} onValueChange={handleActiveStrategyChange}>
                <SelectTrigger className="w-[260px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STRATEGY_LABELS) as WithdrawalStrategyType[]).map((key) => (
                    <SelectItem key={key} value={key}>{STRATEGY_LABELS[key]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              This strategy is used in your Projection and{' '}
              <Link to="/stress-test" className="underline text-primary">Stress Tests</Link>.
            </p>
          </div>
        </CardContent>
      </Card>

      <AnalysisModeToggle portfolioLabel={portfolioLabel} />

      {hasErrors && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive font-medium">
            Fix validation errors before comparison results can be computed.
          </p>
          <ul className="text-xs text-destructive mt-1 list-disc list-inside">
            {Object.entries(errors).map(([key, msg]) => (
              <li key={key}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {strategyExpanded && (
        <>
          <StrategyParamsSection />

          {results && (
            <>
              <ComparisonTable results={results} />
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <WithdrawalChart results={results} />
                <PortfolioComparisonChart results={results} />
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}

function NetWorthContent() {
  return (
    <>
      <FinancialSection />
    </>
  )
}

function CpfContent() {
  const healthcareEnabled = useUIStore((s) => s.healthcareEnabled)

  return (
    <>
      <CpfSection />
      {healthcareEnabled && (
        <>
          <HealthcareSection />
          <HealthcareCostChart />
        </>
      )}
    </>
  )
}

type PropertyStatus = 'none' | 'fully-paid' | 'with-mortgage'

function derivePropertyStatus(
  ownsProperty: boolean,
  mortgageBalance: number,
  monthlyPayment: number,
): PropertyStatus {
  if (!ownsProperty) return 'none'
  return (mortgageBalance === 0 && monthlyPayment === 0) ? 'fully-paid' : 'with-mortgage'
}

function PropertyContent() {
  const ownsProperty = usePropertyStore((s) => s.ownsProperty)
  const existingPropertyValue = usePropertyStore((s) => s.existingPropertyValue)
  const existingMortgageBalance = usePropertyStore((s) => s.existingMortgageBalance)
  const existingMonthlyPayment = usePropertyStore((s) => s.existingMonthlyPayment)
  const existingRentalIncome = usePropertyStore((s) => s.existingRentalIncome)
  const setField = usePropertyStore((s) => s.setField)
  const validationErrors = usePropertyStore((s) => s.validationErrors)

  const [propertyStatus, setPropertyStatus] = useState<PropertyStatus>(() =>
    derivePropertyStatus(ownsProperty, existingMortgageBalance, existingMonthlyPayment)
  )
  const [showNewPurchase, setShowNewPurchase] = useState(false)

  const handleStatusChange = (status: PropertyStatus) => {
    setPropertyStatus(status)
    if (status === 'none') {
      setField('ownsProperty', false)
    } else if (status === 'fully-paid') {
      setField('ownsProperty', true)
      setField('existingMortgageBalance', 0)
      setField('existingMonthlyPayment', 0)
    } else {
      setField('ownsProperty', true)
    }
  }

  const propertyEquity = ownsProperty
    ? Math.max(0, existingPropertyValue - existingMortgageBalance)
    : 0

  const STATUS_OPTIONS: { value: PropertyStatus; label: string }[] = [
    { value: 'none', label: 'No property' },
    { value: 'fully-paid', label: 'Own, fully paid' },
    { value: 'with-mortgage', label: 'Own, with mortgage' },
  ]

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Existing Property</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleStatusChange(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  propertyStatus === opt.value
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {ownsProperty && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CurrencyInput
                  label="Current Property Value"
                  value={existingPropertyValue}
                  onChange={(v) => setField('existingPropertyValue', v)}
                  error={validationErrors.existingPropertyValue}
                  tooltip="Estimated current market value of your property"
                />
                {propertyStatus === 'with-mortgage' && (
                  <>
                    <CurrencyInput
                      label="Outstanding Mortgage"
                      value={existingMortgageBalance}
                      onChange={(v) => setField('existingMortgageBalance', v)}
                      error={validationErrors.existingMortgageBalance}
                      tooltip="Remaining mortgage principal balance"
                    />
                    <CurrencyInput
                      label="Monthly Mortgage Payment"
                      value={existingMonthlyPayment}
                      onChange={(v) => setField('existingMonthlyPayment', v)}
                      error={validationErrors.existingMonthlyPayment}
                      tooltip="Monthly mortgage repayment amount (principal + interest)"
                    />
                  </>
                )}
                <CurrencyInput
                  label="Monthly Rental Income"
                  value={existingRentalIncome}
                  onChange={(v) => setField('existingRentalIncome', v)}
                  error={validationErrors.existingRentalIncome}
                  tooltip="Monthly rental income if this is an investment property (0 if owner-occupied)"
                />
              </div>
              {propertyStatus === 'with-mortgage' && (
                <div className="p-2 bg-muted/50 rounded text-sm">
                  <span className="text-muted-foreground">Property Equity: </span>
                  <span className="font-semibold">{formatCurrency(propertyEquity)}</span>
                  <span className="text-muted-foreground"> (Value - Mortgage)</span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {ownsProperty && propertyStatus === 'with-mortgage' && (
        <>
          <DownsizingScenarioForm />
          <DownsizingResultsPanel />
        </>
      )}

      <Card>
        <CardContent className="pt-4 pb-4 md:pt-4 md:pb-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showNewPurchase}
              onChange={(e) => setShowNewPurchase(e.target.checked)}
            />
            I'm considering purchasing a new property
          </label>
        </CardContent>
      </Card>

      {showNewPurchase && (
        <>
          <h3 className="text-xl font-semibold">New Purchase Analysis</h3>
          <PropertyInputForm />
          <PropertyAnalysisPanel />
        </>
      )}
    </>
  )
}

function AllocationContent() {
  const validationErrors = useAllocationStore((s) => s.validationErrors)
  const hasErrors = Object.keys(validationErrors).length > 0
  const allocationAdvanced = useUIStore((s) => s.allocationAdvanced)
  const setUIField = useUIStore((s) => s.setField)

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setUIField('allocationAdvanced', false)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              !allocationAdvanced
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Simple
          </button>
          <button
            onClick={() => setUIField('allocationAdvanced', true)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              allocationAdvanced
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Advanced
          </button>
        </div>
      </div>

      {hasErrors && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive font-medium">
            Fix the validation errors below before portfolio statistics can be computed.
          </p>
        </div>
      )}

      <AllocationBuilder />
      <PortfolioStatsPanel compact={!allocationAdvanced} />
      {allocationAdvanced && (
        <>
          <AdvancedOverrides />
          <GlidePathSection />
          <CorrelationHeatmap />
        </>
      )}
    </>
  )
}

// --- Main page component ---

export function InputsPage() {
  const sectionOrder = useUIStore((s) => s.sectionOrder)
  const cpfEnabled = useUIStore((s) => s.cpfEnabled)
  const propertyEnabled = useUIStore((s) => s.propertyEnabled)
  const setSectionOrder = useUIStore((s) => s.setField)
  const { sections: sectionCompletion } = useSectionCompletion()

  const resetProfileRaw = useProfileStore((s) => s.reset)
  const resetIncomeRaw = useIncomeStore((s) => s.reset)
  const resetAllocationRaw = useAllocationStore((s) => s.reset)
  const resetWithdrawalRaw = useWithdrawalStore((s) => s.reset)
  const resetPropertyRaw = usePropertyStore((s) => s.reset)

  const [pendingReset, setPendingReset] = useState<{ label: string; action: () => void; snapshotStore: () => Record<string, unknown>; restoreStore: (snapshot: Record<string, unknown>) => void } | null>(null)

  const confirmReset = useCallback((
    label: string,
    action: () => void,
    snapshotStore: () => Record<string, unknown>,
    restoreStore: (snapshot: Record<string, unknown>) => void,
  ) => {
    setPendingReset({ label, action, snapshotStore, restoreStore })
  }, [])

  const resetProfile = () => confirmReset('Profile', resetProfileRaw, () => ({ ...useProfileStore.getState() }), (s) => useProfileStore.setState(s))
  const resetIncome = () => confirmReset('Income', resetIncomeRaw, () => ({ ...useIncomeStore.getState() }), (s) => useIncomeStore.setState(s))
  const resetAllocation = () => confirmReset('Allocation', resetAllocationRaw, () => ({ ...useAllocationStore.getState() }), (s) => useAllocationStore.setState(s))
  const resetWithdrawal = () => confirmReset('Withdrawal', resetWithdrawalRaw, () => ({ ...useWithdrawalStore.getState() }), (s) => useWithdrawalStore.setState(s))
  const resetProperty = () => confirmReset('Property', resetPropertyRaw, () => ({ ...usePropertyStore.getState() }), (s) => usePropertyStore.setState(s))

  const [collapsedSections, setCollapsedSections] = useState<Set<SectionId>>(() => {
    if (sectionOrder === 'already-fire') {
      return new Set(['section-fire-settings'])
    }
    return new Set()
  })

  const toggleSection = (id: SectionId) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const sections: Record<SectionId, SectionDef> = {
    'section-personal': {
      id: 'section-personal',
      title: 'Personal',
      description: 'Age, retirement age, life expectancy, and personal status.',
      resetLabel: 'Reset Profile',
      onReset: resetProfile,
      content: <PersonalContent />,
    },
    'section-fire-settings': {
      id: 'section-fire-settings',
      title: 'FIRE Settings',
      description: 'SWR, FIRE type, basis, return and inflation assumptions, and live FIRE metrics.',
      resetLabel: 'Reset Profile',
      onReset: resetProfile,
      content: <FireSettingsContent />,
    },
    'section-income': {
      id: 'section-income',
      title: 'Income',
      description: 'Salary model, income streams, life events, and income summary.',
      resetLabel: 'Reset Income',
      onReset: resetIncome,
      content: <IncomeContent />,
    },
    'section-expenses': {
      id: 'section-expenses',
      title: 'Expenses & Withdrawal',
      description: 'Annual spending, retirement adjustment, and withdrawal strategy comparison.',
      resetLabel: 'Reset Withdrawal',
      onReset: resetWithdrawal,
      content: <ExpensesContent />,
    },
    'section-net-worth': {
      id: 'section-net-worth',
      title: 'Net Worth',
      description: 'Liquid net worth, CPF balances, and SRS.',
      resetLabel: 'Reset Profile',
      onReset: resetProfile,
      content: <NetWorthContent />,
    },
    'section-cpf': {
      id: 'section-cpf',
      title: 'CPF',
      description: 'CPF LIFE, housing deductions, and contribution projections.',
      resetLabel: 'Reset Profile',
      onReset: resetProfile,
      content: <CpfContent />,
    },
    'section-property': {
      id: 'section-property',
      title: 'Property',
      description: 'Existing property tracking and new purchase analysis with BSD/ABSD.',
      resetLabel: 'Reset Property',
      onReset: resetProperty,
      content: <PropertyContent />,
    },
    'section-allocation': {
      id: 'section-allocation',
      title: 'Asset Allocation',
      description: '8-class portfolio builder, templates, portfolio stats, glide path, and correlation heatmap.',
      resetLabel: 'Reset Allocation',
      onReset: resetAllocation,
      content: <AllocationContent />,
    },
  }

  const hiddenSections = new Set<SectionId>()
  if (!cpfEnabled) hiddenSections.add('section-cpf')
  if (!propertyEnabled) hiddenSections.add('section-property')

  const baseOrder = sectionOrder === 'goal-first'
    ? GOAL_FIRST_ORDER
    : sectionOrder === 'already-fire'
      ? ALREADY_FIRE_ORDER
      : STORY_FIRST_ORDER

  const order = baseOrder.filter((id) => !hiddenSections.has(id))

  const visibleSections = Object.entries(sectionCompletion)
    .filter(([id]) => !hiddenSections.has(id as SectionId))
  const completedCount = visibleSections.filter(([, s]) => s.isComplete).length
  const totalSections = visibleSections.length

  return (
    <div className="space-y-10">
      {/* Page header with ordering toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Plan Your FIRE</h1>
          <p className="text-muted-foreground text-sm">
            Fill in your financial details below. All changes save automatically.
          </p>
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{completedCount} of {totalSections} sections customized</span>
              <span>{Math.round((completedCount / totalSections) * 100)}%</span>
            </div>
            <Progress value={(completedCount / totalSections) * 100} className="h-2" />
          </div>
        </div>
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setSectionOrder('sectionOrder', 'goal-first')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              sectionOrder === 'goal-first'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Goal first
          </button>
          <button
            onClick={() => setSectionOrder('sectionOrder', 'story-first')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              sectionOrder === 'story-first'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Story first
          </button>
          <button
            onClick={() => setSectionOrder('sectionOrder', 'already-fire')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              sectionOrder === 'already-fire'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Already FIRE
          </button>
        </div>
      </div>

      {/* Render sections in chosen order */}
      {order.map((sectionId, index) => {
        const section = sections[sectionId]
        const isCollapsed = collapsedSections.has(sectionId)
        return (
          <section
            key={sectionId}
            id={sectionId}
            className="scroll-mt-16"
          >
            {index > 0 && <div className="border-t-2 border-border mb-6" />}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => toggleSection(sectionId)}
                className="flex items-center gap-2 text-left"
              >
                {isCollapsed ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    {section.title}
                    {sectionCompletion[sectionId]?.isComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                    )}
                  </h2>
                  <p className="text-muted-foreground text-sm">{section.description}</p>
                </div>
              </button>
              {!isCollapsed && (
                <Button variant="outline" size="sm" onClick={section.onReset}>
                  {section.resetLabel}
                </Button>
              )}
            </div>
            {!isCollapsed && (
              <div className="space-y-6">
                {section.content}
              </div>
            )}
          </section>
        )
      })}

      {/* What's Next CTA */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-6 md:py-6">
          <h3 className="text-lg font-semibold mb-1">
            {completedCount >= 5 ? 'Looking good! Ready to test your plan?' : 'Explore your projections'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {completedCount >= 5
              ? 'Your inputs are well-customized. See how your plan holds up under different scenarios.'
              : 'You can view projections at any time — even with default values. Customize more sections for personalized results.'}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/projection">
                View Projection <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/stress-test">
                Stress Test <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={pendingReset !== null}
        title={`Reset ${pendingReset?.label ?? ''}`}
        description={`Reset all ${pendingReset?.label ?? ''} settings to defaults? This cannot be undone.`}
        confirmLabel="Reset"
        onConfirm={() => {
          if (pendingReset) {
            const snapshot = pendingReset.snapshotStore()
            const { restoreStore } = pendingReset
            pendingReset.action()
            pushUndo(`${pendingReset.label} reset to defaults`, () => restoreStore(snapshot))
          }
          setPendingReset(null)
        }}
        onCancel={() => setPendingReset(null)}
      />
    </div>
  )
}
