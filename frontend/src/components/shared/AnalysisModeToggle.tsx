import type { AnalysisMode } from '@/lib/types'
import { useSimulationStore } from '@/stores/useSimulationStore'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const MODES: { value: AnalysisMode; label: string; tooltip: string }[] = [
  {
    value: 'currentNW',
    label: 'Current NW',
    tooltip: "Use today's net worth. Includes accumulation phase before retirement.",
  },
  {
    value: 'fireNumber',
    label: 'FIRE Number',
    tooltip: 'Start analysis at your FIRE target (expenses / SWR). Tests "will my plan work once I reach FIRE?"',
  },
  {
    value: 'projectedNW',
    label: 'Projected NW',
    tooltip: 'Deterministic projection of portfolio at retirement age using current savings rate and expected returns.',
  },
]

interface AnalysisModeToggleProps {
  portfolioLabel: string
}

export function AnalysisModeToggle({ portfolioLabel }: AnalysisModeToggleProps) {
  const analysisMode = useSimulationStore((s) => s.analysisMode)
  const setField = useSimulationStore((s) => s.setField)

  return (
    <div className="space-y-1.5">
      <TooltipProvider delayDuration={200}>
        <div className="inline-flex rounded-lg border bg-muted p-0.5">
          {MODES.map((mode) => (
            <Tooltip key={mode.value}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setField('analysisMode', mode.value)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    analysisMode === mode.value
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
      <Badge variant="outline" className="text-xs font-normal">
        {portfolioLabel}
      </Badge>
    </div>
  )
}
