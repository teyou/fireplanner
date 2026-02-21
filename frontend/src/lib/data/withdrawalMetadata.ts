/**
 * Metadata for the 6 withdrawal strategies.
 * Used by StrategyComparisonCard for at-a-glance comparison.
 */

import type { WithdrawalStrategyType } from '@/lib/types'

export interface StrategyMetadata {
  key: WithdrawalStrategyType
  label: string
  shortDescription: string
  pros: string[]
  cons: string[]
  bestFor: string
  complexity: 'Low' | 'Medium' | 'High'
}

export const WITHDRAWAL_STRATEGY_METADATA: StrategyMetadata[] = [
  {
    key: 'constant_dollar',
    label: 'Constant Dollar (4% Rule)',
    shortDescription:
      'Withdraw a fixed percentage of initial portfolio, adjusted for inflation each year.',
    pros: [
      'Simple and easy to follow',
      'Predictable income stream',
      'Well-researched (Trinity Study)',
    ],
    cons: [
      'Ignores portfolio performance',
      'Risk of depletion in bad markets',
      'May leave large unspent balance',
    ],
    bestFor: 'Retirees who want simplicity and predictable spending.',
    complexity: 'Low',
  },
  {
    key: 'vpw',
    label: 'Variable Percentage (VPW)',
    shortDescription:
      'Withdrawal percentage adjusts based on remaining years and portfolio balance — like a self-annuitizing schedule.',
    pros: [
      'Adapts to portfolio performance',
      'Near-zero depletion risk',
      'Maximizes lifetime spending',
    ],
    cons: [
      'Income varies year to year',
      'Can drop sharply in downturns',
      'Requires comfort with uncertainty',
    ],
    bestFor: 'Flexible retirees comfortable with variable income.',
    complexity: 'Medium',
  },
  {
    key: 'guardrails',
    label: 'Guardrails (Guyton-Klinger)',
    shortDescription:
      'Spending stays constant unless portfolio drifts above a ceiling or below a floor trigger, then adjusts by a fixed step.',
    pros: [
      'Balances stability and adaptability',
      'Clear decision rules',
      'Limits extreme outcomes',
    ],
    cons: [
      'Occasional forced spending cuts',
      'More parameters to configure',
      'Can be confusing at first',
    ],
    bestFor: 'Retirees who want mostly stable spending with guardrails against extremes.',
    complexity: 'High',
  },
  {
    key: 'vanguard_dynamic',
    label: 'Vanguard Dynamic',
    shortDescription:
      'Start with a base SWR, then cap annual increases and decreases within ceiling/floor bands.',
    pros: [
      'Smooth income changes',
      'Limits both upside and downside',
      'Backed by Vanguard research',
    ],
    cons: [
      'Less responsive than VPW',
      'May lag portfolio recovery',
      'Three parameters to tune',
    ],
    bestFor: 'Retirees who want gradual, bounded adjustments.',
    complexity: 'Medium',
  },
  {
    key: 'cape_based',
    label: 'CAPE-Based',
    shortDescription:
      'Withdrawal rate blends a base rate with the cyclically-adjusted P/E ratio — withdraw more when markets are cheap.',
    pros: [
      'Market-valuation aware',
      'Higher withdrawals in undervalued markets',
      'Research-backed by Shiller',
    ],
    cons: [
      'Requires CAPE estimate input',
      'CAPE may not predict short-term returns',
      'More complex to explain',
    ],
    bestFor: 'Investors who follow market valuations and want to time withdrawals.',
    complexity: 'High',
  },
  {
    key: 'floor_ceiling',
    label: 'Floor & Ceiling',
    shortDescription:
      'Set absolute minimum and maximum annual spending. Withdraw at a target rate, clamped to the floor and ceiling.',
    pros: [
      'Guarantees minimum lifestyle',
      'Caps excess spending',
      'Easy to understand bounds',
    ],
    cons: [
      'Floor may force portfolio depletion',
      'Ceiling limits upside',
      'Requires knowing your spending bounds',
    ],
    bestFor: 'Retirees with clear minimum needs and maximum comfort levels.',
    complexity: 'Low',
  },
]
