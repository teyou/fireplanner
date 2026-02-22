# Per-Section Simple/Advanced Mode + Contextual Nudges — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade the global Simple/Advanced toggle to per-section controls with static labels and data-driven contextual nudges across all 10 sidebar sections.

**Architecture:** Extend `useUIStore` with `sectionOverrides` map and `dismissedNudges` array. Upgrade `useEffectiveMode(section?)` to check overrides before global fallback. New `useSectionNudge` hook computes triggers per-section using existing store data and calculation functions. New `SectionNudge` component renders dismissible inline banners. InputsPage section headers gain "Advanced: ..." toggle links. Projection and Stress Test pages gain mode gating.

**Tech Stack:** React 18, TypeScript, Zustand 5, Vitest, existing `tax.ts`/`fire.ts` calculation functions.

**Design doc:** `docs/plans/2026-02-22-per-section-mode-guidance-design.md`

---

## Task 1: Extend useUIStore with Section Overrides

**Files:**
- Modify: `frontend/src/stores/useUIStore.ts`
- Create: `frontend/src/stores/useUIStore.test.ts`

**Step 1: Write the failing test**

```typescript
// frontend/src/stores/useUIStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from './useUIStore'

describe('useUIStore v4 — section overrides', () => {
  beforeEach(() => {
    useUIStore.setState({
      sectionOrder: 'goal-first',
      statsPosition: 'bottom',
      cpfEnabled: true,
      propertyEnabled: false,
      healthcareEnabled: false,
      mode: 'simple',
      sectionOverrides: {},
      dismissedNudges: [],
    })
  })

  it('defaults sectionOverrides to empty object', () => {
    expect(useUIStore.getState().sectionOverrides).toEqual({})
  })

  it('defaults dismissedNudges to empty array', () => {
    expect(useUIStore.getState().dismissedNudges).toEqual([])
  })

  it('setSectionMode sets an override for a section', () => {
    useUIStore.getState().setSectionMode('section-income', 'advanced')
    expect(useUIStore.getState().sectionOverrides).toEqual({ 'section-income': 'advanced' })
  })

  it('setSectionMode toggles back to simple', () => {
    useUIStore.getState().setSectionMode('section-income', 'advanced')
    useUIStore.getState().setSectionMode('section-income', 'simple')
    expect(useUIStore.getState().sectionOverrides).toEqual({ 'section-income': 'simple' })
  })

  it('clearSectionOverrides resets all overrides', () => {
    useUIStore.getState().setSectionMode('section-income', 'advanced')
    useUIStore.getState().setSectionMode('section-cpf', 'advanced')
    useUIStore.getState().clearSectionOverrides()
    expect(useUIStore.getState().sectionOverrides).toEqual({})
  })

  it('dismissNudge adds nudge ID to dismissed list', () => {
    useUIStore.getState().dismissNudge('income-srs-tax')
    expect(useUIStore.getState().dismissedNudges).toContain('income-srs-tax')
  })

  it('dismissNudge does not duplicate IDs', () => {
    useUIStore.getState().dismissNudge('income-srs-tax')
    useUIStore.getState().dismissNudge('income-srs-tax')
    expect(useUIStore.getState().dismissedNudges.filter((id) => id === 'income-srs-tax')).toHaveLength(1)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/stores/useUIStore.test.ts`
Expected: FAIL — `setSectionMode`, `clearSectionOverrides`, `dismissNudge` not defined. `sectionOverrides` and `dismissedNudges` not in state.

**Step 3: Write minimal implementation**

In `frontend/src/stores/useUIStore.ts`, make these changes:

1. Add to `UIState` interface:
```typescript
sectionOverrides: Partial<Record<string, 'simple' | 'advanced'>>
dismissedNudges: string[]
```

2. Add to `UIActions` interface:
```typescript
setSectionMode: (section: string, mode: 'simple' | 'advanced') => void
clearSectionOverrides: () => void
dismissNudge: (nudgeId: string) => void
```

3. Add to `DEFAULT_UI`:
```typescript
sectionOverrides: {},
dismissedNudges: [],
```

4. Add action implementations inside `create(persist((set, get) => ({`:
```typescript
setSectionMode: (section, mode) =>
  set((state) => ({
    sectionOverrides: { ...state.sectionOverrides, [section]: mode },
  })),

clearSectionOverrides: () => set({ sectionOverrides: {} }),

dismissNudge: (nudgeId) =>
  set((state) => ({
    dismissedNudges: state.dismissedNudges.includes(nudgeId)
      ? state.dismissedNudges
      : [...state.dismissedNudges, nudgeId],
  })),
```

5. Bump version to `4` and add migration:
```typescript
if (version < 4) {
  state.sectionOverrides = {}
  state.dismissedNudges = []
}
```

6. Update the global mode toggle interaction. Change `setField` for `mode` to also clear overrides by replacing the generic `setField` with one that calls `clearSectionOverrides` when `mode` changes:

In the `setField` implementation, wrap it to detect mode changes:
```typescript
setField: (field, value) => {
  if (field === 'mode') {
    set({ [field]: value, sectionOverrides: {} })
  } else {
    set({ [field]: value })
  }
},
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/stores/useUIStore.test.ts`
Expected: PASS — all 7 tests green.

**Step 5: Run full test suite**

Run: `cd frontend && npx vitest run`
Expected: All existing tests still pass.

**Step 6: Commit**

```bash
git add frontend/src/stores/useUIStore.ts frontend/src/stores/useUIStore.test.ts
git commit -m "feat: extend useUIStore with sectionOverrides and dismissedNudges (v4)"
```

---

## Task 2: Upgrade useEffectiveMode with Section Parameter

**Files:**
- Modify: `frontend/src/hooks/useEffectiveMode.ts`
- Create: `frontend/src/hooks/useEffectiveMode.test.ts`

**Step 1: Write the failing test**

```typescript
// frontend/src/hooks/useEffectiveMode.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useEffectiveMode, type ModeSectionId } from './useEffectiveMode'
import { useUIStore } from '@/stores/useUIStore'

describe('useEffectiveMode', () => {
  beforeEach(() => {
    useUIStore.setState({
      mode: 'simple',
      sectionOverrides: {},
      dismissedNudges: [],
      sectionOrder: 'goal-first',
      statsPosition: 'bottom',
      cpfEnabled: true,
      propertyEnabled: false,
      healthcareEnabled: false,
    })
  })

  it('returns global mode when called without section', () => {
    const { result } = renderHook(() => useEffectiveMode())
    expect(result.current).toBe('simple')
  })

  it('returns global mode when section has no override', () => {
    const { result } = renderHook(() => useEffectiveMode('section-income'))
    expect(result.current).toBe('simple')
  })

  it('returns section override when one exists', () => {
    useUIStore.setState({
      sectionOverrides: { 'section-income': 'advanced' },
    })
    const { result } = renderHook(() => useEffectiveMode('section-income'))
    expect(result.current).toBe('advanced')
  })

  it('returns global mode for sections without override even when other sections have overrides', () => {
    useUIStore.setState({
      sectionOverrides: { 'section-income': 'advanced' },
    })
    const { result } = renderHook(() => useEffectiveMode('section-cpf'))
    expect(result.current).toBe('simple')
  })

  it('returns advanced global mode when no overrides exist', () => {
    useUIStore.setState({ mode: 'advanced' })
    const { result } = renderHook(() => useEffectiveMode('section-income'))
    expect(result.current).toBe('advanced')
  })

  it('override can downgrade from global advanced to section simple', () => {
    useUIStore.setState({
      mode: 'advanced',
      sectionOverrides: { 'section-allocation': 'simple' },
    })
    const { result } = renderHook(() => useEffectiveMode('section-allocation'))
    expect(result.current).toBe('simple')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/hooks/useEffectiveMode.test.ts`
Expected: FAIL — `useEffectiveMode` doesn't accept a parameter, `ModeSectionId` not exported.

**Step 3: Write minimal implementation**

Replace `frontend/src/hooks/useEffectiveMode.ts`:

```typescript
import { useUIStore } from '@/stores/useUIStore'

/**
 * All sections that have simple/advanced content gating.
 * Superset of InputsPage SectionId — includes results pages.
 */
export type ModeSectionId =
  | 'section-fire-settings'
  | 'section-income'
  | 'section-expenses'
  | 'section-net-worth'
  | 'section-cpf'
  | 'section-property'
  | 'section-allocation'
  | 'section-projection'
  | 'section-stress-test'

/**
 * Returns the effective UI mode for a given section.
 * Checks section overrides first, falls back to global mode.
 */
export function useEffectiveMode(section?: ModeSectionId): 'simple' | 'advanced' {
  const globalMode = useUIStore((s) => s.mode)
  const overrides = useUIStore((s) => s.sectionOverrides)

  if (section && overrides[section]) {
    return overrides[section]!
  }
  return globalMode
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

**Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/hooks/useEffectiveMode.test.ts`
Expected: PASS — all 6 tests green.

**Step 5: Run full test suite to check nothing breaks**

Run: `cd frontend && npx vitest run`
Expected: All existing tests pass. Existing call sites use `useEffectiveMode()` with no arguments, which still works.

**Step 6: Commit**

```bash
git add frontend/src/hooks/useEffectiveMode.ts frontend/src/hooks/useEffectiveMode.test.ts
git commit -m "feat: upgrade useEffectiveMode with optional section parameter"
```

---

## Task 3: Create SectionNudge Component

**Files:**
- Create: `frontend/src/components/shared/SectionNudge.tsx`

**Step 1: Create the component**

```typescript
// frontend/src/components/shared/SectionNudge.tsx
import { X, Lightbulb } from 'lucide-react'
import { useUIStore } from '@/stores/useUIStore'
import type { ModeSectionId } from '@/hooks/useEffectiveMode'

interface SectionNudgeProps {
  nudgeId: string
  sectionId: ModeSectionId
  message: string
  actionLabel: string
}

export function SectionNudge({ nudgeId, sectionId, message, actionLabel }: SectionNudgeProps) {
  const dismissNudge = useUIStore((s) => s.dismissNudge)
  const setSectionMode = useUIStore((s) => s.setSectionMode)

  const handleAction = () => {
    setSectionMode(sectionId, 'advanced')
  }

  const handleDismiss = () => {
    dismissNudge(nudgeId)
  }

  return (
    <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
      <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <span className="text-foreground">{message} </span>
        <button
          onClick={handleAction}
          className="text-primary font-medium hover:underline"
        >
          {actionLabel} &rarr;
        </button>
      </div>
      <button
        onClick={handleDismiss}
        className="text-muted-foreground hover:text-foreground shrink-0"
        aria-label="Dismiss suggestion"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/shared/SectionNudge.tsx
git commit -m "feat: add SectionNudge dismissible banner component"
```

---

## Task 4: Create useSectionNudge Hook with All 9 Triggers

**Files:**
- Create: `frontend/src/hooks/useSectionNudge.ts`
- Create: `frontend/src/hooks/useSectionNudge.test.ts`

**Step 1: Write the failing tests**

```typescript
// frontend/src/hooks/useSectionNudge.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSectionNudge } from './useSectionNudge'
import { useUIStore } from '@/stores/useUIStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { usePropertyStore } from '@/stores/usePropertyStore'
import { useSimulationStore } from '@/stores/useSimulationStore'

// Helper to set up stores with clean defaults
function resetStores() {
  useUIStore.setState({
    mode: 'simple',
    sectionOverrides: {},
    dismissedNudges: [],
    cpfEnabled: true,
    propertyEnabled: false,
    healthcareEnabled: false,
    sectionOrder: 'goal-first',
    statsPosition: 'bottom',
  })
}

describe('useSectionNudge', () => {
  beforeEach(() => {
    resetStores()
  })

  it('returns null when section is in advanced mode', () => {
    useUIStore.setState({ sectionOverrides: { 'section-income': 'advanced' } })
    useProfileStore.setState({ annualIncome: 200000 })
    const { result } = renderHook(() => useSectionNudge('section-income'))
    expect(result.current).toBeNull()
  })

  it('returns null when nudge has been dismissed', () => {
    useUIStore.setState({ dismissedNudges: ['income-srs-tax'] })
    useProfileStore.setState({ annualIncome: 200000 })
    const { result } = renderHook(() => useSectionNudge('section-income'))
    expect(result.current).toBeNull()
  })

  // --- Income nudge ---
  it('returns income SRS nudge when tax savings > $1000', () => {
    // $150K income → chargeable ~$132,680 → marginal 15% → SRS saves ~$2,295
    useProfileStore.setState({ annualIncome: 150000, currentAge: 35 })
    const { result } = renderHook(() => useSectionNudge('section-income'))
    expect(result.current).not.toBeNull()
    expect(result.current!.id).toBe('income-srs-tax')
    expect(result.current!.message).toContain('SRS')
  })

  it('returns null for income nudge when income is low', () => {
    useProfileStore.setState({ annualIncome: 50000, currentAge: 30 })
    const { result } = renderHook(() => useSectionNudge('section-income'))
    expect(result.current).toBeNull()
  })

  // --- Expenses nudge ---
  it('returns expenses nudge when retirement duration > 30 years', () => {
    useProfileStore.setState({ retirementAge: 45, lifeExpectancy: 90 })
    const { result } = renderHook(() => useSectionNudge('section-expenses'))
    expect(result.current).not.toBeNull()
    expect(result.current!.id).toBe('expenses-long-retirement')
  })

  it('returns null for expenses nudge when retirement duration <= 30', () => {
    useProfileStore.setState({ retirementAge: 60, lifeExpectancy: 85 })
    const { result } = renderHook(() => useSectionNudge('section-expenses'))
    expect(result.current).toBeNull()
  })

  // --- CPF nudge ---
  it('returns CPF nudge when age >= 45', () => {
    useProfileStore.setState({ currentAge: 45, cpfOA: 50000, cpfSA: 50000, liquidNetWorth: 200000 })
    const { result } = renderHook(() => useSectionNudge('section-cpf'))
    expect(result.current).not.toBeNull()
    expect(result.current!.id).toBe('cpf-projections')
  })

  it('returns CPF nudge when CPF OA+SA > $150K even if young', () => {
    useProfileStore.setState({ currentAge: 35, cpfOA: 100000, cpfSA: 60000, liquidNetWorth: 200000 })
    const { result } = renderHook(() => useSectionNudge('section-cpf'))
    expect(result.current).not.toBeNull()
  })

  it('returns null for CPF nudge when young and low CPF', () => {
    useProfileStore.setState({ currentAge: 30, cpfOA: 20000, cpfSA: 10000, liquidNetWorth: 100000 })
    const { result } = renderHook(() => useSectionNudge('section-cpf'))
    expect(result.current).toBeNull()
  })

  // --- Net Worth SRS nudge ---
  it('returns net worth nudge when SRS balance > 0 and contributing', () => {
    useProfileStore.setState({ srsBalance: 10000, srsAnnualContribution: 15300 })
    const { result } = renderHook(() => useSectionNudge('section-net-worth'))
    expect(result.current).not.toBeNull()
    expect(result.current!.id).toBe('networth-srs-planning')
  })

  it('returns null for net worth nudge when no SRS', () => {
    useProfileStore.setState({ srsBalance: 0, srsAnnualContribution: 0 })
    const { result } = renderHook(() => useSectionNudge('section-net-worth'))
    expect(result.current).toBeNull()
  })

  // --- Property nudge ---
  it('returns HDB monetization nudge when user owns HDB', () => {
    usePropertyStore.setState({ ownsProperty: true, propertyType: 'hdb' })
    const { result } = renderHook(() => useSectionNudge('section-property'))
    expect(result.current).not.toBeNull()
    expect(result.current!.id).toBe('property-hdb-monetization')
  })

  // --- Allocation nudge ---
  it('returns allocation nudge when retirement <= 15 years away', () => {
    useProfileStore.setState({ currentAge: 45, retirementAge: 55 })
    const { result } = renderHook(() => useSectionNudge('section-allocation'))
    expect(result.current).not.toBeNull()
    expect(result.current!.id).toBe('allocation-glide-path')
  })

  it('returns null for allocation nudge when retirement is far', () => {
    useProfileStore.setState({ currentAge: 30, retirementAge: 60 })
    const { result } = renderHook(() => useSectionNudge('section-allocation'))
    expect(result.current).toBeNull()
  })

  // --- Projection nudge ---
  it('returns projection nudge when CPF is enabled', () => {
    useUIStore.setState({ cpfEnabled: true })
    const { result } = renderHook(() => useSectionNudge('section-projection'))
    expect(result.current).not.toBeNull()
    expect(result.current!.id).toBe('projection-detail-columns')
  })

  // --- Stress Test nudge ---
  it('returns stress test nudge when MC success < 95%', () => {
    useSimulationStore.setState({ lastMCSuccessRate: 0.82 })
    const { result } = renderHook(() => useSectionNudge('section-stress-test'))
    expect(result.current).not.toBeNull()
    expect(result.current!.id).toBe('stresstest-deep-analysis')
  })

  it('returns null for stress test nudge when MC success >= 95%', () => {
    useSimulationStore.setState({ lastMCSuccessRate: 0.97 })
    const { result } = renderHook(() => useSectionNudge('section-stress-test'))
    expect(result.current).toBeNull()
  })

  it('returns null for stress test nudge when no MC has been run', () => {
    useSimulationStore.setState({ lastMCSuccessRate: null })
    const { result } = renderHook(() => useSectionNudge('section-stress-test'))
    expect(result.current).toBeNull()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/hooks/useSectionNudge.test.ts`
Expected: FAIL — module not found.

**Step 3: Write the implementation**

```typescript
// frontend/src/hooks/useSectionNudge.ts
import { useMemo } from 'react'
import { useUIStore } from '@/stores/useUIStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { usePropertyStore } from '@/stores/usePropertyStore'
import { useSimulationStore } from '@/stores/useSimulationStore'
import { useEffectiveMode, type ModeSectionId } from '@/hooks/useEffectiveMode'
import { calculateProgressiveTax } from '@/lib/calculations/tax'
import { getCpfRatesForAge, OW_CEILING_ANNUAL } from '@/lib/data/cpfRates'
import { earnedIncomeReliefForAge } from '@/lib/data/taxBrackets'
import { formatCurrency } from '@/lib/utils'

export interface SectionNudgeData {
  id: string
  sectionId: ModeSectionId
  message: string
  actionLabel: string
}

export function useSectionNudge(sectionId: ModeSectionId): SectionNudgeData | null {
  const mode = useEffectiveMode(sectionId)
  const dismissedNudges = useUIStore((s) => s.dismissedNudges)

  // Profile store selectors
  const annualIncome = useProfileStore((s) => s.annualIncome)
  const currentAge = useProfileStore((s) => s.currentAge)
  const retirementAge = useProfileStore((s) => s.retirementAge)
  const lifeExpectancy = useProfileStore((s) => s.lifeExpectancy)
  const liquidNetWorth = useProfileStore((s) => s.liquidNetWorth)
  const cpfOA = useProfileStore((s) => s.cpfOA)
  const cpfSA = useProfileStore((s) => s.cpfSA)
  const cpfMA = useProfileStore((s) => s.cpfMA)
  const srsBalance = useProfileStore((s) => s.srsBalance)
  const srsAnnualContribution = useProfileStore((s) => s.srsAnnualContribution)
  const fireType = useProfileStore((s) => s.fireType)

  // Property store selectors
  const ownsProperty = usePropertyStore((s) => s.ownsProperty)
  const propertyType = usePropertyStore((s) => s.propertyType)

  // Simulation store selectors
  const lastMCSuccessRate = useSimulationStore((s) => s.lastMCSuccessRate)

  // UI store selectors
  const cpfEnabled = useUIStore((s) => s.cpfEnabled)

  return useMemo(() => {
    // Don't show nudge if section is already advanced
    if (mode === 'advanced') return null

    switch (sectionId) {
      case 'section-income': {
        const nudgeId = 'income-srs-tax'
        if (dismissedNudges.includes(nudgeId)) return null

        // Compute SRS tax savings using actual tax functions
        const rates = getCpfRatesForAge(currentAge)
        const cpfEmployee = Math.min(annualIncome, OW_CEILING_ANNUAL) * rates.employeeRate
        const earnedRelief = earnedIncomeReliefForAge(currentAge)
        const chargeableWithout = Math.max(0, annualIncome - cpfEmployee - earnedRelief)
        const chargeableWith = Math.max(0, chargeableWithout - 15300)
        const taxWithout = calculateProgressiveTax(chargeableWithout).taxPayable
        const taxWith = calculateProgressiveTax(chargeableWith).taxPayable
        const savings = taxWithout - taxWith

        if (savings <= 1000) return null
        return {
          id: nudgeId,
          sectionId,
          message: `Contributing $15,300 to SRS could save ~${formatCurrency(Math.round(savings))}/yr in tax.`,
          actionLabel: 'Show tax planning',
        }
      }

      case 'section-expenses': {
        const nudgeId = 'expenses-long-retirement'
        if (dismissedNudges.includes(nudgeId)) return null
        const duration = lifeExpectancy - retirementAge
        if (duration <= 30) return null
        return {
          id: nudgeId,
          sectionId,
          message: `With a ${duration}-year retirement, withdrawal strategy choice has an outsized impact on portfolio survival.`,
          actionLabel: 'Show all strategies',
        }
      }

      case 'section-fire-settings': {
        const nudgeId = 'fire-coast-reached'
        if (dismissedNudges.includes(nudgeId)) return null
        if (fireType !== 'regular') return null

        // Inline Coast FIRE check: we need coastFireNumber from useFireCalculations,
        // but to avoid a heavy dependency, we do a simplified check.
        // Coast FIRE ≈ fireNumber / (1 + realReturn)^yearsToRetirement
        // For the nudge, we just check if NW is "large relative to expenses" —
        // a rough proxy that avoids importing the full calculation chain.
        // The actual coastFireNumber from useFireCalculations is passed in
        // by the parent component if available.
        // For now, skip this nudge in the hook — it will be computed in the
        // component layer where useFireCalculations is already available.
        return null
      }

      case 'section-cpf': {
        const nudgeId = 'cpf-projections'
        if (dismissedNudges.includes(nudgeId)) return null
        const cpfTotal = cpfOA + cpfSA
        if (currentAge < 45 && cpfTotal <= 150000) return null
        const totalNW = liquidNetWorth + cpfOA + cpfSA + cpfMA
        const cpfPercent = totalNW > 0 ? Math.round(((cpfOA + cpfSA + cpfMA) / totalNW) * 100) : 0
        return {
          id: nudgeId,
          sectionId,
          message: `CPF makes up ${cpfPercent}% of your net worth. Year-by-year projections help plan withdrawal timing.`,
          actionLabel: 'Show CPF projections',
        }
      }

      case 'section-net-worth': {
        const nudgeId = 'networth-srs-planning'
        if (dismissedNudges.includes(nudgeId)) return null
        if (srsBalance <= 0 || srsAnnualContribution <= 0) return null
        return {
          id: nudgeId,
          sectionId,
          message: "You're actively contributing to SRS. Fine-tune your drawdown age and return assumption for more accurate projections.",
          actionLabel: 'Show SRS settings',
        }
      }

      case 'section-property': {
        // HDB monetization nudge takes priority
        const hdbNudgeId = 'property-hdb-monetization'
        const purchaseNudgeId = 'property-purchase-analysis'

        if (ownsProperty && propertyType === 'hdb' && !dismissedNudges.includes(hdbNudgeId)) {
          return {
            id: hdbNudgeId,
            sectionId,
            message: 'HDB owners have unique monetization options like subletting and lease buyback.',
            actionLabel: 'Show HDB details',
          }
        }
        // Purchase analysis nudge is handled at component level (depends on local showNewPurchase state)
        return null
      }

      case 'section-allocation': {
        const nudgeId = 'allocation-glide-path'
        if (dismissedNudges.includes(nudgeId)) return null
        const yearsToRetirement = retirementAge - currentAge
        if (yearsToRetirement > 15) return null
        return {
          id: nudgeId,
          sectionId,
          message: `With retirement in ${yearsToRetirement} years, a glide path shifting from growth to conservative allocation can reduce sequence risk.`,
          actionLabel: 'Show glide path & correlations',
        }
      }

      case 'section-projection': {
        const nudgeId = 'projection-detail-columns'
        if (dismissedNudges.includes(nudgeId)) return null
        if (!cpfEnabled) return null
        return {
          id: nudgeId,
          sectionId,
          message: 'See how CPF contributions and tax affect each year of your projection.',
          actionLabel: 'Show detailed columns',
        }
      }

      case 'section-stress-test': {
        const nudgeId = 'stresstest-deep-analysis'
        if (dismissedNudges.includes(nudgeId)) return null
        if (lastMCSuccessRate === null || lastMCSuccessRate >= 0.95) return null
        const pct = Math.round(lastMCSuccessRate * 100)
        return {
          id: nudgeId,
          sectionId,
          message: `Your plan has a ${pct}% success rate. Historical backtests and crisis stress tests can reveal specific vulnerabilities.`,
          actionLabel: 'Show Backtest & Sequence Risk',
        }
      }

      default:
        return null
    }
  }, [
    mode, sectionId, dismissedNudges, annualIncome, currentAge,
    retirementAge, lifeExpectancy, liquidNetWorth, cpfOA, cpfSA, cpfMA,
    srsBalance, srsAnnualContribution, fireType, ownsProperty, propertyType,
    lastMCSuccessRate, cpfEnabled,
  ])
}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/hooks/useSectionNudge.test.ts`
Expected: PASS — all tests green.

**Step 5: Commit**

```bash
git add frontend/src/hooks/useSectionNudge.ts frontend/src/hooks/useSectionNudge.test.ts
git commit -m "feat: add useSectionNudge hook with 9 contextual triggers"
```

---

## Task 5: Add Per-Section Toggle + Nudge to InputsPage

**Files:**
- Modify: `frontend/src/pages/InputsPage.tsx`

This is the largest UI change. It modifies the section header rendering to include the "Advanced: ..." toggle link and renders `SectionNudge` for each section.

**Step 1: Add imports and configuration**

At the top of `InputsPage.tsx`, add these imports:

```typescript
import { SectionNudge } from '@/components/shared/SectionNudge'
import { useSectionNudge } from '@/hooks/useSectionNudge'
import { useUIStore } from '@/stores/useUIStore'
import { useEffectiveMode, type ModeSectionId } from '@/hooks/useEffectiveMode'
```

Add the static label configuration after the `STRATEGY_LABELS` constant:

```typescript
/** Static label text for each section's advanced features. */
const ADVANCED_LABELS: Partial<Record<SectionId, { modeSectionId: ModeSectionId; label: string }>> = {
  'section-fire-settings': { modeSectionId: 'section-fire-settings', label: 'FIRE types, number basis, manual returns' },
  'section-income': { modeSectionId: 'section-income', label: 'tax reliefs, income streams, life events' },
  'section-expenses': { modeSectionId: 'section-expenses', label: 'all 12 strategies, comparison charts' },
  'section-net-worth': { modeSectionId: 'section-net-worth', label: 'SRS return assumption, drawdown age' },
  'section-cpf': { modeSectionId: 'section-cpf', label: 'projection table, extra interest details' },
  'section-property': { modeSectionId: 'section-property', label: 'stamp duty breakdown, Bala\'s Table, amortization' },
  'section-allocation': { modeSectionId: 'section-allocation', label: 'custom overrides, glide path, correlations' },
}
```

**Step 2: Create a SectionHeader sub-component**

Add above the `InputsPage` function:

```typescript
function SectionModeLink({ sectionId }: { sectionId: SectionId }) {
  const config = ADVANCED_LABELS[sectionId]
  if (!config) return null

  const mode = useEffectiveMode(config.modeSectionId)
  const setSectionMode = useUIStore((s) => s.setSectionMode)

  if (mode === 'advanced') {
    return (
      <button
        onClick={() => setSectionMode(config.modeSectionId, 'simple')}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
      >
        &larr; Simplify
      </button>
    )
  }

  return (
    <button
      onClick={() => setSectionMode(config.modeSectionId, 'advanced')}
      className="text-xs text-muted-foreground hover:text-primary transition-colors"
    >
      <span className="hidden sm:inline">Advanced: {config.label}</span>
      <span className="sm:hidden">Advanced</span>
      {' '}&rarr;
    </button>
  )
}

function SectionNudgeWrapper({ sectionId }: { sectionId: SectionId }) {
  const config = ADVANCED_LABELS[sectionId]
  if (!config) return null

  const nudge = useSectionNudge(config.modeSectionId)
  if (!nudge) return null

  return (
    <SectionNudge
      nudgeId={nudge.id}
      sectionId={nudge.sectionId}
      message={nudge.message}
      actionLabel={nudge.actionLabel}
    />
  )
}
```

**Step 3: Modify the section rendering loop**

In the section rendering loop (around line 796-841), add the mode link to the header and the nudge below it. Replace the section header `<div className="flex items-center justify-between mb-4">` block with:

```typescript
<div className="space-y-2 mb-4">
  <div className="flex items-center justify-between">
    <button
      onClick={() => toggleSection(sectionId)}
      className="flex items-center gap-2 text-left"
    >
      {isCollapsed ? (
        <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
      ) : (
        <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
      )}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          {section.title}
          {sectionCompletion[sectionId]?.isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
          )}
        </h2>
        <p className="text-muted-foreground text-sm">{section.description}</p>
      </div>
    </button>
    <div className="flex items-center gap-3 shrink-0">
      {!isCollapsed && <SectionModeLink sectionId={sectionId} />}
      {!isCollapsed && (
        <Button variant="outline" size="sm" onClick={section.onReset}>
          {section.resetLabel}
        </Button>
      )}
    </div>
  </div>
  {!isCollapsed && <SectionNudgeWrapper sectionId={sectionId} />}
</div>
```

**Step 4: Update existing `mode` calls to use section-specific mode**

Each content component (`IncomeContent`, `ExpensesContent`, `AllocationContent`, `FireSettingsContent`) already calls `useEffectiveMode()`. Update them to pass their section ID:

- `IncomeContent`: `useEffectiveMode('section-income')`
- `ExpensesContent`: `useEffectiveMode('section-expenses')`
- `AllocationContent`: `useEffectiveMode('section-allocation')`
- In `FireTargetsSection.tsx`: `useEffectiveMode('section-fire-settings')`
- In `CpfSection.tsx`: `useEffectiveMode('section-cpf')`
- In `SalaryModelSection.tsx`: `useEffectiveMode('section-income')`

Each call site already imports `useEffectiveMode` — just add the string argument.

**Step 5: Run full test suite**

Run: `cd frontend && npx vitest run`
Expected: All tests pass.

**Step 6: Run type-check**

Run: `cd frontend && npx tsc --noEmit`
Expected: Zero errors.

**Step 7: Commit**

```bash
git add frontend/src/pages/InputsPage.tsx \
  frontend/src/components/profile/FireTargetsSection.tsx \
  frontend/src/components/profile/CpfSection.tsx \
  frontend/src/components/income/SalaryModelSection.tsx
git commit -m "feat: add per-section toggle links and nudges to InputsPage"
```

---

## Task 6: Update Sidebar ModeToggle

**Files:**
- Modify: `frontend/src/components/layout/Sidebar.tsx:348-378`

**Step 1: Update ModeToggle**

The `ModeToggle` component at line 348 currently calls `setField('mode', ...)`. The `setField` action in Task 1 was updated to auto-clear overrides when mode changes. Verify this works by reading the Sidebar code and confirming no additional changes are needed.

If the Sidebar's `ModeToggle` still uses `setField('mode', 'simple')` / `setField('mode', 'advanced')`, it will automatically clear section overrides due to the Task 1 change. No modification needed.

**Step 2: Verify manually**

Open browser → toggle global Simple/Advanced in sidebar → confirm all sections reset to global mode.

**Step 3: Commit (if any changes were needed)**

Skip commit if no file changes were made.

---

## Task 7: FIRE Settings Nudge (Coast FIRE — Component Layer)

**Files:**
- Modify: `frontend/src/pages/InputsPage.tsx` (the `FireSettingsContent` or section rendering area)

The FIRE Settings nudge (`fire-coast-reached`) requires `coastFireNumber` from `useFireCalculations()`, which is a heavy hook already used in `FireTargetsSection`. Rather than importing the full calculation chain into `useSectionNudge`, handle this nudge at the component layer.

**Step 1: Add the Coast FIRE nudge to InputsPage**

Create a dedicated wrapper for the FIRE Settings section nudge that uses `useFireCalculations`:

```typescript
function FireSettingsNudge() {
  const mode = useEffectiveMode('section-fire-settings')
  const dismissedNudges = useUIStore((s) => s.dismissedNudges)
  const fireType = useProfileStore((s) => s.fireType)
  const liquidNetWorth = useProfileStore((s) => s.liquidNetWorth)
  const cpfOA = useProfileStore((s) => s.cpfOA)
  const cpfSA = useProfileStore((s) => s.cpfSA)
  const cpfMA = useProfileStore((s) => s.cpfMA)
  const { metrics } = useFireCalculations()

  if (mode === 'advanced') return null
  if (dismissedNudges.includes('fire-coast-reached')) return null
  if (fireType !== 'regular') return null
  if (!metrics) return null

  const totalNW = liquidNetWorth + cpfOA + cpfSA + cpfMA
  if (totalNW < metrics.coastFireNumber) return null

  return (
    <SectionNudge
      nudgeId="fire-coast-reached"
      sectionId="section-fire-settings"
      message={`Your net worth (${formatCurrency(totalNW)}) has passed the Coast FIRE threshold (${formatCurrency(metrics.coastFireNumber)}). You could stop saving and still reach FIRE.`}
      actionLabel="Explore FIRE types"
    />
  )
}
```

Then update `SectionNudgeWrapper` to use `FireSettingsNudge` for the `section-fire-settings` case instead of the generic hook.

**Step 2: Run tests and type-check**

Run: `cd frontend && npx vitest run && npx tsc --noEmit`
Expected: All pass.

**Step 3: Commit**

```bash
git add frontend/src/pages/InputsPage.tsx
git commit -m "feat: add Coast FIRE nudge to FIRE Settings section"
```

---

## Task 8: Gate Projection Page by Mode

**Files:**
- Modify: `frontend/src/pages/ProjectionPage.tsx`

**Step 1: Import mode hook and nudge**

Add imports:
```typescript
import { useEffectiveMode } from '@/hooks/useEffectiveMode'
import { useSectionNudge } from '@/hooks/useSectionNudge'
import { SectionNudge } from '@/components/shared/SectionNudge'
```

**Step 2: Set default column groups based on mode**

Find the `activeGroups` state initialization (around line 71):

```typescript
const [activeGroups, setActiveGroups] = useState<Set<ColumnGroup>>(new Set())
```

Change to:
```typescript
const mode = useEffectiveMode('section-projection')
const nudge = useSectionNudge('section-projection')

const [activeGroups, setActiveGroups] = useState<Set<ColumnGroup>>(() => {
  // In advanced mode, show all column groups by default
  if (mode === 'advanced') {
    return new Set<ColumnGroup>(['incomeBreakdown', 'taxCpf', 'cpfBalances', 'portfolio'])
  }
  // Simple mode: basic columns only
  return new Set<ColumnGroup>()
})
```

Also add a `useEffect` to react to mode changes:
```typescript
useEffect(() => {
  if (mode === 'advanced') {
    setActiveGroups(new Set(['incomeBreakdown', 'taxCpf', 'cpfBalances', 'portfolio']))
  } else {
    setActiveGroups(new Set())
  }
}, [mode])
```

**Step 3: Add mode toggle + nudge to page header**

In the page header area, add a toggle link and the nudge. Find the page title area and add below it:

```typescript
{/* Mode toggle + nudge */}
<div className="flex items-center justify-between">
  <div /> {/* spacer */}
  {mode === 'advanced' ? (
    <button onClick={() => setSectionMode('section-projection', 'simple')}
      className="text-xs text-muted-foreground hover:text-foreground">
      &larr; Simplify
    </button>
  ) : (
    <button onClick={() => setSectionMode('section-projection', 'advanced')}
      className="text-xs text-muted-foreground hover:text-primary">
      Advanced: Tax & CPF columns, CPF balance detail &rarr;
    </button>
  )}
</div>
{nudge && (
  <SectionNudge nudgeId={nudge.id} sectionId={nudge.sectionId}
    message={nudge.message} actionLabel={nudge.actionLabel} />
)}
```

**Step 4: Import setSectionMode**

```typescript
const setSectionMode = useUIStore((s) => s.setSectionMode)
```

**Step 5: Run tests and type-check**

Run: `cd frontend && npx vitest run && npx tsc --noEmit`
Expected: All pass.

**Step 6: Commit**

```bash
git add frontend/src/pages/ProjectionPage.tsx
git commit -m "feat: gate Projection column groups by simple/advanced mode"
```

---

## Task 9: Gate Stress Test Page by Mode

**Files:**
- Modify: `frontend/src/pages/StressTestPage.tsx`

**Step 1: Import mode hook and nudge**

Add imports:
```typescript
import { useEffectiveMode } from '@/hooks/useEffectiveMode'
import { useSectionNudge } from '@/hooks/useSectionNudge'
import { SectionNudge } from '@/components/shared/SectionNudge'
import { useUIStore } from '@/stores/useUIStore'
```

**Step 2: Gate tabs by mode**

Find the Tabs component (around line 526):

```typescript
<Tabs defaultValue="monte-carlo">
  <TabsList className="grid w-full grid-cols-3">
    <TabsTrigger value="monte-carlo">Monte Carlo</TabsTrigger>
    <TabsTrigger value="backtest">Historical Backtest</TabsTrigger>
    <TabsTrigger value="sequence-risk">Sequence Risk</TabsTrigger>
  </TabsList>
```

Replace with mode-gated version:

```typescript
const stressMode = useEffectiveMode('section-stress-test')
const stressNudge = useSectionNudge('section-stress-test')
const setSectionMode = useUIStore((s) => s.setSectionMode)
const isStressAdvanced = stressMode === 'advanced'

// In the JSX:
<Tabs defaultValue="monte-carlo">
  <TabsList className={`grid w-full ${isStressAdvanced ? 'grid-cols-3' : 'grid-cols-1'}`}>
    <TabsTrigger value="monte-carlo">Monte Carlo</TabsTrigger>
    {isStressAdvanced && <TabsTrigger value="backtest">Historical Backtest</TabsTrigger>}
    {isStressAdvanced && <TabsTrigger value="sequence-risk">Sequence Risk</TabsTrigger>}
  </TabsList>
```

**Step 3: Add mode toggle + nudge to page header**

Above the Tabs, add:

```typescript
{/* Mode toggle */}
<div className="flex items-center justify-between">
  <div />
  {isStressAdvanced ? (
    <button onClick={() => setSectionMode('section-stress-test', 'simple')}
      className="text-xs text-muted-foreground hover:text-foreground">
      &larr; Simplify
    </button>
  ) : (
    <button onClick={() => setSectionMode('section-stress-test', 'advanced')}
      className="text-xs text-muted-foreground hover:text-primary">
      Advanced: backtests, sequence risk, drill-down tables &rarr;
    </button>
  )}
</div>
{stressNudge && (
  <SectionNudge nudgeId={stressNudge.id} sectionId={stressNudge.sectionId}
    message={stressNudge.message} actionLabel={stressNudge.actionLabel} />
)}
```

**Step 4: Gate advanced MC output in simple mode**

Within `MonteCarloTab`, gate the detailed output sections. Find where `PortfolioHistogram`, `FailureDistributionChart`, and `WithdrawalSchedule` are rendered (if they exist in the MC tab). Wrap them with:

```typescript
{isStressAdvanced && (
  <>
    <PortfolioHistogram ... />
    <FailureDistributionChart ... />
  </>
)}
```

Keep `ResultsSummary`, `FanChart`, `InterpretationCallout`, and `SpendingMetricsPanel` visible in both modes.

**Step 5: Run tests and type-check**

Run: `cd frontend && npx vitest run && npx tsc --noEmit`
Expected: All pass.

**Step 6: Commit**

```bash
git add frontend/src/pages/StressTestPage.tsx
git commit -m "feat: gate Stress Test tabs and detail output by simple/advanced mode"
```

---

## Final Verification

After all tasks are complete:

1. `cd frontend && npx tsc --noEmit` — zero errors
2. `cd frontend && npx vitest run` — all tests green
3. `cd frontend && npx vitest run --coverage` — check coverage thresholds
4. Manual verification:
   - Toggle global Simple/Advanced → all sections reset
   - Click "Advanced: ..." on a single section → only that section changes
   - Nudges appear when trigger conditions are met
   - Dismiss a nudge → it doesn't reappear after refresh
   - Click nudge action → section switches to advanced
   - Projection: simple shows basic columns, advanced shows all
   - Stress Test: simple shows MC only, advanced shows all 3 tabs
