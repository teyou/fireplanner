/**
 * Buyer's Stamp Duty (BSD) and Additional Buyer's Stamp Duty (ABSD) rates.
 *
 * BSD Source: IRAS (https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/buyer's-stamp-duty-(bsd))
 * ABSD Source: IRAS (https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/additional-buyer's-stamp-duty-(absd))
 * As of: 27 Apr 2023 (last revised)
 * Downloaded: 2026-02-24
 */

export const STAMP_DUTY_DATA_YEAR = 2023

/** BSD progressive brackets: [bracketSize, rate] */
export const BSD_BRACKETS: [number, number][] = [
  [180000, 0.01],
  [180000, 0.02],
  [640000, 0.03],
  [500000, 0.04],
  [1500000, 0.05],
  [Infinity, 0.06],
]

export type ResidencyType = 'citizen' | 'pr' | 'foreigner'

/** ABSD rates by residency and property count [1st, 2nd, 3rd+] */
export const ABSD_RATES: Record<ResidencyType, number[]> = {
  citizen: [0, 0.20, 0.30],
  pr: [0.05, 0.30, 0.35],
  foreigner: [0.60, 0.60, 0.60],
}
