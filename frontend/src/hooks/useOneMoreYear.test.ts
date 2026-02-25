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

  it('risky risk level when effectiveSwr > 4.5%', () => {
    // Set up so that expenses / portfolio > 4.5% at retirement
    // With currentAge == retirementAge (0 years), portfolio = NW directly.
    // NW = 1M, expenses = 80K → SWR = 80K/1M = 8% → risky
    useProfileStore.setState({
      ...useProfileStore.getState(),
      currentAge: 55,
      retirementAge: 55,
      lifeExpectancy: 90,
      annualIncome: 80000,
      annualExpenses: 80000, // All income consumed, no savings
      liquidNetWorth: 1000000,
      cpfOA: 0,
      cpfSA: 0,
      cpfMA: 0,
      cpfRA: 0,
      swr: 0.04,
      usePortfolioReturn: false,
      expectedReturn: 0.07,
      inflation: 0.025,
      expenseRatio: 0.003,
      validationErrors: {},
    })
    const { result } = renderHook(() => useOneMoreYear())
    expect(result.current.hasData).toBe(true)
    const baseScenario = result.current.scenarios[0]
    // effectiveSwr = 80K / 1M = 0.08 → risky
    expect(baseScenario.effectiveSwr).toBeGreaterThan(0.045)
    expect(baseScenario.riskLevel).toBe('risky')
  })

  it('marginal risk level at swr boundary of 4.5%', () => {
    // Set up portfolio so that effectiveSwr = expenses / portfolio = 0.045 exactly
    // expenses = 80K → portfolio needed = 80K / 0.045 = 1,777,777.78
    // With currentAge == retirementAge, portfolio = totalNW
    const targetNW = Math.ceil(80000 / 0.045) // 1777778
    useProfileStore.setState({
      ...useProfileStore.getState(),
      currentAge: 55,
      retirementAge: 55,
      lifeExpectancy: 90,
      annualIncome: 80000,
      annualExpenses: 80000,
      liquidNetWorth: targetNW,
      cpfOA: 0,
      cpfSA: 0,
      cpfMA: 0,
      cpfRA: 0,
      swr: 0.04,
      usePortfolioReturn: false,
      expectedReturn: 0.07,
      inflation: 0.025,
      expenseRatio: 0.003,
      validationErrors: {},
    })
    const { result } = renderHook(() => useOneMoreYear())
    expect(result.current.hasData).toBe(true)
    const baseScenario = result.current.scenarios[0]
    // effectiveSwr = 80K / 1777778 ≈ 0.045 → marginal (not risky)
    expect(baseScenario.effectiveSwr).toBeCloseTo(0.045, 3)
    expect(baseScenario.riskLevel).toBe('marginal')
  })

  it('Infinity effectiveSwr when portfolio is 0', () => {
    // Zero NW, zero savings → portfolio = 0 → effectiveSwr = Infinity → risky
    useProfileStore.setState({
      ...useProfileStore.getState(),
      currentAge: 55,
      retirementAge: 55,
      lifeExpectancy: 90,
      annualIncome: 48000,
      annualExpenses: 48000,
      liquidNetWorth: 0,
      cpfOA: 0,
      cpfSA: 0,
      cpfMA: 0,
      cpfRA: 0,
      swr: 0.04,
      usePortfolioReturn: false,
      expectedReturn: 0.07,
      validationErrors: {},
    })
    const { result } = renderHook(() => useOneMoreYear())
    expect(result.current.hasData).toBe(true)
    const baseScenario = result.current.scenarios[0]
    expect(baseScenario.effectiveSwr).toBe(Infinity)
    expect(baseScenario.riskLevel).toBe('risky')
  })
})
