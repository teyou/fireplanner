import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface InfoTooltipProps {
  text: string
  formula?: string
  source?: string
  sourceUrl?: string
}

export function InfoTooltip({ text, formula, source, sourceUrl }: InfoTooltipProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" onClick={(e) => e.preventDefault()} className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-muted-foreground text-xs cursor-help ml-1">
            i
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
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
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
