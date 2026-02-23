import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { WITHDRAWAL_STRATEGY_METADATA } from '@/lib/data/withdrawalMetadata'
import { SIMPLE_STRATEGIES } from '@/hooks/useEffectiveMode'
import type { WithdrawalStrategyType } from '@/lib/types'

const simpleSet = new Set<string>(SIMPLE_STRATEGIES)

interface StrategyGuideDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 'simple' filters to core strategies, 'advanced' shows all */
  mode: 'simple' | 'advanced'
  /** Called when user clicks the action button on a strategy */
  onSelect: (strategy: WithdrawalStrategyType) => void
  /** Label for the action button (e.g. "Use this" or "Add to comparison") */
  actionLabel: string
  /** Description shown below the title */
  description: string
  /** Which strategies are currently active (shown with "Active" badge instead of action button) */
  activeStrategies: Set<string>
}

export function StrategyGuideDialog({
  open,
  onOpenChange,
  mode,
  onSelect,
  actionLabel,
  description,
  activeStrategies,
}: StrategyGuideDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Withdrawal Strategy Guide</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          {WITHDRAWAL_STRATEGY_METADATA
            .filter((meta) => mode === 'advanced' || simpleSet.has(meta.key))
            .map((meta) => {
              const isActive = activeStrategies.has(meta.key)
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
                        onClick={() => onSelect(meta.key as WithdrawalStrategyType)}
                        className="text-xs text-primary hover:underline shrink-0"
                      >
                        {actionLabel}
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
  )
}
