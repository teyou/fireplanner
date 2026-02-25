# Ignored Fields: Architectural Fixes

Audit date: 2025-02-25. These items require design work beyond a simple code fix.

## Fixed (this session)

- [x] `taxTreatment` on IncomeStream: was hardcoded by stream type, now respects per-stream flag
- [x] `isCpfApplicable` on IncomeStream: was ignored, now gates CPF contributions per-stream
- [x] `savingsPause` / `cpfPause` on LifeEvent: tests were coincidence-masked, added isolation tests
- [x] SRS hardcoded literals (35700/15300): replaced with `SRS_ANNUAL_CAP` / `SRS_ANNUAL_CAP_FOREIGNER`
- [x] SRS residency test coverage: added foreigner/PR test cases

## High Priority

### 1. Glide path ignored by simulations
- **Fields:** `glidePathConfig`, `targetWeights` on AllocationState
- **Bug:** Deterministic projection shifts allocation with age (e.g., 80/20 to 40/60 over ages 60-75). MC, backtest, and sequence risk simulations all use a single fixed `allocationWeights`, ignoring the glide path entirely.
- **Impact:** Simulation success rates can be materially wrong for users with age-based allocation shifting.
- **Fix:** `MonteCarloEngineParams` (and equivalents) need to accept a glide path schedule. Inner simulation loops need to apply time-varying weights per year.
- **Files:** `monteCarlo.ts`, `backtest.ts`, `sequenceRisk.ts`, `workerClient.ts`, all 3 simulation query hooks

### 2. Backtest missing `postRetirementIncome`
- **Bug:** MC and sequence risk hooks both compute and pass `postRetirementIncome` (CPF LIFE, rental, investment, government income). The backtest hook does not. The backtest engine (`BacktestEngineParams`) doesn't even accept the parameter.
- **Impact:** Backtest survival rates are systematically too pessimistic for anyone with post-retirement income.
- **Fix:** Three layers: (1) add `postRetirementIncome?: number[]` to `BacktestEngineParams`, (2) subtract it from withdrawals in `runSingleWindow` and `runDetailedWindow`, (3) compute it in `useBacktestQuery.ts` using the same pattern as MC/sequence risk hooks.
- **Files:** `backtest.ts`, `useBacktestQuery.ts`

### 3. `residencyStatus` not affecting CPF contributions
- **Bug:** Foreigners on Employment Passes don't contribute to CPF. PRs in years 1-2 have graduated rates. `cpf.ts` gives everyone full citizen rates regardless of `residencyStatus`.
- **Impact:** Can inflate projected savings by tens of thousands per year for non-citizens.
- **Fix:** `calculateCpfContribution()` needs a `residencyStatus` parameter. New rate tables needed for PR graduated rates and foreigner zero-contribution. Income projection must pass residency through.
- **Files:** `cpf.ts`, `cpfRates.ts`, `income.ts`

### 4. `existingRentalIncome` on PropertyState (design decision needed)
- **Status:** The UI currently directs users to add rental income as an income stream in the Income section (InputsPage.tsx line 933). The `existingRentalIncome` field exists in the store but has no input in the UI and is never read.
- **Decision:** Either (a) remove the vestigial field from the store, or (b) add it as a property-specific rental that offsets mortgage in the projection (via `annualRentalIncome` in `projection.ts`). Option (a) is simpler. Option (b) provides better property cash flow modeling but overlaps with income streams.
- **Files:** `usePropertyStore.ts`, `useProjection.ts`, `types.ts`

## Medium Priority

### 5. `maritalStatus` not affecting spouse relief
- **Fields:** `maritalStatus` on ProfileState
- **Bug:** Spouse relief ($2,000) is defined in `taxBrackets.ts` and `computeTotalReliefs()` handles it. But no code reads `profile.maritalStatus` to auto-set `reliefBreakdown.spouseRelief`.
- **Complication:** IRAS requires spouse income under $4,000. This can't be auto-derived from just `married`. Needs a checkbox in the detailed relief breakdown UI, optionally auto-checked when `maritalStatus === 'married'`.
- **Files:** `useIncomeProjection.ts` or `buildProjectionParams()`, income store relief UI

### 6. `hdbCpfUsedForHousing` stored but never read
- **Fields:** `hdbCpfUsedForHousing` on PropertyState
- **Bug:** CPF used for housing must be refunded with accrued interest when the property is sold. This affects the net equity from downsizing. The field is stored, validated, and migrated but never read.
- **Fix:** When computing downsizing equity, subtract the CPF refund obligation (principal + 2.5% accrued interest). Requires knowing the age of CPF usage to compute interest.
- **Files:** `projection.ts` (downsizing logic), `useProjection.ts`

### 7. `FinancialGoal.priority` defined but ignored
- **Fields:** `priority` on FinancialGoal (essential / important / nice-to-have)
- **Bug:** UI lets users set priority, implying prioritized funding. `projection.ts` processes all goals identically.
- **Decision:** Either (a) implement priority-based behavior (e.g., defer nice-to-have goals when portfolio is stressed), or (b) remove the field from the type and UI to avoid misleading users. Option (b) is simpler and avoids a complex new calculation path.
- **Files:** `types.ts`, `projection.ts`, goal input UI

### 8. `downsizing` missing from backtest and sequence risk
- **Bug:** Downsizing equity injection works in deterministic projection and MC but is not passed to backtest or sequence risk hooks.
- **Impact:** Users planning to sell property and inject equity will see it in MC success rate but not in backtest survival or sequence risk stress tests.
- **Files:** `useBacktestQuery.ts`, `useSequenceRiskQuery.ts`
