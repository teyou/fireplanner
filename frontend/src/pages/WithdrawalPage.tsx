import { Button } from '@/components/ui/button'
import { StrategyParamsSection } from '@/components/withdrawal/StrategyParamsSection'
import { ComparisonTable } from '@/components/withdrawal/ComparisonTable'
import { WithdrawalChart } from '@/components/withdrawal/WithdrawalChart'
import { PortfolioComparisonChart } from '@/components/withdrawal/PortfolioComparisonChart'
import { useWithdrawalStore } from '@/stores/useWithdrawalStore'
import { useWithdrawalComparison } from '@/hooks/useWithdrawalComparison'

export function WithdrawalPage() {
  const reset = useWithdrawalStore((s) => s.reset)
  const { results, hasErrors, errors } = useWithdrawalComparison()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Withdrawal Strategies</h1>
          <p className="text-muted-foreground text-sm">
            Compare 6 withdrawal strategies on a deterministic median-return path. Toggle strategies and tune parameters to see how they affect retirement income and portfolio longevity.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          Reset to Defaults
        </Button>
      </div>

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
