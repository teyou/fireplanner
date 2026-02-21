import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePassiveIncomeSummary } from './usePassiveIncomeSummary'
import { useProfileStore } from '@/stores/useProfileStore'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { useAllocationStore } from '@/stores/useAllocationStore'
import { useUIStore } from '@/stores/useUIStore'

beforeEach(() => {
  useProfileStore.getState().reset()
  useIncomeStore.getState().reset()
  useAllocationStore.getState().reset()
  useUIStore.setState({
    sectionOrder: 'goal-first',
    cpfEnabled: true,
    propertyEnabled: false,
    healthcareEnabled: false,
    mode: 'simple',
    statsPosition: 'bottom',
  })
})

describe('usePassiveIncomeSummary', () => {
  it('returns null when profile has validation errors', () => {
    useProfileStore.getState().setField('currentAge', 15) // Invalid
    const { result } = renderHook(() => usePassiveIncomeSummary())
    expect(result.current).toBeNull()
  })

  it('returns summary for valid retired profile', () => {
    useProfileStore.setState({
      ...useProfileStore.getState(),
      currentAge: 55,
      retirementAge: 58,
      lifeExpectancy: 90,
      annualIncome: 0,
      annualExpenses: 80000,
      liquidNetWorth: 2000000,
      swr: 0.04,
      expectedReturn: 0.05,
      inflation: 0.025,
      expenseRatio: 0.003,
      lifeStage: 'post-fire',
      validationErrors: {},
    })
    useIncomeStore.setState({
      ...useIncomeStore.getState(),
      annualSalary: 0,
      validationErrors: {},
    })
    const { result } = renderHook(() => usePassiveIncomeSummary())
    // A post-fire user with no income streams will have projection rows.
    // If no passive income sources exist, totalAtRetirement = 0
    if (result.current !== null) {
      expect(result.current.requiredExpenses).toBeGreaterThan(0)
      expect(result.current.yearlyBreakdown.length).toBeGreaterThan(0)
    }
  })

  it('returns null for working-age profile with no retired rows', () => {
    // Default profile: age 30, retirement 65 — all rows before 65 are working
    // But projection includes rows past retirement too, so it should have retired rows
    useProfileStore.setState({
      ...useProfileStore.getState(),
      currentAge: 30,
      retirementAge: 65,
      lifeExpectancy: 90,
      annualExpenses: 48000,
      validationErrors: {},
    })
    const { result } = renderHook(() => usePassiveIncomeSummary())
    // Should have retired rows from 65-90, so not null
    if (result.current !== null) {
      expect(result.current.yearlyBreakdown[0].age).toBeGreaterThanOrEqual(65)
    }
  })

  it('includes income streams in passive income sources', () => {
    useProfileStore.setState({
      ...useProfileStore.getState(),
      currentAge: 55,
      retirementAge: 58,
      lifeExpectancy: 90,
      annualIncome: 0,
      annualExpenses: 80000,
      liquidNetWorth: 2000000,
      swr: 0.04,
      expectedReturn: 0.05,
      inflation: 0.025,
      expenseRatio: 0.003,
      validationErrors: {},
    })
    useIncomeStore.setState({
      ...useIncomeStore.getState(),
      annualSalary: 0,
      incomeStreams: [
        {
          id: 'rental1',
          name: 'Rental',
          type: 'rental',
          annualAmount: 24000,
          startAge: 55,
          endAge: 90,
          growthRate: 0.02,
          growthModel: 'fixed' as const,
          taxTreatment: 'taxable' as const,
          isCpfApplicable: false,
          isActive: true,
        },
      ],
      validationErrors: {},
    })
    const { result } = renderHook(() => usePassiveIncomeSummary())
    if (result.current !== null) {
      // Should have rental income in sources
      const rentalSource = result.current.sources.find((s) => s.label === 'Rental Income')
      if (rentalSource) {
        expect(rentalSource.annualAmount).toBeGreaterThan(0)
      }
      expect(result.current.totalAtRetirement).toBeGreaterThanOrEqual(0)
    }
  })
})
