import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, ChevronDown, ChevronRight, CheckCircle2, Info, ShieldAlert } from 'lucide-react'
import { AnalysisModeToggle } from '@/components/shared/AnalysisModeToggle'
import { useAnalysisPortfolio } from '@/hooks/useAnalysisPortfolio'
import { formatCurrency } from '@/lib/utils'
import type { PercentileBands } from '@/lib/types'

// Monte Carlo imports
import { SimulationControls } from '@/components/simulation/SimulationControls'
import { ResultsSummary } from '@/components/simulation/ResultsSummary'
import { FanChart } from '@/components/simulation/FanChart'
import { FailureDistributionChart } from '@/components/simulation/FailureDistributionChart'
import { useMonteCarloQuery } from '@/hooks/useMonteCarloQuery'
import { useProfileStore } from '@/stores/useProfileStore'

// Backtest imports
import { BacktestControls } from '@/components/backtest/BacktestControls'
import { SummaryPanel } from '@/components/backtest/SummaryPanel'
import { ResultsTable } from '@/components/backtest/ResultsTable'
import { SwrHeatmap } from '@/components/backtest/SwrHeatmap'
import { useBacktestQuery } from '@/hooks/useBacktestQuery'

// Sequence Risk imports
import { CrisisComparisonChart } from '@/components/sequenceRisk/CrisisComparisonChart'
import { MitigationPanel } from '@/components/sequenceRisk/MitigationPanel'
import { useSequenceRiskQuery } from '@/hooks/useSequenceRiskQuery'
import { CRISIS_SCENARIOS } from '@/lib/data/crisisScenarios'
import { formatPercent } from '@/lib/utils'
import type { CrisisScenario } from '@/lib/types'

function InterpretationCallout({ level, message }: { level: 'success' | 'warning' | 'danger'; message: string }) {
  const styles = {
    success: 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700 text-green-800 dark:text-green-200',
    warning: 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200',
    danger: 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 text-red-800 dark:text-red-200',
  }
  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />,
    warning: <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />,
    danger: <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />,
  }

  return (
    <div className={`flex items-start gap-2 rounded-md border p-3 ${styles[level]}`}>
      {icons[level]}
      <p className="text-sm">{message}</p>
    </div>
  )
}

function TabIntro({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-muted-foreground">{children}</p>
  )
}

function MonteCarloTab() {
  const { mutate, data, isPending, error, canRun, validationErrors, isStale } = useMonteCarloQuery()
  const retirementAge = useProfileStore((s) => s.retirementAge)

  const mcInterpretation = data ? (() => {
    const rate = data.success_rate
    if (rate >= 0.95) return { level: 'success' as const, message: 'Excellent — your plan has a very high probability of lasting through retirement.' }
    if (rate >= 0.80) return { level: 'warning' as const, message: 'Good — your plan is likely to succeed, but consider a small buffer (lower spending or more savings).' }
    return { level: 'danger' as const, message: 'Needs attention — there\'s a meaningful risk of running out. Consider reducing withdrawal rate or extending your savings period.' }
  })() : null

  return (
    <div className="space-y-6">
      <TabIntro>
        Runs 10,000 random market scenarios to estimate the probability your portfolio lasts through retirement. A success rate above 90% is generally considered safe.
      </TabIntro>

      <SimulationControls
        onRun={mutate}
        isPending={isPending}
        canRun={canRun}
        validationErrors={validationErrors}
      />

      {isPending && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Running simulation...
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive font-medium">
            Simulation failed: {error.message}
          </p>
        </div>
      )}

      {data && isStale && (
        <div className="flex items-center justify-between rounded-md border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700 p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Results may be outdated — your inputs have changed since the last run.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => mutate()} disabled={isPending}>
            Re-run
          </Button>
        </div>
      )}

      {data && (
        <>
          {mcInterpretation && (
            <InterpretationCallout level={mcInterpretation.level} message={mcInterpretation.message} />
          )}
          <ResultsSummary result={data} />
          <FanChart bands={data.percentile_bands} retirementAge={retirementAge} />
          <FailureDistributionChart
            distribution={data.failure_distribution}
            nSimulations={data.n_simulations}
          />
          {data.withdrawal_bands && (
            <WithdrawalSchedule bands={data.withdrawal_bands} />
          )}
        </>
      )}
    </div>
  )
}

function WithdrawalSchedule({ bands }: { bands: PercentileBands }) {
  const [expanded, setExpanded] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const rows = useMemo(() => {
    return bands.ages.map((age, i) => ({
      age,
      p10: bands.p10[i],
      p25: bands.p25[i],
      p50: bands.p50[i],
      p75: bands.p75[i],
      p90: bands.p90[i],
    }))
  }, [bands])

  const displayRows = showAll ? rows : rows.filter((_, i) => i % 5 === 0 || i === rows.length - 1)

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <CardTitle className="flex items-center gap-2 text-base">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          Annual Withdrawal Schedule
        </CardTitle>
      </CardHeader>
      {expanded && (
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium">Age</th>
                  <th className="text-right py-2 px-3 font-medium text-red-600">p10</th>
                  <th className="text-right py-2 px-3 font-medium text-yellow-600">p25</th>
                  <th className="text-right py-2 px-3 font-medium">p50 (Median)</th>
                  <th className="text-right py-2 px-3 font-medium text-green-600">p75</th>
                  <th className="text-right py-2 px-3 font-medium text-green-600">p90</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row) => (
                  <tr key={row.age} className="border-b border-muted/50">
                    <td className="py-1.5 pr-4 font-medium">{row.age}</td>
                    <td className="py-1.5 px-3 text-right text-red-600">{formatCurrency(row.p10)}</td>
                    <td className="py-1.5 px-3 text-right text-yellow-600">{formatCurrency(row.p25)}</td>
                    <td className="py-1.5 px-3 text-right font-medium">{formatCurrency(row.p50)}</td>
                    <td className="py-1.5 px-3 text-right text-green-600">{formatCurrency(row.p75)}</td>
                    <td className="py-1.5 px-3 text-right text-green-600">{formatCurrency(row.p90)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > displayRows.length && (
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowAll(!showAll)}>
              {showAll ? 'Show every 5th year' : `Show all ${rows.length} years`}
            </Button>
          )}
          {showAll && rows.length === displayRows.length && (
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowAll(false)}>
              Show every 5th year
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  )
}

function BacktestTab() {
  const { mutate, data, isPending, error, canRun, validationErrors, config, setConfig, isStale } = useBacktestQuery()

  const btInterpretation = data ? (() => {
    const rate = data.summary.success_rate
    const failed = data.summary.failed_periods
    const total = data.summary.total_periods
    const worst = data.summary.worst_start_year
    if (rate >= 1.0) return { level: 'success' as const, message: 'Your plan would have survived every historical period since 1928.' }
    if (rate >= 0.90) return { level: 'warning' as const, message: `Your plan failed in ${failed} out of ${total} historical periods. The worst starting year was ${worst}.` }
    return { level: 'danger' as const, message: `Your plan shows significant historical vulnerability (${failed} failures out of ${total} periods). Consider reducing your withdrawal rate.` }
  })() : null

  return (
    <div className="space-y-6">
      <TabIntro>
        Tests your plan against every historical period since 1928. Unlike Monte Carlo (which generates random scenarios), this uses actual market history.
      </TabIntro>

      {Object.keys(validationErrors).length > 0 && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive font-medium">
            Fix validation errors before running backtest.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            <Link to="/inputs#section-personal" className="text-sm text-destructive hover:underline font-medium">
              Personal Details &rarr;
            </Link>
            <Link to="/inputs#section-expenses" className="text-sm text-destructive hover:underline font-medium">
              Expenses &rarr;
            </Link>
            <Link to="/inputs#section-allocation" className="text-sm text-destructive hover:underline font-medium">
              Allocation &rarr;
            </Link>
          </div>
        </div>
      )}

      <BacktestControls
        config={config}
        setConfig={setConfig}
        onRun={mutate}
        isPending={isPending}
        canRun={canRun}
        validationErrors={validationErrors}
      />

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error.message}</p>
        </div>
      )}

      {data && isStale && (
        <div className="flex items-center justify-between rounded-md border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700 p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Results may be outdated — your inputs have changed since the last run.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => mutate()} disabled={isPending}>
            Re-run
          </Button>
        </div>
      )}

      {data && (
        <>
          {btInterpretation && (
            <InterpretationCallout level={btInterpretation.level} message={btInterpretation.message} />
          )}
          <SummaryPanel summary={data.summary} computationTimeMs={data.computation_time_ms} />
          {data.heatmap && <SwrHeatmap data={data.heatmap} />}
          <ResultsTable results={data.results} />
        </>
      )}
    </div>
  )
}

function SequenceRiskTab() {
  const [selectedCrisis, setSelectedCrisis] = useState<CrisisScenario>(CRISIS_SCENARIOS[0])
  const { mutate, data, isPending, error, canRun, validationErrors, isStale } = useSequenceRiskQuery()

  const errorMessages = Object.values(validationErrors)
  const disabledReason = !canRun
    ? errorMessages[0] ?? 'Fix validation errors to run stress test'
    : undefined

  const srInterpretation = data ? (() => {
    const degradation = data.success_degradation
    if (degradation < 0.05) return { level: 'success' as const, message: 'Your plan is resilient to early retirement crises.' }
    if (degradation <= 0.15) return { level: 'warning' as const, message: `A crisis at retirement could reduce your success rate by ${formatPercent(degradation, 1)}. Consider the mitigation strategies below.` }
    return { level: 'danger' as const, message: `Your plan is highly sensitive to sequence risk (${formatPercent(degradation, 1)} degradation). The mitigation strategies below can help.` }
  })() : null

  return (
    <div className="space-y-6">
      <TabIntro>
        Tests what happens if a major market crash occurs right as you retire — the worst possible timing. Shows how mitigation strategies can protect you.
      </TabIntro>

      {Object.keys(validationErrors).length > 0 && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive font-medium">
            Fix validation errors before running stress tests.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            <Link to="/inputs#section-personal" className="text-sm text-destructive hover:underline font-medium">
              Personal Details &rarr;
            </Link>
            <Link to="/inputs#section-expenses" className="text-sm text-destructive hover:underline font-medium">
              Expenses &rarr;
            </Link>
            <Link to="/inputs#section-allocation" className="text-sm text-destructive hover:underline font-medium">
              Allocation &rarr;
            </Link>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Select Crisis Scenario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {CRISIS_SCENARIOS.map((crisis) => (
              <button
                key={crisis.id}
                onClick={() => setSelectedCrisis(crisis)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  selectedCrisis.id === crisis.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{crisis.name}</span>
                  <Badge variant="outline" className="text-xs">{crisis.region}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {crisis.startYear} | {formatPercent(crisis.peakDrawdown, 0)} drawdown | {crisis.recoveryYears}yr recovery
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-lg bg-muted/30 p-3">
            <p className="text-sm font-medium">{selectedCrisis.name} ({selectedCrisis.startYear})</p>
            <p className="text-xs text-muted-foreground mt-1">{selectedCrisis.description}</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => mutate(selectedCrisis)}
              disabled={!canRun || isPending}
              className="min-w-[180px]"
            >
              {isPending ? 'Running Stress Test...' : 'Run Stress Test'}
            </Button>
            {disabledReason && (
              <span className="text-sm text-muted-foreground">{disabledReason}</span>
            )}
          </div>

          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error.message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {data && isStale && (
        <div className="flex items-center justify-between rounded-md border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700 p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Results may be outdated — your inputs have changed since the last run.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => mutate(selectedCrisis)} disabled={isPending}>
            Re-run
          </Button>
        </div>
      )}

      {data && (
        <>
          {srInterpretation && (
            <InterpretationCallout level={srInterpretation.level} message={srInterpretation.message} />
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 md:pt-6 text-center">
                <p className="text-sm text-muted-foreground">Normal Success Rate</p>
                <p className="text-3xl font-bold text-green-600">{formatPercent(data.normal_success_rate, 1)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 md:pt-6 text-center">
                <p className="text-sm text-muted-foreground">Crisis Success Rate</p>
                <p className={`text-3xl font-bold ${data.crisis_success_rate >= 0.8 ? 'text-green-600' : data.crisis_success_rate >= 0.6 ? 'text-yellow-600' : 'text-destructive'}`}>
                  {formatPercent(data.crisis_success_rate, 1)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 md:pt-6 text-center">
                <p className="text-sm text-muted-foreground">Success Degradation</p>
                <p className="text-3xl font-bold text-destructive">
                  -{formatPercent(data.success_degradation, 1)}
                </p>
              </CardContent>
            </Card>
          </div>

          <CrisisComparisonChart
            normalBands={data.normal_percentile_bands}
            crisisBands={data.crisis_percentile_bands}
          />

          <MitigationPanel
            mitigations={data.mitigations}
            baseNormalRate={data.normal_success_rate}
            baseCrisisRate={data.crisis_success_rate}
          />
        </>
      )}
    </div>
  )
}

export function StressTestPage() {
  const { portfolioLabel } = useAnalysisPortfolio()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Stress Test</h1>
        <p className="text-muted-foreground text-sm">
          Test your retirement plan against market uncertainty using Monte Carlo simulation, historical backtesting, and crisis scenario analysis.
        </p>
      </div>

      <AnalysisModeToggle portfolioLabel={portfolioLabel} />

      <Tabs defaultValue="monte-carlo">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monte-carlo">Monte Carlo</TabsTrigger>
          <TabsTrigger value="backtest">Historical Backtest</TabsTrigger>
          <TabsTrigger value="sequence-risk">Sequence Risk</TabsTrigger>
        </TabsList>

        <TabsContent value="monte-carlo">
          <MonteCarloTab />
        </TabsContent>

        <TabsContent value="backtest">
          <BacktestTab />
        </TabsContent>

        <TabsContent value="sequence-risk">
          <SequenceRiskTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
