import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useIsMobile } from '@/hooks/useIsMobile'

interface InfoTooltipProps {
  text: string
  formula?: string
  source?: string
  sourceUrl?: string
}

function InfoContent({ text, formula, source, sourceUrl }: InfoTooltipProps) {
  return (
    <>
      <p className="text-sm">{text}</p>
      {formula && (
        <p className="text-xs text-muted-foreground mt-1 font-mono">{formula}</p>
      )}
      {source && (
        <p className="text-xs text-muted-foreground mt-1">
          Source:{' '}
          {sourceUrl ? (
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              {source}
            </a>
          ) : (
            source
          )}
        </p>
      )}
    </>
  )
}

const baseTriggerClassName = "inline-flex items-center justify-center rounded-full text-xs cursor-help ml-1"
const desktopTriggerClassName = `${baseTriggerClassName} w-5 h-5 bg-muted text-muted-foreground`
const mobileTriggerClassName = `${baseTriggerClassName} w-5 h-5 bg-muted text-muted-foreground relative before:absolute before:content-[''] before:-inset-3`

export function InfoTooltip(props: InfoTooltipProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" aria-label="More information" className={mobileTriggerClassName}>
            i
          </button>
        </PopoverTrigger>
        <PopoverContent className="max-w-xs p-3">
          <InfoContent {...props} />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" onClick={(e) => e.preventDefault()} aria-label="More information" className={desktopTriggerClassName}>
            i
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <InfoContent {...props} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
