# Withdrawal Basis Toggle Design

**Date:** 2026-02-27
**Status:** Approved
**Bug reports:** SWR changes on Stress Test page have zero effect on results; Projection page Terminal NW/Depleted Age don't respond to withdrawal strategy changes.

## Problem

All simulation engines (Monte Carlo, Backtest, Sequence Risk) and the deterministic Projection have an `annualExpensesAtRetirement` override that bypasses the SWR/strategy rate parameter for the `constant_dollar` strategy. Since every user has non-zero annual expenses, changing SWR from 1% to 5% produces identical results.

**Affected code sites:**

| Engine | File | Lines | Pattern |
|--------|------|-------|---------|
| Monte Carlo | `monteCarlo.ts` | 390-401 | `annualExpensesAtRetirement > 0 ? expenses : portfolio * swr` |
| Backtest (window) | `backtest.ts` | 163-165 | Same |
| Backtest (drill-down) | `backtest.ts` | 309-311 | Same |
| Sequence Risk | `sequenceRisk.ts` | 154-160 | Same |
| Projection | `projection.ts` | 550-551 | `actualDraw = min(expenseGap, portfolio)` ignores strategy |

## Root Cause

The expense-driven override was intentionally added to answer "will my portfolio support my planned spending?" but it makes the SWR input completely non-functional. Users adjusting SWR expect to test different withdrawal rates (the traditional FIRE 4% rule question), but results never change.

## Solution: Withdrawal Basis Toggle

Add a toggle that lets users choose between two withdrawal computation modes:

- **"My Expenses"** (default): Current behavior. Withdrawals match planned annual expenses. Tests portfolio sustainability for actual spending.
- **"Custom Rate"**: Withdrawals based on `portfolio * strategyRate`. Tests whether a specific withdrawal rate is sustainable (the classic 4% rule question).

### State

New field in `useSimulationStore`:

```typescript
withdrawalBasis: 'expenses' | 'rate'  // default: 'expenses'
```

- Persisted in localStorage (store version bump v4 -> v5)
- Migration: existing users default to `'expenses'`
- Read by all 4 hooks, passed as param to all 4 engines

### Engine Logic Change

All 4 simulation engines apply the same pattern:

```typescript
// Before:
const initialWithdrawalAmount = expenses > 0
  ? expenses
  : initialPortfolio * swr

// After:
const initialWithdrawalAmount = withdrawalBasis === 'rate'
  ? initialPortfolio * swr
  : (expenses > 0 ? expenses : initialPortfolio * swr)
```

### Projection Page Special Case

When `withdrawalBasis === 'rate'`:
- `actualDraw = min(strategyWithdrawal, portfolio)` instead of `min(expenseGap, portfolio)`
- Terminal NW and Depleted Age now respond to SWR/strategy changes
- Expense gap is still computed for display (informational)

When `withdrawalBasis === 'expenses'` (default):
- Current behavior preserved exactly

### Toggle UI Component

`WithdrawalBasisToggle`: pill-shaped segmented control (same visual pattern as `AnalysisModeToggle`).

**Labels and tooltips:**
- "My Expenses": "Withdrawals match your planned annual expenses, adjusted for inflation. Tests whether your portfolio can sustain your actual spending."
- "Custom Rate": "Withdrawals based on portfolio x withdrawal rate (e.g. the 4% rule). Tests whether a specific withdrawal rate is sustainable."

**Placement:**

| Page | Location |
|------|----------|
| Projection | Next to withdrawal strategy dropdown |
| Monte Carlo | Inside SimulationControls, below strategy params |
| Backtest | Inside BacktestControls |
| Sequence Risk | Above "Run Stress Test" button |

**Contextual hint:** When in "My Expenses" mode and the user changes SWR, show a dismissible hint: "Switch to Custom Rate to test different withdrawal rates."

## Edge Cases

1. **Dynamic strategies (VPW, guardrails):** These compute withdrawals from portfolio/remaining years, not from initial SWR. The `withdrawalBasis` toggle primarily affects `constant_dollar` and other rate-based strategies. Dynamic strategies are largely unaffected.

2. **Backtest heatmap:** Sweeps multiple SWR values. In expense mode, cells don't meaningfully vary (same bug). In rate mode, each cell correctly tests a different SWR.

3. **Stale detection:** Include `withdrawalBasis` in all hook `currentParamsSig` computations so toggling marks results as stale.

4. **Rate-driven Projection with strategy > expenses:** User withdraws more than needed. Valid test scenario (the question is "what if I withdraw this much?").

## What Could Break

- Existing engine tests assume expense-driven behavior. Add `withdrawalBasis: 'expenses'` to existing test params so they pass unchanged.
- Store migration (v4 -> v5) must default to `'expenses'` for existing users.

## Tests to Add

- Unit test per engine: rate-driven mode uses `portfolio * swr`, expense-driven uses expenses
- Integration: toggling mode changes MC success rate for identical inputs
- Projection: Terminal NW changes when SWR changes in rate-driven mode

## Files to Modify

| File | Change |
|------|--------|
| `stores/useSimulationStore.ts` | Add `withdrawalBasis` field, bump version, migration |
| `lib/types.ts` | Add `WithdrawalBasis` type, add to `SimulationState` |
| `lib/simulation/monteCarlo.ts` | Accept and use `withdrawalBasis` param |
| `lib/simulation/backtest.ts` | Accept and use `withdrawalBasis` param (2 sites) |
| `lib/simulation/sequenceRisk.ts` | Accept and use `withdrawalBasis` param |
| `lib/calculations/projection.ts` | Accept `withdrawalBasis`, conditionally use strategy vs expenses for actualDraw |
| `hooks/useMonteCarloQuery.ts` | Read `withdrawalBasis` from store, pass to worker |
| `hooks/useBacktestQuery.ts` | Read `withdrawalBasis` from store, pass to worker |
| `hooks/useSequenceRiskQuery.ts` | Read `withdrawalBasis` from store, pass to worker |
| `hooks/useProjection.ts` | Read `withdrawalBasis` from store, pass to projection |
| `lib/simulation/workerClient.ts` | Add `withdrawalBasis` to worker message types |
| `components/shared/WithdrawalBasisToggle.tsx` | New toggle component |
| `pages/ProjectionPage.tsx` | Add toggle near strategy dropdown |
| `components/simulation/SimulationControls.tsx` | Add toggle below strategy params |
| `components/backtest/BacktestControls.tsx` | Add toggle |
| `pages/StressTestPage.tsx` | Add toggle to SequenceRiskTab |
| Tests: engine test files | Add rate-driven test cases, update existing with explicit `withdrawalBasis` |
