// MOM Salary Benchmarks — Median Gross Annual Income by Age and Education
// Source: MOM Labour Force Survey 2025, Table C7 (https://stats.mom.gov.sg/Pages/Gross-Monthly-Income-Tables2025.aspx)
// Downloaded: 2026-02-25
// License: SG Open Data License
// Note: Monthly medians annualized (× 12). Includes employer CPF.
//       belowSecondary 20-24 is suppressed in official data (small sample); estimated from adjacent brackets.

import type { MomSalaryEntry } from '@/lib/types'

export const MOM_SALARY_DATA: MomSalaryEntry[] = [
  {
    ageGroup: '20-24',
    belowSecondary: 28200, // suppressed in official data; estimated from 25-29 ratio
    secondary: 30816,
    postSecondary: 30804,
    diploma: 40620,
    degree: 56160,
  },
  {
    ageGroup: '25-29',
    belowSecondary: 36504,
    secondary: 39756,
    postSecondary: 40716,
    diploma: 46848,
    degree: 70224,
  },
  {
    ageGroup: '30-34',
    belowSecondary: 40956,
    secondary: 45600,
    postSecondary: 45636,
    diploma: 56160,
    degree: 90996,
  },
  {
    ageGroup: '35-39',
    belowSecondary: 40320,
    secondary: 46020,
    postSecondary: 48672,
    diploma: 65520,
    degree: 111096,
  },
  {
    ageGroup: '40-44',
    belowSecondary: 38868,
    secondary: 48336,
    postSecondary: 49140,
    diploma: 72000,
    degree: 126540,
  },
  {
    ageGroup: '45-49',
    belowSecondary: 39492,
    secondary: 50544,
    postSecondary: 49140,
    diploma: 75348,
    degree: 136320,
  },
  {
    ageGroup: '50-54',
    belowSecondary: 39312,
    secondary: 48000,
    postSecondary: 49140,
    diploma: 76056,
    degree: 141000,
  },
  {
    ageGroup: '55-59',
    belowSecondary: 35088,
    secondary: 45396,
    postSecondary: 45636,
    diploma: 69300,
    degree: 133344,
  },
  {
    ageGroup: '60-64',
    belowSecondary: 27960,
    secondary: 38976,
    postSecondary: 38316,
    diploma: 60000,
    degree: 112992,
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
