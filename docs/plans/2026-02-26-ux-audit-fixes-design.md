# UX Audit Fixes Design

**Date:** 2026-02-26
**Status:** Approved
**Scope:** 19 fixes across 4 parallel workstreams, addressing findings from form UX audit + mobile UX audit

## Context

Two independent audits identified UX issues:
- **Form UX audit:** Validation timing, input control consistency, progressive disclosure gaps, accessibility, debouncing
- **Mobile UX audit:** Touch targets below 44px minimum, grid overflow on narrow screens, navigation gaps

The fixes are organized into 4 workstreams by concern (not by file) so each workstream is independently testable. Some files are touched by multiple workstreams (notably InputsPage.tsx) but at different line ranges.

---

## Workstream A: Input Component Polish

**Goal:** Fix validation timing, standardize input controls, add accessibility attributes.

### A1. Blur-only error display

**Files:** `NumberInput.tsx`, `CurrencyInput.tsx`, `PercentInput.tsx`

Add a `touched` boolean state to each input component. Errors from the store are always computed (live store writes on every keystroke preserved), but error messages are only displayed when `touched === true`.

- Set `touched = true` on first blur (`handleBlur`)
- Reset `touched = false` when the field value changes externally (detected via the existing `useEffect` that syncs local value from props when not focused)
- Error rendering: `{touched && error && <p id={errorId}>...</p>}`

This preserves instant chart/calculation feedback while eliminating the "error while typing" annoyance.

### A2. Add `aria-describedby` for error messages

**Files:** `NumberInput.tsx`, `CurrencyInput.tsx`, `PercentInput.tsx`

Add `id={errorId}` to error `<p>` elements and `aria-describedby={touched && error ? errorId : undefined}` to the `<input>` element. Use `useId()` to generate stable IDs (already imported in NumberInput).

### A3. Standardize checkboxes and switches

**Files:** `InputsPage.tsx`, `FinancialSection.tsx`, `IncomeStreamsSection.tsx`, `LifeEventsSection.tsx`

Two categories of raw `<input type="checkbox">`:

**Feature toggles → shadcn `Switch`** (on/off for a behavior):
- `InputsPage.tsx:246-255` — Employer CPF Contributions
- `FinancialSection.tsx:101-113` — Continue SRS during post-FIRE employment

**Row-level toggles → shadcn `Checkbox`** (in list/table contexts):
- `IncomeStreamsSection.tsx:103-106` — Active toggle per stream
- `IncomeStreamsSection.tsx:214-219` — CPF Applicable per stream
- `LifeEventsSection.tsx:137-140` — Enable per event
- `LifeEventsSection.tsx:272-276` — Pause Savings per event
- `LifeEventsSection.tsx:279-285` — Pause CPF per event
- `LifeEventsSection.tsx:297-302` — Affected stream checkboxes

All replacements include proper `id`/`htmlFor` pairing for accessibility.

### A4. Style the range slider

**File:** `InputsPage.tsx:798-806`

Replace bare `<input type="range">` with shadcn `Slider` component (if available) or add Tailwind styling for the track/thumb. Add `id`/`htmlFor` link to its label. Ensure the thumb is at least 44px on mobile.

---

## Workstream B: Touch Target Fixes

**Goal:** Bring all interactive elements to the 44px minimum touch target (Apple HIG / WCAG 2.5.8).

### B1. InfoTooltip sizing + aria

**File:** `InfoTooltip.tsx`

Mobile trigger expansion: Set `min-w-[44px] min-h-[44px]` on the mobile button element with `flex items-center justify-center`. Keep the visual "i" circle at `w-6 h-6` via an inner `<span>`. The button becomes the large tap area; the span provides the small visual indicator.

Add `aria-label="More information"` to both desktop and mobile trigger buttons.

### B2. InfoTooltip delay

**File:** `InfoTooltip.tsx:67`

`delayDuration={0}` → `delayDuration={300}`. Only affects desktop Tooltip, not mobile Popover.

### B3. Dialog close button

**File:** `dialog.tsx:45`

Add `p-2` to `DialogPrimitive.Close` className. Expands tappable area from ~16px to ~32px. Corner positioning provides natural Fitts's Law advantage.

### B4. FireStatsStrip gear button

**File:** `FireStatsStrip.tsx`

- Gear button: `p-1.5` → `p-2.5`, icon `h-3.5 w-3.5` → `h-4 w-4` (26px → ~36px)
- Dropdown option buttons: `py-1.5` → `py-2` for better tap spacing

### B5. Pill toggle button heights

**File:** `InputsPage.tsx`

Property status pills (line 762): Add responsive padding `py-2.5 md:py-1.5` (matching section ordering pills which already have this). Section ordering pills — no change needed.

### B6. Semantic radio roles for pill toggles

**Files:** `InputsPage.tsx`, `FireTargetsSection.tsx`

Add ARIA attributes to 3 separate inline pill toggle implementations (these are NOT a shared component):

1. **Property status pills** (`InputsPage.tsx:757-771`): `role="radiogroup"` on container, `role="radio"` + `aria-checked` on each button
2. **Section ordering pills** (`InputsPage.tsx:1403-1434`): Same pattern
3. **FIRE number basis toggle** (`FireTargetsSection.tsx:189-207`): Same pattern

Future refactor could extract a shared `PillToggle` component, but that is out of scope for this pass.

---

## Workstream C: Mobile Layout Fixes

**Goal:** Fix overflow and cramped layouts on screens <=375px wide.

### C1. Locked Assets / Expense Adjustment grid

**Files:** `FinancialSection.tsx:122`, `InputsPage.tsx:350`

Both use `grid-cols-[1fr_120px_80px_80px_32px]` which overflows on mobile. Dual-render approach:

- Desktop: Keep existing 5-column grid, wrapped in `hidden md:grid`
- Mobile: Stacked card layout per row, wrapped in `md:hidden`

Each card shows: name + delete button on top row, numeric fields in a 2-col grid below. DOM duplication is negligible for the typical count (5-10 rows).

### C2. Fixed-width name inputs

**Files:** `IncomeStreamsSection.tsx:100`, `LifeEventsSection.tsx:227`

`w-48` → `w-full md:w-48`. On mobile, input fills available space; on desktop stays at 192px.

### C3. SWR Heatmap overflow

**File:** `SwrHeatmap.tsx:166`

Add `overflow-x-auto` to the container div:
```tsx
<div ref={containerRef} className="relative overflow-x-auto">
```

### C4. Withdrawal ComparisonTable mobile layout

**File:** `ComparisonTable.tsx`

Hide secondary columns on mobile via `hidden md:table-cell`:
- **Keep visible:** Strategy, Avg Withdrawal, Min, Terminal Portfolio, Survived
- **Hide on mobile:** Max, Std Dev, Total Withdrawn

Matches the projection table's existing column-hiding pattern.

### C5. Bottom nav — replace Guide with Withdrawal

**File:** `Sidebar.tsx:464-486`

Replace "Guide" with "Withdraw" (linking to `/withdrawal`) in the 5-item bottom nav. Move Guide to the top of the mobile drawer menu so it remains prominent and discoverable (just not in the persistent bottom nav).

---

## Workstream D: Missing Features & Misc

**Goal:** Fill functional gaps and minor polish.

### D1. Residency status field in PersonalSection

**File:** `PersonalSection.tsx`

Add a `<Select>` for `residencyStatus` after Marital Status in the 2-column grid. Three options: "Singapore Citizen", "Permanent Resident", "Foreigner".

The store field already exists in `useProfileStore` (`PROFILE_DATA_KEYS` line 37, default: `'citizen'`). This is purely adding the missing UI control.

Add an `InfoTooltip` explaining: "Sets your residency for CPF, SRS, and tax calculations. For ABSD on property purchases, residency is set separately in the Property section." This clarifies the intentional separation from `residencyForAbsd` in the property store.

### D2. Persist `showNewPurchase` in useUIStore

**File:** `InputsPage.tsx:723`, `useUIStore.ts`

Move `showNewPurchase` from `useState(false)` in InputsPage's `PropertyContent` to `useUIStore`:
- Add `showNewPurchase: boolean` to `UIState` interface
- Add `setShowNewPurchase: (v: boolean) => void` action
- Default: `false`
- Requires store version bump + migration (add `showNewPurchase: false` for existing users)

**Note:** Combined with D5 in a single version bump.

### D3. Marital Status tooltip

**File:** `PersonalSection.tsx`

Add `InfoTooltip` to Marital Status label explaining it affects Spouse Relief eligibility and tax calculations. Ensures every field in PersonalSection has a tooltip (currently the only one missing).

### D4. Default sections collapsed on first load

**Files:** `InputsPage.tsx:1236`, `useUIStore.ts`

Currently `collapsedSections` is `useState<Set<SectionId>>` in InputsPage (NOT in useUIStore). To persist collapse state across navigations:

1. Move `collapsedSections` to `useUIStore` with `Set<SectionId>` type
2. Add `toggleSection(id: SectionId)` and `setCollapsedSections(ids: Set<SectionId>)` actions
3. Default for **new users:** All sections collapsed except `section-personal` and `section-fire-settings`
4. Migration for **existing users:** Default to empty set (everything expanded) to preserve their current experience
5. The `already-fire` special case (collapse `section-fire-settings`) moves to a one-time effect in InputsPage that runs when `sectionOrder` changes to `already-fire`

**Store version bump:** Combined with D2 — one version increment, one migration function that adds both `showNewPurchase: false` and `collapsedSections: new Set()`.

---

## Dropped Items

- **D3 (original): Memoize `sections` record** — Dropped. The JSX values and unstable callbacks make this low-value. The sections record recreation is cheap compared to actual component rendering. If performance is a concern, profile first.

---

## Cross-Workstream Coordination

| Risk | Mitigation |
|------|-----------|
| InputsPage touched by A, B, C, D | Changes are at different line ranges. Agents should commit frequently. |
| FinancialSection touched by A (Switch) and C (grid) | Different line ranges (101-113 vs 122+). Low conflict risk. |
| D2 + D4 both modify useUIStore | Same workstream (D), single version bump and migration. |
| B5 + B6 modify same pill buttons | Same workstream (B), done together. |

## File Impact Matrix

| File | A | B | C | D |
|------|---|---|---|---|
| NumberInput.tsx | A1, A2 | | | |
| CurrencyInput.tsx | A1, A2 | | | |
| PercentInput.tsx | A1, A2 | | | |
| InputsPage.tsx | A3, A4 | B5, B6 | C1 | D2, D4 |
| FinancialSection.tsx | A3 | | C1 | |
| IncomeStreamsSection.tsx | A3 | | C2 | |
| LifeEventsSection.tsx | A3 | | C2 | |
| InfoTooltip.tsx | | B1, B2 | | |
| dialog.tsx | | B3 | | |
| FireStatsStrip.tsx | | B4 | | |
| FireTargetsSection.tsx | | B6 | | |
| SwrHeatmap.tsx | | | C3 | |
| ComparisonTable.tsx | | | C4 | |
| Sidebar.tsx | | | C5 | |
| PersonalSection.tsx | | | | D1, D3 |
| useUIStore.ts | | | | D2, D4 |
