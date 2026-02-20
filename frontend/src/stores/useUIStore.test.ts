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

  describe('persist migration', () => {
    it('v1→v2: adds boolean toggle defaults', () => {
      const { migrate } = useUIStore.persist.getOptions()
      const oldState: Record<string, unknown> = { sectionOrder: 'story-first', statsPosition: 'top' }
      const migrated = migrate!(oldState, 1) as Record<string, unknown>
      expect(migrated.cpfEnabled).toBe(true)
      expect(migrated.propertyEnabled).toBe(false)
      expect(migrated.healthcareEnabled).toBe(false)
      expect(migrated.allocationAdvanced).toBe(false)
      // Preserves existing fields
      expect(migrated.sectionOrder).toBe('story-first')
      expect(migrated.statsPosition).toBe('top')
    })

    it('v2 state passes through unchanged', () => {
      const { migrate } = useUIStore.persist.getOptions()
      const state: Record<string, unknown> = {
        sectionOrder: 'already-fire',
        cpfEnabled: false,
        propertyEnabled: true,
      }
      const migrated = migrate!(state, 2) as Record<string, unknown>
      expect(migrated.sectionOrder).toBe('already-fire')
      expect(migrated.cpfEnabled).toBe(false)
      expect(migrated.propertyEnabled).toBe(true)
    })
  })
})
