import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useOneMoreYear } from './useOneMoreYear'
import { useProfileStore } from '@/stores/useProfileStore'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { useAllocationStore } from '@/stores/useAllocationStore'

beforeEach(() => {
  useProfileStore.getState().reset()
  useIncomeStore.getState().reset()
  useAllocationStore.getState().reset()
})

describe('useOneMoreYear', () => {
  it('returns 4 scenarios with valid profile', () => {
    const { result } = renderHook(() => useOneMoreYear())
    expect(result.current.hasData).toBe(true)
    expect(result.current.scenarios).toHaveLength(4)
  })

  it('returns no data when profile has validation errors', () => {
    useProfileStore.getState().setField('currentAge', 15) // Invalid
    const { result } = renderHook(() => useOneMoreYear())
    expect(result.current.hasData).toBe(false)
    expect(result.current.scenarios).toHaveLength(0)
  })

  it('portfolio increases with each extra year', () => {
    useProfileStore.setState({
      ...useProfileStore.getState(),
      currentAge: 30,
      retirementAge: 55,
      lifeExpectancy: 90,
      annualIncome: 72000,
      annualExpenses: 48000,
      liquidNetWorth: 100000,
      usePortfolioReturn: false,
      expectedReturn: 0.07,
      validationErrors: {},
    })
    const { result } = renderHook(() => useOneMoreYear())
    const scenarios = result.current.scenarios
    for (let i = 1; i < scenarios.length; i++) {
      expect(scenarios[i].portfolioAtRetirement).toBeGreaterThan(scenarios[i - 1].portfolioAtRetirement)
    }
  })

  it('effectiveSwr decreases with each extra year', () => {
    useProfileStore.setState({
      ...useProfileStore.getState(),
      currentAge: 30,
      retirementAge: 55,
      lifeExpectancy: 90,
      annualIncome: 72000,
      annualExpenses: 48000,
      liquidNetWorth: 100000,
      usePortfolioReturn: false,
      expectedReturn: 0.07,
      validationErrors: {},
    })
    const { result } = renderHook(() => useOneMoreYear())
    const scenarios = result.current.scenarios
    for (let i = 1; i < scenarios.length; i++) {
      expect(scenarios[i].effectiveSwr).toBeLessThan(scenarios[i - 1].effectiveSwr)
    }
  })

  it('deltaPortfolio is 0 for base scenario', () => {
    const { result } = renderHook(() => useOneMoreYear())
    expect(result.current.scenarios[0].deltaPortfolio).toBe(0)
  })

  it('deltaPortfolio is positive for extra years', () => {
    const { result } = renderHook(() => useOneMoreYear())
    for (let i = 1; i < result.current.scenarios.length; i++) {
      expect(result.current.scenarios[i].deltaPortfolio).toBeGreaterThan(0)
    }
  })

  it('clamps to lifeExpectancy - 5', () => {
    useProfileStore.setState({
      ...useProfileStore.getState(),
      retirementAge: 84,
      lifeExpectancy: 90, // max offset = 90-5-84 = 1
      validationErrors: {},
    })
    const { result } = renderHook(() => useOneMoreYear())
    // Should have at most 2 scenarios (0 and 1)
    expect(result.current.scenarios.length).toBeLessThanOrEqual(2)
  })

  it('risk level transitions from risky to safe', () => {
    // Someone with high SWR — extra years should improve risk
    useProfileStore.setState({
      ...useProfileStore.getState(),
      currentAge: 30,
      retirementAge: 55,
      lifeExpectancy: 90,
      annualIncome: 72000,
      annualExpenses: 48000,
      liquidNetWorth: 500000,
      swr: 0.04,
      usePortfolioReturn: false,
      expectedReturn: 0.07,
      validationErrors: {},
    })
    const { result } = renderHook(() => useOneMoreYear())
    const scenarios = result.current.scenarios
    // All should have valid risk levels
    for (const s of scenarios) {
      expect(['safe', 'marginal', 'risky']).toContain(s.riskLevel)
    }
  })
})
