import type { WithdrawalBasis } from '@/lib/types'
import { useSimulationStore } from '@/stores/useSimulationStore'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const MODES: { value: WithdrawalBasis; label: string; tooltip: string }[] = [
  {
    value: 'expenses',
    label: 'My Expenses',
    tooltip: 'Withdrawals match your planned annual expenses, adjusted for inflation. Tests whether your portfolio can sustain your actual spending.',
  },
  {
    value: 'rate',
    label: 'Custom Rate',
    tooltip: 'Withdrawals based on portfolio × withdrawal rate (e.g. the 4% rule). Tests whether a specific withdrawal rate is sustainable.',
  },
]

export function WithdrawalBasisToggle() {
  const withdrawalBasis = useSimulationStore((s) => s.withdrawalBasis)
  const setField = useSimulationStore((s) => s.setField)

  return (
    <TooltipProvider delayDuration={200}>
      <div className="inline-flex rounded-lg border bg-muted p-0.5">
        {MODES.map((mode) => (
          <Tooltip key={mode.value}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setField('withdrawalBasis', mode.value)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  withdrawalBasis === mode.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {mode.label}
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">{mode.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}
