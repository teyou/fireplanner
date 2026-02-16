// MOM Salary Benchmarks — Median Gross Annual Income by Age and Education
// Source: MOM Labour Force Survey, Table 7B (https://stats.mom.gov.sg)
// Downloaded: 2024-12-01
// License: SG Open Data License
// Note: Monthly medians annualized (× 12). Approximate values.

import type { MomSalaryEntry } from '@/lib/types'

export const MOM_SALARY_DATA: MomSalaryEntry[] = [
  {
    ageGroup: '20-24',
    belowSecondary: 20280,
    secondary: 22620,
    postSecondary: 24960,
    diploma: 28080,
    degree: 42000,
  },
  {
    ageGroup: '25-29',
    belowSecondary: 24960,
    secondary: 28080,
    postSecondary: 32760,
    diploma: 36960,
    degree: 57000,
  },
  {
    ageGroup: '30-34',
    belowSecondary: 28080,
    secondary: 33540,
    postSecondary: 39000,
    diploma: 45240,
    degree: 72000,
  },
  {
    ageGroup: '35-39',
    belowSecondary: 30420,
    secondary: 37440,
    postSecondary: 43680,
    diploma: 50700,
    degree: 85800,
  },
  {
    ageGroup: '40-44',
    belowSecondary: 31200,
    secondary: 39000,
    postSecondary: 46800,
    diploma: 54600,
    degree: 97500,
  },
  {
    ageGroup: '45-49',
    belowSecondary: 30420,
    secondary: 39000,
    postSecondary: 46020,
    diploma: 54600,
    degree: 102000,
  },
  {
    ageGroup: '50-54',
    belowSecondary: 28860,
    secondary: 36660,
    postSecondary: 43680,
    diploma: 50700,
    degree: 97500,
  },
  {
    ageGroup: '55-59',
    belowSecondary: 24180,
    secondary: 31200,
    postSecondary: 37440,
    diploma: 42900,
    degree: 84000,
  },
  {
    ageGroup: '60-64',
    belowSecondary: 18720,
    secondary: 24180,
    postSecondary: 28860,
    diploma: 33540,
    degree: 63000,
  },
]

/**
 * Get the MOM salary benchmark for a given age and education level.
 * Returns the annual salary for the matching age group bracket.
 */
export function getMomSalary(
  age: number,
  education: keyof Omit<MomSalaryEntry, 'ageGroup'> = 'degree'
): number {
  const entry = MOM_SALARY_DATA.find((row) => {
    const [minStr, maxStr] = row.ageGroup.split('-')
    const min = parseInt(minStr, 10)
    const max = parseInt(maxStr, 10)
    return age >= min && age <= max
  })
  if (!entry) {
    // Outside known range — use closest bracket
    if (age < 20) return MOM_SALARY_DATA[0][education]
    return MOM_SALARY_DATA[MOM_SALARY_DATA.length - 1][education]
  }
  return entry[education]
}
