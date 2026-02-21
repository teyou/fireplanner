# UX Simplification + SRS Lifecycle + HDB Monetization — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform FirePlanner from a power tool into an approachable Singapore retirement planner by adding a Simple/Advanced toggle, Quick Plan results, full SRS drawdown lifecycle, and phased HDB monetization.

**Architecture:** Global `mode` state in UIStore gates UI complexity across all sections. SRS is tracked as a separate balance in the projection engine (like CPF), fed into simulations as fixed income during drawdown. HDB monetization extends existing property calculations with CPF refund logic.

**Tech Stack:** React 18, TypeScript 5.7, Zustand 5, Vitest, Tailwind CSS, shadcn/ui

**Design doc:** `docs/plans/2026-02-21-ux-srs-hdb-design.md`

---

## Phase 1: Global Simple/Advanced Toggle

### Task 1.1: Update UIStore — Add `mode`, Remove `allocationAdvanced` and `sidebar`

**Files:**
- Modify: `frontend/src/stores/useUIStore.ts`
- Modify: `frontend/src/lib/types.ts` (if StatsPosition type is defined there — check first)

**Step 1: Update the store**

```typescript
// useUIStore.ts — changes:

// 1. Remove 'sidebar' from StatsPosition
type StatsPosition = 'bottom' | 'top'

// 2. Add mode to UIState, remove allocationAdvanced
interface UIState {
  sectionOrder: SectionOrder
  statsPosition: StatsPosition
  cpfEnabled: boolean
  propertyEnabled: boolean
  healthcareEnabled: boolean
  mode: 'simple' | 'advanced'      // NEW — replaces allocationAdvanced
}

// 3. Update defaults
const DEFAULT_UI: UIState = {
  sectionOrder: 'goal-first',
  statsPosition: 'bottom',
  cpfEnabled: true,
  propertyEnabled: false,
  healthcareEnabled: false,
  mode: 'simple',                   // NEW — default to simple
}

// 4. Bump version to 3, add migration
{
  name: 'fireplanner-ui',
  version: 3,
  migrate: (persisted, version) => {
    const state = persisted as Record<string, unknown>
    if (version < 2) {
      state.cpfEnabled = true
      state.propertyEnabled = false
      state.healthcareEnabled = false
    }
    if (version < 3) {
      // Migrate allocationAdvanced → mode
      state.mode = state.allocationAdvanced ? 'advanced' : 'simple'
      delete state.allocationAdvanced
      // Migrate sidebar → bottom
      if (state.statsPosition === 'sidebar') {
        state.statsPosition = 'bottom'
      }
    }
    return state
  },
}
```

**Step 2: Run type-check to find all broken references**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -50`

This will surface every file that reads `allocationAdvanced` or `statsPosition === 'sidebar'`. Fix each one in subsequent tasks.

**Step 3: Commit**

```bash
git add frontend/src/stores/useUIStore.ts
git commit -m "feat: add Simple/Advanced mode to UIStore, remove sidebar stats position"
```

---

### Task 1.2: Create `useEffectiveMode` Hook

**Files:**
- Create: `frontend/src/hooks/useEffectiveMode.ts`

**Step 1: Create the hook**

```typescript
// frontend/src/hooks/useEffectiveMode.ts
import { useUIStore } from '@/stores/useUIStore'

/**
 * Returns the effective UI mode. Currently returns the global mode.
 * Extensible for per-section overrides in a future version.
 */
export function useEffectiveMode(): 'simple' | 'advanced' {
  return useUIStore((s) => s.mode)
}

/**
 * Strategies visible in Simple mode.
 * Constant Dollar (baseline), Guardrails (best-researched adaptive),
 * VPW (popular in FIRE community), Floor & Ceiling (intuitive mental model).
 */
export const SIMPLE_STRATEGIES = [
  'constant_dollar',
  'guardrails',
  'vpw',
  'floor_ceiling',
] as const
```

**Step 2: Commit**

```bash
git add frontend/src/hooks/useEffectiveMode.ts
git commit -m "feat: add useEffectiveMode hook with Simple strategy list"
```

---

### Task 1.3: Add Simple/Advanced Pill Toggle to Sidebar

**Files:**
- Modify: `frontend/src/components/layout/Sidebar.tsx`

**Step 1: Add toggle to desktop sidebar header**

In the desktop `<aside>` (line ~367), after the title div, add:

```tsx
// Import at top:
import { useUIStore } from '@/stores/useUIStore'

// Inside the desktop aside, after <div className="font-bold text-lg px-2">FIRE Planner</div>:
<div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-xs">
  <button
    onClick={() => uiStore.setField('mode', 'simple')}
    className={cn(
      'flex-1 px-3 py-1 rounded-md transition-colors',
      uiStore.mode === 'simple'
        ? 'bg-background text-foreground shadow-sm font-medium'
        : 'text-muted-foreground hover:text-foreground'
    )}
  >
    Simple
  </button>
  <button
    onClick={() => uiStore.setField('mode', 'advanced')}
    className={cn(
      'flex-1 px-3 py-1 rounded-md transition-colors',
      uiStore.mode === 'advanced'
        ? 'bg-background text-foreground shadow-sm font-medium'
        : 'text-muted-foreground hover:text-foreground'
    )}
  >
    Advanced
  </button>
</div>
```

Add the same toggle to the mobile drawer header.

**Step 2: Verify visually**

Run: `cd frontend && npm run dev -- --port 5173`
Check: Sidebar shows Simple/Advanced pill, clicking toggles mode, persists across refresh.

**Step 3: Commit**

```bash
git add frontend/src/components/layout/Sidebar.tsx
git commit -m "feat: add Simple/Advanced pill toggle to sidebar"
```

---

### Task 1.4: Remove Sidebar Stats Strip Rendering from AppLayout

**Files:**
- Modify: `frontend/src/components/layout/AppLayout.tsx`

**Step 1: Remove sidebar-related code**

```typescript
// AppLayout.tsx changes:
// 1. Remove isSidebar variable (line ~37)
// 2. Remove the sidebar FireStatsStrip render (line ~60):
//    DELETE: {showStats && isSidebar && <FireStatsStrip position="sidebar" />}
// 3. Remove 'sidebar' from FireStatsStrip position prop type if defined in that component
```

**Step 2: Fix FireStatsStrip component**

Remove `position === 'sidebar'` branch from `FireStatsStrip.tsx`. Remove the aside rendering code for sidebar mode.

**Step 3: Run type-check and tests**

Run: `cd frontend && npm run type-check && npm run test`

**Step 4: Commit**

```bash
git add frontend/src/components/layout/AppLayout.tsx frontend/src/components/layout/FireStatsStrip.tsx
git commit -m "refactor: remove sidebar position from FireStatsStrip"
```

---

### Task 1.5: Gate Withdrawal Strategies by Mode

**Files:**
- Modify: `frontend/src/components/withdrawal/StrategyParamsSection.tsx`

**Step 1: Import and filter by mode**

```typescript
// At top of StrategyParamsSection.tsx:
import { useEffectiveMode, SIMPLE_STRATEGIES } from '@/hooks/useEffectiveMode'

// Inside the component:
const mode = useEffectiveMode()

// Replace the STRATEGY_GROUPS mapping with mode-aware filtering:
const visibleGroups = mode === 'simple'
  ? [{ label: '', strategies: [...SIMPLE_STRATEGIES] }]  // flat list, no group labels
  : STRATEGY_GROUPS

// For the active strategy preservation rule:
// When rendering toggle buttons, if a strategy is selected but not in visibleGroups,
// show it with an "(Advanced)" badge:
const isHiddenAdvanced = (s: WithdrawalStrategyType) =>
  mode === 'simple' &&
  !SIMPLE_STRATEGIES.includes(s as typeof SIMPLE_STRATEGIES[number]) &&
  withdrawal.selectedStrategies.includes(s)
```

**Step 2: Update the render**

- In Simple mode: render strategies as a flat list (no "Basic"/"Adaptive"/"Smoothed" headers)
- For hidden-but-active strategies: show with muted style and "(Advanced)" label
- Hide comparison table and charts in Simple mode (they live in `ExpensesContent` in InputsPage — gate with `mode === 'advanced'`)

**Step 3: Run type-check**

Run: `cd frontend && npm run type-check`

**Step 4: Commit**

```bash
git add frontend/src/components/withdrawal/StrategyParamsSection.tsx
git commit -m "feat: gate withdrawal strategies by Simple/Advanced mode"
```

---

### Task 1.6: Gate Allocation Section by Mode

**Files:**
- Modify: `frontend/src/components/allocation/AllocationBuilder.tsx`
- Modify: any component that reads `allocationAdvanced` from UIStore

**Step 1: Replace `allocationAdvanced` with `useEffectiveMode`**

Find all references to `allocationAdvanced` in the codebase:
```bash
cd frontend && grep -r "allocationAdvanced" src/
```

Replace each with:
```typescript
import { useEffectiveMode } from '@/hooks/useEffectiveMode'
const mode = useEffectiveMode()
// Where it was: if (allocationAdvanced) → if (mode === 'advanced')
```

In Simple mode, AllocationBuilder should show:
- Template selector (6 templates) — visible
- Portfolio stats panel — visible
- Manual 8-slider builder — hidden
- Glide path config — hidden
- Correlation heatmap — hidden
- Return/stddev overrides — hidden

**Step 2: Run tests**

Run: `cd frontend && npm run test`

**Step 3: Commit**

```bash
git add -A
git commit -m "refactor: replace allocationAdvanced with global mode toggle"
```

---

### Task 1.7: Gate Remaining Sections by Mode

**Files:**
- Modify: `frontend/src/pages/InputsPage.tsx` (gate inline content)
- Modify: `frontend/src/components/income/SalaryModelSection.tsx`
- Modify: `frontend/src/components/profile/CpfSection.tsx`
- Modify: `frontend/src/components/profile/FireTargetsSection.tsx`

**Step 1: Gate each section**

All follow the same pattern:
```typescript
import { useEffectiveMode } from '@/hooks/useEffectiveMode'
const mode = useEffectiveMode()
```

**Income (SalaryModelSection.tsx):**
- Simple: only render Simple salary model (hide Realistic/Data-Driven tabs)
- Simple: hide LifeEventsSection
- Simple: hide detailed ProjectionTable (keep SummaryPanel)

**CPF (CpfSection.tsx):**
- Simple: show CPF LIFE payout number + key summary. Hide full projection table, extra interest detail, housing deduction config.

**FIRE Settings (FireTargetsSection.tsx):**
- Simple: show only "Classic FIRE" (hide fireType selector for Lean/Fat/Coast/Barista)
- Simple: hide manual return override (keep `usePortfolioReturn: true` enforced)

**Expenses section in InputsPage:**
- Simple: hide `StrategyComparisonCard`, `ComparisonTable`, `WithdrawalChart`, `PortfolioComparisonChart`
- Already gated behind `strategyExpanded` toggle, but in Simple mode don't show the toggle at all

**Step 2: Run full test suite**

Run: `cd frontend && npm run type-check && npm run test`

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: gate Income, CPF, FIRE Settings, Expenses sections by mode"
```

---

## Phase 2: Quick Plan Results on StartPage

### Task 2.1: Add Preliminary Results Card to StartPage

**Files:**
- Modify: `frontend/src/pages/StartPage.tsx`

**Step 1: Import fire calculations**

```typescript
import { calculateFireNumber, calculateYearsToFire } from '@/lib/calculations/fire'
```

**Step 2: Add computed results**

After the existing draft state variables (lines 49-53), add:

```typescript
// Compute preliminary FIRE metrics from draft values
const DEFAULT_SWR = 0.04
const DEFAULT_RETURN = 0.07
const DEFAULT_INFLATION = 0.025
const DEFAULT_EXPENSE_RATIO = 0.003

const draftFireNumber = calculateFireNumber(draftExpenses, DEFAULT_SWR)
const draftNetRealReturn = DEFAULT_RETURN - DEFAULT_INFLATION - DEFAULT_EXPENSE_RATIO
const draftAnnualSavings = draftIncome - draftExpenses
const draftYearsToFire = calculateYearsToFire(
  draftNetRealReturn,
  draftAnnualSavings,
  draftNetWorth,
  draftFireNumber
)
const draftFireAge = draftAge + Math.ceil(draftYearsToFire)
const draftSavingsRate = draftIncome > 0 ? draftAnnualSavings / draftIncome : 0
const draftProgress = draftFireNumber > 0 ? Math.min(1, draftNetWorth / draftFireNumber) : 0

// Show results when all 5 inputs are filled and valid
const showResults = draftAge >= 18 && draftIncome > 0 && draftExpenses > 0
  && draftAnnualSavings > 0 && draftFireNumber > 0
  && isFinite(draftYearsToFire) && draftYearsToFire > 0
```

**Step 3: Add results card**

After each pathway's form inputs but before the "Continue" button, add:

```tsx
{showResults && (
  <div className="col-span-full mt-4 p-4 rounded-lg border bg-muted/30 space-y-3">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
      Preliminary estimate
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <div className="text-xs text-muted-foreground">FIRE Number</div>
        <div className="text-lg font-semibold">
          ${draftFireNumber.toLocaleString('en-SG', { maximumFractionDigits: 0 })}
        </div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground">Years to FIRE</div>
        <div className="text-lg font-semibold">
          {Math.ceil(draftYearsToFire)} years
        </div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground">FIRE Age</div>
        <div className="text-lg font-semibold">Age {draftFireAge}</div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground">Savings Rate</div>
        <div className="text-lg font-semibold">
          {(draftSavingsRate * 100).toFixed(1)}%
        </div>
      </div>
    </div>
    {/* Progress bar */}
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>Progress</span>
        <span>{(draftProgress * 100).toFixed(1)}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${draftProgress * 100}%` }}
        />
      </div>
    </div>
    <p className="text-xs text-muted-foreground">
      Based on default assumptions (4% SWR, ~7% return, 2.5% inflation).
      Refine your plan for a more accurate projection.
    </p>
  </div>
)}
```

**Step 4: Verify visually**

Run: `cd frontend && npm run dev -- --port 5173`
Navigate to `/` → pick "Show me what's possible" → enter age 30, income $72000, expenses $48000, NW $50000 → results card should appear showing FIRE Number ~$1.2M, ~16 years.

**Step 5: Commit**

```bash
git add frontend/src/pages/StartPage.tsx
git commit -m "feat: show preliminary FIRE results on StartPage before navigation"
```

---

## Phase 3: SRS Full Lifecycle

### Task 3.1: Fix SRS Residency Bug (Ship Immediately)

**Files:**
- Modify: `frontend/src/lib/calculations/tax.ts` (line 2, 66-68)
- Modify: `frontend/src/lib/calculations/income.ts` (line 438-442)
- Modify: `frontend/src/components/profile/FinancialSection.tsx` (line 55)
- Test: `frontend/src/lib/calculations/__tests__/tax.test.ts`

**Step 1: Write the failing test**

```typescript
// In tax.test.ts, add:
describe('calculateSrsDeduction', () => {
  it('caps at $15,300 for citizens/PR', () => {
    expect(calculateSrsDeduction(20000, 'citizen')).toBe(15300)
    expect(calculateSrsDeduction(15300, 'pr')).toBe(15300)
    expect(calculateSrsDeduction(10000, 'citizen')).toBe(10000)
  })

  it('caps at $35,700 for foreigners', () => {
    expect(calculateSrsDeduction(40000, 'foreigner')).toBe(35700)
    expect(calculateSrsDeduction(35700, 'foreigner')).toBe(35700)
    expect(calculateSrsDeduction(20000, 'foreigner')).toBe(20000)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/lib/calculations/__tests__/tax.test.ts --reporter=verbose`
Expected: FAIL — `calculateSrsDeduction` doesn't accept residencyStatus parameter.

**Step 3: Fix `calculateSrsDeduction`**

```typescript
// tax.ts — line 2: add SRS_ANNUAL_CAP_FOREIGNER import
import { TAX_BRACKETS, SRS_ANNUAL_CAP, SRS_ANNUAL_CAP_FOREIGNER } from '@/lib/data/taxBrackets'

// tax.ts — replace calculateSrsDeduction (line 66-68):
export function calculateSrsDeduction(
  srsContribution: number,
  residencyStatus: 'citizen' | 'pr' | 'foreigner' = 'citizen'
): number {
  const cap = residencyStatus === 'foreigner' ? SRS_ANNUAL_CAP_FOREIGNER : SRS_ANNUAL_CAP
  return Math.min(Math.max(0, srsContribution), cap)
}
```

**Step 4: Fix `calculateChargeableIncome` signature**

```typescript
// tax.ts — update calculateChargeableIncome to pass residencyStatus:
export function calculateChargeableIncome(
  totalIncome: number,
  cpfEmployee: number,
  srsContribution: number,
  personalReliefs: number,
  residencyStatus: 'citizen' | 'pr' | 'foreigner' = 'citizen'
): number {
  const srsDeduction = calculateSrsDeduction(srsContribution, residencyStatus)
  return Math.max(0, totalIncome - cpfEmployee - srsDeduction - personalReliefs)
}
```

**Step 5: Thread residencyStatus through income.ts**

In `income.ts`, the call at line 438-442 needs `residencyStatus`:
```typescript
// Add to IncomeProjectionParams:
residencyStatus: 'citizen' | 'pr' | 'foreigner'

// Update the call (line 438):
const chargeableIncome = calculateChargeableIncome(
  taxableIncome,
  cpfEmployee,
  params.srsAnnualContribution,
  params.personalReliefs,
  params.residencyStatus
)
```

Find all callers of `generateIncomeProjection` and pass `residencyStatus` from the profile store.

**Step 6: Fix FinancialSection tooltip**

```tsx
// FinancialSection.tsx — line 55, replace hardcoded tooltip:
tooltip={
  store.residencyStatus === 'foreigner'
    ? 'Annual SRS contribution (max $35,700 for foreigners)'
    : 'Annual SRS contribution (max $15,300 for citizens/PR)'
}
```

**Step 7: Run all tests**

Run: `cd frontend && npm run type-check && npm run test`

**Step 8: Commit**

```bash
git add -A
git commit -m "fix: use correct SRS contribution cap based on residency status"
```

---

### Task 3.2: Create SRS Calculation Module — Tests First

**Files:**
- Create: `frontend/src/lib/calculations/srs.ts`
- Create: `frontend/src/lib/calculations/__tests__/srs.test.ts`

**Step 1: Write comprehensive tests**

```typescript
// srs.test.ts
import { describe, it, expect } from 'vitest'
import {
  projectSrsBalance,
  computeSrsDrawdownSchedule,
  computeSrsEarlyPenalty,
  compareSrsVsRstu,
} from '../srs'

describe('projectSrsBalance', () => {
  it('projects balance with contributions and investment returns', () => {
    const result = projectSrsBalance({
      currentBalance: 100000,
      annualContribution: 15300,
      investmentReturn: 0.04,
      years: 5,
      contributionCap: 15300,
    })
    expect(result).toHaveLength(5)
    // Year 1: (100000 + 15300) * 1.04 = 119912
    expect(result[0].balance).toBeCloseTo(119912, 0)
    // Each year should be higher than the last
    for (let i = 1; i < result.length; i++) {
      expect(result[i].balance).toBeGreaterThan(result[i - 1].balance)
    }
  })

  it('caps contributions at the cap', () => {
    const result = projectSrsBalance({
      currentBalance: 0,
      annualContribution: 50000, // exceeds cap
      investmentReturn: 0,
      years: 1,
      contributionCap: 15300,
    })
    expect(result[0].contribution).toBe(15300)
    expect(result[0].balance).toBe(15300)
  })

  it('handles zero contribution', () => {
    const result = projectSrsBalance({
      currentBalance: 100000,
      annualContribution: 0,
      investmentReturn: 0.04,
      years: 3,
      contributionCap: 15300,
    })
    expect(result[0].balance).toBeCloseTo(104000, 0)
    expect(result[2].balance).toBeCloseTo(112486, 0) // 100000 * 1.04^3
  })
})

describe('computeSrsDrawdownSchedule', () => {
  it('spreads balance equally over 10 years', () => {
    const result = computeSrsDrawdownSchedule({
      balance: 200000,
      startAge: 63,
      durationYears: 10,
    })
    expect(result).toHaveLength(10)
    expect(result[0].age).toBe(63)
    expect(result[0].withdrawal).toBe(20000)
    expect(result[0].taxableAmount).toBe(10000) // 50% concession
    expect(result[9].age).toBe(72)
    expect(result[9].remainingBalance).toBe(0)
  })

  it('applies 50% tax concession on every withdrawal', () => {
    const result = computeSrsDrawdownSchedule({
      balance: 100000,
      startAge: 63,
      durationYears: 10,
    })
    result.forEach((row) => {
      expect(row.taxableAmount).toBe(row.withdrawal * 0.5)
    })
  })

  it('handles custom start age and duration', () => {
    const result = computeSrsDrawdownSchedule({
      balance: 50000,
      startAge: 65,
      durationYears: 5,
    })
    expect(result).toHaveLength(5)
    expect(result[0].age).toBe(65)
    expect(result[0].withdrawal).toBe(10000)
    expect(result[4].age).toBe(69)
  })
})

describe('computeSrsEarlyPenalty', () => {
  it('applies 5% penalty and full taxable amount', () => {
    const result = computeSrsEarlyPenalty(100000)
    expect(result.penalty).toBe(5000)
    expect(result.taxableAmount).toBe(100000) // no 50% concession
  })
})

describe('compareSrsVsRstu', () => {
  it('computes directional comparison', () => {
    const result = compareSrsVsRstu({
      currentIncome: 120000,
      currentMarginalRate: 0.15,
      amount: 15300,
    })
    // SRS: saves 15300 * 0.15 = 2295 now, pays 15300 * 0.5 * 0.02 = 153 later
    expect(result.srsNetBenefit).toBeCloseTo(2295 - 153, 0)
    // RSTU: saves 15300 * 0.15 = 2295, no withdrawal tax
    expect(result.rstuNetBenefit).toBeCloseTo(2295, 0)
    expect(result.recommendation).toBeTruthy()
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run src/lib/calculations/__tests__/srs.test.ts --reporter=verbose`
Expected: FAIL — module doesn't exist.

**Step 3: Implement `srs.ts`**

```typescript
// frontend/src/lib/calculations/srs.ts

interface SrsProjectionParams {
  currentBalance: number
  annualContribution: number
  investmentReturn: number
  years: number
  contributionCap: number
}

interface SrsProjectionRow {
  year: number
  balance: number
  contribution: number
  growth: number
}

export function projectSrsBalance(params: SrsProjectionParams): SrsProjectionRow[] {
  const { currentBalance, annualContribution, investmentReturn, years, contributionCap } = params
  const rows: SrsProjectionRow[] = []
  let balance = currentBalance

  for (let y = 1; y <= years; y++) {
    const contribution = Math.min(annualContribution, contributionCap)
    const preGrowthBalance = balance + contribution
    const growth = preGrowthBalance * investmentReturn
    balance = preGrowthBalance + growth
    rows.push({ year: y, balance, contribution, growth })
  }
  return rows
}

interface SrsDrawdownParams {
  balance: number
  startAge: number
  durationYears: number
}

interface SrsDrawdownRow {
  age: number
  withdrawal: number
  taxableAmount: number
  remainingBalance: number
}

export function computeSrsDrawdownSchedule(params: SrsDrawdownParams): SrsDrawdownRow[] {
  const { balance, startAge, durationYears } = params
  const annualWithdrawal = balance / durationYears
  const rows: SrsDrawdownRow[] = []
  let remaining = balance

  for (let i = 0; i < durationYears; i++) {
    const withdrawal = Math.min(annualWithdrawal, remaining)
    remaining -= withdrawal
    rows.push({
      age: startAge + i,
      withdrawal,
      taxableAmount: withdrawal * 0.5, // 50% tax concession
      remainingBalance: Math.max(0, remaining),
    })
  }
  return rows
}

export function computeSrsEarlyPenalty(amount: number): {
  penalty: number
  taxableAmount: number
} {
  return {
    penalty: amount * 0.05,
    taxableAmount: amount, // No 50% concession on early withdrawal
  }
}

interface SrsVsRstuParams {
  currentIncome: number
  currentMarginalRate: number
  amount: number
}

interface SrsVsRstuResult {
  srsNetBenefit: number
  rstuNetBenefit: number
  recommendation: string
}

export function compareSrsVsRstu(params: SrsVsRstuParams): SrsVsRstuResult {
  const { currentMarginalRate, amount } = params
  const ASSUMED_RETIREMENT_RATE = 0.02

  // SRS: tax saved now - tax paid on 50% at retirement
  const srsTaxSavedNow = amount * currentMarginalRate
  const srsTaxOnWithdrawal = amount * 0.5 * ASSUMED_RETIREMENT_RATE
  const srsNetBenefit = srsTaxSavedNow - srsTaxOnWithdrawal

  // RSTU: tax saved now, no withdrawal tax (but locked until 55)
  const rstuNetBenefit = amount * currentMarginalRate

  const recommendation = rstuNetBenefit > srsNetBenefit
    ? 'CPF SA top-up (RSTU) gives higher net benefit, but funds are locked until age 55.'
    : 'SRS gives comparable benefit with more flexibility for withdrawal after 63.'

  return { srsNetBenefit, rstuNetBenefit, recommendation }
}
```

**Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run src/lib/calculations/__tests__/srs.test.ts --reporter=verbose`
Expected: All PASS.

**Step 5: Commit**

```bash
git add frontend/src/lib/calculations/srs.ts frontend/src/lib/calculations/__tests__/srs.test.ts
git commit -m "feat: add SRS lifecycle calculations (accumulation, drawdown, penalty, comparison)"
```

---

### Task 3.3: Add SRS Fields to Profile Store

**Files:**
- Modify: `frontend/src/stores/useProfileStore.ts`
- Modify: `frontend/src/lib/types.ts` (add fields to ProfileState interface)

**Step 1: Add fields to ProfileState type**

```typescript
// In types.ts, add to ProfileState interface:
srsInvestmentReturn: number
srsDrawdownStartAge: number
```

**Step 2: Add defaults and migration**

```typescript
// In useProfileStore.ts DEFAULT_PROFILE, add:
srsInvestmentReturn: 0.04,
srsDrawdownStartAge: 63,

// In PROFILE_DATA_KEYS, add:
'srsInvestmentReturn', 'srsDrawdownStartAge',

// Bump version and add migration (existing version is 10, bump to 11):
if (version < 11) {
  state.srsInvestmentReturn ??= 0.04
  state.srsDrawdownStartAge ??= 63
}
```

**Step 3: Run type-check**

Run: `cd frontend && npm run type-check`

**Step 4: Commit**

```bash
git add frontend/src/stores/useProfileStore.ts frontend/src/lib/types.ts
git commit -m "feat: add SRS investment return and drawdown start age to profile store"
```

---

### Task 3.4: Integrate SRS into Projection Pipeline

**Files:**
- Modify: `frontend/src/lib/calculations/income.ts` (or `projection.ts`)
- Modify: `frontend/src/hooks/useProjection.ts`

**Step 1: Add SRS balance tracking to income projection**

In the year-by-year projection loop (inside `generateIncomeProjection`), add parallel SRS tracking:

```typescript
// New mutable state alongside CPF balances (income.ts ~line 249):
let srsBalance = params.srsBalance ?? 0
const srsReturn = params.srsInvestmentReturn ?? 0.04
const srsDrawdownStart = params.srsDrawdownStartAge ?? 63
const srsDrawdownEnd = srsDrawdownStart + 10
const srsCap = params.residencyStatus === 'foreigner' ? 35700 : 15300

// In each year of the projection loop:
// Accumulation years (age < retirementAge or age < srsDrawdownStart):
if (age < srsDrawdownStart) {
  const srsContrib = Math.min(params.srsAnnualContribution, srsCap)
  srsBalance = (srsBalance + srsContrib) * (1 + srsReturn)
  row.srsBalance = srsBalance
  row.srsContribution = srsContrib
  row.srsWithdrawal = 0
}
// Drawdown years (age >= srsDrawdownStart and age < srsDrawdownEnd):
else if (age >= srsDrawdownStart && age < srsDrawdownEnd && srsBalance > 0) {
  const remainingYears = srsDrawdownEnd - age
  const srsWithdrawal = srsBalance / remainingYears
  srsBalance -= srsWithdrawal
  row.srsBalance = Math.max(0, srsBalance)
  row.srsWithdrawal = srsWithdrawal
  row.srsTaxableWithdrawal = srsWithdrawal * 0.5
  // Add to government income (reduces portfolio withdrawal need)
  row.governmentIncome += srsWithdrawal
}
```

**Step 2: Add SRS columns to projection row type**

In `types.ts`, add to `IncomeProjectionRow` (or `ProjectionRow`):
```typescript
srsBalance?: number
srsContribution?: number
srsWithdrawal?: number
srsTaxableWithdrawal?: number
```

**Step 3: Update tax calculation in projection to use 50% SRS concession**

In the tax block of the projection loop, when computing chargeable income during drawdown years:
```typescript
// During SRS drawdown years, only 50% of SRS withdrawal is taxable:
const srsTaxable = row.srsTaxableWithdrawal ?? 0
// Add srsTaxable to taxableIncome instead of the full SRS withdrawal
```

**Step 4: Run tests**

Run: `cd frontend && npm run type-check && npm run test`

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: integrate SRS balance tracking into projection pipeline"
```

---

### Task 3.5: Wire SRS into Simulation Engines as Fixed Income

**Files:**
- Modify: `frontend/src/hooks/useMonteCarloQuery.ts`
- Modify: `frontend/src/hooks/useBacktestQuery.ts`
- Modify: `frontend/src/hooks/useSequenceRiskQuery.ts`
- Modify: `frontend/src/lib/simulation/workerClient.ts`

**Step 1: Understand existing pattern**

CPF LIFE already flows via `postRetirementIncome` (as seen in MC engine lines 414-418). SRS withdrawals now land in `governmentIncome` via the income projection (from Task 3.4). Since `useMonteCarloQuery` already sums `row.governmentIncome` into `postRetirementIncome`, **SRS should flow through automatically** once Task 3.4 is complete.

**Step 2: Verify with a test**

Write an integration-style test that:
1. Creates an income projection with SRS balance > 0
2. Checks that `postRetirementIncome` during drawdown years includes SRS withdrawal
3. Verifies SRS stops after 10 years

**Step 3: If SRS does NOT flow through automatically**, manually add it:
- In `useMonteCarloQuery.ts`, when building `postRetirementIncome`, add SRS withdrawal from the income projection row
- Same for backtest and sequence risk hooks

**Step 4: Run all simulation tests**

Run: `cd frontend && npx vitest run src/lib/simulation/ --reporter=verbose`

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: verify SRS drawdowns flow through simulation engines as fixed income"
```

---

### Task 3.6: SRS UI — Investment Return Input + Dynamic Tooltip

**Files:**
- Modify: `frontend/src/components/profile/FinancialSection.tsx`

**Step 1: Add SRS investment return input (Advanced mode only)**

```tsx
import { useEffectiveMode } from '@/hooks/useEffectiveMode'
import { PercentInput } from '@/components/shared/PercentInput'

// Inside the component:
const mode = useEffectiveMode()

// After the SRS Annual Contribution input (line 56), add:
{mode === 'advanced' && (
  <>
    <PercentInput
      label="SRS Investment Return"
      value={store.srsInvestmentReturn}
      onChange={(v) => store.setField('srsInvestmentReturn', v)}
      tooltip="Expected return on SRS investments. Default 4% assumes a balanced portfolio."
    />
    <NumberInput
      label="SRS Drawdown Start Age"
      value={store.srsDrawdownStartAge}
      onChange={(v) => store.setField('srsDrawdownStartAge', v)}
      tooltip="Age to begin SRS withdrawals. Default 63 (current statutory retirement age). The actual age depends on when your SRS account was opened."
      min={55}
      max={75}
    />
  </>
)}
```

**Step 2: Commit**

```bash
git add frontend/src/components/profile/FinancialSection.tsx
git commit -m "feat: add SRS investment return and drawdown age inputs (Advanced mode)"
```

---

## Phase 4: HDB Sale-and-Rent + CPF Refund

### Task 4.1: Create HDB Data and Calculation Module — Tests First

**Files:**
- Create: `frontend/src/lib/data/hdbRates.ts`
- Create: `frontend/src/lib/calculations/hdb.ts`
- Create: `frontend/src/lib/calculations/__tests__/hdb.test.ts`

**Step 1: Create data file**

```typescript
// frontend/src/lib/data/hdbRates.ts
// Source: HDB website (https://www.hdb.gov.sg)
// Last updated: 2026-02-21

export type HdbFlatType = '2-room' | '3-room' | '4-room' | '5-room' | 'executive'

export const LBS_RETAINED_LEASE_OPTIONS = [20, 25, 30, 35] as const

/**
 * Indicative subletting rates by flat type (SGD/room/month).
 * For placeholder suggestions only — actual rates are user-input.
 */
export const SUBLETTING_RATE_SUGGESTIONS: Record<HdbFlatType, { low: number; high: number }> = {
  '2-room': { low: 500, high: 800 },
  '3-room': { low: 600, high: 1000 },
  '4-room': { low: 700, high: 1200 },
  '5-room': { low: 800, high: 1500 },
  'executive': { low: 900, high: 1800 },
}

/** CPF OA interest rate for accrued interest calculation */
export const CPF_OA_RATE = 0.025
```

**Step 2: Write failing tests**

```typescript
// hdb.test.ts
import { describe, it, expect } from 'vitest'
import { computeHdbCpfRefund, computeHdbSublettingIncome } from '../hdb'

describe('computeHdbCpfRefund', () => {
  it('calculates refund with accrued interest', () => {
    // $100K used for housing over 10 years at 2.5% OA rate
    const result = computeHdbCpfRefund({
      cpfUsedForHousing: 100000,
      yearsOfMortgage: 10,
      oaInterestRate: 0.025,
    })
    // Simple approximation: 100000 * (1.025^10 - 1) = ~28008 interest
    // Total refund = 100000 + 28008 = ~128008
    expect(result.totalRefund).toBeGreaterThan(100000)
    expect(result.principalUsed).toBe(100000)
    expect(result.accruedInterest).toBeGreaterThan(0)
  })

  it('returns zero for zero CPF used', () => {
    const result = computeHdbCpfRefund({
      cpfUsedForHousing: 0,
      yearsOfMortgage: 10,
      oaInterestRate: 0.025,
    })
    expect(result.totalRefund).toBe(0)
  })
})

describe('computeHdbSublettingIncome', () => {
  it('calculates annual income from room rental', () => {
    const result = computeHdbSublettingIncome({
      rooms: 2,
      monthlyRate: 1000,
    })
    expect(result.annualGross).toBe(24000)
    expect(result.annualNet).toBe(24000) // No deductions for HDB
    expect(result.taxImpact).toBe(24000) // Fully taxable
  })
})
```

**Step 3: Run to verify failure**

Run: `cd frontend && npx vitest run src/lib/calculations/__tests__/hdb.test.ts --reporter=verbose`

**Step 4: Implement**

```typescript
// frontend/src/lib/calculations/hdb.ts

import { CPF_OA_RATE } from '@/lib/data/hdbRates'

interface CpfRefundParams {
  cpfUsedForHousing: number
  yearsOfMortgage: number
  oaInterestRate?: number
}

interface CpfRefundResult {
  principalUsed: number
  accruedInterest: number
  totalRefund: number
}

/**
 * Calculate CPF refund required when selling HDB.
 * Refund = principal used for housing + accrued interest at OA rate.
 */
export function computeHdbCpfRefund(params: CpfRefundParams): CpfRefundResult {
  const { cpfUsedForHousing, yearsOfMortgage, oaInterestRate = CPF_OA_RATE } = params

  if (cpfUsedForHousing <= 0) {
    return { principalUsed: 0, accruedInterest: 0, totalRefund: 0 }
  }

  // Accrued interest = compound interest on the CPF amount used
  const accruedInterest = cpfUsedForHousing * (Math.pow(1 + oaInterestRate, yearsOfMortgage) - 1)

  return {
    principalUsed: cpfUsedForHousing,
    accruedInterest,
    totalRefund: cpfUsedForHousing + accruedInterest,
  }
}

interface SublettingParams {
  rooms: number
  monthlyRate: number
}

interface SublettingResult {
  annualGross: number
  annualNet: number
  taxImpact: number
}

/**
 * Calculate HDB subletting income.
 * No property tax deductions for HDB owner-occupied.
 * Rental income is fully taxable.
 */
export function computeHdbSublettingIncome(params: SublettingParams): SublettingResult {
  const { rooms, monthlyRate } = params
  const annualGross = rooms * monthlyRate * 12

  return {
    annualGross,
    annualNet: annualGross, // No deductions for HDB
    taxImpact: annualGross, // Fully taxable
  }
}
```

**Step 5: Run tests**

Run: `cd frontend && npx vitest run src/lib/calculations/__tests__/hdb.test.ts --reporter=verbose`
Expected: All PASS.

**Step 6: Commit**

```bash
git add frontend/src/lib/data/hdbRates.ts frontend/src/lib/calculations/hdb.ts frontend/src/lib/calculations/__tests__/hdb.test.ts
git commit -m "feat: add HDB CPF refund and subletting income calculations"
```

---

### Task 4.2: Extend `calculateSellAndRent` with CPF Refund

**Files:**
- Modify: `frontend/src/lib/calculations/property.ts`
- Modify: `frontend/src/lib/calculations/__tests__/property.test.ts`

**Step 1: Write failing test**

```typescript
// In property.test.ts, add:
describe('calculateSellAndRent with CPF refund', () => {
  it('deducts CPF refund from net proceeds', () => {
    const result = calculateSellAndRent({
      salePrice: 800000,
      outstandingMortgage: 200000,
      monthlyRent: 2500,
      cpfRefund: 150000, // NEW optional param
    })
    // Without refund: net = 800000 - 200000 = 600000
    // With refund: net = 800000 - 200000 - 150000 = 450000
    expect(result.netProceedsToPortfolio).toBe(450000)
    expect(result.annualRent).toBe(30000)
  })

  it('handles zero CPF refund (backwards compatible)', () => {
    const result = calculateSellAndRent({
      salePrice: 800000,
      outstandingMortgage: 200000,
      monthlyRent: 2500,
    })
    expect(result.netProceedsToPortfolio).toBe(600000)
  })
})
```

**Step 2: Implement**

```typescript
// property.ts — extend calculateSellAndRent parameter type:
export function calculateSellAndRent(params: {
  salePrice: number
  outstandingMortgage: number
  monthlyRent: number
  cpfRefund?: number  // NEW — optional, backwards compatible
}): SellAndRentResult {
  const { salePrice, outstandingMortgage, monthlyRent, cpfRefund = 0 } = params
  const grossProceeds = salePrice
  const netProceedsToPortfolio = Math.max(0, salePrice - outstandingMortgage - cpfRefund)
  const annualRent = monthlyRent * 12
  return { grossProceeds, outstandingMortgage, netProceedsToPortfolio, annualRent }
}
```

**Step 3: Run tests**

Run: `cd frontend && npx vitest run src/lib/calculations/__tests__/property.test.ts --reporter=verbose`

**Step 4: Commit**

```bash
git add frontend/src/lib/calculations/property.ts frontend/src/lib/calculations/__tests__/property.test.ts
git commit -m "feat: extend calculateSellAndRent with optional CPF refund deduction"
```

---

### Task 4.3: Add HDB Fields to Property Store

**Files:**
- Modify: `frontend/src/stores/usePropertyStore.ts`
- Modify: `frontend/src/lib/types.ts` (add fields to PropertyState interface)

**Step 1: Add fields**

```typescript
// In types.ts PropertyState interface, add:
hdbFlatType: HdbFlatType
hdbMonetizationStrategy: 'none' | 'lbs' | 'sublet' | 'sell-and-rent'
hdbLbsRetainedLease: number
hdbSublettingRooms: number
hdbSublettingRate: number
hdbCpfUsedForHousing: number

// In usePropertyStore.ts DEFAULT_PROPERTY, add:
hdbFlatType: '4-room',
hdbMonetizationStrategy: 'none',
hdbLbsRetainedLease: 30,
hdbSublettingRooms: 1,
hdbSublettingRate: 800,
hdbCpfUsedForHousing: 0,

// In PROPERTY_DATA_KEYS, add:
'hdbFlatType', 'hdbMonetizationStrategy', 'hdbLbsRetainedLease',
'hdbSublettingRooms', 'hdbSublettingRate', 'hdbCpfUsedForHousing',

// Bump version 3 → 4, add migration:
if (version < 4) {
  state.hdbFlatType ??= '4-room'
  state.hdbMonetizationStrategy ??= 'none'
  state.hdbLbsRetainedLease ??= 30
  state.hdbSublettingRooms ??= 1
  state.hdbSublettingRate ??= 800
  state.hdbCpfUsedForHousing ??= 0
}
```

**Step 2: Run type-check**

Run: `cd frontend && npm run type-check`

**Step 3: Commit**

```bash
git add frontend/src/stores/usePropertyStore.ts frontend/src/lib/types.ts
git commit -m "feat: add HDB monetization fields to property store"
```

---

### Task 4.4: HDB Monetization UI in Property Section

**Files:**
- Modify: `frontend/src/components/property/PropertyInputForm.tsx` (or create `HdbMonetizationSection.tsx`)
- Modify: `frontend/src/pages/InputsPage.tsx` (if needed to wire in)

**Step 1: Add HDB monetization sub-section**

When `propertyType === 'hdb'` and `ownsProperty === true`, show:
- HDB flat type selector (2-room through Executive)
- Monetization strategy selector (None / Sublet / Sell & Rent / LBS)
- Conditional inputs based on strategy:
  - **Sublet**: rooms (1-3), monthly rate (with placeholder from `SUBLETTING_RATE_SUGGESTIONS`)
  - **Sell & Rent**: extends existing downsizing sell-and-rent + CPF refund input
  - **LBS**: retained lease selector, market value input (deferred to Phase 6)
- Results summary card showing key metric per strategy

Use `useEffectiveMode()` to gate detail level:
- Simple: strategy selector + one-line result summary
- Advanced: full parameter inputs + break-even analysis

**Step 2: Wire CPF refund into sell-and-rent**

When HDB sell-and-rent is selected, compute CPF refund from `hdbCpfUsedForHousing` and pass to `calculateSellAndRent`:
```typescript
const cpfRefund = computeHdbCpfRefund({
  cpfUsedForHousing: property.hdbCpfUsedForHousing,
  yearsOfMortgage: property.existingMortgageRemainingYears,
}).totalRefund

const result = calculateSellAndRent({
  salePrice: downsizing.expectedSalePrice,
  outstandingMortgage: property.existingMortgageBalance,
  monthlyRent: downsizing.monthlyRent,
  cpfRefund,
})
```

**Step 3: Verify visually**

Run dev server, navigate to Property section, select "HDB", toggle "I own property", verify monetization options appear.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add HDB monetization UI with CPF refund integration"
```

---

## Phase 5: HDB Subletting Income Integration

### Task 5.1: Wire Subletting into Projection Pipeline

**Files:**
- Modify: `frontend/src/hooks/useProjection.ts` (or `income.ts`)
- Modify: Relevant projection components

**Step 1: Add subletting as income stream**

When `hdbMonetizationStrategy === 'sublet'`, compute annual subletting income and add it to `rentalIncome` in the projection rows (starting from configured start age, presumably current age since subletting can start immediately).

```typescript
// In the projection pipeline:
if (property.propertyType === 'hdb' && property.hdbMonetizationStrategy === 'sublet') {
  const subletting = computeHdbSublettingIncome({
    rooms: property.hdbSublettingRooms,
    monthlyRate: property.hdbSublettingRate,
  })
  row.rentalIncome += subletting.annualGross
}
```

**Step 2: Test and commit**

Run: `cd frontend && npm run type-check && npm run test`

```bash
git add -A
git commit -m "feat: integrate HDB subletting income into projection pipeline"
```

---

## Phase 6: HDB Lease Buyback Scheme

### Task 6.1: LBS Calculation — Tests First

**Files:**
- Modify: `frontend/src/lib/calculations/hdb.ts`
- Modify: `frontend/src/lib/calculations/__tests__/hdb.test.ts`

**Step 1: Write failing tests**

```typescript
describe('computeLbsProceeds', () => {
  it('calculates proceeds from selling tail-end lease', () => {
    const result = computeLbsProceeds({
      flatValue: 500000,
      remainingLease: 60,
      retainedLease: 30,
      currentAge: 65,
      cpfRaBalance: 100000,
      retirementSum: 213000, // FRS
    })
    // Proceeds based on Bala's Table factor difference
    expect(result.totalProceeds).toBeGreaterThan(0)
    expect(result.cpfRaTopUp).toBeLessThanOrEqual(213000 - 100000)
    expect(result.cashProceeds).toBeGreaterThanOrEqual(0)
    expect(result.totalProceeds).toBe(result.cpfRaTopUp + result.cashProceeds)
  })
})
```

**Step 2: Implement using existing Bala's Table**

```typescript
import { leaseDecayFactor } from './property'

interface LbsParams {
  flatValue: number
  remainingLease: number
  retainedLease: number
  currentAge: number
  cpfRaBalance: number
  retirementSum: number
}

interface LbsResult {
  totalProceeds: number
  cpfRaTopUp: number
  cashProceeds: number
  estimatedLifeBoost: number
}

export function computeLbsProceeds(params: LbsParams): LbsResult {
  const { flatValue, remainingLease, retainedLease, cpfRaBalance, retirementSum } = params

  // Proceeds = value of lease sold (tail end)
  const currentFactor = leaseDecayFactor(remainingLease)
  const retainedFactor = leaseDecayFactor(retainedLease)
  const totalProceeds = Math.max(0, flatValue * (currentFactor - retainedFactor))

  // CPF RA top-up: up to shortfall of retirement sum
  const raShortfall = Math.max(0, retirementSum - cpfRaBalance)
  const cpfRaTopUp = Math.min(totalProceeds, raShortfall)
  const cashProceeds = totalProceeds - cpfRaTopUp

  // Estimated LIFE boost from RA top-up (rough: ~6% of top-up / 12 per month)
  const estimatedLifeBoost = cpfRaTopUp * 0.063 / 12

  return { totalProceeds, cpfRaTopUp, cashProceeds, estimatedLifeBoost }
}
```

**Step 3: Run tests, commit**

```bash
git add frontend/src/lib/calculations/hdb.ts frontend/src/lib/calculations/__tests__/hdb.test.ts
git commit -m "feat: add Lease Buyback Scheme calculation using Bala's Table"
```

---

### Task 6.2: LBS UI and Projection Integration

**Files:**
- Modify: HDB monetization UI component (from Task 4.4)
- Modify: Projection pipeline

**Step 1: Add LBS inputs**

When `hdbMonetizationStrategy === 'lbs'`:
- Show retained lease selector (dropdown: 20/25/30/35 years)
- Show estimated flat value input (with tooltip about market vs assessed value)
- Show results card: total proceeds, CPF RA top-up, cash, estimated LIFE boost

**Step 2: Wire into projection**

LBS triggers as a lump sum event at `downsizing.sellAge`:
- Cash proceeds → add to portfolio balance at that year
- CPF RA top-up → increase CPF RA balance, which flows into enhanced CPF LIFE payout
- Enhanced LIFE payout → already flows through `governmentIncome` in the projection

**Step 3: Test and commit**

```bash
git add -A
git commit -m "feat: add LBS UI with projection integration"
```

---

## Final Verification

After all phases:

1. **Type-check:** `cd frontend && npm run type-check` — zero errors
2. **Lint:** `cd frontend && npm run lint` — passes
3. **Tests:** `cd frontend && npm run test` — all green
4. **Coverage:** `cd frontend && npm run test:coverage` — calculations ≥ 95%
5. **Manual Simple mode test:** New user → StartPage → 5 inputs → sees Quick Plan results → navigate to /inputs in Simple mode → ≤ 20 visible inputs → run MC → success rate
6. **Manual Advanced mode test:** Toggle to Advanced → all 12 strategies visible → full allocation builder → SRS fields appear → HDB monetization with CPF refund
7. **SRS end-to-end:** Set SRS balance $200K, contribution $15K/yr, age 30 → projection shows SRS growing → at age 63, drawdown starts → 50% tax concession applied → MC success rate accounts for SRS income
8. **HDB end-to-end:** Select HDB, own property, sell-and-rent strategy → enter CPF used for housing → verify net proceeds reduced by CPF refund → projection shows rental expense

---

## Deferred (Not in This Plan)

- Per-section Simple/Advanced overrides
- Contextual explanation panel (right 1/3)
- SRS tax-bracket-optimized unequal drawdowns
- HDB CPF refund mini-calculator
- HDB monetization strategy combinations
- Silver Housing Bonus (P4 of HDB)
