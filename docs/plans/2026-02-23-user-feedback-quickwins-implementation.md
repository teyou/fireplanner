# User Feedback Quick Wins — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement 4 quick-win features from user feedback: CPF OA depletion warning, total withdrawn column, property ownership percentage, and expense inflation tooltip.

**Architecture:** Each feature is independent — they touch different files and can be built/tested in isolation. F1 (CPF OA warning) adds a derived field + UI warning. F2 (total withdrawn) adds a computed field + table column. F3 (ownership %) adds a store field + consumer scaling. F4 (tooltip) is a pure UI change.

**Tech Stack:** React 18, TypeScript, Zustand, TanStack Table, Vitest, shadcn/ui, Tailwind CSS

---

## Task 1: Add `totalWithdrawn` to Withdrawal Comparison (F2)

**Files:**
- Modify: `frontend/src/lib/calculations/withdrawal.ts:366-484`
- Modify: `frontend/src/components/withdrawal/ComparisonTable.tsx`
- Modify: `frontend/src/lib/calculations/withdrawal.test.ts:200-258`

**Step 1: Write the failing test**

In `frontend/src/lib/calculations/withdrawal.test.ts`, add inside the existing `runDeterministicComparison` describe block:

```ts
it('computes totalWithdrawn for each strategy', () => {
  const result = runDeterministicComparison({
    initialPortfolio: 2_000_000,
    annualExpenses: 80_000,
    retirementAge: 55,
    lifeExpectancy: 90,
    expectedReturn: 0.072,
    inflation: 0.025,
    expenseRatio: 0.003,
    swr: 0.04,
    strategies: ['constant_dollar', 'vpw'],
    strategyParams: {
      constant_dollar: { swr: 0.04 },
      vpw: { expectedRealReturn: 0.03, targetEndValue: 0 },
    },
  })

  for (const strategy of ['constant_dollar', 'vpw']) {
    const summary = result.summaries[strategy]
    const yearlySum = result.yearResults[strategy]
      .reduce((sum, yr) => sum + yr.withdrawal, 0)
    expect(summary.totalWithdrawn).toBeCloseTo(yearlySum, 0)
    expect(summary.totalWithdrawn).toBeGreaterThan(0)
  }
})
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/lib/calculations/withdrawal.test.ts --reporter verbose 2>&1 | tail -20`
Expected: FAIL — `totalWithdrawn` not found on summary type

**Step 3: Add `totalWithdrawn` to `WithdrawalSummary` and compute it**

In `frontend/src/lib/calculations/withdrawal.ts`:

Add `totalWithdrawn: number` to the `WithdrawalSummary` interface (after `terminalPortfolio`):

```ts
export interface WithdrawalSummary {
  strategyName: string
  avgWithdrawal: number
  minWithdrawal: number
  maxWithdrawal: number
  stdDevWithdrawal: number
  terminalPortfolio: number
  totalWithdrawn: number    // ← ADD THIS
  survived: boolean
}
```

In the summary computation block (around line 466–480), add the total:

```ts
const totalWithdrawn = withdrawals.reduce((a, b) => a + b, 0)
```

And include it in the summary object:

```ts
summaries[strategy] = {
  strategyName: strategy,
  avgWithdrawal: avg,
  minWithdrawal: withdrawals.length > 0 ? Math.min(...withdrawals) : 0,
  maxWithdrawal: withdrawals.length > 0 ? Math.max(...withdrawals) : 0,
  stdDevWithdrawal: Math.sqrt(variance),
  terminalPortfolio: Math.max(0, portfolio),
  totalWithdrawn,             // ← ADD THIS
  survived,
}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/lib/calculations/withdrawal.test.ts --reporter verbose 2>&1 | tail -20`
Expected: PASS

**Step 5: Add column to ComparisonTable**

In `frontend/src/components/withdrawal/ComparisonTable.tsx`, add a `Total Withdrawn` column between "Std Dev" and "Terminal Portfolio":

```tsx
<th className="text-right py-2 px-2 font-medium">Total Withdrawn</th>
```

And in the body:

```tsx
<td className="text-right py-2 px-2">{formatCurrency(s.totalWithdrawn)}</td>
```

**Step 6: Run full test suite**

Run: `cd frontend && npx vitest run --reporter verbose 2>&1 | tail -30`
Expected: All tests pass. If any test snapshots reference `WithdrawalSummary`, they may need updating.

**Step 7: Commit**

```bash
git add frontend/src/lib/calculations/withdrawal.ts frontend/src/lib/calculations/withdrawal.test.ts frontend/src/components/withdrawal/ComparisonTable.tsx
git commit -m "feat: add Total Withdrawn column to withdrawal comparison table"
```

---

## Task 2: Add Expense Inflation Tooltip (F4)

**Files:**
- Modify: `frontend/src/pages/ProjectionPage.tsx:224-227`

**Step 1: Add InfoTooltip to Expenses column header**

In `frontend/src/pages/ProjectionPage.tsx`, import `InfoTooltip`:

```ts
import { InfoTooltip } from '@/components/shared/InfoTooltip'
```

Change the Expenses column header from a plain string to a JSX element. Find this block (around line 224):

```ts
columnHelper.accessor('annualExpenses', {
  header: 'Expenses',
  cell: (info) => currencyCell(info.getValue()),
}),
```

Change it to:

```ts
columnHelper.accessor('annualExpenses', {
  header: () => (
    <span className="inline-flex items-center">
      Expenses
      <InfoTooltip text="In today's dollars, expenses appear flat because inflation is factored out. Switch to Nominal to see future values growing at your inflation rate." />
    </span>
  ),
  cell: (info) => currencyCell(info.getValue()),
}),
```

**Step 2: Verify visually**

Run: `cd frontend && npm run dev -- --port 5173`
Navigate to the Projection page and hover over the (i) next to "Expenses" column header.

**Step 3: Run type-check and tests**

Run: `cd frontend && npm run type-check && npx vitest run --reporter verbose 2>&1 | tail -20`
Expected: No type errors, all tests pass.

**Step 4: Commit**

```bash
git add frontend/src/pages/ProjectionPage.tsx
git commit -m "feat: add inflation tooltip to Expenses column header in projection table"
```

---

## Task 3: Add Property Ownership Percentage (F3)

**Files:**
- Modify: `frontend/src/lib/types.ts:715-746` (add `ownershipPercent` to `PropertyState`)
- Modify: `frontend/src/stores/usePropertyStore.ts` (add field, validation, migration)
- Modify: `frontend/src/hooks/useFireCalculations.ts:95-96` (scale property equity)
- Modify: `frontend/src/hooks/useProjection.ts:91-104` (scale property values)
- Modify: `frontend/src/pages/InputsPage.tsx:580-654` (add slider UI)
- Modify: `frontend/src/stores/usePropertyStore.test.ts` (add test)
- Modify: `frontend/src/hooks/useFireCalculations.test.ts` (add test)

**Step 1: Write the failing test for property store**

In `frontend/src/stores/usePropertyStore.test.ts`, add:

```ts
it('has ownershipPercent defaulting to 1.0', () => {
  const state = usePropertyStore.getState()
  expect(state.ownershipPercent).toBe(1)
})

it('validates ownershipPercent range', () => {
  const { setField } = usePropertyStore.getState()
  setField('ownershipPercent', 0.5)
  expect(usePropertyStore.getState().ownershipPercent).toBe(0.5)
  expect(usePropertyStore.getState().validationErrors.ownershipPercent).toBeUndefined()

  setField('ownershipPercent', 0)
  expect(usePropertyStore.getState().validationErrors.ownershipPercent).toBeDefined()

  setField('ownershipPercent', 1.5)
  expect(usePropertyStore.getState().validationErrors.ownershipPercent).toBeDefined()
})
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/stores/usePropertyStore.test.ts --reporter verbose 2>&1 | tail -20`
Expected: FAIL — `ownershipPercent` not found

**Step 3: Add `ownershipPercent` to types, store, and validation**

In `frontend/src/lib/types.ts`, add to `PropertyState` interface (after `mortgageCpfMonthly: number`):

```ts
ownershipPercent: number  // 0.01–1.0, default 1.0 (100%). Scales all property values for co-ownership.
```

In `frontend/src/stores/usePropertyStore.ts`:

1. Add to `PROPERTY_DATA_KEYS` array: `'ownershipPercent'`
2. Add to `DEFAULT_PROPERTY`: `ownershipPercent: 1,`
3. Add validation in `computeValidationErrors` (inside the `if (state.ownsProperty)` block):

```ts
if (state.ownershipPercent <= 0 || state.ownershipPercent > 1) {
  errors.ownershipPercent = 'Ownership share must be between 1% and 100%'
}
```

4. Bump store version from `6` to `7` and add migration:

```ts
if (version < 7) {
  state.ownershipPercent ??= 1
}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/stores/usePropertyStore.test.ts --reporter verbose 2>&1 | tail -20`
Expected: PASS

**Step 5: Write failing test for useFireCalculations**

In `frontend/src/hooks/useFireCalculations.test.ts`, find an existing test that checks `propertyEquity` and add a new test:

```ts
it('scales propertyEquity by ownershipPercent', () => {
  // Set up property with 50% ownership
  usePropertyStore.setState({
    ownsProperty: true,
    existingPropertyValue: 1_000_000,
    existingMortgageBalance: 400_000,
    ownershipPercent: 0.5,
  })
  // ... render hook and check
  // propertyEquity should be (1M - 400K) * 0.5 = 300K
})
```

Note: Match the existing test patterns in the file for how hooks are rendered (likely using `renderHook`).

**Step 6: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/hooks/useFireCalculations.test.ts --reporter verbose 2>&1 | tail -20`
Expected: FAIL — equity not scaled

**Step 7: Apply ownership scaling in consumer hooks**

In `frontend/src/hooks/useFireCalculations.ts` (around line 95-96):

```ts
const ownershipPct = property.ownershipPercent ?? 1
const propertyEquity = property.ownsProperty
  ? Math.max(0, property.existingPropertyValue - property.existingMortgageBalance) * ownershipPct
  : 0
```

Add `property.ownershipPercent` to the `useMemo` dependency array.

In `frontend/src/hooks/useProjection.ts` (around lines 91-104):

```ts
const ownershipPct = property.ownershipPercent ?? 1
```

Then scale the relevant values:

```ts
propertyEquity: property.ownsProperty
  ? Math.max(0, property.existingPropertyValue - property.existingMortgageBalance) * ownershipPct
  : 0,
annualMortgagePayment: property.ownsProperty
  ? (property.existingMonthlyPayment - property.mortgageCpfMonthly) * 12 * ownershipPct
  : 0,
```

Also scale `existingMortgageBalance` and `existingMonthlyPayment` passed to projection:

```ts
existingMortgageBalance: property.existingMortgageBalance * ownershipPct,
existingMonthlyPayment: property.existingMonthlyPayment * ownershipPct,
```

Add `property.ownershipPercent` to the `useMemo` dependency array.

**Step 8: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/hooks/useFireCalculations.test.ts --reporter verbose 2>&1 | tail -20`
Expected: PASS

**Step 9: Add ownership slider to InputsPage**

In `frontend/src/pages/InputsPage.tsx`, inside the `{ownsProperty && (` block, after the Property Type selector and before the grid of CurrencyInputs, add:

```tsx
<div className="space-y-1">
  <label className="text-sm text-muted-foreground flex items-center gap-1">
    Your Ownership Share
    <InfoTooltip text="For co-owned property, enter your percentage share. All property values (equity, mortgage, rental) will be scaled to your portion." />
  </label>
  <div className="flex items-center gap-3">
    <input
      type="range"
      min={1}
      max={100}
      value={Math.round((ownershipPercent ?? 1) * 100)}
      onChange={(e) => setField('ownershipPercent', Number(e.target.value) / 100)}
      className="flex-1"
    />
    <span className="text-sm font-medium w-12 text-right">{Math.round((ownershipPercent ?? 1) * 100)}%</span>
  </div>
  {validationErrors.ownershipPercent && (
    <p className="text-xs text-destructive">{validationErrors.ownershipPercent}</p>
  )}
</div>
```

Read `ownershipPercent` from the property store at the top of the property section:

```ts
const ownershipPercent = usePropertyStore((s) => s.ownershipPercent)
```

Also update the Property Equity display to reflect ownership:

```tsx
<span className="font-semibold">{formatCurrency(propertyEquity * (ownershipPercent ?? 1))}</span>
<span className="text-muted-foreground">
  {' '}({Math.round((ownershipPercent ?? 1) * 100)}% of {formatCurrency(propertyEquity)})
</span>
```

**Step 10: Run full test suite + type-check**

Run: `cd frontend && npm run type-check && npx vitest run --reporter verbose 2>&1 | tail -30`
Expected: All pass

**Step 11: Commit**

```bash
git add frontend/src/lib/types.ts frontend/src/stores/usePropertyStore.ts frontend/src/hooks/useFireCalculations.ts frontend/src/hooks/useProjection.ts frontend/src/pages/InputsPage.tsx frontend/src/stores/usePropertyStore.test.ts frontend/src/hooks/useFireCalculations.test.ts
git commit -m "feat: add property ownership percentage for co-ownership scaling"
```

---

## Task 4: CPF OA Depletion Warning (F1)

**Files:**
- Modify: `frontend/src/lib/types.ts:199-228` (add `cpfOaShortfall` to `IncomeProjectionRow`)
- Modify: `frontend/src/lib/calculations/income.ts:312-318` (track shortfall)
- Modify: `frontend/src/hooks/useCpfProjection.ts` (add shortfall to `CpfProjectionRow`, detect depletion)
- Modify: `frontend/src/components/cpf/CpfProjectionTable.tsx` (amber highlight + banner)
- Modify: `frontend/src/lib/calculations/income.test.ts` (add test)

**Step 1: Write the failing test**

In `frontend/src/lib/calculations/income.test.ts`, add a new test inside the appropriate describe block for CPF housing deductions:

```ts
it('tracks cpfOaShortfall when OA is depleted by mortgage', () => {
  const result = generateIncomeProjection({
    currentAge: 38,
    retirementAge: 40,
    lifeExpectancy: 50,
    annualSalary: 72000,
    salaryGrowthRate: 0.03,
    salaryModel: 'simple',
    incomeStreams: [],
    lifeEvents: [],
    lifeEventsEnabled: false,
    inflation: 0.025,
    annualExpenses: 48000,
    cpfOA: 50000,
    cpfSA: 30000,
    cpfMA: 20000,
    cpfRA: 0,
    cpfHousingMode: 'simple',
    cpfHousingMonthly: 1500,
    cpfMortgageYearsLeft: 20,
    cpfLifeStartAge: 65,
    cpfLifePlan: 'standard',
    cpfRetirementSum: 'frs',
  })

  // After retirement at 40, no salary → no CPF contributions
  // OA gets drained by $18K/yr (1500 * 12) with only interest accumulating
  // At some point OA < 18K and shortfall appears
  const shortfallRows = result.filter((r) => r.cpfOaShortfall > 0)
  expect(shortfallRows.length).toBeGreaterThan(0)

  // First shortfall should be after OA runs out
  const firstShortfall = shortfallRows[0]
  expect(firstShortfall.age).toBeGreaterThan(40)

  // Before shortfall, cpfOaShortfall should be 0
  const preShortfall = result.filter((r) => r.age < firstShortfall.age)
  for (const row of preShortfall) {
    expect(row.cpfOaShortfall).toBe(0)
  }
})
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/lib/calculations/income.test.ts -t "cpfOaShortfall" --reporter verbose 2>&1 | tail -20`
Expected: FAIL — `cpfOaShortfall` not found on result type

**Step 3: Add `cpfOaShortfall` to `IncomeProjectionRow`**

In `frontend/src/lib/types.ts`, add to `IncomeProjectionRow` (after `cpfOaHousingDeduction`):

```ts
cpfOaShortfall: number  // Amount by which OA cannot cover mortgage deduction (0 when OA is sufficient)
```

**Step 4: Track shortfall in income.ts**

In `frontend/src/lib/calculations/income.ts`, inside the year loop (around lines 312-318), modify the CPF housing deduction block:

Current code:
```ts
let cpfOaHousingDeduction = 0
if (cpfHousingMode !== 'none' && cpfHousingMonthly > 0 && age < cpfHousingEndAge) {
  const annualDeduction = cpfHousingMonthly * 12
  cpfOaHousingDeduction = Math.min(annualDeduction, cpfOA)
  cpfOA = Math.max(0, cpfOA - cpfOaHousingDeduction)
}
```

New code:
```ts
let cpfOaHousingDeduction = 0
let cpfOaShortfall = 0
if (cpfHousingMode !== 'none' && cpfHousingMonthly > 0 && age < cpfHousingEndAge) {
  const annualDeduction = cpfHousingMonthly * 12
  cpfOaHousingDeduction = Math.min(annualDeduction, cpfOA)
  cpfOaShortfall = Math.max(0, annualDeduction - cpfOA)
  cpfOA = Math.max(0, cpfOA - cpfOaHousingDeduction)
}
```

Then include `cpfOaShortfall` in the row object that's pushed into the results array. Find where the row is constructed (look for where `cpfOaHousingDeduction` is already included) and add `cpfOaShortfall` alongside it.

**Step 5: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/lib/calculations/income.test.ts -t "cpfOaShortfall" --reporter verbose 2>&1 | tail -20`
Expected: PASS

**Step 6: Add shortfall to CpfProjectionRow**

In `frontend/src/hooks/useCpfProjection.ts`, add `oaShortfall: number` to the `CpfProjectionRow` interface, and map it from the income projection row:

```ts
oaShortfall: row.cpfOaShortfall,
```

**Step 7: Add banner and row highlighting to CpfProjectionTable**

In `frontend/src/components/cpf/CpfProjectionTable.tsx`:

1. Import `usePropertyStore` to get mortgage end info for the warning message:

```ts
import { usePropertyStore } from '@/stores/usePropertyStore'
```

2. Detect depletion from the rows:

```ts
const depletionRow = rows?.find((r) => r.oaShortfall > 0)
const mortgageEndAge = rows && depletionRow
  ? rows.findLast((r) => r.oaHousingDeduction > 0 || r.oaShortfall > 0)?.age ?? 0
  : 0
```

3. Add an amber warning banner above the table (before the `<div className="border rounded-md ...">` wrapper):

```tsx
{depletionRow && (
  <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md text-sm">
    <p className="font-medium text-amber-800 dark:text-amber-200">
      ⚠ CPF OA projected to be depleted at age {depletionRow.age}
    </p>
    <p className="text-amber-700 dark:text-amber-300 mt-1">
      From age {depletionRow.age} to {mortgageEndAge}, the remaining mortgage payments
      of {formatCurrency(depletionRow.oaShortfall)}/yr must come from your liquid portfolio.
    </p>
  </div>
)}
```

4. Add amber row highlighting — modify the `<tr>` className:

```tsx
<tr
  key={row.id}
  className={cn(
    'border-b hover:bg-muted/50',
    isRetirementRow && 'border-t-2 border-t-orange-400',
    original.oaShortfall > 0 && 'bg-amber-50 dark:bg-amber-900/10',
    // ... existing milestone styles
  )}
>
```

**Step 8: Run full test suite + type-check**

Run: `cd frontend && npm run type-check && npx vitest run --reporter verbose 2>&1 | tail -30`
Expected: All pass. Some existing income test snapshots may need updating to include the new `cpfOaShortfall: 0` field.

**Step 9: Commit**

```bash
git add frontend/src/lib/types.ts frontend/src/lib/calculations/income.ts frontend/src/lib/calculations/income.test.ts frontend/src/hooks/useCpfProjection.ts frontend/src/components/cpf/CpfProjectionTable.tsx
git commit -m "feat: add CPF OA depletion warning when mortgage outlasts OA balance"
```

---

## Task 5: Final Verification

**Step 1: Run full test suite**

Run: `cd frontend && npm run type-check && npm run lint && npx vitest run --reporter verbose 2>&1 | tail -40`
Expected: All pass, no lint errors, no type errors.

**Step 2: Visual verification**

Run: `cd frontend && npm run dev -- --port 5173`

Verify:
1. **Withdrawal page** → Comparison table shows "Total Withdrawn" column with sensible values
2. **Projection page** → Hover (i) on "Expenses" column → tooltip appears
3. **Inputs page** → Property section → set ownership to 50% → equity shows scaled value
4. **Inputs page** → CPF section → set early retirement (40) with mortgage CPF → amber warning appears in CPF table

**Step 3: Commit any fixups if needed**

---

## Parallelism Analysis

These 4 tasks are fully independent — they touch different files:

| Task | Key files | Dependencies |
|------|-----------|-------------|
| T1 (totalWithdrawn) | `withdrawal.ts`, `ComparisonTable.tsx` | None |
| T2 (tooltip) | `ProjectionPage.tsx` | None |
| T3 (ownership %) | `types.ts`, `usePropertyStore.ts`, `useFireCalculations.ts`, `useProjection.ts`, `InputsPage.tsx` | None |
| T4 (CPF warning) | `types.ts`, `income.ts`, `useCpfProjection.ts`, `CpfProjectionTable.tsx` | None |

**Shared file:** `types.ts` is modified by both T3 and T4 (adding fields to different interfaces). This is a trivial merge conflict if run in parallel.

**Recommended execution:** 2 parallel agents:
- **Agent A:** T1 + T2 (small, fast — two quick changes)
- **Agent B:** T3 + T4 (medium — both involve type/store/hook/UI changes, but T3 modifies `PropertyState` and T4 modifies `IncomeProjectionRow` so no overlap)
