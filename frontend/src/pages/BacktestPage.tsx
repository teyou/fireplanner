import { BacktestControls } from '@/components/backtest/BacktestControls'
import { SummaryPanel } from '@/components/backtest/SummaryPanel'
import { ResultsTable } from '@/components/backtest/ResultsTable'
import { SwrHeatmap } from '@/components/backtest/SwrHeatmap'
import { useBacktestQuery } from '@/hooks/useBacktestQuery'

export function BacktestPage() {
  const { mutate, data, isPending, error, canRun, validationErrors, config, setConfig } = useBacktestQuery()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Historical Backtest</h1>
        <p className="text-muted-foreground text-sm">
          Test your withdrawal strategy against every possible historical start year. See how your plan would have performed through real market conditions.
        </p>
      </div>

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
