import { describe, it, expect } from 'vitest'
import {
  validateProfileConsistency,
  validateCrossStoreRules,
  validateWithdrawalCrossStoreRules,
} from './rules'

const defaultHealthcareConfig = {
  enabled: false,
  mediShieldLifeEnabled: true,
  ispTier: 'none' as const,
  careShieldLifeEnabled: true,
  oopBaseAmount: 1200,
  oopModel: 'age-curve' as const,
  oopInflationRate: 0.03,
  oopReferenceAge: 30,
  mediSaveTopUpAnnual: 0,
}

describe('validateProfileConsistency edge cases', () => {
  it('catches CPF LIFE start age >= life expectancy', () => {
    const errors = validateProfileConsistency({
      currentAge: 30,
      retirementAge: 55,
      lifeExpectancy: 65,
      lifeStage: 'pre-fire',
      cpfLifeStartAge: 65,
      parentSupportEnabled: false,
      parentSupport: [],
      healthcareConfig: defaultHealthcareConfig,
      retirementWithdrawals: [],
      financialGoals: [],
      cpfOaWithdrawals: [],
    })
    expect(errors.cpfLifeStartAge).toBeTruthy()
  })

  it('catches parent support start age < 18', () => {
    const errors = validateProfileConsistency({
      currentAge: 30,
      retirementAge: 55,
      lifeExpectancy: 90,
      lifeStage: 'pre-fire',
      cpfLifeStartAge: 65,
      parentSupportEnabled: true,
      parentSupport: [
        { id: 'ps1', label: 'Mom', monthlyAmount: 500, startAge: 16, endAge: 65, growthRate: 0 },
      ],
      healthcareConfig: defaultHealthcareConfig,
      retirementWithdrawals: [],
      financialGoals: [],
      cpfOaWithdrawals: [],
    })
    expect(errors['parentSupport_ps1_startAge']).toBeTruthy()
  })

  it('catches parent support end age > life expectancy', () => {
    const errors = validateProfileConsistency({
      currentAge: 30,
      retirementAge: 55,
      lifeExpectancy: 90,
      lifeStage: 'pre-fire',
      cpfLifeStartAge: 65,
      parentSupportEnabled: true,
      parentSupport: [
        { id: 'ps1', label: 'Mom', monthlyAmount: 500, startAge: 30, endAge: 95, growthRate: 0 },
      ],
      healthcareConfig: defaultHealthcareConfig,
      retirementWithdrawals: [],
      financialGoals: [],
      cpfOaWithdrawals: [],
    })
    expect(errors['parentSupport_ps1_endAge']).toBeTruthy()
  })

  it('catches healthcare OOP base amount out of range', () => {
    const errors = validateProfileConsistency({
      currentAge: 30,
      retirementAge: 55,
      lifeExpectancy: 90,
      lifeStage: 'pre-fire',
      cpfLifeStartAge: 65,
      parentSupportEnabled: false,
      parentSupport: [],
      healthcareConfig: {
        ...defaultHealthcareConfig,
        enabled: true,
        oopBaseAmount: 60000, // exceeds $50,000 max
      },
      retirementWithdrawals: [],
      financialGoals: [],
      cpfOaWithdrawals: [],
    })
    expect(errors['healthcareConfig.oopBaseAmount']).toBeTruthy()
  })

  it('catches healthcare MediSave top-up out of range', () => {
    const errors = validateProfileConsistency({
      currentAge: 30,
      retirementAge: 55,
      lifeExpectancy: 90,
      lifeStage: 'pre-fire',
      cpfLifeStartAge: 65,
      parentSupportEnabled: false,
      parentSupport: [],
      healthcareConfig: {
        ...defaultHealthcareConfig,
        enabled: true,
        mediSaveTopUpAnnual: 50000, // exceeds $37,740 max
      },
      retirementWithdrawals: [],
      financialGoals: [],
      cpfOaWithdrawals: [],
    })
    expect(errors['healthcareConfig.mediSaveTopUpAnnual']).toBeTruthy()
  })

  it('skips healthcare validation when disabled', () => {
    const errors = validateProfileConsistency({
      currentAge: 30,
      retirementAge: 55,
      lifeExpectancy: 90,
      lifeStage: 'pre-fire',
      cpfLifeStartAge: 65,
      parentSupportEnabled: false,
      parentSupport: [],
      healthcareConfig: {
        ...defaultHealthcareConfig,
        enabled: false,
        oopBaseAmount: 60000, // would be invalid if enabled
      },
      retirementWithdrawals: [],
      financialGoals: [],
      cpfOaWithdrawals: [],
    })
    expect(errors['healthcareConfig.oopBaseAmount']).toBeUndefined()
  })
})

describe('validateCrossStoreRules edge cases', () => {
  it('catches income stream startAge >= endAge', () => {
    const errors = validateCrossStoreRules(
      { currentAge: 30, retirementAge: 65, lifeExpectancy: 90 },
      {
        incomeStreams: [{
          id: '1', name: 'Salary', annualAmount: 72000,
          startAge: 65, endAge: 65,
          growthRate: 0.03, type: 'employment', growthModel: 'fixed',
          taxTreatment: 'taxable', isCpfApplicable: true, isActive: true,
        }],
        lifeEvents: [],
        lifeEventsEnabled: false,
        promotionJumps: [],
      },
    )
    expect(errors['incomeStream_1_startAge']).toBeTruthy()
  })

  it('validates multiple streams independently', () => {
    const errors = validateCrossStoreRules(
      { currentAge: 30, retirementAge: 65, lifeExpectancy: 90 },
      {
        incomeStreams: [
          { id: '1', name: 'OK', annualAmount: 72000, startAge: 30, endAge: 65, growthRate: 0.03, type: 'employment', growthModel: 'fixed', taxTreatment: 'taxable', isCpfApplicable: true, isActive: true },
          { id: '2', name: 'Bad', annualAmount: 24000, startAge: 30, endAge: 95, growthRate: 0, type: 'rental', growthModel: 'fixed', taxTreatment: 'taxable', isCpfApplicable: false, isActive: true },
        ],
        lifeEvents: [],
        lifeEventsEnabled: false,
        promotionJumps: [],
      },
    )
    expect(errors['incomeStream_1_endAge']).toBeUndefined()
    expect(errors['incomeStream_2_endAge']).toBeTruthy()
  })
})

describe('validateWithdrawalCrossStoreRules edge cases', () => {
  it('does not warn when floor is within 3x expenses', () => {
    const errors = validateWithdrawalCrossStoreRules(
      { annualExpenses: 48000, retirementAge: 55, lifeExpectancy: 90 },
      { strategyParams: { floor_ceiling: { floor: 100000, ceiling: 200000, targetRate: 0.045 } } } as Parameters<typeof validateWithdrawalCrossStoreRules>[1],
    )
    expect(errors['floor_ceiling.floor']).toBeUndefined()
  })
})

describe('retirement withdrawal cross-store validation', () => {
  it('catches withdrawal age < retirement age', () => {
    const errors = validateProfileConsistency({
      currentAge: 30,
      retirementAge: 65,
      lifeExpectancy: 90,
      lifeStage: 'pre-fire',
      cpfLifeStartAge: 65,
      parentSupportEnabled: false,
      parentSupport: [],
      healthcareConfig: defaultHealthcareConfig,
      retirementWithdrawals: [
        { id: 'rw1', label: 'Too early', amount: 50000, age: 60, durationYears: 1, inflationAdjusted: true },
      ],
      financialGoals: [],
      cpfOaWithdrawals: [],
    })
    expect(errors['retirementWithdrawal_rw1_age']).toBeTruthy()
  })

  it('catches withdrawal end age > life expectancy', () => {
    const errors = validateProfileConsistency({
      currentAge: 30,
      retirementAge: 55,
      lifeExpectancy: 90,
      lifeStage: 'pre-fire',
      cpfLifeStartAge: 65,
      parentSupportEnabled: false,
      parentSupport: [],
      healthcareConfig: defaultHealthcareConfig,
      retirementWithdrawals: [
        { id: 'rw1', label: 'Eldercare', amount: 2000, age: 85, durationYears: 10, inflationAdjusted: true },
      ],
      financialGoals: [],
      cpfOaWithdrawals: [],
    })
    expect(errors['retirementWithdrawal_rw1_durationYears']).toBeTruthy()
  })

  it('accepts valid withdrawal within bounds', () => {
    const errors = validateProfileConsistency({
      currentAge: 30,
      retirementAge: 55,
      lifeExpectancy: 90,
      lifeStage: 'pre-fire',
      cpfLifeStartAge: 65,
      parentSupportEnabled: false,
      parentSupport: [],
      healthcareConfig: defaultHealthcareConfig,
      retirementWithdrawals: [
        { id: 'rw1', label: 'Car', amount: 50000, age: 60, durationYears: 1, inflationAdjusted: true },
        { id: 'rw2', label: 'Eldercare', amount: 2000, age: 75, durationYears: 10, inflationAdjusted: false },
      ],
      financialGoals: [],
      cpfOaWithdrawals: [],
    })
    expect(errors['retirementWithdrawal_rw1_age']).toBeUndefined()
    expect(errors['retirementWithdrawal_rw1_durationYears']).toBeUndefined()
    expect(errors['retirementWithdrawal_rw2_age']).toBeUndefined()
    expect(errors['retirementWithdrawal_rw2_durationYears']).toBeUndefined()
  })

  it('catches boundary case: age + durationYears exactly equals life expectancy', () => {
    // age 80 + 10 years = 90 = lifeExpectancy → should be valid (< is used, but 80+10=90)
    const errors = validateProfileConsistency({
      currentAge: 30,
      retirementAge: 55,
      lifeExpectancy: 90,
      lifeStage: 'pre-fire',
      cpfLifeStartAge: 65,
      parentSupportEnabled: false,
      parentSupport: [],
      healthcareConfig: defaultHealthcareConfig,
      retirementWithdrawals: [
        { id: 'rw1', label: 'Boundary', amount: 10000, age: 80, durationYears: 10, inflationAdjusted: true },
      ],
      financialGoals: [],
      cpfOaWithdrawals: [],
    })
    // 80 + 10 = 90 = lifeExpectancy → the condition is > lifeExpectancy, so exactly equal should pass
    expect(errors['retirementWithdrawal_rw1_durationYears']).toBeUndefined()
  })
})

describe('financial goals validation', () => {
  it('catches goal with amount <= 0', () => {
    const errors = validateProfileConsistency({
      currentAge: 30,
      retirementAge: 55,
      lifeExpectancy: 90,
      lifeStage: 'pre-fire',
      cpfLifeStartAge: 65,
      parentSupportEnabled: false,
      parentSupport: [],
      healthcareConfig: defaultHealthcareConfig,
      retirementWithdrawals: [],
      financialGoals: [
        { id: 'g1', label: 'Bad', amount: 0, targetAge: 40, durationYears: 1, priority: 'important', inflationAdjusted: true, category: 'other' },
      ],
      cpfOaWithdrawals: [],
    })
    expect(errors['goal_g1_amount']).toBeTruthy()
  })

  it('catches goal with targetAge <= currentAge', () => {
    const errors = validateProfileConsistency({
      currentAge: 30,
      retirementAge: 55,
      lifeExpectancy: 90,
      lifeStage: 'pre-fire',
      cpfLifeStartAge: 65,
      parentSupportEnabled: false,
      parentSupport: [],
      healthcareConfig: defaultHealthcareConfig,
      retirementWithdrawals: [],
      financialGoals: [
        { id: 'g1', label: 'Past', amount: 50000, targetAge: 30, durationYears: 1, priority: 'important', inflationAdjusted: true, category: 'wedding' },
      ],
      cpfOaWithdrawals: [],
    })
    expect(errors['goal_g1_age']).toBeTruthy()
  })

  it('catches goal extending past lifeExpectancy', () => {
    const errors = validateProfileConsistency({
      currentAge: 30,
      retirementAge: 55,
      lifeExpectancy: 90,
      lifeStage: 'pre-fire',
      cpfLifeStartAge: 65,
      parentSupportEnabled: false,
      parentSupport: [],
      healthcareConfig: defaultHealthcareConfig,
      retirementWithdrawals: [],
      financialGoals: [
        { id: 'g1', label: 'Long', amount: 100000, targetAge: 85, durationYears: 10, priority: 'essential', inflationAdjusted: false, category: 'education' },
      ],
      cpfOaWithdrawals: [],
    })
    expect(errors['goal_g1_duration']).toBeTruthy()
  })

  it('accepts valid goals', () => {
    const errors = validateProfileConsistency({
      currentAge: 30,
      retirementAge: 55,
      lifeExpectancy: 90,
      lifeStage: 'pre-fire',
      cpfLifeStartAge: 65,
      parentSupportEnabled: false,
      parentSupport: [],
      healthcareConfig: defaultHealthcareConfig,
      retirementWithdrawals: [],
      financialGoals: [
        { id: 'g1', label: 'Wedding', amount: 50000, targetAge: 35, durationYears: 1, priority: 'important', inflationAdjusted: true, category: 'wedding' },
        { id: 'g2', label: 'Education', amount: 200000, targetAge: 50, durationYears: 4, priority: 'essential', inflationAdjusted: true, category: 'education' },
      ],
      cpfOaWithdrawals: [],
    })
    expect(errors['goal_g1_amount']).toBeUndefined()
    expect(errors['goal_g1_age']).toBeUndefined()
    expect(errors['goal_g1_duration']).toBeUndefined()
    expect(errors['goal_g2_amount']).toBeUndefined()
    expect(errors['goal_g2_age']).toBeUndefined()
    expect(errors['goal_g2_duration']).toBeUndefined()
  })

  it('catches goal with targetAge > lifeExpectancy', () => {
    const errors = validateProfileConsistency({
      currentAge: 30,
      retirementAge: 55,
      lifeExpectancy: 90,
      lifeStage: 'pre-fire',
      cpfLifeStartAge: 65,
      parentSupportEnabled: false,
      parentSupport: [],
      healthcareConfig: defaultHealthcareConfig,
      retirementWithdrawals: [],
      financialGoals: [
        { id: 'g1', label: 'Too Late', amount: 50000, targetAge: 95, durationYears: 1, priority: 'nice-to-have', inflationAdjusted: false, category: 'travel' },
      ],
      cpfOaWithdrawals: [],
    })
    expect(errors['goal_g1_age']).toBeTruthy()
  })

  it('catches goal with durationYears < 1', () => {
    const errors = validateProfileConsistency({
      currentAge: 30,
      retirementAge: 55,
      lifeExpectancy: 90,
      lifeStage: 'pre-fire',
      cpfLifeStartAge: 65,
      parentSupportEnabled: false,
      parentSupport: [],
      healthcareConfig: defaultHealthcareConfig,
      retirementWithdrawals: [],
      financialGoals: [
        { id: 'g1', label: 'Zero Dur', amount: 50000, targetAge: 40, durationYears: 0, priority: 'important', inflationAdjusted: true, category: 'other' },
      ],
      cpfOaWithdrawals: [],
    })
    expect(errors['goal_g1_duration']).toBeTruthy()
  })
})

describe('CPF OA withdrawal validation', () => {
  it('catches withdrawal age < 55', () => {
    const errors = validateProfileConsistency({
      currentAge: 30,
      retirementAge: 55,
      lifeExpectancy: 90,
      lifeStage: 'pre-fire',
      cpfLifeStartAge: 65,
      parentSupportEnabled: false,
      parentSupport: [],
      healthcareConfig: defaultHealthcareConfig,
      retirementWithdrawals: [],
      financialGoals: [],
      cpfOaWithdrawals: [
        { id: 'ow1', label: 'Too early', amount: 50000, age: 50 },
      ],
    })
    expect(errors['cpfOaWithdrawal_ow1_age']).toBe('CPF OA withdrawal age must be >= 55')
  })

  it('catches withdrawal age > life expectancy', () => {
    const errors = validateProfileConsistency({
      currentAge: 30,
      retirementAge: 55,
      lifeExpectancy: 90,
      lifeStage: 'pre-fire',
      cpfLifeStartAge: 65,
      parentSupportEnabled: false,
      parentSupport: [],
      healthcareConfig: defaultHealthcareConfig,
      retirementWithdrawals: [],
      financialGoals: [],
      cpfOaWithdrawals: [
        { id: 'ow1', label: 'Too late', amount: 50000, age: 95 },
      ],
    })
    expect(errors['cpfOaWithdrawal_ow1_age']).toContain('exceeds life expectancy')
  })

  it('catches withdrawal amount <= 0', () => {
    const errors = validateProfileConsistency({
      currentAge: 30,
      retirementAge: 55,
      lifeExpectancy: 90,
      lifeStage: 'pre-fire',
      cpfLifeStartAge: 65,
      parentSupportEnabled: false,
      parentSupport: [],
      healthcareConfig: defaultHealthcareConfig,
      retirementWithdrawals: [],
      financialGoals: [],
      cpfOaWithdrawals: [
        { id: 'ow1', label: 'Zero', amount: 0, age: 55 },
      ],
    })
    expect(errors['cpfOaWithdrawal_ow1_amount']).toBe('Amount must be positive')
  })

  it('accepts valid CPF OA withdrawal', () => {
    const errors = validateProfileConsistency({
      currentAge: 30,
      retirementAge: 55,
      lifeExpectancy: 90,
      lifeStage: 'pre-fire',
      cpfLifeStartAge: 65,
      parentSupportEnabled: false,
      parentSupport: [],
      healthcareConfig: defaultHealthcareConfig,
      retirementWithdrawals: [],
      financialGoals: [],
      cpfOaWithdrawals: [
        { id: 'ow1', label: 'OA at 55', amount: 50000, age: 55 },
        { id: 'ow2', label: 'OA at 60', amount: 30000, age: 60 },
      ],
    })
    expect(errors['cpfOaWithdrawal_ow1_age']).toBeUndefined()
    expect(errors['cpfOaWithdrawal_ow1_amount']).toBeUndefined()
    expect(errors['cpfOaWithdrawal_ow2_age']).toBeUndefined()
    expect(errors['cpfOaWithdrawal_ow2_amount']).toBeUndefined()
  })
})
