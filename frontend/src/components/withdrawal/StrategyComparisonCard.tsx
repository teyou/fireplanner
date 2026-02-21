import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { WITHDRAWAL_STRATEGY_METADATA } from '@/lib/data/withdrawalMetadata'
import type { WithdrawalStrategyType } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  activeStrategy: WithdrawalStrategyType
  onSelect: (strategy: WithdrawalStrategyType) => void
}

const COMPLEXITY_COLOR: Record<string, string> = {
  Low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  High: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export function StrategyComparisonCard({ activeStrategy, onSelect }: Props) {
  const [expandedKey, setExpandedKey] = useState<WithdrawalStrategyType | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Strategy Comparison</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {WITHDRAWAL_STRATEGY_METADATA.map((meta) => {
          const isActive = meta.key === activeStrategy
          const isExpanded = meta.key === expandedKey

          return (
            <div
              key={meta.key}
              className={cn(
                'rounded-lg border p-3 transition-colors',
                isActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/30'
              )}
            >
              {/* Header row */}
              <div className="flex items-center justify-between gap-2">
                <button
                  className="flex items-center gap-2 text-left min-w-0 flex-1"
                  onClick={() => setExpandedKey(isExpanded ? null : meta.key)}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-sm font-medium truncate">{meta.label}</span>
                  <Badge
                    variant="secondary"
                    className={cn('text-[10px] px-1.5 py-0 shrink-0', COMPLEXITY_COLOR[meta.complexity])}
                  >
                    {meta.complexity}
                  </Badge>
                </button>
                {!isActive && (
                  <button
                    onClick={() => onSelect(meta.key)}
                    className="text-xs text-primary hover:underline shrink-0"
                  >
                    Use this
                  </button>
                )}
                {isActive && (
                  <Badge variant="default" className="text-[10px] px-1.5 py-0 shrink-0">
                    Active
                  </Badge>
                )}
              </div>

              {/* Short description always visible */}
              <p className="text-xs text-muted-foreground mt-1.5 ml-6">
                {meta.shortDescription}
              </p>

              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-3 ml-6 space-y-2 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="font-medium text-green-600 dark:text-green-400">Pros</span>
                      <ul className="mt-1 space-y-0.5 list-disc list-inside text-muted-foreground">
                        {meta.pros.map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-medium text-red-600 dark:text-red-400">Cons</span>
                      <ul className="mt-1 space-y-0.5 list-disc list-inside text-muted-foreground">
                        {meta.cons.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Best for: </span>
                    {meta.bestFor}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
