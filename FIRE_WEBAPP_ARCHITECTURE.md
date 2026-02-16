# SINGAPORE FIRE PLANNER — WEB APP ARCHITECTURE
## v2.0 | February 2026

> **Canonical implementation guide:** `CLAUDE.md`
> This document provides supplementary architecture detail — data flow diagrams, API schemas, store interfaces, and technical decision rationale. When this doc and CLAUDE.md conflict, **CLAUDE.md wins**.

---

## 1. TECHNOLOGY STACK

### Frontend
| Dependency | Version | Purpose |
|-----------|---------|---------|
| React | 18.3.x | UI framework |
| TypeScript | 5.7.x | Type safety |
| Vite | 6.x | Build tool + dev server |
| React Router | 6.x | Client-side routing (`createBrowserRouter`) |
| Zustand | 5.x | State management (6 stores) |
| React Query (TanStack Query) | 5.x | Async server state + caching |
| Tailwind CSS | 3.4.x | Utility-first styling |
| shadcn/ui | latest | Component primitives |
| Recharts | 2.x | Charts (fan charts, area charts) |
| D3.js | 7.x | Heatmaps, correlation matrix |
| React Hook Form | 7.x | Form state management |
| Zod | 3.x | Schema validation |
| TanStack Table | 8.x | Sortable/filterable projection tables |

### Backend
| Dependency | Version | Purpose |
|-----------|---------|---------|
| Python | 3.12.x | Runtime |
| FastAPI | 0.115.x | API framework |
| NumPy | 2.1.x | Vectorized Monte Carlo simulation |
| SciPy | 1.14.x | Portfolio optimization, distributions |
| Pandas | 2.2.x | Historical data processing |
| openpyxl | 3.1.x | Excel export only |
| Redis (Upstash) | serverless | Simulation result caching |

**The backend is stateless.** It receives computation parameters via POST, returns results. No database. No user data storage. No authentication.

### Infrastructure
| Component | Service | Purpose |
|-----------|---------|---------|
| Frontend | Vercel | Static hosting + CDN |
| Backend | Railway or Fly.io | FastAPI compute |
| Cache | Upstash Redis | Serverless Redis for MC result caching |
| Errors | Sentry | Error monitoring |
| Analytics | PostHog | Usage analytics |

### What's NOT in the stack
- **No PostgreSQL / Supabase** — no server-side user data storage
- **No authentication** — no user accounts, no sessions
- **No Celery / task queue** — MC runs synchronously (2-5 sec is acceptable)
- **No Next.js** — Vite + React Router v6, not App Router

---

## 2. APPLICATION STRUCTURE

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
│   │   │   ├── historical_returns.csv  # Full 1928-2024 data
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
├── FIRE_WEBAPP_ARCHITECTURE.md        # This file
└── CLAUDE.md                          # Canonical implementation guide
```

**Routing:** React Router v6 with `createBrowserRouter`. Route components live in `pages/` as plain components (e.g., `ProfilePage.tsx`). Do NOT use Next.js file-based routing conventions (`page.tsx`, `layout.tsx` in nested folders).

**State:** 6 Zustand stores — no dashboard store. Dashboard metrics are derived via hooks (`useDashboardMetrics`, `useDashboardCharts`, `useRiskAssessment`) that read from the 6 base stores.

---

## 3. DATA FLOW ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                            │
│                                                                     │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐                       │
│  │  Profile  │──→│  Income  │──→│  Asset   │                       │
│  │  Store    │   │  Store   │   │  Alloc   │                       │
│  └────┬─────┘   └────┬─────┘   │  Store   │                       │
│       │              │          └────┬─────┘                       │
│       │    ┌─────────┴───────┐       │                              │
│       │    │ Client-side     │       │     ┌────────────────────┐   │
│       │    │ calculations:   │       │     │ Derived hooks:     │   │
│       │    │ • FIRE number   │       │     │ • Dashboard metrics│   │
│       │    │ • Tax (SG)      │       │     │ • Dashboard charts │   │
│       │    │ • CPF contrib.  │       │     │ • Risk assessment  │   │
│       │    │ • Income proj.  │       │     │ (read from stores, │   │
│       │    │ • Portfolio     │       │     │  own no state)     │   │
│       │    │   stats         │       │     └────────────────────┘   │
│       │    │ • Withdrawal    │       │                              │
│       │    │   strategies    │       │                              │
│       │    │   (deterministic│       │                              │
│       │    │    single-path) │       │                              │
│       │    └─────────────────┘       │                              │
│       │                              │                              │
│       └──────────────────────────────┤                              │
│                                      ▼                              │
│                            ┌──────────────┐                         │
│                            │  API Calls   │                         │
│                            │  (TanStack   │                         │
│                            │   Query)     │                         │
│                            └──────┬───────┘                         │
│                                   │                                 │
│  PERSISTENCE (browser-only):      │                                 │
│  ┌─────────────────────────┐      │                                 │
│  │ localStorage            │      │                                 │
│  │ (auto-save via Zustand  │      │                                 │
│  │  persist middleware)    │      │                                 │
│  ├─────────────────────────┤      │                                 │
│  │ JSON export/import      │      │                                 │
│  │ (cross-device portable) │      │                                 │
│  ├─────────────────────────┤      │                                 │
│  │ URL params              │      │                                 │
│  │ (life stage, FIRE type, │      │                                 │
│  │  view state)            │      │                                 │
│  └─────────────────────────┘      │                                 │
└───────────────────────────────────┼─────────────────────────────────┘
                                    │
                          HTTP POST (JSON)
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI — stateless)                  │
│                                                                   │
│   POST /api/monte-carlo                                           │
│   ├─ Input: portfolio params, allocation, withdrawal strategy     │
│   ├─ Process: 10,000 simulations (NumPy vectorized, ~2-5 sec)    │
│   └─ Output: percentile bands, success rate, safe SWR             │
│                                                                   │
│   POST /api/backtest                                              │
│   ├─ Input: allocation, SWR, duration, dataset (US/SG/blend)     │
│   ├─ Process: rolling window over historical data                 │
│   └─ Output: per-year results, summary stats, heatmap data       │
│                                                                   │
│   POST /api/optimize-swr                                          │
│   ├─ Input: target success rate (e.g., 95%), portfolio params     │
│   ├─ Process: binary search over SWR values with MC inner loop    │
│   └─ Output: max SWR at target confidence                         │
│                                                                   │
│   POST /api/sequence-risk                                         │
│   ├─ Input: portfolio, strategies, crisis scenario name           │
│   ├─ Process: MC runs with crisis return sequences injected       │
│   └─ Output: normal vs crisis comparison, per-strategy impact     │
│                                                                   │
│   POST /api/export-excel                                          │
│   ├─ Input: full state from all stores (sent in request body)     │
│   └─ Output: .xlsx file download                                  │
│                                                                   │
│   ┌──────────────────┐                                            │
│   │  Upstash Redis   │  MC results cached by param hash.          │
│   │  (serverless)    │  TTL: 1 hour. Invalidated on param change. │
│   └──────────────────┘                                            │
│                                                                   │
│   No database. No user storage. No authentication.                │
└───────────────────────────────────────────────────────────────────┘
```

### Computation Split Rationale

| Calculation | Where | Why |
|-------------|-------|-----|
| FIRE Number, Coast FIRE, Barista | **Frontend** | Simple arithmetic, instant feedback |
| SG Tax (progressive) | **Frontend** | Lookup table, no heavy computation |
| CPF Contributions | **Frontend** | Rate table lookup, instant |
| Income Projections | **Frontend** | Year-by-year loop, <100 iterations |
| Portfolio Stats (return, vol) | **Frontend** | Matrix math on 8x8, fast |
| Withdrawal Strategies (deterministic) | **Frontend** | Single-path loop, instant |
| Glide Path interpolation | **Frontend** | Simple linear algebra |
| Property Analysis | **Frontend** | Port of Excel formulas |
| **Monte Carlo (10K sims)** | **Backend** | NumPy vectorized, ~2-5 sec, memory-intensive |
| **Historical Backtest** | **Backend** | Rolling window x multiple SWRs, ~1-3 sec |
| **SWR Optimization** | **Backend** | Requires MC inside loop |
| **Sequence Risk sims** | **Backend** | Multiple MC runs per scenario |
| **Portfolio Optimization** | **Backend** | scipy.optimize, Markowitz |
| **Excel Export** | **Backend** | openpyxl, file generation |

### Withdrawal Strategy Dual Implementation

Withdrawal strategies exist in **two** implementations:
1. **Frontend** (`lib/calculations/withdrawal.ts`) — deterministic single-path for instant comparison table
2. **Backend** (`core/withdrawal_strategies.py`) — called within MC simulation loop for stochastic analysis

These must produce identical results given identical inputs. To ensure parity:
- Both implementations derive from the same formulas in the master plan (Section 7)
- Backend tests include a "parity test" that runs each strategy with a fixed seed and compares output against hardcoded expected values
- Frontend tests use the same expected values
- Any formula change must update both implementations simultaneously

---

## 4. API SPECIFICATIONS

### POST /api/monte-carlo

**Request:**
```json
{
  "initial_portfolio": 2550000,
  "retirement_duration": 45,
  "accumulation_years": 0,
  "annual_savings": [84000, 86520],
  "post_retirement_income": [0, 0, 29604],
  "allocation_weights": [0.4, 0.1, 0.1, 0.2, 0.05, 0.05, 0.05, 0.05],
  "expected_returns": [0.102, 0.085, 0.08, 0.045, 0.08, 0.065, 0.02, 0.03],
  "std_devs": [0.155, 0.18, 0.16, 0.055, 0.185, 0.15, 0.01, 0.0],
  "correlation_matrix": [[1.0, 0.7], ["..."]],
  "withdrawal_strategy": "constant_dollar",
  "swr": 0.04,
  "strategy_params": {},
  "inflation": 0.025,
  "expense_ratio": 0.003,
  "method": "parametric",
  "n_simulations": 10000
}
```

**Response:**
```json
{
  "success_rate": 0.953,
  "percentile_bands": {
    "years": [0, 1, 2, 45],
    "p5":  [2550000, 2301000],
    "p10": [2550000, 2380000],
    "p25": [2550000, 2520000],
    "p50": [2550000, 2680000],
    "p75": [2550000, 2890000],
    "p90": [2550000, 3120000],
    "p95": [2550000, 3280000]
  },
  "terminal_stats": {
    "median": 1850000,
    "mean": 2340000,
    "p5": 0,
    "p95": 7200000,
    "worst": -120000,
    "best": 15000000
  },
  "safe_swr": {
    "at_95_pct": 0.037,
    "at_90_pct": 0.041,
    "at_85_pct": 0.044
  },
  "failure_distribution": {
    "by_year_10": 0.01,
    "by_year_20": 0.03,
    "by_year_30": 0.05,
    "median_failure_year": 38
  },
  "computation_time_ms": 2340
}
```

### POST /api/backtest

**Request:**
```json
{
  "initial_portfolio": 2550000,
  "allocation_weights": [0.6, 0.0, 0.0, 0.4, 0.0, 0.0, 0.0, 0.0],
  "withdrawal_strategy": "constant_dollar",
  "swr": 0.04,
  "retirement_duration": 30,
  "dataset": "us",
  "expense_ratio": 0.003,
  "inflation_adjusted": true,
  "generate_heatmap": true,
  "heatmap_swr_range": [0.03, 0.06, 0.005],
  "heatmap_duration_range": [15, 45, 5]
}
```

**Response:**
```json
{
  "summary": {
    "total_periods": 69,
    "successful": 66,
    "failed": 3,
    "success_rate": 0.9565,
    "worst_start_year": 1966,
    "best_start_year": 1932,
    "median_ending_balance": 3200000
  },
  "per_year_results": [
    {
      "start_year": 1926, "end_year": 1956, "survived": true,
      "ending_balance": 5400000, "min_balance": 1200000,
      "worst_year": 1931, "best_year": 1954, "total_withdrawn": 3800000
    }
  ],
  "heatmap": {
    "swr_values": [0.030, 0.035, 0.040, 0.045, 0.050, 0.055, 0.060],
    "duration_values": [15, 20, 25, 30, 35, 40, 45],
    "success_rates": [
      [1.00, 1.00, 1.00, 1.00, 1.00, 0.98, 0.95],
      [1.00, 1.00, 1.00, 0.98, 0.95, 0.91, 0.86]
    ]
  }
}
```

### POST /api/optimize-swr

**Request:**
```json
{
  "initial_portfolio": 2550000,
  "retirement_duration": 45,
  "allocation_weights": [0.4, 0.1, 0.1, 0.2, 0.05, 0.05, 0.05, 0.05],
  "expected_returns": [0.102, 0.085, 0.08, 0.045, 0.08, 0.065, 0.02, 0.03],
  "std_devs": [0.155, 0.18, 0.16, 0.055, 0.185, 0.15, 0.01, 0.0],
  "correlation_matrix": [[1.0, 0.7], ["..."]],
  "target_success_rates": [0.95, 0.90, 0.85],
  "method": "parametric",
  "n_simulations": 10000,
  "inflation": 0.025,
  "expense_ratio": 0.003,
  "swr_search_range": [0.02, 0.08],
  "tolerance": 0.001
}
```

**Response:**
```json
{
  "results": [
    { "target_success": 0.95, "max_swr": 0.037, "iterations": 12 },
    { "target_success": 0.90, "max_swr": 0.041, "iterations": 11 },
    { "target_success": 0.85, "max_swr": 0.044, "iterations": 10 }
  ],
  "computation_time_ms": 8200
}
```

### POST /api/sequence-risk

**Request:**
```json
{
  "initial_portfolio": 2550000,
  "withdrawal_strategies": ["constant_dollar", "vpw", "guardrails"],
  "swr": 0.04,
  "crisis": "gfc_2008",
  "retirement_duration": 30,
  "allocation_weights": [0.6, 0.0, 0.0, 0.4, 0.0, 0.0, 0.0, 0.0],
  "inflation": 0.025,
  "expense_ratio": 0.003
}
```

**Response:**
```json
{
  "crisis_name": "Global Financial Crisis (2008)",
  "crisis_returns": [-0.37, 0.26, 0.15, 0.02, 0.16],
  "normal_returns": [0.08, 0.08, 0.08, 0.08, 0.08],
  "per_strategy": {
    "constant_dollar": {
      "normal_success": 0.95,
      "crisis_success": 0.72,
      "degradation": -0.23,
      "year_by_year_normal": [],
      "year_by_year_crisis": []
    },
    "vpw": {},
    "guardrails": {}
  },
  "mitigation_impact": {
    "bond_tent": { "success_improvement": 0.06 },
    "cash_buffer_2yr": { "success_improvement": 0.04 },
    "flexible_spending": { "success_improvement": 0.12 }
  }
}
```

### POST /api/export-excel

**Request:**
```json
{
  "profile": { "...all profile store state..." },
  "income": { "...all income store state..." },
  "allocation": { "...all allocation store state..." },
  "simulation": { "...MC results if available..." },
  "withdrawal": { "...withdrawal store state..." },
  "property": { "...property store state..." },
  "derived": {
    "fire_number": 2550000,
    "years_to_fire": 12.3,
    "coast_fire": 850000,
    "income_projection": []
  }
}
```

**Response:** Binary `.xlsx` file download (`Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)

---

## 5. STATE MANAGEMENT

### Zustand Store Interfaces

```typescript
// stores/useProfileStore.ts
interface ProfileState {
  // Personal
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  lifeStage: 'pre-fire' | 'post-fire';
  maritalStatus: 'single' | 'married';
  dependents: number;

  // Financial
  annualIncome: number;
  annualExpenses: number;
  currentNetWorth: number;
  cpfOA: number;
  cpfSA: number;
  cpfMA: number;
  propertyEquity: number;
  srsBalance: number;
  otherIlliquid: number;

  // FIRE Targets
  fireType: 'lean' | 'regular' | 'fat' | 'barista' | 'coast';
  expenseAdjustment: number;
  healthcareBudget: number;
  swr: number;

  // Assumptions
  preRetReturn: number;
  postRetReturn: number;
  inflation: number;
  expenseRatio: number;
  portfolioStdDev: number;

  // CPF
  cpfOARate: number;
  cpfSARate: number;
  brs: number;
  brsGrowth: number;
  cpfLifeStartAge: number;
  srsAnnualContrib: number;

  // Validation
  validationErrors: Record<string, string>;

  // Actions
  setField: (field: string, value: unknown) => void;
  reset: () => void;
}

// stores/useIncomeStore.ts
interface IncomeState {
  salaryModel: 'simple' | 'realistic' | 'data-driven';
  currentSalary: number;
  simpleGrowthRate: number;
  realisticPhases: { ageRange: [number, number]; rate: number }[];
  promotionJumps: { age: number; increase: number }[];
  momEducation: string;
  momAdjustment: number;
  incomeStreams: IncomeStream[];
  lifeEventsEnabled: boolean;
  lifeEvents: LifeEvent[];
  personalReliefs: number;

  // Validation
  validationErrors: Record<string, string>;
}

// stores/useAllocationStore.ts
interface AllocationState {
  currentWeights: number[];       // 8 asset classes
  targetWeights: number[];        // retirement allocation
  glidePathEnabled: boolean;
  glidePathMethod: 'linear' | 'slow' | 'fast';
  glidePathStart: number;         // age to begin transition
  glidePathEnd: number;           // age to end transition
  returnOverrides: (number | null)[];  // null = use historical
  stdDevOverrides: (number | null)[];

  // Validation
  validationErrors: Record<string, string>;
}

// stores/useSimulationStore.ts
interface SimulationState {
  mcParams: MCParams;
  mcResults: MCResults | null;
  mcLoading: boolean;
  backtestParams: BacktestParams;
  backtestResults: BacktestResults | null;
  backtestLoading: boolean;
  sequenceRiskResults: SequenceRiskResults | null;

  // Validation
  validationErrors: Record<string, string>;
}

// stores/useWithdrawalStore.ts
interface WithdrawalState {
  selectedStrategies: string[];    // which strategies to compare
  constantDollar: { swr: number };
  vpw: { expectedRealReturn: number; targetEndValue: number };
  guardrails: { initialRate: number; ceiling: number; floor: number; adjustment: number };
  vanguardDynamic: { ceiling: number; floor: number };
  capeBased: { baseRate: number; capeWeight: number; currentCape: number };
  floorCeiling: { floor: number; ceiling: number; targetRate: number };
  minExpenses: number;
  desiredExpenses: number;

  // Validation
  validationErrors: Record<string, string>;
}

// stores/usePropertyStore.ts
interface PropertyState {
  propertyType: string;
  purchasePrice: number;
  leaseRemaining: number;
  appreciationRate: number;
  rentalYield: number;
  mortgageRate: number;
  ltv: number;
  // ... additional property-specific fields

  // Validation
  validationErrors: Record<string, string>;
}
```

### Dashboard: Derived Hooks (Not a Store)

The dashboard page owns no state. It computes views from the 6 base stores:

```typescript
// hooks/useDashboardMetrics.ts — reads from profile, income, allocation stores
// Returns: fireNumber, progress, yearsToFire, coastFire, baristaIncome,
//          savingsRate, incomeReplacementRatio, passiveIncomeAtRetirement

// hooks/useDashboardCharts.ts — reads from profile, income, simulation stores
// Returns: accumulationChartData, decumulationChartData, incomeTimelineData

// hooks/useRiskAssessment.ts — reads from profile, allocation, simulation stores
// Returns: sequenceRiskScore, inflationRisk, longevityRisk, currencyRisk,
//          healthcareRisk, concentrationRisk
```

### Data Persistence (Browser-Only)

```
1. localStorage (session persistence):
   - All 6 store states auto-saved on change via zustand/middleware persist
   - Restored on page load
   - No account required

2. JSON export/import (cross-device portability):
   - Download: serializes all 6 stores to a single JSON file
   - Upload: validates schema via Zod, merges into stores
   - This is how users move data between devices/browsers

3. URL params (shareable views):
   - Life stage, FIRE type, active page encoded in URL
   - Enables bookmarking specific views
   - Does NOT encode full state (that's what JSON export is for)
```

### Scenario Comparison (W7)

Scenario snapshots are a W7 feature. Design:
- A scenario is a serialized snapshot of all 6 stores at a point in time
- Stored in localStorage under a separate key (`fireplanner-scenarios`)
- Up to 5 named scenarios
- Side-by-side comparison renders two scenarios through the same derived hooks
- Not a store — a utility module in `lib/scenarios.ts`

---

## 6. UI/UX DESIGN

### Page Flow (Wizard + Free Navigation)

```
First-time users get a wizard flow:
  Start Here → Profile → Income → Allocation → [Run MC] → Dashboard

Returning users see Dashboard first with sidebar nav to any section.

Sidebar Navigation:
  ┌─────────────────────────┐
  │  Start Here              │
  │ ─────────────────────── │
  │ INPUTS                  │
  │   FIRE Profile          │
  │   Income Engine         │
  │   Asset Allocation      │
  │ ─────────────────────── │
  │ ANALYSIS                │
  │   Monte Carlo           │
  │   Withdrawal Strategies │
  │   Sequence Risk         │
  │   Historical Backtest   │
  │ ─────────────────────── │
  │ RESULTS                 │
  │   FIRE Dashboard        │
  │ ─────────────────────── │
  │ PROPERTY                │
  │   Property Analysis     │
  │ ─────────────────────── │
  │   Reference Guide       │
  │   Export                 │
  └─────────────────────────┘
```

### Key UI Patterns

1. **Live calculations:** Every input change instantly recalculates all client-side metrics. FIRE Number, Progress %, Years to FIRE update as you type. No "calculate" button for simple metrics.

2. **Explicit run for heavy computation:** Monte Carlo and Backtest require a manual "Run" button with progress indicator. Shows computation time on completion: "Completed in 2.3 seconds".

3. **Tooltips everywhere:** Every label has an (i) icon. Hover shows definition + formula. Example: "FIRE Number (i)" → "Your FIRE Number is the portfolio size needed to fund retirement. Formula: Annual Expenses / SWR"

4. **Smart defaults:** Pre-filled with Singapore defaults — age 30, $72K income (MOM degree median), $48K expenses, 2.5% inflation, Conservative template for Post-FIRE users.

5. **Progressive disclosure:** Basic mode shows essentials (age, income, expenses, net worth). Advanced toggles reveal income streams, life events, CPF details, correlation matrix, custom return overrides, fat-tail MC.

6. **Color coding convention:** Blue = user input, Black = formula/computed, Green = linked from another store/section.

7. **Comparison mode (W7):** Save current state as "Scenario A", modify inputs to auto-create "Scenario B", side-by-side panel. Up to 5 named scenarios.

8. **Mobile-first responsive:** Dashboard cards stack vertically on mobile. Charts resize with container. Sidebar becomes bottom nav on mobile.

---

## 7. BUILD PHASES

### Phase W1: Foundation + Profile (2-3 weeks)
- Project scaffolding (Vite + React + TypeScript + Tailwind + shadcn/ui)
- React Router v6 routing + sidebar layout
- Start Here wizard page
- FIRE Profile page (all 5 sections)
- Client-side FIRE calculations (`fire.ts`, `cpf.ts`, `tax.ts`)
- Zustand stores (profile, income) with localStorage persistence
- Validation schemas (Zod) for profile and income stores
- Unit tests for all `lib/calculations/` functions
- Responsive layout foundation

### Phase W2: Income Engine (1-2 weeks)
- Salary model selector (3 modes: Simple, Realistic, Data-Driven)
- 5 income stream configuration UI
- Life events toggle + configuration
- Income projection table (year-by-year) and chart
- MOM salary data embedded in `lib/data/momSalary.ts`
- Summary metrics panel
- Income store completion

### Phase W3: Asset Allocation (1-2 weeks)
- 8-class allocation builder (sliders + inputs, must sum to 100%)
- 6 pre-built templates + custom
- Portfolio statistics (Markowitz return/volatility/Sharpe in JS)
- D3 correlation matrix heatmap
- Glide path configuration + visualization
- Allocation pie chart
- Historical return data embedded

### Phase W4: Backend + Monte Carlo (2-3 weeks)
- FastAPI project setup with Pydantic schemas
- Monte Carlo engine (`monte_carlo.py`) — parametric, bootstrap, fat-tail
- `POST /api/monte-carlo` endpoint
- Historical data loaded from CSV (backend)
- Frontend MC controls + TanStack Query API integration
- Fan chart component (Recharts)
- Success rate gauge
- Scenario comparison (3 side-by-side MC runs)
- Loading/progress UI
- Upstash Redis caching for MC results
- Simulation store

### Phase W5: Withdrawal Strategies + Sequence Risk (2 weeks)
- 6 withdrawal strategy implementations (frontend JS — deterministic)
- Strategy selector + per-strategy parameter forms
- Comparison table (6 strategies x N years)
- Withdrawal chart overlay
- Strategy recommendation logic
- `POST /api/sequence-risk` endpoint
- Crisis scenario selector (8 pre-loaded crises)
- Stress test visualization
- Mitigation analysis panel
- Withdrawal store

### Phase W6: Historical Backtest (1-2 weeks)
- `POST /api/backtest` endpoint
- Rolling window results table
- Summary statistics panel
- SWR x Duration D3 heatmap
- SG vs US comparison
- Blended dataset option (configurable US/SG split)

### Phase W7: Dashboard + Property + Scenarios + Polish (2-3 weeks)
- FIRE Dashboard page with derived hooks (no store)
- Accumulation + decumulation fan charts
- Income timeline stacked area chart
- Risk dashboard (6 risk dimensions)
- Auto-generated action items
- Property analysis port (from Excel formulas — deterministic)
- Property hybrid MC overlay (property scenarios layered on MC results)
- Scenario comparison mode (save/name/compare up to 5 scenarios)
- Excel export (`POST /api/export-excel`)
- JSON export/import for cross-device portability
- Reference guide page
- Final responsive polish
- Error states + empty states

### Phase W8: Deploy + Production (1 week)
- Frontend → Vercel
- Backend → Railway or Fly.io
- Upstash Redis provisioned
- Environment variables + secrets management
- Sentry error monitoring
- PostHog analytics
- Performance optimization (code splitting, lazy loading, React.memo)
- SEO + meta tags

---

## 8. ESTIMATED TIMELINE

| Phase | Scope | Duration | Cumulative |
|-------|-------|----------|------------|
| W1 | Foundation + Profile | 2-3 weeks | 2-3 weeks |
| W2 | Income Engine | 1-2 weeks | 4-5 weeks |
| W3 | Asset Allocation | 1-2 weeks | 5-7 weeks |
| W4 | Backend + Monte Carlo | 2-3 weeks | 7-10 weeks |
| W5 | Withdrawal + Sequence Risk | 2 weeks | 9-12 weeks |
| W6 | Historical Backtest | 1-2 weeks | 10-14 weeks |
| W7 | Dashboard + Property + Scenarios + Polish | 2-3 weeks | 12-17 weeks |
| W8 | Deploy + Production | 1 week | 13-18 weeks |

**Total: ~13-18 weeks (3-4.5 months) for solo developer**

With AI-assisted development, estimate **8-12 weeks**.

---

## 9. KEY TECHNICAL DECISIONS

### Why Not All Client-Side?
Monte Carlo with 10,000 simulations x 50 years x 8 correlated assets:
- ~4 billion random number generations
- ~500MB memory at peak
- ~10-30 seconds in JavaScript (vs 2-5 sec in NumPy)
- Would freeze the browser UI

Backend with NumPy vectorization handles this in <5 seconds with no UI blocking.

### Why Not All Server-Side?
- Simple FIRE calculations should be instant (no network latency)
- Users expect real-time feedback as they type
- Reduces server load by 95% (most interactions are client-only)
- Works offline for basic calculations

### Why Browser-Only Storage?
- Financial data is sensitive — users shouldn't need to trust a third party
- No server costs for data storage
- No GDPR/PDPA compliance burden
- No authentication complexity
- JSON export provides cross-device portability without accounts
- Trade-off: no cloud sync, no sharing via URL with full state

### Why No Authentication?
- Removes an entire category of security concerns (password storage, session management, OAuth integration)
- Faster time to first value — users start immediately
- Privacy-first: the server never sees user financial data (only computation parameters)
- If users want to "save" their work, JSON export covers it

### Why Zustand Over Redux?
- 80% less boilerplate
- No action types, reducers, dispatch ceremony
- Built-in `persist` middleware handles localStorage seamlessly
- 6 stores is the right scale for Zustand
- DevTools support available via `zustand/devtools`

### Why FastAPI Over Express/Next.js API?
- Python has NumPy/SciPy — no equivalent in JS for vectorized MC
- FastAPI auto-generates OpenAPI docs from Pydantic models
- Async by default, handles concurrent simulation requests well
- Same language as the existing Excel Python scripts (easy port)

### Why Annual Simulation Steps Only?
- Historical return data is annual granularity
- Sub-annual rebalancing has minimal impact on long-term outcomes in practice
- Keeps simulation logic simple and fast
- Rebalancing frequency in the UI is informational, not simulated at sub-annual resolution

---

## 10. CONTEXT RESUMPTION PROMPT

```
CONTEXT RESUMPTION — SINGAPORE FIRE PLANNER WEB APP

I'm building a Singapore FIRE + Property Retirement Planner as a web app.

Tech Stack:
- Frontend: React 18.3 + TypeScript 5.7 + Vite 6 + Tailwind + shadcn/ui + Recharts + D3
- Backend: FastAPI 0.115 + Python 3.12 + NumPy + SciPy (Monte Carlo + Backtesting)
- State: 6 Zustand stores (no dashboard store — derived hooks)
- Persistence: Browser localStorage only (no database, no auth)
- Cache: Upstash Redis (MC result caching only)

Key files:
- CLAUDE.md — canonical implementation guide (start here)
- FIRE_WEBAPP_ARCHITECTURE.md — architecture detail, API schemas
- FIRE_PLANNER_MASTER_PLAN_v2.md — domain reference (formulas, SG rules, data)

PROJECT STATUS:
- Currently on: Phase W[X] — [Phase Name]
- Last completed: [describe]
- Next step: [describe]

Architecture:
- Client-side: FIRE calcs, tax, CPF, income projections, withdrawal strategies
  (deterministic), portfolio stats — all instant, no server call
- Server-side: Monte Carlo (10K sims), backtesting, SWR optimization,
  sequence risk, portfolio optimization, Excel export — all stateless POST
- No database, no user accounts, no server-side user data
- Singapore-only (SG tax, CPF, property rules)

Please read CLAUDE.md first, then continue from where we left off.
```
