import { SimulationControls } from '@/components/simulation/SimulationControls'
import { ResultsSummary } from '@/components/simulation/ResultsSummary'
import { FanChart } from '@/components/simulation/FanChart'
import { FailureDistributionChart } from '@/components/simulation/FailureDistributionChart'
import { useMonteCarloQuery } from '@/hooks/useMonteCarloQuery'
import { useProfileStore } from '@/stores/useProfileStore'

export function MonteCarloPage() {
  const { mutate, data, isPending, error, canRun, validationErrors } = useMonteCarloQuery()
  const retirementAge = useProfileStore((s) => s.retirementAge)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Monte Carlo Simulation</h1>
        <p className="text-muted-foreground text-sm">
          Run 10,000 simulated retirement paths to test your plan against market uncertainty.
        </p>
      </div>

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
