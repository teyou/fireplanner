import { useState, useRef, useEffect } from 'react'
import { useFireCalculations } from '@/hooks/useFireCalculations'
import { useProjection } from '@/hooks/useProjection'
import { useProfileStore } from '@/stores/useProfileStore'
import { useUIStore } from '@/stores/useUIStore'
import { formatCurrency } from '@/lib/utils'
import { Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type StatsPosition = 'bottom' | 'top' | 'sidebar'

interface StatChip {
  label: string
  value: string
}

function useStatsData(): StatChip[] {
  const { metrics } = useFireCalculations()
  const { summary } = useProjection()
  const currentAge = useProfileStore((s) => s.currentAge)

  if (!metrics) {
    return [
      { label: 'FIRE Age', value: '—' },
      { label: 'Years to FIRE', value: '—' },
      { label: 'FIRE Number', value: '—' },
      { label: 'Progress', value: '—' },
      { label: 'Peak NW', value: '—' },
      { label: 'Terminal NW', value: '—' },
    ]
  }

  const projFireAge = summary?.fireAchievedAge ?? null
  const fireAge = projFireAge ?? (isFinite(metrics.fireAge) ? Math.ceil(metrics.fireAge) : null)
  const yearsToFire = fireAge !== null
    ? Math.max(0, fireAge - currentAge)
    : isFinite(metrics.yearsToFire)
      ? Math.ceil(metrics.yearsToFire)
      : null

  return [
    {
      label: 'FIRE Age',
      value: fireAge !== null ? `${fireAge}` : '—',
    },
    {
      label: 'Years to FIRE',
      value: yearsToFire !== null
        ? yearsToFire === 0 ? 'Achieved!' : `${yearsToFire} yrs`
        : '—',
    },
    {
      label: 'FIRE Number',
      value: formatCurrency(metrics.fireNumber),
    },
    {
      label: 'Progress',
      value: `${Math.min(100, Math.round(metrics.progress * 100))}%`,
    },
    {
      label: 'Peak NW',
      value: summary ? formatCurrency(summary.peakTotalNW) : '—',
    },
    {
      label: 'Terminal NW',
      value: summary ? formatCurrency(summary.terminalTotalNW) : '—',
    },
  ]
}

function PositionPicker() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const statsPosition = useUIStore((s) => s.statsPosition)
  const setField = useUIStore((s) => s.setField)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const options: { value: StatsPosition; label: string }[] = [
    { value: 'top', label: 'Top bar' },
    { value: 'bottom', label: 'Bottom bar' },
    { value: 'sidebar', label: 'Right sidebar' },
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1 rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Change stats position"
      >
        <Settings2 className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 bottom-full mb-1 bg-background border rounded-md shadow-lg py-1 z-50 min-w-[130px]">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setField('statsPosition', opt.value)
                setOpen(false)
              }}
              className={cn(
                'w-full text-left px-3 py-1.5 text-xs transition-colors',
                statsPosition === opt.value
                  ? 'bg-accent font-medium'
                  : 'hover:bg-accent/50'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function FireStatsStrip({ position }: { position: StatsPosition }) {
  const stats = useStatsData()

  if (position === 'sidebar') {
    return (
      <aside className="hidden lg:flex flex-col w-56 border-l bg-muted/20 p-4 gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">FIRE Stats</span>
          <PositionPicker />
        </div>
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col">
            <span className="text-xs text-muted-foreground">{stat.label}</span>
            <span className="text-sm font-semibold">{stat.value}</span>
          </div>
        ))}
      </aside>
    )
  }

  const isTop = position === 'top'

  return (
    <div
      className={cn(
        'bg-background/95 backdrop-blur border-b flex items-center gap-4 px-4 py-2 z-30',
        isTop ? 'sticky top-0' : 'fixed bottom-0 left-0 right-0 border-t border-b-0 md:left-60',
        // On mobile with bottom nav, need to be above it
        !isTop && 'mb-0 md:mb-0 bottom-12 md:bottom-0'
      )}
    >
      <div className="flex items-center gap-4 overflow-x-auto flex-1 min-w-0">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-muted-foreground whitespace-nowrap">{stat.label}:</span>
            <span className="text-xs font-semibold whitespace-nowrap">{stat.value}</span>
          </div>
        ))}
      </div>
      <PositionPicker />
    </div>
  )
}
