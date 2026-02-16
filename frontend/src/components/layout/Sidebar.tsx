import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  User,
  DollarSign,
  PieChart,
  TableProperties,
  BarChart3,
  TrendingDown,
  History,
  LayoutDashboard,
  Home as HomeIcon,
  AlertTriangle,
  BookOpen,
} from 'lucide-react'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'START',
    items: [
      { label: 'Start Here', path: '/', icon: <HomeIcon className="h-4 w-4" /> },
    ],
  },
  {
    title: 'INPUTS',
    items: [
      { label: 'FIRE Profile', path: '/profile', icon: <User className="h-4 w-4" /> },
      { label: 'Income Engine', path: '/income', icon: <DollarSign className="h-4 w-4" /> },
      { label: 'Asset Allocation', path: '/allocation', icon: <PieChart className="h-4 w-4" /> },
      { label: 'Projection', path: '/projection', icon: <TableProperties className="h-4 w-4" /> },
    ],
  },
  {
    title: 'ANALYSIS',
    items: [
      { label: 'Monte Carlo', path: '/monte-carlo', icon: <BarChart3 className="h-4 w-4" /> },
      { label: 'Withdrawal', path: '/withdrawal', icon: <TrendingDown className="h-4 w-4" /> },
      { label: 'Sequence Risk', path: '/sequence-risk', icon: <AlertTriangle className="h-4 w-4" /> },
      { label: 'Backtest', path: '/backtest', icon: <History className="h-4 w-4" /> },
    ],
  },
  {
    title: 'RESULTS',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
      { label: 'Property', path: '/property', icon: <HomeIcon className="h-4 w-4" /> },
      { label: 'Reference', path: '/reference', icon: <BookOpen className="h-4 w-4" /> },
    ],
  },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r bg-muted/30 p-4 gap-6">
        <div className="font-bold text-lg px-2">FIRE Planner</div>
        <nav className="flex flex-col gap-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <div className="text-xs font-semibold text-muted-foreground px-2 mb-1">
                {group.title}
              </div>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                      location.pathname === item.path
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t flex justify-around py-2 z-50">
        {[
          { label: 'Start', path: '/', icon: <HomeIcon className="h-5 w-5" /> },
          { label: 'Profile', path: '/profile', icon: <User className="h-5 w-5" /> },
          { label: 'Income', path: '/income', icon: <DollarSign className="h-5 w-5" /> },
          { label: 'MC', path: '/monte-carlo', icon: <BarChart3 className="h-5 w-5" /> },
          { label: 'Dash', path: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
        ].map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={cn(
              'flex flex-col items-center gap-0.5 text-xs',
              location.pathname === item.path
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
