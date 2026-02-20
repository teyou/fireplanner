import { describe, it, expect, beforeEach } from 'vitest'
import { usePropertyStore } from './usePropertyStore'

beforeEach(() => {
  usePropertyStore.getState().reset()
})

describe('usePropertyStore', () => {
  describe('initial state', () => {
    it('has no property by default', () => {
      const state = usePropertyStore.getState()
      expect(state.ownsProperty).toBe(false)
      expect(state.propertyType).toBe('condo')
      expect(state.purchasePrice).toBe(1500000)
      expect(state.ltv).toBe(0.75)
    })

    it('has default downsizing config', () => {
      const ds = usePropertyStore.getState().downsizing
      expect(ds.scenario).toBe('none')
      expect(ds.sellAge).toBe(65)
    })

    it('has no validation errors', () => {
      expect(Object.keys(usePropertyStore.getState().validationErrors)).toHaveLength(0)
    })
  })

  describe('setField', () => {
    it('sets ownsProperty', () => {
      usePropertyStore.getState().setField('ownsProperty', true)
      expect(usePropertyStore.getState().ownsProperty).toBe(true)
    })

    it('validates purchasePrice <= 0', () => {
      usePropertyStore.getState().setField('purchasePrice', -100)
      expect(usePropertyStore.getState().validationErrors.purchasePrice).toBeTruthy()
    })

    it('validates leaseYears out of range', () => {
      usePropertyStore.getState().setField('leaseYears', 0)
      expect(usePropertyStore.getState().validationErrors.leaseYears).toBeTruthy()
    })

    it('validates mortgageRate out of range', () => {
      usePropertyStore.getState().setField('mortgageRate', 0.20)
      expect(usePropertyStore.getState().validationErrors.mortgageRate).toBeTruthy()
    })

    it('validates ltv out of range', () => {
      usePropertyStore.getState().setField('ltv', 1.5)
      expect(usePropertyStore.getState().validationErrors.ltv).toBeTruthy()
    })

    it('validates existing property fields when ownsProperty', () => {
      usePropertyStore.getState().setField('ownsProperty', true)
      usePropertyStore.getState().setField('existingPropertyValue', -1)
      expect(usePropertyStore.getState().validationErrors.existingPropertyValue).toBeTruthy()
    })

    it('skips existing property validation when not owning', () => {
      usePropertyStore.getState().setField('ownsProperty', false)
      usePropertyStore.getState().setField('existingPropertyValue', -1)
      expect(usePropertyStore.getState().validationErrors.existingPropertyValue).toBeUndefined()
    })
  })

  describe('setDownsizingField', () => {
    it('updates downsizing scenario', () => {
      usePropertyStore.getState().setDownsizingField('scenario', 'sell-and-downsize')
      expect(usePropertyStore.getState().downsizing.scenario).toBe('sell-and-downsize')
    })

    it('updates nested downsizing fields', () => {
      usePropertyStore.getState().setDownsizingField('sellAge', 60)
      expect(usePropertyStore.getState().downsizing.sellAge).toBe(60)
    })

    it('validates downsizing when ownsProperty and scenario not none', () => {
      usePropertyStore.getState().setField('ownsProperty', true)
      usePropertyStore.getState().setDownsizingField('scenario', 'sell-and-downsize')
      usePropertyStore.getState().setDownsizingField('expectedSalePrice', -100)
      expect(usePropertyStore.getState().validationErrors['downsizing_expectedSalePrice']).toBeTruthy()
    })

    it('skips downsizing validation when scenario is none', () => {
      usePropertyStore.getState().setField('ownsProperty', true)
      usePropertyStore.getState().setDownsizingField('scenario', 'none')
      usePropertyStore.getState().setDownsizingField('expectedSalePrice', -100)
      expect(usePropertyStore.getState().validationErrors['downsizing_expectedSalePrice']).toBeUndefined()
    })

    it('validates sell-and-rent specific fields', () => {
      usePropertyStore.getState().setField('ownsProperty', true)
      usePropertyStore.getState().setDownsizingField('scenario', 'sell-and-rent')
      usePropertyStore.getState().setDownsizingField('monthlyRent', -500)
      expect(usePropertyStore.getState().validationErrors['downsizing_monthlyRent']).toBeTruthy()
    })
  })

  describe('reset', () => {
    it('restores all defaults', () => {
      usePropertyStore.getState().setField('ownsProperty', true)
      usePropertyStore.getState().setField('existingPropertyValue', 2000000)
      usePropertyStore.getState().reset()
      const state = usePropertyStore.getState()
      expect(state.ownsProperty).toBe(false)
      expect(state.existingPropertyValue).toBe(0)
    })
  })
})
