import type { ValidationErrors, ProfileState, IncomeState } from '@/lib/types'

/**
 * Cross-field validation rules within the profile store.
 * Returns a map of field names to error messages.
 */
export function validateProfileConsistency(
  profile: Pick<ProfileState, 'currentAge' | 'retirementAge' | 'lifeExpectancy'>
): ValidationErrors {
  const errors: ValidationErrors = {}

  if (profile.retirementAge <= profile.currentAge) {
    errors.retirementAge = 'Retirement age must be greater than current age'
  }

  if (profile.lifeExpectancy <= profile.retirementAge) {
    errors.lifeExpectancy = 'Life expectancy must be greater than retirement age'
  }

  return errors
}

/**
 * Cross-store validation: income store rules that depend on profile store.
 */
export function validateCrossStoreRules(
  profile: Pick<ProfileState, 'lifeExpectancy'>,
  income: Pick<IncomeState, 'incomeStreams'>
): ValidationErrors {
  const errors: ValidationErrors = {}

  for (const stream of income.incomeStreams) {
    if (stream.endAge > profile.lifeExpectancy) {
      errors[`incomeStream_${stream.id}_endAge`] =
        `End age (${stream.endAge}) cannot exceed life expectancy (${profile.lifeExpectancy})`
    }
  }

  return errors
}
