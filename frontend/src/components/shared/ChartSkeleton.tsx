import { cn } from '@/lib/utils'

interface ChartSkeletonProps {
  className?: string
}

export function ChartSkeleton({ className }: ChartSkeletonProps) {
  return (
    <div className={cn('bg-muted animate-pulse rounded-lg relative overflow-hidden', className)}>
      {/* Fake axis lines */}
      <div className="absolute inset-0 p-4">
        {/* Y-axis */}
        <div className="absolute left-4 top-4 bottom-8 w-px bg-muted-foreground/10" />
        {/* X-axis */}
        <div className="absolute left-4 right-4 bottom-8 h-px bg-muted-foreground/10" />
        {/* Grid lines */}
        <div className="absolute left-4 right-4 top-[25%] h-px bg-muted-foreground/5" />
        <div className="absolute left-4 right-4 top-[50%] h-px bg-muted-foreground/5" />
        <div className="absolute left-4 right-4 top-[75%] h-px bg-muted-foreground/5" />
      </div>
    </div>
  )
}
