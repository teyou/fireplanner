import { describe, it, expect, beforeEach } from 'vitest'
import { useWithdrawalStore } from './useWithdrawalStore'

beforeEach(() => {
  useWithdrawalStore.getState().reset()
})

describe('useWithdrawalStore', () => {
  describe('initial state', () => {
    it('has all 6 strategies selected by default', () => {
      const state = useWithdrawalStore.getState()
      expect(state.selectedStrategies).toHaveLength(6)
      expect(state.selectedStrategies).toContain('constant_dollar')
      expect(state.selectedStrategies).toContain('vpw')
      expect(state.selectedStrategies).toContain('guardrails')
      expect(state.selectedStrategies).toContain('vanguard_dynamic')
      expect(state.selectedStrategies).toContain('cape_based')
      expect(state.selectedStrategies).toContain('floor_ceiling')
    })

    it('has default strategy params', () => {
      const state = useWithdrawalStore.getState()
      expect(state.strategyParams.constant_dollar.swr).toBe(0.04)
      expect(state.strategyParams.guardrails.ceilingTrigger).toBe(1.20)
      expect(state.strategyParams.floor_ceiling.floor).toBe(60000)
      expect(state.strategyParams.floor_ceiling.ceiling).toBe(150000)
    })

    it('has no validation errors', () => {
      expect(Object.keys(useWithdrawalStore.getState().validationErrors)).toHaveLength(0)
    })
  })

  describe('toggleStrategy', () => {
    it('removes a strategy when present', () => {
      useWithdrawalStore.getState().toggleStrategy('vpw')
      expect(useWithdrawalStore.getState().selectedStrategies).not.toContain('vpw')
      expect(useWithdrawalStore.getState().selectedStrategies).toHaveLength(5)
    })

    it('adds a strategy when not present', () => {
      useWithdrawalStore.getState().toggleStrategy('vpw') // remove
      useWithdrawalStore.getState().toggleStrategy('vpw') // add back
      expect(useWithdrawalStore.getState().selectedStrategies).toContain('vpw')
    })

    it('produces error when all strategies deselected', () => {
      const strategies = [...useWithdrawalStore.getState().selectedStrategies]
      for (const s of strategies) {
        useWithdrawalStore.getState().toggleStrategy(s)
      }
      expect(useWithdrawalStore.getState().validationErrors.selectedStrategies).toBeTruthy()
    })
  })

  describe('setStrategyParam', () => {
    it('updates guardrails ceiling trigger', () => {
      useWithdrawalStore.getState().setStrategyParam('guardrails', 'ceilingTrigger', 1.30)
      expect(useWithdrawalStore.getState().strategyParams.guardrails.ceilingTrigger).toBe(1.30)
    })

    it('does not affect other strategy params', () => {
      useWithdrawalStore.getState().setStrategyParam('guardrails', 'ceilingTrigger', 1.30)
      expect(useWithdrawalStore.getState().strategyParams.constant_dollar.swr).toBe(0.04)
    })

    it('validates floor >= ceiling produces error', () => {
      useWithdrawalStore.getState().setStrategyParam('floor_ceiling', 'floor', 200000)
      const errors = useWithdrawalStore.getState().validationErrors
      expect(errors['floor_ceiling.floor']).toBeTruthy()
    })
  })

  describe('reset', () => {
    it('restores all 6 strategies and default params', () => {
      useWithdrawalStore.getState().toggleStrategy('vpw')
      useWithdrawalStore.getState().setStrategyParam('constant_dollar', 'swr', 0.035)
      useWithdrawalStore.getState().reset()
      const state = useWithdrawalStore.getState()
      expect(state.selectedStrategies).toHaveLength(6)
      expect(state.strategyParams.constant_dollar.swr).toBe(0.04)
    })
  })
})
