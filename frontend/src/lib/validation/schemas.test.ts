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
  validateProfileField,
} from './schemas'
import {
  validateProfileConsistency,
  validateCrossStoreRules,
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
  it('returns empty when no income streams', () => {
    const errors = validateCrossStoreRules(
      { lifeExpectancy: 90 },
      { incomeStreams: [] }
    )
    expect(Object.keys(errors)).toHaveLength(0)
  })

  it('catches income stream end age exceeding life expectancy', () => {
    const errors = validateCrossStoreRules(
      { lifeExpectancy: 90 },
      {
        incomeStreams: [
          {
            id: '1',
            name: 'Salary',
            annualAmount: 72000,
            startAge: 25,
            endAge: 95,
            growthRate: 0.03,
            isTaxable: true,
            isCpfApplicable: true,
          },
        ],
      }
    )
    expect(errors['incomeStream_1_endAge']).toBeTruthy()
  })

  it('passes when end age equals life expectancy', () => {
    const errors = validateCrossStoreRules(
      { lifeExpectancy: 90 },
      {
        incomeStreams: [
          {
            id: '1',
            name: 'Salary',
            annualAmount: 72000,
            startAge: 25,
            endAge: 90,
            growthRate: 0.03,
            isTaxable: true,
            isCpfApplicable: true,
          },
        ],
      }
    )
    expect(Object.keys(errors)).toHaveLength(0)
  })
})
