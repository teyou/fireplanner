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
    sectionOverrides: {},
    dismissedNudges: [],
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
      expect(state.sectionOverrides).toEqual({})
      expect(state.dismissedNudges).toEqual([])
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
    it('v1→v4: adds boolean toggle defaults, migrates to mode, adds overrides', () => {
      const { migrate } = useUIStore.persist.getOptions()
      const oldState: Record<string, unknown> = { sectionOrder: 'story-first', statsPosition: 'top' }
      const migrated = migrate!(oldState, 1) as Record<string, unknown>
      expect(migrated.cpfEnabled).toBe(true)
      expect(migrated.propertyEnabled).toBe(false)
      expect(migrated.healthcareEnabled).toBe(false)
      expect(migrated.mode).toBe('simple')
      expect(migrated.sectionOverrides).toEqual({})
      expect(migrated.dismissedNudges).toEqual([])
      // Preserves existing fields
      expect(migrated.sectionOrder).toBe('story-first')
      expect(migrated.statsPosition).toBe('top')
    })

    it('v2→v4: migrates allocationAdvanced to mode, adds overrides', () => {
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
      expect(migrated.sectionOverrides).toEqual({})
      expect(migrated.dismissedNudges).toEqual([])
    })

    it('v3→v4: adds sectionOverrides and dismissedNudges', () => {
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
      expect(migrated.sectionOverrides).toEqual({})
      expect(migrated.dismissedNudges).toEqual([])
    })

    it('v4 state passes through unchanged', () => {
      const { migrate } = useUIStore.persist.getOptions()
      const state: Record<string, unknown> = {
        sectionOrder: 'already-fire',
        cpfEnabled: false,
        propertyEnabled: true,
        mode: 'advanced',
        sectionOverrides: { 'section-income': 'simple' },
        dismissedNudges: ['some-nudge'],
      }
      const migrated = migrate!(state, 4) as Record<string, unknown>
      expect(migrated.sectionOverrides).toEqual({ 'section-income': 'simple' })
      expect(migrated.dismissedNudges).toEqual(['some-nudge'])
    })
  })

  describe('section overrides (v4)', () => {
    it('defaults sectionOverrides to empty object', () => {
      expect(useUIStore.getState().sectionOverrides).toEqual({})
    })

    it('defaults dismissedNudges to empty array', () => {
      expect(useUIStore.getState().dismissedNudges).toEqual([])
    })

    it('setSectionMode sets an override for a section', () => {
      useUIStore.getState().setSectionMode('section-income', 'advanced')
      expect(useUIStore.getState().sectionOverrides).toEqual({ 'section-income': 'advanced' })
    })

    it('setSectionMode toggles back to simple', () => {
      useUIStore.getState().setSectionMode('section-income', 'advanced')
      useUIStore.getState().setSectionMode('section-income', 'simple')
      expect(useUIStore.getState().sectionOverrides).toEqual({ 'section-income': 'simple' })
    })

    it('clearSectionOverrides resets all overrides', () => {
      useUIStore.getState().setSectionMode('section-income', 'advanced')
      useUIStore.getState().setSectionMode('section-cpf', 'advanced')
      useUIStore.getState().clearSectionOverrides()
      expect(useUIStore.getState().sectionOverrides).toEqual({})
    })

    it('dismissNudge adds nudge ID to dismissed list', () => {
      useUIStore.getState().dismissNudge('income-srs-tax')
      expect(useUIStore.getState().dismissedNudges).toContain('income-srs-tax')
    })

    it('dismissNudge does not duplicate IDs', () => {
      useUIStore.getState().dismissNudge('income-srs-tax')
      useUIStore.getState().dismissNudge('income-srs-tax')
      expect(useUIStore.getState().dismissedNudges.filter((id: string) => id === 'income-srs-tax')).toHaveLength(1)
    })

    it('setField mode clears section overrides', () => {
      useUIStore.getState().setSectionMode('section-income', 'advanced')
      useUIStore.getState().setField('mode', 'advanced')
      expect(useUIStore.getState().sectionOverrides).toEqual({})
      expect(useUIStore.getState().mode).toBe('advanced')
    })

    it('setField for non-mode fields does not clear overrides', () => {
      useUIStore.getState().setSectionMode('section-income', 'advanced')
      useUIStore.getState().setField('cpfEnabled', false)
      expect(useUIStore.getState().sectionOverrides).toEqual({ 'section-income': 'advanced' })
    })
  })
})
