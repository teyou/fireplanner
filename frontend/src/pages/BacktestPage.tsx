import { BacktestControls } from '@/components/backtest/BacktestControls'
import { SummaryPanel } from '@/components/backtest/SummaryPanel'
import { ResultsTable } from '@/components/backtest/ResultsTable'
import { SwrHeatmap } from '@/components/backtest/SwrHeatmap'
import { AnalysisModeToggle } from '@/components/shared/AnalysisModeToggle'
import { useBacktestQuery } from '@/hooks/useBacktestQuery'
import { useAnalysisPortfolio } from '@/hooks/useAnalysisPortfolio'

export function BacktestPage() {
  const { mutate, data, isPending, error, canRun, validationErrors, config, setConfig } = useBacktestQuery()
  const { portfolioLabel } = useAnalysisPortfolio()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Historical Backtest</h1>
        <p className="text-muted-foreground text-sm">
          Test your withdrawal strategy against every possible historical start year. See how your plan would have performed through real market conditions.
        </p>
      </div>

      <AnalysisModeToggle portfolioLabel={portfolioLabel} />

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
