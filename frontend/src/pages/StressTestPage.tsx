import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AnalysisModeToggle } from '@/components/shared/AnalysisModeToggle'
import { useAnalysisPortfolio } from '@/hooks/useAnalysisPortfolio'

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

function MonteCarloTab() {
  const { mutate, data, isPending, error, canRun, validationErrors } = useMonteCarloQuery()
  const retirementAge = useProfileStore((s) => s.retirementAge)

  return (
    <div className="space-y-6">
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

      {data && (
        <>
          <ResultsSummary result={data} />
          <FanChart bands={data.percentile_bands} retirementAge={retirementAge} />
          <FailureDistributionChart
            distribution={data.failure_distribution}
            nSimulations={data.n_simulations}
          />
        </>
      )}
    </div>
  )
}

function BacktestTab() {
  const { mutate, data, isPending, error, canRun, validationErrors, config, setConfig } = useBacktestQuery()

  return (
    <div className="space-y-6">
      {Object.keys(validationErrors).length > 0 && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive font-medium">
            Fix validation errors before running backtest.
          </p>
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

      {data && (
        <>
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
  const { mutate, data, isPending, error, canRun, validationErrors } = useSequenceRiskQuery()

  const errorMessages = Object.values(validationErrors)
  const disabledReason = !canRun
    ? errorMessages[0] ?? 'Fix validation errors to run stress test'
    : undefined

  return (
    <div className="space-y-6">
      {Object.keys(validationErrors).length > 0 && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive font-medium">
            Fix validation errors before running stress tests.
          </p>
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

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">Normal Success Rate</p>
                <p className="text-3xl font-bold text-green-600">{formatPercent(data.normal_success_rate, 1)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">Crisis Success Rate</p>
                <p className={`text-3xl font-bold ${data.crisis_success_rate >= 0.8 ? 'text-green-600' : data.crisis_success_rate >= 0.6 ? 'text-yellow-600' : 'text-destructive'}`}>
                  {formatPercent(data.crisis_success_rate, 1)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
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
