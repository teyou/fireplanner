export interface ChangelogEntry {
  date: string
  title: string
  description: string
  category: 'data-update' | 'feature' | 'fix'
  /** Optional section IDs for section-level nudges (e.g., 'section-cpf') */
  affectedSections?: string[]
  /** Optional deeper explanation of why this change matters */
  insight?: string
}

/** Newest first. */
export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-02-25',
    category: 'feature',
    title: 'Projection-derived FIRE number',
    description:
      'Dashboard and FIRE targets now show a projection-derived FIRE number alongside the simple formula when they differ by more than 5%. The projection number accounts for mortgage cash payments, CPF LIFE payouts, and rental income from your year-by-year plan.',
    affectedSections: ['section-fire-settings'],
  },
  {
    date: '2026-02-25',
    category: 'fix',
    title: 'FIRE number dollar-basis normalization',
    description:
      'The projection-derived FIRE number is now normalized to the same dollar basis as the simple FIRE number (today, retirement, or FIRE age dollars). Previously the deviation percentage could be inflated by the inflation gap between the projection year and the formula\'s basis year.',
    affectedSections: ['section-fire-settings'],
  },
  {
    date: '2026-02-25',
    category: 'feature',
    title: 'Property shortfall impacts projections',
    description:
      'When a downsizing sale doesn\'t cover the outstanding mortgage, the shortfall is now deducted from your portfolio in both the projection table and Monte Carlo simulations instead of being silently absorbed.',
    affectedSections: ['section-property'],
  },
  {
    date: '2026-02-25',
    category: 'feature',
    title: 'Property sale shortfall warning',
    description:
      'Downsizing analysis now warns when sale proceeds don\'t cover outstanding costs, showing the exact shortfall amount you would need to bring to settlement.',
    affectedSections: ['section-property'],
  },
  {
    date: '2026-02-25',
    category: 'feature',
    title: 'Retirement withdrawal underfunded warning',
    description:
      'One-time retirement withdrawals now warn when they exceed your available portfolio at the planned age, showing which ages are affected and the total shortfall.',
    affectedSections: ['section-fire-settings'],
  },
  {
    date: '2026-02-25',
    category: 'fix',
    title: 'Mobile UX improvements',
    description:
      'Informational (i) tooltips now work on mobile via tap-to-open popovers. Chart tooltips respond to tap instead of requiring hover. Number inputs trigger the numeric keyboard on mobile. Scenario delete buttons are always visible on touch devices. Pathway tabs and page layout improved for small screens.',
  },
  {
    date: '2026-02-25',
    category: 'fix',
    title: 'Earned income relief adjusts by age',
    description:
      'Earned income relief now only applies when salary or business income exists, and adjusts per-year as you cross age 55/60 brackets instead of being frozen at your current age.',
    affectedSections: ['section-income'],
  },
  {
    date: '2026-02-25',
    category: 'fix',
    title: 'SRS withdrawals visible in cash flow chart',
    description:
      'Cash flow chart now correctly shows SRS drawdowns as a visible series instead of hardcoding them to zero.',
    affectedSections: ['section-fire-settings'],
  },
  {
    date: '2026-02-25',
    category: 'fix',
    title: 'CPF milestones exclude MediSave',
    description:
      'CPF milestone comparisons (BRS/FRS/ERS) now exclude MediSave since MA cannot fund the retirement sum. Milestones trigger at the correct later ages.',
    affectedSections: ['section-cpf'],
  },
  {
    date: '2026-02-25',
    category: 'fix',
    title: 'MediSave depletion now reduces CPF MA',
    description:
      'Healthcare premiums (MediShield Life, ISP, CareShield Life) are now deducted from your MediSave balance in the projection. Previously, cpfMA only grew from contributions and interest but never shrank, overstating your CPF total. The projection summary now also reports MediSave depletion age when applicable.',
    insight:
      'The projectMediSaveTimeline() function existed and was fully tested, but was never called by the projection engine. This is a common "dead code" pattern: a feature is implemented in isolation, passes unit tests, but the integration point is missed. The fix was a single import and 8 lines of wiring code.',
    affectedSections: ['section-cpf'],
  },
  {
    date: '2026-02-25',
    category: 'fix',
    title: 'Locked asset unlocks now increase liquid NW',
    description:
      'Locked assets (employer RSUs, fixed deposits, endowments) that mature at a specific age now correctly flow into your liquid portfolio. Previously, the unlock value was computed but never added to liquidNW, understating your net worth at the unlock age.',
    insight:
      'The income engine computed lockedAssetUnlock per row, but the projection layer (which builds on top of income rows) never included `liquidNW += incomeRow.lockedAssetUnlock`. This meant setting a $100K endowment maturing at age 50 would show the unlock in income breakdowns but leave your portfolio balance unchanged.',
    affectedSections: ['section-net-worth'],
  },
  {
    date: '2026-02-25',
    category: 'feature',
    title: 'SRS and healthcare breakdown in projection table',
    description:
      'The year-by-year projection table now shows SRS balance, contributions, and taxable withdrawals under Income Breakdown, and healthcare premium breakdown (MediShield Life, ISP, CareShield Life, out-of-pocket, MediSave deductible) under Expenses Breakdown. Columns auto-hide when the feature is not enabled.',
    affectedSections: ['section-projection'],
  },
  {
    date: '2026-02-24',
    category: 'feature',
    title: 'Locked Assets',
    description:
      'Track illiquid holdings (employer RSUs, fixed deposits, foreign pensions) that become accessible at a specific age. Each asset grows at a configurable rate, contributes to total net worth but not accessible net worth for FIRE calculations, and flows into your liquid portfolio upon unlocking. Up to 10 locked assets supported.',
    affectedSections: ['section-net-worth'],
  },
  {
    date: '2026-02-24',
    category: 'feature',
    title: 'CPF Voluntary Top-Ups',
    description:
      'Model voluntary contributions to CPF OA, SA, and MA. SA top-ups qualify for RSTU tax relief (up to $8,000 deduction). Top-ups are capped at the Annual Limit ($37,740) and integrate into income projection, CPF balances, and tax calculations.',
    affectedSections: ['section-cpf'],
  },
  {
    date: '2026-02-24',
    category: 'fix',
    title: 'Simulations use actual retirement expenses',
    description:
      'Monte Carlo, backtest, and sequence risk engines now use your actual annual expenses at retirement for the initial withdrawal amount instead of portfolio × SWR. SWR optimizer and backtest heatmap continue to vary withdrawal rate independently for rate-sweeping analysis.',
    affectedSections: ['section-simulation'],
  },
  {
    date: '2026-02-24',
    category: 'fix',
    title: 'Percentage input display precision',
    description:
      'Fixed floating-point noise in percentage inputs (e.g. 1.7000000000000002% now displays correctly as 1.7%).',
  },
  {
    date: '2026-02-24',
    category: 'data-update',
    title: 'Medisave BHS corrected to $79,000',
    description:
      'Basic Healthcare Sum (BHS) updated to $79,000 for 2026. CPF Annual Limit constant ($37,740) added for voluntary top-up cap enforcement.',
    affectedSections: ['section-cpf'],
  },
  {
    date: '2026-02-24',
    category: 'fix',
    title: 'CPF interest uses mid-year approximation',
    description:
      'CPF interest is now computed on mid-year effective balances. Contributions and housing withdrawals are treated as spread evenly through the year, matching real-world monthly CPF mechanics more closely.',
    affectedSections: ['section-cpf'],
  },
  {
    date: '2026-02-24',
    category: 'feature',
    title: 'Dynamic property value in projection',
    description:
      'Property value now appreciates year-over-year at your configured rate. Leasehold properties optionally depreciate via Bala\'s Table curve as the remaining lease shortens (toggle on/off). Mortgage balance amortizes realistically. Mortgage cash payment appears as a default projection column, and a new Property column group shows property value, outstanding mortgage, equity, and total NW including property.',
    affectedSections: ['section-property'],
  },
  {
    date: '2026-02-24',
    category: 'feature',
    title: 'CPFIS invested amounts and additional return in projections',
    description:
      'Year-by-year CPF and income projection tables now show CPFIS-OA, CPFIS-SA (amounts above $20K/$40K retention invested at your custom rates), and CPFIS Add. Return (extra interest earned vs standard CPF rates). Columns appear only when CPFIS is enabled.',
    affectedSections: ['section-cpf'],
  },
  {
    date: '2026-02-24',
    category: 'feature',
    title: 'CPF OA Withdrawal modelling',
    description:
      'Model lump-sum withdrawals from CPF OA after age 55. Withdrawn amounts transfer into your liquid portfolio, improving post-retirement cashflow.',
    affectedSections: ['section-cpf'],
  },
  {
    date: '2026-02-24',
    category: 'feature',
    title: 'CPFIS (CPF Investment Scheme)',
    description:
      'Enable CPFIS to model investing CPF OA/SA balances above retention limits ($20K OA, $40K SA) at custom return rates. CPFIS automatically reverts to standard rates after age 55 when SA closes.',
    affectedSections: ['section-cpf'],
  },
  {
    date: '2026-02-24',
    category: 'fix',
    title: 'Mortgage now ends after loan term',
    description:
      'Mortgage payments in the projection now correctly stop after the remaining loan tenure instead of running forever. Fractional years (e.g. 25 years 3 months) are handled by rounding up.',
    affectedSections: ['section-property'],
  },
  {
    date: '2026-02-24',
    category: 'fix',
    title: 'CPF OA shortfall spills to cash expenses',
    description:
      'When your CPF OA is depleted and can no longer cover its share of mortgage payments, the shortfall now correctly increases your cash expenses and portfolio drawdown.',
    affectedSections: ['section-property'],
  },
  {
    date: '2026-02-24',
    category: 'fix',
    title: 'CPF SA excess at age 55 preserved',
    description:
      'When your SA balance exceeds the retirement sum at age 55, the excess now correctly transfers to OA instead of disappearing.',
    affectedSections: ['section-cpf'],
  },
  {
    date: '2026-02-24',
    category: 'feature',
    title: 'Update notifications',
    description:
      'You\'ll now see a banner when regulatory data or app features change. Section-level nudges highlight exactly which inputs to review. See the full changelog under Reference Guide > What\'s New.',
  },
  {
    date: '2026-02-24',
    category: 'data-update',
    title: 'CPF retirement sums updated to 2026',
    description:
      'BRS/FRS/ERS base values updated to 2026 published figures. Year-offset projection bug fixed.',
    affectedSections: ['section-cpf'],
  },
  {
    date: '2026-02-24',
    category: 'data-update',
    title: 'Default SWR lowered from 4.0% to 3.6%',
    description:
      'Safe withdrawal rate default lowered to 3.6% using forward-looking return estimates instead of full historical averages. Your existing SWR setting is preserved.',
    affectedSections: ['section-fire-settings'],
  },
  {
    date: '2026-02-24',
    category: 'data-update',
    title: 'Forward-looking return estimates',
    description:
      'Asset class expected returns now use forward-looking estimates rather than full historical averages, reflecting current market conditions.',
    affectedSections: ['section-allocation'],
  },
  {
    date: '2026-02-24',
    category: 'feature',
    title: 'Source citations in tooltips',
    description:
      'Regulatory value tooltips now cite the official source (IRAS, CPF Board, MOM) with clickable links to the relevant government pages.',
  },
  {
    date: '2026-02-24',
    category: 'feature',
    title: 'Property co-ownership support',
    description:
      'Set your ownership percentage to see proportionally scaled property values, mortgage deductions, and CPF OA housing usage.',
    affectedSections: ['section-property'],
  },
  {
    date: '2026-02-24',
    category: 'feature',
    title: 'Financial goals tracking',
    description:
      'Add one-off financial goals (wedding, renovation, education) with target dates and amounts. Goals appear as expense spikes in your projection.',
    affectedSections: ['section-fire-settings'],
  },
  {
    date: '2026-02-24',
    category: 'feature',
    title: 'CPF projection detail columns',
    description:
      'Projection table now shows OA/SA balances, contributions, and OA shortfall columns. CPF assumptions panel shows exact rates used.',
  },
  {
    date: '2026-02-24',
    category: 'feature',
    title: 'Robust JSON import with validation',
    description:
      'Import now validates data against schemas and runs store migrations automatically. Structured error reporting shows exactly what was imported or skipped.',
  },
  {
    date: '2026-02-24',
    category: 'feature',
    title: 'Portfolio depletion warning',
    description:
      'Start page and Dashboard now warn when your portfolio is projected to run out before life expectancy.',
  },
  {
    date: '2026-02-24',
    category: 'fix',
    title: 'Number input clamping',
    description:
      'Keyboard input and blur now correctly clamp values to min/max ranges instead of allowing out-of-bounds entries.',
  },
]

/** Bump this string whenever any data file is updated. Triggers the banner for returning users. */
export const DATA_VINTAGE = '2026-02-25'
