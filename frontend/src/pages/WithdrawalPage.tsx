import { useState } from 'react'
import { StrategyParamsSection } from '@/components/withdrawal/StrategyParamsSection'
import { ComparisonTable } from '@/components/withdrawal/ComparisonTable'
import { WithdrawalChart } from '@/components/withdrawal/WithdrawalChart'
import { PortfolioComparisonChart } from '@/components/withdrawal/PortfolioComparisonChart'
import { AnalysisModeToggle } from '@/components/shared/AnalysisModeToggle'
import { useWithdrawalComparison } from '@/hooks/useWithdrawalComparison'
import { useAnalysisPortfolio } from '@/hooks/useAnalysisPortfolio'
import { useProjection } from '@/hooks/useProjection'
import { useProfileStore } from '@/stores/useProfileStore'
import { useSimulationStore } from '@/stores/useSimulationStore'
import { useEffectiveMode, SIMPLE_STRATEGIES } from '@/hooks/useEffectiveMode'
import { useUIStore } from '@/stores/useUIStore'
import { cn } from '@/lib/utils'
import { HelpCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { WITHDRAWAL_STRATEGY_METADATA } from '@/lib/data/withdrawalMetadata'
import type { WithdrawalStrategyType } from '@/lib/types'

const simpleSet = new Set<string>(SIMPLE_STRATEGIES)

export function WithdrawalPage() {
  const retirementAge = useProfileStore((s) => s.retirementAge)
  const { portfolioLabel } = useAnalysisPortfolio()
  const activeStrategy = useSimulationStore((s) => s.selectedStrategy)
  const setSimField = useSimulationStore((s) => s.setField)

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

        <StrategyParamsSection />

        <button
          onClick={() => setGuideOpen(true)}
          className="flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <HelpCircle className="h-4 w-4" />
          Need help understanding the strategies? View guide
        </button>

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

      {/* Strategy Guide Dialog */}
      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Withdrawal Strategy Guide</DialogTitle>
            <DialogDescription>
              Understand how each strategy works, its pros and cons, and who it's best suited for.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {WITHDRAWAL_STRATEGY_METADATA
              .filter((meta) => mode === 'advanced' || simpleSet.has(meta.key))
              .map((meta) => {
                const isActive = meta.key === activeStrategy
                return (
                  <div
                    key={meta.key}
                    className={cn(
                      'rounded-lg border p-3',
                      isActive ? 'border-primary bg-primary/5' : 'border-border',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium">{meta.label}</span>
                        <Badge
                          variant="secondary"
                          className={cn('text-[10px] px-1.5 py-0 shrink-0', {
                            'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400': meta.category === 'Basic',
                            'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400': meta.category === 'Adaptive',
                            'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400': meta.category === 'Smoothed',
                          })}
                        >
                          {meta.category}
                        </Badge>
                      </div>
                      {isActive ? (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0 shrink-0">Active</Badge>
                      ) : (
                        <button
                          onClick={() => {
                            setSimField('selectedStrategy', meta.key as WithdrawalStrategyType)
                            setGuideOpen(false)
                          }}
                          className="text-xs text-primary hover:underline shrink-0"
                        >
                          Use this
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">{meta.shortDescription}</p>
                    <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="font-medium text-green-600 dark:text-green-400">Pros</span>
                        <ul className="mt-0.5 space-y-0.5 list-disc list-inside text-muted-foreground">
                          {meta.pros.map((p) => <li key={p}>{p}</li>)}
                        </ul>
                      </div>
                      <div>
                        <span className="font-medium text-red-600 dark:text-red-400">Cons</span>
                        <ul className="mt-0.5 space-y-0.5 list-disc list-inside text-muted-foreground">
                          {meta.cons.map((c) => <li key={c}>{c}</li>)}
                        </ul>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      <span className="font-medium text-foreground">Best for: </span>
                      {meta.bestFor}
                    </p>
                    {meta.remark && (
                      <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2 mt-1.5">
                        {meta.remark}
                      </p>
                    )}
                  </div>
                )
              })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
