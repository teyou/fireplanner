import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  User,
  DollarSign,
  PieChart,
  TableProperties,
  TrendingDown,
  LayoutDashboard,
  Home as HomeIcon,
  BookOpen,
  Landmark,
  Building,
  ShieldAlert,
  Menu,
  X,
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
      { label: 'CPF', path: '/cpf', icon: <Landmark className="h-4 w-4" /> },
      { label: 'Property', path: '/property', icon: <Building className="h-4 w-4" /> },
      { label: 'Asset Allocation', path: '/allocation', icon: <PieChart className="h-4 w-4" /> },
      { label: 'Spending', path: '/spending', icon: <TrendingDown className="h-4 w-4" /> },
    ],
  },
  {
    title: 'PLAN',
    items: [
      { label: 'Projection', path: '/projection', icon: <TableProperties className="h-4 w-4" /> },
    ],
  },
  {
    title: 'ANALYSIS',
    items: [
      { label: 'Stress Test', path: '/stress-test', icon: <ShieldAlert className="h-4 w-4" /> },
    ],
  },
  {
    title: 'RESULTS',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    ],
  },
  {
    title: 'REFERENCE',
    items: [
      { label: 'Reference Guide', path: '/reference', icon: <BookOpen className="h-4 w-4" /> },
    ],
  },
]

function NavGroups({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation()

  return (
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
                onClick={onNavigate}
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
  )
}

export function Sidebar() {
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r bg-muted/30 p-4 gap-6">
        <div className="font-bold text-lg px-2">FIRE Planner</div>
        <NavGroups />
      </aside>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-md bg-background border shadow-sm"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile slide-out drawer */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-[60]"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer */}
          <aside className="md:hidden fixed top-0 left-0 bottom-0 w-64 bg-background border-r z-[70] p-4 overflow-y-auto animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="font-bold text-lg">FIRE Planner</div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded-md hover:bg-accent"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavGroups onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </>
      )}

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t flex justify-around py-2 z-50">
        {[
          { label: 'Start', path: '/', icon: <HomeIcon className="h-5 w-5" /> },
          { label: 'Profile', path: '/profile', icon: <User className="h-5 w-5" /> },
          { label: 'CPF', path: '/cpf', icon: <Landmark className="h-5 w-5" /> },
          { label: 'Plan', path: '/projection', icon: <TableProperties className="h-5 w-5" /> },
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
