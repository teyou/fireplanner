import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCashFlowChart } from './useCashFlowChart'
import { useProfileStore } from '@/stores/useProfileStore'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { useAllocationStore } from '@/stores/useAllocationStore'
import { useSimulationStore } from '@/stores/useSimulationStore'
import { usePropertyStore } from '@/stores/usePropertyStore'

beforeEach(() => {
  useProfileStore.getState().reset()
  useIncomeStore.getState().reset()
  useAllocationStore.getState().reset()
  useSimulationStore.getState().reset()
  usePropertyStore.getState().reset()
})

describe('useCashFlowChart', () => {
  it('returns null when there are no projection rows', () => {
    // Create validation errors to prevent projection computation
    useProfileStore.getState().setField('currentAge', 15)
    const { result } = renderHook(() => useCashFlowChart('all'))
    expect(result.current).toBeNull()
  })

  it('returns data for "all" phase with default profile', () => {
    const { result } = renderHook(() => useCashFlowChart('all'))
    expect(result.current).not.toBeNull()
    const data = result.current!
    expect(data.rows.length).toBeGreaterThan(0)
    expect(data.retirementAge).toBe(65)
    // Should have both retired and non-retired rows
    const hasPreRetirement = data.rows.some((r) => !r.isRetired)
    const hasPostRetirement = data.rows.some((r) => r.isRetired)
    expect(hasPreRetirement).toBe(true)
    expect(hasPostRetirement).toBe(true)
  })

  it('accumulation phase only shows pre-retirement rows', () => {
    const { result } = renderHook(() => useCashFlowChart('accumulation'))
    expect(result.current).not.toBeNull()
    const data = result.current!
    expect(data.rows.length).toBeGreaterThan(0)
    expect(data.rows.every((r) => !r.isRetired)).toBe(true)
  })

  it('decumulation phase only shows retired rows', () => {
    const { result } = renderHook(() => useCashFlowChart('decumulation'))
    expect(result.current).not.toBeNull()
    const data = result.current!
    expect(data.rows.length).toBeGreaterThan(0)
    expect(data.rows.every((r) => r.isRetired)).toBe(true)
  })

  it('outflows are negative values', () => {
    const { result } = renderHook(() => useCashFlowChart('all'))
    expect(result.current).not.toBeNull()
    const data = result.current!
    // Pre-retirement rows should have negative tax and cpf
    const preRetirementRow = data.rows.find((r) => !r.isRetired && r.salary > 0)
    if (preRetirementRow) {
      expect(preRetirementRow.tax).toBeLessThanOrEqual(0)
      expect(preRetirementRow.cpf).toBeLessThanOrEqual(0)
      expect(preRetirementRow.living).toBeLessThan(0)
    }
  })

  it('zero-series exclusion works (rental not visible when no rental income)', () => {
    // Default profile has no rental income streams
    const { result } = renderHook(() => useCashFlowChart('all'))
    expect(result.current).not.toBeNull()
    const data = result.current!
    // No rental income configured, so rental should not be visible
    expect(data.visibleSeries).not.toContain('rental')
  })

  it('visible series includes salary for default profile', () => {
    const { result } = renderHook(() => useCashFlowChart('all'))
    expect(result.current).not.toBeNull()
    const data = result.current!
    expect(data.visibleSeries).toContain('salary')
    expect(data.visibleSeries).toContain('living')
  })

  it('portfolioWithdrawal is zero for pre-retirement rows', () => {
    const { result } = renderHook(() => useCashFlowChart('accumulation'))
    expect(result.current).not.toBeNull()
    const data = result.current!
    expect(data.rows.every((r) => r.portfolioWithdrawal === 0)).toBe(true)
  })

  it('each row has an age field', () => {
    const { result } = renderHook(() => useCashFlowChart('all'))
    expect(result.current).not.toBeNull()
    const data = result.current!
    data.rows.forEach((row) => {
      expect(typeof row.age).toBe('number')
      expect(row.age).toBeGreaterThanOrEqual(18)
    })
  })

  it('visibleSeries does not include mortgage or rent when not configured', () => {
    // Default: no property
    const { result } = renderHook(() => useCashFlowChart('all'))
    expect(result.current).not.toBeNull()
    const data = result.current!
    expect(data.visibleSeries).not.toContain('mortgage')
    expect(data.visibleSeries).not.toContain('rent')
  })

  it('srsWithdrawal is not visible when no SRS configured', () => {
    // SRS withdrawal is not directly on ProjectionRow, so it's always 0
    const { result } = renderHook(() => useCashFlowChart('all'))
    expect(result.current).not.toBeNull()
    const data = result.current!
    expect(data.visibleSeries).not.toContain('srsWithdrawal')
  })
})
