# Help Panel, Disclaimer & Source Attribution — Design

**Date:** 2026-02-21
**Status:** Approved
**Inspired by:** SG Healthcare Subsidy Check app UX patterns

## Problem

Fireplanner has excellent data source documentation in code comments (`lib/data/` files) and a comprehensive Reference Guide, but:
1. No global disclaimer — simulation pages have zero "not financial advice" notice
2. No contextual education — users must navigate to a separate Reference page to learn about concepts
3. No source attribution in UI — users can't verify where CPF rates, tax brackets, or historical data come from

## Design

### 1. Resizable Help Panel (Right Side)

**Layout change to `AppLayout.tsx`:**

```
[Sidebar 240px] [ResizablePanelGroup (horizontal)       ]
                 [Page Content  ‖  Help Panel (collapsed)]
```

- Install shadcn `Resizable` component (built on `react-resizable-panels`)
- Remove `max-w-6xl container` wrapper from main content — content fills panel width
- Left panel: `<Outlet />`, `defaultSize={100}`, `minSize={50}`
- Right panel: `<HelpPanel />`, `defaultSize={0}` (collapsed), `minSize={20}` when open, `maxSize={50}`
- `autoSaveId="help-panel"` for localStorage size persistence
- `FireStatsStrip` stays outside the resizable group (spans full width)

**Toggle:**
- `?` icon button in page header (top-right)
- Keyboard shortcut: `Shift+?`
- Panel state (open/closed) in React context or simple Zustand atom

**Mobile:** Help panel hidden. `?` button opens a bottom Sheet (existing shadcn component) with same content.

**Component: `components/layout/HelpPanel.tsx`**
- Reads current route via `useLocation()`
- Maps route to page-specific FAQ items (3-5 per page)
- Renders using existing `Accordion` component (Radix UI, already in project)
- Content extracted/refactored from existing ReferencePage sections (not duplicated)

**FAQ content per page:**

| Page | Route | FAQ Items |
|------|-------|-----------|
| Profile | `/profile` | What is FIRE?, How is FIRE number calculated?, Lean/Regular/Fat FIRE differences |
| Income | `/income` | How does CPF contribution work?, What are the 3 salary models?, How is SG tax calculated? |
| Allocation | `/allocation` | What is asset allocation?, How does rebalancing work?, What does correlation matrix show? |
| Monte Carlo | `/monte-carlo` | What is Monte Carlo simulation?, Parametric vs Bootstrap vs Fat-tail?, What does success rate mean? |
| Withdrawal | `/withdrawal` | What are the 6 withdrawal strategies?, What is the 4% rule?, What are Guardrails? |
| Backtest | `/backtest` | What is historical backtesting?, How to read the heatmap?, SG vs US data differences? |
| Sequence Risk | `/sequence-risk` | What is sequence of returns risk?, What mitigations are available?, How are crisis scenarios defined? |
| Dashboard | `/dashboard` | How are metrics calculated?, What does risk score mean? |
| Property | `/property` | What is Bala's Table?, How is BSD/ABSD calculated?, What are the 5 property scenarios? |

### 2. Disclaimer

**Two layers:**

**Layer 1 — Persistent footer (all pages):**
Single-line text at bottom of scrollable `<main>` content, below `<Outlet />`:
```
This tool is for educational and planning purposes only. It does not constitute financial
advice. Results are estimates based on historical data and assumptions that may not reflect
future outcomes.
```
Styled as `text-xs text-muted-foreground`. Scrolls with content (not sticky).

**Layer 2 — Simulation-specific alert (Monte Carlo, Backtest, Sequence Risk pages):**
shadcn `Alert` component with `variant="warning"` (amber), shown above simulation results after running:
```
Simulations use historical data and statistical models. Past performance does not guarantee
future results. All projections assume the inputs and assumptions you've provided.
```

### 3. Source Attribution

**New file: `lib/data/sources.ts`**
Structured export: `Record<string, Source[]>` extracted from existing code comments in `lib/data/` files.

```typescript
interface Source {
  name: string;
  url: string;
  period: string;
  license: string;
}
```

**In Help Panel:** "Data Sources" accordion item at bottom of each page's FAQ, showing sources relevant to that page with clickable external links.

Example rendering:
```
▸ Data Sources
  • CPF Rates — CPF Board (cpf.gov.sg) — 2024
  • Tax Brackets — IRAS (iras.gov.sg) — YA 2024+
  • Historical Returns — Damodaran/NYU Stern — 1928-2024
```

**In Reference page:** New "Data Sources & Methodology" accordion section with the full source list.

## Files to Create/Modify

| Action | File |
|--------|------|
| Install | `react-resizable-panels` via shadcn CLI |
| Create | `components/ui/resizable.tsx` |
| Create | `components/layout/HelpPanel.tsx` |
| Create | `lib/data/sources.ts` |
| Modify | `components/layout/AppLayout.tsx` |
| Modify | Header component (add `?` toggle button) |
| Modify | `MonteCarloPage.tsx` (add simulation disclaimer) |
| Modify | `BacktestPage.tsx` (add simulation disclaimer) |
| Modify | `SequenceRiskPage.tsx` (add simulation disclaimer) |
| Modify | `ReferencePage.tsx` (add Data Sources section) |

## Non-Goals

- Not relocating the full Reference Guide into the panel
- Not adding glossary/ELI5 tooltips to the panel (those stay on Reference page)
- Not changing the left sidebar
- Not adding source links inline on every input/label
