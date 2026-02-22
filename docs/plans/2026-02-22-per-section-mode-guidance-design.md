# Design: Per-Section Simple/Advanced Mode + Contextual Guidance

**Date:** 2026-02-22
**Status:** Approved
**Depends on:** `2026-02-21-ux-srs-hdb-design.md` (Workstream 1 — global toggle already implemented)

---

## Context

The global Simple/Advanced toggle (Workstream 1) is implemented. It gates sections across the InputsPage via a single `mode` field in `useUIStore`. However:

1. **No per-section control.** Users can't expand one section to advanced without expanding all.
2. **No guidance.** Nothing explains what each mode shows or who should use it.
3. **Projection and Stress Test pages** have no mode gating at all.

The `useEffectiveMode()` hook was designed as the extension point (comment: "Extensible for per-section overrides in a future version"). This design fulfills that intent.

**Goal:** Let users control complexity per-section, with static labels explaining what advanced adds AND contextual nudges that fire when the user's data suggests advanced controls would help.

---

## 1. State Architecture

### useUIStore Changes

Add to store (bump version 3 → 4):

```ts
sectionOverrides: Partial<Record<SectionId, 'simple' | 'advanced'>>
dismissedNudges: string[]   // nudge IDs the user has dismissed
```

Migration v3 → v4:
- Set `sectionOverrides: {}`
- Set `dismissedNudges: []`

New actions:
```ts
setSectionMode: (section: SectionId, mode: 'simple' | 'advanced') => void
clearSectionOverrides: () => void
dismissNudge: (nudgeId: string) => void
```

### SectionId Type

Extend the existing `SectionId` type to include all sections that have advanced content:

```ts
type SectionId =
  | 'section-personal'        // no advanced content
  | 'section-fire-settings'
  | 'section-income'
  | 'section-expenses'
  | 'section-net-worth'
  | 'section-cpf'
  | 'section-property'
  | 'section-allocation'
  | 'section-projection'      // NEW
  | 'section-stress-test'     // NEW
```

### useEffectiveMode() Upgrade

```ts
export function useEffectiveMode(section?: SectionId): 'simple' | 'advanced' {
  const globalMode = useUIStore((s) => s.mode)
  const overrides = useUIStore((s) => s.sectionOverrides)

  if (section && overrides[section]) {
    return overrides[section]
  }
  return globalMode
}
```

### Global Toggle Interaction

- **Switching global to Simple:** calls `clearSectionOverrides()` — everything resets to simple.
- **Switching global to Advanced:** calls `clearSectionOverrides()` — everything resets to advanced.
- After either, individual section toggles can override again.

---

## 2. Per-Section Toggle UI

### Placement

Each section header on InputsPage gets a small link next to the title. Only sections with advanced content get it (not Personal).

On Projection and Stress Test pages, the toggle appears in the page header area.

### Appearance

When the section is in **Simple mode**, the header shows:

```
Income                                     Advanced: tax reliefs, income streams, life events →
```

When in **Advanced mode**:

```
Income                                                                 ← Simplify
```

The link text doubles as the static label — it always tells you what advanced adds. No extra UI chrome needed.

### Static Labels (per-section)

| Section | "Advanced: ..." link text |
|---------|--------------------------|
| FIRE Settings | "FIRE types, number basis, manual returns" |
| Income | "tax reliefs, income streams, life events" |
| Expenses | "all 12 strategies, comparison charts" |
| Net Worth | "SRS return assumption, drawdown age" |
| CPF | "projection table, extra interest details" |
| Property | "stamp duty breakdown, Bala's Table, amortization" |
| Allocation | "custom overrides, glide path, correlations" |
| Projection | "Tax & CPF columns, CPF balance detail" |
| Stress Test | "backtests, sequence risk, drill-down tables" |

### Data Preservation Rule

Same as existing: switching modes never changes store data, only hides/shows UI. If an advanced-only withdrawal strategy is active and the section is switched to simple, show it with "(Advanced strategy)" label.

---

## 3. Contextual Nudges

### Nudge Component

A small inline banner (not blocking, dismissible) that appears below the section header when the trigger condition is met and the section is in simple mode.

```
┌─────────────────────────────────────────────────────────────┐
│ 💡 Contributing $15,300 to SRS could save ~$1,760/yr in    │
│    tax. → Show tax planning                            [×] │
└─────────────────────────────────────────────────────────────┘
```

Styled with `bg-primary/5 border border-primary/20` (matches existing explanation panel pattern). The "→ Show tax planning" link sets that section's override to `'advanced'`. The "×" calls `dismissNudge(nudgeId)`.

### Nudge Hook

```ts
interface Nudge {
  id: string
  sectionId: SectionId
  message: string
  actionLabel: string
}

function useSectionNudges(sectionId: SectionId): Nudge | null
```

Returns `null` if:
- Section is already in advanced mode
- Nudge has been dismissed
- Trigger condition is not met

### Complete Nudge Definitions

#### Nudge 1: Income → Tax Planning

| | |
|---|---|
| **ID** | `income-srs-tax` |
| **Section** | `section-income` |
| **Trigger** | `calculateProgressiveTax(chargeable) - calculateProgressiveTax(chargeable - 15300) > 1000` |
| **Message** | "Contributing $15,300 to SRS could save ~$X/yr in tax." |
| **Action** | "Show tax planning" |
| **Math** | Uses `calculateProgressiveTax()` from `tax.ts` with the user's actual chargeable income. `chargeable = grossIncome - cpfEmployee - earnedIncomeRelief`. The $X is the exact tax difference — accounts for cross-bracket effects. |
| **Fires at** | Roughly gross income > ~$97K (chargeable > $55K, marginal rate >= 7%). At $120K gross → ~$1,760. At $150K → ~$2,295. At $250K → ~$2,907. |

#### Nudge 2: Expenses → Withdrawal Strategies

| | |
|---|---|
| **ID** | `expenses-long-retirement` |
| **Section** | `section-expenses` |
| **Trigger** | `lifeExpectancy - retirementAge > 30` |
| **Message** | "With a X-year retirement, withdrawal strategy choice has an outsized impact on portfolio survival." |
| **Action** | "Show all strategies" |
| **Math** | No computation — the retirement duration itself is the justification. Over 30+ year horizons, adaptive strategies (Guardrails, VPW) show 10-20% higher success rates than Constant Dollar in historical backtests. |

#### Nudge 3: FIRE Settings → FIRE Types

| | |
|---|---|
| **ID** | `fire-coast-reached` |
| **Section** | `section-fire-settings` |
| **Trigger** | `(liquidNetWorth + cpfTotal) >= metrics.coastFireNumber` AND `fireType === 'regular'` |
| **Message** | "Your net worth ($X) has passed the Coast FIRE threshold ($Y). You could stop saving and still reach FIRE." |
| **Action** | "Explore FIRE types" |
| **Math** | `coastFireNumber` already computed by `useFireCalculations()`. No new calculation. Only fires when `fireType === 'regular'` — if user has already switched to Coast/Barista, no need to nudge. |

#### Nudge 4: CPF → Projections

| | |
|---|---|
| **ID** | `cpf-projections` |
| **Section** | `section-cpf` |
| **Trigger** | `currentAge >= 45` OR `(cpfOA + cpfSA) > 150_000` |
| **Message** | "CPF makes up X% of your net worth. Year-by-year projections help plan withdrawal timing." |
| **Action** | "Show CPF projections" |
| **Math** | `cpfPercent = (cpfOA + cpfSA + cpfMA) / (liquidNetWorth + cpfOA + cpfSA + cpfMA) * 100`. Simple division from existing store values. |
| **Why $150K** | Below that, CPF is a minor part of the picture. Above it, extra interest rules (1% on first $60K) and CPF LIFE options have material impact. |
| **Why age 45** | 10 years from CPF rate changes at 55, 20 years from CPF LIFE at 65. Projection table becomes planning-relevant. |

#### Nudge 5: Net Worth → SRS Planning

| | |
|---|---|
| **ID** | `networth-srs-planning` |
| **Section** | `section-net-worth` |
| **Trigger** | `srsBalance > 0` AND `srsAnnualContribution > 0` |
| **Message** | "You're actively contributing to SRS. Fine-tune your drawdown age and return assumption for more accurate projections." |
| **Action** | "Show SRS settings" |
| **What advanced shows** | SRS investment return % input, SRS drawdown start age — these affect how SRS compounds and when it enters the withdrawal model. Default 4% return and age 62 drawdown may not match user's plan. |

#### Nudge 6: Property → Full Analysis

| | |
|---|---|
| **ID** | `property-hdb-monetization` |
| **Section** | `section-property` |
| **Trigger** | `ownsProperty && propertyType === 'hdb'` |
| **Message** | "HDB owners have unique monetization options like subletting and lease buyback." |
| **Action** | "Show HDB details" |

| | |
|---|---|
| **ID** | `property-purchase-analysis` |
| **Section** | `section-property` |
| **Trigger** | User is evaluating a new purchase (the "considering purchasing" checkbox is checked) |
| **Message** | "See stamp duty breakdown (BSD + ABSD) and lease decay analysis for your purchase." |
| **Action** | "Show full property analysis" |

Only one property nudge shows at a time. HDB monetization takes priority over purchase analysis if both triggers fire.

#### Nudge 7: Allocation → Glide Path

| | |
|---|---|
| **ID** | `allocation-glide-path` |
| **Section** | `section-allocation` |
| **Trigger** | `retirementAge - currentAge <= 15` |
| **Message** | "With retirement in X years, a glide path shifting from growth to conservative allocation can reduce sequence risk." |
| **Action** | "Show glide path & correlations" |
| **Why 15 years** | Glide paths typically begin 10-15 years before retirement. Earlier, a static growth template is fine. |

#### Nudge 8: Projection → Detailed Columns

| | |
|---|---|
| **ID** | `projection-detail-columns` |
| **Section** | `section-projection` |
| **Trigger** | `cpfEnabled === true` (user has CPF tracking on) |
| **Message** | "See how CPF contributions and tax affect each year of your projection." |
| **Action** | "Show detailed columns" |
| **Implementation** | In simple mode, default visible column groups to Income + Portfolio only. Advanced reveals Tax & CPF and CPF Balances column groups. Existing column group toggles remain functional in both modes. |

#### Nudge 9: Stress Test → Deep Analysis

| | |
|---|---|
| **ID** | `stresstest-deep-analysis` |
| **Section** | `section-stress-test` |
| **Trigger** | User has run MC simulation AND `successRate < 95` |
| **Message** | "Your plan has a X% success rate. Historical backtests and crisis stress tests can reveal specific vulnerabilities." |
| **Action** | "Show Backtest & Sequence Risk" |
| **Implementation** | In simple mode, show only Monte Carlo tab with simplified output (success gauge + fan chart + interpretation). Advanced reveals all 3 tabs with heatmap, drill-down, withdrawal schedule percentiles. |
| **Why < 95%** | At 95%+, the plan is very robust. Below 95%, understanding WHEN and WHY failure occurs (which is what Backtest and Sequence Risk reveal) is genuinely actionable. |
| **Data available** | `useSimulationStore` already stores the last MC result including success rate. |

---

## 4. Section Coverage Summary

| Section | Has Advanced? | Static Label | Nudge ID | Trigger |
|---------|:---:|---|---|---|
| Personal | No | — | — | — |
| FIRE Settings | Yes | FIRE types, number basis, manual returns | `fire-coast-reached` | NW >= Coast FIRE number |
| Income | Yes | tax reliefs, income streams, life events | `income-srs-tax` | SRS savings > $1,000 |
| Expenses | Yes | all 12 strategies, comparison charts | `expenses-long-retirement` | Retirement > 30 years |
| Net Worth | Yes | SRS return assumption, drawdown age | `networth-srs-planning` | SRS balance > 0 AND contributing |
| CPF | Yes | projection table, extra interest details | `cpf-projections` | Age >= 45 OR CPF > $150K |
| Property | Yes | stamp duty breakdown, Bala's Table, amortization | `property-hdb-monetization` / `property-purchase-analysis` | Owns HDB / Evaluating purchase |
| Allocation | Yes | custom overrides, glide path, correlations | `allocation-glide-path` | Retirement <= 15 years |
| Projection | Yes | Tax & CPF columns, CPF balance detail | `projection-detail-columns` | CPF enabled |
| Stress Test | Yes | backtests, sequence risk, drill-down tables | `stresstest-deep-analysis` | MC success < 95% |

---

## 5. New Mode Gating (Projection + Stress Test)

### ProjectionPage — Simple vs Advanced

| Simple | Advanced |
|--------|----------|
| Column groups: Income + Portfolio only | All column groups visible (Income, Tax & CPF, CPF Balances, Portfolio) |
| Summary cards + chart + table | Same, with all detail columns |
| Column group toggles still functional | Column group toggles still functional |

### StressTestPage — Simple vs Advanced

| Simple | Advanced |
|--------|----------|
| Monte Carlo tab only | All 3 tabs (Monte Carlo, Backtest, Sequence Risk) |
| Success gauge + fan chart + interpretation | Full output: histogram, failure distribution, withdrawal schedule |
| Run button + method selector | Same, plus advanced method options |

---

## 6. Files to Modify

### State Layer
- `stores/useUIStore.ts` — add `sectionOverrides`, `dismissedNudges`, actions, migration v4
- `hooks/useEffectiveMode.ts` — add optional `section` parameter, read overrides

### New Files
- `hooks/useSectionNudge.ts` — nudge trigger logic per section
- `components/shared/SectionNudge.tsx` — dismissible nudge banner component

### InputsPage Sections (add per-section toggle link)
- `pages/InputsPage.tsx` — add toggle link to section headers, render `SectionNudge`

### Results Pages (add mode gating)
- `pages/ProjectionPage.tsx` — gate column groups by mode
- `pages/StressTestPage.tsx` — gate tabs and detail output by mode

### Sidebar
- `components/layout/Sidebar.tsx` — no change needed (global toggle remains as-is)

---

## 7. Acceptance Criteria

1. Each section with advanced content shows a static "Advanced: ..." link in its header
2. Clicking the link toggles that section to advanced (or back to simple)
3. Section overrides persist in localStorage via useUIStore
4. Global toggle resets all section overrides
5. Nudges appear when trigger conditions are met and section is in simple mode
6. Dismissed nudges don't reappear (stored in `dismissedNudges`)
7. Clicking nudge action link switches that section to advanced
8. Projection page gates column groups by mode
9. Stress Test page gates tabs by mode
10. All existing tests continue to pass
