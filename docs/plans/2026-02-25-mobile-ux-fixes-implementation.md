# Mobile UX Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 4 mobile UX issues (broken tooltips, invisible delete button, inaccessible chart data, wrong keyboards) while preserving all desktop behavior.

**Architecture:** A shared `useIsMobile()` hook detects touch devices via `(pointer: coarse)` media query. InfoTooltip renders Popover on mobile, Tooltip on desktop. Chart tooltips use `trigger="click"` on mobile. CSS-only fix for scenario delete button visibility. Mechanical `inputMode` additions for number inputs.

**Tech Stack:** React 18, Radix UI (Tooltip + Popover), Recharts 2.15, Tailwind CSS

---

### Task 1: Create branch and install dependency

**Files:**
- Modify: `frontend/package.json`

**Step 1: Create feature branch**

```bash
cd /Users/tj/TJDevelopment/fireplanner
git checkout -b fix/mobile-ux
```

**Step 2: Install @radix-ui/react-popover**

```bash
cd frontend && npm install @radix-ui/react-popover
```

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @radix-ui/react-popover for mobile tooltips"
```

---

### Task 2: Add useIsMobile hook

**Files:**
- Create: `frontend/src/hooks/useIsMobile.ts`

**Step 1: Create the hook**

```typescript
import { useState, useEffect } from 'react'

const MOBILE_QUERY = '(pointer: coarse)'

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(MOBILE_QUERY).matches
  })

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return isMobile
}
```

**Step 2: Verify it compiles**

```bash
cd /Users/tj/TJDevelopment/fireplanner/frontend && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/hooks/useIsMobile.ts
git commit -m "feat: add useIsMobile hook using pointer:coarse media query"
```

---

### Task 3: Add shadcn/ui Popover component

**Files:**
- Create: `frontend/src/components/ui/popover.tsx`

**Step 1: Create the Popover component**

Standard shadcn/ui popover wrapper around Radix:

```tsx
import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
```

**Step 2: Verify it compiles**

```bash
cd /Users/tj/TJDevelopment/fireplanner/frontend && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/components/ui/popover.tsx
git commit -m "feat: add shadcn/ui Popover component"
```

---

### Task 4: Rewrite InfoTooltip with hybrid Tooltip/Popover

**Files:**
- Modify: `frontend/src/components/shared/InfoTooltip.tsx`

**Step 1: Rewrite InfoTooltip**

Replace entire file with:

```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useIsMobile } from '@/hooks/useIsMobile'

interface InfoTooltipProps {
  text: string
  formula?: string
  source?: string
  sourceUrl?: string
}

function InfoContent({ text, formula, source, sourceUrl }: InfoTooltipProps) {
  return (
    <>
      <p className="text-sm">{text}</p>
      {formula && (
        <p className="text-xs text-muted-foreground mt-1 font-mono">{formula}</p>
      )}
      {source && (
        <p className="text-xs text-muted-foreground mt-1">
          Source:{' '}
          {sourceUrl ? (
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              {source}
            </a>
          ) : (
            source
          )}
        </p>
      )}
    </>
  )
}

const triggerClassName = "inline-flex items-center justify-center w-5 h-5 min-w-[28px] min-h-[28px] rounded-full bg-muted text-muted-foreground text-xs cursor-help ml-1"

export function InfoTooltip(props: InfoTooltipProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className={triggerClassName}>
            i
          </button>
        </PopoverTrigger>
        <PopoverContent className="max-w-xs p-3">
          <InfoContent {...props} />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" onClick={(e) => e.preventDefault()} className={triggerClassName}>
            i
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <InfoContent {...props} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
```

**Step 2: Verify it compiles**

```bash
cd /Users/tj/TJDevelopment/fireplanner/frontend && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/components/shared/InfoTooltip.tsx
git commit -m "fix: InfoTooltip uses Popover on mobile, Tooltip on desktop"
```

---

### Task 5: Fix scenario delete button visibility on mobile

**Files:**
- Modify: `frontend/src/components/layout/ScenarioManager.tsx:134`

**Step 1: Change opacity classes**

At line 134, change:
```
opacity-0 group-hover:opacity-100
```
to:
```
md:opacity-0 md:group-hover:opacity-100
```

The full line becomes:
```tsx
className="p-1 rounded md:opacity-0 md:group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-opacity"
```

**Step 2: Verify it compiles**

```bash
cd /Users/tj/TJDevelopment/fireplanner/frontend && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/components/layout/ScenarioManager.tsx
git commit -m "fix: scenario delete button always visible on mobile"
```

---

### Task 6: Add trigger="click" to Recharts chart tooltips on mobile

**Files (14 chart components):**
- Modify: `frontend/src/components/dashboard/AccumulationChart.tsx` (line 40)
- Modify: `frontend/src/components/withdrawal/WithdrawalChart.tsx` (line 54)
- Modify: `frontend/src/components/withdrawal/PortfolioComparisonChart.tsx` (line 53)
- Modify: `frontend/src/components/dashboard/CashFlowPanel.tsx` (line 203)
- Modify: `frontend/src/components/dashboard/PassiveIncomePanel.tsx` (line 100)
- Modify: `frontend/src/components/dashboard/NWChartView.tsx` (line 49)
- Modify: `frontend/src/components/dashboard/GoalTimelineChart.tsx` (line 76, custom content)
- Modify: `frontend/src/components/healthcare/HealthcareCostChart.tsx` (line 59)
- Modify: `frontend/src/components/shared/QuickProjectionChart.tsx` (line 59)
- Modify: `frontend/src/components/sequenceRisk/CrisisComparisonChart.tsx` (line 34)
- Modify: `frontend/src/components/simulation/FanChart.tsx` (line 51, custom content)
- Modify: `frontend/src/components/simulation/FailureDistributionChart.tsx` (line 33)
- Modify: `frontend/src/components/simulation/PortfolioHistogram.tsx` (line 74, aliased RechartsTooltip)
- Modify: `frontend/src/components/backtest/BacktestDrillDown.tsx` (line 234, aliased RechartsTooltip)

**Step 1: For each file, add `useIsMobile` import and `trigger` prop**

Pattern for each file:

1. Add import: `import { useIsMobile } from '@/hooks/useIsMobile'`
2. Add hook call inside the component: `const isMobile = useIsMobile()`
3. Add `trigger` prop to the Recharts `<Tooltip>` (or `<RechartsTooltip>`):

For simple Tooltip usage (most files):
```tsx
// Before:
<Tooltip formatter={(value: number) => formatCurrency(value)} />
// After:
<Tooltip trigger={isMobile ? 'click' : undefined} formatter={(value: number) => formatCurrency(value)} />
```

For custom content Tooltip (FanChart, GoalTimelineChart):
```tsx
// Before:
<Tooltip
  content={({ active, payload, label }) => {
// After:
<Tooltip
  trigger={isMobile ? 'click' : undefined}
  content={({ active, payload, label }) => {
```

For aliased RechartsTooltip (BacktestDrillDown, PortfolioHistogram):
```tsx
// Before:
<RechartsTooltip
  formatter={...}
// After:
<RechartsTooltip
  trigger={isMobile ? 'click' : undefined}
  formatter={...}
```

For CashFlowPanel custom content:
```tsx
// Before:
<Tooltip content={<CashFlowTooltip />} />
// After:
<Tooltip trigger={isMobile ? 'click' : undefined} content={<CashFlowTooltip />} />
```

**Step 2: Verify it compiles**

```bash
cd /Users/tj/TJDevelopment/fireplanner/frontend && npx tsc --noEmit
```

If TypeScript complains about `trigger` not being a valid prop, check Recharts types. If the types don't include `trigger`, add a comment `// @ts-expect-error recharts supports trigger prop but types may lag` above the prop, OR cast: `trigger={isMobile ? ('click' as any) : undefined}`. The runtime behavior works regardless.

**Step 3: Commit**

```bash
git add src/components/dashboard/ src/components/withdrawal/ src/components/shared/QuickProjectionChart.tsx src/components/sequenceRisk/ src/components/simulation/ src/components/backtest/ src/components/healthcare/ src/components/goals/
git commit -m "fix: Recharts chart tooltips use tap-to-show on mobile"
```

---

### Task 7: Add inputMode to all number inputs

**Files (11 files, 22 instances):**

**Rule:** Use `inputMode="numeric"` for integer fields (ages, counts, year, simulations). Use `inputMode="decimal"` for decimal fields (rates, percentages, weights, ratios).

| File | Line(s) | inputMode |
|------|---------|-----------|
| `GlidePathSection.tsx` | 110, 136 | `numeric` (ages) |
| `AdvancedOverrides.tsx` | 98 | `decimal` (overrides) |
| `AllocationBuilder.tsx` | 122, 136 | `decimal` (weight %) |
| `HealthcareSection.tsx` | 203 | `numeric` (age) |
| `SimulationControls.tsx` | 99 | `numeric` (sim count) |
| `SimulationControls.tsx` | 231 | `decimal` (inline param) |
| `BacktestControls.tsx` | 107 | `decimal` (blend ratio) |
| `BacktestControls.tsx` | 124 | `decimal` (SWR) |
| `BacktestControls.tsx` | 140 | `numeric` (duration) |
| `BacktestControls.tsx` | 307 | `decimal` (strategy field) |
| `BacktestControls.tsx` | 331 | `decimal` (heatmap field) |
| `SalaryModelSection.tsx` | 212 | `numeric` (age) |
| `LifeEventsSection.tsx` | 236, 249 | `numeric` (ages) |
| `IncomeStreamsSection.tsx` | 170, 183 | `numeric` (ages) |
| `PropertyInputForm.tsx` | 54 | `numeric` (lease years) |
| `PropertyInputForm.tsx` | 66, 80, 94, 120 | `decimal` (rates) |
| `PropertyInputForm.tsx` | 108 | `numeric` (mortgage term) |
| `PropertyInputForm.tsx` | 152 | `numeric` (property count) |
| `StrategyParamsSection.tsx` | 253 | `decimal` (param) |

**Step 1: Add inputMode to each Input**

For each file, add `inputMode="numeric"` or `inputMode="decimal"` as a prop on the `<Input>` element, right after `type="number"`. Example:

```tsx
// Before:
<Input
  type="number"
  value={...}

// After (integer field):
<Input
  type="number"
  inputMode="numeric"
  value={...}

// After (decimal field):
<Input
  type="number"
  inputMode="decimal"
  value={...}
```

**Step 2: Verify it compiles**

```bash
cd /Users/tj/TJDevelopment/fireplanner/frontend && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/components/allocation/ src/components/healthcare/ src/components/simulation/ src/components/backtest/ src/components/income/ src/components/property/ src/components/withdrawal/
git commit -m "fix: add inputMode to number inputs for mobile numeric keyboard"
```

---

### Task 8: Final verification

**Step 1: Run type-check**

```bash
cd /Users/tj/TJDevelopment/fireplanner/frontend && npm run type-check
```
Expected: 0 errors

**Step 2: Run lint**

```bash
cd /Users/tj/TJDevelopment/fireplanner/frontend && npm run lint
```
Expected: 0 errors

**Step 3: Run tests**

```bash
cd /Users/tj/TJDevelopment/fireplanner/frontend && npm run test
```
Expected: All pass

**Step 4: Start dev server and test manually**

```bash
lsof -ti:5173 | xargs kill -9 2>/dev/null; cd /Users/tj/TJDevelopment/fireplanner/frontend && npm run dev -- --port 5173
```

Open Chrome DevTools, toggle device toolbar (Ctrl+Shift+M), test:
- Tap `(i)` icons: popover should appear, tap outside to dismiss
- Charts: tap on data points, tooltip should appear
- Scenario manager: delete button should be visible without hovering
- Number inputs: should show numeric keyboard in device emulation

---

## Parallelism Analysis

**Tasks 2+3** can run in parallel (no shared files).
**Task 4** depends on Tasks 2+3 (imports from both).
**Task 5** is independent of all others.
**Task 6** depends on Task 2 (imports useIsMobile).
**Task 7** is independent of all others.
**Task 8** depends on all prior tasks.

```
Task 1 (branch + install)
    ├── Task 2 (useIsMobile hook) ──┐
    ├── Task 3 (Popover component) ─┤
    ├── Task 5 (scenario delete)    │ ── Task 8 (verify)
    └── Task 7 (inputMode)          │
                                    ├── Task 4 (InfoTooltip rewrite)
                                    └── Task 6 (chart tooltips)
```

**Optimal: 3 parallel agents after Task 1:**
- Agent A: Tasks 2, 3, 4 (hook + popover + InfoTooltip)
- Agent B: Tasks 5, 7 (CSS fix + inputMode, fully independent)
- Agent C: Task 6 (chart tooltips, depends on Task 2 from Agent A)

Agent C should wait for Agent A to finish Task 2 before starting.
