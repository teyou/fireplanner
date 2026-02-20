import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useWhatIfMetrics } from './useWhatIfMetrics'
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

describe('useWhatIfMetrics', () => {
  it('returns hasData: false when profile has errors', () => {
    useProfileStore.getState().setField('currentAge', 15)
    const { result } = renderHook(() => useWhatIfMetrics({}))
    expect(result.current.hasData).toBe(false)
    expect(result.current.baseMetrics).toBeNull()
  })

  it('no overrides: deltas are null', () => {
    const { result } = renderHook(() => useWhatIfMetrics({}))
    expect(result.current.hasData).toBe(true)
    expect(result.current.baseMetrics).not.toBeNull()
    expect(result.current.deltas).toBeNull()
  })

  it('increase expenses: FIRE number increases', () => {
    const { result: base } = renderHook(() => useWhatIfMetrics({}))
    const baseFireNumber = base.current.baseMetrics!.fireNumber

    const { result: overridden } = renderHook(() =>
      useWhatIfMetrics({ annualExpenses: 60000 })
    )
    expect(overridden.current.overrideMetrics!.fireNumber).toBeGreaterThan(baseFireNumber)
    expect(overridden.current.deltas!.fireNumber).toBeGreaterThan(0)
  })

  it('decrease SWR: higher FIRE number', () => {
    const { result } = renderHook(() => useWhatIfMetrics({ swr: 0.03 }))
    expect(result.current.deltas).not.toBeNull()
    expect(result.current.deltas!.fireNumber).toBeGreaterThan(0)
  })

  it('increase expected return: fewer years to FIRE', () => {
    const { result } = renderHook(() => useWhatIfMetrics({ expectedReturn: 0.12 }))
    expect(result.current.deltas).not.toBeNull()
    // Higher return should decrease years (negative delta)
    if (isFinite(result.current.deltas!.yearsToFire)) {
      expect(result.current.deltas!.yearsToFire).toBeLessThan(0)
    }
  })

  it('delay retirement age: more accumulation time', () => {
    const { result } = renderHook(() => useWhatIfMetrics({ retirementAge: 70 }))
    expect(result.current.deltas).not.toBeNull()
    // More time to accumulate → larger portfolio at retirement
    expect(result.current.deltas!.portfolioAtRetirement).toBeGreaterThan(0)
  })

  it('increase income: fewer years to FIRE', () => {
    const { result } = renderHook(() => useWhatIfMetrics({ annualIncome: 120000 }))
    expect(result.current.deltas).not.toBeNull()
    if (isFinite(result.current.deltas!.yearsToFire)) {
      expect(result.current.deltas!.yearsToFire).toBeLessThan(0)
    }
  })

  it('increase liquidNetWorth: fewer years to FIRE', () => {
    const { result } = renderHook(() => useWhatIfMetrics({ liquidNetWorth: 500000 }))
    expect(result.current.deltas).not.toBeNull()
    if (isFinite(result.current.deltas!.yearsToFire)) {
      expect(result.current.deltas!.yearsToFire).toBeLessThan(0)
    }
  })
})
