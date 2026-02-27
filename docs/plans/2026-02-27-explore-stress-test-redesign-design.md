# Explore + Stress Test Redesign

**Goal:** Separate withdrawal strategy exploration (decumulation-only learning tool) from full-plan stress testing (lifecycle Monte Carlo), and add a deterministic/stochastic pre-retirement toggle to the Stress Test page.

**Motivation:** The current My Plan / FIRE Target toggle on the Stress Test page couples two independent concerns: (1) what starting balance to use, and (2) whether pre-retirement returns are stochastic or deterministic. FIRE Target mode skips accumulation entirely and tests the FIRE number in isolation, which is really a withdrawal strategy question, not a plan stress test. Separating these into two pages with distinct purposes makes the tool more useful and less confusing.

---

## 1. Navigation Restructure

**Current:**
```
ANALYSIS   -> Withdrawal, Stress Test
```

**New:**
```
EXPLORE    -> Withdrawal Strategies
ANALYSIS   -> Stress Test
```

- Rename the nav group containing Withdrawal from "ANALYSIS" to "EXPLORE"
- Rename "Withdrawal" link to "Withdrawal Strategies" (or "Strategies")
- Stress Test stays under its own "ANALYSIS" group
- Routes unchanged: `/withdrawal` and `/stress-test`
- Sidebar section headers and ordering updated accordingly

---

## 2. Explore Page (formerly Withdrawal)

The Explore page is a learning/comparison tool for withdrawal strategies. It uses a simplified decumulation-only model.

### What stays

- Existing deterministic strategy comparison table (12 strategies side by side)
- Strategy parameter controls
- All existing withdrawal strategy visualizations

### What's added

#### Educational banner

A dismissible info banner at the top of the page:

> Compare withdrawal strategies to understand how they behave under different market conditions. This uses a simplified decumulation-only model. For a full stress test of your plan including accumulation, go to **Stress Test ->**

Purpose: set expectations that this is for learning, not the definitive test of their plan.

#### FIRE Target MC section

A new tab or section that runs Monte Carlo on the decumulation phase only.

**Starting balance toggle:**
```
[My Plan: $1,419,181]  |  [FIRE Target: $2,376,015]
```

- **My Plan:** uses the deterministically projected NW at retirement age (from the Projection engine, same value shown on the Projection page)
- **FIRE Target:** uses the FIRE number (annual expenses / SWR)

Both are just a number fed into decumulation-only MC. No accumulation phase, no stochastic pre-retirement.

**MC configuration:**
- `currentAge = retirementAge` (skip accumulation)
- `initialPortfolio = chosen balance`
- `annualSavings = []` (no accumulation savings)
- All other params (strategy, method, simulations, SWR, allocation) configurable as today

**Outputs:**
- Success rate, median/5th/95th terminal wealth
- Fan chart (retirement age to life expectancy)
- Withdrawal schedule table
- Failure distribution by decade
- SWR optimization results

---

## 3. Stress Test Page

The Stress Test page tests YOUR plan end-to-end. It always starts with your actual current NW and runs through your full lifecycle.

### What's removed

- My Plan / FIRE Target toggle (`AnalysisModeToggle` component removed from this page)
- The concept of "FIRE Target mode" on this page

### What stays

- Monte Carlo tab with all current outputs
- Projection Table tab
- Historical Backtest tab (Advanced mode)
- Sequence Risk tab (Advanced mode)
- Simple/Advanced mode toggle

### What's added

#### Pre-retirement method toggle

```
Pre-retirement returns:  [Expected Returns]  |  [Stochastic]
```

Placed in the Simulation Parameters card, near the existing Method dropdown.

**Expected Returns (deterministic accumulation):**
- All 10K sims use the same weighted-average portfolio return during the accumulation phase (ages currentAge to retirementAge)
- Every sim arrives at retirement with the same projected balance
- MC randomness applies only during decumulation
- Answers: "If accumulation goes as planned, does my retirement survive?"

**Stochastic (full MC accumulation):**
- Each sim gets random returns from currentAge onward (current My Plan behavior)
- Sims arrive at retirement with different balances depending on their random return sequences
- Captures accumulation-phase sequence risk (e.g., crash right before retirement)
- Answers: "With full market uncertainty from today, does my plan survive?"

#### MC engine changes

New parameter in `MonteCarloEngineParams`:
```typescript
deterministicAccumulation?: boolean  // default false
```

In the simulation loop, when `deterministicAccumulation` is true and `t < nYearsAccum`:
```typescript
// Instead of: portfolioReturns[s][t] (different per sim)
// Use: expectedPortfolioReturn (same for all sims)
const returnRate = deterministicAccumulation
  ? expectedPortfolioReturn
  : portfolioReturns[s][t]
```

The `expectedPortfolioReturn` is the weighted-average return from the user's allocation weights and per-asset expected returns (same value `calculatePortfolioReturn()` computes).

All downstream statistics (success rate, percentile bands, fan chart, failure distribution) naturally reflect whichever mode is active since they're computed from the same `balances` array.

#### Projection Table impact

- **Stochastic mode:** pre-retirement rows vary by percentile (Return $, Liquid NW, Total NW differ across p10/p25/p50/p75/p90). Deterministic columns (Net Income, Daily Expenses, CPF Total) stay identical.
- **Expected Returns mode:** pre-retirement rows are identical across all percentiles (all sims followed the same accumulation path). Post-retirement rows vary by percentile as before.

No changes needed to the Projection Table component itself; the difference is in what the MC engine produces for the representative paths.

---

## 4. Code Changes Summary

### Components to modify

| Component | Change |
|-----------|--------|
| Sidebar nav (`layout/`) | Add EXPLORE section, move Withdrawal into it, rename to "Withdrawal Strategies" |
| `StressTestPage.tsx` | Remove `AnalysisModeToggle`, add pre-retirement method toggle |
| `SimulationControls.tsx` | Add deterministic/stochastic toggle to simulation params card |
| `WithdrawalPage.tsx` | Add educational banner, add MC section with starting-balance toggle |

### Hooks/stores to modify

| Module | Change |
|--------|--------|
| `useSimulationStore.ts` | Add `deterministicAccumulation: boolean` field (default false). `analysisMode` field kept for Explore page starting-balance toggle but semantics simplified. |
| `useAnalysisPortfolio.ts` | Simplify: Stress Test always uses current NW (no `skipAccumulation`). Explore page uses a simpler hook that just picks between projected NW and FIRE number. |
| `useMonteCarloQuery.ts` | Pass `deterministicAccumulation` to MC engine. For Explore page usage: always set `currentAge = retirementAge`. |

### Engine changes

| Module | Change |
|--------|--------|
| `monteCarlo.ts` | Accept `deterministicAccumulation` param. When true, use `expectedPortfolioReturn` for all sims during `t < nYearsAccum` instead of per-sim `portfolioReturns[s][t]`. |
| `workerClient.ts` | Pass through new param. |
| `simulation.worker.ts` | Pass through new param. |

### Components to remove/deprecate

| Component | Action |
|-----------|--------|
| `AnalysisModeToggle.tsx` | Remove from Stress Test page. May repurpose a simpler version for Explore page starting-balance toggle, or build a new minimal toggle. |

---

## 5. What This Does NOT Change

- Historical Backtest and Sequence Risk tabs: unchanged, stay on Stress Test page
- The 12 withdrawal strategy implementations: unchanged
- The deterministic strategy comparison on the Withdrawal/Explore page: unchanged
- The Projection page: unchanged
- Dashboard: unchanged
- Any calculation in `lib/calculations/`: unchanged
- URL routes: unchanged (`/withdrawal`, `/stress-test`)

---

## 6. Migration Notes

- `analysisMode` in localStorage (persisted Zustand state): the field can remain but its meaning changes. On the Explore page it controls starting balance selection. On the Stress Test page it's ignored (always My Plan). No migration needed since both values ('myPlan', 'fireTarget') remain valid for the Explore page toggle.
- The new `deterministicAccumulation` field defaults to `false`, preserving current Stress Test behavior (stochastic accumulation) for existing users.
