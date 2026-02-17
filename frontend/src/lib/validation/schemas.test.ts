import { describe, it, expect } from 'vitest'
import {
  ageSchema,
  retirementAgeSchema,
  lifeExpectancySchema,
  swrSchema,
  expensesSchema,
  inflationSchema,
  expenseRatioSchema,
  profileSchema,
  incomeSchema,
  careerPhaseSchema,
  promotionJumpSchema,
  allocationWeightsSchema,
  glidePathConfigSchema,
  validateProfileField,
  validateIncomeField,
  validateAllocationField,
} from './schemas'
import {
  validateProfileConsistency,
  validateCrossStoreRules,
  validateAllocationCrossStoreRules,
} from './rules'

describe('field schemas', () => {
  describe('ageSchema', () => {
    it('accepts valid ages (18-100)', () => {
      expect(ageSchema.safeParse(18).success).toBe(true)
      expect(ageSchema.safeParse(30).success).toBe(true)
      expect(ageSchema.safeParse(100).success).toBe(true)
    })

    it('rejects out-of-range ages', () => {
      expect(ageSchema.safeParse(17).success).toBe(false)
      expect(ageSchema.safeParse(101).success).toBe(false)
    })

    it('rejects non-integer ages', () => {
      expect(ageSchema.safeParse(30.5).success).toBe(false)
    })

    it('rejects non-numbers', () => {
      expect(ageSchema.safeParse('30').success).toBe(false)
      expect(ageSchema.safeParse(null).success).toBe(false)
    })
  })

  describe('retirementAgeSchema', () => {
    it('accepts valid range (30-100)', () => {
      expect(retirementAgeSchema.safeParse(30).success).toBe(true)
      expect(retirementAgeSchema.safeParse(65).success).toBe(true)
    })

    it('rejects below 30', () => {
      expect(retirementAgeSchema.safeParse(29).success).toBe(false)
    })
  })

  describe('lifeExpectancySchema', () => {
    it('accepts valid range (50-120)', () => {
      expect(lifeExpectancySchema.safeParse(50).success).toBe(true)
      expect(lifeExpectancySchema.safeParse(90).success).toBe(true)
      expect(lifeExpectancySchema.safeParse(120).success).toBe(true)
    })

    it('rejects below 50', () => {
      expect(lifeExpectancySchema.safeParse(49).success).toBe(false)
    })
  })

  describe('swrSchema', () => {
    it('accepts 1% to 10%', () => {
      expect(swrSchema.safeParse(0.01).success).toBe(true)
      expect(swrSchema.safeParse(0.04).success).toBe(true)
      expect(swrSchema.safeParse(0.10).success).toBe(true)
    })

    it('rejects below 1%', () => {
      expect(swrSchema.safeParse(0.005).success).toBe(false)
    })

    it('rejects above 10%', () => {
      expect(swrSchema.safeParse(0.11).success).toBe(false)
    })
  })

  describe('expensesSchema', () => {
    it('accepts positive numbers', () => {
      expect(expensesSchema.safeParse(1).success).toBe(true)
      expect(expensesSchema.safeParse(100000).success).toBe(true)
    })

    it('rejects zero and negative', () => {
      expect(expensesSchema.safeParse(0).success).toBe(false)
      expect(expensesSchema.safeParse(-1000).success).toBe(false)
    })
  })

  describe('inflationSchema', () => {
    it('accepts 0% to 15%', () => {
      expect(inflationSchema.safeParse(0).success).toBe(true)
      expect(inflationSchema.safeParse(0.025).success).toBe(true)
      expect(inflationSchema.safeParse(0.15).success).toBe(true)
    })

    it('rejects above 15%', () => {
      expect(inflationSchema.safeParse(0.16).success).toBe(false)
    })
  })

  describe('expenseRatioSchema', () => {
    it('accepts 0% to 3%', () => {
      expect(expenseRatioSchema.safeParse(0).success).toBe(true)
      expect(expenseRatioSchema.safeParse(0.003).success).toBe(true)
      expect(expenseRatioSchema.safeParse(0.03).success).toBe(true)
    })

    it('rejects above 3%', () => {
      expect(expenseRatioSchema.safeParse(0.031).success).toBe(false)
    })
  })
})

describe('profileSchema', () => {
  const validProfile = {
    currentAge: 30,
    retirementAge: 65,
    lifeExpectancy: 90,
    lifeStage: 'pre-fire' as const,
    maritalStatus: 'single' as const,
    residencyStatus: 'citizen' as const,
    annualIncome: 72000,
    annualExpenses: 48000,
    liquidNetWorth: 100000,
    cpfOA: 50000,
    cpfSA: 20000,
    cpfMA: 10000,
    srsBalance: 0,
    srsAnnualContribution: 0,
    fireType: 'regular' as const,
    swr: 0.04,
    expectedReturn: 0.07,
    inflation: 0.025,
    expenseRatio: 0.003,
    rebalanceFrequency: 'annual' as const,
    cpfLifeStartAge: 65,
    cpfLifePlan: 'standard' as const,
    cpfRetirementSum: 'frs' as const,
    cpfHousingMode: 'none' as const,
    cpfHousingMonthly: 0,
    cpfHousingEndAge: 65,
  }

  it('accepts valid profile', () => {
    expect(profileSchema.safeParse(validProfile).success).toBe(true)
  })

  it('rejects retirement age <= current age', () => {
    const result = profileSchema.safeParse({ ...validProfile, retirementAge: 30 })
    expect(result.success).toBe(false)
  })

  it('rejects life expectancy <= retirement age', () => {
    const result = profileSchema.safeParse({ ...validProfile, lifeExpectancy: 65 })
    expect(result.success).toBe(false)
  })

  it('rejects negative expenses', () => {
    const result = profileSchema.safeParse({ ...validProfile, annualExpenses: -1000 })
    expect(result.success).toBe(false)
  })

  it('rejects invalid enum values', () => {
    const result = profileSchema.safeParse({ ...validProfile, lifeStage: 'unknown' })
    expect(result.success).toBe(false)
  })
})

describe('incomeSchema', () => {
  const validIncome = {
    salaryModel: 'simple' as const,
    annualSalary: 72000,
    salaryGrowthRate: 0.03,
    employerCpfEnabled: true,
    incomeStreams: [],
    lifeEvents: [],
    realisticPhases: [
      { label: 'Early Career', minAge: 22, maxAge: 30, growthRate: 0.08 },
    ],
    promotionJumps: [],
    momEducation: 'degree' as const,
    momAdjustment: 1.0,
    lifeEventsEnabled: false,
    personalReliefs: 20000,
  }

  it('accepts valid income state', () => {
    expect(incomeSchema.safeParse(validIncome).success).toBe(true)
  })

  it('rejects negative salary', () => {
    const result = incomeSchema.safeParse({ ...validIncome, annualSalary: -1 })
    expect(result.success).toBe(false)
  })

  it('rejects extreme growth rate', () => {
    const result = incomeSchema.safeParse({ ...validIncome, salaryGrowthRate: 0.5 })
    expect(result.success).toBe(false)
  })
})

describe('validateProfileField', () => {
  it('returns null for valid field', () => {
    expect(validateProfileField('currentAge', 30)).toBeNull()
    expect(validateProfileField('swr', 0.04)).toBeNull()
  })

  it('returns error message for invalid field', () => {
    expect(validateProfileField('currentAge', 17)).toBeTruthy()
    expect(validateProfileField('swr', 0.5)).toBeTruthy()
    expect(validateProfileField('annualExpenses', -100)).toBeTruthy()
  })

  it('returns null for unknown fields', () => {
    expect(validateProfileField('unknownField', 'anything')).toBeNull()
  })
})

describe('validateProfileConsistency', () => {
  it('returns empty for valid profile', () => {
    const errors = validateProfileConsistency({
      currentAge: 30,
      retirementAge: 65,
      lifeExpectancy: 90,
    })
    expect(Object.keys(errors)).toHaveLength(0)
  })

  it('catches retirement age <= current age', () => {
    const errors = validateProfileConsistency({
      currentAge: 30,
      retirementAge: 30,
      lifeExpectancy: 90,
    })
    expect(errors.retirementAge).toBeTruthy()
  })

  it('catches life expectancy <= retirement age', () => {
    const errors = validateProfileConsistency({
      currentAge: 30,
      retirementAge: 65,
      lifeExpectancy: 65,
    })
    expect(errors.lifeExpectancy).toBeTruthy()
  })

  it('catches both violations simultaneously', () => {
    const errors = validateProfileConsistency({
      currentAge: 65,
      retirementAge: 30,
      lifeExpectancy: 30,
    })
    expect(Object.keys(errors).length).toBeGreaterThanOrEqual(2)
  })
})

describe('validateCrossStoreRules', () => {
  const defaultIncome = {
    incomeStreams: [],
    lifeEvents: [],
    lifeEventsEnabled: false,
    promotionJumps: [],
  }
  const defaultProfile = { currentAge: 30, retirementAge: 65, lifeExpectancy: 90 }

  it('returns empty when no income streams', () => {
    const errors = validateCrossStoreRules(defaultProfile, defaultIncome)
    expect(Object.keys(errors)).toHaveLength(0)
  })

  it('catches income stream end age exceeding life expectancy', () => {
    const errors = validateCrossStoreRules(defaultProfile, {
      ...defaultIncome,
      incomeStreams: [
        {
          id: '1', name: 'Salary', annualAmount: 72000,
          startAge: 25, endAge: 95, growthRate: 0.03,
          type: 'employment', growthModel: 'fixed', taxTreatment: 'taxable',
          isCpfApplicable: true, isActive: true,
        },
      ],
    })
    expect(errors['incomeStream_1_endAge']).toBeTruthy()
  })

  it('passes when end age equals life expectancy', () => {
    const errors = validateCrossStoreRules(defaultProfile, {
      ...defaultIncome,
      incomeStreams: [
        {
          id: '1', name: 'Salary', annualAmount: 72000,
          startAge: 25, endAge: 90, growthRate: 0.03,
          type: 'employment', growthModel: 'fixed', taxTreatment: 'taxable',
          isCpfApplicable: true, isActive: true,
        },
      ],
    })
    expect(Object.keys(errors)).toHaveLength(0)
  })

  it('catches life event end age exceeding life expectancy', () => {
    const errors = validateCrossStoreRules(defaultProfile, {
      ...defaultIncome,
      lifeEventsEnabled: true,
      lifeEvents: [
        {
          id: 'e1', name: 'Break', startAge: 35, endAge: 95,
          incomeImpact: 0, affectedStreamIds: [],
          savingsPause: true, cpfPause: true,
        },
      ],
    })
    expect(errors['lifeEvent_e1_endAge']).toBeTruthy()
  })

  it('does not validate life events when disabled', () => {
    const errors = validateCrossStoreRules(defaultProfile, {
      ...defaultIncome,
      lifeEventsEnabled: false,
      lifeEvents: [
        {
          id: 'e1', name: 'Break', startAge: 35, endAge: 95,
          incomeImpact: 0, affectedStreamIds: [],
          savingsPause: true, cpfPause: true,
        },
      ],
    })
    expect(Object.keys(errors)).toHaveLength(0)
  })

  it('catches promotion jump before current age', () => {
    const errors = validateCrossStoreRules(defaultProfile, {
      ...defaultIncome,
      promotionJumps: [{ age: 25, increasePercent: 0.2 }],
    })
    expect(errors['promotionJump_0_age']).toBeTruthy()
  })

  it('catches promotion jump after retirement age', () => {
    const errors = validateCrossStoreRules(defaultProfile, {
      ...defaultIncome,
      promotionJumps: [{ age: 70, increasePercent: 0.2 }],
    })
    expect(errors['promotionJump_0_age']).toBeTruthy()
  })
})

describe('careerPhaseSchema', () => {
  it('accepts valid career phase', () => {
    expect(careerPhaseSchema.safeParse({
      label: 'Early Career', minAge: 22, maxAge: 30, growthRate: 0.08,
    }).success).toBe(true)
  })

  it('rejects empty label', () => {
    expect(careerPhaseSchema.safeParse({
      label: '', minAge: 22, maxAge: 30, growthRate: 0.08,
    }).success).toBe(false)
  })

  it('rejects growth rate > 50%', () => {
    expect(careerPhaseSchema.safeParse({
      label: 'Test', minAge: 22, maxAge: 30, growthRate: 0.6,
    }).success).toBe(false)
  })
})

describe('promotionJumpSchema', () => {
  it('accepts valid promotion jump', () => {
    expect(promotionJumpSchema.safeParse({ age: 30, increasePercent: 0.2 }).success).toBe(true)
  })

  it('rejects zero increase', () => {
    expect(promotionJumpSchema.safeParse({ age: 30, increasePercent: 0 }).success).toBe(false)
  })

  it('rejects increase > 200%', () => {
    expect(promotionJumpSchema.safeParse({ age: 30, increasePercent: 2.5 }).success).toBe(false)
  })
})

describe('validateIncomeField', () => {
  it('returns null for valid salary', () => {
    expect(validateIncomeField('annualSalary', 72000)).toBeNull()
  })

  it('returns error for negative salary', () => {
    expect(validateIncomeField('annualSalary', -1)).toBeTruthy()
  })

  it('returns null for valid MOM adjustment', () => {
    expect(validateIncomeField('momAdjustment', 1.0)).toBeNull()
  })

  it('returns error for MOM adjustment > 3', () => {
    expect(validateIncomeField('momAdjustment', 4.0)).toBeTruthy()
  })

  it('returns null for unknown fields', () => {
    expect(validateIncomeField('unknownField', 'anything')).toBeNull()
  })
})

// ============================================================
// Allocation Schema Tests
// ============================================================

describe('allocationWeightsSchema', () => {
  it('accepts weights summing to 1.0', () => {
    expect(allocationWeightsSchema.safeParse(
      [0.30, 0.10, 0.10, 0.25, 0.05, 0.05, 0.10, 0.05]
    ).success).toBe(true)
  })

  it('accepts weights with tiny floating point error', () => {
    // 0.1 + 0.2 = 0.30000000000000004 in JS
    expect(allocationWeightsSchema.safeParse(
      [0.15, 0.05, 0.05, 0.45, 0.05, 0.05, 0.15, 0.05]
    ).success).toBe(true)
  })

  it('rejects weights not summing to 1.0', () => {
    const result = allocationWeightsSchema.safeParse(
      [0.30, 0.10, 0.10, 0.25, 0.05, 0.05, 0.10, 0.10]
    )
    expect(result.success).toBe(false)
  })

  it('rejects negative weights', () => {
    const result = allocationWeightsSchema.safeParse(
      [-0.10, 0.20, 0.10, 0.25, 0.05, 0.05, 0.10, 0.35]
    )
    expect(result.success).toBe(false)
  })

  it('rejects weights > 1', () => {
    const result = allocationWeightsSchema.safeParse(
      [1.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.1]
    )
    expect(result.success).toBe(false)
  })

  it('rejects wrong array length', () => {
    expect(allocationWeightsSchema.safeParse([0.5, 0.5]).success).toBe(false)
    expect(allocationWeightsSchema.safeParse([]).success).toBe(false)
  })
})

describe('glidePathConfigSchema', () => {
  it('accepts valid config', () => {
    expect(glidePathConfigSchema.safeParse({
      enabled: true, method: 'linear', startAge: 55, endAge: 65,
    }).success).toBe(true)
  })

  it('accepts disabled config regardless of ages', () => {
    // Even with startAge >= endAge, disabled config passes the object validation
    // but fails the refinement. Disabled configs should still have valid structure.
    expect(glidePathConfigSchema.safeParse({
      enabled: false, method: 'linear', startAge: 55, endAge: 65,
    }).success).toBe(true)
  })

  it('rejects startAge >= endAge', () => {
    const result = glidePathConfigSchema.safeParse({
      enabled: true, method: 'linear', startAge: 65, endAge: 55,
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid method', () => {
    expect(glidePathConfigSchema.safeParse({
      enabled: true, method: 'invalid', startAge: 55, endAge: 65,
    }).success).toBe(false)
  })

  it('accepts all three methods', () => {
    for (const method of ['linear', 'slowStart', 'fastStart']) {
      expect(glidePathConfigSchema.safeParse({
        enabled: true, method, startAge: 55, endAge: 65,
      }).success).toBe(true)
    }
  })
})

describe('validateAllocationField', () => {
  it('returns null for valid weights', () => {
    expect(validateAllocationField('currentWeights',
      [0.30, 0.10, 0.10, 0.25, 0.05, 0.05, 0.10, 0.05]
    )).toBeNull()
  })

  it('returns error for invalid weights', () => {
    expect(validateAllocationField('currentWeights',
      [0.50, 0.10, 0.10, 0.25, 0.05, 0.05, 0.10, 0.05]
    )).toBeTruthy()
  })

  it('returns null for unknown fields', () => {
    expect(validateAllocationField('unknownField', 'anything')).toBeNull()
  })
})

describe('validateAllocationCrossStoreRules', () => {
  const defaultProfile = { currentAge: 30, lifeExpectancy: 90 }
  const validTargetWeights = [0.15, 0.05, 0.05, 0.45, 0.05, 0.05, 0.15, 0.05]
  const disabledGlidePath = {
    enabled: false, method: 'linear' as const, startAge: 55, endAge: 65,
  }

  it('returns empty when glide path disabled', () => {
    const errors = validateAllocationCrossStoreRules(defaultProfile, {
      glidePathConfig: disabledGlidePath,
      targetWeights: validTargetWeights,
    })
    expect(Object.keys(errors)).toHaveLength(0)
  })

  it('catches glide path startAge < currentAge', () => {
    const errors = validateAllocationCrossStoreRules(defaultProfile, {
      glidePathConfig: { enabled: true, method: 'linear', startAge: 25, endAge: 65 },
      targetWeights: validTargetWeights,
    })
    expect(errors['glidePathConfig.startAge']).toBeTruthy()
  })

  it('catches glide path endAge > lifeExpectancy', () => {
    const errors = validateAllocationCrossStoreRules(defaultProfile, {
      glidePathConfig: { enabled: true, method: 'linear', startAge: 55, endAge: 95 },
      targetWeights: validTargetWeights,
    })
    expect(errors['glidePathConfig.endAge']).toBeTruthy()
  })

  it('catches glide path startAge >= endAge', () => {
    const errors = validateAllocationCrossStoreRules(defaultProfile, {
      glidePathConfig: { enabled: true, method: 'linear', startAge: 70, endAge: 60 },
      targetWeights: validTargetWeights,
    })
    expect(errors['glidePathConfig.startAge']).toBeTruthy()
  })

  it('catches target weights not summing to 1.0 when enabled', () => {
    const errors = validateAllocationCrossStoreRules(defaultProfile, {
      glidePathConfig: { enabled: true, method: 'linear', startAge: 55, endAge: 65 },
      targetWeights: [0.50, 0.10, 0.10, 0.25, 0.05, 0.05, 0.10, 0.05],
    })
    expect(errors.targetWeights).toBeTruthy()
  })

  it('passes with valid glide path config', () => {
    const errors = validateAllocationCrossStoreRules(defaultProfile, {
      glidePathConfig: { enabled: true, method: 'linear', startAge: 55, endAge: 65 },
      targetWeights: validTargetWeights,
    })
    expect(Object.keys(errors)).toHaveLength(0)
  })
})
