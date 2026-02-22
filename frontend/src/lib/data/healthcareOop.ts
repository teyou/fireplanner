// Healthcare Out-of-Pocket (OOP) Expense Multipliers — Singapore
//
// Two selectable curves:
//
// 1. STUDY-BACKED (default) — derived from PMC4862090 multimorbidity study
//    (Bähler et al., 2015), World Bank OOP data, and SingStat HES 2023.
//    Compressed upper-age multipliers reflect Singapore's elderly subsidies
//    (Pioneer/Merdeka packages, CHAS, MediSave top-ups) that reduce OOP.
//    Ages 30-65 are identical to the conservative curve.
//    Ages 70+: PMC data shows 60-74 baseline ~2.5x, 75-84 is +48% (~3.7x),
//    85+ is +261% (~9x total cost). OOP compressed ~15% by subsidies.
//
// 2. CONSERVATIVE — for users planning for higher costs (private care,
//    no means-tested subsidies, chronic conditions, safety buffer).
//    Keeps the original steeper trajectory at age 70+.
//
// Source: MOH National Health Accounts, LKY School of Public Policy aging
//         cost research, PMC4862090 (multimorbidity healthcare costs).
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

import type { OopCurveVariant } from '@/lib/types'

interface AgeMultiplier {
  age: number
  multiplier: number
}

/**
 * Study-Backed OOP multiplier curve.
 * Compressed upper-age multipliers per PMC4862090 and Singapore subsidy data.
 * Ages 30-65: identical to conservative. Ages 70+: lower multipliers.
 */
export const OOP_STUDY_BACKED_MULTIPLIERS: AgeMultiplier[] = [
  { age: 30, multiplier: 1.0 },
  { age: 35, multiplier: 1.1 },
  { age: 40, multiplier: 1.25 },
  { age: 45, multiplier: 1.4 },
  { age: 50, multiplier: 1.6 },
  { age: 55, multiplier: 2.0 },
  { age: 60, multiplier: 2.5 },
  { age: 65, multiplier: 3.2 },
  { age: 70, multiplier: 3.5 },
  { age: 75, multiplier: 4.5 },
  { age: 80, multiplier: 5.5 },
  { age: 85, multiplier: 6.75 },
  { age: 90, multiplier: 8.0 },
  { age: 95, multiplier: 9.0 },
  { age: 100, multiplier: 10.0 },
]

/**
 * Conservative OOP multiplier curve.
 * Higher upper-age multipliers for users who expect private care,
 * no means-tested subsidies, or want a safety buffer.
 * Preserves the original (pre-research) trajectory.
 */
export const OOP_CONSERVATIVE_MULTIPLIERS: AgeMultiplier[] = [
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

/** @deprecated Use OOP_CONSERVATIVE_MULTIPLIERS for the original curve */
export const OOP_AGE_MULTIPLIERS = OOP_CONSERVATIVE_MULTIPLIERS

/**
 * Get the multiplier table for a given curve variant.
 */
function getMultiplierTable(variant: OopCurveVariant): AgeMultiplier[] {
  return variant === 'conservative'
    ? OOP_CONSERVATIVE_MULTIPLIERS
    : OOP_STUDY_BACKED_MULTIPLIERS
}

/**
 * Interpolate the OOP multiplier for a given age and curve variant.
 * Returns 1.0 for ages below 30, and the last value for ages above the table max.
 */
export function interpolateOopMultiplier(
  age: number,
  variant: OopCurveVariant = 'study-backed',
): number {
  const table = getMultiplierTable(variant)

  if (age <= table[0].age) return table[0].multiplier
  const last = table[table.length - 1]
  if (age >= last.age) return last.multiplier

  // Find the two bracketing data points
  for (let i = 0; i < table.length - 1; i++) {
    const lo = table[i]
    const hi = table[i + 1]
    if (age >= lo.age && age <= hi.age) {
      const t = (age - lo.age) / (hi.age - lo.age)
      return lo.multiplier + t * (hi.multiplier - lo.multiplier)
    }
  }

  return 1.0 // fallback
}
