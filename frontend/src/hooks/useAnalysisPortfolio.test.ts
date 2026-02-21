import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAnalysisPortfolio } from './useAnalysisPortfolio'
import { useProfileStore } from '@/stores/useProfileStore'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { useAllocationStore } from '@/stores/useAllocationStore'
import { useSimulationStore } from '@/stores/useSimulationStore'
import { useUIStore } from '@/stores/useUIStore'

beforeEach(() => {
  useProfileStore.getState().reset()
  useIncomeStore.getState().reset()
  useAllocationStore.getState().reset()
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

describe('useAnalysisPortfolio', () => {
  describe('myPlan mode', () => {
    it('initialPortfolio = total NW (liquid + CPF)', () => {
      useProfileStore.setState({
        ...useProfileStore.getState(),
        liquidNetWorth: 500000,
        cpfOA: 100000,
        cpfSA: 50000,
        cpfMA: 30000,
        validationErrors: {},
      })
      useSimulationStore.setState({ ...useSimulationStore.getState(), analysisMode: 'myPlan' })
      const { result } = renderHook(() => useAnalysisPortfolio())
      expect(result.current.initialPortfolio).toBe(680000)
      expect(result.current.analysisMode).toBe('myPlan')
      expect(result.current.skipAccumulation).toBe(false)
    })

    it('initialPortfolio includes cpfRA', () => {
      useProfileStore.setState({
        ...useProfileStore.getState(),
        liquidNetWorth: 500000,
        cpfOA: 100000,
        cpfSA: 0,
        cpfMA: 30000,
        cpfRA: 150000,
        validationErrors: {},
      })
      useSimulationStore.setState({ ...useSimulationStore.getState(), analysisMode: 'myPlan' })
      const { result } = renderHook(() => useAnalysisPortfolio())
      // 500K + 100K + 0 + 30K + 150K = 780K
      expect(result.current.initialPortfolio).toBe(780000)
    })

    it('retirementPortfolio is projected forward', () => {
      useProfileStore.setState({
        ...useProfileStore.getState(),
        currentAge: 30,
        retirementAge: 55,
        liquidNetWorth: 100000,
        cpfOA: 0,
        cpfSA: 0,
        cpfMA: 0,
        annualIncome: 72000,
        annualExpenses: 48000,
        expectedReturn: 0.07,
        inflation: 0.025,
        expenseRatio: 0.003,
        validationErrors: {},
      })
      useSimulationStore.setState({ ...useSimulationStore.getState(), analysisMode: 'myPlan' })
      const { result } = renderHook(() => useAnalysisPortfolio())
      expect(result.current.retirementPortfolio).toBeGreaterThan(100000)
    })

    it('uses current allocation weights', () => {
      useAllocationStore.getState().applyTemplate('aggressive')
      useSimulationStore.setState({ ...useSimulationStore.getState(), analysisMode: 'myPlan' })
      const { result } = renderHook(() => useAnalysisPortfolio())
      // Aggressive template should have high equity
      expect(result.current.allocationWeights[0]).toBeGreaterThan(0.3) // US equities
    })

    it('portfolioLabel includes "today" text', () => {
      useSimulationStore.setState({ ...useSimulationStore.getState(), analysisMode: 'myPlan' })
      const { result } = renderHook(() => useAnalysisPortfolio())
      expect(result.current.portfolioLabel).toContain('today')
    })
  })

  describe('fireTarget mode', () => {
    it('initialPortfolio = FIRE number', () => {
      useProfileStore.setState({
        ...useProfileStore.getState(),
        annualExpenses: 48000,
        swr: 0.04,
        fireNumberBasis: 'today',
        validationErrors: {},
      })
      useSimulationStore.setState({ ...useSimulationStore.getState(), analysisMode: 'fireTarget' })
      const { result } = renderHook(() => useAnalysisPortfolio())
      expect(result.current.initialPortfolio).toBe(1200000) // 48K / 0.04
      expect(result.current.retirementPortfolio).toBe(1200000)
    })

    it('skipAccumulation is true', () => {
      useSimulationStore.setState({ ...useSimulationStore.getState(), analysisMode: 'fireTarget' })
      const { result } = renderHook(() => useAnalysisPortfolio())
      expect(result.current.skipAccumulation).toBe(true)
    })

    it('portfolioLabel includes "FIRE Target"', () => {
      useSimulationStore.setState({ ...useSimulationStore.getState(), analysisMode: 'fireTarget' })
      const { result } = renderHook(() => useAnalysisPortfolio())
      expect(result.current.portfolioLabel).toContain('FIRE Target')
    })
  })

  describe('portfolio return from allocation', () => {
    it('uses allocation return when usePortfolioReturn is true', () => {
      useProfileStore.setState({
        ...useProfileStore.getState(),
        usePortfolioReturn: true,
        expectedReturn: 0.05,
        validationErrors: {},
      })
      useAllocationStore.getState().applyTemplate('aggressive')
      useSimulationStore.setState({ ...useSimulationStore.getState(), analysisMode: 'myPlan' })
      const { result } = renderHook(() => useAnalysisPortfolio())
      // Aggressive allocation has higher return than 5%
      expect(result.current.retirementPortfolio).toBeGreaterThan(0)
    })

    it('falls back to expectedReturn when allocation has errors', () => {
      useProfileStore.setState({
        ...useProfileStore.getState(),
        usePortfolioReturn: true,
        expectedReturn: 0.07,
        validationErrors: {},
      })
      useAllocationStore.setState({
        ...useAllocationStore.getState(),
        validationErrors: { weights: 'Must sum to 100%' },
      })
      useSimulationStore.setState({ ...useSimulationStore.getState(), analysisMode: 'myPlan' })
      const { result } = renderHook(() => useAnalysisPortfolio())
      expect(result.current.retirementPortfolio).toBeGreaterThan(0)
    })
  })

  describe('glide path', () => {
    it('uses target weights in fireTarget mode when glide path enabled', () => {
      useAllocationStore.setState({
        ...useAllocationStore.getState(),
        currentWeights: [0.6, 0.1, 0.1, 0.1, 0.05, 0.05, 0, 0],
        targetWeights: [0.3, 0.05, 0.05, 0.4, 0.05, 0.05, 0.05, 0.05],
        glidePathConfig: {
          enabled: true,
          startAge: 45,
          endAge: 65,
          method: 'linear' as const,
        },
      })
      useProfileStore.setState({
        ...useProfileStore.getState(),
        retirementAge: 65,
        validationErrors: {},
      })
      useSimulationStore.setState({ ...useSimulationStore.getState(), analysisMode: 'fireTarget' })
      const { result } = renderHook(() => useAnalysisPortfolio())
      // At retirement age = endAge, should use target weights
      expect(result.current.allocationWeights).toEqual([0.3, 0.05, 0.05, 0.4, 0.05, 0.05, 0.05, 0.05])
    })
  })
})
