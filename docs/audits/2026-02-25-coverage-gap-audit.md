# Coverage Gap Audit: Untested Logic & Formulas

**Date:** 2026-02-25
**Overall coverage:** 84.2% line, 74.6% branch (1,635 tests across 62 files)
**Scope:** All `.ts`/`.tsx` files in `frontend/src/`

---

## HIGH Severity: Financial Calculation / Formula Gaps

These are untested paths in code that computes monetary values users rely on for retirement planning. A bug here could silently produce wrong FIRE numbers, wrong withdrawal amounts, or incorrect tax bills.

---

### 1. projection.ts (lines 517-524): Retirement withdrawals with `durationYears` and `inflationAdjusted`

**What's untested:** The loop that processes `retirementWithdrawals` during decumulation. Specifically:
- Multi-year retirement withdrawals (`durationYears > 1`) spanning an age range
- Inflation-adjusted retirement withdrawals (`rw.inflationAdjusted === true`) where the amount grows by `Math.pow(1 + inflation, year)`
- The summation of multiple overlapping retirement withdrawals

**Why it matters:** Retirement withdrawals are user-configured lump sums (e.g., "withdraw $50K/yr for 3 years starting at age 65 for renovations"). If the inflation adjustment or duration math is wrong, the projection shows incorrect portfolio drawdown and the user's projected ruin date shifts.

---

### 2. projection.ts (lines 620-633): CPF LIFE bequest calculation (Basic vs Standard plan)

**What's untested:** The CPF bequest logic for both CPF LIFE plans:
- **Basic plan:** When `cpfRA > 0`, bequest = `cpfRA + annuityPremium`. When RA is depleted (`cpfRA === 0`), tracks cumulative payouts and computes bequest as `max(0, annuityPremium - payoutsFromAnnuity)`.
- **Standard plan:** Always computes bequest as `max(0, annuityPremium - payoutsFromAnnuity)`.
- The `raFullyDepleted` flag transition logic

**Why it matters:** CPF LIFE bequest is the amount returned to the estate upon death. It directly affects net worth calculations at end of life. The Basic plan has a decreasing bequest structure while Standard plan has no guaranteed bequest floor. Wrong bequest math affects the total legacy / terminal wealth shown on the dashboard.

---

### 3. tax.ts (lines 30-31): Highest tax bracket computation

**What's untested:** The code path where chargeable income exceeds all defined bracket boundaries, hitting the last bracket with an `Infinity` upper bound. The formula: `taxPayable = bracket.cumulativeTax + (chargeableIncome - bracket.from) * bracket.rate`.

**Why it matters:** This computes tax for incomes above $1M (24% marginal rate). If cumulative tax or the bracket rate is applied incorrectly at the top, high-income users get wrong tax projections.

---

### 4. withdrawal.ts (lines 422-425): Portfolio depletion mid-simulation

**What's untested:** The deterministic withdrawal comparison path where `portfolio <= 0` during the simulation loop. When the portfolio is depleted:
- `survived` is set to `false`
- Remaining years are filled with `{ portfolio: 0, withdrawal: 0 }`
- The loop continues rather than breaking

**Why it matters:** This is the ruin scenario in the deterministic strategy comparison. If the loop logic is wrong (e.g., off-by-one on when it triggers, or wrong values pushed), the survival flag and the displayed year-by-year trajectory are incorrect. Users comparing strategies rely on seeing which strategy survives and which depletes.

---

### 5. backtest.ts (lines 180-182): Portfolio depletion in historical backtest

**What's untested:** The `portfolio <= 0` guard inside the rolling window backtest loop. When the portfolio hits zero, `survived` is set to `false` and the window breaks early.

**Why it matters:** This determines whether a historical window "survived" or not. The survival rate across all windows is the headline backtest statistic. If the depletion check fires incorrectly (e.g., at exactly 0 instead of below 0), historical survival rates could be inflated.

---

### 6. property.ts (line 184): Zero-rate mortgage payment

**What's untested:** The `monthlyRate === 0` branch in mortgage payment calculation, where `newMonthlyPayment = newLoanAmount / nPayments` (simple division instead of the PMT formula with interest).

**Why it matters:** A zero interest rate is a valid edge case for some subsidized loans. If this branch produces a wrong payment, the entire downsizing cash flow analysis is off.

---

### 7. srs.ts (line 119): SRS vs RSTU recommendation branch

**What's untested:** The branch where `rstuNetBenefit > srsNetBenefit`, producing the recommendation "CPF SA top-up (RSTU) gives higher net benefit, but funds are locked until age 55." Only the opposite branch (SRS wins) is tested.

**Why it matters:** This recommendation drives user decision-making on whether to contribute to SRS or do a CPF SA top-up. If the comparison logic or the threshold is wrong, users get bad advice. The net benefit calculation uses `amount * currentMarginalRate` for RSTU vs `srsTaxSavedNow - srsTaxOnWithdrawal` for SRS.

---

### 8. useWithdrawalComparison.ts (lines 59-96): Portfolio return override and analysis mode branching

**What's untested (branches):**
- The `usePortfolioReturn && !allocationErrors` branch that computes expected return from allocation weights instead of the profile's flat expected return
- The `analysisMode === 'myPlan'` vs `'fireTarget'` branching that determines `initialPortfolio`
- The `initialPortfolioOverride` path when provided by the caller
- The expenses computation with `retirementSpendingAdjustment` and `expenseAdjustments`

**Why it matters:** This hook feeds the withdrawal strategy comparison table. The initial portfolio value at retirement and the expected return are the two most impactful inputs to the deterministic comparison. If the portfolio return override logic doesn't match the projection engine's logic, the comparison table shows strategies evaluated against a different scenario than the user's actual plan.

---

### 9. useFireCalculations.ts (lines 73-83, 101, 134): Income projection integration and portfolio return override

**What's untested (branches):**
- Lines 73-83: When income has no validation errors, generate income projection and use `projection[0].totalGross` as effective income instead of `profile.annualIncome`
- Line 101: The `usePortfolioReturn && !allocationHasErrors` path for computing expected return from allocation weights
- Line 134: The `healthcareConfig?.enabled` conditional that passes healthcare config to FIRE metrics

**Why it matters:** This is the core FIRE number / years-to-FIRE computation. The income projection integration means using the full income engine (with CPF, career phases, etc.) rather than the simple annual income figure. If this branch doesn't work correctly, the FIRE metrics shown on the dashboard use a simplified income that ignores the income engine entirely.

---

### 10. useWhatIfMetrics.ts (lines 104-137): Property equity computation and base inputs assembly

**What's untested (branches):**
- Lines 104-106: Property equity computation when `ownsProperty` is true
- Lines 97-101: Portfolio return from allocation weights override
- Lines 197-200: NaN handling for infinite yearsToFire/fireAge deltas (when one scenario is "never" and the other has a finite value)

**Why it matters:** The What-If slider analysis lets users see how changing one variable affects their FIRE date. If property equity isn't included when the user owns property, or if the return override doesn't activate correctly, the base metrics are wrong and all deltas are misleading.

---

### 11. useDisruptionImpact.ts (lines 155-206): Disrupted income recomputation and delta calculation

**What's untested (branches):**
- Lines 155-191: The full income re-projection with a disruption event appended (career break, layoff, etc.)
- Lines 201-210: Delta calculations between base and disrupted metrics, including NaN guards for infinite yearsToFire/fireAge

**Why it matters:** This shows users how a career disruption (e.g., 2-year career break) impacts their FIRE timeline. If the income re-projection with the disruption event injected doesn't work correctly, users see incorrect impact estimates for major life events.

---

## MEDIUM Severity: Business Rule / Edge Case Gaps

---

### 12. fire.ts (line 202): Forced decumulation at retirement age

**What's untested:** The path where `retirementAge != null && age >= retirementAge` forces a phase transition from accumulation to decumulation even if the FIRE number hasn't been reached.

**Why it matters:** This handles the case where a user retires at their planned age but hasn't saved enough. Without this guard, the glide path would keep accumulating past retirement, which is wrong.

---

### 13. expenses.ts (line 73): Merging consecutive expense phases with same amount

**What's untested:** The branch where two consecutive expense phases have the same `amount` and contiguous ages, causing them to merge (`last.toAge = phase.toAge`). Only the non-merge path (creating new phases) is tested.

**Why it matters:** This is a display optimization for the expense phase breakdown. If merging is buggy (e.g., wrong toAge), the UI shows fragmented expense phases.

---

### 14. monteCarlo.ts (line 171): Bootstrap fallback to parametric when no complete historical rows

**What's untested:** The `completeRows.length === 0` branch in bootstrap return generation that falls back to the parametric method when no historical data rows have complete data for all allocated asset classes.

**Why it matters:** If the user has a portfolio allocation that includes asset classes with no overlapping historical data, the bootstrap silently falls back to parametric. This is a reasonable fallback, but if it fires unexpectedly, the user thinks they're running bootstrap but actually gets parametric results. No error is surfaced.

---

### 15. sequenceRisk.ts (line 204): Negative balance clamping to zero

**What's untested:** The `balances[s][t + 1] < 0` clamping to zero after failure detection. This handles the case where the balance goes negative (not just zero).

**Why it matters:** Without this clamp, negative balances would propagate through the percentile calculations. It's a defensive guard that ensures charts don't show negative portfolio values.

---

### 16. linalg.ts (line 92): Cholesky double-jitter fallback

**What's untested:** The branch where Cholesky decomposition has already been jittered once (`jittered === true`) but the diagonal is still non-positive. Falls back to `Math.sqrt(1e-8)` instead of retrying.

**Why it matters:** This prevents infinite recursion when the correlation matrix is pathologically ill-conditioned even after jitter. Using `sqrt(1e-8)` as a fallback means the decomposition is technically wrong but numerically stable. Could produce slightly incorrect correlated returns in edge cases.

---

### 17. random.ts (line 33): All-zeros seed state fallback

**What's untested:** The `(this.s0 | this.s1 | this.s2 | this.s3) === 0` guard that sets `s0 = 1` when the splitmix32 initialization produces an all-zeros state.

**Why it matters:** xoshiro128** has an absorbing state at all-zeros (would produce zeros forever). This guard prevents that. The condition is extremely unlikely with splitmix32 seeding.

---

### 18. validation/rules.ts (lines 104, 117, 121): Locked asset and expense adjustment cross-validation

**What's untested:**
- Line 104: Expense adjustment `endAge > lifeExpectancy` validation
- Line 117: Locked asset `unlockAge > lifeExpectancy` validation
- Line 121: Locked assets length limit (> 10) validation

**Why it matters:** These are input validation rules that prevent nonsensical configurations. If they don't fire, users can set unlock ages past death or add unlimited locked assets.

---

### 19. validation/rules.ts (line 157): Life event startAge >= endAge validation

**What's untested:** The `event.startAge >= event.endAge` check in the cross-store life event validation.

**Why it matters:** This catches life events with zero or negative duration. The same check exists in the income store's own validation, so this is a second layer.

---

### 20. useRiskAssessment.ts (lines 74-90): Healthcare risk with healthcareConfig enabled

**What's untested (branches):** The healthcare risk dimension when `healthcareConfig.enabled` is true, which:
- Generates a healthcare projection using `generateHealthcareProjection`
- Computes `avgAnnualCash` from `lifetimeCashOutlay / yearsInRetirement`
- Assigns risk level: high (> $10K/yr), medium (> $5K/yr), low (otherwise)

Only the fallback path (healthcare not enabled, using naive MA balance check) is tested.

---

### 21. useOneMoreYear.ts (line 34): `getRiskLevel` returning 'risky' for SWR > 4.5%

**What's untested:** The default branch that returns `'risky'` when SWR exceeds the 4.5% threshold. Only 'safe' and 'marginal' branches are exercised by tests.

**Why it matters:** Users with aggressive withdrawal rates see a risk categorization label. If the threshold is wrong, the label is misleading.

---

### 22-24. Store migration and validation logic

**Files:** `usePropertyStore.ts` (38.6%), `useAllocationStore.ts` (67.4%), `useProfileStore.ts` (69.6%), `useIncomeStore.ts` (84.6%)

**What's untested:**
- **PropertyStore:** All migration versions (v2-v9), `computeValidationErrors` for existing property, downsizing sub-validations (sell-and-downsize, sell-and-rent), `setField`, `reset` actions
- **AllocationStore:** v2 migration (cpfHeavy removal + CPF weight redistribution), `applyTemplate` (target mode), return/stdDev overrides, glide path validation
- **ProfileStore:** Migrations v2-v20, many CRUD actions (`addParentSupport`, `removeParentSupport`, etc.), `currentAge` sync for `oopReferenceAge`, `onRehydrateStorage`
- **IncomeStore:** `migrateV1ToV2`, `setReliefBreakdown` (detailed tax relief mode)

**Why it matters:** Migrations run once on returning users' localStorage data. A buggy migration corrupts saved state silently. The AllocationStore v2 migration (CPF weight redistribution) is financial logic: redistributing weight proportionally so weights still sum to 1.0.

---

## LOW Severity: Defensive Guards, Infrastructure, UI Helpers

---

### 25. workerClient.ts (lines 47-116): Worker communication layer

**What's untested:** Nearly all worker client code at 22.6% coverage: `getWorker()` singleton creation, `callWorker<T>` message passing with ID multiplexing, error handling, and all 4 public API functions.

**Why it matters:** Infrastructure glue, not calculation logic. The actual computation is tested directly in the simulation engine tests.

---

### 26. simulation.worker.ts: Message dispatch

**What's untested:** The worker's `onmessage` handler that dispatches to the correct simulation engine. Engines themselves are tested directly.

---

### 27. exportExcel.ts: Full Excel export (189 lines)

**What's untested:** All Excel workbook construction. No financial calculations, but formatting and data completeness matter for users who share exports with advisors.

---

### 28. undo.ts: Undo/redo logic (48 lines)

**What's untested:** Timer-based undo with toast notification. Pure UI interaction logic.

---

### 29. monteCarlo.ts (line 340): Unknown MC method error

**What's untested:** `default: throw new Error('Unknown method: ...')` — TypeScript prevents invalid method values at compile time.

---

### 30. useCashFlowChart.ts (line 134): Empty filtered rows

**What's untested:** The `filteredRows.length === 0` guard returning `null`. UI empty-state guard.

---

### 31. useSectionNudge.ts (lines 124, 166): Null returns

**What's untested:** Property section null return when user doesn't own HDB, and default null for unknown section IDs. Advisory UI only.

---

## Summary

| Severity | Count | Key Themes |
|----------|-------|------------|
| **HIGH** | 11 | CPF LIFE bequest, retirement withdrawal inflation, top tax bracket, portfolio depletion, SRS vs RSTU, hook portfolio-return overrides |
| **MEDIUM** | 13 | Forced decumulation, bootstrap fallback, numerical guards, validation rules, store migrations, healthcare risk |
| **LOW** | 7 | Worker transport, Excel export, undo, type guards |

## Recommended Test Priorities

1. CPF LIFE bequest calculation (both Basic and Standard plans, RA depletion transition)
2. Retirement withdrawals with `durationYears > 1` and `inflationAdjusted = true`
3. Top tax bracket (income > $1M)
4. SRS vs RSTU branch where RSTU wins
5. Portfolio depletion mid-simulation (both deterministic withdrawal and backtest)
6. Zero-rate mortgage edge case in property downsizing
7. Hook branch tests for portfolio return from allocation weights (useFireCalculations, useWithdrawalComparison, useWhatIfMetrics)
8. Store migration smoke tests (at least PropertyStore v2-v9 and AllocationStore v2 CPF redistribution)
