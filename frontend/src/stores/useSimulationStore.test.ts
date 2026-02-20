import { describe, it, expect, beforeEach } from 'vitest'
import { useSimulationStore } from './useSimulationStore'

beforeEach(() => {
  useSimulationStore.getState().reset()
})

describe('useSimulationStore', () => {
  describe('initial state', () => {
    it('has correct defaults', () => {
      const state = useSimulationStore.getState()
      expect(state.mcMethod).toBe('parametric')
      expect(state.selectedStrategy).toBe('constant_dollar')
      expect(state.nSimulations).toBe(10000)
      expect(state.analysisMode).toBe('myPlan')
    })

    it('has no validation errors', () => {
      expect(Object.keys(useSimulationStore.getState().validationErrors)).toHaveLength(0)
    })
  })

  describe('setField', () => {
    it('changes MC method', () => {
      useSimulationStore.getState().setField('mcMethod', 'bootstrap')
      expect(useSimulationStore.getState().mcMethod).toBe('bootstrap')
    })

    it('changes nSimulations', () => {
      useSimulationStore.getState().setField('nSimulations', 5000)
      expect(useSimulationStore.getState().nSimulations).toBe(5000)
    })

    it('validates nSimulations out of range (too low)', () => {
      useSimulationStore.getState().setField('nSimulations', 50)
      expect(useSimulationStore.getState().validationErrors.nSimulations).toBeTruthy()
    })

    it('validates nSimulations out of range (too high)', () => {
      useSimulationStore.getState().setField('nSimulations', 200000)
      expect(useSimulationStore.getState().validationErrors.nSimulations).toBeTruthy()
    })

    it('sets analysis mode', () => {
      useSimulationStore.getState().setField('analysisMode', 'fireTarget')
      expect(useSimulationStore.getState().analysisMode).toBe('fireTarget')
    })
  })

  describe('setStrategyParam', () => {
    it('updates nested strategy param', () => {
      useSimulationStore.getState().setStrategyParam('constant_dollar', 'swr', 0.035)
      expect(useSimulationStore.getState().strategyParams.constant_dollar.swr).toBe(0.035)
    })

    it('does not affect other strategies', () => {
      useSimulationStore.getState().setStrategyParam('constant_dollar', 'swr', 0.035)
      expect(useSimulationStore.getState().strategyParams.guardrails.initialRate).toBe(0.05)
    })
  })

  describe('reset', () => {
    it('restores all defaults', () => {
      useSimulationStore.getState().setField('mcMethod', 'fat_tail')
      useSimulationStore.getState().setField('nSimulations', 1000)
      useSimulationStore.getState().reset()
      const state = useSimulationStore.getState()
      expect(state.mcMethod).toBe('parametric')
      expect(state.nSimulations).toBe(10000)
    })
  })
})
