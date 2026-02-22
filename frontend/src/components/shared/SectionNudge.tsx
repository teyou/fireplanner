import { X, Lightbulb } from 'lucide-react'
import { useUIStore } from '@/stores/useUIStore'
import type { ModeSectionId } from '@/hooks/useEffectiveMode'

interface SectionNudgeProps {
  nudgeId: string
  sectionId: ModeSectionId
  message: string
  actionLabel: string
}

export function SectionNudge({ nudgeId, sectionId, message, actionLabel }: SectionNudgeProps) {
  const dismissNudge = useUIStore((s) => s.dismissNudge)
  const setSectionMode = useUIStore((s) => s.setSectionMode)

  const handleAction = () => {
    setSectionMode(sectionId, 'advanced')
  }

  const handleDismiss = () => {
    dismissNudge(nudgeId)
  }

  return (
    <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
      <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <span className="text-foreground">{message} </span>
        <button
          onClick={handleAction}
          className="text-primary font-medium hover:underline"
        >
          {actionLabel} &rarr;
        </button>
      </div>
      <button
        onClick={handleDismiss}
        className="text-muted-foreground hover:text-foreground shrink-0"
        aria-label="Dismiss suggestion"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
