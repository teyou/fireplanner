import { useState, useEffect, useCallback, useRef } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/useUIStore'
import { useSectionCompletion, type SectionId } from '@/hooks/useSectionCompletion'
import { exportToJson, importFromJson } from '@/lib/exportImport'
import { ShareButton } from '@/components/shared/ShareButton'
import { ScenarioManager } from './ScenarioManager'
import { ThemeToggle } from './ThemeToggle'
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
  Download,
  Upload,
  CheckSquare,
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
  { label: 'Property', sectionId: 'section-property', icon: <Building className="h-4 w-4" /> },
  { label: 'Expenses', sectionId: 'section-expenses', icon: <TrendingDown className="h-4 w-4" /> },
  { label: 'Allocation', sectionId: 'section-allocation', icon: <PieChart className="h-4 w-4" /> },
  { label: 'FIRE Settings', sectionId: 'section-fire-settings', icon: <Target className="h-4 w-4" /> },
  { label: 'CPF', sectionId: 'section-cpf', icon: <Landmark className="h-4 w-4" /> },
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
      { label: 'Checklist', path: '/checklist', icon: <CheckSquare className="h-4 w-4" /> },
    ],
  },
]

function useActiveSection() {
  const location = useLocation()
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const isInputsPage = location.pathname === '/inputs'
  const cpfEnabled = useUIStore((s) => s.cpfEnabled)
  const propertyEnabled = useUIStore((s) => s.propertyEnabled)

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
      ...(cpfEnabled ? ['section-cpf'] : []),
      ...(propertyEnabled ? ['section-property'] : []),
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
  }, [isInputsPage, cpfEnabled, propertyEnabled])

  // When not on inputs page, don't report any active section
  return { activeSection: isInputsPage ? activeSection : null, isInputsPage }
}

function StatusDot({ sectionId, sections }: { sectionId: string; sections: ReturnType<typeof useSectionCompletion>['sections'] }) {
  const section = sections[sectionId as SectionId]
  if (!section) return null

  if (section.status === 'error') {
    return <span className="ml-auto h-2 w-2 rounded-full bg-destructive shrink-0" title={`${section.errorCount} error(s)`} />
  }
  if (section.status === 'customized') {
    return <span className="ml-auto h-2 w-2 rounded-full bg-green-500 shrink-0" title="Customized" />
  }
  return <span className="ml-auto h-2 w-2 rounded-full bg-muted-foreground/30 shrink-0" title="Using defaults" />
}

function NavGroups({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const sectionOrder = useUIStore((s) => s.sectionOrder)
  const { activeSection, isInputsPage } = useActiveSection()
  const { sections } = useSectionCompletion()

  const cpfEnabled = useUIStore((s) => s.cpfEnabled)
  const propertyEnabled = useUIStore((s) => s.propertyEnabled)

  const hiddenSectionIds = new Set<string>()
  if (!cpfEnabled) hiddenSectionIds.add('section-cpf')
  if (!propertyEnabled) hiddenSectionIds.add('section-property')

  const allInputSections = sectionOrder === 'goal-first'
    ? GOAL_FIRST_SECTIONS
    : sectionOrder === 'already-fire'
      ? ALREADY_FIRE_SECTIONS
      : STORY_FIRST_SECTIONS

  const inputSections = allInputSections.filter((s) => !hiddenSectionIds.has(s.sectionId))

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
                  'flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors',
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
                'flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors text-left w-full',
                isInputsPage && activeSection === item.sectionId
                  ? 'bg-primary text-primary-foreground'
                  : isInputsPage
                    ? 'hover:bg-accent'
                    : 'hover:bg-accent'
              )}
            >
              {item.icon}
              {item.label}
              <StatusDot sectionId={item.sectionId} sections={sections} />
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
                  'flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors',
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

function DataActions() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    exportToJson()
    toast.success('Data exported')
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ok = await importFromJson(file)
    if (!ok) {
      toast.error('Failed to import — invalid file format')
    }
    // Reset so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="flex items-center gap-1 px-2">
      <button
        onClick={handleExport}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        title="Export data as JSON"
      >
        <Download className="h-3.5 w-3.5" />
        Export
      </button>
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        title="Import data from JSON"
      >
        <Upload className="h-3.5 w-3.5" />
        Import
      </button>
      <ShareButton />
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImport}
      />
    </div>
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
        <div className="mt-auto border-t pt-3 space-y-2">
          <ScenarioManager />
          <DataActions />
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 p-2.5 rounded-md bg-background border shadow-sm"
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
          <aside role="dialog" aria-modal="true" aria-label="Navigation menu" className="md:hidden fixed top-0 left-0 bottom-0 w-64 bg-background border-r z-[70] p-4 overflow-y-auto animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="font-bold text-lg">FIRE Planner</div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-md hover:bg-accent"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavGroups onNavigate={() => setDrawerOpen(false)} />
            <div className="mt-6 border-t pt-3 space-y-2">
              <ScenarioManager />
              <DataActions />
              <ThemeToggle />
            </div>
          </aside>
        </>
      )}

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t flex justify-around py-3 z-50">
        {[
          { label: 'Inputs', path: '/inputs', icon: <Settings2 className="h-5 w-5" /> },
          { label: 'Plan', path: '/projection', icon: <TableProperties className="h-5 w-5" /> },
          { label: 'Test', path: '/stress-test', icon: <ShieldAlert className="h-5 w-5" /> },
          { label: 'Dash', path: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
          { label: 'Guide', path: '/reference', icon: <BookOpen className="h-5 w-5" /> },
        ].map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={cn(
              'flex flex-col items-center gap-0.5 text-xs min-w-[48px]',
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
