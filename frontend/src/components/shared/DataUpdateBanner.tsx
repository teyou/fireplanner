import { X, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useUIStore } from '@/stores/useUIStore'
import { CHANGELOG, DATA_VINTAGE } from '@/lib/data/changelog'

export function DataUpdateBanner() {
  const lastSeenDataVintage = useUIStore((s) => s.lastSeenDataVintage)
  const lastSeenDate = useUIStore((s) => s.lastSeenChangelogDate)
  const markChangelogSeen = useUIStore((s) => s.markChangelogSeen)

  // First-time users have never seen the app — don't show update banner
  if (lastSeenDataVintage === null && lastSeenDate === null) return null
  if (lastSeenDataVintage === DATA_VINTAGE) return null

  const unseenEntries = CHANGELOG.filter(
    (e) => !lastSeenDate || e.date >= lastSeenDate
  )
  if (unseenEntries.length === 0) return null

  const dataUpdates = unseenEntries.filter((e) => e.category === 'data-update')
  const latestEntry = unseenEntries[0]
  const reviewSection = dataUpdates[0]?.affectedSections?.[0]

  return (
    <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/50 p-3 text-sm mb-4">
      <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <span className="text-foreground font-medium">{latestEntry.title}</span>
        {unseenEntries.length > 1 && (
          <span className="text-muted-foreground"> (+{unseenEntries.length - 1} more)</span>
        )}
        <span className="text-muted-foreground"> · </span>
        <Link to="/reference#changelog" className="text-blue-600 dark:text-blue-400 hover:underline">
          See what changed
        </Link>
        {reviewSection && (
          <>
            <span className="text-muted-foreground"> · </span>
            <Link to={`/inputs#${reviewSection}`} className="text-blue-600 dark:text-blue-400 hover:underline">
              Review inputs
            </Link>
          </>
        )}
      </div>
      <button onClick={markChangelogSeen} className="text-muted-foreground hover:text-foreground shrink-0" aria-label="Dismiss">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
