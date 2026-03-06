# SGFirePlanner v2 Implementation Prompts

Use the prompts below as-is for implementation work.

## Prompt: Fireplanner Implementation

```text
Implement SGFirePlanner companion results payload v2 in /Users/tj/TJDevelopment/fireplanner/frontend.

Before coding:
1) Read and follow these canonical files:
- /Users/tj/TJDevelopment/fireplanner/frontend/docs/sgfireplanner-results-payload-v2.md
- /Users/tj/TJDevelopment/fireplanner/frontend/docs/sgfireplanner-results-payload-v2.schema.json

Hard requirements (do not reinterpret):
- New canonical names must be used in producer payload (`wr_safe_*`, `schema_version`, etc).
- Do not emit legacy `WR_critical_*` / v1 alias keys in v2 payload output.
- Failure definition is fixed: first retirement year where post-withdrawal/post-return balance <= 0.
- If all safe WR fields are present, preserve ordering: `wr_safe_95 <= wr_safe_90 <= wr_safe_85 <= wr_safe_50`.

Required tasks:
1. Update payload contract in:
- /Users/tj/TJDevelopment/fireplanner/frontend/src/lib/companion/types.ts
  - set SCHEMA_VERSION = 2
  - redefine PlannerResultsPayload to match the canonical schema fields exactly:
    schema_version, computed_at_utc, input_signature, scenario_id, scenario_name,
    simulation_method, n_simulations, computation_time_ms, cached,
    horizon_years, target_fire_age, projected_fire_age_p50,
    annual_expenses_target_real, required_portfolio, required_portfolio_basis, required_savings_rate,
    p_success, wr_safe_95, wr_safe_90, wr_safe_85, wr_safe_50, wr_safe_50_source,
    fail_prob_0_5y, fail_prob_6_10y,
    terminal_p5, terminal_p50, terminal_p95,
    portfolio_at_fire_p50, allocation_summary, allocation_weights

2. Add true wr_safe_50 optimization:
- /Users/tj/TJDevelopment/fireplanner/frontend/src/lib/simulation/simulation.worker.ts
  - add confidence_50 via optimizeSwr(0.50)
- /Users/tj/TJDevelopment/fireplanner/frontend/src/lib/types.ts
  - extend SafeSwr with confidence_50

3. Build v2 payload in:
- /Users/tj/TJDevelopment/fireplanner/frontend/src/lib/companion/resultsPayload.ts
  - emit canonical v2 fields and names
  - compute fail_prob_0_5y and fail_prob_6_10y from failure timing buckets
    - fail_prob_0_5y: first failure year in retirement years 1..5 (indices 0..4)
    - fail_prob_6_10y: first failure year in retirement years 6..10 (indices 5..9)
  - populate wr_safe_* with correct semantics
  - include wr_safe_50_source
  - include provenance fields and required target fields

4. Pass scenario/provenance context in:
- /Users/tj/TJDevelopment/fireplanner/frontend/src/hooks/useCompanionPlannerBridge.ts
  - scenario_id, scenario_name, input_signature
  - computed_at_utc, simulation_method, n_simulations, computation_time_ms, cached

5. Update companion UI references if needed:
- /Users/tj/TJDevelopment/fireplanner/frontend/src/components/companion/CompanionResultsSummary.tsx
- /Users/tj/TJDevelopment/fireplanner/frontend/src/components/companion/CompanionScenarioSwitcher.tsx
  - migrate legacy WR field names to wr_safe_* names

6. Update tests:
- /Users/tj/TJDevelopment/fireplanner/frontend/src/lib/companion/resultsPayload.test.ts
- /Users/tj/TJDevelopment/fireplanner/frontend/src/lib/companion/companionClient.test.ts
- /Users/tj/TJDevelopment/fireplanner/frontend/src/hooks/useCompanionPlannerBridge.test.ts

7. Add schema conformance test:
- validate one generated payload against:
  /Users/tj/TJDevelopment/fireplanner/frontend/docs/sgfireplanner-results-payload-v2.schema.json

Constraints:
- Keep snapshot API contract unchanged.
- Keep compatibility behavior stable.
- Do not edit unrelated files.

Verification:
- npm --prefix /Users/tj/TJDevelopment/fireplanner/frontend run type-check
- npm --prefix /Users/tj/TJDevelopment/fireplanner/frontend run test

Deliverable:
- list of changed files
- explicit confirmation that no legacy v1 alias keys are emitted
- explicit confirmation that payload validates against schema file
```

## Prompt: Expense Implementation

```text
Implement SGFirePlanner results payload v2 support in /Users/tj/TJDevelopment/expense.

Before coding:
1) Read and follow these canonical files:
- /Users/tj/TJDevelopment/expense/docs/sgfireplanner-results-payload-v2.md
- /Users/tj/TJDevelopment/expense/docs/sgfireplanner-results-payload-v2.schema.json

Hard requirements (do not reinterpret):
- Expense must accept v2 payloads only.
- Non-v2 payloads must be rejected with HTTP 400.
- v2 fields are canonical semantics; do not accept legacy alias keys as primary payload contract.

Required tasks:
1. Extend import payload decoding in:
- /Users/tj/TJDevelopment/expense/Application/Sources/Application/SGFirePlannerBridgeUseCase.swift
  - decode canonical v2 fields only
  - require `schema_version == 2`
  - reject non-v2 and malformed payloads with clear validation errors

2. Extend planner result model in:
- /Users/tj/TJDevelopment/expense/Domain/Sources/Domain/PlannerModels.swift
  - add/align optional v2 fields defined by canonical schema

3. Update import persistence mapping in:
- /Users/tj/TJDevelopment/expense/Application/Sources/Application/SGFirePlannerBridgeUseCase.swift
  - persist v2 fields into PlannerResults
  - use computed_at_utc when present, fallback to now
  - set inputsHash from input_signature when present

4. Ensure API endpoint behavior remains stable in:
- /Users/tj/TJDevelopment/expense/App/Companion/DesktopCompanionServer.swift
- /Users/tj/TJDevelopment/expense/Application/Sources/Application/CompanionSessionUseCases.swift

5. Optional (recommended if low risk):
- update /Users/tj/TJDevelopment/expense/Domain/Sources/Domain/FitnessEngine.swift
  to use wr_safe_95/wr_safe_90 margins when available, fallback to legacy wrCritical50

6. Update tests:
- /Users/tj/TJDevelopment/expense/Application/Tests/ApplicationTests/CompanionSessionUseCaseTests.swift
- /Users/tj/TJDevelopment/expense/Application/Tests/ApplicationTests/PlannerStateUseCaseTests.swift
- /Users/tj/TJDevelopment/expense/Application/Tests/ApplicationTests/ApplicationIntegrationTests.swift
- /Users/tj/TJDevelopment/expense/Domain/Tests/DomainTests/PlannerModelsTests.swift

Required test coverage:
- v2 payload import with full fields
- non-v2 payload rejected with 400
- legacy alias-key payload rejected with 400

Constraints:
- No destructive migrations.
- Do not touch unrelated files.

Verification:
- cd /Users/tj/TJDevelopment/expense && swift test

Deliverable:
- changed files
- explicit confirmation that non-v2 payloads are rejected
- note any unresolved field-semantic ambiguities explicitly
```
