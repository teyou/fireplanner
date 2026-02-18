// Healthcare Out-of-Pocket (OOP) Expense Multipliers — Singapore
//
// Source: Derived from MOH National Health Accounts (household out-of-pocket
//         health expenditure by age group), supplemented by LKY School of
//         Public Policy aging cost research.
// As of: 2025
// License: Public data / academic research
//
// IMPORTANT: These multipliers are modeled estimates, NOT direct government
// publications. They represent the typical trajectory of out-of-pocket
// healthcare spending as a function of age, normalized to 1.0 at age 30.
// Actual individual spending varies widely.
//
// The user provides a base annual OOP amount (default $1,200 at age 30).
// The multiplier at their current age is applied to derive the annual OOP cost.

/**
 * OOP expense multiplier data points by age.
 * Values between data points are linearly interpolated.
 * The multiplier represents relative healthcare spending vs age 30 baseline.
 */
export const OOP_AGE_MULTIPLIERS: { age: number; multiplier: number }[] = [
  { age: 30, multiplier: 1.0 },
  { age: 35, multiplier: 1.1 },
  { age: 40, multiplier: 1.25 },
  { age: 45, multiplier: 1.4 },
  { age: 50, multiplier: 1.6 },
  { age: 55, multiplier: 2.0 },
  { age: 60, multiplier: 2.5 },
  { age: 65, multiplier: 3.2 },
  { age: 70, multiplier: 4.5 },
  { age: 75, multiplier: 6.0 },
  { age: 80, multiplier: 7.5 },
  { age: 85, multiplier: 9.5 },
  { age: 90, multiplier: 12.0 },
  { age: 95, multiplier: 14.0 },
  { age: 100, multiplier: 15.0 },
]

/**
 * Interpolate the OOP multiplier for a given age.
 * Returns 1.0 for ages below 30, and the last value for ages above the table max.
 */
export function interpolateOopMultiplier(age: number): number {
  if (age <= OOP_AGE_MULTIPLIERS[0].age) return OOP_AGE_MULTIPLIERS[0].multiplier
  const last = OOP_AGE_MULTIPLIERS[OOP_AGE_MULTIPLIERS.length - 1]
  if (age >= last.age) return last.multiplier

  // Find the two bracketing data points
  for (let i = 0; i < OOP_AGE_MULTIPLIERS.length - 1; i++) {
    const lo = OOP_AGE_MULTIPLIERS[i]
    const hi = OOP_AGE_MULTIPLIERS[i + 1]
    if (age >= lo.age && age <= hi.age) {
      const t = (age - lo.age) / (hi.age - lo.age)
      return lo.multiplier + t * (hi.multiplier - lo.multiplier)
    }
  }

  return 1.0 // fallback
}
