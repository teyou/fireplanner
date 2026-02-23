/**
 * Goal templates with Singapore-specific default amounts.
 * All amounts are in SGD.
 */
import type { GoalCategory } from '../types'

export const GOAL_TEMPLATES: Array<{
  category: GoalCategory
  label: string
  defaultAmount: number
  defaultDuration: number
  description: string
}> = [
  { category: 'wedding', label: 'Wedding', defaultAmount: 50000, defaultDuration: 1,
    description: 'SG average $30-80K' },
  { category: 'education', label: "Children's Education", defaultAmount: 300000, defaultDuration: 4,
    description: 'Local uni $30-50K, overseas $200-500K over 4 years' },
  { category: 'housing', label: 'Home Downpayment', defaultAmount: 100000, defaultDuration: 1,
    description: 'HDB $50-150K, condo $200-500K' },
  { category: 'vehicle', label: 'Car Purchase', defaultAmount: 120000, defaultDuration: 1,
    description: 'COE + car $80-200K in Singapore' },
  { category: 'travel', label: 'Sabbatical Travel', defaultAmount: 30000, defaultDuration: 1,
    description: 'Extended travel or gap year' },
  { category: 'renovation', label: 'Home Renovation', defaultAmount: 60000, defaultDuration: 1,
    description: 'SG reno $30-100K' },
  { category: 'family', label: 'New Baby', defaultAmount: 20000, defaultDuration: 1,
    description: 'Birth costs + setup' },
]
