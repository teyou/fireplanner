/**
 * Retirement preparation checklist: track real-world action items.
 * Persisted in localStorage independently of scenario state —
 * checklist progress tracks actions taken, not planning inputs.
 */

const STORAGE_KEY = 'fireplanner-checklist'

export type ChecklistCategory =
  | 'Legal & Estate'
  | 'Insurance'
  | 'Financial'
  | 'CPF'
  | 'Lifestyle'

export interface ChecklistItem {
  id: string
  category: ChecklistCategory
  label: string
  description: string
  referenceLink?: string
}

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  // Legal & Estate
  {
    id: 'make-will',
    category: 'Legal & Estate',
    label: 'Make or update your will',
    description: 'A will directs how your non-CPF assets are distributed. Without one, intestacy rules apply.',
    referenceLink: '/reference#legacy',
  },
  {
    id: 'lpa',
    category: 'Legal & Estate',
    label: 'Register a Lasting Power of Attorney (LPA)',
    description: 'Appoint a trusted person to make decisions if you lose mental capacity. Register with the OPG.',
    referenceLink: '/reference#legacy',
  },
  {
    id: 'amd',
    category: 'Legal & Estate',
    label: 'Consider an Advance Medical Directive (AMD)',
    description: 'Instruct doctors on life-sustaining treatment preferences when terminally ill and unconscious.',
    referenceLink: '/reference#legacy',
  },

  // CPF
  {
    id: 'cpf-nomination',
    category: 'CPF',
    label: 'Make or update CPF nomination',
    description: 'CPF savings are NOT covered by your will. Nominate beneficiaries via my cpf online.',
    referenceLink: '/reference#cpf-nominations',
  },
  {
    id: 'srs-nomination',
    category: 'CPF',
    label: 'Make SRS nomination with your bank',
    description: 'SRS accounts require a separate nomination with your SRS operator bank.',
    referenceLink: '/reference#cpf-nominations',
  },
  {
    id: 'cpf-life-plan',
    category: 'CPF',
    label: 'Review CPF LIFE plan selection',
    description: 'Choose between Basic, Standard, or Escalating plan. Consider payout vs bequest preferences.',
  },

  // Insurance
  {
    id: 'medishield-life',
    category: 'Insurance',
    label: 'Review MediShield Life coverage',
    description: 'Ensure your basic health insurance is adequate. Consider upgrading via an Integrated Shield Plan.',
    referenceLink: '/reference#healthcare',
  },
  {
    id: 'isp-review',
    category: 'Insurance',
    label: 'Review Integrated Shield Plan (ISP) tier',
    description: 'Assess whether your ISP tier matches your healthcare preferences (restructured vs private hospital).',
    referenceLink: '/reference#healthcare',
  },
  {
    id: 'careshield-life',
    category: 'Insurance',
    label: 'Check CareShield Life / ElderShield status',
    description: 'Long-term disability coverage. Consider supplementary plans for higher payouts.',
    referenceLink: '/reference#healthcare',
  },
  {
    id: 'life-insurance',
    category: 'Insurance',
    label: 'Review life insurance adequacy',
    description: 'Ensure coverage matches your dependents\' needs. Consider whether term or whole life is appropriate.',
  },

  // Financial
  {
    id: 'emergency-fund',
    category: 'Financial',
    label: 'Build 6-12 month emergency fund',
    description: 'Keep liquid cash reserves in high-yield savings separate from your investment portfolio.',
  },
  {
    id: 'debt-review',
    category: 'Financial',
    label: 'Review and plan to clear high-interest debt',
    description: 'Credit card debt and personal loans should be cleared before retirement. Mortgage is typically acceptable.',
  },
  {
    id: 'parent-support',
    category: 'Financial',
    label: 'Plan for aging parent support costs',
    description: 'Budget for allowances, eldercare, and medical costs for aging parents. Discuss with siblings.',
    referenceLink: '/reference#dependents',
  },

  // Lifestyle
  {
    id: 'retirement-activities',
    category: 'Lifestyle',
    label: 'Plan meaningful retirement activities',
    description: 'FIRE success requires purpose beyond finances. Identify hobbies, volunteering, or part-time interests.',
  },
  {
    id: 'healthcare-budget',
    category: 'Lifestyle',
    label: 'Budget for rising healthcare costs',
    description: 'Out-of-pocket healthcare costs accelerate with age. Factor this into your expense projections.',
    referenceLink: '/reference#healthcare',
  },
]

const CATEGORIES: ChecklistCategory[] = [
  'Legal & Estate',
  'Insurance',
  'Financial',
  'CPF',
  'Lifestyle',
]

export function getCategories(): ChecklistCategory[] {
  return CATEGORIES
}

export function getItemsByCategory(category: ChecklistCategory): ChecklistItem[] {
  return CHECKLIST_ITEMS.filter((item) => item.category === category)
}

function readChecked(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {}
    return parsed
  } catch {
    return {}
  }
}

function writeChecked(checked: Record<string, boolean>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checked))
  } catch {
    // Storage unavailable (private browsing / quota exceeded)
  }
}

/** Get the current checked state of all items. */
export function getCheckedItems(): Record<string, boolean> {
  return readChecked()
}

/** Toggle a checklist item. Returns the new checked state. */
export function toggleItem(id: string): boolean {
  const checked = readChecked()
  const newState = !checked[id]
  if (newState) {
    checked[id] = true
  } else {
    delete checked[id]
  }
  writeChecked(checked)
  return newState
}

/** Get progress counts. */
export function getProgress(): { checked: number; total: number } {
  const checked = readChecked()
  const checkedCount = CHECKLIST_ITEMS.filter((item) => checked[item.id]).length
  return { checked: checkedCount, total: CHECKLIST_ITEMS.length }
}

/** Reset all checked items. */
export function resetChecklist(): void {
  localStorage.removeItem(STORAGE_KEY)
}
