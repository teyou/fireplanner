# Help Panel, Disclaimer & Source Attribution — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a resizable right-side help panel with context-aware FAQ, a two-layer disclaimer system, and structured source attribution to Fireplanner.

**Architecture:** Install shadcn's Resizable component (built on `react-resizable-panels`). Split `AppLayout.tsx`'s main content area into a `ResizablePanelGroup` with page content on the left and a collapsible `HelpPanel` on the right. Help panel state (open/closed) stored in `useUIStore`. FAQ content is a static data map keyed by route. Disclaimers are a persistent footer in AppLayout + conditional Alert on simulation pages.

**Tech Stack:** react-resizable-panels (via shadcn), Radix Accordion (already installed), Zustand (useUIStore), React Router (useLocation)

**Design doc:** `docs/plans/2026-02-21-help-panel-disclaimer-sources-design.md`

---

## Task 1: Install shadcn Resizable + Alert components

**Files:**
- Create: `frontend/src/components/ui/resizable.tsx` (via shadcn CLI)
- Create: `frontend/src/components/ui/alert.tsx` (via shadcn CLI)
- Modify: `frontend/package.json` (new dependency: `react-resizable-panels`)

**Step 1: Install the resizable component**

Run from `frontend/`:
```bash
npx shadcn@latest add resizable
```

Expected: Creates `src/components/ui/resizable.tsx` and adds `react-resizable-panels` to `package.json` dependencies.

**Step 2: Install the alert component**

```bash
npx shadcn@latest add alert
```

Expected: Creates `src/components/ui/alert.tsx`.

**Step 3: Verify install**

```bash
npm run type-check
```

Expected: PASS — no errors.

**Step 4: Commit**

```bash
git add src/components/ui/resizable.tsx src/components/ui/alert.tsx package.json package-lock.json
git commit -m "chore: add shadcn resizable and alert components"
```

---

## Task 2: Create source attribution data file

**Files:**
- Create: `frontend/src/lib/data/sources.ts`

This extracts the source comments already in each `lib/data/*.ts` file into a structured, importable map.

**Step 1: Create `sources.ts`**

```typescript
/**
 * Structured data source attributions.
 * Extracted from header comments in lib/data/ files.
 * Surfaced in the Help Panel and Reference Guide.
 */

export interface DataSource {
  name: string
  url: string
  period: string
  license: string
}

/** Sources grouped by the page/topic they're relevant to. */
export const DATA_SOURCES: Record<string, DataSource[]> = {
  cpf: [
    {
      name: 'CPF Contribution Rates',
      url: 'https://www.cpf.gov.sg/employer/employer-obligations/how-much-cpf-contributions-to-pay',
      period: '2024',
      license: 'Public data',
    },
  ],
  tax: [
    {
      name: 'SG Progressive Income Tax',
      url: 'https://www.iras.gov.sg/taxes/individual-income-tax/basics-of-individual-income-tax/tax-residency-and-tax-rates/individual-income-tax-rates',
      period: 'YA 2024+',
      license: 'Public data',
    },
  ],
  income: [
    {
      name: 'MOM Salary Benchmarks',
      url: 'https://stats.mom.gov.sg',
      period: '2024',
      license: 'SG Open Data License',
    },
  ],
  historicalReturns: [
    {
      name: 'US Equities (S&P 500)',
      url: 'https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histretSP.html',
      period: '1928-2024',
      license: 'Academic/free',
    },
    {
      name: 'SG Equities (STI)',
      url: 'https://www.sgx.com',
      period: '1987-2024',
      license: 'SG Open Data License',
    },
    {
      name: 'Intl Equities (MSCI World)',
      url: 'https://www.msci.com',
      period: '1970-2024',
      license: 'Free for personal use, attribute MSCI',
    },
    {
      name: 'Bonds (10-yr Treasury)',
      url: 'https://fred.stlouisfed.org',
      period: '1928-2024',
      license: 'Public domain',
    },
    {
      name: 'REITs (FTSE NAREIT)',
      url: 'https://www.reit.com/data-research',
      period: '1972-2024',
      license: 'Free with attribution',
    },
    {
      name: 'Gold (LBMA)',
      url: 'https://www.gold.org',
      period: '1968-2024',
      license: 'Free non-commercial',
    },
    {
      name: 'Cash (3-month T-Bill)',
      url: 'https://fred.stlouisfed.org',
      period: '1928-2024',
      license: 'Public domain',
    },
    {
      name: 'CPF Interest Rates',
      url: 'https://www.cpf.gov.sg/member/cpf-overview',
      period: 'Published rates',
      license: 'Public',
    },
  ],
  property: [
    {
      name: "Bala's Table (SLA)",
      url: 'https://www.sla.gov.sg',
      period: '2024',
      license: 'Public data',
    },
  ],
  crisisScenarios: [
    {
      name: 'Crisis Scenarios',
      url: 'https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histretSP.html',
      period: '1928-2024',
      license: 'Academic/free (Damodaran), Public domain (FRED)',
    },
  ],
}

/**
 * Map route paths to relevant source keys.
 * A route may reference multiple source groups.
 */
export const ROUTE_SOURCES: Record<string, string[]> = {
  '/inputs': ['cpf', 'tax', 'income', 'property'],
  '/projection': ['cpf', 'tax', 'income', 'historicalReturns'],
  '/stress-test': ['historicalReturns', 'crisisScenarios'],
  '/dashboard': ['cpf', 'tax', 'historicalReturns'],
}

/** Get all sources relevant to a given route. */
export function getSourcesForRoute(route: string): DataSource[] {
  const keys = ROUTE_SOURCES[route] ?? []
  const seen = new Set<string>()
  const result: DataSource[] = []
  for (const key of keys) {
    for (const src of DATA_SOURCES[key] ?? []) {
      if (!seen.has(src.url)) {
        seen.add(src.url)
        result.push(src)
      }
    }
  }
  return result
}
```

**Step 2: Verify type-check**

```bash
cd frontend && npm run type-check
```

Expected: PASS.

**Step 3: Commit**

```bash
git add src/lib/data/sources.ts
git commit -m "feat: add structured data source attributions"
```

---

## Task 3: Create FAQ content data file

**Files:**
- Create: `frontend/src/lib/data/helpContent.ts`

Static FAQ content keyed by route. Each entry has a question (accordion trigger) and answer (accordion content as plain text/markdown string).

**Step 1: Create `helpContent.ts`**

```typescript
/**
 * Context-aware FAQ content for the Help Panel.
 * Keyed by route path. Each route has 3-5 FAQ items.
 * Content extracted/summarized from ReferencePage sections.
 */

export interface HelpFaqItem {
  question: string
  answer: string
}

export const HELP_FAQ: Record<string, HelpFaqItem[]> = {
  '/': [
    {
      question: 'What is FIRE?',
      answer:
        'FIRE stands for Financial Independence, Retire Early. It means building enough savings and investments so that your investment returns can cover your living expenses indefinitely, freeing you from needing employment income.',
    },
    {
      question: 'How does this tool work?',
      answer:
        'Enter your financial details (income, expenses, savings, CPF), and the tool projects when you can achieve financial independence. It uses Singapore-specific data for CPF, tax, and property calculations. All data stays in your browser — nothing is sent to a server.',
    },
    {
      question: 'What is the 4% rule?',
      answer:
        'A guideline from William Bengen\'s 1994 study: if you withdraw 4% of your portfolio in year one and adjust for inflation each year, your money should last at least 30 years. This tool lets you test different withdrawal rates and strategies.',
    },
  ],

  '/inputs': [
    {
      question: 'How is my FIRE number calculated?',
      answer:
        'FIRE Number = Annual Expenses / Safe Withdrawal Rate. For example, $48,000 expenses with a 4% SWR gives a FIRE number of $1,200,000. This is the portfolio size needed to sustain your lifestyle from investment returns.',
    },
    {
      question: 'How does CPF affect my plan?',
      answer:
        'CPF contributions reduce your take-home pay during accumulation but grow at guaranteed rates (OA: 2.5%, SA: 4%). At 55, your Retirement Account is set up, and at 65 CPF LIFE provides a monthly payout that reduces how much you need from your portfolio.',
    },
    {
      question: 'What are the salary models?',
      answer:
        'Simple: fixed annual growth rate. Realistic: career phases with promotion jumps at configurable ages. Data-Driven: uses MOM (Ministry of Manpower) salary benchmarks by age and education level.',
    },
    {
      question: 'Should I include property?',
      answer:
        'Include property if you want to model mortgage payments reducing savings, rental income in retirement, or property equity as part of net worth. The tool handles BSD, ABSD, LTV, and lease decay via Bala\'s Table.',
    },
  ],

  '/projection': [
    {
      question: 'What does the projection table show?',
      answer:
        'A year-by-year breakdown from your current age to life expectancy, showing income, expenses, savings, CPF balances, investment growth, and total net worth. All values can be shown in today\'s dollars (inflation-adjusted) or future/nominal dollars.',
    },
    {
      question: 'What is the difference between nominal and real dollars?',
      answer:
        'Nominal (future) dollars are the actual amounts you\'ll see. Real (today\'s) dollars adjust for inflation so you can compare future values to what money buys today. At 2.5% inflation, $100K in 20 years is worth about $61K in today\'s dollars.',
    },
    {
      question: 'Why does my portfolio drop at retirement?',
      answer:
        'In retirement years, you\'re withdrawing from your portfolio to cover expenses instead of adding savings. The projection assumes your chosen withdrawal strategy (e.g., 4% rule) starts at your retirement age.',
    },
  ],

  '/stress-test': [
    {
      question: 'What is Monte Carlo simulation?',
      answer:
        'Running 10,000 random market scenarios to see how often your plan survives. Each scenario generates different annual returns based on historical data. A 95% success rate means your plan survived in 9,500 of 10,000 scenarios.',
    },
    {
      question: 'Parametric vs Bootstrap vs Fat-tail?',
      answer:
        'Parametric: generates returns from a bell curve using historical mean/volatility. Bootstrap: randomly samples actual historical years. Fat-tail: uses a Student-t distribution that produces more extreme events (crashes/booms) than a normal bell curve.',
    },
    {
      question: 'What is sequence of returns risk?',
      answer:
        'The risk that bad market returns happen early in your retirement, when your portfolio is largest and withdrawals have the biggest impact. A 30% crash in year 1 of retirement is far more damaging than the same crash in year 20.',
    },
    {
      question: 'What is historical backtesting?',
      answer:
        'Tests your plan against every possible starting year in history. If your plan is 30 years long, it tests starting in 1928, 1929, 1930... through the most recent possible window. Shows which historical periods would have failed.',
    },
    {
      question: 'What mitigations reduce sequence risk?',
      answer:
        'Bond tent: temporarily holding more bonds around retirement. Cash buffer: keeping 1-3 years of expenses in cash. Flexible spending: reducing withdrawals by 10-25% when the portfolio drops below a threshold.',
    },
  ],

  '/dashboard': [
    {
      question: 'How is the risk score calculated?',
      answer:
        'The risk assessment scores 6 dimensions: withdrawal rate sustainability, portfolio diversification, sequence risk exposure, income stability, CPF/annuity coverage, and expense flexibility. Each dimension is rated and combined into an overall score.',
    },
    {
      question: 'What does "years to FIRE" mean?',
      answer:
        'The number of years until your projected net worth reaches your FIRE number, assuming your current savings rate and expected investment returns continue. If already past your FIRE number, this shows 0.',
    },
    {
      question: 'What is Coast FIRE?',
      answer:
        'The portfolio size where, even if you stop saving entirely, compound growth alone will reach your FIRE number by retirement age. Once you hit Coast FIRE, you only need to earn enough to cover current expenses.',
    },
  ],

  '/reference': [],
  '/checklist': [],
}
```

**Step 2: Verify type-check**

```bash
cd frontend && npm run type-check
```

Expected: PASS.

**Step 3: Commit**

```bash
git add src/lib/data/helpContent.ts
git commit -m "feat: add context-aware FAQ content for help panel"
```

---

## Task 4: Add help panel state to useUIStore

**Files:**
- Modify: `frontend/src/stores/useUIStore.ts:7-34` (add `helpPanelOpen` field)
- Modify: `frontend/src/stores/useUIStore.ts:66-88` (bump version, add migration)

**Step 1: Add `helpPanelOpen` to the UIState interface and defaults**

In `useUIStore.ts`, add to `UIState` interface (after line 15):
```typescript
helpPanelOpen: boolean
```

Add to `UIActions` interface (after line 22):
```typescript
toggleHelpPanel: () => void
```

Add to `DEFAULT_UI` (after line 33):
```typescript
helpPanelOpen: false,
```

Add the action implementation inside the `persist` callback (after the `dismissNudge` action):
```typescript
toggleHelpPanel: () => set((state) => ({ helpPanelOpen: !state.helpPanelOpen })),
```

**Step 2: Bump persist version and add migration**

Change version from `4` to `5` on the persist config.

Add migration case inside the `migrate` function:
```typescript
if (version < 5) {
  state.helpPanelOpen = false
}
```

**Step 3: Verify type-check and existing tests**

```bash
cd frontend && npm run type-check && npm run test -- --run stores/useUIStore
```

Expected: type-check PASS, existing tests PASS.

**Step 4: Commit**

```bash
git add src/stores/useUIStore.ts
git commit -m "feat: add helpPanelOpen state to UI store"
```

---

## Task 5: Create HelpPanel component

**Files:**
- Create: `frontend/src/components/layout/HelpPanel.tsx`

**Step 1: Create the component**

```tsx
import { useLocation } from 'react-router-dom'
import { X, ExternalLink } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/stores/useUIStore'
import { HELP_FAQ } from '@/lib/data/helpContent'
import { getSourcesForRoute } from '@/lib/data/sources'

export function HelpPanel() {
  const { pathname } = useLocation()
  const toggleHelpPanel = useUIStore((s) => s.toggleHelpPanel)

  const faqItems = HELP_FAQ[pathname] ?? []
  const sources = getSourcesForRoute(pathname)

  return (
    <div className="h-full flex flex-col bg-muted/30 border-l">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <h2 className="text-sm font-semibold">Help</h2>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleHelpPanel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {faqItems.length > 0 ? (
          <Accordion type="multiple" className="w-full">
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-sm text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="text-sm text-muted-foreground">No help content for this page.</p>
        )}

        {/* Data Sources */}
        {sources.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Data Sources
            </h3>
            <ul className="space-y-1.5">
              {sources.map((src, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    {src.name}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <span className="ml-1 text-muted-foreground/60">({src.period})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Verify type-check**

```bash
cd frontend && npm run type-check
```

Expected: PASS.

**Step 3: Commit**

```bash
git add src/components/layout/HelpPanel.tsx
git commit -m "feat: create HelpPanel component with route-aware FAQ and sources"
```

---

## Task 6: Integrate resizable panels into AppLayout

**Files:**
- Modify: `frontend/src/components/layout/AppLayout.tsx` (major refactor of lines 39-60)

This is the most impactful change. The current `<main>` wrapper becomes a `<ResizablePanelGroup>` with two panels.

**Step 1: Update imports in AppLayout.tsx**

Add at the top of the file:
```typescript
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { HelpPanel } from './HelpPanel'
import { useUIStore } from '@/stores/useUIStore'
```

Note: `useUIStore` is already imported (line 8). Only add the first two imports.

**Step 2: Read help panel state**

Inside `AppLayout()`, add after the existing `useUIStore` call (line 16):
```typescript
const helpPanelOpen = useUIStore((s) => s.helpPanelOpen)
```

**Step 3: Replace the main content area**

Replace lines 45-59 (the `<div className="flex-1 flex flex-col ...">` block) with:

```tsx
<div className="flex-1 flex flex-col min-w-0 min-h-0">
  {showStats && isTop && <FireStatsStrip position="top" />}
  <ResizablePanelGroup
    direction="horizontal"
    autoSaveId="help-panel-sizes"
    className="flex-1 min-h-0"
  >
    <ResizablePanel defaultSize={100} minSize={50}>
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
        {/* Persistent disclaimer footer */}
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
        <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
          <HelpPanel />
        </ResizablePanel>
      </>
    )}
  </ResizablePanelGroup>
  {showStats && isBottom && <FireStatsStrip position="bottom" />}
</div>
```

**Key changes from existing layout:**
- `<main>` is now wrapped inside a `<ResizablePanel>`
- Disclaimer footer added below `<Outlet />` inside `<main>`
- Help panel conditionally rendered as a second `<ResizablePanel>`
- `ResizablePanelGroup` has `autoSaveId` for size persistence
- `FireStatsStrip` stays outside the resizable group

**Step 4: Verify type-check and dev server**

```bash
cd frontend && npm run type-check
```

Expected: PASS.

Start dev server and visually verify:
```bash
lsof -ti:5173 | xargs kill -9 2>/dev/null; cd frontend && npm run dev -- --port 5173
```

- Page should render normally (panel is closed by default)
- Disclaimer text should appear at the bottom of each page's scrollable area
- No layout shifts or broken styling

**Step 5: Commit**

```bash
git add src/components/layout/AppLayout.tsx
git commit -m "feat: integrate resizable help panel and disclaimer into AppLayout"
```

---

## Task 7: Add help panel toggle button

**Files:**
- Modify: `frontend/src/components/layout/Sidebar.tsx` — add a `?` toggle button

We need to find the right place in the sidebar to add the toggle. Check the sidebar for where settings/controls live (likely near the bottom).

**Step 1: Read Sidebar.tsx to find the insertion point**

Read `frontend/src/components/layout/Sidebar.tsx` and identify where to place the help toggle. It should go in the bottom area of the sidebar, near any existing settings controls.

**Step 2: Add the help toggle button**

Add import:
```typescript
import { HelpCircle } from 'lucide-react'
```

Add to the bottom section of the sidebar (near ThemeToggle or other utility controls):
```tsx
<Button
  variant={helpPanelOpen ? 'secondary' : 'ghost'}
  size="sm"
  className="w-full justify-start gap-2"
  onClick={toggleHelpPanel}
>
  <HelpCircle className="h-4 w-4" />
  Help
</Button>
```

Read `helpPanelOpen` and `toggleHelpPanel` from `useUIStore`:
```typescript
const helpPanelOpen = useUIStore((s) => s.helpPanelOpen)
const toggleHelpPanel = useUIStore((s) => s.toggleHelpPanel)
```

**Step 3: Add keyboard shortcut**

In `AppLayout.tsx`, extend the existing `useEffect` keyboard handler (lines 20-33) to also handle `Shift+?`:

Add inside the handler function, before the closing `}`:
```typescript
if (e.key === '?' && e.shiftKey) {
  e.preventDefault()
  useUIStore.getState().toggleHelpPanel()
}
```

**Step 4: Verify type-check and test in browser**

```bash
cd frontend && npm run type-check
```

Test in browser:
- Click the `?` / Help button in sidebar → panel opens
- Click again → panel closes
- Press `Shift+?` → panel toggles
- Drag the handle → panel resizes
- Refresh → panel size remembered

**Step 5: Commit**

```bash
git add src/components/layout/Sidebar.tsx src/components/layout/AppLayout.tsx
git commit -m "feat: add help panel toggle in sidebar and Shift+? shortcut"
```

---

## Task 8: Add simulation disclaimer alerts

**Files:**
- Modify: `frontend/src/pages/StressTestPage.tsx` — add Alert component above simulation results

**Step 1: Read StressTestPage.tsx to find the results sections**

Identify where Monte Carlo results, Backtest results, and Sequence Risk results are rendered. The Alert should appear directly above results, only after the user has run a simulation.

**Step 2: Add the simulation disclaimer**

Add import:
```typescript
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'
```

Note: `Info` may already be imported (check existing imports at line 7). Only add if not present.

Add a reusable alert block. Place it above each simulation's results section (after the controls, before the results):

```tsx
<Alert variant="default" className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
  <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
  <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
    Simulations use historical data and statistical models. Past performance does not guarantee
    future results. All projections assume the inputs and assumptions you've provided.
  </AlertDescription>
</Alert>
```

This should only render when results exist (i.e., after the user clicks "Run"). Check what conditional already gates the results display (likely `data` or `results` being non-null) and place the Alert inside that same conditional, at the top.

**Step 3: Verify type-check**

```bash
cd frontend && npm run type-check
```

Expected: PASS.

**Step 4: Test in browser**

- Go to Stress Test page
- Before running: no amber alert visible
- After running Monte Carlo: amber alert appears above results
- Same for Backtest and Sequence Risk tabs

**Step 5: Commit**

```bash
git add src/pages/StressTestPage.tsx src/components/ui/alert.tsx
git commit -m "feat: add simulation disclaimer alerts on stress test page"
```

---

## Task 9: Add Data Sources section to Reference page

**Files:**
- Modify: `frontend/src/pages/ReferencePage.tsx` — add a new accordion section

**Step 1: Read ReferencePage.tsx to find the accordion sections**

Identify the last accordion section. The new "Data Sources & Methodology" section goes after it.

**Step 2: Add the Data Sources section**

Add import:
```typescript
import { DATA_SOURCES } from '@/lib/data/sources'
import { ExternalLink } from 'lucide-react'
```

Note: Check if `ExternalLink` is already imported. Only add if not present.

Add a new `AccordionItem` at the end of the accordion (but before the glossary if it's separate):

```tsx
<AccordionItem value="data-sources">
  <AccordionTrigger>Data Sources & Methodology</AccordionTrigger>
  <AccordionContent>
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        All data used in this tool comes from publicly available sources.
        Data is refreshed annually in January.
      </p>
      {Object.entries(DATA_SOURCES).map(([category, sources]) => (
        <div key={category}>
          <h4 className="text-sm font-medium capitalize mb-1">{category.replace(/([A-Z])/g, ' $1').trim()}</h4>
          <ul className="space-y-1">
            {sources.map((src, i) => (
              <li key={i} className="text-sm text-muted-foreground">
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  {src.name}
                  <ExternalLink className="h-3 w-3" />
                </a>
                <span className="ml-1">— {src.period}</span>
                <span className="ml-1 text-muted-foreground/60">({src.license})</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </AccordionContent>
</AccordionItem>
```

**Step 3: Verify type-check**

```bash
cd frontend && npm run type-check
```

**Step 4: Test in browser**

- Go to Reference page
- Scroll to the bottom — "Data Sources & Methodology" accordion section should be visible
- Expand it — all sources with clickable links
- Links open in new tab

**Step 5: Commit**

```bash
git add src/pages/ReferencePage.tsx
git commit -m "feat: add data sources section to reference guide"
```

---

## Task 10: Mobile support — help as bottom sheet

**Files:**
- Modify: `frontend/src/components/layout/AppLayout.tsx` — add mobile sheet
- Sheet component already exists at `frontend/src/components/ui/sheet.tsx`

**Step 1: Add mobile-only help trigger and sheet**

Add import:
```typescript
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { HelpCircle } from 'lucide-react'
```

On mobile, the resizable panel should not render. Instead, add a floating `?` button that opens a Sheet (bottom drawer):

```tsx
{/* Mobile help button — visible only on small screens */}
<div className="fixed bottom-16 right-4 z-40 md:hidden">
  <Sheet>
    <SheetTrigger asChild>
      <Button size="icon" className="rounded-full shadow-lg h-10 w-10">
        <HelpCircle className="h-5 w-5" />
      </Button>
    </SheetTrigger>
    <SheetContent side="bottom" className="h-[70vh] overflow-y-auto">
      <SheetHeader>
        <SheetTitle>Help</SheetTitle>
      </SheetHeader>
      <HelpPanel />
    </SheetContent>
  </Sheet>
</div>
```

Make sure the `ResizablePanelGroup` for the help panel only renders on `md:` and above. The conditional `{helpPanelOpen && (...)}` around the right panel should also check for non-mobile. The simplest approach: hide the resize handle + right panel with `hidden md:flex` classes, or use a media query hook.

**Step 2: Verify on mobile viewport**

In browser dev tools, toggle to mobile viewport:
- Sidebar should become hamburger/bottom nav (existing behavior)
- Floating `?` button visible bottom-right
- Tap it → bottom sheet slides up with FAQ content
- Desktop → resizable panel, no floating button

**Step 3: Commit**

```bash
git add src/components/layout/AppLayout.tsx
git commit -m "feat: add mobile bottom sheet for help panel"
```

---

## Task 11: Final verification

**Step 1: Run all checks**

```bash
cd frontend && npm run type-check && npm run lint && npm run test
```

Expected: All pass.

**Step 2: Visual verification checklist**

- [ ] Desktop: Help panel toggle in sidebar works
- [ ] Desktop: `Shift+?` keyboard shortcut works
- [ ] Desktop: Panel drag-to-resize works
- [ ] Desktop: Panel size persists across page reloads
- [ ] Desktop: FAQ content changes when navigating between pages
- [ ] Desktop: Data sources section shows at bottom of help panel
- [ ] Desktop: Disclaimer footer visible at bottom of every page
- [ ] Desktop: Simulation disclaimer alert shows after running MC/backtest/sequence risk
- [ ] Desktop: Reference page has Data Sources accordion section
- [ ] Mobile: Floating `?` button visible
- [ ] Mobile: Bottom sheet opens with FAQ content
- [ ] Mobile: No resizable panel on mobile

**Step 3: Final commit if any fixes needed**

```bash
git add -A && git commit -m "fix: address help panel review issues"
```
