import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Sidebar } from './Sidebar'
import { FireStatsStrip } from './FireStatsStrip'
import { SaveIndicator } from './SaveIndicator'
import { HelpPanel } from './HelpPanel'
import { PlanUrlHandler } from '@/components/shared/PlanUrlHandler'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { useUIStore } from '@/stores/useUIStore'
import { cn } from '@/lib/utils'
import { tryUndo } from '@/lib/undo'

// Pages that show the stats strip (inputs and analysis pages, not start/reference)
const STATS_ROUTES = ['/inputs', '/projection', '/stress-test', '/dashboard']

export function AppLayout() {
  const statsPosition = useUIStore((s) => s.statsPosition)
  const helpPanelOpen = useUIStore((s) => s.helpPanelOpen)
  const location = useLocation()

  // Global Ctrl+Z / Cmd+Z undo shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        // Only intercept if not focused on an input/textarea (those have native undo)
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        if (tryUndo()) {
          e.preventDefault()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const showStats = STATS_ROUTES.includes(location.pathname)
  const isBottom = statsPosition === 'bottom'
  const isTop = statsPosition === 'top'

  return (
    <div className="flex h-screen overflow-hidden">
      <Toaster position="bottom-right" />
      <SaveIndicator />
      <PlanUrlHandler />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {showStats && isTop && <FireStatsStrip position="top" />}
        <ResizablePanelGroup
          orientation="horizontal"
          className="flex-1 min-h-0"
        >
          <ResizablePanel id="main" defaultSize={100} minSize={50}>
            <main
              className={cn(
                'h-full overflow-auto',
                'pb-14 md:pb-0',
                showStats && isBottom && 'pb-24 md:pb-10'
              )}
            >
              <div className="container py-6 max-w-6xl">
                <Outlet />
              </div>
              <footer className="container max-w-6xl pb-6 px-6">
                <p className="text-xs text-muted-foreground text-center">
                  This tool is for educational and planning purposes only. It does not constitute financial advice.
                  Results are estimates based on historical data and assumptions that may not reflect future outcomes.
                </p>
              </footer>
            </main>
          </ResizablePanel>
          {helpPanelOpen && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel id="help" defaultSize={30} minSize={20} maxSize={50}>
                <HelpPanel />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
        {showStats && isBottom && <FireStatsStrip position="bottom" />}
      </div>
    </div>
  )
}
