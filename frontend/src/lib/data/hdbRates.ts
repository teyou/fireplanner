// Source: HDB website (https://www.hdb.gov.sg)
// Last updated: 2026-02-21

export type HdbFlatType = '2-room' | '3-room' | '4-room' | '5-room' | 'executive'

export const LBS_RETAINED_LEASE_OPTIONS = [20, 25, 30, 35] as const

/**
 * Indicative subletting rates by flat type (SGD/room/month).
 * For placeholder suggestions only — actual rates are user-input.
 */
export const SUBLETTING_RATE_SUGGESTIONS: Record<HdbFlatType, { low: number; high: number }> = {
  '2-room': { low: 500, high: 800 },
  '3-room': { low: 600, high: 1000 },
  '4-room': { low: 700, high: 1200 },
  '5-room': { low: 800, high: 1500 },
  'executive': { low: 900, high: 1800 },
}

/** CPF OA interest rate for accrued interest calculation */
export const CPF_OA_RATE = 0.025
