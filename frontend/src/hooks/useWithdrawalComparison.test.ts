import { describe, it, expect } from 'vitest'
import { getStrategyLabel } from './useWithdrawalComparison'

describe('getStrategyLabel', () => {
  it('returns correct label for constant_dollar', () => {
    expect(getStrategyLabel('constant_dollar')).toBe('Constant Dollar (4% Rule)')
  })

  it('returns correct label for vpw', () => {
    expect(getStrategyLabel('vpw')).toBe('Variable Percentage (VPW)')
  })

  it('returns correct label for guardrails', () => {
    expect(getStrategyLabel('guardrails')).toBe('Guardrails (Guyton-Klinger)')
  })

  it('returns correct label for vanguard_dynamic', () => {
    expect(getStrategyLabel('vanguard_dynamic')).toBe('Vanguard Dynamic')
  })

  it('returns correct label for cape_based', () => {
    expect(getStrategyLabel('cape_based')).toBe('CAPE-Based')
  })

  it('returns correct label for floor_ceiling', () => {
    expect(getStrategyLabel('floor_ceiling')).toBe('Floor & Ceiling')
  })
})
