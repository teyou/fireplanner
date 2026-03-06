# Expense ↔ Fireplanner Integration — Phase 5: On-Track Intelligence + Decision Quality

> Shared context (Do NOT Do, Rollback Strategy) is defined in the Expense ↔ Fireplanner Phase 1 planning docs (`fireplanner/docs/plans/2026-03-05-expense-integration-phase1a.md` and related files).
> Repo split: 5A in `~/TJDevelopment/expense/`, 5B in `~/TJDevelopment/fireplanner/`.
> Depends on Phase 4B (stress testing + companion flows complete).

## Product Intent

- Primary outcome: better user decisions.
- Audience: accumulators, near-retirees, and retirees.
- Decision quality target: a clear, defensible "on-track" verdict plus prioritized actions.

## Locked Policy Decisions

1. Success target:
- `p_success >= 0.90` is the green baseline.

2. Early failure weighting:
- `fail_prob_0_5y` is heavily weighted and should be near zero.

3. Lifecycle split:
- Separate on-track logic for accumulators vs retirees.

4. Retiree green gate:
- Green requires `actual_withdrawal_rate <= wr_safe_90`.

5. Runtime policy:
- Companion results contract is v2 only (`schema_version = 2`).
- Non-v2 payloads are rejected.

6. Performance guardrail:
- Stress/action scenario run budget: <= 15s per scenario.

7. Storage scope:
- Persist latest snapshot/result only (history deferred).

8. Legal/trust copy:
- Use existing SGFirePlanner disclaimer language as the baseline.

## Metric Definitions (Normative)

- `wr_safe_95`: highest withdrawal rate that still gives about 95% success over the horizon (more conservative).
- `wr_safe_90`: highest withdrawal rate that still gives about 90% success over the horizon (conservative).
- `wr_safe_50`: highest withdrawal rate that gives about 50% success over the horizon (very aggressive).

For on-track retiree checks:
- `actual_withdrawal_rate = annual_withdrawal / max(investable_assets, 1)`
- Expense should compute this from current plan inputs (not inferred from legacy aliases).

## On-Track Classification Policy (Canonical)

Base classification (all users):
- Green candidate: `p_success >= 0.90` and `fail_prob_0_5y <= 0.02`
- Amber: `(0.80 <= p_success < 0.90)` OR `(0.02 < fail_prob_0_5y <= 0.05)`
- Red: `p_success < 0.80` OR `fail_prob_0_5y > 0.05`

Lifecycle overlay:
- Accumulator/Near-retiree: base classification only, plus required-savings-gap messaging.
- Retiree: if Green candidate but `actual_withdrawal_rate > wr_safe_90`, downgrade to Amber.

Secondary risk emphasis:
- `fail_prob_6_10y` does not override the primary band, but must affect recommendation priority and explanation text.

## Recommendation Levers (Phase 5 Defaults)

Action set to evaluate and present:
- Savings rate: `+2pp`
- Expense target: `-10%`
- Retirement age: `+2 years`
- Withdrawal reduction (retirees): `-10%`
- Allocation de-risk: `-10pp equities, +10pp bonds/cash`

Recommendation ordering:
- Rank by expected improvement in `p_success`, then reduction in `fail_prob_0_5y`, then reduction in `fail_prob_6_10y`.

## Phase 5A — Expense (Consumer + Decision Surface)

### Objectives

- Enforce strict v2 companion import.
- Compute and show on-track status with lifecycle-aware logic.
- Surface actionable guidance using required savings rate and withdrawal safety.

### PR E5.1 — Strict v2 import and validation

**Files:**
- `Application/Sources/Application/SGFirePlannerBridgeUseCase.swift`
- `App/Companion/DesktopCompanionServer.swift`
- `Application/Sources/Application/CompanionSessionUseCases.swift`

**Acceptance criteria:**
- [ ] Accept `schema_version == 2` only.
- [ ] Reject non-v2 payloads with 400 and explicit validation error body.
- [ ] Do not treat v1 alias keys as canonical input fields.

### PR E5.2 — On-track assessment engine

**Files:**
- `Domain/Sources/Domain/PlannerModels.swift`
- `Application/Sources/Application/ApplicationModels.swift`
- `Application/Sources/Application/UseCases.swift`

**Acceptance criteria:**
- [ ] Compute canonical band: Green/Amber/Red using Phase 5 policy.
- [ ] Distinguish accumulator vs retiree path.
- [ ] Retiree green downgrade applied when `actual_withdrawal_rate > wr_safe_90`.
- [ ] Persist and expose latest on-track assessment with latest planner result.

### PR E5.3 — Recommendations + required savings gap

**Files:**
- `Application/Sources/Application/UseCases.swift`
- `App/Companion/DesktopCompanionServer.swift` (response DTO wiring)

**Acceptance criteria:**
- [ ] Compute `current_savings_rate = (avgMonthlyIncome - avgMonthlyExpense) / max(avgMonthlyIncome, 1)`.
- [ ] Compute `required_savings_gap = required_savings_rate - current_savings_rate`.
- [ ] Emit top actionable recommendations (save more, spend less, retire later, withdraw less/de-risk when applicable).
- [ ] Include plain-language explanation for why a recommendation was chosen.

### PR E5.4 — Decision trust and legal copy parity

**Files:**
- Companion and app-facing surfaces that display on-track/recommendations.

**Acceptance criteria:**
- [ ] Persistent educational-not-advice disclaimer is visible where on-track decisions are shown.
- [ ] Simulation-model warning appears alongside scenario-based recommendations.
- [ ] Copy is aligned with existing SGFirePlanner disclaimer baseline.

## Phase 5B — Fireplanner (Producer + What-If Intelligence)

### Objectives

- Produce strict v2 payload only.
- Quantify action-impact estimates for decision support.
- Keep companion-mode runs within latency budget.

### PR F5.1 — Strict v2 payload compliance

**Files:**
- `frontend/src/lib/companion/types.ts`
- `frontend/src/lib/companion/resultsPayload.ts`
- `frontend/src/hooks/useCompanionPlannerBridge.ts`

**Acceptance criteria:**
- [ ] Emit canonical v2 fields only.
- [ ] Emit no v1 alias keys (`WR_critical_*`, `horizonYears`, `allocationSummary`, `fire_age`, `portfolio_at_fire`).
- [ ] Schema conformance tests pass against `docs/sgfireplanner-results-payload-v2.schema.json`.

### PR F5.2 — Action impact estimator

**Files:**
- `frontend/src/lib/companion/actionImpacts.ts` (NEW)
- `frontend/src/components/companion/CompanionResultsSummary.tsx`
- `frontend/src/components/companion/CompanionScenarioSwitcher.tsx`

**Acceptance criteria:**
- [ ] Run the 5 default levers from this phase using existing simulation pipeline (no duplicate param construction).
- [ ] Show per-lever deltas: `Δp_success`, `Δfail_prob_0_5y`, `Δfail_prob_6_10y`.
- [ ] Surface top 3 levers in ranked order with concise rationale.
- [ ] Keep results companion-only (no history persistence).

### PR F5.3 — Retiree drawdown guard support

**Files:**
- `frontend/src/lib/companion/resultsPayload.ts`
- `frontend/src/components/companion/CompanionResultsSummary.tsx`

**Acceptance criteria:**
- [ ] Clearly label `wr_safe_90` as conservative retiree drawdown reference.
- [ ] Show explicit retiree guard outcome: `actual_withdrawal_rate <= wr_safe_90` pass/fail.
- [ ] Use wording that avoids interpreting WR capacity as mandatory spending.

### PR F5.4 — Performance and determinism guardrails

**Files:**
- Companion simulation hooks/tests under `frontend/src/hooks/` and `frontend/src/lib/companion/`.

**Acceptance criteria:**
- [ ] Each action/stress scenario completes within <= 15s (or returns timeout error state).
- [ ] UI shows per-scenario progress while running.
- [ ] Tests cover timeout/failure handling and deterministic output bounds.

## Verification

Cross-repo verification checklist:
- [ ] v2-only contract enforced end-to-end.
- [ ] On-track classification matches policy table for both lifecycle types.
- [ ] Retiree green requires `actual_withdrawal_rate <= wr_safe_90`.
- [ ] Required savings gap and recommendation outputs are present and understandable.
- [ ] Companion action impacts render with ranked deltas.
- [ ] Scenario runs meet <= 15s budget and expose progress/error states.
- [ ] Disclaimer copy present on all decision-critical surfaces.

## Phase 5 Done Definition

Phase 5 is complete when:
- Decision surfaces consistently answer "Am I on track?" and "What should I change first?".
- Answers are policy-driven (not ad-hoc), test-covered, and consistent across Expense + Fireplanner.
- v2 payload contract, latency guardrails, and legal/trust copy are all verified in manual QA.
