import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface InfoTooltipProps {
  text: string
  formula?: string
}

export function InfoTooltip({ text, formula }: InfoTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted text-muted-foreground text-xs cursor-help ml-1">
            i
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{text}</p>
          {formula && (
            <p className="text-xs text-muted-foreground mt-1 font-mono">{formula}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
