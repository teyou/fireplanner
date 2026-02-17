import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StrategyParamsSection } from '@/components/withdrawal/StrategyParamsSection'
import { ComparisonTable } from '@/components/withdrawal/ComparisonTable'
import { WithdrawalChart } from '@/components/withdrawal/WithdrawalChart'
import { PortfolioComparisonChart } from '@/components/withdrawal/PortfolioComparisonChart'
import { AnalysisModeToggle } from '@/components/shared/AnalysisModeToggle'
import { CurrencyInput } from '@/components/shared/CurrencyInput'
import { useWithdrawalStore } from '@/stores/useWithdrawalStore'
import { useSimulationStore } from '@/stores/useSimulationStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { useWithdrawalComparison } from '@/hooks/useWithdrawalComparison'
import { useAnalysisPortfolio } from '@/hooks/useAnalysisPortfolio'
import type { WithdrawalStrategyType } from '@/lib/types'

const STRATEGY_LABELS: Record<WithdrawalStrategyType, string> = {
  constant_dollar: 'Constant Dollar (4% Rule)',
  vpw: 'Variable Percentage (VPW)',
  guardrails: 'Guardrails (Guyton-Klinger)',
  vanguard_dynamic: 'Vanguard Dynamic',
  cape_based: 'CAPE-Based',
  floor_ceiling: 'Floor & Ceiling',
}

export function SpendingPage() {
  const reset = useWithdrawalStore((s) => s.reset)
  const { results, hasErrors, errors } = useWithdrawalComparison()
  const { portfolioLabel } = useAnalysisPortfolio()

  const annualExpenses = useProfileStore((s) => s.annualExpenses)
  const setProfileField = useProfileStore((s) => s.setField)
  const expensesError = useProfileStore((s) => s.validationErrors.annualExpenses)

  const activeStrategy = useSimulationStore((s) => s.selectedStrategy)
  const setSimField = useSimulationStore((s) => s.setField)

  const handleActiveStrategyChange = (value: string) => {
    setSimField('selectedStrategy', value as WithdrawalStrategyType)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Spending</h1>
          <p className="text-muted-foreground text-sm">
            Set your current spending level and compare 6 withdrawal strategies for retirement income planning.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          Reset to Defaults
        </Button>
      </div>

      {/* Current Spending */}
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

      {/* Withdrawal Strategy */}
      <h2 className="text-xl font-semibold">Withdrawal Strategy</h2>

      {/* Active strategy selector — flows into Projection & Stress Test */}
      <Card>
        <CardContent className="pt-4 pb-4">
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
              This strategy is used in your Projection and Stress Tests.
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
    </div>
  )
}

/** @deprecated Use SpendingPage instead */
export const WithdrawalPage = SpendingPage
