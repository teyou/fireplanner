import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAdjustedFireNumber } from './useAdjustedFireNumber'
import { useProfileStore } from '@/stores/useProfileStore'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { useAllocationStore } from '@/stores/useAllocationStore'
import { usePropertyStore } from '@/stores/usePropertyStore'
import { useSimulationStore } from '@/stores/useSimulationStore'

beforeEach(() => {
  useProfileStore.getState().reset()
  useIncomeStore.getState().reset()
  useAllocationStore.getState().reset()
  usePropertyStore.getState().reset()
  useSimulationStore.getState().reset()
})

describe('useAdjustedFireNumber', () => {
  it('returns simpleFireNumber with valid defaults', () => {
    const { result } = renderHook(() => useAdjustedFireNumber())
    expect(result.current.simpleFireNumber).not.toBeNull()
    expect(result.current.simpleFireNumber).toBeGreaterThan(0)
  })

  it('returns null projectionFireNumber when profile has errors', () => {
    useProfileStore.getState().setField('currentAge', 15)
    const { result } = renderHook(() => useAdjustedFireNumber())
    expect(result.current.simpleFireNumber).toBeNull()
    expect(result.current.projectionFireNumber).toBeNull()
    expect(result.current.showProjectionNumber).toBe(false)
  })

  it('returns null projectionFireNumber when no retired rows exist', () => {
    useProfileStore.setState({
      ...useProfileStore.getState(),
      currentAge: 30,
      retirementAge: 90,
      lifeExpectancy: 90,
      validationErrors: {},
    })
    const { result } = renderHook(() => useAdjustedFireNumber())
    expect(result.current.simpleFireNumber).not.toBeNull()
    expect(result.current.projectionFireNumber).toBeNull()
    expect(result.current.showProjectionNumber).toBe(false)
  })

  it('computes projectionFireNumber when retired rows exist', () => {
    useProfileStore.setState({
      ...useProfileStore.getState(),
      currentAge: 55,
      retirementAge: 58,
      lifeExpectancy: 90,
      annualExpenses: 80000,
      liquidNetWorth: 2000000,
      swr: 0.04,
      usePortfolioReturn: false,
      expectedReturn: 0.07,
      inflation: 0.025,
      expenseRatio: 0.003,
      healthcareConfig: { ...useProfileStore.getState().healthcareConfig, enabled: false },
      validationErrors: {},
    })
    const { result } = renderHook(() => useAdjustedFireNumber())
    expect(result.current.projectionFireNumber).not.toBeNull()
    expect(result.current.projectionFireNumber).toBeGreaterThan(0)
    expect(result.current.deviationPct).not.toBeNull()
  })

  it('showProjectionNumber is false when deviation < 5%', () => {
    // Use today-dollar basis and no CPF LIFE (cpfLifeStartAge beyond lifeExpectancy)
    // to ensure the projection's inflation normalization round-trips cleanly,
    // producing near-zero deviation when there are no special cash flows.
    useProfileStore.setState({
      ...useProfileStore.getState(),
      currentAge: 30,
      retirementAge: 65,
      lifeExpectancy: 90,
      annualExpenses: 48000,
      liquidNetWorth: 0,
      cpfOA: 0,
      cpfSA: 0,
      cpfMA: 0,
      cpfRA: 0,
      cpfLifeStartAge: 100, // beyond lifeExpectancy — no CPF LIFE payout in projection
      swr: 0.04,
      fireNumberBasis: 'today',
      usePortfolioReturn: false,
      expectedReturn: 0.07,
      inflation: 0.025,
      expenseRatio: 0.003,
      parentSupportEnabled: false,
      parentSupport: [],
      healthcareConfig: { ...useProfileStore.getState().healthcareConfig, enabled: false },
      validationErrors: {},
    })
    const { result } = renderHook(() => useAdjustedFireNumber())
    expect(result.current.deviationPct).not.toBeNull()
    expect(Math.abs(result.current.deviationPct!)).toBeLessThan(0.05)
    expect(result.current.showProjectionNumber).toBe(false)
  })

  it('detects mortgage cash payments as deviation factor', () => {
    usePropertyStore.setState({
      ...usePropertyStore.getState(),
      ownsProperty: true,
      existingPropertyValue: 1500000,
      existingMortgageBalance: 800000,
      existingMonthlyPayment: 3000,
      mortgageCpfMonthly: 0,
      existingMortgageRate: 0.035,
      existingMortgageRemainingYears: 20,
      ownershipPercent: 1,
      validationErrors: {},
    })
    useProfileStore.setState({
      ...useProfileStore.getState(),
      currentAge: 55,
      retirementAge: 58,
      lifeExpectancy: 90,
      annualExpenses: 80000,
      liquidNetWorth: 2000000,
      cpfOA: 0,
      cpfSA: 0,
      cpfMA: 0,
      cpfRA: 0,
      cpfLifeStartAge: 100,
      swr: 0.04,
      usePortfolioReturn: false,
      expectedReturn: 0.07,
      inflation: 0.025,
      expenseRatio: 0.003,
      parentSupportEnabled: false,
      parentSupport: [],
      healthcareConfig: { ...useProfileStore.getState().healthcareConfig, enabled: false },
      validationErrors: {},
    })
    const { result } = renderHook(() => useAdjustedFireNumber())
    // $3K/mo all-cash mortgage creates significant deviation from simple FIRE number
    expect(result.current.deviationFactors).toContain('mortgage cash payments')
  })

  it('deviationFactors is empty array when no special cash flows', () => {
    useProfileStore.setState({
      ...useProfileStore.getState(),
      currentAge: 55,
      retirementAge: 58,
      lifeExpectancy: 90,
      annualExpenses: 80000,
      liquidNetWorth: 2000000,
      swr: 0.04,
      usePortfolioReturn: false,
      expectedReturn: 0.07,
      inflation: 0.025,
      expenseRatio: 0.003,
      parentSupportEnabled: false,
      parentSupport: [],
      healthcareConfig: { ...useProfileStore.getState().healthcareConfig, enabled: false },
      validationErrors: {},
    })
    const { result } = renderHook(() => useAdjustedFireNumber())
    expect(result.current.deviationFactors).toEqual([])
  })

  it('both fire numbers are in the same dollar basis', () => {
    useProfileStore.setState({
      ...useProfileStore.getState(),
      currentAge: 45,
      retirementAge: 55,
      lifeExpectancy: 90,
      annualExpenses: 80000,
      liquidNetWorth: 1500000,
      swr: 0.04,
      fireNumberBasis: 'today',
      usePortfolioReturn: false,
      expectedReturn: 0.07,
      inflation: 0.025,
      expenseRatio: 0.003,
      parentSupportEnabled: false,
      parentSupport: [],
      healthcareConfig: { ...useProfileStore.getState().healthcareConfig, enabled: false },
      validationErrors: {},
    })
    const { result } = renderHook(() => useAdjustedFireNumber())
    const simple = result.current.simpleFireNumber!
    const proj = result.current.projectionFireNumber!
    expect(result.current.deviationPct).not.toBeNull()
    // If normalization works, deviation should be much less than the raw
    // inflation gap (10 years at 2.5% = ~28%). Tight bound confirms same basis.
    expect(Math.abs(result.current.deviationPct!)).toBeLessThan(0.25)
    expect(simple).toBeGreaterThan(0)
    expect(proj).toBeGreaterThan(0)
  })
})
