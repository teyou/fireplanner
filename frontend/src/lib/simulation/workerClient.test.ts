import { describe, it, expect } from 'vitest'
import { flattenStrategyParams } from './workerClient'
import type { StrategyParamsMap } from '@/lib/types'

const DEFAULT_PARAMS: StrategyParamsMap = {
  constant_dollar: { swr: 0.04 },
  vpw: { expectedRealReturn: 0.03, targetEndValue: 0 },
  guardrails: { initialRate: 0.05, ceilingTrigger: 1.20, floorTrigger: 0.80, adjustmentSize: 0.10 },
  vanguard_dynamic: { swr: 0.04, ceiling: 0.05, floor: 0.025 },
  cape_based: { baseRate: 0.04, capeWeight: 0.50, currentCape: 30 },
  floor_ceiling: { floor: 60000, ceiling: 150000, targetRate: 0.045 },
}

describe('flattenStrategyParams', () => {
  it('floor_ceiling: renames floor/ceiling to floorAmount/ceilingAmount', () => {
    const result = flattenStrategyParams('floor_ceiling', DEFAULT_PARAMS)
    expect(result).toEqual({
      floorAmount: 60000,
      ceilingAmount: 150000,
      targetRate: 0.045,
    })
  })

  it('constant_dollar: passes through as-is', () => {
    const result = flattenStrategyParams('constant_dollar', DEFAULT_PARAMS)
    expect(result).toEqual({ swr: 0.04 })
  })

  it('vpw: passes through as-is', () => {
    const result = flattenStrategyParams('vpw', DEFAULT_PARAMS)
    expect(result).toEqual({ expectedRealReturn: 0.03, targetEndValue: 0 })
  })

  it('guardrails: passes through as-is', () => {
    const result = flattenStrategyParams('guardrails', DEFAULT_PARAMS)
    expect(result).toEqual({
      initialRate: 0.05,
      ceilingTrigger: 1.20,
      floorTrigger: 0.80,
      adjustmentSize: 0.10,
    })
  })

  it('vanguard_dynamic: passes through as-is', () => {
    const result = flattenStrategyParams('vanguard_dynamic', DEFAULT_PARAMS)
    expect(result).toEqual({ swr: 0.04, ceiling: 0.05, floor: 0.025 })
  })

  it('cape_based: passes through as-is', () => {
    const result = flattenStrategyParams('cape_based', DEFAULT_PARAMS)
    expect(result).toEqual({ baseRate: 0.04, capeWeight: 0.50, currentCape: 30 })
  })
})
