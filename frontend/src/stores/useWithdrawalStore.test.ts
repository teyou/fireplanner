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

  describe('new strategy defaults', () => {
    it('has default params for all 6 new strategies', () => {
      const state = useWithdrawalStore.getState()
      expect(state.strategyParams.percent_of_portfolio.rate).toBe(0.04)
      expect(state.strategyParams.one_over_n).toEqual({})
      expect(state.strategyParams.sensible_withdrawals.baseRate).toBe(0.03)
      expect(state.strategyParams.sensible_withdrawals.extrasRate).toBe(0.10)
      expect(state.strategyParams.ninety_five_percent.swr).toBe(0.04)
      expect(state.strategyParams.endowment.swr).toBe(0.04)
      expect(state.strategyParams.endowment.smoothingWeight).toBe(0.70)
      expect(state.strategyParams.hebeler_autopilot.expectedRealReturn).toBe(0.03)
    })
  })

  describe('persist migration', () => {
    it('v1→v2: adds 6 new strategy param keys', () => {
      const { migrate } = useWithdrawalStore.persist.getOptions()
      const oldState: Record<string, unknown> = {
        strategyParams: {
          constant_dollar: { swr: 0.04 },
          vpw: { expectedRealReturn: 0.03, targetEndValue: 0 },
          guardrails: { initialRate: 0.05, ceilingTrigger: 1.2, floorTrigger: 0.8, adjustmentSize: 0.1 },
          vanguard_dynamic: { swr: 0.04, ceiling: 0.05, floor: 0.025 },
          cape_based: { baseRate: 0.04, capeWeight: 0.5, currentCape: 30 },
          floor_ceiling: { floor: 60000, ceiling: 150000, targetRate: 0.045 },
        },
      }
      const migrated = migrate!(oldState, 1) as unknown as Record<string, unknown>
      const params = migrated.strategyParams as Record<string, Record<string, number>>
      // New strategy defaults are added
      expect(params.percent_of_portfolio).toEqual({ rate: 0.04 })
      expect(params.one_over_n).toEqual({})
      expect(params.sensible_withdrawals).toEqual({ baseRate: 0.03, extrasRate: 0.10 })
      expect(params.ninety_five_percent).toEqual({ swr: 0.04 })
      expect(params.endowment).toEqual({ swr: 0.04, smoothingWeight: 0.70 })
      expect(params.hebeler_autopilot).toEqual({ expectedRealReturn: 0.03 })
      // Existing params are preserved
      expect(params.constant_dollar).toEqual({ swr: 0.04 })
      expect(params.guardrails.ceilingTrigger).toBe(1.2)
    })

    it('v1→v2: preserves existing new strategy params if already present', () => {
      const { migrate } = useWithdrawalStore.persist.getOptions()
      const oldState: Record<string, unknown> = {
        strategyParams: {
          constant_dollar: { swr: 0.04 },
          percent_of_portfolio: { rate: 0.05 }, // user-customized
        },
      }
      const migrated = migrate!(oldState, 1) as unknown as Record<string, unknown>
      const params = migrated.strategyParams as Record<string, Record<string, number>>
      // User-customized value is preserved
      expect(params.percent_of_portfolio).toEqual({ rate: 0.05 })
      // Other new defaults still added
      expect(params.endowment).toEqual({ swr: 0.04, smoothingWeight: 0.70 })
    })

    it('v1→v2: handles missing strategyParams gracefully', () => {
      const { migrate } = useWithdrawalStore.persist.getOptions()
      const oldState: Record<string, unknown> = {}
      const migrated = migrate!(oldState, 1) as unknown as Record<string, unknown>
      const params = migrated.strategyParams as Record<string, Record<string, number>>
      expect(params.percent_of_portfolio).toEqual({ rate: 0.04 })
    })
  })
})
