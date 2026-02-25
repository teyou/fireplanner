import { describe, it, expect } from 'vitest'
import type { ExpenseAdjustment } from '@/lib/types'
import { getEffectiveExpenses, computeExpensePhases } from './expenses'

describe('getEffectiveExpenses', () => {
  const base = 48000

  it('returns base when no adjustments', () => {
    expect(getEffectiveExpenses(30, base, [], 90)).toBe(48000)
  })

  it('adds active adjustment at startAge', () => {
    const adj: ExpenseAdjustment[] = [
      { id: '1', label: 'Rent', amount: 12000, startAge: 28, endAge: 60 },
    ]
    expect(getEffectiveExpenses(28, base, adj, 90)).toBe(60000)
  })

  it('excludes adjustment at endAge (exclusive upper bound)', () => {
    const adj: ExpenseAdjustment[] = [
      { id: '1', label: 'Rent', amount: 12000, startAge: 28, endAge: 60 },
    ]
    // Active at 59, not at 60
    expect(getEffectiveExpenses(59, base, adj, 90)).toBe(60000)
    expect(getEffectiveExpenses(60, base, adj, 90)).toBe(48000)
  })

  it('excludes adjustment before startAge', () => {
    const adj: ExpenseAdjustment[] = [
      { id: '1', label: 'Rent', amount: 12000, startAge: 35, endAge: 60 },
    ]
    expect(getEffectiveExpenses(34, base, adj, 90)).toBe(48000)
  })

  it('sums overlapping adjustments', () => {
    const adj: ExpenseAdjustment[] = [
      { id: '1', label: 'Rent', amount: 12000, startAge: 25, endAge: 60 },
      { id: '2', label: 'Kid school', amount: 6000, startAge: 30, endAge: 48 },
    ]
    // At age 35: both active → 48000 + 12000 + 6000
    expect(getEffectiveExpenses(35, base, adj, 90)).toBe(66000)
  })

  it('handles negative adjustments (reduced spending)', () => {
    const adj: ExpenseAdjustment[] = [
      { id: '1', label: 'Live with parents', amount: -20000, startAge: 25, endAge: 30 },
    ]
    expect(getEffectiveExpenses(27, base, adj, 90)).toBe(28000)
  })

  it('floors at zero when negative adjustments exceed base', () => {
    const adj: ExpenseAdjustment[] = [
      { id: '1', label: 'Huge discount', amount: -60000, startAge: 25, endAge: 30 },
    ]
    expect(getEffectiveExpenses(27, base, adj, 90)).toBe(0)
  })

  it('resolves null endAge to lifeExpectancy', () => {
    const adj: ExpenseAdjustment[] = [
      { id: '1', label: 'Ongoing cost', amount: 5000, startAge: 40, endAge: null },
    ]
    // Active at 85 (before lifeExpectancy 90)
    expect(getEffectiveExpenses(85, base, adj, 90)).toBe(53000)
    // Not active at 90 (endAge is exclusive)
    expect(getEffectiveExpenses(90, base, adj, 90)).toBe(48000)
  })

  it('resolves null endAge with different lifeExpectancy', () => {
    const adj: ExpenseAdjustment[] = [
      { id: '1', label: 'Ongoing', amount: 5000, startAge: 40, endAge: null },
    ]
    // lifeExpectancy = 80, so active at 79 but not 80
    expect(getEffectiveExpenses(79, base, adj, 80)).toBe(53000)
    expect(getEffectiveExpenses(80, base, adj, 80)).toBe(48000)
  })
})

describe('computeExpensePhases', () => {
  const base = 48000

  it('returns single phase when no adjustments', () => {
    const phases = computeExpensePhases(base, [], 30, 90, 90)
    expect(phases).toEqual([
      { fromAge: 30, toAge: 90, amount: 48000 },
    ])
  })

  it('splits into phases at adjustment boundaries', () => {
    const adj: ExpenseAdjustment[] = [
      { id: '1', label: 'Rent', amount: 12000, startAge: 35, endAge: 60 },
    ]
    const phases = computeExpensePhases(base, adj, 30, 90, 90)
    expect(phases).toEqual([
      { fromAge: 30, toAge: 35, amount: 48000 },
      { fromAge: 35, toAge: 60, amount: 60000 },
      { fromAge: 60, toAge: 90, amount: 48000 },
    ])
  })

  it('handles overlapping adjustments with multiple transition points', () => {
    const adj: ExpenseAdjustment[] = [
      { id: '1', label: 'Rent', amount: 12000, startAge: 28, endAge: 60 },
      { id: '2', label: 'Kid school', amount: 6000, startAge: 35, endAge: 48 },
    ]
    const phases = computeExpensePhases(base, adj, 25, 90, 90)
    expect(phases).toEqual([
      { fromAge: 25, toAge: 28, amount: 48000 },
      { fromAge: 28, toAge: 35, amount: 60000 },
      { fromAge: 35, toAge: 48, amount: 66000 },
      { fromAge: 48, toAge: 60, amount: 60000 },
      { fromAge: 60, toAge: 90, amount: 48000 },
    ])
  })

  it('resolves null endAge to lifeExpectancy for phase computation', () => {
    const adj: ExpenseAdjustment[] = [
      { id: '1', label: 'Ongoing', amount: 5000, startAge: 40, endAge: null },
    ]
    const phases = computeExpensePhases(base, adj, 30, 90, 90)
    expect(phases).toEqual([
      { fromAge: 30, toAge: 40, amount: 48000 },
      { fromAge: 40, toAge: 90, amount: 53000 },
    ])
  })

  it('omits phases outside the requested range', () => {
    const adj: ExpenseAdjustment[] = [
      { id: '1', label: 'Early', amount: 5000, startAge: 20, endAge: 25 },
    ]
    // Range starts at 30, so the 20-25 adjustment is irrelevant
    const phases = computeExpensePhases(base, adj, 30, 90, 90)
    expect(phases).toEqual([
      { fromAge: 30, toAge: 90, amount: 48000 },
    ])
  })

  it('clips adjustment boundaries to requested range', () => {
    const adj: ExpenseAdjustment[] = [
      { id: '1', label: 'Long', amount: 10000, startAge: 25, endAge: 95 },
    ]
    // Range is 30-90, adjustment extends beyond both sides
    const phases = computeExpensePhases(base, adj, 30, 90, 90)
    expect(phases).toEqual([
      { fromAge: 30, toAge: 90, amount: 58000 },
    ])
  })

  it('handles negative adjustment floor at zero in phases', () => {
    const adj: ExpenseAdjustment[] = [
      { id: '1', label: 'Huge discount', amount: -60000, startAge: 30, endAge: 40 },
    ]
    const phases = computeExpensePhases(base, adj, 25, 50, 90)
    expect(phases).toEqual([
      { fromAge: 25, toAge: 30, amount: 48000 },
      { fromAge: 30, toAge: 40, amount: 0 },
      { fromAge: 40, toAge: 50, amount: 48000 },
    ])
  })
})
