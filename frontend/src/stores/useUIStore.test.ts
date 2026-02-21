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
    mode: 'simple',
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
      expect(state.mode).toBe('simple')
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
      useUIStore.getState().setField('statsPosition', 'top')
      expect(useUIStore.getState().statsPosition).toBe('top')
    })

    it('toggles mode', () => {
      useUIStore.getState().setField('mode', 'advanced')
      expect(useUIStore.getState().mode).toBe('advanced')
    })
  })

  describe('persist migration', () => {
    it('v1→v3: adds boolean toggle defaults and migrates to mode', () => {
      const { migrate } = useUIStore.persist.getOptions()
      const oldState: Record<string, unknown> = { sectionOrder: 'story-first', statsPosition: 'top' }
      const migrated = migrate!(oldState, 1) as Record<string, unknown>
      expect(migrated.cpfEnabled).toBe(true)
      expect(migrated.propertyEnabled).toBe(false)
      expect(migrated.healthcareEnabled).toBe(false)
      expect(migrated.mode).toBe('simple')
      // Preserves existing fields
      expect(migrated.sectionOrder).toBe('story-first')
      expect(migrated.statsPosition).toBe('top')
    })

    it('v2→v3: migrates allocationAdvanced to mode', () => {
      const { migrate } = useUIStore.persist.getOptions()
      const state: Record<string, unknown> = {
        sectionOrder: 'already-fire',
        cpfEnabled: false,
        propertyEnabled: true,
        allocationAdvanced: true,
        statsPosition: 'sidebar',
      }
      const migrated = migrate!(state, 2) as Record<string, unknown>
      expect(migrated.mode).toBe('advanced')
      expect(migrated.allocationAdvanced).toBeUndefined()
      expect(migrated.statsPosition).toBe('bottom') // sidebar migrated to bottom
    })

    it('v3 state passes through unchanged', () => {
      const { migrate } = useUIStore.persist.getOptions()
      const state: Record<string, unknown> = {
        sectionOrder: 'already-fire',
        cpfEnabled: false,
        propertyEnabled: true,
        mode: 'advanced',
      }
      const migrated = migrate!(state, 3) as Record<string, unknown>
      expect(migrated.sectionOrder).toBe('already-fire')
      expect(migrated.cpfEnabled).toBe(false)
      expect(migrated.propertyEnabled).toBe(true)
      expect(migrated.mode).toBe('advanced')
    })
  })
})
