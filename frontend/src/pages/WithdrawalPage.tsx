import { StrategyParamsSection } from '@/components/withdrawal/StrategyParamsSection'
import { ComparisonTable } from '@/components/withdrawal/ComparisonTable'
import { WithdrawalChart } from '@/components/withdrawal/WithdrawalChart'
import { PortfolioComparisonChart } from '@/components/withdrawal/PortfolioComparisonChart'
import { AnalysisModeToggle } from '@/components/shared/AnalysisModeToggle'
import { useWithdrawalComparison } from '@/hooks/useWithdrawalComparison'
import { useAnalysisPortfolio } from '@/hooks/useAnalysisPortfolio'
import { useProjection } from '@/hooks/useProjection'
import { useProfileStore } from '@/stores/useProfileStore'

export function WithdrawalPage() {
  const retirementAge = useProfileStore((s) => s.retirementAge)
  const { portfolioLabel } = useAnalysisPortfolio()

  // Use the full projection engine to get the retirement-age portfolio value
  const { rows: projectionRows } = useProjection()
  const retirementRow = projectionRows?.find((r) => r.age === retirementAge)
  const projectedPortfolio = retirementRow?.liquidNW

  const { results, hasErrors, errors } = useWithdrawalComparison({
    initialPortfolioOverride: projectedPortfolio,
  })

  return (
    <>
      <h1 className="text-2xl font-bold mb-1">Withdrawal Strategies</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Compare how different withdrawal strategies affect your retirement income and portfolio longevity.
      </p>

      <div className="space-y-6">
        <AnalysisModeToggle portfolioLabel={portfolioLabel} />

        <StrategyParamsSection />

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
    </>
  )
}
