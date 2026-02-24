export interface ChangelogEntry {
  date: string
  title: string
  description: string
  category: 'data-update' | 'feature' | 'fix'
  /** Optional section IDs for section-level nudges (e.g., 'section-cpf') */
  affectedSections?: string[]
}

/** Newest first. */
export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-02-25',
    category: 'fix',
    title: 'Mortgage now ends after loan term',
    description:
      'Mortgage payments in the projection now correctly stop after the remaining loan tenure instead of running forever. Fractional years (e.g. 25 years 3 months) are handled by rounding up.',
    affectedSections: ['section-property'],
  },
  {
    date: '2026-02-25',
    category: 'fix',
    title: 'CPF OA shortfall spills to cash expenses',
    description:
      'When your CPF OA is depleted and can no longer cover its share of mortgage payments, the shortfall now correctly increases your cash expenses and portfolio drawdown.',
    affectedSections: ['section-property'],
  },
  {
    date: '2026-02-25',
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
