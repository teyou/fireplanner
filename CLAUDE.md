# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Singapore FIRE (Financial Independence, Retire Early) + Property + Investment Retirement Planner. A full-stack web application for comprehensive retirement planning tailored to Singapore residents.

**Status:** W2 Income Engine complete. Income page with 3 salary models, streams, life events, and year-by-year projection table working.

**Current Phase: W3 — Asset Allocation**
Update this marker as phases complete.

**Source of truth:** When the master plan (`FIRE_PLANNER_MASTER_PLAN_v2.md`) and this file conflict, the master plan wins for calculation logic, formulas, Singapore-specific rules, and domain requirements. This file wins for technology choices, architecture decisions, and implementation patterns.

## Architecture

### Frontend
| Dependency | Version |
|-----------|---------|
| React | 18.3.x |
| TypeScript | 5.7.x |
| Vite | 6.x |
| React Router | 6.x |
| Zustand | 5.x |
| React Query (TanStack Query) | 5.x |
| Tailwind CSS | 3.4.x |
| shadcn/ui | latest |
| Recharts | 2.x |
| D3.js | 7.x |
| React Hook Form | 7.x |
| Zod | 3.x |
| TanStack Table | 8.x |

**Routing:** React Router v6 with `createBrowserRouter`. Route components live in `pages/` as plain components (e.g., `ProfilePage.tsx`). Do NOT use Next.js file-based routing conventions (`page.tsx`, `layout.tsx` in nested folders).

**State:** 6 Zustand stores (profile, income, allocation, simulation, withdrawal, property). Dashboard metrics are **derived hooks**, not a 7th store — the dashboard owns no state, it computes views from other stores.

### Backend
| Dependency | Version |
|-----------|---------|
| Python | 3.12.x |
| FastAPI | 0.115.x |
| NumPy | 2.1.x |
| SciPy | 1.14.x |
| Pandas | 2.2.x |
| openpyxl | 3.1.x (Excel export only) |
| Redis (Upstash) | serverless |

**The backend is stateless.** It receives computation parameters via POST, returns results. No database. No user data storage. No authentication.

### Data Persistence (Browser-Only)

All user financial data stays in the browser. No server-side storage of user data.

- **localStorage:** All Zustand store state auto-saved on change via `zustand/middleware` persist. Restored on page load.
- **JSON export/import:** Users can download their full state as a JSON file and restore it on any device/browser. This is the cross-device portability mechanism.
- **URL params:** Life stage, FIRE type, and view state encoded in URL for bookmarking and sharing specific views.
- **No authentication.** No accounts. No server-side user profiles.

### Directory Structure
```
fireplanner/
├── frontend/
│   ├── src/
│   │   ├── pages/                    # Route components (React Router v6)
│   │   │   ├── StartPage.tsx         # Landing / Start Here wizard
│   │   │   ├── ProfilePage.tsx       # FIRE Profile
│   │   │   ├── IncomePage.tsx        # Income Engine
│   │   │   ├── AllocationPage.tsx    # Asset Allocation
│   │   │   ├── MonteCarloPage.tsx    # Monte Carlo Simulation
│   │   │   ├── WithdrawalPage.tsx    # Withdrawal Strategies
│   │   │   ├── SequenceRiskPage.tsx  # Sequence Risk
│   │   │   ├── BacktestPage.tsx      # Historical Backtest
│   │   │   ├── DashboardPage.tsx     # FIRE Dashboard
│   │   │   ├── PropertyPage.tsx      # Property Analysis
│   │   │   └── ReferencePage.tsx     # Reference Guide
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui primitives
│   │   │   ├── layout/              # Sidebar, Header, StepIndicator
│   │   │   ├── profile/             # Profile section components
│   │   │   ├── income/              # Income engine components
│   │   │   ├── allocation/          # Asset allocation components
│   │   │   ├── simulation/          # Monte Carlo components
│   │   │   ├── withdrawal/          # Withdrawal strategy components
│   │   │   ├── backtest/            # Backtest components
│   │   │   ├── dashboard/           # Dashboard panel components
│   │   │   ├── property/            # Property analysis components
│   │   │   └── shared/              # CurrencyInput, PercentInput, Tooltip, etc.
│   │   │
│   │   ├── stores/
│   │   │   ├── useProfileStore.ts
│   │   │   ├── useIncomeStore.ts
│   │   │   ├── useAllocationStore.ts
│   │   │   ├── useSimulationStore.ts
│   │   │   ├── useWithdrawalStore.ts
│   │   │   └── usePropertyStore.ts
│   │   │
│   │   ├── hooks/
│   │   │   ├── useFireCalculations.ts    # Derived FIRE metrics
│   │   │   ├── useIncomeProjection.ts    # Year-by-year income
│   │   │   ├── usePortfolioStats.ts      # Portfolio analytics
│   │   │   ├── useDashboardMetrics.ts    # Dashboard headline numbers (derived)
│   │   │   ├── useDashboardCharts.ts     # Dashboard chart data (derived)
│   │   │   ├── useRiskAssessment.ts      # 6 risk dimensions (derived)
│   │   │   ├── useMonteCarloQuery.ts     # API call + caching
│   │   │   └── useBacktestQuery.ts       # API call + caching
│   │   │
│   │   ├── lib/
│   │   │   ├── calculations/
│   │   │   │   ├── fire.ts              # FIRE number, years-to-FIRE, Coast, Barista
│   │   │   │   ├── cpf.ts              # CPF contributions, interest, BRS/FRS/ERS
│   │   │   │   ├── tax.ts              # SG progressive tax, reliefs, SRS
│   │   │   │   ├── income.ts           # 3 salary models, projections
│   │   │   │   ├── portfolio.ts        # Markowitz stats on 8x8
│   │   │   │   ├── withdrawal.ts       # 6 withdrawal strategies (deterministic)
│   │   │   │   └── property.ts         # Property analysis formulas
│   │   │   │
│   │   │   ├── validation/
│   │   │   │   ├── schemas.ts          # Zod schemas per store
│   │   │   │   └── rules.ts           # Cross-store validation rules
│   │   │   │
│   │   │   ├── data/
│   │   │   │   ├── historicalReturns.ts  # Embedded annual return data
│   │   │   │   ├── momSalary.ts         # MOM salary benchmarks
│   │   │   │   ├── cpfRates.ts          # CPF contribution rate tables
│   │   │   │   ├── taxBrackets.ts       # SG tax brackets + reliefs
│   │   │   │   ├── balaTable.ts         # Bala's Table data
│   │   │   │   └── crisisScenarios.ts   # 8 historical crisis definitions
│   │   │   │
│   │   │   ├── api.ts                   # API client (to FastAPI backend)
│   │   │   ├── types.ts                 # TypeScript interfaces
│   │   │   └── utils.ts                 # Formatters, helpers
│   │   │
│   │   └── router.tsx                   # React Router configuration
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI app entry
│   │   ├── config.py                   # Settings, env vars
│   │   │
│   │   ├── api/routes/
│   │   │   ├── simulation.py           # POST /api/monte-carlo
│   │   │   ├── backtest.py             # POST /api/backtest
│   │   │   ├── optimization.py         # POST /api/optimize-swr
│   │   │   ├── sequence_risk.py        # POST /api/sequence-risk
│   │   │   └── export.py              # POST /api/export-excel
│   │   │
│   │   ├── core/
│   │   │   ├── monte_carlo.py          # 10K simulation engine
│   │   │   ├── backtest.py             # Historical backtesting
│   │   │   ├── withdrawal_strategies.py # 6 strategy implementations
│   │   │   ├── portfolio.py            # Markowitz, optimization
│   │   │   ├── sequence_risk.py        # Stress test engine
│   │   │   └── swr_optimizer.py        # Binary search for safe SWR
│   │   │
│   │   ├── data/
│   │   │   ├── historical_returns.csv  # Full 1926-2024 data
│   │   │   ├── correlation_matrix.csv  # Pre-computed correlations
│   │   │   └── crisis_scenarios.json   # 8 crisis definitions
│   │   │
│   │   └── models/
│   │       └── schemas.py              # Pydantic request/response models
│   │
│   ├── tests/
│   │   ├── test_monte_carlo.py
│   │   ├── test_backtest.py
│   │   ├── test_withdrawal_strategies.py
│   │   └── test_swr_optimizer.py
│   │
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml                  # Local dev: frontend + backend + redis
├── FIRE_PLANNER_MASTER_PLAN_v2.md     # Domain reference (formulas, rules, data)
├── FIRE_WEBAPP_ARCHITECTURE.md        # Architecture reference
└── CLAUDE.md                          # This file
```

## Computation Split (Critical Design Decision)

**Client-side (instant feedback):** FIRE number, Coast/Barista FIRE, SG progressive tax, CPF contributions, income projections, portfolio stats (Markowitz on 8x8), deterministic withdrawal strategies (single-path), glide path interpolation, property analysis formulas.

**Server-side (heavy computation):** Monte Carlo (10K simulations via NumPy vectorization, 2-5 sec), historical backtesting (rolling windows), SWR optimization (binary search over MC), sequence risk stress testing (multiple MC runs), portfolio optimization (scipy.optimize), Excel export (openpyxl).

### Withdrawal Strategy Dual Implementation

The 6 withdrawal strategies are implemented **twice**: in TypeScript (`lib/calculations/withdrawal.ts`) for instant deterministic comparison, and in Python (`core/withdrawal_strategies.py`) for use inside the MC simulation loop. Both implementations must produce identical outputs for identical inputs. Enforce parity via shared test vectors — the same hardcoded input/output pairs used in `withdrawal.test.ts` must match `test_withdrawal_strategies.py`. Any formula change requires updating both implementations and both test files.

### Redis Caching Strategy

MC simulation results are cached in Upstash Redis to avoid re-running identical simulations.

- **Cache key:** SHA-256 hash of the full POST request body (all params sorted deterministically). This means any input change automatically invalidates.
- **TTL:** 1 hour. MC results are computation-heavy but not permanent — users iterate on inputs.
- **Cache hit flow:** Backend checks Redis before running MC. On hit, returns cached response with `cached: true` flag. Frontend shows "Cached result" indicator.
- **No cache for:** SWR optimization (too many internal iterations), export-excel (unique per call).

### Rebalancing

All simulations (MC, backtest, sequence risk) use **annual steps**. The rebalancing frequency option in the UI (Annual/Semi-Annual/Quarterly) is informational — it does not change simulation granularity. Historical return data is annual, and sub-annual rebalancing has negligible impact on long-term outcomes. Do not implement sub-annual simulation steps.

## Validation Layer

Validation runs **before** any calculation. Invalid inputs must not propagate through the store dependency chain.

### Per-Store Validation (Zod schemas in `lib/validation/schemas.ts`)
Each store has a Zod schema defining valid ranges. Examples:
- `currentAge`: integer, 18-100
- `retirementAge`: integer, > currentAge, <= lifeExpectancy
- `lifeExpectancy`: integer, > retirementAge, 50-120
- `swr`: number, 0.01-0.10
- Allocation weights: array of 8, each 0-1, sum === 1.0
- `annualExpenses`: number, > 0
- `inflation`: number, 0-0.15

### Cross-Store Validation (in `lib/validation/rules.ts`)
Rules that span stores:
- Retirement age (profile) > current age (profile)
- Life expectancy (profile) > retirement age (profile)
- Allocation weights (allocation) must sum to 1.0 before portfolio stats compute
- Income streams end ages (income) <= life expectancy (profile)
- Withdrawal strategy params (withdrawal) validated against portfolio size (profile)

### Error Propagation
- Each store exposes a `validationErrors` field (map of field name to error message)
- Calculation hooks check upstream store validity before computing: if profile store has errors, income projections return `null` with an error flag
- Components display inline validation errors on inputs and show a warning banner when downstream calculations are blocked by upstream errors
- API calls are gated: Monte Carlo button is disabled with tooltip explaining which inputs need fixing

## Key Domain Concepts

- **8 asset classes:** US Equities, SG Equities (STI), Intl Equities (MSCI), Bonds, REITs, Gold, Cash, CPF (OA+SA blend)
- **6 withdrawal strategies:** Constant Dollar (4% rule), VPW, Guardrails (Guyton-Klinger), Vanguard Dynamic, CAPE-Based, Floor-and-Ceiling
- **3 salary models:** Simple (fixed growth), Realistic (career phases + promotion jumps), Data-Driven (MOM benchmarks)
- **Monte Carlo methods:** Parametric (multivariate normal via Cholesky), Historical Bootstrap, Fat-tail (Student-t df=5)
- **All values in SGD.** USD-denominated assets converted at user-specified or historical FX rates.
- **Singapore-only.** All tax, CPF, property, and regulatory logic is Singapore-specific. No multi-country support. Data files in `lib/data/` are structured as standalone modules (e.g., `taxBrackets.ts`, `cpfRates.ts`) so future locale support could swap implementations, but do not build abstraction for it now.

## Singapore-Specific Logic

All Singapore-specific values live in `lib/data/` files, never hardcoded in calculation functions.

- **CPF:** Contribution rates vary by age bracket (up to 55: 37% total; 55-60: 29.5%; 60-65: 20.5%; 65-70: 16.5%; >70: 12.5%). OW ceiling $6,800/month, AW ceiling formula. Extra interest on first $60K (extra 1% on first $30K OA, extra 1% on next $30K across OA/SA/MA). BRS/FRS/ERS projections with 3.5% annual growth.
- **Tax:** SG progressive income tax (0% on first $20K up to 24% above $1M). Personal reliefs (earned income, NSman, spouse, child, parent, CPF, SRS). SRS deduction cap $15,300/yr.
- **Property:** Bala's Table for leasehold decay, BSD rates (1% on first $180K, 2% on next $180K, 3% on next $640K, 4% on next $500K, 5% on next $1.5M, 6% on remainder), ABSD rates by residency/property count, 75% LTV.
- **CPF LIFE:** Estimated payout rates ~5.4% (Basic) / ~6.3% (Standard) of FRS at 55.

## Testing Strategy

### Frontend: Vitest
Unit tests for every function in `lib/calculations/`:
- `fire.test.ts` — FIRE number, years-to-FIRE, Coast FIRE, Barista FIRE with known-good reference values from the master plan
- `cpf.test.ts` — Contribution calculations at each age bracket, extra interest rules, OW/AW ceiling logic, BRS/FRS/ERS projections
- `tax.test.ts` — Progressive tax at each bracket boundary, reliefs, SRS deduction
- `income.test.ts` — 3 salary models with expected output at specific ages, income stream aggregation
- `portfolio.test.ts` — Markowitz return/volatility/Sharpe for known allocation weights
- `withdrawal.test.ts` — All 6 strategies with deterministic inputs and expected year-by-year output
- `property.test.ts` — Bala's Table decay, BSD/ABSD calculations, LTV

Property-based tests (using `fast-check`):
- FIRE number > 0 when annual expenses > 0 and SWR > 0
- Allocation weights always sum to 1.0 after normalization
- Years to FIRE >= 0
- Tax payable <= taxable income
- CPF contributions <= salary x max total rate

Validation tests:
- Each Zod schema rejects out-of-range values
- Cross-store rules catch invalid combinations

### Backend: pytest
- `test_monte_carlo.py` — Seeded random state (`np.random.seed(42)`) for reproducible results. Verify success rate, percentile bands, terminal stats against known outputs.
- `test_backtest.py` — Known historical period with expected survival outcome
- `test_withdrawal_strategies.py` — Each strategy with fixed inputs and expected year-by-year withdrawals
- `test_swr_optimizer.py` — Binary search converges to expected SWR within tolerance

### Integration Tests
3 user journey scenarios with concrete expected values (derived from master plan formulas + smart defaults of 2.5% inflation, 0.3% expense ratio, Balanced 60/40 template at 7.2% nominal return):

1. **Fresh Graduate** (age 25, $48K income, $30K expenses, $50K NW, Aggressive 80/20, SWR 3.5%)
   - FIRE Number: $30,000 / 0.035 = **$857,143**
   - Savings Rate: $18,000 / $48,000 = **37.5%**
   - Years to FIRE (NPER at ~4.4% real net return): **~16 years (age 41)**
   - Coast FIRE Number: $857,143 / (1.044)^16 = **~$432,000** → not yet reached at $50K NW
   - Barista FIRE Income: max(0, $30,000 - $50,000 * 0.035) = **$28,250/yr**

2. **Mid-Career Professional** (age 35, $180K income, $96K expenses, $800K liquid + $200K CPF OA + $100K CPF SA, Balanced 60/40, SWR 4%)
   - FIRE Number: $96,000 / 0.04 = **$2,400,000**
   - Current NW: $800K + $300K CPF = $1,100,000
   - Progress: $1,100,000 / $2,400,000 = **45.8%**
   - Annual Savings: $180,000 - $96,000 = **$84,000**
   - Years to FIRE (NPER at ~3.9% real net return): **~12 years (age 47)**
   - Coast FIRE Number: $2,400,000 / (1.039)^12 = **~$1,524,000** → not yet reached
   - SG Tax (approx, $180K income - $37K CPF employee - $15.3K SRS - $20K reliefs = ~$107.7K chargeable): **~$12,300**

3. **Pre-Retiree** (age 55, $2M portfolio, $80K expenses, retirement at 58, Conservative 30/70, SWR 4%)
   - FIRE Number: $80,000 / 0.04 = **$2,000,000** → already at FIRE
   - Years to FIRE: **0** (already achieved)
   - Retirement Duration: 90 - 58 = **32 years**
   - Constant Dollar withdrawal: $2M * 0.04 = **$80,000/yr**
   - VPW withdrawal year 1 (PMT at 2% real, 32 years): **~$87,500/yr**
   - CPF LIFE at 65 (FRS ~$213K * 1.035^0 * 0.063 / 12 * 12): **~$13,400/yr**
   - Post-65 effective SWR: ($80K - $13.4K) / $2M = **3.33%** (reduced by CPF LIFE)

### Coverage Requirements
- `lib/calculations/`: 95% line coverage minimum
- `lib/validation/`: 90% line coverage minimum
- Backend `core/`: 90% line coverage minimum
- All tests must pass before committing

## Do Not

- **Do not use `any` type** in TypeScript calculation functions. All inputs and outputs must be typed.
- **Do not hardcode Singapore-specific values** in calculation functions. CPF rates, tax brackets, ABSD rates, Bala's Table data — all go in `lib/data/` files.
- **Do not use `Math.random()`** for Monte Carlo. Monte Carlo runs server-side only with NumPy seeded generators.
- **Do not use Next.js conventions.** No `page.tsx` / `layout.tsx` nested folder routing. This is React Router v6 with Vite.
- **Do not create a dashboard Zustand store.** Dashboard metrics are derived hooks that read from other stores.
- **Do not store user data server-side.** No database for user profiles. No authentication. Browser-only persistence.
- **Do not skip validation.** Every calculation hook must check input validity before computing.
- **Do not import from one store inside another store's definition.** Cross-store reads happen in hooks and components, not in store definitions.

## Build Phases

| Phase | Scope |
|-------|-------|
| W1 | Foundation: Vite/React/TS scaffold, React Router routing, FIRE Profile page, client-side calcs (`fire.ts`, `cpf.ts`, `tax.ts`), Zustand stores (profile, income), localStorage persistence, validation schemas, unit tests for calc functions |
| W2 | Income Engine: 3 salary models, 5 income streams, life events, SG tax integration, CPF integration, year-by-year projection table, income store |
| W3 | Asset Allocation: 8-class builder with sliders/inputs, 6 pre-built templates, Markowitz portfolio stats, D3 correlation matrix heatmap, glide path config, allocation store |
| W4 | Backend + Monte Carlo: FastAPI setup, Monte Carlo engine (parametric/bootstrap/fat-tail), `/api/monte-carlo` endpoint, fan chart (Recharts), success gauge, Redis caching, simulation store |
| W5 | Withdrawal Strategies + Sequence Risk: 6 strategy implementations (client-side deterministic), comparison table, `/api/sequence-risk` endpoint, crisis scenario stress tests, withdrawal store |
| W6 | Historical Backtest: `/api/backtest` endpoint, rolling window results, SWR x Duration D3 heatmap, SG vs US comparison |
| W7 | Dashboard + Property + Scenarios + Polish: Dashboard page with derived hooks, property analysis port, property hybrid MC overlay, scenario comparison mode (save/name/compare up to 5), Excel export (`/api/export-excel`), JSON export/import, reference guide, responsive polish, error/empty states |
| W8 | Deploy: Vercel (frontend), Railway or Fly.io (backend), Upstash Redis, Sentry error monitoring, PostHog analytics, performance optimization (code splitting, lazy loading) |

## API Endpoints

All endpoints are stateless computation. No user data stored server-side.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/monte-carlo` | POST | Run 10K simulations, returns percentile bands + success rate + safe SWR |
| `/api/backtest` | POST | Historical rolling window analysis, optional heatmap generation |
| `/api/optimize-swr` | POST | Binary search for max SWR at target confidence |
| `/api/sequence-risk` | POST | Crisis scenario stress testing across withdrawal strategies |
| `/api/export-excel` | POST | Generate .xlsx from full app state (receives all store data in request body) |

See `FIRE_WEBAPP_ARCHITECTURE.md` Section 4 for full request/response JSON schemas.

## Development Commands

```bash
# Frontend
cd frontend && npm install
npm run dev          # Vite dev server (http://localhost:5173)
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
npm run test         # Vitest (run all tests)
npm run test:watch   # Vitest in watch mode
npm run test:coverage # Vitest with coverage report

# Backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload    # FastAPI dev server (http://localhost:8000)
pytest                            # Run all tests
pytest --cov=app/core            # Run with coverage
pytest tests/test_monte_carlo.py  # Single test file

# Full stack (Docker)
docker-compose up    # frontend + backend + redis
```

### Before Committing
1. `npm run type-check` passes with zero errors
2. `npm run lint` passes
3. `npm run test` passes (all tests green)
4. `pytest` passes (if backend code changed)
5. `lib/calculations/` coverage >= 95%
6. No `any` types in calculation files
7. No hardcoded Singapore-specific values outside `lib/data/`

## UI Patterns

- **Live calculations:** Every input change recalculates client-side metrics instantly (no submit button for simple metrics).
- **Explicit run for heavy computation:** Monte Carlo and Backtest require a manual "Run" button with progress indicator. Show computation time on completion.
- **Progressive disclosure:** Basic mode shows essentials (age, income, expenses, net worth). Advanced toggles reveal income streams, life events, CPF details, correlation matrix, custom return overrides.
- **Color coding convention:** Blue = user input, Black = formula/computed, Green = linked from another store/section.
- **Smart defaults:** Pre-filled with Singapore defaults (age 30, $72K income from MOM degree median, $48K expenses, 2.5% inflation, Conservative template for Post-FIRE users).
- **Tooltips:** Every label has an (i) icon. Hover shows definition + formula.
- **Comparison mode (W7):** Save current state as named scenario, modify inputs to create alternatives, side-by-side panel. Up to 5 named scenarios stored in localStorage under `fireplanner-scenarios` key. Implemented as a utility module (`lib/scenarios.ts`), not a store.
- **Mobile-first responsive:** Dashboard cards stack vertically, charts resize with container, sidebar becomes bottom nav on mobile.

## Historical Data Plan

### Sources and Licensing

| Asset Class | Source | Period | License | Notes |
|------------|--------|--------|---------|-------|
| US Equities (S&P 500) | Damodaran (NYU Stern) | 1928-2024 | Academic/free | Annual total returns incl. dividends |
| US Bonds (10-yr Treasury) | FRED (Federal Reserve) | 1928-2024 | Public domain | Returns derived from yield changes |
| SG Equities (STI) | SGX + MAS | 1987-2024 | SG Open Data License | Total return index |
| Intl Equities (MSCI World) | MSCI | 1970-2024 | Free for personal use, attribute MSCI | Gross return USD, convert to SGD |
| REITs | FTSE NAREIT | 1972-2024 | Free with attribution | US REIT; SG REIT from SGX post-2002 |
| Gold | World Gold Council / LBMA | 1968-2024 | Free non-commercial | USD price, convert to SGD |
| Cash (T-Bills) | FRED | 1928-2024 | Public domain | 3-month T-Bill rate |
| SG CPI | SingStat | 1961-2024 | SG Open Data License | Annual CPI index |
| SG Property (URA PPI) | URA | 1975-2024 | SG Open Data License | Private residential PPI |
| USD/SGD FX | MAS | 1981-2024 | SG Open Data License | End-of-year rates |
| CPF Interest Rates | CPF Board | Published rates | Public | OA: 2.5%, SA: 4%, MA: 4% floor |

### Gap Handling
- **STI pre-1987:** Use MSCI Singapore index or proxy with MSCI EM Asia
- **SG CPI pre-1961:** Use 2.5% fixed historical average
- **SG REITs pre-2002:** Use US REIT data as proxy
- **Correlation matrix:** Compute from overlapping years only; document year range used

### Data Format
- Frontend: JSON/TypeScript in `frontend/src/lib/data/` (client-side reference)
- Backend: CSV in `backend/app/data/` (server-side computation)
- Each file includes a header comment with source URL, download date, and license
- Returns are annual, nominal, in local currency with a separate FX series for SGD conversion

### Update Cadence
- Annual refresh in January with previous year's full-year data
- Document the update process in `backend/app/data/README.md`
- Frontend embedded data updated simultaneously with backend CSV data

### Data Acquisition (Pre-W1 Task)
Before W1 coding begins, historical return data must be collected and formatted:
1. **Manual download** from each source (URLs documented in master plan Section 4D)
2. **Python script** (`scripts/build_data.py`) to clean, merge, and output:
   - `backend/app/data/historical_returns.csv` — full dataset, one row per year, columns per asset class
   - `backend/app/data/correlation_matrix.csv` — computed from overlapping years
   - `frontend/src/lib/data/historicalReturns.ts` — TypeScript export of summary stats + default return/stddev per asset class (not full time series — that stays backend-only)
3. Each output file includes a header comment with source URL, download date, license
4. The build script is idempotent — re-run annually with updated source CSVs
5. During W1, frontend data files can use hardcoded defaults from the master plan (Section 5: Asset Allocation expected returns). Full historical data is a W4 prerequisite when the backend needs it for MC/backtest.

### Property Hybrid Monte Carlo (W7)
Property analysis is deterministic (formulas from the existing Excel model), but in W7, property scenarios are overlaid on MC results:
- 5 discrete property scenarios (Bull +6%, Base +3%, Stagnation +0.5%, Crash -15% Y1-2 then +2%, Asian Crisis -25% Y1-3 then +3%) weighted by probability
- For each MC simulation path, a property scenario is randomly assigned
- Property equity is added to the portfolio balance at each year
- Mortgage payments are deducted from annual savings (accumulation) or increase required withdrawals (decumulation)
- Rental income is added to post-retirement income streams
- This is a frontend post-processing overlay on existing MC results, not a new API endpoint


<claude-mem-context>
# Recent Activity

<!-- This section is auto-generated by claude-mem. Edit content outside the tags. -->

### Feb 16, 2026

| ID | Time | T | Title | Read |
|----|------|---|-------|------|
| #6806 | 9:37 PM | 🔵 | CLAUDE.md Review Confirming Pre-Build Status and Web Application Focus | ~2261 |
| #6804 | 9:31 PM | 🔵 | Technical Specifications, Python Architecture, and Build Progress Tracker | ~2224 |
| #6803 | 9:30 PM | 🔵 | Six Withdrawal Strategies with Formulas and User Journey Scenarios | ~1701 |
| #6802 | 9:29 PM | 🔵 | UI/UX Design Patterns and Technical Decision Rationale | ~1366 |
| #6801 | 9:28 PM | 🔵 | Monte Carlo Simulation Engine and Withdrawal Strategy Implementation | ~1204 |
| #6800 | " | 🔵 | Zustand State Management Architecture and Store Interfaces | ~1127 |
| #6799 | 9:27 PM | 🔵 | Master Plan Phase 1 Foundation Components | ~963 |
| #6798 | 9:26 PM | 🔵 | Web Application Architecture and Implementation Roadmap | ~1003 |
| #6797 | " | 🔵 | Singapore FIRE Planner Project Structure and Requirements | ~626 |
| #6796 | 9:24 PM | 🟣 | CLAUDE.md Project Context File Created | ~719 |
| #6794 | " | 🔵 | FIRE Planner Master Plan Specifications Reviewed | ~755 |
| #6793 | 9:23 PM | 🔵 | Singapore FIRE Planner Web Application Architecture Designed | ~626 |
</claude-mem-context>