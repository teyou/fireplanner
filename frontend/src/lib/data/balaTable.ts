/**
 * Bala's Table: Leasehold to Freehold Factor
 * Maps remaining lease (years) to the ratio of leasehold value
 * relative to freehold value.
 *
 * Source: Singapore Land Authority (SLA)
 * Last updated: 2024
 */

// Key remaining lease years → factor (fraction of freehold value)
const BALA_TABLE_RAW: [number, number][] = [
  [99, 0.99],
  [95, 0.98],
  [90, 0.96],
  [85, 0.95],
  [80, 0.93],
  [75, 0.91],
  [70, 0.88],
  [65, 0.85],
  [60, 0.82],
  [55, 0.78],
  [50, 0.73],
  [45, 0.68],
  [40, 0.62],
  [35, 0.55],
  [30, 0.48],
  [25, 0.40],
  [20, 0.32],
  [15, 0.23],
  [10, 0.15],
  [5, 0.07],
  [0, 0.00],
]

/**
 * Look up the Bala's Table factor for a given remaining lease.
 * Linearly interpolates between defined points.
 */
export function getBalaFactor(remainingLease: number): number {
  if (remainingLease >= 99) return 0.99
  if (remainingLease <= 0) return 0

  // Find surrounding points
  for (let i = 0; i < BALA_TABLE_RAW.length - 1; i++) {
    const [upperLease, upperFactor] = BALA_TABLE_RAW[i]
    const [lowerLease, lowerFactor] = BALA_TABLE_RAW[i + 1]
    if (remainingLease <= upperLease && remainingLease >= lowerLease) {
      const ratio = (remainingLease - lowerLease) / (upperLease - lowerLease)
      return lowerFactor + ratio * (upperFactor - lowerFactor)
    }
  }

  return 0
}

export { BALA_TABLE_RAW }
