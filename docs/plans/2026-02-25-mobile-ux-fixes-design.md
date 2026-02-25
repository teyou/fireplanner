# Mobile UX Fixes Design

**Date:** 2026-02-25
**Branch:** `fix/mobile-ux`
**Scope:** 4 fixes that improve mobile usability while keeping desktop behavior unchanged.

## Problem

Several UI patterns rely on hover, which doesn't exist on touch devices:
1. InfoTooltip `(i)` icons use Radix Tooltip (hover-only) — content never appears on mobile
2. Scenario delete button uses `group-hover:opacity-100` — permanently invisible on mobile
3. Recharts chart tooltips require hover to inspect data points — inaccessible on mobile
4. 11 files use `<Input type="number">` without `inputMode` — shows QWERTY keyboard instead of numeric keypad on mobile

## Fix 1: InfoTooltip — Hybrid Tooltip/Popover

**Approach:** Render `<Tooltip>` on desktop (hover), `<Popover>` on mobile (tap-to-open, tap-outside-to-dismiss).

### New files
- `hooks/useIsMobile.ts` — ~10 line hook, uses `window.matchMedia('(pointer: coarse)')` with SSR-safe fallback. Returns `boolean`. Reactive (listens for media query changes, e.g. desktop browser toggling device emulation).
- `components/ui/popover.tsx` — standard shadcn/ui Popover wrapping `@radix-ui/react-popover`.

### Modified files
- `components/shared/InfoTooltip.tsx` — calls `useIsMobile()`. Desktop: existing Tooltip behavior. Mobile: Popover with same content styling. Tap target bumped from `w-5 h-5` (20px) to `min-w-[28px] min-h-[28px]` on mobile for easier tapping, visual circle stays the same size via inner element.

### Dependency
- Install `@radix-ui/react-popover`

## Fix 2: Scenario Delete Button Visibility

**Approach:** CSS-only fix. Change opacity classes so button is always visible on mobile, hover-revealed on desktop.

### Modified files
- `components/layout/ScenarioManager.tsx` line 134:
  - Before: `opacity-0 group-hover:opacity-100`
  - After: `md:opacity-0 md:group-hover:opacity-100`

One line change. No JS.

## Fix 3: Recharts Chart Tooltips on Mobile

**Approach:** Pass `trigger="click"` to Recharts `<Tooltip>` on mobile so users can tap a chart to see data. Desktop keeps default hover behavior.

### Implementation
- Use the same `useIsMobile()` hook from Fix 1
- In each chart component, change `<Tooltip ... />` to `<Tooltip trigger={isMobile ? 'click' : undefined} ... />`
- Recharts 2.15.x supports `trigger="click"` natively

### Modified files (all chart components with Recharts Tooltip)
- `components/dashboard/AccumulationChart.tsx`
- `components/dashboard/WithdrawalChart.tsx`
- `components/dashboard/CashFlowPanel.tsx`
- `components/dashboard/PassiveIncomePanel.tsx`
- `components/dashboard/NWChartView.tsx`
- `components/dashboard/GoalTimelineChart.tsx`
- `components/dashboard/HealthcareCostChart.tsx`
- `components/dashboard/PortfolioComparisonChart.tsx`
- `components/simulation/FanChart.tsx`
- `components/simulation/FailureDistributionChart.tsx`
- `components/backtest/CrisisComparisonChart.tsx`
- `components/shared/QuickProjectionChart.tsx`

### Pattern
Each chart adds:
```tsx
const isMobile = useIsMobile()
// ...
<Tooltip trigger={isMobile ? 'click' : undefined} formatter={...} />
```

## Fix 4: Missing `inputMode` on Number Inputs

**Approach:** Add `inputMode="numeric"` (integer fields) or `inputMode="decimal"` (decimal fields) to every `<Input type="number">` that doesn't already have it.

### Modified files
| File | Fields | inputMode |
|------|--------|-----------|
| `PropertyInputForm.tsx` | lease years, property count | `numeric` |
| `PropertyInputForm.tsx` | appreciation, rental yield, mortgage rate, LTV | `decimal` |
| `HealthcareSection.tsx` | healthcare cost | `decimal` |
| `StrategyParamsSection.tsx` | strategy params | `decimal` |
| `IncomeStreamsSection.tsx` | start age, end age | `numeric` |
| `LifeEventsSection.tsx` | start age, end age | `numeric` |
| `SalaryModelSection.tsx` | salary input | `decimal` |
| `SimulationControls.tsx` | num simulations | `numeric` |
| `SimulationControls.tsx` | inline params | `decimal` |
| `BacktestControls.tsx` | duration, start year | `numeric` |
| `BacktestControls.tsx` | SWR, params | `decimal` |
| `AllocationBuilder.tsx` | weight inputs | `decimal` |
| `AdvancedOverrides.tsx` | override values | `decimal` |
| `GlidePathSection.tsx` | start/end age | `numeric` |

## What Does NOT Change

- Desktop hover behavior on all tooltips (Radix and Recharts)
- Desktop hover-reveal on scenario delete button
- Keyboard input on desktop (inputMode only affects mobile keyboards)
- No layout/styling changes beyond the delete button opacity fix
- No new pages, routes, or stores

## Risk Assessment

- **Low risk:** All fixes are additive CSS/prop changes or conditional rendering. Desktop paths are completely unchanged.
- **Testing:** Manual testing on mobile Safari/Chrome DevTools device emulator to verify all 4 fixes. Existing Vitest unit tests unaffected (they don't test hover behavior).
