# SINGAPORE FIRE + PROPERTY + INVESTMENT RETIREMENT PLANNER
## MASTER BUILD PLAN v2.0
**Date:** February 2026  
**Status:** Pre-Build — Plan Finalized

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Existing Model Summary](#2-existing-model-summary)
3. [Architecture — All Sheets](#3-architecture--all-sheets)
4. [Phase 1: Foundation](#4-phase-1-foundation)
5. [Phase 2: Asset Allocation + Portfolio Engine](#5-phase-2-asset-allocation--portfolio-engine)
6. [Phase 3: Monte Carlo Simulation](#6-phase-3-monte-carlo-simulation)
7. [Phase 4: Withdrawal Strategies + Sequence Risk](#7-phase-4-withdrawal-strategies--sequence-risk)
8. [Phase 5: Historical Backtesting](#8-phase-5-historical-backtesting)
9. [Phase 6: FIRE Dashboard + Onboarding + Integration](#9-phase-6-fire-dashboard--onboarding--integration)
10. [User Journeys](#10-user-journeys)
11. [Technical Specifications](#11-technical-specifications)
12. [Singapore-Specific Reference Data](#12-singapore-specific-reference-data)
13. [Python Code Architecture](#13-python-code-architecture)
14. [Build Progress Tracker](#14-build-progress-tracker)
15. [Context Resumption Prompt](#15-context-resumption-prompt)

---

## 1. PROJECT OVERVIEW

### Goal
Transform existing Singapore Property Leverage Optimizer (13 sheets) into a comprehensive FIRE + Property + Investment Retirement Planner that serves:
- **Pre-FIRE users** (still working, accumulation phase)
- **Post-FIRE users** (already retired/FIRE'd, decumulation phase)
- **Property investors** (evaluating leveraged property vs liquid portfolio)
- **HNW individuals** (complex multi-asset, multi-income planning)
- **Dual-income households** (combined planning with life events)

### Key Features to Add
1. FIRE calculation engine (FIRE number, years-to-FIRE, Coast FIRE, Barista FIRE)
2. Income growth modeling (3 salary models + 5 income streams + life events)
3. Monte Carlo simulation (10,000 sims via Python → percentile output to Excel)
4. Historical backtesting (Bengen-style rolling window, US + Singapore data)
5. 6 withdrawal strategies compared side-by-side
6. Sequence-of-returns risk stress testing
7. Dynamic withdrawal/exit strategy modeling
8. Asset allocation builder (8 classes + CPF integration + glide path)
9. Success rate metrics with color-coded confidence bands
10. Safe Withdrawal Rate (SWR) optimization
11. Guided onboarding wizard + comprehensive reference guide
12. Singapore tax engine (progressive personal income tax + CPF)
13. Healthcare cost modeling (MediSave, Integrated Shield Plans)
14. SRS (Supplementary Retirement Scheme) integration
15. Property exit scenario modeling (sell at year X → FIRE impact)

### Design Decisions (Confirmed)
| Decision | Choice |
|----------|--------|
| Target audience | Both HNW and broad Singapore, with guided pathways |
| Life stage | Toggle between Pre-FIRE and Post-FIRE modes |
| Monte Carlo | Python generates 10K sims → write percentile bands to Excel (+ formula-based 100-200 scenario option in-sheet) |
| Historical data | Full embedded: S&P 500 + US Bonds (1926-2024) + STI (1987-2024) + SG Property Index (1975-2024) |
| Withdrawal strategies | 6 comprehensive strategies compared side-by-side |
| Onboarding | Wizard (Start Here) + Reference Guide |
| Property MC | Hybrid: MC for liquid portfolio, stress scenarios for property |
| Asset allocation | 8 classes + CPF (OA 2.5%, SA 4%) with glide path support |
| Income growth | Full engine: 3 salary models, 5 income streams, optional life events |
| Currency | All values in SGD; USD-denominated assets converted at user-specified or historical FX |
| Fees | User-configurable investment expense ratio (default 0.3% p.a.) deducted from returns |
| Rebalancing | Annual rebalancing assumed (configurable: annual/semi-annual/quarterly) |
| Future | Planned webapp migration — all logic documented for transfer |

---

## 2. EXISTING MODEL SUMMARY

### Current Sheets (13 total + 1 Plan sheet)

**Sheet: Dashboard (ID: 1)**
- Property comparison table (20-year terminal values for 6 property types)
- Performance metrics: NW CAGR, NW vs No Property, Annualized ROE, Breakeven Year
- Lease decay analysis using Bala's Table (Starting Lease → Terminal Lease → Value Destroyed)
- Property ranking table (ranked by Total NW, with emoji flags)
- Risk assessment & decision matrix (Beats Benchmark? Lease Risk, Capital Intensity, ROE Rating)
- Visual analysis section with bar chart data
- Rows: 124, Cols: 19

**Sheet: Assumptions (ID: 2)**
- Investor profile: age 32, 30-year horizon, $13M net worth, CPF OA $150K
- Market rates: SORA-based mortgage (1.671% base, 3.5% stress, 5% severe)
- Leverage: 75% LTV, 30-year tenure, leverage multiple 4x
- 6 property types with individual assumptions:
  - HDB 1984 ($1.4M, 57yr lease, 2% appreciation, $4,500/mo imputed rent)
  - Condo 99LH ($2.5M, 93yr lease, 3% appreciation, $5,200/mo imputed rent)
  - FH Condo ($3.9M, freehold, 4% appreciation, $8,200/mo imputed rent)
  - HDB 2005 ($780K, 78yr lease, 3% appreciation, $4,500/mo imputed rent)
  - HDB 2015 ($1.4M, 88yr lease, 3% appreciation, same structure)
  - FH Landed Prime ($7M, freehold, 5% appreciation, $15,000/mo imputed rent)
- Transaction costs: BSD, ABSD (currently 0% for SC 1st property), legal, agent fee
- Benchmark: 60/40 portfolio at 5.5% CAGR, 9% std dev
- General inflation: 2.5%
- Rows: 55, Cols: 8

**Sheet: Sensitivity Analysis (ID: 12)**
- Property selector dropdown
- 3 two-way data tables: Terminal Property Equity, Total Net Worth, Property Advantage vs Liquid Portfolio
- Variables: Land Appreciation Rate × Mortgage Rate
- Rows: 38, Cols: 14

**Sheet: Scenario Tables (ID: 11)**
- Editable scenario tables for dropdown options
- Land appreciation rates by scenario (Pessimistic/Base/Optimistic/Custom) × property type
- Rows: 38, Cols: 9

**Sheet: Opportunity Cost (ID: 7)**
- Capital deployment summary per property type
- 20-year liquid portfolio growth (year-by-year for each property + no-property baseline)
- Terminal net worth comparison (liquid + property equity)
- Advanced metrics: ROE, leverage amplification, real NW CAGR, equity multiple
- Winner-by-metric analysis
- Rows: 54, Cols: 9

**Sheet: Bala Table (ID: 3)**
- Remaining lease → % of freehold value lookup (SLA Bala's Table)
- 99 rows (lease years 1-99)
- Lending restriction flags
- Rows: 101, Cols: 5

**Sheets: HDB 1984 (ID:4), HDB 2005 (ID:8), HDB 2015 (ID:9), Condo 99LH (ID:5), FH Condo (ID:6), FH Landed Prime (ID:10)**
Each is a 20-year leveraged property analysis with:
- Capital structure (purchase price, loan, downpayment, CPF, upfront costs)
- Year-by-year: lease remaining, Bala factor, market value, loan balance, equity
- Annual interest/principal split, rent/imputed rent, maintenance, property tax
- Net holding benefit, cumulative benefit, ROE, CPF accrued interest
- Real (inflation-adjusted) returns
- Summary metrics at bottom
- Rows: ~43, Cols: 19 each

**Sheet: Cash Flow Waterfall (ID: 13)**
- Property selector dropdown
- Year-by-year: mortgage payment, interest/principal split, gross rental, taxes/expenses, net rental CF, cumulative CF
- Market value, loan balance, net equity columns
- 20-year totals row
- Rows: 29, Cols: 22

**Sheet: Plan (ID: 14) — current plan text**
- Contains v1.0 of this master plan as plain text
- 912 rows, 1 column
- Will be replaced/updated with v2.0

---

## 3. ARCHITECTURE — ALL SHEETS

### New Sheets to Create (11 new)

| # | Sheet Name | Purpose | Phase |
|---|-----------|---------|-------|
| 1 | 🧭 Start Here | Guided wizard — life-stage toggle, quick-start pathways | Phase 1 |
| 2 | 👤 FIRE Profile | Core FIRE inputs: age, income, expenses, savings, FIRE number, CPF | Phase 1 |
| 3 | 💵 Income Engine | 3 salary models + 5 income streams + life events + MOM data | Phase 1 |
| 4 | 📜 Historical Data | Hidden: S&P500, bonds, STI, SG property, CPI, gold, REITs (1926-2024) | Phase 1 |
| 5 | 📊 Asset Allocation | 8-class builder + templates + correlation matrix + glide path | Phase 2 |
| 6 | 🎲 Monte Carlo | 10K sim results: percentile bands, success rates, fan chart data | Phase 3 |
| 7 | 💰 Withdrawal Strategies | 6 strategies compared side-by-side, year-by-year | Phase 4 |
| 8 | 📉 Sequence Risk | Historical crisis stress tests + sequence impact analysis | Phase 4 |
| 9 | 🔄 Historical Backtest | Bengen-style rolling window analysis, heat maps | Phase 5 |
| 10 | 🎯 FIRE Dashboard | Master results: FIRE progress, success rate, survival chart data | Phase 6 |
| 11 | 📖 Reference Guide | Explanations, glossary, how-to for every concept | Phase 6 |

### Existing Sheets to Modify (2)
- **Assumptions (ID:2):** Add FIRE inputs section, asset class parameters, life-stage toggle, fees, SRS
- **Dashboard (ID:1):** Integrate FIRE metrics alongside property comparison, add FIRE impact column

### Existing Sheets to Keep Unchanged (11)
Sensitivity Analysis (ID:12), Scenario Tables (ID:11), Opportunity Cost (ID:7), Bala Table (ID:3), HDB 1984 (ID:4), HDB 2005 (ID:8), HDB 2015 (ID:9), Condo 99LH (ID:5), FH Condo (ID:6), FH Landed Prime (ID:10), Cash Flow Waterfall (ID:13)

### Sheet Dependency Graph
```
Start Here ──→ FIRE Profile ──→ Income Engine
                    │                  │
                    ▼                  ▼
              Asset Allocation ◄── Historical Data
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
    Monte Carlo  Withdrawal  Historical
                 Strategies   Backtest
          │         │         │
          ▼         ▼         ▼
    Sequence Risk ◄─┘         │
          │                   │
          ▼                   │
    FIRE Dashboard ◄──────────┘
          │
          ▼
    Existing Dashboard (modified)
    Existing Property Sheets (linked)
```

---

## 4. PHASE 1: FOUNDATION

### 4A. 🧭 Start Here (Guided Wizard)

**Layout:**
```
Row 1-3:   Title: "SINGAPORE FIRE + PROPERTY RETIREMENT PLANNER"
           Subtitle: "Your complete financial independence planning tool"

Row 5-7:   STEP 1 — What best describes you?
           Dropdown cell [C6]: [Pre-FIRE (still working)] / [Post-FIRE (retired)] / [Property Investor]

Row 9-12:  STEP 2 — Quick profile (conditional display based on Step 1)
           Pre-FIRE fields:  Current age [C9], Annual income [C10], Annual expenses [C11], Current savings [C12]
           Post-FIRE fields: Current age [C9], Portfolio size [C10], Annual spending [C11], Retirement length [C12]
           Property fields:  Current age [C9], Net worth [C10], Property type [C11]

Row 14-16: STEP 3 — What do you want to know?
           Dropdown cell [C15]: [FIRE number & timeline] / [Safe withdrawal rate] / [Monte Carlo survival] /
                                [Property comparison] / [Full analysis — all of the above]

Row 18-22: NAVIGATION PANEL
           Row 19: "→ FIRE Profile" (HYPERLINK)    "→ Income Engine" (HYPERLINK)
           Row 20: "→ Asset Allocation" (HYPERLINK) "→ Monte Carlo" (HYPERLINK)
           Row 21: "→ Withdrawal Strategies"        "→ FIRE Dashboard"
           Row 22: "→ Property Analysis (existing)" "→ Reference Guide"

Row 24-35: QUICK RESULTS PREVIEW (3-4 key metrics pulled from downstream)
           FIRE Number: =$FIRE_Number (from FIRE Profile)
           Years to FIRE: =$FIRE_YearsToFIRE (from FIRE Profile)
           MC Success Rate: =$MC_SuccessRate (from Monte Carlo, blank until MC runs)
           Recommended SWR: =$MC_SafeSWR (from Monte Carlo, blank until MC runs)
```

**Key Formulas:**
- Conditional display: `=IF($C$6="Pre-FIRE","Current Age:",IF($C$6="Post-FIRE","Current Age:","Current Age:"))`
- Navigation: `=HYPERLINK("#'FIRE Profile'!A1","→ Go to FIRE Profile")`
- Quick results: `=IFERROR('FIRE Profile'!C34,"— Complete FIRE Profile first —")`

**Data Validation:**
- C6: List validation → "Pre-FIRE (still working),Post-FIRE (retired),Property Investor"
- C15: List validation → "FIRE number & timeline,Safe withdrawal rate,Monte Carlo survival,Property comparison,Full analysis"

---

### 4B. 👤 FIRE Profile

**SECTION 1: PERSONAL PROFILE (Rows 1-14)**
```
Row 1:  Title: "FIRE PROFILE — Core Financial Independence Inputs"
Row 3:  PERSONAL PROFILE
Row 4:  Current Age                    [C4: 32]        ← =Assumptions!C4 (green, linked)
Row 5:  Target Retirement Age          [C5: 45]        ← user input (blue)
Row 6:  Life Expectancy                [C6: 90]        ← user input (blue), default 90
Row 7:  Retirement Duration (calc)     [C7: =C6-C5]    ← formula (black)
Row 8:  Years to Retirement            [C8: =C5-C4]    ← formula (black)
Row 9:  Life Stage                     [C9: Pre-FIRE]  ← dropdown, links to Start Here
Row 10: Country                        [C10: Singapore] ← fixed (Singapore only; multi-country is a future extension)
Row 11: Tax Residency                  [C11: SG Tax Resident] ← dropdown
Row 12: Marital Status                 [C12: Single]   ← dropdown (Single/Married)
Row 13: Number of Dependents           [C13: 0]        ← user input (blue)
Row 14: (blank separator)
```

**SECTION 2: CURRENT FINANCIAL POSITION (Rows 15-32)**
```
Row 15: CURRENT FINANCIAL POSITION
Row 16: Annual Gross Income            [C16]       ← =Income_TotalGross (green, from Income Engine)
Row 17: Annual Expenses                [C17]       ← user input (blue)
Row 18: Annual Savings                 [C18: =C16-C17]  ← formula (black)
Row 19: Savings Rate                   [C19: =C18/C16]  ← formula (black)
Row 20: (blank)
Row 21: Current Net Worth              [C21: 13000000]  ← =Assumptions!C7 (green, linked)
Row 22: Current Liquid Portfolio       [C22: =C21-C27-C28-C29] ← formula
Row 23: CPF Balances:
Row 24:   Ordinary Account (OA)        [C24: 150000]    ← =Assumptions!C8 (green, linked)
Row 25:   Special Account (SA)         [C25: ___]       ← user input (blue)
Row 26:   MediSave Account (MA)        [C26: ___]       ← user input (blue)
Row 27:   Total CPF                    [C27: =SUM(C24:C26)] ← formula
Row 28: Property Equity (if any)       [C28]       ← linked from property sheets or user input
Row 29: SRS Balance                    [C29: 0]    ← user input (blue)
Row 30: Other Illiquid Assets          [C30: 0]    ← user input (blue)
Row 31: Total Assets                   [C31: =C22+C27+C28+C29+C30] ← formula
Row 32: (blank separator)
```

**SECTION 3: FIRE TARGETS (Rows 33-48)**
```
Row 33: FIRE TARGETS
Row 34: FIRE Type                      [C34: Regular FIRE] ← dropdown: Lean/Regular/Fat/Barista/Coast
Row 35: Annual Expenses in Retirement  [C35]       ← user input or =C17*adjustment_factor
Row 36: Expense Adjustment Factor      [C36: 100%] ← user input (blue), default 100%
Row 37: Healthcare Cost Estimate       [C37: 6000] ← user input (blue), annual, default $6K
Row 38: Total Retirement Expenses      [C38: =C35+C37] ← formula
Row 39: Safe Withdrawal Rate (SWR)     [C39: 4.0%] ← user input (blue), default 4%
Row 40: FIRE Number                    [C40: =C38/C39] ← formula
Row 41: Current Progress               [C41: =C21/C40] ← formula (%)
Row 42: Years to FIRE (simple calc)    [C42: see formula below] ← formula
Row 43: FIRE Date (estimated)          [C43: =DATE(YEAR(TODAY())+C42,1,1)] ← formula
Row 44: Coast FIRE Number              [C44: =C40/(1+C49)^(C5-C4)] ← formula
Row 45: Coast FIRE Status              [C45: =IF(C21>=C44,"✅ Achieved!","❌ Not yet")] ← formula
Row 46: Barista FIRE Income Needed     [C46: =MAX(0,C38-(C22*C39))] ← formula
Row 47: Lean FIRE Number               [C47: =(C38*0.6)/C39] ← 60% of full expenses
Row 48: Fat FIRE Number                [C48: =(C38*1.5)/C39] ← 150% of full expenses
```

**SECTION 4: KEY ASSUMPTIONS (Rows 49-60)**
```
Row 49: KEY ASSUMPTIONS
Row 50: Pre-Retirement Portfolio Return [C50: 5.5%]     ← =Asset_Allocation expected return (green)
Row 51: Post-Retirement Portfolio Return[C51: 4.5%]     ← =Asset_Allocation post-ret return (green)
Row 52: Inflation Rate                  [C52: 2.5%]     ← =Assumptions!C43 (green)
Row 53: Real Return (pre-ret)           [C53: =(1+C50)/(1+C52)-1] ← formula
Row 54: Real Return (post-ret)          [C54: =(1+C51)/(1+C52)-1] ← formula
Row 55: Portfolio Volatility            [C55: 9%]       ← =Asset_Allocation portfolio std dev (green)
Row 56: Investment Expense Ratio        [C56: 0.3%]     ← user input (blue), annual fees
Row 57: Net Return (pre-ret)            [C57: =C50-C56] ← formula
Row 58: Net Return (post-ret)           [C58: =C51-C56] ← formula
Row 59: Rebalancing Frequency           [C59: Annual]   ← dropdown (Annual/Semi-Annual/Quarterly). Note: all simulations (MC, backtest) use annual steps regardless of this setting. Sub-annual options are informational only.
Row 60: (blank separator)
```

**SECTION 5: CPF PROJECTIONS (Rows 61-78)**
```
Row 61: CPF PROJECTIONS
Row 62: CPF OA Interest Rate            [C62: 2.5%]    ← =Assumptions!C9 (green)
Row 63: CPF SA Interest Rate            [C63: 4.0%]    ← user input (blue)
Row 64: CPF MA Interest Rate            [C64: 4.0%]    ← user input (blue)
Row 65: CPF Extra Interest (first $60K) [C65: 1.0%]    ← hardcoded SG rule
Row 66: BRS (current year)              [C66: 106500]   ← user input (blue), updated annually
Row 67: FRS (current year)              [C67: 213000]   ← =C66*2
Row 68: ERS (current year)              [C68: 426000]   ← =C66*4 (approximate)
Row 69: BRS Growth Rate                 [C69: 3.5%]    ← historical ~3.5% p.a. increase
Row 70: BRS at Age 55 (projected)       [C70: =C66*(1+C69)^MAX(0,55-C4)] ← formula
Row 71: FRS at Age 55 (projected)       [C71: =C70*2]
Row 72: CPF LIFE Monthly (Basic Plan)   [C72: estimate] ← formula based on FRS
Row 73: CPF LIFE Monthly (Standard)     [C73: estimate] ← formula based on FRS
Row 74: CPF LIFE Start Age              [C74: 65]       ← user input (blue)
Row 75: CPF LIFE Annual Payout          [C75: =C73*12]  ← formula
Row 76: (blank)
Row 77: SRS Annual Contribution         [C77: 15300]    ← user input (blue), max $15,300 for SG citizens
Row 78: SRS Tax Relief Rate             [C78: 50%]      ← 50% of SRS withdrawals taxed at retirement
```

**Key Formulas:**
```
FIRE Number:
  =C38/C39

Years to FIRE (using NPER with net real return):
  =NPER((1+C57)/(1+C52)-1, -C18, -C21, C40, 0)
  Note: If result is negative (already at FIRE), show 0

Coast FIRE:
  =C40 / (1+C57)^(C5-C4)

Progress %:
  =C21/C40

Barista FIRE Income:
  =MAX(0, C38 - (C22 * C39))

CPF LIFE Estimate (rough):
  Basic Plan: =(FRS_at_55 * 0.054) / 12   (approximate 5.4% payout rate)
  Standard:   =(FRS_at_55 * 0.063) / 12   (approximate 6.3% payout rate)
```

**Data Validation Rules:**
- C5 (Retirement Age): Integer, 30-80, must be > C4
- C6 (Life Expectancy): Integer, 60-110, must be > C5
- C34 (FIRE Type): List → "Lean FIRE,Regular FIRE,Fat FIRE,Barista FIRE,Coast FIRE"
- C39 (SWR): Decimal 0.01-0.10, default 0.04
- C56 (Expense Ratio): Decimal 0.00-0.03
- C59 (Rebalancing): List → "Annual,Semi-Annual,Quarterly"

---

### 4C. 💵 Income Engine

**Section A: Salary Progression Model (Rows 1-45)**

```
Row 1:  Title: "INCOME ENGINE — Salary + Income Stream Projections"
Row 3:  SALARY PROGRESSION MODEL
Row 4:  Model Selector:               [C4: Realistic] ← dropdown: Simple/Realistic/Data-Driven
```

**Simple Model (visible when C4 = "Simple"):**
```
Row 6:  Current Annual Gross Salary    [C6: ___]     ← user input (blue)
Row 7:  Annual Growth Rate             [C7: 3%]      ← user input (blue)
Row 8:  Salary at Retirement (calc)    [C8: =C6*(1+C7)^('FIRE Profile'!C8)] ← formula
```

**Realistic Model (visible when C4 = "Realistic"):**
```
Row 10: Current Annual Gross Salary    [C10: ___]    ← user input (blue)
Row 11: Career Phase Growth Rates:
Row 12:   Early Career (22-30)         [C12: 8%]     ← user input (blue)
Row 13:   Mid Career (30-40)           [C13: 5%]     ← user input (blue)
Row 14:   Peak Earning (40-50)         [C14: 3%]     ← user input (blue)
Row 15:   Plateau (50-60)              [C15: 1%]     ← user input (blue)
Row 16:   Pre-Retirement (60-65)       [C16: -2%]    ← user input (blue)
Row 17: Promotion Jumps (up to 3):
Row 18:   Jump 1: Age [C18: __]  Increase [D18: __%]
Row 19:   Jump 2: Age [C19: __]  Increase [D19: __%]
Row 20:   Jump 3: Age [C20: __]  Increase [D20: __%]
```

**Realistic Model — Salary Calculation Logic (pseudo-formula):**
```
For each year from current_age to retirement_age:
  base_growth = VLOOKUP(age, career_phase_table, growth_rate)
  salary(year) = salary(year-1) * (1 + base_growth)
  IF age matches promotion_age_1: salary *= (1 + promotion_pct_1)
  IF age matches promotion_age_2: salary *= (1 + promotion_pct_2)
  IF age matches promotion_age_3: salary *= (1 + promotion_pct_3)
  IF life_events_ON AND event overlaps this age: salary *= event_income_impact
```

**Data-Driven Model (visible when C4 = "Data-Driven"):**
```
Row 22: Education Level               [C22: Degree]  ← dropdown
Row 23: Industry (optional)           [C23: All]     ← dropdown
Row 24: Adjustment Factor             [C24: 100%]    ← user multiplier vs MOM median
Row 25: (Auto-fills salary curve from MOM data in Historical Data sheet)
```

**MOM Salary Benchmark Data (to be embedded in Historical Data sheet):**
Source: Singapore MOM Labour Force Survey (Table 7B — Median Gross Monthly Income)
```
Age Group | Below Sec | Secondary | Post-Sec | Diploma  | Degree
20-24     |   $20,280 |   $22,620 | $24,960  | $28,080  | $42,000
25-29     |   $24,960 |   $28,080 | $32,760  | $36,960  | $57,000
30-34     |   $28,080 |   $33,540 | $39,000  | $45,240  | $72,000
35-39     |   $30,420 |   $37,440 | $43,680  | $50,700  | $85,800
40-44     |   $31,200 |   $39,000 | $46,800  | $54,600  | $97,500
45-49     |   $30,420 |   $39,000 | $46,020  | $54,600  | $102,000
50-54     |   $28,860 |   $36,660 | $43,680  | $50,700  | $97,500
55-59     |   $24,180 |   $31,200 | $37,440  | $42,900  | $84,000
60-64     |   $18,720 |   $24,180 | $28,860  | $33,540  | $63,000
```
Note: Values are approximate annual median figures. To be sourced/verified from latest MOM data during build.

---

**Section B: Multiple Income Streams (Rows 46-65)**
```
Row 46: INCOME STREAMS (Up to 5)
Row 47: Headers: Stream | Name | Type | Annual Amt | Growth Model | Growth % | Start Age | End Age | Tax Treatment | Active?

Row 48: Stream 1 | Primary Salary   | Employment  | [linked to model] | [per model above] | [linked] | [current age] | [retirement age] | Taxable          | Y
Row 49: Stream 2 | Rental Income    | Rental      | [___]             | Fixed %           | [2%]     | [___]         | [___]            | Taxable          | N
Row 50: Stream 3 | Dividend/Interest| Investment  | [___]             | Portfolio-linked  | [___]    | [now]         | [life exp]       | Tax-exempt (SG)  | N
Row 51: Stream 4 | Side Hustle      | Business    | [___]             | Fixed %           | [___]    | [___]         | [___]            | Taxable          | N
Row 52: Stream 5 | CPF LIFE Payout  | Government  | [___]             | None (fixed nom.) | 0%       | [65]          | [life exp]       | Tax-exempt       | N
```

**Income Stream Type Dropdown Options:**
Employment, Rental, Investment (Dividends/Interest), Business, Government (CPF/Pension), Freelance, Other

**Growth Model Dropdown Options:**
Fixed % (constant annual growth), Inflation-linked (grows with CPI), Step (manual year-by-year), Age-Curve (linked to salary model), Portfolio-linked (% of portfolio value), None (flat nominal)

**Tax Treatment Dropdown Options:**
Taxable (SG progressive), Tax-exempt, CPF (not taxable), SRS (50% taxable at withdrawal), Foreign-sourced (check treaty)

**Pre-configured Templates (dropdown at row 45):**
```
Template                    | Streams Active
Single income, no property  | Stream 1 only
Dual income couple          | Stream 1 + Stream 2 (both Employment type)
Income + rental             | Stream 1 + Stream 2 (Rental type)
Semi-retired                | Stream 1 (part-time) + Stream 3 (dividends) + Stream 5 (CPF)
Fully retired               | Stream 3 (dividends) + Stream 5 (CPF) only
```

---

**Section C: Life Events (Rows 66-82)**
```
Row 66: LIFE EVENTS (Optional)
Row 67: Toggle:                        [C67: OFF]    ← dropdown: OFF/ON

Row 69: Headers: Event | Name | Start Age | End Age | Income Impact | Affected Streams | Savings Impact | CPF Impact
Row 70: Event 1 | [___] | [___] | [___] | [___%] | [1,2,3,4,5] | [Pause/Continue] | [Pause/Continue]
Row 71: Event 2 | [___] | [___] | [___] | [___%] | [1,2,3,4,5] | [Pause/Continue] | [Pause/Continue]
Row 72: Event 3 | [___] | [___] | [___] | [___%] | [1,2,3,4,5] | [Pause/Continue] | [Pause/Continue]
Row 73: Event 4 | [___] | [___] | [___] | [___%] | [1,2,3,4,5] | [Pause/Continue] | [Pause/Continue]
```

**Pre-loaded Life Event Templates (dropdown at row 68):**
```
Template                     | Start Age | End Age | Impact | Streams | CPF
Standard career (no events)  | —         | —       | —      | —       | —
Career break at 35           | 35        | 36      | 0%     | 1       | Pause
Part-time 40-45              | 40        | 45      | 50%    | 1       | Continue (reduced)
Retrenchment at 50           | 50        | 50.5    | 0%     | 1       | Pause
                             | 50.5      | retirement| 80%  | 1       | Continue
Childcare break              | 32        | 35      | 0%     | 1       | Pause
Property exit at year X      | [user]    | [user]  | N/A    | 2       | N/A
```

---

**Section D: Singapore Tax Calculation (Rows 83-100)**

**SG Personal Income Tax Rates (YA 2024+):**
```
Chargeable Income ($)   | Rate  | Cumulative Tax ($)
First $20,000           | 0%    | $0
Next $10,000            | 2%    | $200
Next $10,000            | 3.5%  | $550
Next $40,000            | 7%    | $3,350
Next $40,000            | 11.5% | $7,950
Next $40,000            | 15%   | $13,950
Next $40,000            | 18%   | $21,150
Next $40,000            | 19%   | $28,750
Next $40,000            | 19.5% | $36,550
Next $40,000            | 20%   | $44,550
Next $40,000            | 22%   | $53,350
Next $60,000            | 23%   | $67,150
Next $40,000            | 24%   | $76,750
Above $500,000 to $1M   | 23%   | (see above)
Above $1,000,000        | 24%   | $76,750 + 24% on excess over $1M
(Note: Non-resident flat 22% or progressive, whichever is higher)
(Note: Brackets above $320K updated for YA 2024. Verify against IRAS annually.)
```

**Tax Calculation Formula (embedded in Income Engine):**
```
For each year:
  Total Taxable Income = SUM(streams where tax_treatment = "Taxable") - CPF_employee_contribution - SRS_contribution
  Apply personal reliefs: Earned Income Relief, CPF Relief, NSman Relief, etc.
  Chargeable Income = Taxable Income - Total Reliefs
  Tax = progressive_tax_lookup(Chargeable_Income)
  Effective Tax Rate = Tax / Total_Taxable_Income
```

**Tax Relief Estimates (simplified, user-adjustable):**
```
Row 85: Total Personal Reliefs         [C85: 20000]  ← user input (blue), estimated total
Row 86: CPF Employee Contribution      [C86: auto]   ← calculated from salary × employee rate
Row 87: SRS Contribution               [C87: auto]   ← from FIRE Profile!C77
Row 88: Chargeable Income              [C88: formula] ← Taxable Income - Reliefs - CPF - SRS
Row 89: Estimated Annual Tax           [C89: formula] ← progressive lookup
Row 90: Effective Tax Rate             [C90: =C89/C16] ← formula
```

---

**Section E: CPF Contribution Logic (Rows 101-115)**

**CPF Contribution Rates (2024, to be updated):**
```
Age Group     | Employee | Employer | Total  | OA     | SA    | MA
Up to 55      | 20%      | 17%      | 37%    | 23%    | 6%    | 8%
55-60         | 15%      | 14.5%    | 29.5%  | 11.5%  | 4.5%  | 13.5%
60-65         | 9.5%     | 11%      | 20.5%  | 3.5%   | 3%    | 14%
65-70         | 7.5%     | 8.5%     | 16%    | 1%     | 1%    | 14%
Above 70      | 5%       | 7.5%     | 12.5%  | 1%     | 1%    | 10.5%
```

**CPF Caps:**
```
Ordinary Wage Ceiling:    $6,800/month ($81,600/year)
Additional Wage Ceiling:  $102,000 - (OW × months worked in year)
```

**CPF Calculation Formula:**
```
For each year:
  OW_contribution = MIN(annual_salary, 81600) × total_rate_for_age
  AW_contribution = MIN(bonus, AW_ceiling) × total_rate_for_age
  Total_CPF = OW_contribution + AW_contribution

  OA_addition = Total_CPF × (OA_rate / total_rate)
  SA_addition = Total_CPF × (SA_rate / total_rate)
  MA_addition = Total_CPF × (MA_rate / total_rate)

  OA_balance = prior_OA × (1 + OA_interest) + OA_addition
  SA_balance = prior_SA × (1 + SA_interest) + SA_addition
  MA_balance = MIN(prior_MA × (1 + MA_interest) + MA_addition, BHS_limit)
  
  Extra interest on first $60K (across OA+SA+MA, with up to $20K from OA):
  extra_interest_amount = calc based on CPF rules
```

---

**Section F: Summary Output Table (Rows 116-180+)**

Year-by-year projection from current age to life expectancy:
```
Year | Age | Salary | Rental | Dividends | Side Inc | CPF Payout | TOTAL GROSS | SG Tax | CPF Contrib | TOTAL NET | Savings | Cumul Savings | CPF OA | CPF SA | CPF MA
(one row per year, ~60 rows for age 25 to 85)
```

**Summary Metrics (below table):**
```
Peak earning age and amount
Lifetime earnings (nominal & real)
Average savings rate over career
Total CPF contributions (employer + employee) over career
Income replacement ratio at retirement: (passive income ÷ pre-retirement expenses)
Years of expenses covered by CPF LIFE (from age 65 to life expectancy)
```

**Section G: Downstream Connections**
```
Income Engine outputs feed to:
  → FIRE Profile: Total annual savings → time-to-FIRE calculation
  → Asset Allocation: Annual investment amount → portfolio growth projections
  → Monte Carlo: Year-by-year savings contributions during accumulation phase
  → Withdrawal Strategies: Post-retirement income streams reduce required withdrawals
  → FIRE Dashboard: Income replacement ratio, years-to-FIRE, savings trajectory
  → Existing Property Sheets: Rental income auto-links to property cash flows
  → CPF projections: Employment income drives CPF OA/SA/MA contributions automatically
```

---

### 4D. 📜 Historical Data (Hidden Sheet)

**Data Columns (A through M):**
```
A: Year (1926-2024) — ~99 rows
B: S&P 500 Total Return (%) — includes dividends, 1926-2024
C: US 10-Year Treasury Return (%) — 1926-2024
D: US Intermediate Bonds Return (%) — 1926-2024
E: US CPI Inflation (%) — 1926-2024
F: STI Total Return (%) — 1987-2024, blank before
G: Singapore 3-Month T-Bill Rate (%) — proxy for SG bonds, 1987-2024
H: SG Private Property Price Index Change (%) — URA index, 1975-2024
I: SG CPI Inflation (%) — 1961-2024
J: Gold Return (%) — 1971-2024
K: Global REITs Return (%) — FTSE NAREIT, 1990-2024
L: MSCI World ex-US Return (%) — 1970-2024
M: USD/SGD Exchange Rate Change (%) — for currency-adjusted returns
```

**Summary Statistics Block (below data, ~row 105-115):**
```
For each column: Mean, Median, Std Dev, Min, Max, Skewness, Kurtosis
Geometric Mean (compound annual return) — critical for long-term projections
```

**Correlation Matrix (below summary stats, ~row 120-135):**
```
12×12 correlation matrix of all asset class returns
Calculated from overlapping years only (e.g., STI × S&P uses 1987-2024 overlap)
```

**MOM Salary Data Block (below correlation, ~row 140-160):**
```
MOM Labour Force Survey data table (as specified in Section 4C)
Age Group × Education Level → Annual Median Income
```

**Data Sources (documented in sheet):**
```
S&P 500 + US Bonds + US CPI: Aswath Damodaran (NYU) historical returns dataset
  URL: https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histretSP.html
STI Returns: SGX / Yahoo Finance historical data
SG Property Index: URA Private Residential Property Price Index
  URL: https://www.ura.gov.sg/reis/dataSeries
SG CPI: Singapore Department of Statistics (SingStat)
  URL: https://tablebuilder.singstat.gov.sg
Gold: World Gold Council / LBMA
Global REITs: FTSE NAREIT All Equity REITs Index
MSCI World ex-US: MSCI Index factsheets
MOM Salary: Ministry of Manpower Labour Force Survey
  URL: https://stats.mom.gov.sg
```

**Sheet Properties:**
- Protection: Very Hidden (not visible in sheet tabs, accessible only via VBA/Python)
- All cells locked except none (no user editing)

---

## 5. PHASE 2: ASSET ALLOCATION + PORTFOLIO ENGINE

### 📊 Asset Allocation Sheet

**Section A: Allocation Builder (Rows 1-20)**
```
Row 1:  Title: "ASSET ALLOCATION — Portfolio Construction & Analysis"
Row 3:  Template Selector:             [C3: Custom]   ← dropdown
Row 4:  (blank)
Row 5:  Headers:
        Asset Class          | Current % | Target % (Retirement) | Expected Return | Std Dev | Sharpe | Min % | Max %

Row 6:  US Equities (S&P500) | [40%]     | [30%]                | [10.2%]         | [15.5%] | [auto] | [0%]  | [100%]
Row 7:  SG Equities (STI)    | [10%]     | [10%]                | [8.5%]          | [18.0%] | [auto] | [0%]  | [100%]
Row 8:  Intl Equities (MSCI) | [10%]     | [5%]                 | [8.0%]          | [16.0%] | [auto] | [0%]  | [100%]
Row 9:  Bonds (Aggregate)    | [20%]     | [35%]                | [4.5%]          | [5.5%]  | [auto] | [0%]  | [100%]
Row 10: REITs                | [5%]      | [5%]                 | [8.0%]          | [18.5%] | [auto] | [0%]  | [100%]
Row 11: Gold                 | [5%]      | [5%]                 | [6.5%]          | [15.0%] | [auto] | [0%]  | [100%]
Row 12: Cash                 | [5%]      | [5%]                 | [2.0%]          | [1.0%]  | [auto] | [0%]  | [100%]
Row 13: CPF (OA+SA blend)    | [5%]      | [5%]                 | [3.0%]          | [0.0%]  | [auto] | [0%]  | [100%]
Row 14: TOTAL                | 100%      | 100%                 | [wtd avg]       | [port]  | [auto] | —     | —
Row 15: Validation           | =IF(SUM≠100%,"⚠️ Must sum to 100%","✅")
```

Note: Expected returns and std devs auto-populated from Historical Data sheet (geometric mean and std dev). User can override (blue cells). Sharpe = (Return - Risk_Free) / Std_Dev.

**Section B: Pre-Built Templates (Rows 17-28)**
```
Row 17: PRE-BUILT TEMPLATES (selecting one auto-fills Section A)
Row 18: Headers: Template | US Eq | SG Eq | Intl | Bonds | REITs | Gold | Cash | CPF

Row 19: Conservative (30/70)  |  15% |   5% |  5% |  45% |   5% |  5% | 15% |  5%
Row 20: Balanced (60/40)      |  30% |  10% | 10% |  25% |   5% |  5% | 10% |  5%
Row 21: Aggressive (80/20)    |  45% |  15% | 15% |  10% |   5% |  5% |  0% |  5%
Row 22: All-Weather           |  30% |   0% |  0% |  40% |   0% | 15% | 15% |  0%
Row 23: Singapore-Centric     |  15% |  25% | 10% |  20% |  10% |  5% | 10% |  5%
Row 24: CPF-Heavy             |  20% |  10% |  5% |  15% |   5% |  5% |  5% | 35%
Row 25: Risk Parity           |  15% |   5% |  5% |  35% |   5% | 15% | 15% |  5%
Row 26: Max Sharpe (calc)     | [auto-optimized from historical data — Python]
```

**Section C: Glide Path Configuration (Rows 30-50)**
```
Row 30: GLIDE PATH
Row 31: Glide Path Toggle:             [C31: OFF]     ← dropdown: OFF/ON
Row 32: Transition Method:             [C32: Linear]  ← dropdown: Linear/Slow Start/Fast Start
Row 33: Transition Start Age:          [C33: auto]    ← =retirement_age - 5 (default: 5 years before)
Row 34: Transition End Age:            [C34: auto]    ← =retirement_age + 10 (default: 10 years after)
Row 35: Transition Period:             [C35: =C34-C33] years

Row 37: Year-by-year allocation table (auto-generated when glide path ON):
        Year | Age | US Eq | SG Eq | Intl | Bonds | REITs | Gold | Cash | CPF
        (interpolated from Current % → Target % over transition period)
```

**Glide Path Interpolation Methods:**
```
Linear:     allocation(year) = current + (target - current) × (year / transition_years)
Slow Start: allocation(year) = current + (target - current) × (year / transition_years)^2
Fast Start: allocation(year) = current + (target - current) × sqrt(year / transition_years)
```

**Section D: Portfolio Statistics (Rows 52-68)**
```
Row 52: PORTFOLIO STATISTICS (auto-calculated)
Row 53: Portfolio Expected Return (nominal):   [C53]%  ← SUMPRODUCT(weights, returns)
Row 54: Portfolio Expected Return (real):       [C54]%  ← =(1+C53)/(1+inflation)-1
Row 55: Portfolio Net Return (after fees):      [C55]%  ← =C53 - expense_ratio
Row 56: Portfolio Std Dev (volatility):         [C56]%  ← sqrt(w'Σw) from correlation matrix
Row 57: Portfolio Sharpe Ratio:                 [C57]   ← =(C55 - risk_free) / C56
Row 58: Portfolio Sortino Ratio:                [C58]   ← =(C55 - risk_free) / downside_dev
Row 59: Max Historical Drawdown:                [C59]%  ← from historical data
Row 60: 95% VaR (1-year):                      [C60]%  ← =C53 - 1.645 × C56
Row 61: 99% VaR (1-year):                      [C61]%  ← =C53 - 2.326 × C56
Row 62: Diversification Ratio:                  [C62]   ← weighted_avg_stddev / portfolio_stddev
Row 63: (blank)
Row 64: POST-RETIREMENT PORTFOLIO STATS (using target allocation):
Row 65-70: Same metrics as above but using target/retirement allocation weights
```

**Portfolio Volatility Formula (Markowitz):**
```
Portfolio_Variance = Σᵢ Σⱼ wᵢ × wⱼ × σᵢ × σⱼ × ρᵢⱼ
Portfolio_StdDev = sqrt(Portfolio_Variance)

Where:
  wᵢ, wⱼ = asset weights
  σᵢ, σⱼ = asset standard deviations
  ρᵢⱼ = correlation between assets i and j (from correlation matrix)
```

**Section E: Correlation Matrix Display (Rows 72-88)**
```
12×12 correlation matrix pulled from Historical Data sheet
Color-coded: green (<0.3, low correlation) → yellow (0.3-0.6) → red (>0.6, high correlation)
Diagonal = 1.00 (grey)
```

**Downstream Connections:**
```
Asset Allocation feeds:
  → Monte Carlo: portfolio return, std dev, correlation matrix for simulation
  → FIRE Profile: expected return replaces Assumptions 5.5% CAGR
  → Withdrawal Strategies: portfolio return for strategy calculations
  → Historical Backtest: allocation weights for rolling window analysis
  → Assumptions sheet: replace hardcoded 5.5% CAGR and 9% std dev
```

---

## 6. PHASE 3: MONTE CARLO SIMULATION

### 🎲 Monte Carlo Engine Sheet

**Methodology:**
1. Python generates 10,000 simulated retirement paths
2. Each path: N years (retirement duration from FIRE Profile)
3. Each year's return: drawn from multivariate normal distribution OR bootstrapped from historical data
4. Optional fat-tail adjustment using Student-t distribution (df=5)
5. Apply chosen withdrawal strategy + any income streams to each path
6. Deduct investment fees annually
7. Track: portfolio balance, withdrawals, success/failure per path
8. Output: percentile bands (5th, 10th, 25th, 50th, 75th, 90th, 95th)

**Simulation Phases:**
```
ACCUMULATION PHASE (current age → retirement age):
  For each year:
    portfolio(t+1) = portfolio(t) × (1 + return(t) - fees) + annual_savings(t)
    Where annual_savings comes from Income Engine

DECUMULATION PHASE (retirement age → life expectancy):
  For each year:
    withdrawal = withdrawal_strategy_function(portfolio, year, params)
    income_streams = SUM(active post-retirement income streams for this year)
    net_withdrawal = MAX(0, withdrawal - income_streams)
    portfolio(t+1) = (portfolio(t) - net_withdrawal) × (1 + return(t) - fees)
    If portfolio(t+1) <= 0: FAIL, record failure year
```

**Python Simulation Logic (detailed pseudo-code):**
```python
def run_monte_carlo(params):
    n_sims = 10000
    n_years_accum = retirement_age - current_age
    n_years_decum = life_expectancy - retirement_age
    n_years_total = n_years_accum + n_years_decum
    
    # Portfolio parameters
    weights = params['allocation_weights']  # 8-element array
    returns = params['expected_returns']    # 8-element array
    cov_matrix = params['covariance_matrix']  # 8×8
    fees = params['expense_ratio']
    
    # Calculate portfolio-level return and std dev
    port_return = np.dot(weights, returns) - fees
    port_std = sqrt(weights @ cov_matrix @ weights)
    
    # Method selection
    if params['method'] == 'parametric':
        # Correlated normal returns via Cholesky decomposition
        L = np.linalg.cholesky(cov_matrix)
        Z = np.random.standard_normal((n_sims, n_years_total, 8))
        asset_returns = Z @ L.T + returns  # shape: (n_sims, n_years, 8)
        portfolio_returns = asset_returns @ weights  # shape: (n_sims, n_years)
    
    elif params['method'] == 'bootstrap':
        # Sample from historical returns with replacement
        historical = params['historical_returns']  # n_historical_years × 8
        indices = np.random.randint(0, len(historical), (n_sims, n_years_total))
        asset_returns = historical[indices]
        portfolio_returns = asset_returns @ weights
    
    elif params['method'] == 'fat_tail':
        # Student-t distribution with df=5 for fat tails
        from scipy.stats import t as t_dist
        Z = t_dist.rvs(df=5, size=(n_sims, n_years_total))
        portfolio_returns = port_return + port_std * Z / np.sqrt(5/3)
    
    # Simulate paths
    balances = np.zeros((n_sims, n_years_total + 1))
    balances[:, 0] = params['initial_portfolio']
    withdrawals = np.zeros((n_sims, n_years_total))
    failed = np.zeros(n_sims, dtype=bool)
    failure_year = np.full(n_sims, n_years_total)
    
    for t in range(n_years_total):
        if t < n_years_accum:
            # ACCUMULATION: add savings
            contribution = params['annual_savings'][t]  # from Income Engine
            balances[:, t+1] = balances[:, t] * (1 + portfolio_returns[:, t]) + contribution
        else:
            # DECUMULATION: subtract withdrawals
            decum_year = t - n_years_accum
            w = calculate_withdrawal(balances[:, t], decum_year, params)
            income = params['post_retirement_income'][decum_year]
            net_w = np.maximum(0, w - income)
            withdrawals[:, t] = net_w
            balances[:, t+1] = (balances[:, t] - net_w) * (1 + portfolio_returns[:, t])
            
            # Check for failure
            newly_failed = (balances[:, t+1] <= 0) & (~failed)
            failed[newly_failed] = True
            failure_year[newly_failed] = t
            balances[balances[:, t+1] < 0, t+1] = 0
    
    # Calculate outputs
    success_rate = 1 - np.mean(failed)
    percentiles = np.percentile(balances, [5, 10, 25, 50, 75, 90, 95], axis=0)
    median_terminal = np.median(balances[:, -1])
    mean_terminal = np.mean(balances[:, -1])
    worst_terminal = np.min(balances[:, -1])
    best_terminal = np.max(balances[:, -1])
    
    # SWR optimization: binary search for max SWR at 95% success
    safe_swr_95 = optimize_swr(target_success=0.95, params=params)
    safe_swr_90 = optimize_swr(target_success=0.90, params=params)
    
    return {
        'success_rate': success_rate,
        'percentiles': percentiles,  # 7 × (n_years+1) array
        'median_terminal': median_terminal,
        'mean_terminal': mean_terminal,
        'worst_terminal': worst_terminal,
        'best_terminal': best_terminal,
        'safe_swr_95': safe_swr_95,
        'safe_swr_90': safe_swr_90,
        'failure_year_distribution': failure_year[failed],
    }
```

**Sheet Layout:**
```
SIMULATION PARAMETERS (Rows 1-12)
Row 1:  Title: "MONTE CARLO SIMULATION — 10,000 Retirement Path Analysis"
Row 3:  Initial Portfolio Size         [C3: auto]     ← from FIRE Profile
Row 4:  Retirement Duration            [C4: auto]     ← from FIRE Profile
Row 5:  Withdrawal Strategy            [C5: dropdown] ← Constant $/VPW/Guardrails/Vanguard/CAPE/Floor-Ceiling
Row 6:  Base SWR                       [C6: 4%]       ← from FIRE Profile
Row 7:  Portfolio Expected Return      [C7: auto]     ← from Asset Allocation
Row 8:  Portfolio Std Dev              [C8: auto]     ← from Asset Allocation
Row 9:  Number of Simulations          [C9: 10000]    ← default
Row 10: Method                         [C10: Parametric] ← dropdown: Parametric/Historical Bootstrap/Fat-Tail
Row 11: Inflation Rate                 [C11: auto]    ← from Assumptions
Row 12: Last Run Date                  [C12: auto]    ← timestamp of last Python run

KEY RESULTS (Rows 14-28)
Row 14: KEY RESULTS
Row 15: Success Rate                   [C15: ___]%    ← BIG, color-coded (green >90%, yellow 70-90%, red <70%)
Row 16: Median Terminal Portfolio      [C16: $___]
Row 17: 5th Percentile Terminal        [C17: $___]    ← worst realistic case
Row 18: 95th Percentile Terminal       [C18: $___]    ← best realistic case
Row 19: Worst Case Terminal            [C19: $___]
Row 20: Mean Terminal Portfolio        [C20: $___]
Row 21: (blank)
Row 22: Max SWR at 95% Success        [C22: ___]%
Row 23: Max SWR at 90% Success        [C23: ___]%
Row 24: Max SWR at 85% Success        [C24: ___]%
Row 25: (blank)
Row 26: Median Failure Year            [C26: Year __] ← for failed simulations only
Row 27: Probability of Ruin by Year 20 [C27: ___%]
Row 28: Probability of Ruin by Year 30 [C28: ___%]

PERCENTILE BANDS TABLE (Rows 30-95)
Row 30: PORTFOLIO BALANCE PERCENTILE BANDS
Row 31: Year | Age | 5th | 10th | 25th | 50th | 75th | 90th | 95th
Row 32: 0    | [retirement age] | ... | ... | ... | ... | ... | ... | ...
Row 33: 1    | [ret+1]          | ... | ... | ... | ... | ... | ... | ...
...
Row 32+N: N  | [ret+N]          | ... | ... | ... | ... | ... | ... | ...
(one row per year of retirement, typically 30-50 rows)
→ Fan chart visualization created from this data

SCENARIO COMPARISON (Rows 97-115)
Row 97:  SCENARIO COMPARISON (3 runs side by side)
Row 98:  Headers: Metric | Scenario 1 (Current) | Scenario 2 (Alternative) | Scenario 3 (Property Hybrid)
Row 99:  Allocation            | [Current]    | [user picks template] | [Current + Property]
Row 100: Success Rate          | [___]%       | [___]%                | [___]%
Row 101: Median Terminal       | $[___]       | $[___]                | $[___]
Row 102: SWR at 95% Success   | [___]%       | [___]%                | [___]%
Row 103: 5th Percentile Term.  | $[___]       | $[___]                | $[___]
Row 104: Median Annual Withdrawal | $[___]    | $[___]                | $[___]
```

**Property Hybrid Simulation:**
```
MC handles liquid portfolio only. Property returns use discrete scenarios:

Property Scenario   | Probability | Appreciation     | Description
Bull (boom)         | 15%         | +6% p.a.         | Strong market
Base (normal)       | 50%         | +3% p.a.         | Historical average
Stagnation          | 20%         | +0.5% p.a.       | Flat market
Crash (GFC-style)   | 10%         | -15% Y1-2, +2%   | Sharp decline, recovery
Asian Crisis repeat | 5%          | -25% Y1-3, +3%   | Severe, slow recovery

For each MC sim:
  1. Randomly assign property scenario (weighted by probability)
  2. Run liquid portfolio MC normally
  3. Add property equity at each year based on scenario
  4. Property reduces liquid capital (mortgage payments deducted from savings)
  5. Rental income added to post-retirement income streams

Webapp scope: Property hybrid MC is a W7 feature. It is implemented as a frontend
post-processing overlay on existing MC results, not a new API endpoint. The 5 scenarios
and their probability weights are defined in lib/data/crisisScenarios.ts.
```

---

## 7. PHASE 4: WITHDRAWAL STRATEGIES + SEQUENCE RISK

### 💰 Withdrawal Strategies Sheet

**INPUTS (Rows 1-15):**
```
Row 1:  Title: "WITHDRAWAL STRATEGIES — 6 Strategies Compared"
Row 3:  Initial Portfolio at Retirement [C3: auto]     ← from MC or FIRE Profile
Row 4:  Retirement Duration             [C4: auto]     ← from FIRE Profile
Row 5:  Base SWR                        [C5: 4%]       ← from FIRE Profile
Row 6:  Annual Expenses (minimum)       [C6: ___]      ← essential expenses only
Row 7:  Annual Expenses (desired)       [C7: ___]      ← comfortable spending
Row 8:  Portfolio Expected Return       [C8: auto]     ← from Asset Allocation
Row 9:  Portfolio Std Dev               [C9: auto]     ← from Asset Allocation
Row 10: Inflation Rate                  [C10: auto]    ← from Assumptions
Row 11: Post-Retirement Income          [C11: auto]    ← from Income Engine (CPF LIFE + dividends + rental)
Row 12: Current CAPE Ratio              [C12: 30]      ← user input (blue), check current Shiller CAPE
```

**STRATEGY-SPECIFIC PARAMETERS (Rows 14-32):**
```
Row 14: STRATEGY PARAMETERS
Row 15: 1. Constant Dollar (4% Rule)
Row 16:   SWR                          [C16: 4%]

Row 18: 2. Variable Percentage Withdrawal (VPW)
Row 19:   Expected Real Return          [C19: 3%]
Row 20:   Target End Value              [C20: $0]      ← 0 = spend down fully

Row 22: 3. Guardrails (Guyton-Klinger)
Row 23:   Initial Rate                  [C23: 5%]
Row 24:   Ceiling Trigger (cut if above)[C24: 120%]    ← % of initial rate
Row 25:   Floor Trigger (raise if below)[C25: 80%]     ← % of initial rate
Row 26:   Adjustment Size               [C26: 10%]     ← cut/raise by this %

Row 28: 4. Vanguard Dynamic Spending
Row 29:   Ceiling (max increase)        [C29: +5%]
Row 30:   Floor (max decrease)          [C30: -2.5%]

Row 31: 5. CAPE-Based
Row 32:   Base Rate                     [C32: 4%]
Row 33:   CAPE Weight                   [C33: 50%]     ← blend: (weight × 1/CAPE) + ((1-weight) × base_rate)

Row 35: 6. Floor-and-Ceiling
Row 36:   Floor (minimum withdrawal)    [C36: $60,000]  ← essential expenses
Row 37:   Ceiling (maximum withdrawal)  [C37: $150,000] ← lifestyle cap
Row 38:   Target Rate                   [C38: 4.5%]
```

**STRATEGY FORMULAS:**

**Strategy 1: Constant Dollar (4% Rule)**
```
Year 1: withdrawal = Portfolio × SWR
Year N: withdrawal = withdrawal(N-1) × (1 + inflation)
Portfolio(N) = (Portfolio(N-1) - withdrawal(N)) × (1 + return)
```

**Strategy 2: Variable Percentage Withdrawal (VPW)**
```
Year N: withdrawal = Portfolio(N) × VPW_rate(remaining_years, expected_real_return)
VPW_rate = PMT(expected_real_return, remaining_years, -1, target_end_value, 0) [as positive %]
Note: VPW rate increases each year as remaining years decrease
Example: 30 years remaining at 3% real → VPW_rate ≈ 5.1%
         20 years remaining at 3% real → VPW_rate ≈ 6.7%
         10 years remaining at 3% real → VPW_rate ≈ 11.7%
```

**Strategy 3: Guardrails (Guyton-Klinger)**
```
Year 1: withdrawal = Portfolio × initial_rate
Year N:
  inflation_adjusted = withdrawal(N-1) × (1 + inflation)
  current_rate = inflation_adjusted / Portfolio(N)
  
  Capital Preservation Rule:
    IF current_rate > initial_rate × ceiling_trigger:
      withdrawal = inflation_adjusted × (1 - adjustment_size)  # cut by 10%
  
  Prosperity Rule:
    IF current_rate < initial_rate × floor_trigger:
      withdrawal = inflation_adjusted × (1 + adjustment_size)  # raise by 10%
  
  ELSE: withdrawal = inflation_adjusted (normal inflation adjustment)
```

**Strategy 4: Vanguard Dynamic Spending**
```
Year 1: withdrawal = Portfolio × SWR
Year N:
  target = Portfolio(N) × SWR
  inflation_adjusted = withdrawal(N-1) × (1 + inflation)
  
  Ceiling check: IF target > inflation_adjusted × (1 + ceiling):
    withdrawal = inflation_adjusted × (1 + ceiling)
  Floor check: IF target < inflation_adjusted × (1 - ABS(floor)):
    withdrawal = inflation_adjusted × (1 - ABS(floor))
  ELSE: withdrawal = target
```

**Strategy 5: CAPE-Based**
```
Year N:
  cape_rate = 1 / CAPE_ratio(N)  [CAPE ratio assumed to revert toward mean over time]
  blended_rate = CAPE_weight × cape_rate + (1 - CAPE_weight) × base_rate
  withdrawal = Portfolio(N) × blended_rate
  
  CAPE ratio projection (deterministic single-path): mean-revert from current value toward long-term avg (~17) over 10 years
  CAPE(t) = current_CAPE + (17 - current_CAPE) × (t / 10) for t < 10, then 17

  CAPE in Monte Carlo simulations: use the same deterministic mean-reversion path above.
  CAPE is NOT randomized in MC — it follows the fixed reversion schedule regardless of simulated returns.
  This simplification avoids needing to model the CAPE-return feedback loop stochastically.
```

**Strategy 6: Floor-and-Ceiling**
```
Year N:
  target = Portfolio(N) × target_rate
  withdrawal = MAX(floor, MIN(ceiling, target))
  
  Note: Floor creates depletion risk if set too high relative to portfolio
  If portfolio × target_rate < floor for extended period → rapid depletion
```

**COMPARISON TABLE (Rows 40-100):**
```
Row 40: YEAR-BY-YEAR COMPARISON
Row 41: Year | Age | Portfolio₁ | W₁ | Portfolio₂ | W₂ | Portfolio₃ | W₃ | Portfolio₄ | W₄ | Portfolio₅ | W₅ | Portfolio₆ | W₆
(one row per year of retirement, using median portfolio return)
W = withdrawal amount for each strategy
```

**SUMMARY METRICS (Rows 102-120):**
```
Row 102: STRATEGY COMPARISON SUMMARY
Row 103: Headers: Metric | Constant$ | VPW | Guardrails | Vanguard | CAPE | Floor-Ceil

Row 104: Avg Annual Withdrawal    | $[___] | $[___] | $[___] | $[___] | $[___] | $[___]
Row 105: Min Annual Withdrawal    | $[___] | $[___] | $[___] | $[___] | $[___] | $[___]
Row 106: Max Annual Withdrawal    | $[___] | $[___] | $[___] | $[___] | $[___] | $[___]
Row 107: Withdrawal Std Dev       | $[___] | $[___] | $[___] | $[___] | $[___] | $[___]
Row 108: Spending Volatility %    | [___]% | [___]% | [___]% | [___]% | [___]% | [___]%
Row 109: Terminal Portfolio (med.) | $[___] | $[___] | $[___] | $[___] | $[___] | $[___]
Row 110: MC Success Rate          | [___]% | [___]% | [___]% | [___]% | [___]% | [___]%
Row 111: Worst-Case Year 1 Draw   | $[___] | $[___] | $[___] | $[___] | $[___] | $[___]
Row 112: (blank)
Row 113: ★ RECOMMENDATION         | [auto-generated based on FIRE type + risk tolerance]

Recommendation Logic:
  IF FIRE_type = "Lean": recommend VPW or Floor-Ceiling (spending stability critical)
  IF FIRE_type = "Regular": recommend Guardrails (balanced flexibility)
  IF FIRE_type = "Fat": recommend Constant Dollar or Vanguard (higher spending OK)
  IF risk_tolerance = "Conservative": recommend Floor-Ceiling with conservative floor
  IF has_CPF_LIFE: note that CPF provides a built-in floor, enabling more aggressive strategies
```

---

### 📉 Sequence Risk Sheet

**Pre-Loaded Historical Crises:**
```
Crisis              | Region | Start | Peak Drawdown | Duration | Recovery | Equity Return Sequence
Great Depression    | US     | 1929  | -86%          | 3 years  | 25 years | -8%, -25%, -43%, -8%, +54%, ...
Oil Crisis          | Global | 1973  | -48%          | 2 years  | 7 years  | -15%, -26%, +37%, +24%, ...
Asian Financial     | Asia   | 1997  | -60% (STI)    | 1 year   | 5 years  | -27%, +10%, +50%, ...
Dot-Com Bust        | US     | 2000  | -49%          | 3 years  | 7 years  | -9%, -12%, -22%, +29%, ...
GFC                 | Global | 2008  | -57%          | 1.5 yr   | 5.5 yr   | -37%, +26%, +15%, +2%, ...
COVID Crash         | Global | 2020  | -34%          | 0.3 yr   | 0.5 yr   | -6%(annual), +27%, ...
Japan Lost Decade   | Japan  | 1989  | -80%          | 13 years | never    | Special case
SG Property Crash   | SG     | 1997  | -45%          | 2 years  | 10 years | Property-specific
```

**Sheet Layout:**
```
SCENARIO SELECTOR (Row 3):  [C3: dropdown] ← select crisis to stress-test

STRESS TEST RESULTS (Rows 5-30):
  Applying [selected crisis] return sequence to Year 1-5 of retirement:

  Year | Normal Returns | Crisis Returns | Portfolio (Normal) | Portfolio (Crisis) | Difference
  1    | +8%            | -37%           | $2,880,000         | $1,790,000         | -$1,090,000
  2    | +10%           | +26%           | ...                | ...                | ...
  ...
  (20 rows, showing divergence over time)

PER-STRATEGY IMPACT TABLE (Rows 32-50):
  Strategy     | Normal Success | Crisis Success | Success Degradation | Min Withdrawal (Crisis)
  Constant $   | 95%           | 72%           | -23%                | $120,000 (unchanged)
  VPW          | 99%           | 96%           | -3%                 | $68,000 (auto-adjusts)
  Guardrails   | 97%           | 91%           | -6%                 | $95,000 (cuts applied)
  ...

SEQUENCE COMPARISON VISUALIZATION DATA (Rows 52-75):
  Two lines plotted: Good-first returns vs Bad-first returns
  Same average return (e.g., 7% geometric mean over 30 years)
  But Year 1-5: +15% each vs -10% each → dramatically different outcomes
  Shows WHY order matters in decumulation

MITIGATION STRATEGIES ANALYSIS (Rows 77-95):
  Strategy            | Description                           | Impact on Success Rate | Cost
  Bond Tent           | 60% bonds at retirement, glide to 40% | +5-8% success         | Lower median return
  Cash Buffer (2yr)   | Hold 2 years expenses in cash         | +3-5% success         | Cash drag ~0.5% p.a.
  Cash Buffer (3yr)   | Hold 3 years expenses in cash         | +4-7% success         | Cash drag ~0.8% p.a.
  Flexible Spending   | Use Guardrails or VPW                 | +8-15% success        | Spending volatility
  Part-Time Income    | Barista FIRE first 5 years            | +10-20% success       | Lifestyle change
  Delayed Retirement  | Work 2 more years                     | +5-10% success        | Opportunity cost
  Bucket Strategy     | 3 buckets: cash/bonds/equities        | +3-5% success         | Complexity
```

---

## 8. PHASE 5: HISTORICAL BACKTESTING

### 🔄 Historical Backtest Sheet

**Methodology (Bengen-Style):**
```
For every possible start year in the historical data:
  1. Take the investor's portfolio allocation
  2. Apply ACTUAL historical returns for that year sequence
  3. Apply the chosen withdrawal strategy (default: constant dollar)
  4. Deduct fees annually
  5. Track portfolio balance each year
  6. Determine: did the portfolio survive the full retirement duration?
  7. Record: ending balance, minimum balance, worst drawdown year
  
Repeat for EVERY start year (1926, 1927, ... 2024-duration)
= ~70-99 overlapping simulations depending on duration
```

**Sheet Layout:**
```
INPUTS (Rows 1-12):
Row 3:  Initial Portfolio Size          [C3: auto]    ← from FIRE Profile
Row 4:  Portfolio Allocation            [C4: auto]    ← from Asset Allocation (current weights)
Row 5:  Withdrawal Strategy             [C5: dropdown] ← default: Constant Dollar
Row 6:  SWR / Initial Withdrawal Rate   [C6: 4%]
Row 7:  Retirement Duration             [C7: 30]      ← years
Row 8:  Market Dataset                  [C8: US Only]  ← dropdown: US Only / Singapore Only / Blended
Row 9:  Blend Ratio (if blended)        [C9: 70/30]   ← US/SG split
Row 10: Include Fees                    [C10: Yes]     ← dropdown
Row 11: Fee Rate                        [C11: 0.3%]   ← from FIRE Profile

ROLLING WINDOW RESULTS (Rows 14-120):
Row 14: HISTORICAL SIMULATION RESULTS
Row 15: Start Year | End Year | Survived? | Ending Balance | Min Balance | Worst Year | Best Year | Total Withdrawn | Real Ending Balance
Row 16: 1926       | 1956    | ✅ Yes     | $X,XXX        | $XXX       | 1931       | 1954      | $XXX           | $XXX
Row 17: 1927       | 1957    | ✅ Yes     | ...           | ...        | ...        | ...       | ...            | ...
...
(one row per start year)

SUMMARY (Rows 122-140):
Row 122: BACKTEST SUMMARY
Row 123: Total Historical Periods Tested    [C123: ___]
Row 124: Successful Periods                 [C124: ___]
Row 125: Failed Periods                     [C125: ___]
Row 126: Historical Success Rate            [C126: ___]%  ← BIG, color-coded
Row 127: Worst Start Year                   [C127: ____]
Row 128: Best Start Year                    [C128: ____]
Row 129: Median Ending Balance              [C129: $___]
Row 130: Average Total Withdrawn            [C130: $___]
Row 131: Median Real Ending Balance         [C131: $___]  ← inflation-adjusted

HEAT MAP TABLE (Rows 142-165):
Row 142: SWR × RETIREMENT DURATION SUCCESS RATE HEAT MAP
Row 143: Headers across: 15yr | 20yr | 25yr | 30yr | 35yr | 40yr | 45yr
Row 144: SWR 3.0% | [auto-filled success rates from Python backtest]
Row 145: SWR 3.5% | ...
Row 146: SWR 4.0% | ...
Row 147: SWR 4.5% | ...
Row 148: SWR 5.0% | ...
Row 149: SWR 5.5% | ...
Row 150: SWR 6.0% | ...

Color coding:
  Green (≥95%): high confidence
  Yellow (80-94%): moderate confidence
  Orange (60-79%): caution
  Red (<60%): high risk

SINGAPORE-SPECIFIC BACKTEST (Rows 167-200):
Row 167: SINGAPORE MARKET BACKTEST (STI + SG Bonds, 1987-2024)
  Same structure using STI + SG T-bill returns
  Fewer data points (37 years vs 99 years) = less statistical confidence
  Note: "⚠️ Only [N] historical periods available. Results less robust than US data."

  Side-by-side comparison:
  Metric              | US Market | SG Market | Blended (70/30)
  Success Rate (4%)   | [___]%   | [___]%    | [___]%
  Worst Start Year    | [____]   | [____]    | [____]
  Max Safe SWR (95%)  | [___]%   | [___]%    | [___]%
```

---

## 9. PHASE 6: FIRE DASHBOARD + ONBOARDING + INTEGRATION

### 🎯 FIRE Dashboard

```
ROW 1-3: TITLE + LAST UPDATED
  "FIRE DASHBOARD — Your Financial Independence Overview"
  Last updated: [timestamp]
  Life Stage: [Pre-FIRE / Post-FIRE]

ROW 5-18: STATUS PANEL (headline numbers in large, color-coded cells)
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ FIRE Number         │ Current Progress    │ Years to FIRE               │
  │ $X,XXX,XXX          │ XX% ████████░░      │ X.X years (age XX)          │
  │                     │ ($Y of $X)          │ Range: X-Y years            │
  ├─────────────────────┼─────────────────────┼─────────────────────────────┤
  │ MC Success Rate     │ Recommended SWR     │ Property Impact             │
  │ XX% [GREEN/YELLOW]  │ X.X% ($XX,XXX/yr)   │ FIRE ±X years              │
  ├─────────────────────┼─────────────────────┼─────────────────────────────┤
  │ Income Replace Ratio│ Coast FIRE Status   │ Passive Income at Ret       │
  │ XX% at retirement   │ ✅ Achieved / ❌ Not│ $XX,XXX/yr (CPF+Div+Rent)  │
  └─────────────────────┴─────────────────────┴─────────────────────────────┘

ROW 20-38: ACCUMULATION CHART DATA (Pre-FIRE users)
  Year-by-year data for chart:
  Age | Portfolio Value | FIRE Number Line | 5th Percentile | 95th Percentile | Marker (You Are Here)
  (Fan chart: X-axis = Age, Y-axis = Portfolio Value)

ROW 40-58: DECUMULATION CHART DATA (Post-FIRE users)
  Year-by-year data for chart:
  Year | 5th | 25th | 50th | 75th | 95th | $0 Line | Current Strategy Withdrawal
  (Fan chart: X-axis = Years in Retirement, Y-axis = Portfolio Value)

ROW 60-72: WITHDRAWAL STRATEGY COMPARISON (mini version)
  Strategy     | MC Success Rate | Avg Annual $ | Min Year $ | Spending Stability | ★ Recommended?
  Constant $   | [___]%         | $[___]       | $[___]     | [High/Med/Low]    | [★ / —]
  VPW          | [___]%         | $[___]       | $[___]     | [High/Med/Low]    | [★ / —]
  Guardrails   | [___]%         | $[___]       | $[___]     | [High/Med/Low]    | [★ / —]
  Vanguard     | [___]%         | $[___]       | $[___]     | [High/Med/Low]    | [★ / —]
  CAPE         | [___]%         | $[___]       | $[___]     | [High/Med/Low]    | [★ / —]
  Floor-Ceil   | [___]%         | $[___]       | $[___]     | [High/Med/Low]    | [★ / —]

ROW 74-88: INCOME STREAMS TIMELINE DATA
  Stacked area chart data: Age | Salary | Rental | Dividends | Side Income | CPF LIFE | TOTAL

ROW 90-105: SCENARIO COMPARISON
  Scenario                      | FIRE Age | MC Success | NW at 65    | SWR Needed
  Current plan (no property)    | [___]    | [___]%     | $[___]      | [___]%
  + Buy FH Condo                | [___]    | [___]%     | $[___]      | [___]%
  + Buy HDB                     | [___]    | [___]%     | $[___]      | [___]%
  + Buy FH Landed               | [___]    | [___]%     | $[___]      | [___]%
  Aggressive allocation (80/20) | [___]    | [___]%     | $[___]      | [___]%
  Conservative allocation (30/70)| [___]   | [___]%     | $[___]      | [___]%

ROW 107-120: RISK DASHBOARD
  Sequence Risk Score:     [Low / Medium / High] ← based on years to retirement + allocation
  Worst Historical Start:  "If you retired in [year], portfolio would [survive/fail at year X]"
  Inflation Risk:          "Your $[expenses] today = $[future_value] in [N] years (purchasing power: [X]%)"
  Longevity Risk:          "If you live to 95 instead of [life_exp]: success rate [X]% → [Y]%"
  Currency Risk:           "XX% of portfolio in USD — 10% SGD depreciation impact: ±$[X]"
  Healthcare Cost Risk:    "MediSave at 65: $[X]. Estimated gap: $[Y] (consider Integrated Shield)"

ROW 122-135: ACTION ITEMS (auto-generated based on analysis)
  Conditional statements:
  - IF savings_rate < 30%: "Consider increasing savings rate by X% to accelerate FIRE by Y years"
  - IF allocation too aggressive for post-ret: "Your current allocation is X/Y — consider shifting to A/B"
  - IF has_CPF_LIFE: "CPF LIFE payout at 65 reduces required SWR from X% to Y%"
  - IF property_delays_FIRE: "Property purchase delays FIRE by X years but adds $Y NW by 60"
  - IF MC_success < 90%: "Consider reducing withdrawal rate from X% to Y% for 95% confidence"
  - IF no_healthcare_provision: "Budget $X/year for healthcare after MediSave is depleted"
  - IF SRS_unused: "Contributing $15,300/year to SRS saves ~$X in tax annually"
  - IF coast_fire_achieved: "You've reached Coast FIRE! Your investments alone will reach FIRE by age X"
```

---

### 📖 Reference Guide

**Layout: One section per ~15-20 rows, plain text with headers**

```
Section 1: WHAT IS FIRE?
  - Financial Independence, Retire Early
  - Types: Lean FIRE (<$40K/yr expenses), Regular FIRE ($40-100K), Fat FIRE (>$100K),
    Barista FIRE (part-time income + portfolio), Coast FIRE (portfolio grows to FIRE without saving more)
  - The FIRE equation: Savings Rate determines Time to FIRE
    10% savings rate → ~51 years | 25% → ~32 years | 50% → ~17 years | 75% → ~7 years
  - Singapore context: CPF acts as forced savings + retirement income floor

Section 2: THE 4% RULE
  - William Bengen (1994): analyzed US data from 1926, found 4% was the max safe rate over 30 years
  - Trinity Study (1998): confirmed with different allocations and periods
  - Limitations: US-centric data, 30-year max horizon, doesn't account for fees/taxes,
    doesn't consider other income (CPF, rental), assumes static allocation
  - For Singapore: consider lower SWR (3.5%) due to shorter local data history

Section 3: SAFE WITHDRAWAL RATES
  - SWR = annual withdrawal as % of initial portfolio
  - Factors that affect SWR: retirement duration, allocation, flexibility, other income, fees, taxes
  - Higher SWR possible with: flexible spending (Guardrails/VPW), other income, shorter duration
  - Lower SWR needed for: fixed spending, long duration, high fees, no other income

Section 4: MONTE CARLO SIMULATION
  - What: generates thousands of random return sequences to test your plan
  - Parametric: assumes returns follow bell curve (normal distribution)
  - Bootstrap: randomly samples from actual historical returns
  - Fat-tail: uses Student-t distribution to model extreme events
  - Interpreting: 95% success means 500 out of 10,000 simulations failed
  - Limitations: assumes returns are stationary, doesn't capture regime changes

Section 5: SEQUENCE OF RETURNS RISK
  - Why order matters: bad returns early in retirement are devastating
  - "Red zone": first 5-10 years of retirement are highest risk
  - Example: same 7% average return, but -20% in Year 1 vs Year 20 → wildly different outcomes
  - Mitigation: bond tent, cash buffer, flexible spending, part-time income

Section 6: ASSET ALLOCATION
  - Markowitz mean-variance: diversification reduces risk without proportionally reducing return
  - Glide path: shift from growth to preservation as you age
  - CPF as fixed-income: OA at 2.5%, SA at 4% — acts like a guaranteed bond with no volatility
  - Currency consideration: SGD investors holding USD assets face FX risk

Section 7: WITHDRAWAL STRATEGIES EXPLAINED
  - Detailed explanation of each of 6 strategies with pros, cons, and best-for scenarios
  - Comparison table: stability vs flexibility vs efficiency vs complexity

Section 8: SINGAPORE-SPECIFIC CONSIDERATIONS
  - CPF system: OA, SA, MA, contribution rates, BRS/FRS, LIFE payouts
  - SRS: tax-deferred retirement savings ($15,300/yr cap for citizens)
  - No capital gains tax in Singapore (major advantage)
  - Property: HDB vs Private, Bala's Table for leasehold decay, ABSD, stamp duties
  - SG inflation: historically 1.5-2.5%, food/healthcare often higher
  - Re-employment Act: employers must offer re-employment up to 68

Section 9: HOW TO USE THIS WORKBOOK
  - Sheet-by-sheet guide: what to fill in, what's auto-calculated
  - Blue = edit (user input), Black = formula (don't edit), Green = linked from other sheet
  - How to run Monte Carlo: [instructions for Python script]
  - Troubleshooting: common errors and fixes

Section 10: GLOSSARY
  FIRE Number, SWR, CAPE Ratio, Sharpe Ratio, Sortino Ratio, Drawdown, Sequence Risk,
  Glide Path, VPW, Guardrails, Coast FIRE, Barista FIRE, Lean/Regular/Fat FIRE,
  Monte Carlo, Bootstrap, Percentile, Correlation, Volatility, VaR, Diversification Ratio,
  Bala's Table, CPF, SRS, BRS/FRS/ERS, ABSD, BSD, LTV, SORA
```

---

### Integration with Existing Property Model

**Specific Connections to Implement:**

```
1. FIRE Profile ↔ Assumptions (bidirectional):
   FIRE Profile!C4 (age) = Assumptions!C4
   FIRE Profile!C21 (NW) = Assumptions!C7
   FIRE Profile!C24 (CPF OA) = Assumptions!C8
   FIRE Profile!C52 (inflation) = Assumptions!C43

2. Income Engine → Property Sheets:
   Income Engine rental stream auto-links to Cash Flow Waterfall gross rental
   Property exit modeled as life event (Section C)
   Mortgage payment deducted from annual savings in Income Engine

3. Monte Carlo → Opportunity Cost (enhancement):
   Replace deterministic 5.5% CAGR with MC percentile bands
   Show: "No property" liquid portfolio with MC uncertainty vs property scenarios

4. FIRE Dashboard → Dashboard (existing):
   Add new row(s) to existing property ranking: "Impact on FIRE Date"
   Property column: "Buying [property] shifts FIRE from age X to age Y"

5. Asset Allocation → Assumptions:
   Asset Allocation portfolio return → replaces Assumptions!C54 (5.5% CAGR)
   Asset Allocation portfolio std dev → replaces Assumptions!C55 (9%)

6. Withdrawal Strategies → Opportunity Cost:
   Post-retirement: show how each property choice affects annual withdrawal capacity
   e.g., "With FH Condo rental income of $98K/yr, required portfolio withdrawal drops from $120K to $22K"
```

---

## 10. USER JOURNEYS

### Journey 1: Fresh Graduate (Age 25, $4K/month)
```
1. Start Here → selects "Pre-FIRE"
2. FIRE Profile: age 25, income $48K, expenses $30K, savings $18K, NW $50K
3. Income Engine: selects "Data-Driven" → Degree → sees MOM salary curve
   $48K → $72K by 30 → $97.5K by 45 → $84K by 60
4. Asset Allocation: selects "Aggressive (80/20)" template
5. FIRE Profile auto-calculates: FIRE number $750K (Lean at 3.5% SWR), 12 years to FIRE
6. Monte Carlo: runs 10K sims → 94% success rate at 3.5% SWR over 60 years
7. Reference Guide: reads about FIRE types, switches to Regular FIRE ($1.2M target)
8. Dashboard: "FIRE at age 37 (optimistic) to 42 (conservative). Coast FIRE by 30."
```

### Journey 2: Mid-Career Professional (Age 35, $15K/month)
```
1. Start Here → selects "Pre-FIRE"
2. FIRE Profile: age 35, income $180K, expenses $96K, NW $800K, CPF OA $200K, SA $100K
3. Income Engine: selects "Realistic" → adds promotion at 38 (+40%)
   $180K → $252K at 38 → $350K by 45, adds rental stream starting age 40
4. Asset Allocation: selects "Balanced (60/40)"
5. Property sheets: evaluates FH Condo ($3.9M) vs no property
6. FIRE Dashboard:
   - Without property: FIRE at 47 (96% MC success)
   - With FH Condo: FIRE at 49 (93% success) but $2M more NW at 60, rental covers 40% of expenses
7. Monte Carlo: runs both scenarios side by side
8. Sequence Risk: stress tests GFC scenario at age 47 → Guardrails strategy survives
9. Decision: buys property at 38, targets FIRE at 50 with Guardrails strategy
```

### Journey 3: Pre-Retiree (Age 55, $2M portfolio)
```
1. Start Here → selects "Pre-FIRE" (retiring at 58)
2. FIRE Profile: age 55, NW $2M, expenses $80K, target retirement 58
3. Income Engine: 3 streams active
   - Salary ($200K, ends at 58)
   - CPF LIFE ($18K/yr, starts at 65)
   - Dividends ($30K/yr, growing at 3%)
4. Withdrawal Strategies: compares all 6
   - Guardrails: $92K/yr avg, 97% MC success
   - VPW: $78K-$120K range, 99% success
   - Constant $: $80K/yr, 91% success
5. Historical Backtest: 94% success at 4% SWR over 35 years (US data)
6. Sequence Risk: 1973 oil crisis scenario → survives but tight first 5 years
7. Action: adopts Guardrails strategy, builds 3-year cash buffer before retiring at 58
```

### Journey 4: Already Retired (Age 62, $3M portfolio)
```
1. Start Here → selects "Post-FIRE"
2. FIRE Profile: age 62, NW $3M, expenses $120K, life expectancy 90
3. Income Engine: passive streams only
   - CPF LIFE ($24K/yr at 65)
   - Rental income ($36K/yr)
   - Dividends ($20K/yr)
4. Total passive income at 65: $80K. Required from portfolio: $40K. Effective SWR: 1.3%
5. Monte Carlo: 99.8% success → "virtually bulletproof"
6. Sequence Risk: even worst historical scenario survives easily
7. Dashboard: "Your passive income covers 67% of expenses. Effective SWR is only 1.3%. Excellent shape."
8. Action item: "Consider increasing spending or gifting — your plan is extremely conservative"
```

### Journey 5: HNW Property Investor (Age 40, $13M NW)
```
1. Uses existing property model (all 6 property scenarios as before)
2. NEW: FIRE Dashboard shows integrated view
   - Property equity as part of net worth
   - Rental income reduces required SWR
   - FIRE already achieved (Coast FIRE)
3. Monte Carlo: separate runs for liquid-only vs property scenarios
4. Withdrawal Strategies: with $13M NW + property, any strategy works
5. Income Engine: salary ending at 50, rental perpetual, dividends growing
6. Sequence Risk: main risk = property crash + market crash simultaneously
7. Dashboard scenario comparison: FH Landed best for NW growth, but capital-intensive
```

### Journey 6: Dual-Income Couple (Ages 33+31)
```
1. Income Engine: 2 employment streams + combined expenses
   - Stream 1: Spouse A salary ($120K, Realistic model)
   - Stream 2: Spouse B salary ($96K, Realistic model)
   - Stream 3: Rental income starting age 38 ($48K)
2. FIRE Profile: combined NW $600K, combined expenses $120K, FIRE number $3M
3. Life Events: Spouse B takes 3-year career break at 35 for children
   - Event: "Childcare break", age 35-38, 0% income, Stream 2, CPF paused
4. CPF: both CPFs modeled separately (different contribution schedules)
5. FIRE Dashboard: household FIRE at 48, career break delays by 2 years to 50
6. Monte Carlo: 92% success at 4% SWR for 40-year retirement
```

---

## 11. TECHNICAL SPECIFICATIONS

### Formula vs Python Split

**Excel Formulas (in-sheet, transparent, auditable):**
- FIRE Number calculation, Years to FIRE (NPER), Coast FIRE
- Income projections (salary models, income streams)
- CPF contributions (rate tables, caps)
- Singapore tax calculation (progressive brackets)
- Asset allocation statistics (weighted return, basic portfolio stats)
- Withdrawal strategy year-by-year (all 6 strategies, deterministic path)
- MOM salary data lookup

**Python Scripts (run externally, output to sheet):**
- Monte Carlo simulation (10K sims — too compute-intensive for Excel)
- Historical backtesting (rolling window × multiple SWRs × multiple durations)
- Correlation matrix computation (from historical data)
- SWR optimization (binary search for max SWR at target success rate)
- Portfolio optimization (max Sharpe ratio — Section B of Asset Allocation)
- Heat map generation (SWR × Duration success rates)

### Color Coding (all new sheets)

| Style | Usage | Hex |
|-------|-------|-----|
| Blue text | User input — edit these cells | #0000FF |
| Black text | Formulas and calculations — don't edit | #000000 |
| Green text | Links from other sheets | #008000 |
| Gray background | Section headers / labels | #F2F2F2 |
| Yellow background | Key results / attention needed | #FFFF00 |
| Green background | Good / success / on track (>90%) | #E2EFDA |
| Orange background | Caution / moderate risk (60-90%) | #FFF3E0 |
| Red background | Warning / failure / off track (<60%) | #FCE4EC |

### Named Ranges

**FIRE Profile:**
```
FIRE_CurrentAge, FIRE_RetirementAge, FIRE_LifeExpectancy, FIRE_RetirementDuration
FIRE_Number, FIRE_Progress, FIRE_YearsToFIRE, FIRE_LifeStage
FIRE_AnnualExpenses, FIRE_RetirementExpenses, FIRE_AnnualSavings, FIRE_SavingsRate
FIRE_SWR, FIRE_CoastFIRE, FIRE_BaristaIncome
FIRE_CurrentNW, FIRE_LiquidPortfolio
FIRE_ExpenseRatio, FIRE_RebalanceFreq
```

**Income Engine:**
```
Income_TotalGross, Income_TotalNet, Income_TotalSavings
Income_SalaryModel, Income_CurrentSalary
Income_Stream1..5_Active, Income_Stream1..5_Amount
Income_LifeEventsToggle
Income_EffectiveTaxRate, Income_AnnualTax
```

**CPF:**
```
CPF_OA, CPF_SA, CPF_MA, CPF_Total
CPF_OA_Rate, CPF_SA_Rate, CPF_MA_Rate
CPF_LIFE_Annual, CPF_LIFE_StartAge
CPF_BRS, CPF_FRS, CPF_ERS
```

**Asset Allocation:**
```
Portfolio_ExpectedReturn, Portfolio_StdDev, Portfolio_SharpeRatio
Portfolio_PostRetReturn, Portfolio_PostRetStdDev
Portfolio_InitialValue, Portfolio_CurrentValue
Allocation_Weights (array), Allocation_TargetWeights (array)
GlidePath_Toggle, GlidePath_Method
```

**Monte Carlo:**
```
MC_SuccessRate, MC_MedianTerminal, MC_SafeSWR_95, MC_SafeSWR_90
MC_Percentile_5th, MC_Percentile_50th, MC_Percentile_95th
MC_Method, MC_NumSims, MC_LastRunDate
```

**Backtest:**
```
Backtest_SuccessRate, Backtest_WorstYear, Backtest_BestYear
Backtest_Dataset, Backtest_Duration
```

**Property:**
```
Property_Equity, Property_RentalIncome, Property_MortgagePayment
Property_FIREImpactYears
```

**Other:**
```
Inflation_Rate, RiskFree_Rate
SRS_Balance, SRS_AnnualContrib
```

### Sheet Protection Plan
- User input cells: unlocked (editable)
- Formula cells: locked (protected)
- Historical Data: VeryHidden (not visible in tabs)
- Structure: protected (prevent accidental sheet deletion)
- Password: simple/none (user-friendly, not security-critical)

### Performance Targets
- Monte Carlo Python script: <10 seconds for 10K sims
- Historical backtest Python script: <5 seconds
- All Excel formulas: calculate in <1 second
- Sheet size: keep each sheet under 200 rows × 25 columns where possible
- Total workbook size: target <5MB

### Data Validation Summary (all input cells)

| Cell | Validation | Range/List |
|------|-----------|------------|
| Ages | Integer | 18-110 |
| Percentages (rates) | Decimal | 0.00-1.00 |
| Dollar amounts | Number | ≥0 |
| SWR | Decimal | 0.01-0.10 |
| Allocation % | Decimal | 0.00-1.00, sum=1.00 |
| Dropdowns | List | As specified per cell |
| Yes/No toggles | List | "Yes,No" or "ON,OFF" |

### Error Handling
- All division formulas wrapped in IFERROR: `=IFERROR(A/B, 0)` or `=IFERROR(A/B, "N/A")`
- Cross-sheet references: `=IFERROR('Sheet'!Cell, "— Run [Sheet] first —")`
- MC results before running: show "— Run Monte Carlo first —"
- Backtest results before running: show "— Run Historical Backtest first —"
- Allocation sum ≠ 100%: show "⚠️ Weights must sum to 100%"
- Negative years to FIRE: show "✅ Already at FIRE!" (means current NW > FIRE Number)
- Retirement age < current age: show "⚠️ Retirement age must be greater than current age"

---

## 12. SINGAPORE-SPECIFIC REFERENCE DATA

### SG Personal Income Tax Rates (YA 2024)
```
Chargeable Income ($)    | Rate    | Cumul Tax ($)
First $20,000            | 0%      | $0
Next $10,000             | 2%      | $200
Next $10,000             | 3.5%    | $550
Next $40,000             | 7%      | $3,350
Next $40,000             | 11.5%   | $7,950
Next $40,000             | 15%     | $13,950
Next $40,000             | 18%     | $21,150
Next $40,000             | 19%     | $28,750
Next $40,000             | 19.5%   | $36,550
Next $40,000             | 20%     | $44,550
Next $40,000             | 22%     | $53,350
In excess of $400,000    | 22%     | -
```

### CPF Contribution Rates (2024)
```
Age Group     | Employee | Employer | Total  | OA     | SA    | MA
Up to 55      | 20%      | 17%      | 37%    | 23%    | 6%    | 8%
55-60         | 15%      | 14.5%    | 29.5%  | 11.5%  | 4.5%  | 13.5%
60-65         | 9.5%     | 11%      | 20.5%  | 3.5%   | 3%    | 14%
65-70         | 7.5%     | 8.5%     | 16%    | 1%     | 1%    | 14%
Above 70      | 5%       | 7.5%     | 12.5%  | 1%     | 1%    | 10.5%

OW Ceiling: $6,800/month ($81,600/year)
AW Ceiling: $102,000 - (OW × 12)
```

### CPF Interest Rates
```
Account | Base Rate | Extra Interest (first $60K) | Extra Interest (55+ first $30K)
OA      | 2.5%     | +1.0%                        | +1.0%
SA      | 4.0%     | +1.0%                        | +1.0%
MA      | 4.0%     | +1.0%                        | +1.0%
RA      | 4.0%     | +1.0%                        | +2.0%

Note: Extra interest on first $60K combined (with up to $20K from OA). Additional $30K from 55+.
```

### CPF BRS/FRS/ERS (2024 rates, grows ~3.5% p.a.)
```
BRS (Basic): $106,500 (provides ~$850-$1,000/month CPF LIFE)
FRS (Full):  $213,000 (provides ~$1,550-$1,800/month CPF LIFE)
ERS (Enhanced): $426,000 (provides ~$2,600-$3,000/month CPF LIFE)
```

### SRS (Supplementary Retirement Scheme)
```
Annual cap: $15,300 (SG citizens/PR) / $35,700 (foreigners)
Tax relief: contributions deductible from taxable income
Withdrawal: only 50% of withdrawals taxed (at retirement, from statutory age)
Statutory retirement age: 63 (rising)
Penalty for early withdrawal: 100% taxable + 5% penalty
```

### Buyer Stamp Duty (BSD)
```
First $180,000:     1%
Next $180,000:      2%
Next $640,000:      3%
Next $500,000:      4%
Next $1,500,000:    5%
Above $3,000,000:   6% (from Feb 2023)
```

### ABSD Rates (Current)
```
Profile                          | Rate
SG Citizen — 1st property        | 0%
SG Citizen — 2nd property        | 20%
SG Citizen — 3rd+ property       | 30%
SG PR — 1st property             | 5%
SG PR — 2nd+ property            | 30%
Foreigner — any property          | 60%
Entity — any property             | 65%
```

---

## 13. PYTHON CODE ARCHITECTURE

### File Structure
```
fire_planner/
├── main.py                    # Entry point: run all simulations
├── config.py                  # Configuration: file paths, sheet names, named ranges
├── monte_carlo.py             # Monte Carlo simulation engine
├── backtest.py                # Historical backtesting engine
├── withdrawal_strategies.py   # All 6 withdrawal strategy implementations
├── portfolio.py               # Portfolio statistics, optimization, correlation
├── excel_io.py                # Read inputs from Excel, write results back
├── data/
│   └── historical_returns.csv # Backup of historical data (also in Excel)
└── requirements.txt           # numpy, scipy, pandas, openpyxl
```

### Key Functions

**monte_carlo.py:**
```python
run_simulation(params) → SimulationResult
  # Returns: success_rate, percentile_bands, terminal_stats, safe_swr

optimize_swr(target_success, params) → float
  # Binary search: find max SWR where success_rate >= target

generate_returns(method, n_sims, n_years, params) → np.ndarray
  # Parametric, bootstrap, or fat-tail return generation
```

**backtest.py:**
```python
run_backtest(params, historical_data) → BacktestResult
  # Returns: per_start_year results, summary stats, success_rate

generate_heat_map(params, historical_data) → np.ndarray
  # SWR × Duration success rate matrix

run_sg_backtest(params, sg_data) → BacktestResult
  # Singapore-specific using STI data
```

**withdrawal_strategies.py:**
```python
constant_dollar(portfolio, year, params) → float
vpw(portfolio, remaining_years, params) → float
guardrails(portfolio, prior_withdrawal, year, params) → float
vanguard_dynamic(portfolio, prior_withdrawal, year, params) → float
cape_based(portfolio, year, params) → float
floor_ceiling(portfolio, params) → float
```

**excel_io.py:**
```python
read_inputs(workbook_path) → dict
  # Reads all named ranges and input cells

write_mc_results(workbook_path, results) → None
  # Writes percentile bands, success rate, etc. to Monte Carlo sheet

write_backtest_results(workbook_path, results) → None
  # Writes rolling window results, summary, heat map to Backtest sheet
```

### Execution Flow
```
1. User fills in FIRE Profile + Income Engine + Asset Allocation in Excel
2. User runs: python main.py FIRE_PropertyWorksheet.xlsx
3. main.py calls excel_io.read_inputs() → gets all parameters
4. main.py calls monte_carlo.run_simulation() → MC results
5. main.py calls backtest.run_backtest() → backtest results
6. main.py calls portfolio.optimize_sharpe() → optimal allocation
7. main.py calls excel_io.write_mc_results() → writes to MC sheet
8. main.py calls excel_io.write_backtest_results() → writes to Backtest sheet
9. main.py calls recalc.py → recalculates all formulas
10. User opens Excel → sees results in Monte Carlo + Backtest + FIRE Dashboard
```

---

## 14. BUILD PROGRESS TRACKER

### Phase 1: Foundation
- [ ] Start Here sheet created
- [ ] Life-stage dropdown working
- [ ] Navigation links working (HYPERLINK to all sheets)
- [ ] Quick results preview formulas
- [ ] FIRE Profile sheet created
- [ ] Section 1: Personal Profile working
- [ ] Section 2: Financial Position working
- [ ] Section 3: FIRE Targets working
- [ ] FIRE Number formula correct
- [ ] Years-to-FIRE formula (NPER) correct
- [ ] Coast FIRE formula correct
- [ ] Barista FIRE formula correct
- [ ] Section 4: Key Assumptions linked
- [ ] Section 5: CPF Projections working
- [ ] CPF LIFE estimate formula
- [ ] BRS/FRS projection formula
- [ ] Data validation on all input cells
- [ ] Income Engine sheet created
- [ ] Simple salary model working
- [ ] Realistic (age-curve) model working
- [ ] Promotion jumps working
- [ ] Data-driven (MOM) model working
- [ ] MOM salary lookup from Historical Data
- [ ] 5 income streams working
- [ ] Income stream templates dropdown
- [ ] Life events toggle working
- [ ] Life event templates
- [ ] SG tax calculation (progressive brackets)
- [ ] Tax relief deductions
- [ ] CPF contribution auto-calc (age-based rates)
- [ ] CPF wage ceiling logic correct
- [ ] Summary output table populated (year-by-year)
- [ ] Summary metrics calculated
- [ ] Downstream links verified (→ FIRE Profile, → Asset Allocation)
- [ ] Historical Data sheet created (VeryHidden)
- [ ] S&P 500 data embedded (1926-2024)
- [ ] US Bond data embedded (1926-2024)
- [ ] US CPI data embedded (1926-2024)
- [ ] STI data embedded (1987-2024)
- [ ] SG T-Bill data embedded (1987-2024)
- [ ] SG Property Index embedded (1975-2024)
- [ ] SG CPI embedded (1961-2024)
- [ ] Gold returns embedded (1971-2024)
- [ ] REIT returns embedded (1990-2024)
- [ ] MSCI World ex-US embedded (1970-2024)
- [ ] USD/SGD FX data embedded
- [ ] MOM salary data embedded
- [ ] Summary stats calculated (mean, std dev, geometric mean, etc.)
- [ ] Correlation matrix calculated
- [ ] **Phase 1 checkpoint: user review**

### Phase 2: Asset Allocation
- [ ] Asset Allocation sheet created
- [ ] 8-class allocation builder working
- [ ] Allocation validation (sum = 100%)
- [ ] Pre-built templates dropdown working
- [ ] Template auto-fills allocation
- [ ] Portfolio expected return (SUMPRODUCT)
- [ ] Portfolio std dev (Markowitz formula)
- [ ] Portfolio Sharpe ratio
- [ ] Portfolio VaR (95%, 99%)
- [ ] Diversification ratio
- [ ] Glide path toggle working
- [ ] Glide path interpolation (linear/slow/fast)
- [ ] Year-by-year glide path table auto-generates
- [ ] Post-retirement portfolio stats calculated
- [ ] Correlation matrix display (12×12)
- [ ] Color-coded correlation matrix
- [ ] Links to Assumptions sheet updated (replace 5.5% CAGR, 9% std dev)
- [ ] **Phase 2 checkpoint: user review**

### Phase 3: Monte Carlo
- [ ] Monte Carlo sheet created
- [ ] Sheet layout with all sections
- [ ] Python monte_carlo.py written
- [ ] Parametric simulation working (10K sims)
- [ ] Historical bootstrap option working
- [ ] Fat-tail option working
- [ ] Withdrawal strategy integration (all 6)
- [ ] Accumulation phase modeled (savings contributions)
- [ ] Decumulation phase modeled (withdrawals + income)
- [ ] Fees deducted from returns
- [ ] Python excel_io.py: reads inputs from Excel
- [ ] Python excel_io.py: writes results to Excel
- [ ] Percentile bands output to sheet (7 percentiles × N years)
- [ ] Success rate calculated and written
- [ ] Safe SWR optimization (95%, 90%, 85%)
- [ ] Terminal portfolio statistics
- [ ] 3-scenario comparison working
- [ ] Property hybrid simulation working
- [ ] Fan chart data formatted for charting
- [ ] **Phase 3 checkpoint: user review**

### Phase 4: Withdrawal + Sequence Risk
- [ ] Withdrawal Strategies sheet created
- [ ] Input section with auto-links
- [ ] Strategy-specific parameters section
- [ ] Strategy 1: Constant Dollar formula working
- [ ] Strategy 2: VPW formula working (PMT-based)
- [ ] Strategy 3: Guardrails formula working (ceiling/floor triggers)
- [ ] Strategy 4: Vanguard Dynamic formula working (cap/floor)
- [ ] Strategy 5: CAPE-Based formula working (CAPE mean reversion)
- [ ] Strategy 6: Floor-Ceiling formula working
- [ ] Post-retirement income streams deducted from required withdrawal
- [ ] Comparison table: 6 strategies side-by-side (year-by-year)
- [ ] Summary metrics: avg/min/max withdrawal, std dev, terminal, success rate
- [ ] Recommendation logic working
- [ ] Sequence Risk sheet created
- [ ] Historical crises data embedded (8 scenarios)
- [ ] Scenario selector dropdown
- [ ] Stress test engine: crisis returns applied to Year 1-5
- [ ] Normal vs crisis portfolio comparison table
- [ ] Per-strategy impact table working
- [ ] Sequence comparison chart data (good-first vs bad-first)
- [ ] Mitigation strategies analysis
- [ ] **Phase 4 checkpoint: user review**

### Phase 5: Historical Backtesting
- [ ] Historical Backtest sheet created
- [ ] Input section with auto-links
- [ ] Python backtest.py written
- [ ] Rolling window simulation working (US data)
- [ ] Results output to sheet (per start year)
- [ ] Summary statistics calculated
- [ ] SWR × Duration heat map generated
- [ ] Color-coded heat map in sheet
- [ ] Singapore-specific backtest working (STI data)
- [ ] US vs SG comparison table
- [ ] Blended (70/30) backtest working
- [ ] **Phase 5 checkpoint: user review**

### Phase 6: Dashboard + Integration
- [ ] FIRE Dashboard created
- [ ] Status panel with all headline numbers
- [ ] Color-coded success rate
- [ ] Progress bar data
- [ ] Accumulation chart data (pre-FIRE, with MC bands)
- [ ] Decumulation chart data (post-FIRE, fan chart)
- [ ] Withdrawal strategy mini-comparison table
- [ ] Income streams timeline data
- [ ] Scenario comparison section (property vs no property × allocation)
- [ ] Risk dashboard (sequence, inflation, longevity, currency, healthcare)
- [ ] Action items auto-generated (conditional formulas)
- [ ] Reference Guide created
- [ ] All 10 sections written
- [ ] Integration: FIRE Profile ↔ Assumptions linked and verified
- [ ] Integration: Income Engine → Property sheets linked
- [ ] Integration: Asset Allocation → Assumptions (replace 5.5% CAGR, 9% std dev)
- [ ] Integration: FIRE metrics added to existing Dashboard
- [ ] Integration: Property impact on FIRE date calculated
- [ ] Integration: MC percentile bands available to Opportunity Cost
- [ ] Named ranges: all created and verified
- [ ] Data validation: all input cells validated
- [ ] Error handling: IFERROR on all cross-sheet refs and divisions
- [ ] Color coding: consistent across all new sheets
- [ ] Sheet protection: applied to all sheets
- [ ] Final review: all cross-sheet links verified
- [ ] Final review: all formulas error-free (run recalc.py)
- [ ] Final review: formatting consistent
- [ ] **Phase 6 checkpoint: user final review**

---

## 15. CONTEXT RESUMPTION PROMPT

Use this as the first message in a new conversation to resume work:

---

**CONTEXT RESUMPTION — SINGAPORE FIRE PLANNER BUILD**

I'm building a comprehensive Singapore FIRE + Property + Investment Retirement Planner in Excel.

**Attached:** [FIRE_PropertyWorksheet.xlsx] — the working workbook
**Attached:** [FIRE_PLANNER_MASTER_PLAN_v2.md] — the complete master plan

**PROJECT STATUS:**
- Currently on: Phase [X] — [Phase Name]
- Last completed: [describe the last thing you built, e.g., "Finished Income Engine Section D — Summary Output Table"]
- Next step: [describe what to build next, e.g., "Build Historical Data sheet — embed S&P 500 data"]
- Blockers/issues: [any problems encountered, e.g., "CPF contribution formula giving wrong results for age 60+"]

**CRITICAL CONTEXT:**
- Existing workbook: 13 original sheets (property leverage optimizer) + Plan sheet
- Sheet IDs: Dashboard(1), Sensitivity(12), Scenarios(11), Assumptions(2), Opportunity Cost(7), Bala Table(3), HDB 1984(4), HDB 2005(8), HDB 2015(9), Condo 99LH(5), FH Condo(6), FH Landed(10), Cash Flow Waterfall(13), Plan(14)
- New sheets need new IDs (assigned on creation by openpyxl)
- All financial values in SGD
- Color coding: Blue=input, Black=formula, Green=cross-sheet link
- Use openpyxl for Excel manipulation, then run recalc.py

**KEY DESIGN DECISIONS (all confirmed):**
1. Audience: HNW + broad Singapore, guided pathways
2. Life stage toggle: Pre-FIRE / Post-FIRE
3. Monte Carlo: Python 10K sims → percentile output to Excel
4. Historical data: Full embedded (US 1926+ / SG 1987+)
5. 6 withdrawal strategies compared side-by-side
6. 8 asset classes + CPF (OA 2.5%, SA 4%)
7. Income: 3 salary models + 5 streams + life events + MOM data + SG tax
8. Property MC: hybrid (MC for liquid, stress for property)
9. Fees: user-configurable expense ratio (default 0.3%)
10. Currency: all SGD, with USD/SGD FX consideration

**INSTRUCTIONS:**
Read the FIRE_PLANNER_MASTER_PLAN_v2.md for the full plan. Confirm you understand the current phase and continue building from where we left off. Start by reading the relevant existing sheets to verify links, then proceed with the next unchecked item in the Build Progress Tracker.

---

**END OF MASTER PLAN v2.0**
