/**
 * Metadata for the 12 withdrawal strategies.
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
  category: 'Basic' | 'Adaptive' | 'Smoothed'
  remark?: string
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
    category: 'Basic',
    remark: 'One of the simplest methods that avoids overcomplicating retirement. Rather than switching to a complex strategy, consider simply using a lower withdrawal rate (e.g. 3%) for a larger safety margin.',
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
    category: 'Adaptive',
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
    category: 'Adaptive',
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
    category: 'Adaptive',
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
    category: 'Smoothed',
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
    category: 'Smoothed',
  },
  {
    key: 'percent_of_portfolio',
    label: 'Percent of Portfolio',
    shortDescription:
      'Withdraw a fixed percentage of the current portfolio each year. Income rises and falls with the market.',
    pros: [
      'Impossible to deplete portfolio',
      'Simple — one parameter',
      'Naturally adapts to market conditions',
    ],
    cons: [
      'Income is volatile year to year',
      'Spending drops sharply in downturns',
      'No inflation protection guarantee',
    ],
    bestFor: 'Retirees with flexible spending who can tolerate income swings.',
    category: 'Basic',
  },
  {
    key: 'one_over_n',
    label: '1/N (Remaining Years)',
    shortDescription:
      'Divide portfolio by remaining years of retirement. Withdrawals naturally increase as time shrinks, spending everything by the end.',
    pros: [
      'Zero parameters — fully automatic',
      'Spending increases over time',
      'Guarantees full portfolio utilisation',
    ],
    cons: [
      'Portfolio reaches zero at life expectancy',
      'No buffer for longevity risk',
      'Early years have low withdrawals',
    ],
    bestFor: 'Retirees who want to maximize lifetime spending with no bequest goal.',
    category: 'Basic',
  },
  {
    key: 'sensible_withdrawals',
    label: 'Sensible Withdrawals',
    shortDescription:
      'Take a base withdrawal plus a share of the previous year\'s investment gains. No penalty in down years — extras only apply to positive gains.',
    pros: [
      'Bonus income in good years',
      'Downside protected — no extra cuts',
      'Intuitive "share the gains" logic',
    ],
    cons: [
      'Base rate must be conservative',
      'Income lumpy in volatile markets',
      'Two parameters to configure',
    ],
    bestFor: 'Retirees who want a stable base with upside participation.',
    category: 'Smoothed',
  },
  {
    key: 'ninety_five_percent',
    label: '95% Rule',
    shortDescription:
      'Withdraw at a target rate, but never less than 95% of last year\'s withdrawal. The floor prevents dramatic income drops during crashes.',
    pros: [
      'Limits worst-case income drop to 5%/yr',
      'Simple floor rule on top of SWR',
      'Smooths out market volatility',
    ],
    cons: [
      'Floor can accelerate depletion in prolonged downturns',
      'Ratchet effect may overspend',
      'Less responsive to portfolio recovery',
    ],
    bestFor: 'Retirees who prioritize income stability over portfolio longevity.',
    category: 'Adaptive',
  },
  {
    key: 'endowment',
    label: 'Endowment (Yale Model)',
    shortDescription:
      'Smoothed blend of inflation-adjusted prior withdrawal and market-based target — the approach used by university endowments.',
    pros: [
      'Very smooth income transitions',
      'Proven institutional approach',
      'Balances inertia with market reality',
    ],
    cons: [
      'Slow to react to big market moves',
      'Smoothing weight is subjective',
      'Can lag behind in rapid recovery',
    ],
    bestFor: 'Retirees who value income predictability above all else.',
    category: 'Smoothed',
  },
  {
    key: 'hebeler_autopilot',
    label: 'Hebeler Autopilot II',
    shortDescription:
      '75% inflation-adjusted prior withdrawal + 25% actuarial PMT. Blends spending stability with mathematical precision.',
    pros: [
      'Actuarially grounded',
      'Naturally adjusts as remaining years shrink',
      'Good balance of stability and adaptability',
    ],
    cons: [
      'Requires understanding of PMT/VPW math',
      'Blending ratio is fixed at 75/25',
      'Income can drift from actual needs',
    ],
    bestFor: 'Analytically-minded retirees who want a disciplined, auto-adjusting approach.',
    category: 'Smoothed',
  },
]
