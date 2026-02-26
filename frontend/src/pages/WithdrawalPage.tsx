import { useState, useMemo } from 'react'
import { StrategyParamsSection } from '@/components/withdrawal/StrategyParamsSection'
import { ComparisonTable } from '@/components/withdrawal/ComparisonTable'
import { WithdrawalChart } from '@/components/withdrawal/WithdrawalChart'
import { PortfolioComparisonChart } from '@/components/withdrawal/PortfolioComparisonChart'
import { StrategyGuideDialog } from '@/components/withdrawal/StrategyGuideDialog'
import { AnalysisModeToggle } from '@/components/shared/AnalysisModeToggle'
import { useWithdrawalComparison } from '@/hooks/useWithdrawalComparison'
import { useWithdrawalStore } from '@/stores/useWithdrawalStore'
import { useAnalysisPortfolio } from '@/hooks/useAnalysisPortfolio'
import { useProjection } from '@/hooks/useProjection'
import { useProfileStore } from '@/stores/useProfileStore'
import { useEffectiveMode } from '@/hooks/useEffectiveMode'
import { useUIStore } from '@/stores/useUIStore'
import { cn } from '@/lib/utils'
import type { WithdrawalStrategyType } from '@/lib/types'
import { trackEvent } from '@/lib/analytics'
import { usePageMeta } from '@/hooks/usePageMeta'

export function WithdrawalPage() {
  usePageMeta({ title: 'Withdrawal Strategies — SG FIRE Planner', description: 'Compare 12 retirement withdrawal strategies including the 4% rule, VPW, guardrails, and CAPE-based approaches.' })
  const retirementAge = useProfileStore((s) => s.retirementAge)
  const { portfolioLabel } = useAnalysisPortfolio()
  const selectedStrategies = useWithdrawalStore((s) => s.selectedStrategies)
  const toggleStrategy = useWithdrawalStore((s) => s.toggleStrategy)

  const mode = useEffectiveMode('section-withdrawal')
  const setSectionMode = useUIStore((s) => s.setSectionMode)

  const [guideOpen, setGuideOpen] = useState(false)

  // Use the full projection engine to get the retirement-age portfolio value
  const { rows: projectionRows } = useProjection()
  const retirementRow = projectionRows?.find((r) => r.age === retirementAge)
  const projectedPortfolio = retirementRow?.liquidNW

  const { results, hasErrors, errors } = useWithdrawalComparison({
    initialPortfolioOverride: projectedPortfolio,
  })

  const activeSet = useMemo(() => new Set<string>(selectedStrategies), [selectedStrategies])

  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Withdrawal Strategies</h1>
          <p className="text-sm text-muted-foreground">
            Compare how different withdrawal strategies affect your retirement income and portfolio longevity.
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/30 shrink-0 mt-1">
          <button
            onClick={() => setSectionMode('section-withdrawal', 'simple')}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-all',
              mode === 'simple'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Simple
          </button>
          <button
            onClick={() => setSectionMode('section-withdrawal', 'advanced')}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-all',
              mode === 'advanced'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Advanced
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <AnalysisModeToggle portfolioLabel={portfolioLabel} />

        <StrategyParamsSection onGuideOpen={() => { setGuideOpen(true); trackEvent('strategy_guide_opened', { context: 'withdrawal' }) }} />

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

      <StrategyGuideDialog
        open={guideOpen}
        onOpenChange={setGuideOpen}
        mode={mode}
        activeStrategies={activeSet}
        actionLabel="Add to comparison"
        description="Learn about each strategy's approach, strengths, and trade-offs. Click 'Add to comparison' to include it in your analysis."
        onSelect={(strategy: WithdrawalStrategyType) => {
          toggleStrategy(strategy)
        }}
      />
    </>
  )
}
