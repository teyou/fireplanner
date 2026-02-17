import { Outlet, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Sidebar } from './Sidebar'
import { FireStatsStrip } from './FireStatsStrip'
import { SaveIndicator } from './SaveIndicator'
import { useUIStore } from '@/stores/useUIStore'
import { cn } from '@/lib/utils'

// Pages that show the stats strip (inputs and analysis pages, not start/reference)
const STATS_ROUTES = ['/inputs', '/projection', '/stress-test', '/dashboard']

export function AppLayout() {
  const statsPosition = useUIStore((s) => s.statsPosition)
  const location = useLocation()

  const showStats = STATS_ROUTES.includes(location.pathname)
  const isSidebar = statsPosition === 'sidebar'
  const isBottom = statsPosition === 'bottom'
  const isTop = statsPosition === 'top'

  return (
    <div className="flex h-screen overflow-hidden">
      <Toaster position="bottom-right" />
      <SaveIndicator />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {showStats && isTop && <FireStatsStrip position="top" />}
        <div className="flex-1 flex min-h-0">
          <main
            className={cn(
              'flex-1 overflow-auto min-h-0',
              'pb-14 md:pb-0', // clear mobile bottom nav
              showStats && isBottom && 'pb-24 md:pb-10' // extra space for stats strip above nav
            )}
          >
            <div className="container py-6 max-w-6xl">
              <Outlet />
            </div>
          </main>
          {showStats && isSidebar && <FireStatsStrip position="sidebar" />}
        </div>
        {showStats && isBottom && <FireStatsStrip position="bottom" />}
      </div>
    </div>
  )
}
