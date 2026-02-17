import { useState, useEffect, useCallback } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/useUIStore'
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
  Target,
  Wallet,
  Settings2,
} from 'lucide-react'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
}

interface InputSectionItem {
  label: string
  sectionId: string
  icon: React.ReactNode
}

const GOAL_FIRST_SECTIONS: InputSectionItem[] = [
  { label: 'Personal', sectionId: 'section-personal', icon: <User className="h-4 w-4" /> },
  { label: 'FIRE Settings', sectionId: 'section-fire-settings', icon: <Target className="h-4 w-4" /> },
  { label: 'Income', sectionId: 'section-income', icon: <DollarSign className="h-4 w-4" /> },
  { label: 'Expenses', sectionId: 'section-expenses', icon: <TrendingDown className="h-4 w-4" /> },
  { label: 'Net Worth', sectionId: 'section-net-worth', icon: <Wallet className="h-4 w-4" /> },
  { label: 'CPF', sectionId: 'section-cpf', icon: <Landmark className="h-4 w-4" /> },
  { label: 'Property', sectionId: 'section-property', icon: <Building className="h-4 w-4" /> },
  { label: 'Allocation', sectionId: 'section-allocation', icon: <PieChart className="h-4 w-4" /> },
]

const STORY_FIRST_SECTIONS: InputSectionItem[] = [
  { label: 'Personal', sectionId: 'section-personal', icon: <User className="h-4 w-4" /> },
  { label: 'Income', sectionId: 'section-income', icon: <DollarSign className="h-4 w-4" /> },
  { label: 'Expenses', sectionId: 'section-expenses', icon: <TrendingDown className="h-4 w-4" /> },
  { label: 'Net Worth', sectionId: 'section-net-worth', icon: <Wallet className="h-4 w-4" /> },
  { label: 'CPF', sectionId: 'section-cpf', icon: <Landmark className="h-4 w-4" /> },
  { label: 'Property', sectionId: 'section-property', icon: <Building className="h-4 w-4" /> },
  { label: 'Allocation', sectionId: 'section-allocation', icon: <PieChart className="h-4 w-4" /> },
  { label: 'FIRE Settings', sectionId: 'section-fire-settings', icon: <Target className="h-4 w-4" /> },
]

const ALREADY_FIRE_SECTIONS: InputSectionItem[] = [
  { label: 'Personal', sectionId: 'section-personal', icon: <User className="h-4 w-4" /> },
  { label: 'Net Worth', sectionId: 'section-net-worth', icon: <Wallet className="h-4 w-4" /> },
  { label: 'Expenses', sectionId: 'section-expenses', icon: <TrendingDown className="h-4 w-4" /> },
  { label: 'Allocation', sectionId: 'section-allocation', icon: <PieChart className="h-4 w-4" /> },
  { label: 'FIRE Settings', sectionId: 'section-fire-settings', icon: <Target className="h-4 w-4" /> },
  { label: 'CPF', sectionId: 'section-cpf', icon: <Landmark className="h-4 w-4" /> },
  { label: 'Property', sectionId: 'section-property', icon: <Building className="h-4 w-4" /> },
  { label: 'Income', sectionId: 'section-income', icon: <DollarSign className="h-4 w-4" /> },
]

const NON_INPUT_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'START',
    items: [
      { label: 'Start Here', path: '/', icon: <HomeIcon className="h-4 w-4" /> },
    ],
  },
]

const AFTER_INPUTS_GROUPS: { title: string; items: NavItem[] }[] = [
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

function useActiveSection() {
  const location = useLocation()
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const isInputsPage = location.pathname === '/inputs'

  useEffect(() => {
    if (!isInputsPage) {
      return
    }

    const sectionIds = [
      'section-personal',
      'section-fire-settings',
      'section-income',
      'section-expenses',
      'section-net-worth',
      'section-cpf',
      'section-property',
      'section-allocation',
    ]

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the most visible section in the viewport
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) {
          // Pick the one closest to the top of viewport
          const top = visible.reduce((a, b) =>
            a.boundingClientRect.top < b.boundingClientRect.top ? a : b
          )
          setActiveSection(top.target.id)
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    )

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as Element[]

    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [isInputsPage])

  // When not on inputs page, don't report any active section
  return { activeSection: isInputsPage ? activeSection : null, isInputsPage }
}

function NavGroups({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const sectionOrder = useUIStore((s) => s.sectionOrder)
  const { activeSection, isInputsPage } = useActiveSection()

  const inputSections = sectionOrder === 'goal-first'
    ? GOAL_FIRST_SECTIONS
    : sectionOrder === 'already-fire'
      ? ALREADY_FIRE_SECTIONS
      : STORY_FIRST_SECTIONS

  const handleSectionClick = useCallback(
    (sectionId: string) => {
      if (isInputsPage) {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
      } else {
        navigate(`/inputs#${sectionId}`)
      }
      onNavigate?.()
    },
    [isInputsPage, navigate, onNavigate]
  )

  return (
    <nav className="flex flex-col gap-4">
      {/* START group */}
      {NON_INPUT_GROUPS.map((group) => (
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

      {/* INPUTS group — section anchors */}
      <div>
        <div className="text-xs font-semibold text-muted-foreground px-2 mb-1">
          INPUTS
        </div>
        <div className="flex flex-col gap-0.5">
          {inputSections.map((item) => (
            <button
              key={item.sectionId}
              onClick={() => handleSectionClick(item.sectionId)}
              className={cn(
                'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left w-full',
                isInputsPage && activeSection === item.sectionId
                  ? 'bg-primary text-primary-foreground'
                  : isInputsPage
                    ? 'hover:bg-accent'
                    : 'hover:bg-accent'
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Remaining nav groups */}
      {AFTER_INPUTS_GROUPS.map((group) => (
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

  // Handle hash-based scroll on /inputs page load
  useEffect(() => {
    if (location.pathname === '/inputs' && location.hash) {
      const id = location.hash.slice(1)
      // Small delay to let the page render
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      })
    }
  }, [location.pathname, location.hash])

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r bg-muted/30 p-4 gap-6 h-screen overflow-y-auto shrink-0">
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
          { label: 'Inputs', path: '/inputs', icon: <Settings2 className="h-5 w-5" /> },
          { label: 'Plan', path: '/projection', icon: <TableProperties className="h-5 w-5" /> },
          { label: 'Test', path: '/stress-test', icon: <ShieldAlert className="h-5 w-5" /> },
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
