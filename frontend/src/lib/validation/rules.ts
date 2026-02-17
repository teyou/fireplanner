import type { ValidationErrors, ProfileState, IncomeState, AllocationState, WithdrawalState } from '@/lib/types'

/**
 * Cross-field validation rules within the profile store.
 * Returns a map of field names to error messages.
 */
export function validateProfileConsistency(
  profile: Pick<ProfileState, 'currentAge' | 'retirementAge' | 'lifeExpectancy' | 'cpfLifeStartAge' | 'cpfMortgageYearsLeft' | 'cpfHousingMode' | 'cpfRetirementSum'>
): ValidationErrors {
  const errors: ValidationErrors = {}

  if (profile.retirementAge <= profile.currentAge) {
    errors.retirementAge = 'Retirement age must be greater than current age'
  }

  if (profile.lifeExpectancy <= profile.retirementAge) {
    errors.lifeExpectancy = 'Life expectancy must be greater than retirement age'
  }

  if (profile.cpfLifeStartAge >= profile.lifeExpectancy) {
    errors.cpfLifeStartAge = 'CPF LIFE start age must be less than life expectancy'
  }

  if (profile.cpfHousingMode !== 'none') {
    const housingEndAge = profile.currentAge + profile.cpfMortgageYearsLeft
    if (housingEndAge > profile.retirementAge) {
      errors.cpfMortgageYearsLeft = `Mortgage ends at age ${housingEndAge} which exceeds retirement age (${profile.retirementAge})`
    }
  }

  return errors
}

/**
 * Cross-store validation: income store rules that depend on profile store.
 */
export function validateCrossStoreRules(
  profile: Pick<ProfileState, 'currentAge' | 'retirementAge' | 'lifeExpectancy'>,
  income: Pick<IncomeState, 'incomeStreams' | 'lifeEvents' | 'lifeEventsEnabled' | 'promotionJumps'>
): ValidationErrors {
  const errors: ValidationErrors = {}

  // Income stream validation against profile
  for (const stream of income.incomeStreams) {
    if (stream.endAge > profile.lifeExpectancy) {
      errors[`incomeStream_${stream.id}_endAge`] =
        `End age (${stream.endAge}) cannot exceed life expectancy (${profile.lifeExpectancy})`
    }
    if (stream.startAge >= stream.endAge) {
      errors[`incomeStream_${stream.id}_startAge`] =
        `Start age must be less than end age`
    }
  }

  // Life event validation against profile
  if (income.lifeEventsEnabled) {
    for (const event of income.lifeEvents) {
      if (event.endAge > profile.lifeExpectancy) {
        errors[`lifeEvent_${event.id}_endAge`] =
          `End age (${event.endAge}) cannot exceed life expectancy (${profile.lifeExpectancy})`
      }
      if (event.startAge >= event.endAge) {
        errors[`lifeEvent_${event.id}_startAge`] =
          `Start age must be less than end age`
      }
    }
  }

  // Promotion jump ages within working years
  for (let i = 0; i < income.promotionJumps.length; i++) {
    const jump = income.promotionJumps[i]
    if (jump.age < profile.currentAge) {
      errors[`promotionJump_${i}_age`] =
        `Promotion age (${jump.age}) must be >= current age (${profile.currentAge})`
    }
    if (jump.age > profile.retirementAge) {
      errors[`promotionJump_${i}_age`] =
        `Promotion age (${jump.age}) must be <= retirement age (${profile.retirementAge})`
    }
  }

  return errors
}

/**
 * Cross-store validation: allocation store rules that depend on profile store.
 */
export function validateAllocationCrossStoreRules(
  profile: Pick<ProfileState, 'currentAge' | 'lifeExpectancy'>,
  allocation: Pick<AllocationState, 'glidePathConfig' | 'targetWeights'>
): ValidationErrors {
  const errors: ValidationErrors = {}

  if (allocation.glidePathConfig.enabled) {
    if (allocation.glidePathConfig.startAge < profile.currentAge) {
      errors['glidePathConfig.startAge'] =
        `Glide path start age (${allocation.glidePathConfig.startAge}) must be >= current age (${profile.currentAge})`
    }
    if (allocation.glidePathConfig.endAge > profile.lifeExpectancy) {
      errors['glidePathConfig.endAge'] =
        `Glide path end age (${allocation.glidePathConfig.endAge}) must be <= life expectancy (${profile.lifeExpectancy})`
    }
    if (allocation.glidePathConfig.startAge >= allocation.glidePathConfig.endAge) {
      errors['glidePathConfig.startAge'] =
        'Glide path start age must be less than end age'
    }

    // Validate target weights sum when glide path is enabled
    const targetSum = allocation.targetWeights.reduce((a, b) => a + b, 0)
    if (Math.abs(targetSum - 1) >= 0.001) {
      errors.targetWeights = 'Target weights must sum to 100% when glide path is enabled'
    }
  }

  return errors
}

/**
 * Cross-store validation: withdrawal store rules that depend on profile store.
 */
export function validateWithdrawalCrossStoreRules(
  profile: Pick<ProfileState, 'annualExpenses' | 'retirementAge' | 'lifeExpectancy'>,
  withdrawal: Pick<WithdrawalState, 'strategyParams'>
): ValidationErrors {
  const errors: ValidationErrors = {}

  const fc = withdrawal.strategyParams.floor_ceiling
  if (fc.floor > profile.annualExpenses * 3) {
    errors['floor_ceiling.floor'] = 'Floor seems too high relative to annual expenses'
  }

  const duration = profile.lifeExpectancy - profile.retirementAge
  if (duration <= 0) {
    errors.duration = 'Retirement duration must be positive'
  }

  return errors
}
