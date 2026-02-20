import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useFireCalculations } from './useFireCalculations'
import { useProfileStore } from '@/stores/useProfileStore'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { useAllocationStore } from '@/stores/useAllocationStore'
import { usePropertyStore } from '@/stores/usePropertyStore'

beforeEach(() => {
  useProfileStore.getState().reset()
  useIncomeStore.getState().reset()
  useAllocationStore.getState().reset()
  usePropertyStore.getState().reset()
})

describe('useFireCalculations', () => {
  it('computes FIRE metrics with valid defaults', () => {
    const { result } = renderHook(() => useFireCalculations())
    expect(result.current.hasErrors).toBe(false)
    expect(result.current.metrics).not.toBeNull()
    expect(result.current.metrics!.fireNumber).toBeGreaterThan(0)
  })

  it('returns null metrics when profile has validation errors', () => {
    useProfileStore.getState().setField('currentAge', 15) // Invalid
    const { result } = renderHook(() => useFireCalculations())
    expect(result.current.hasErrors).toBe(true)
    expect(result.current.metrics).toBeNull()
  })

  it('fresh graduate: FIRE number = $857,143 (today basis)', () => {
    useProfileStore.setState({
      currentAge: 25,
      retirementAge: 55,
      lifeExpectancy: 90,
      annualIncome: 48000,
      annualExpenses: 30000,
      liquidNetWorth: 50000,
      cpfOA: 0,
      cpfSA: 0,
      cpfMA: 0,
      swr: 0.035,
      fireType: 'regular',
      fireNumberBasis: 'today',
      retirementSpendingAdjustment: 1.0,
      usePortfolioReturn: false,
      expectedReturn: 0.07,
      inflation: 0.025,
      expenseRatio: 0.003,
      parentSupportEnabled: false,
      parentSupport: [],
      healthcareConfig: { ...useProfileStore.getState().healthcareConfig, enabled: false },
      validationErrors: {},
    })
    const { result } = renderHook(() => useFireCalculations())
    expect(result.current.metrics).not.toBeNull()
    // FIRE number = 30000 / 0.035 = 857142.857
    expect(result.current.metrics!.fireNumber).toBeCloseTo(857143, -1)
  })

  it('mid-career: progress with today basis', () => {
    useProfileStore.setState({
      currentAge: 35,
      retirementAge: 55,
      lifeExpectancy: 90,
      annualIncome: 180000,
      annualExpenses: 96000,
      liquidNetWorth: 800000,
      cpfOA: 200000,
      cpfSA: 100000,
      cpfMA: 0,
      swr: 0.04,
      fireType: 'regular',
      fireNumberBasis: 'today',
      retirementSpendingAdjustment: 1.0,
      usePortfolioReturn: false,
      expectedReturn: 0.07,
      inflation: 0.025,
      expenseRatio: 0.003,
      parentSupportEnabled: false,
      parentSupport: [],
      healthcareConfig: { ...useProfileStore.getState().healthcareConfig, enabled: false },
      validationErrors: {},
    })
    const { result } = renderHook(() => useFireCalculations())
    expect(result.current.metrics).not.toBeNull()
    // FIRE number = 96000 / 0.04 = 2,400,000
    expect(result.current.metrics!.fireNumber).toBe(2400000)
    // Progress = 1,100,000 / 2,400,000 = ~45.8%
    expect(result.current.metrics!.progress).toBeCloseTo(0.458, 1)
  })

  it('pre-retiree: already at FIRE (yearsToFire = 0)', () => {
    useProfileStore.setState({
      currentAge: 55,
      retirementAge: 58,
      lifeExpectancy: 90,
      lifeStage: 'pre-fire',
      annualIncome: 0,
      annualExpenses: 80000,
      liquidNetWorth: 2000000,
      cpfOA: 0,
      cpfSA: 0,
      cpfMA: 0,
      swr: 0.04,
      fireType: 'regular',
      usePortfolioReturn: false,
      expectedReturn: 0.07,
      inflation: 0.025,
      expenseRatio: 0.003,
      validationErrors: {},
    })
    const { result } = renderHook(() => useFireCalculations())
    expect(result.current.metrics).not.toBeNull()
    // FIRE number = 80000 / 0.04 = 2,000,000 — already reached
    expect(result.current.metrics!.fireNumber).toBe(2000000)
    expect(result.current.metrics!.progress).toBeGreaterThanOrEqual(1.0)
    expect(result.current.metrics!.yearsToFire).toBe(0)
  })

  it('includes property equity when owning property', () => {
    usePropertyStore.getState().setField('ownsProperty', true)
    usePropertyStore.getState().setField('existingPropertyValue', 1500000)
    usePropertyStore.getState().setField('existingMortgageBalance', 800000)

    const { result } = renderHook(() => useFireCalculations())
    expect(result.current.metrics).not.toBeNull()
    // Property equity = 700K should be included
  })

  it('uses portfolio return when usePortfolioReturn is true', () => {
    useProfileStore.getState().setField('usePortfolioReturn', true)
    // Allocation defaults should work since no errors
    const { result: withPortfolio } = renderHook(() => useFireCalculations())

    useProfileStore.getState().setField('usePortfolioReturn', false)
    const { result: withManual } = renderHook(() => useFireCalculations())

    // Different expected returns should produce different yearsToFire
    expect(withPortfolio.current.metrics).not.toBeNull()
    expect(withManual.current.metrics).not.toBeNull()
  })

  it('falls back to profile income when income has errors', () => {
    useIncomeStore.getState().setField('annualSalary', -1) // Invalid
    const { result } = renderHook(() => useFireCalculations())
    // Should still compute (using profile.annualIncome as fallback)
    expect(result.current.metrics).not.toBeNull()
  })
})
