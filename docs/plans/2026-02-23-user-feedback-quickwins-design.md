# User Feedback Quick Wins — Design

**Date:** 2026-02-23
**Status:** Approved
**Scope:** 4 quick-win features from user feedback

---

## Context

User feedback identified bugs, UX gaps, and feature requests. After analysis, 4 items were selected as quick wins that touch independent areas of the codebase and can be parallelized.

## F1: CPF OA Depletion Warning

**Problem:** When a user sets an early retirement age (e.g. 40) with a mortgage paid via CPF OA, the OA balance drops to 0 mid-mortgage with no explanation. Users think it's a bug. The calculation is correct — OA keeps being debited for mortgage even after retirement with no salary contributions refilling it — but there's no visual feedback.

**Design:**
- In `income.ts`, during the year loop, detect when `cpfOA` is insufficient to cover the annual mortgage deduction (`cpfHousingMonthly * 12`). Track the first age this occurs and the annual shortfall amount.
- Add `cpfOaShortfall` field to `IncomeProjectionRow` (0 when OA covers mortgage, positive when it can't).
- **Banner:** In the CPF projection section, show an amber warning when OA depletion is detected: *"Your CPF OA is projected to be depleted at age {X}. From age {X} to {Y}, the remaining mortgage payments of ${Z}/yr must come from your liquid portfolio."*
- **Inline:** In the projection table, highlight rows where `cpfOaShortfall > 0` with an amber background and tooltip showing the shortfall amount.

**Files:** `income.ts`, `types.ts`, `CpfProjectionTable.tsx` or `ProjectionTable.tsx`, parent section component (banner).

## F2: "Total Withdrawn" Column in Comparison Table

**Problem:** The withdrawal strategy comparison table shows Avg/Min/Max/StdDev/Terminal Portfolio but no lifetime total. Users want to compare total withdrawals across strategies.

**Design:**
- Add `totalWithdrawn: number` to the `WithdrawalSummary` interface.
- Compute in `runDeterministicComparison`: sum of all `withdrawal` values across all years.
- Add column to `ComparisonTable.tsx` between "Std Dev" and "Terminal Portfolio".

**Files:** `withdrawal.ts`, `ComparisonTable.tsx`.

## F3: Property Ownership Percentage

**Problem:** Co-owned property values need to be scaled to the user's share. Currently, all property calculations assume 100% ownership.

**Design:**
- Add `ownershipPercent: number` to `PropertyState` (default `1.0`, range 0.01–1.0).
- Add a slider in the property section UI labeled "Your ownership share" (shown when `ownsProperty` is true).
- Apply the percentage in **consumer hooks**, not in the store — stored values remain the full property values, the percentage is a scaling factor:
  - `useFireCalculations.ts`: property equity = `(value - mortgage) * ownershipPercent`
  - `useProjection.ts`: mortgage payment, rental income, property equity all scaled by `ownershipPercent`
- Store migration: bump version, default `ownershipPercent` to `1.0`.

**Files:** `types.ts`, `usePropertyStore.ts`, `useFireCalculations.ts`, `useProjection.ts`, property UI component.

## F4: Expense Inflation Tooltip

**Problem:** Users report "expenses are a straight line" — but the projection table already shows inflation-adjusted expenses with a real/nominal toggle. In real-dollar mode (default), expenses intentionally appear flat. Users don't understand why.

**Design:**
- Add an `(i)` tooltip on the "Expenses" column header in `ProjectionPage.tsx`.
- Tooltip text: *"In today's dollars, expenses appear flat because inflation is factored out. Switch to Nominal to see future values growing at your inflation rate."*

**Files:** `ProjectionPage.tsx`.

## Out of Scope

These items from the feedback are deferred:
- **Couples mode / combined finances** — major architectural change (v2)
- **Tiered expense phases** — medium complexity, separate design needed
- **Math documentation (LaTeX)** — content task, not code
- **Starter videos / guided onboarding** — content/UX task
- **B2: CPF table not updating on mortgage change** — code appears correct; needs reproduction steps from user
