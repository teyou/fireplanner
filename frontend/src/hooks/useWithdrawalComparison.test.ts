import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useWithdrawalComparison, getStrategyLabel } from './useWithdrawalComparison'
import { useProfileStore } from '@/stores/useProfileStore'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { useAllocationStore } from '@/stores/useAllocationStore'
import { useWithdrawalStore } from '@/stores/useWithdrawalStore'
import { useSimulationStore } from '@/stores/useSimulationStore'
import { useUIStore } from '@/stores/useUIStore'

beforeEach(() => {
  useProfileStore.getState().reset()
  useIncomeStore.getState().reset()
  useAllocationStore.getState().reset()
  useWithdrawalStore.getState().reset()
  useSimulationStore.getState().reset()
  useUIStore.setState({
    sectionOrder: 'goal-first',
    cpfEnabled: true,
    propertyEnabled: false,
    healthcareEnabled: false,
    mode: 'simple',
    statsPosition: 'bottom',
  })
})

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

describe('useWithdrawalComparison', () => {
  it('returns results with valid profile', () => {
    useProfileStore.setState({
      ...useProfileStore.getState(),
      currentAge: 55,
      retirementAge: 58,
      lifeExpectancy: 90,
      liquidNetWorth: 2000000,
      annualExpenses: 80000,
      swr: 0.04,
      expectedReturn: 0.05,
      inflation: 0.025,
      expenseRatio: 0.003,
      validationErrors: {},
    })
    const { result } = renderHook(() => useWithdrawalComparison())
    expect(result.current.hasErrors).toBe(false)
    expect(result.current.results).not.toBeNull()
  })

  it('returns errors when profile has validation errors', () => {
    useProfileStore.getState().setField('currentAge', 15) // Invalid
    const { result } = renderHook(() => useWithdrawalComparison())
    expect(result.current.hasErrors).toBe(true)
    expect(result.current.results).toBeNull()
    expect(Object.keys(result.current.errors).length).toBeGreaterThan(0)
  })

  it('results contain strategy summaries when valid', () => {
    useProfileStore.setState({
      ...useProfileStore.getState(),
      currentAge: 55,
      retirementAge: 58,
      lifeExpectancy: 90,
      liquidNetWorth: 2000000,
      annualExpenses: 80000,
      swr: 0.04,
      expectedReturn: 0.05,
      inflation: 0.025,
      expenseRatio: 0.003,
      validationErrors: {},
    })
    const { result } = renderHook(() => useWithdrawalComparison())
    expect(result.current.results).not.toBeNull()
    // Results have yearResults and summaries keyed by strategy
    expect(Object.keys(result.current.results!.summaries).length).toBeGreaterThan(0)
    expect(Object.keys(result.current.results!.yearResults).length).toBeGreaterThan(0)
  })

  it('uses portfolio return when usePortfolioReturn is true', () => {
    // With manual return (10%), usePortfolioReturn = false
    useProfileStore.setState({
      ...useProfileStore.getState(),
      currentAge: 55,
      retirementAge: 58,
      lifeExpectancy: 90,
      liquidNetWorth: 2000000,
      annualExpenses: 80000,
      swr: 0.04,
      expectedReturn: 0.10, // 10% — far from balanced portfolio return (~4.85%)
      inflation: 0.025,
      expenseRatio: 0.003,
      usePortfolioReturn: false,
      validationErrors: {},
    })
    useAllocationStore.setState({ ...useAllocationStore.getState(), validationErrors: {} })
    const { result: manual, unmount: unmountManual } = renderHook(() => useWithdrawalComparison())
    expect(manual.current.hasErrors).toBe(false)
    expect(manual.current.results).not.toBeNull()
    const manualTerminal = manual.current.results!.summaries[
      Object.keys(manual.current.results!.summaries)[0]
    ].terminalPortfolio
    unmountManual()

    // Now enable portfolio return — balanced allocation yields ~4.85% vs 10% manual
    useProfileStore.setState({
      ...useProfileStore.getState(),
      usePortfolioReturn: true,
    })
    const { result: portfolio } = renderHook(() => useWithdrawalComparison())
    expect(portfolio.current.hasErrors).toBe(false)
    expect(portfolio.current.results).not.toBeNull()
    const portfolioTerminal = portfolio.current.results!.summaries[
      Object.keys(portfolio.current.results!.summaries)[0]
    ].terminalPortfolio

    // Different expected returns (10% vs ~4.85%) lead to different outcomes
    expect(manualTerminal).not.toEqual(portfolioTerminal)
  })

  // Skipped: useAnalysisPortfolio no longer supports fireTarget mode (always My Plan).
  // Task 5b will decouple useWithdrawalComparison from the analysis hook and rewrite this test.
  it.skip('uses fireTarget analysisMode portfolio from analysisPortfolio', () => {
    // NW = 1.5M, FIRE number = 80K/0.04 = 2M — deliberately different
    useProfileStore.setState({
      ...useProfileStore.getState(),
      currentAge: 55,
      retirementAge: 58,
      lifeExpectancy: 90,
      liquidNetWorth: 1500000,
      annualExpenses: 80000,
      swr: 0.04,
      expectedReturn: 0.05,
      inflation: 0.025,
      expenseRatio: 0.003,
      usePortfolioReturn: false,
      validationErrors: {},
    })

    // myPlan mode first
    useSimulationStore.setState({ ...useSimulationStore.getState(), analysisMode: 'myPlan' })
    const { result: myPlan, unmount: unmountMyPlan } = renderHook(() => useWithdrawalComparison())
    expect(myPlan.current.hasErrors).toBe(false)
    expect(myPlan.current.results).not.toBeNull()
    const myPlanTerminal = myPlan.current.results!.summaries[
      Object.keys(myPlan.current.results!.summaries)[0]
    ].terminalPortfolio
    unmountMyPlan()

    // Switch to fireTarget mode — uses FIRE number (2M) as initial portfolio
    useSimulationStore.setState({ ...useSimulationStore.getState(), analysisMode: 'fireTarget' })
    const { result: fireTarget } = renderHook(() => useWithdrawalComparison())
    expect(fireTarget.current.hasErrors).toBe(false)
    expect(fireTarget.current.results).not.toBeNull()
    const fireTargetTerminal = fireTarget.current.results!.summaries[
      Object.keys(fireTarget.current.results!.summaries)[0]
    ].terminalPortfolio

    // myPlan compounds 1.5M by netReturn, fireTarget uses FIRE number 2M
    expect(myPlanTerminal).not.toEqual(fireTargetTerminal)
  })

  it('uses initialPortfolioOverride when provided in myPlan mode', () => {
    useProfileStore.setState({
      ...useProfileStore.getState(),
      currentAge: 55,
      retirementAge: 58,
      lifeExpectancy: 90,
      liquidNetWorth: 2000000,
      annualExpenses: 80000,
      swr: 0.04,
      expectedReturn: 0.05,
      inflation: 0.025,
      expenseRatio: 0.003,
      usePortfolioReturn: false,
      validationErrors: {},
    })
    useSimulationStore.setState({ ...useSimulationStore.getState(), analysisMode: 'myPlan' })

    // Without override — uses compound growth
    const { result: noOverride } = renderHook(() => useWithdrawalComparison())
    const noOverrideTerminal = noOverride.current.results!.summaries[
      Object.keys(noOverride.current.results!.summaries)[0]
    ].terminalPortfolio

    // With override — uses the explicit value (3M instead of ~2.3M compounded)
    const { result: withOverride } = renderHook(() =>
      useWithdrawalComparison({ initialPortfolioOverride: 3000000 })
    )
    const overrideTerminal = withOverride.current.results!.summaries[
      Object.keys(withOverride.current.results!.summaries)[0]
    ].terminalPortfolio

    // 3M override vs compound growth from 2M should differ
    expect(overrideTerminal).not.toEqual(noOverrideTerminal)
  })
})
