import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from './useUIStore'

beforeEach(() => {
  // Reset to defaults
  useUIStore.setState({
    sectionOrder: 'goal-first',
    statsPosition: 'bottom',
    cpfEnabled: true,
    propertyEnabled: false,
    healthcareEnabled: false,
    allocationAdvanced: false,
  })
})

describe('useUIStore', () => {
  describe('initial state', () => {
    it('has correct defaults', () => {
      const state = useUIStore.getState()
      expect(state.sectionOrder).toBe('goal-first')
      expect(state.statsPosition).toBe('bottom')
      expect(state.cpfEnabled).toBe(true)
      expect(state.propertyEnabled).toBe(false)
      expect(state.healthcareEnabled).toBe(false)
      expect(state.allocationAdvanced).toBe(false)
    })
  })

  describe('setField', () => {
    it('toggles cpfEnabled', () => {
      useUIStore.getState().setField('cpfEnabled', false)
      expect(useUIStore.getState().cpfEnabled).toBe(false)
    })

    it('toggles propertyEnabled', () => {
      useUIStore.getState().setField('propertyEnabled', true)
      expect(useUIStore.getState().propertyEnabled).toBe(true)
    })

    it('toggles healthcareEnabled', () => {
      useUIStore.getState().setField('healthcareEnabled', true)
      expect(useUIStore.getState().healthcareEnabled).toBe(true)
    })

    it('sets section order', () => {
      useUIStore.getState().setField('sectionOrder', 'story-first')
      expect(useUIStore.getState().sectionOrder).toBe('story-first')
    })

    it('sets stats position', () => {
      useUIStore.getState().setField('statsPosition', 'sidebar')
      expect(useUIStore.getState().statsPosition).toBe('sidebar')
    })

    it('toggles allocationAdvanced', () => {
      useUIStore.getState().setField('allocationAdvanced', true)
      expect(useUIStore.getState().allocationAdvanced).toBe(true)
    })
  })
})
