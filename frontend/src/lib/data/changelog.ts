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
    date: '2026-02-24',
    category: 'data-update',
    title: 'CPF rates updated to 2026',
    description:
      'Retirement sums (BRS/FRS/ERS) updated to 2026 published values. OW ceiling unchanged at $6,800/month.',
    affectedSections: ['section-cpf'],
  },
  {
    date: '2026-02-24',
    category: 'data-update',
    title: 'Default SWR changed from 4.0% to 3.6%',
    description:
      'Safe withdrawal rate default lowered to 3.6% based on forward-looking return estimates. Your existing SWR setting is preserved.',
    affectedSections: ['section-fire-settings'],
  },
  {
    date: '2026-02-24',
    category: 'feature',
    title: 'Source citations added to tooltips',
    description:
      'Regulatory value tooltips now cite the official source (IRAS, CPF Board, MOM) with clickable links.',
  },
  {
    date: '2026-02-24',
    category: 'feature',
    title: 'Property co-ownership support',
    description:
      'Set your ownership percentage to see scaled property values and mortgage deductions.',
    affectedSections: ['section-property'],
  },
  {
    date: '2026-02-24',
    category: 'feature',
    title: 'Financial goals tracking',
    description:
      'Add one-off financial goals (wedding, renovation, education) with target dates and amounts.',
    affectedSections: ['section-fire-settings'],
  },
]

/** Bump this string whenever any data file is updated. Triggers the banner for returning users. */
export const DATA_VINTAGE = '2026-02-24'
