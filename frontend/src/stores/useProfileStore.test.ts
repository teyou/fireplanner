import { describe, it, expect, beforeEach } from 'vitest'
import { useProfileStore } from './useProfileStore'

// Reset store to defaults before each test
beforeEach(() => {
  useProfileStore.getState().reset()
})

describe('useProfileStore', () => {
  describe('initial state', () => {
    it('has correct default values', () => {
      const state = useProfileStore.getState()
      expect(state.currentAge).toBe(30)
      expect(state.retirementAge).toBe(65)
      expect(state.lifeExpectancy).toBe(90)
      expect(state.lifeStage).toBe('pre-fire')
      expect(state.maritalStatus).toBe('single')
      expect(state.residencyStatus).toBe('citizen')
      expect(state.annualIncome).toBe(72000)
      expect(state.annualExpenses).toBe(48000)
      expect(state.liquidNetWorth).toBe(0)
      expect(state.swr).toBe(0.04)
      expect(state.fireType).toBe('regular')
      expect(state.inflation).toBe(0.025)
      expect(state.cpfOA).toBe(0)
      expect(state.cpfSA).toBe(0)
      expect(state.cpfMA).toBe(0)
    })

    it('has no validation errors with defaults', () => {
      const state = useProfileStore.getState()
      expect(Object.keys(state.validationErrors)).toHaveLength(0)
    })
  })

  describe('setField', () => {
    it('updates a single field', () => {
      useProfileStore.getState().setField('currentAge', 35)
      expect(useProfileStore.getState().currentAge).toBe(35)
    })

    it('does not affect other fields', () => {
      useProfileStore.getState().setField('currentAge', 35)
      expect(useProfileStore.getState().retirementAge).toBe(65)
      expect(useProfileStore.getState().annualIncome).toBe(72000)
    })

    it('triggers validation on field change', () => {
      useProfileStore.getState().setField('currentAge', 15)
      const errors = useProfileStore.getState().validationErrors
      expect(errors.currentAge).toBeTruthy()
    })

    it('clears validation error when field becomes valid', () => {
      useProfileStore.getState().setField('currentAge', 15)
      expect(useProfileStore.getState().validationErrors.currentAge).toBeTruthy()
      useProfileStore.getState().setField('currentAge', 30)
      expect(useProfileStore.getState().validationErrors.currentAge).toBeUndefined()
    })

    it('produces cross-field error when retirementAge <= currentAge', () => {
      useProfileStore.getState().setField('retirementAge', 30)
      const errors = useProfileStore.getState().validationErrors
      expect(errors.retirementAge).toBe('Retirement age must be greater than current age')
    })

    it('produces cross-field error when lifeExpectancy <= retirementAge', () => {
      useProfileStore.getState().setField('lifeExpectancy', 65)
      const errors = useProfileStore.getState().validationErrors
      expect(errors.lifeExpectancy).toBe('Life expectancy must be greater than retirement age')
    })

    it('syncs oopReferenceAge when currentAge changes and they match', () => {
      // Default: currentAge=30, oopReferenceAge=30 (they match)
      useProfileStore.getState().setField('currentAge', 40)
      expect(useProfileStore.getState().healthcareConfig.oopReferenceAge).toBe(40)
    })

    it('does not sync oopReferenceAge when they do not match', () => {
      // First, customize oopReferenceAge away from currentAge
      useProfileStore.getState().setField('healthcareConfig', {
        ...useProfileStore.getState().healthcareConfig,
        oopReferenceAge: 50,
      })
      useProfileStore.getState().setField('currentAge', 40)
      expect(useProfileStore.getState().healthcareConfig.oopReferenceAge).toBe(50)
    })
  })

  describe('parent support', () => {
    it('adds parent support entry', () => {
      useProfileStore.getState().addParentSupport({
        id: 'ps1',
        label: 'Mom',
        monthlyAmount: 500,
        startAge: 30,
        endAge: 65,
      })
      const state = useProfileStore.getState()
      expect(state.parentSupport).toHaveLength(1)
      expect(state.parentSupport[0].label).toBe('Mom')
    })

    it('removes parent support entry by ID', () => {
      useProfileStore.getState().addParentSupport({
        id: 'ps1', label: 'Mom', monthlyAmount: 500, startAge: 30, endAge: 65,
      })
      useProfileStore.getState().addParentSupport({
        id: 'ps2', label: 'Dad', monthlyAmount: 300, startAge: 30, endAge: 65,
      })
      useProfileStore.getState().removeParentSupport('ps1')
      const state = useProfileStore.getState()
      expect(state.parentSupport).toHaveLength(1)
      expect(state.parentSupport[0].id).toBe('ps2')
    })

    it('updates parent support entry fields', () => {
      useProfileStore.getState().addParentSupport({
        id: 'ps1', label: 'Mom', monthlyAmount: 500, startAge: 30, endAge: 65,
      })
      useProfileStore.getState().updateParentSupport('ps1', { monthlyAmount: 800 })
      expect(useProfileStore.getState().parentSupport[0].monthlyAmount).toBe(800)
    })

    it('validates parent support start < end age', () => {
      useProfileStore.getState().setField('parentSupportEnabled', true)
      useProfileStore.getState().addParentSupport({
        id: 'ps1', label: 'Mom', monthlyAmount: 500, startAge: 65, endAge: 30,
      })
      const errors = useProfileStore.getState().validationErrors
      expect(errors['parentSupport_ps1_startAge']).toBeTruthy()
    })
  })

  describe('healthcare config', () => {
    it('updates nested healthcare fields', () => {
      useProfileStore.getState().setField('healthcareConfig', {
        ...useProfileStore.getState().healthcareConfig,
        ispTier: 'a',
        enabled: true,
      })
      const state = useProfileStore.getState()
      expect(state.healthcareConfig.ispTier).toBe('a')
      expect(state.healthcareConfig.enabled).toBe(true)
    })
  })

  describe('reset', () => {
    it('restores all defaults', () => {
      useProfileStore.getState().setField('currentAge', 50)
      useProfileStore.getState().setField('annualIncome', 200000)
      useProfileStore.getState().setField('swr', 0.035)
      useProfileStore.getState().reset()
      const state = useProfileStore.getState()
      expect(state.currentAge).toBe(30)
      expect(state.annualIncome).toBe(72000)
      expect(state.swr).toBe(0.04)
      expect(Object.keys(state.validationErrors)).toHaveLength(0)
    })
  })
})
