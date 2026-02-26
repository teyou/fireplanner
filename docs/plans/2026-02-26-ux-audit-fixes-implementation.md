# UX Audit Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement 19 UX fixes across 4 parallel workstreams addressing form UX and mobile UX audit findings.

**Architecture:** Four independent workstreams (A: Input polish, B: Touch targets, C: Mobile layouts, D: Missing features) that can run in parallel. Each workstream commits independently. Workstreams touch different line ranges of shared files (notably InputsPage.tsx).

**Tech Stack:** React 19, TypeScript 5.9, Tailwind CSS 3.4, shadcn/ui (Radix primitives), Zustand 5

**Design Doc:** `docs/plans/2026-02-26-ux-audit-fixes-design.md`

---

## Workstream A: Input Component Polish

### Task A1: Add blur-only error display to NumberInput

**Files:**
- Modify: `frontend/src/components/shared/NumberInput.tsx`

**Step 1: Add touched state and modify error display**

In `NumberInput.tsx`, add a `touched` state. Show errors only when `touched` is true. Set `touched = true` on blur. Reset on external value change.

```tsx
// After line 55 (const [isFocused, setIsFocused] = useState(false))
const [touched, setTouched] = useState(false)
```

In the `handleBlur` callback (line 93), add `setTouched(true)` as the first line:
```tsx
const handleBlur = useCallback(() => {
  setTouched(true)
  setIsFocused(false)
  // ... rest unchanged
```

In the external sync block (lines 57-63), reset touched when value changes externally while not focused:
```tsx
if (value !== prevValue) {
  setPrevValue(value)
  if (!isFocused) {
    setLocalValue(format(value))
    setTouched(false)
  }
}
```

Add `aria-describedby` to the `<Input>` element (line 118-132). Generate an error ID:
```tsx
const errorId = `${inputId}-error`
```

Add to the `<Input>`:
```tsx
aria-describedby={touched && error ? errorId : undefined}
```

Change the error rendering (line 144) to gate on `touched`:
```tsx
{touched && error && <p id={errorId} className="text-xs text-destructive">{error}</p>}
```

**Step 2: Verify the change compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add frontend/src/components/shared/NumberInput.tsx
git commit -m "fix(ux): defer NumberInput validation errors to blur"
```

---

### Task A2: Add blur-only error display to CurrencyInput

**Files:**
- Modify: `frontend/src/components/shared/CurrencyInput.tsx`

**Step 1: Pass error through to NumberInput and gate display**

CurrencyInput wraps NumberInput but renders its own error `<p>` at line 50. Since NumberInput now handles touched-gated errors internally, we need to:

1. Add `touched` state to CurrencyInput
2. Pass an `onBlur` callback to NumberInput (NumberInput doesn't expose this prop yet)

Actually, the simpler approach: CurrencyInput renders its own error message separately from NumberInput. Add a `touched` state + gate.

```tsx
// Add useState import (already imported via NumberInput dependency chain, but CurrencyInput only imports useId)
import { useState, useId } from 'react'

// Inside CurrencyInput component, after const inputId = useId():
const [touched, setTouched] = useState(false)
const errorId = `${inputId}-error`
```

NumberInput doesn't expose an onBlur prop. Add a thin wrapper: wrap `NumberInput` in a `<div onBlur={() => setTouched(true)}>`:

```tsx
<div className="relative mt-auto" onBlur={() => setTouched(true)}>
  <span className="absolute left-3 ...">$</span>
  <NumberInput
    id={inputId}
    value={value}
    onChange={onChange}
    integer
    formatWithCommas
    className={cn(
      'pl-7 border-blue-300',
      touched && error && 'border-destructive'
    )}
    disabled={disabled}
  />
</div>
{touched && error && <p id={errorId} className="text-xs text-destructive">{error}</p>}
```

Note: The `border-destructive` class is also gated on `touched` now.

**Step 2: Verify the change compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add frontend/src/components/shared/CurrencyInput.tsx
git commit -m "fix(ux): defer CurrencyInput validation errors to blur"
```

---

### Task A3: Add blur-only error display to PercentInput

**Files:**
- Modify: `frontend/src/components/shared/PercentInput.tsx`

**Step 1: Add touched state, aria-describedby, and gate error display**

Same pattern as NumberInput. In PercentInput:

```tsx
// After line 36 (const [isFocused, setIsFocused] = useState(false)):
const [touched, setTouched] = useState(false)
const errorId = `${inputId}-error`
```

In `handleBlur` (line 63), add `setTouched(true)`:
```tsx
const handleBlur = useCallback(() => {
  setTouched(true)
  setIsFocused(false)
  // ... rest unchanged
```

In the external sync block (lines 39-44), reset touched:
```tsx
if (value !== prevValue) {
  setPrevValue(value)
  if (!isFocused) {
    setLocalValue(toDisplay(value))
    setTouched(false)
  }
}
```

Add `aria-describedby` to the `<Input>` (line 93):
```tsx
aria-describedby={touched && error ? errorId : undefined}
```

Gate the `border-destructive` class on touched (line 105):
```tsx
touched && error && 'border-destructive'
```

Gate error display (line 113):
```tsx
{touched && error && <p id={errorId} className="text-xs text-destructive">{error}</p>}
```

**Step 2: Verify the change compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add frontend/src/components/shared/PercentInput.tsx
git commit -m "fix(ux): defer PercentInput validation errors to blur"
```

---

### Task A4: Replace raw checkboxes with Switch (feature toggles)

**Files:**
- Modify: `frontend/src/pages/InputsPage.tsx` (lines 246-255)
- Modify: `frontend/src/components/profile/FinancialSection.tsx` (lines 101-113)

**Step 1: Replace employer CPF checkbox in InputsPage**

At the top of InputsPage, ensure `Switch` is imported:
```tsx
import { Switch } from '@/components/ui/switch'
```

Replace lines 246-255:
```tsx
<div className="flex items-center gap-3 pb-1">
  <Switch
    id="employer-cpf-toggle"
    checked={income.employerCpfEnabled}
    onCheckedChange={(checked) => income.setField('employerCpfEnabled', checked)}
  />
  <Label htmlFor="employer-cpf-toggle" className="text-sm cursor-pointer">
    Employer CPF Contributions
  </Label>
</div>
```

**Step 2: Replace SRS post-FIRE checkbox in FinancialSection**

At the top of FinancialSection, ensure `Switch` and `Label` are imported (Label is already imported).
```tsx
import { Switch } from '@/components/ui/switch'
```

Replace lines 101-113:
```tsx
{store.srsAnnualContribution > 0 && (
  <div className="flex items-center gap-3 pb-1">
    <Switch
      id="srs-post-fire-toggle"
      checked={store.srsPostFireEnabled}
      onCheckedChange={(checked) => store.setField('srsPostFireEnabled', checked)}
    />
    <Label htmlFor="srs-post-fire-toggle" className="text-sm cursor-pointer">
      Continue SRS during post-FIRE employment
    </Label>
    <InfoTooltip text="Enable SRS contributions during Barista FIRE years when you have employment income streams active after your FIRE age. Off by default since barista income is typically lower." />
  </div>
)}
```

**Step 3: Verify and commit**

Run: `cd frontend && npx tsc --noEmit`

```bash
git add frontend/src/pages/InputsPage.tsx frontend/src/components/profile/FinancialSection.tsx
git commit -m "fix(ux): replace raw checkboxes with Switch for feature toggles"
```

---

### Task A5: Install shadcn Checkbox and replace row-level checkboxes

**Files:**
- Create: `frontend/src/components/ui/checkbox.tsx` (via shadcn CLI)
- Modify: `frontend/src/components/income/IncomeStreamsSection.tsx`
- Modify: `frontend/src/components/income/LifeEventsSection.tsx`

**Step 1: Add shadcn Checkbox component**

Run: `cd frontend && npx shadcn@latest add checkbox`

If the CLI fails, manually create `frontend/src/components/ui/checkbox.tsx`:
```tsx
import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-current")}>
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
```

And install the peer dependency if needed: `npm install @radix-ui/react-checkbox`

**Step 2: Replace checkboxes in IncomeStreamsSection**

Import Checkbox:
```tsx
import { Checkbox } from '@/components/ui/checkbox'
```

Replace line 102-108 (Active toggle):
```tsx
<div className="flex items-center gap-1.5">
  <Checkbox
    id={`stream-active-${stream.id}`}
    checked={stream.isActive}
    onCheckedChange={(checked) => onUpdate({ isActive: checked === true })}
  />
  <Label htmlFor={`stream-active-${stream.id}`} className="text-sm cursor-pointer">Active</Label>
</div>
```

Replace lines 213-221 (CPF Applicable):
```tsx
<div className="flex items-end pb-1">
  <div className="flex items-center gap-1.5">
    <Checkbox
      id={`stream-cpf-${stream.id}`}
      checked={stream.isCpfApplicable}
      onCheckedChange={(checked) => onUpdate({ isCpfApplicable: checked === true })}
    />
    <Label htmlFor={`stream-cpf-${stream.id}`} className="text-sm cursor-pointer">CPF Applicable</Label>
  </div>
</div>
```

**Step 3: Replace checkboxes in LifeEventsSection**

Import Checkbox:
```tsx
import { Checkbox } from '@/components/ui/checkbox'
```

Replace line 136-142 (Enable toggle in header):
```tsx
<div className="flex items-center gap-2">
  <Checkbox
    id="life-events-enabled"
    checked={income.lifeEventsEnabled}
    onCheckedChange={(checked) => income.setField('lifeEventsEnabled', checked === true)}
  />
  <Label htmlFor="life-events-enabled" className="text-sm cursor-pointer">Enable</Label>
</div>
```

Replace lines 271-286 (Pause Savings + Pause CPF):
```tsx
<div className="flex flex-col gap-1.5 justify-end">
  <div className="flex items-center gap-1.5">
    <Checkbox
      id={`${prefix}-pause-savings`}
      checked={event.savingsPause}
      onCheckedChange={(checked) => onUpdate({ savingsPause: checked === true })}
    />
    <Label htmlFor={`${prefix}-pause-savings`} className="text-sm cursor-pointer">Pause Savings</Label>
  </div>
  <div className="flex items-center gap-1.5">
    <Checkbox
      id={`${prefix}-pause-cpf`}
      checked={event.cpfPause}
      onCheckedChange={(checked) => onUpdate({ cpfPause: checked === true })}
    />
    <Label htmlFor={`${prefix}-pause-cpf`} className="text-sm cursor-pointer">Pause CPF</Label>
  </div>
</div>
```

Replace lines 297-304 (Affected stream checkboxes):
```tsx
{streamNames.map(({ id, name }) => (
  <div key={id} className="flex items-center gap-1.5">
    <Checkbox
      id={`${prefix}-stream-${id}`}
      checked={event.affectedStreamIds.includes(id)}
      onCheckedChange={() => toggleStream(id)}
    />
    <Label htmlFor={`${prefix}-stream-${id}`} className="text-sm cursor-pointer">{name}</Label>
  </div>
))}
```

**Step 4: Verify and commit**

Run: `cd frontend && npx tsc --noEmit`

```bash
git add frontend/src/components/ui/checkbox.tsx frontend/src/components/income/IncomeStreamsSection.tsx frontend/src/components/income/LifeEventsSection.tsx
git commit -m "fix(ux): replace raw checkboxes with shadcn Checkbox in list contexts"
```

---

### Task A6: Replace bare range slider with shadcn Slider

**Files:**
- Modify: `frontend/src/pages/InputsPage.tsx` (lines 797-811)

**Step 1: Replace the range input**

Import Slider at the top of InputsPage:
```tsx
import { Slider } from '@/components/ui/slider'
```

Replace lines 797-811:
```tsx
<div className="space-y-1">
  <Label htmlFor="ownership-percent" className="text-sm text-muted-foreground flex items-center gap-1">
    Your Ownership Share
    <InfoTooltip text="For co-owned property, enter your percentage share. All property values (equity, mortgage, rental) will be scaled to your portion." />
  </Label>
  <div className="flex items-center gap-3">
    <Slider
      id="ownership-percent"
      min={1}
      max={100}
      step={1}
      value={[Math.round((ownershipPercent ?? 1) * 100)]}
      onValueChange={([v]) => setField('ownershipPercent', v / 100)}
      className="flex-1"
    />
    <span className="text-sm font-medium w-12 text-right">{Math.round((ownershipPercent ?? 1) * 100)}%</span>
  </div>
  {validationErrors.ownershipPercent && (
    <p className="text-xs text-destructive">{validationErrors.ownershipPercent}</p>
  )}
</div>
```

Note: Remove the old `<label>` wrapper (lines 793-796) that was separate from the input, as the new code integrates the label properly.

**Step 2: Verify and commit**

Run: `cd frontend && npx tsc --noEmit`

```bash
git add frontend/src/pages/InputsPage.tsx
git commit -m "fix(ux): replace bare range input with shadcn Slider"
```

---

### Task A7: Run full test suite for Workstream A

**Step 1: Run tests**

Run: `cd frontend && npm test`
Expected: All tests pass (no calculation logic changed, only UI components)

**Step 2: Run type check**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

---

## Workstream B: Touch Target Fixes

### Task B1: Fix InfoTooltip sizing, delay, and aria

**Files:**
- Modify: `frontend/src/components/shared/InfoTooltip.tsx`

**Step 1: Update mobile trigger sizing and add aria-label**

Replace the `mobileTriggerClassName` (line 46):
```tsx
const mobileTriggerClassName = `${baseTriggerClassName} min-w-[44px] min-h-[44px] bg-muted text-muted-foreground ring-1 ring-border`
```

The mobile button now has a 44px tap target. The visual "i" text stays centered via the existing `inline-flex items-center justify-center` from `baseTriggerClassName`.

Replace the desktop trigger className (line 45):
```tsx
const desktopTriggerClassName = `${baseTriggerClassName} w-5 h-5 bg-muted text-muted-foreground`
```
(No change to desktop size — 20px is fine with a mouse.)

**Step 2: Change tooltip delay**

Line 67: Change `delayDuration={0}` to `delayDuration={300}`:
```tsx
<TooltipProvider delayDuration={300}>
```

**Step 3: Add aria-label to both trigger buttons**

Mobile trigger (line 55):
```tsx
<button type="button" className={mobileTriggerClassName} aria-label="More information">
```

Desktop trigger (line 70):
```tsx
<button type="button" onClick={(e) => e.preventDefault()} className={desktopTriggerClassName} aria-label="More information">
```

**Step 4: Verify and commit**

Run: `cd frontend && npx tsc --noEmit`

```bash
git add frontend/src/components/shared/InfoTooltip.tsx
git commit -m "fix(ux): improve InfoTooltip touch targets, delay, and aria"
```

---

### Task B2: Fix dialog close button touch target

**Files:**
- Modify: `frontend/src/components/ui/dialog.tsx` (line 45)

**Step 1: Add padding to close button**

Replace line 45:
```tsx
<DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground p-2">
```

The only change is adding `p-2` at the end of the className. This expands the clickable area from ~16px to ~32px.

**Step 2: Verify and commit**

Run: `cd frontend && npx tsc --noEmit`

```bash
git add frontend/src/components/ui/dialog.tsx
git commit -m "fix(ux): increase dialog close button touch target"
```

---

### Task B3: Fix FireStatsStrip gear button and dropdown touch targets

**Files:**
- Modify: `frontend/src/components/layout/FireStatsStrip.tsx`

**Step 1: Increase gear button padding and icon size**

Line 116, change the gear button:
```tsx
<button
  onClick={() => setOpen(!open)}
  className="p-2.5 rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
  aria-label="Change stats position"
>
  <Settings2 className="h-4 w-4" />
</button>
```

Changes: `p-1.5` → `p-2.5`, `h-3.5 w-3.5` → `h-4 w-4`

**Step 2: Increase dropdown option padding**

Line 134, change the option buttons:
```tsx
className={cn(
  'w-full text-left px-3 py-2 text-xs transition-colors',
```

Change: `py-1.5` → `py-2`

**Step 3: Verify and commit**

Run: `cd frontend && npx tsc --noEmit`

```bash
git add frontend/src/components/layout/FireStatsStrip.tsx
git commit -m "fix(ux): increase FireStatsStrip touch targets"
```

---

### Task B4: Fix pill toggle button heights and add ARIA roles

**Files:**
- Modify: `frontend/src/pages/InputsPage.tsx` (property status pills ~757-771, section ordering ~1403-1434)
- Modify: `frontend/src/components/profile/FireTargetsSection.tsx` (basis toggle ~189-207)

**Step 1: Property status pills — add responsive padding + ARIA**

At `InputsPage.tsx` line 757, add `role="radiogroup"` to the container:
```tsx
<div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit" role="radiogroup" aria-label="Property status">
```

At line 762, add responsive padding and ARIA to each button:
```tsx
<button
  key={opt.value}
  onClick={() => handleStatusChange(opt.value)}
  role="radio"
  aria-checked={propertyStatus === opt.value}
  className={`px-3 py-2.5 md:py-1.5 text-xs font-medium rounded-md transition-colors ${
    propertyStatus === opt.value
      ? 'bg-background shadow-sm text-foreground'
      : 'text-muted-foreground hover:text-foreground'
  }`}
>
```

Changes: Added `py-2.5 md:py-1.5` (was `py-1.5`), added `role="radio"` and `aria-checked`.

**Step 2: Section ordering pills — add ARIA (padding already fine)**

At `InputsPage.tsx` line 1403, add `role="radiogroup"`:
```tsx
<div className="flex items-center gap-1 p-1 bg-muted rounded-lg" role="radiogroup" aria-label="Section ordering">
```

Add `role="radio"` and `aria-checked` to each of the 3 buttons (lines 1404, 1414, 1424):
```tsx
role="radio"
aria-checked={sectionOrder === 'goal-first'}
```
(Repeat for `'story-first'` and `'already-fire'`)

**Step 3: FIRE number basis toggle — add ARIA**

At `FireTargetsSection.tsx` line 189, add `role="radiogroup"`:
```tsx
<div className="flex items-center gap-0.5 mt-1.5 rounded-md bg-background border p-0.5" role="radiogroup" aria-label="FIRE number dollar basis">
```

At line 195, add to each button:
```tsx
<button
  key={opt.value}
  onClick={() => setField('fireNumberBasis', opt.value as FireNumberBasis)}
  role="radio"
  aria-checked={fireNumberBasis === opt.value}
  className={`...`}
>
```

**Step 4: Verify and commit**

Run: `cd frontend && npx tsc --noEmit`

```bash
git add frontend/src/pages/InputsPage.tsx frontend/src/components/profile/FireTargetsSection.tsx
git commit -m "fix(ux): add ARIA roles to pill toggles and fix mobile touch targets"
```

---

### Task B5: Run full test suite for Workstream B

**Step 1: Run tests**

Run: `cd frontend && npm test`
Expected: All tests pass

---

## Workstream C: Mobile Layout Fixes

### Task C1: Add mobile card layout for locked assets grid

**Files:**
- Modify: `frontend/src/components/profile/FinancialSection.tsx` (lines 121-168)

**Step 1: Add dual-render for locked assets**

Wrap the existing grid in `hidden md:grid` and add a mobile card layout. Replace lines 121-168:

```tsx
{lockedAssets.map((asset, i) => (
  <div key={asset.id}>
    {/* Desktop: 5-column grid */}
    <div className="hidden md:grid grid-cols-[1fr_120px_80px_80px_32px] gap-2 mb-2 items-end">
      <div>
        {i === 0 && <Label className="text-xs text-muted-foreground mb-1 block">Name</Label>}
        <Input
          value={asset.name}
          onChange={(e) => updateLockedAsset(asset.id, { name: e.target.value })}
          placeholder="e.g., Employer RSUs"
          className="h-9"
        />
      </div>
      <div>
        {i === 0 && <Label className="text-xs text-muted-foreground mb-1 block">Amount</Label>}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm z-10">$</span>
          <NumberInput
            value={asset.amount}
            onChange={(v) => updateLockedAsset(asset.id, { amount: v })}
            integer
            formatWithCommas
            className="pl-7 border-blue-300 h-9"
          />
        </div>
      </div>
      <div>
        {i === 0 && <Label className="text-xs text-muted-foreground mb-1 block">Unlock Age</Label>}
        <NumberInput
          value={asset.unlockAge}
          onChange={(v) => updateLockedAsset(asset.id, { unlockAge: v })}
        />
      </div>
      <div>
        {i === 0 && <Label className="text-xs text-muted-foreground mb-1 block">Growth</Label>}
        <PercentInput
          value={asset.growthRate}
          onChange={(v) => updateLockedAsset(asset.id, { growthRate: v })}
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-9 w-9", i === 0 && "mt-5")}
        onClick={() => removeLockedAsset(asset.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
    {/* Mobile: stacked card */}
    <div className="md:hidden border rounded-lg p-3 mb-2 space-y-2">
      <div className="flex items-center justify-between">
        <Input
          value={asset.name}
          onChange={(e) => updateLockedAsset(asset.id, { name: e.target.value })}
          placeholder="e.g., Employer RSUs"
          className="h-9 flex-1 mr-2"
        />
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removeLockedAsset(asset.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Amount</Label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs z-10">$</span>
            <NumberInput
              value={asset.amount}
              onChange={(v) => updateLockedAsset(asset.id, { amount: v })}
              integer
              formatWithCommas
              className="pl-5 border-blue-300 h-9 text-sm"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Age</Label>
          <NumberInput
            value={asset.unlockAge}
            onChange={(v) => updateLockedAsset(asset.id, { unlockAge: v })}
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Growth</Label>
          <PercentInput
            value={asset.growthRate}
            onChange={(v) => updateLockedAsset(asset.id, { growthRate: v })}
          />
        </div>
      </div>
    </div>
  </div>
))}
```

**Step 2: Add dual-render for expense adjustments in InputsPage**

Apply the same pattern at `InputsPage.tsx` line 350. Wrap the existing grid in `hidden md:grid` and add a mobile card. The expense adjustment row has: Label, $/yr, Start Age, End Age, Delete button.

At line 349-350, wrap in desktop-only:
```tsx
<div className="hidden md:grid grid-cols-[1fr_120px_80px_80px_32px] gap-2 items-end">
```

Add a mobile card sibling:
```tsx
<div className="md:hidden border rounded-lg p-3 mb-2 space-y-2">
  <div className="flex items-center justify-between">
    <Input
      value={adj.label}
      onChange={(e) => updateExpenseAdjustment(adj.id, { label: e.target.value })}
      placeholder="e.g. Rent"
      maxLength={50}
      className="h-9 flex-1 mr-2"
    />
    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removeExpenseAdjustment(adj.id)}>
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
  <div className="grid grid-cols-3 gap-2">
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">$/yr</Label>
      <CurrencyInput label="" value={adj.amount} onChange={(v) => updateExpenseAdjustment(adj.id, { amount: v })} />
    </div>
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">Start</Label>
      <NumberInput value={adj.startAge} onChange={(v) => updateExpenseAdjustment(adj.id, { startAge: v })} integer className="h-9 text-sm" />
    </div>
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">End</Label>
      <NumberInput value={adj.endAge} onChange={(v) => updateExpenseAdjustment(adj.id, { endAge: v })} integer className="h-9 text-sm" />
    </div>
  </div>
</div>
```

Note: CurrencyInput requires a `label` prop — pass `""` for the mobile card since we have a separate Label above it. Or use NumberInput with formatWithCommas and a $ prefix like the locked assets pattern. Check the CurrencyInput interface — `label` is required. Use the NumberInput + $ prefix pattern instead for the mobile card.

**Step 3: Verify and commit**

Run: `cd frontend && npx tsc --noEmit`

```bash
git add frontend/src/components/profile/FinancialSection.tsx frontend/src/pages/InputsPage.tsx
git commit -m "fix(ux): add mobile card layout for locked assets and expense adjustment grids"
```

---

### Task C2: Fix fixed-width name inputs

**Files:**
- Modify: `frontend/src/components/income/IncomeStreamsSection.tsx` (line 100)
- Modify: `frontend/src/components/income/LifeEventsSection.tsx` (line 227)

**Step 1: Make name inputs responsive**

In `IncomeStreamsSection.tsx` line 100, change:
```tsx
className="w-full md:w-48 border-blue-300"
```

In `LifeEventsSection.tsx` line 227, change:
```tsx
className="w-full md:w-48 border-blue-300"
```

**Step 2: Verify and commit**

Run: `cd frontend && npx tsc --noEmit`

```bash
git add frontend/src/components/income/IncomeStreamsSection.tsx frontend/src/components/income/LifeEventsSection.tsx
git commit -m "fix(ux): make name inputs responsive on mobile"
```

---

### Task C3: Fix SWR Heatmap overflow

**Files:**
- Modify: `frontend/src/components/backtest/SwrHeatmap.tsx` (line 166)

**Step 1: Add overflow-x-auto**

Change line 166:
```tsx
<div ref={containerRef} className="relative overflow-x-auto">
```

**Step 2: Verify and commit**

Run: `cd frontend && npx tsc --noEmit`

```bash
git add frontend/src/components/backtest/SwrHeatmap.tsx
git commit -m "fix(ux): add horizontal scroll to SWR heatmap on mobile"
```

---

### Task C4: Hide secondary columns in ComparisonTable on mobile

**Files:**
- Modify: `frontend/src/components/withdrawal/ComparisonTable.tsx`

**Step 1: Add responsive column hiding**

Add `hidden md:table-cell` to the Max, Std Dev, and Total Withdrawn columns (both `<th>` and `<td>`).

Headers (lines 29-31):
```tsx
<th className="text-right py-2 px-2 font-medium hidden md:table-cell">Max</th>
<th className="text-right py-2 px-2 font-medium hidden md:table-cell">Std Dev</th>
<th className="text-right py-2 px-2 font-medium hidden md:table-cell">Total Withdrawn</th>
```

Data cells (lines 44-46):
```tsx
<td className="text-right py-2 px-2 hidden md:table-cell">{formatCurrency(s.maxWithdrawal)}</td>
<td className="text-right py-2 px-2 hidden md:table-cell">{formatCurrency(s.stdDevWithdrawal)}</td>
<td className="text-right py-2 px-2 hidden md:table-cell">{formatCurrency(s.totalWithdrawn)}</td>
```

**Step 2: Verify and commit**

Run: `cd frontend && npx tsc --noEmit`

```bash
git add frontend/src/components/withdrawal/ComparisonTable.tsx
git commit -m "fix(ux): hide secondary columns in comparison table on mobile"
```

---

### Task C5: Replace Guide with Withdrawal in bottom nav

**Files:**
- Modify: `frontend/src/components/layout/Sidebar.tsx` (lines 464-486)

**Step 1: Import Banknote icon (if not already imported)**

Check the imports at the top of Sidebar.tsx. `Banknote` is already imported (used in the ANALYSIS nav group at line 108).

**Step 2: Replace Guide with Withdrawal in bottom nav**

At line 470, change:
```tsx
{ label: 'Withdraw', path: '/withdrawal', icon: <Banknote className="h-5 w-5" /> },
```

This replaces the Guide entry. The Guide page remains accessible from the desktop sidebar and the mobile drawer menu (via `AFTER_INPUTS_GROUPS` at lines 119-123).

**Step 3: Verify and commit**

Run: `cd frontend && npx tsc --noEmit`

```bash
git add frontend/src/components/layout/Sidebar.tsx
git commit -m "fix(ux): add Withdrawal to mobile bottom nav, move Guide to drawer only"
```

---

### Task C6: Run full test suite for Workstream C

**Step 1: Run tests**

Run: `cd frontend && npm test`
Expected: All tests pass

---

## Workstream D: Missing Features & Misc

### Task D1: Add residency status field to PersonalSection

**Files:**
- Modify: `frontend/src/components/profile/PersonalSection.tsx`

**Step 1: Add residency status Select**

Add `residencyStatus` to the destructured store values (line 10):
```tsx
const { currentAge, retirementAge, lifeExpectancy, lifeStage, maritalStatus, residencyStatus, setField, validationErrors } =
  useProfileStore()
```

After the Marital Status field (after line 109, inside the grid), add:
```tsx
<div className="space-y-1">
  <Label className="text-sm flex items-center">
    Residency Status
    <InfoTooltip text="Sets your residency for CPF contribution rates, SRS caps, and tax calculations. For ABSD on property purchases, residency is set separately in the Property section." />
  </Label>
  <Select
    value={residencyStatus}
    onValueChange={(v) => setField('residencyStatus', v as 'citizen' | 'pr' | 'foreigner')}
  >
    <SelectTrigger className="border-blue-300">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="citizen">Singapore Citizen</SelectItem>
      <SelectItem value="pr">Permanent Resident</SelectItem>
      <SelectItem value="foreigner">Foreigner</SelectItem>
    </SelectContent>
  </Select>
</div>
```

**Step 2: Add Marital Status tooltip (D3)**

At line 96, change:
```tsx
<Label className="text-sm flex items-center">
  Marital Status
  <InfoTooltip text="Affects eligibility for Spouse Relief and Working Mother's Child Relief tax deductions." />
</Label>
```

**Step 3: Verify and commit**

Run: `cd frontend && npx tsc --noEmit`

```bash
git add frontend/src/components/profile/PersonalSection.tsx
git commit -m "feat(ux): add residency status field and marital status tooltip"
```

---

### Task D2: Add showNewPurchase and collapsedSections to useUIStore

**Files:**
- Modify: `frontend/src/stores/useUIStore.ts`

**Step 1: Add new fields to UIState interface**

Add to the `UIState` interface (after line 21):
```tsx
showNewPurchase: boolean
collapsedSections: string[]
```

Note: Using `string[]` instead of `Set<SectionId>` because Zustand's persist middleware serializes to JSON, which doesn't support `Set`. We'll convert to/from Set in the component.

**Step 2: Add to UIActions interface**

Add after line 31:
```tsx
setShowNewPurchase: (value: boolean) => void
toggleSection: (sectionId: string) => void
```

**Step 3: Add to DEFAULT_UI**

Add after line 46:
```tsx
showNewPurchase: false,
collapsedSections: [],
```

Note: Empty array means everything expanded (for existing users via migration). New users will get a different default set in InputsPage via a one-time initialization effect.

**Step 4: Add actions**

After `markChangelogSeen` action (after line 90), add:
```tsx
setShowNewPurchase: (value) => set({ showNewPurchase: value }),

toggleSection: (sectionId) =>
  set((state) => {
    const sections = [...state.collapsedSections]
    const idx = sections.indexOf(sectionId)
    if (idx >= 0) {
      sections.splice(idx, 1)
    } else {
      sections.push(sectionId)
    }
    return { collapsedSections: sections }
  }),
```

**Step 5: Bump version and add migration**

Change `version: 8` to `version: 9` (line 94).

Add migration case after the `if (version < 8)` block (after line 127):
```tsx
if (version < 9) {
  state.showNewPurchase = false
  state.collapsedSections = []
}
```

**Step 6: Verify and commit**

Run: `cd frontend && npx tsc --noEmit`

```bash
git add frontend/src/stores/useUIStore.ts
git commit -m "feat(ux): add showNewPurchase and collapsedSections to UI store"
```

---

### Task D3: Update InputsPage to use persisted collapsedSections and showNewPurchase

**Files:**
- Modify: `frontend/src/pages/InputsPage.tsx`

**Step 1: Replace useState collapsedSections with store**

Remove the `useState` for `collapsedSections` (lines 1236-1241):
```tsx
// DELETE these lines:
const [collapsedSections, setCollapsedSections] = useState<Set<SectionId>>(() => {
  if (sectionOrder === 'already-fire') {
    return new Set(['section-fire-settings'])
  }
  return new Set()
})
```

Add store reads at the top of InputsPage (near other store reads):
```tsx
const collapsedSectionsArr = useUIStore((s) => s.collapsedSections)
const toggleSection = useUIStore((s) => s.toggleSection)
```

Create a derived Set for compatibility with existing code:
```tsx
const collapsedSections = useMemo(() => new Set(collapsedSectionsArr), [collapsedSectionsArr])
```

Add a one-time initialization effect for new users (empty collapsedSections means first visit):
```tsx
useEffect(() => {
  // First visit: collapse all sections except Personal and FIRE Settings
  if (collapsedSectionsArr.length === 0) {
    const allSections: SectionId[] = [
      'section-income', 'section-expenses', 'section-goals',
      'section-net-worth', 'section-cpf', 'section-healthcare',
      'section-property', 'section-allocation'
    ]
    // Only set if truly first visit (no other UI store interactions)
    const isFirstVisit = useUIStore.getState().lastSeenChangelogDate === null
    if (isFirstVisit) {
      useUIStore.setState({ collapsedSections: allSections })
    }
  }
}, []) // Run once on mount
```

Replace all `setCollapsedSections` calls with `toggleSection`. Search for `setCollapsedSections` in the file and replace each call. The typical pattern:
```tsx
// Old:
setCollapsedSections((prev) => {
  const next = new Set(prev)
  if (next.has(sectionId)) next.delete(sectionId)
  else next.add(sectionId)
  return next
})
// New:
toggleSection(sectionId)
```

For the hash-scroll effect (lines 1244-1249), which expands a specific section:
```tsx
useEffect(() => {
  const hashId = location.hash.slice(1)
  if (!hashId) return
  if (collapsedSections.has(hashId as SectionId)) {
    toggleSection(hashId)
  }
  // ... rest of scroll logic
}, [location.hash])
```

**Step 2: Replace showNewPurchase useState with store**

In the `PropertyContent` function (~line 723), remove:
```tsx
const [showNewPurchase, setShowNewPurchase] = useState(false)
```

Replace with:
```tsx
const showNewPurchase = useUIStore((s) => s.showNewPurchase)
const setShowNewPurchase = useUIStore((s) => s.setShowNewPurchase)
```

**Step 3: Verify and commit**

Run: `cd frontend && npx tsc --noEmit`

```bash
git add frontend/src/pages/InputsPage.tsx
git commit -m "feat(ux): persist section collapse state and showNewPurchase in store"
```

---

### Task D4: Run full test suite for Workstream D

**Step 1: Run tests**

Run: `cd frontend && npm test`
Expected: All tests pass

**Step 2: Run type check**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

---

## Final Verification

### Task F1: Run complete verification suite

**Step 1: Type check**
Run: `cd frontend && npx tsc --noEmit`

**Step 2: Lint**
Run: `cd frontend && npm run lint`

**Step 3: Full test suite**
Run: `cd frontend && npm test`

**Step 4: Production build**
Run: `cd frontend && npm run build`

All four must pass before considering the work complete.
