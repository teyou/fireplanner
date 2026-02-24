import { describe, it, expect } from 'vitest'
import { computeCashReservePlan, computeCashReserveOffset } from './cashReserve'
import type { CashReservePlanParams } from './cashReserve'

describe('computeCashReservePlan', () => {
  const baseParams: CashReservePlanParams = {
    mode: 'fixed',
    target: 30000,
    months: 6,
    initialBalance: 0,
    annualSavingsArray: [20000, 20000, 20000, 20000, 20000],
    cashReturn: 0.02,
    inflationRate: 0.025,
    annualExpenses: 48000,
  }

  it('reserve already funded — all savings flow to investments', () => {
    const result = computeCashReservePlan({
      ...baseParams,
      initialBalance: 30000,
    })
    expect(result.investedSavings).toEqual([20000, 20000, 20000, 20000, 20000])
    expect(result.reserveBalance[0]).toBeCloseTo(30000 * 1.02, 0)
    result.reserveBalance.forEach((b) => expect(b).toBeGreaterThanOrEqual(30000))
  })

  it('reserve fills over 2 years', () => {
    const result = computeCashReservePlan(baseParams)
    // Year 0: $20K diverted, $0 invested. Balance = 20000
    expect(result.investedSavings[0]).toBe(0)
    expect(result.reserveBalance[0]).toBe(20000)
    // Year 1: balance = 20000 * 1.02 = 20400. Shortfall = 9600. Divert 9600, invest 10400
    expect(result.investedSavings[1]).toBeCloseTo(10400, 0)
    expect(result.reserveBalance[1]).toBeCloseTo(30000, 0)
    // Year 2+: reserve full, all savings invested
    expect(result.investedSavings[2]).toBe(20000)
    expect(result.investedSavings[3]).toBe(20000)
    expect(result.investedSavings[4]).toBe(20000)
  })

  it('months mode — target grows with inflation', () => {
    const result = computeCashReservePlan({
      ...baseParams,
      mode: 'months',
      target: 0,
      annualSavingsArray: [50000, 50000, 50000],
    })
    // Year 0 target: 6 months × $48,000/12 = $24,000
    expect(result.reserveTarget[0]).toBe(24000)
    // Year 1 target: 6 months × ($48,000 × 1.025)/12 = $24,600
    expect(result.reserveTarget[1]).toBeCloseTo(24600, 0)
    // Year 2 target: 6 months × ($48,000 × 1.025²)/12 ≈ $25,215
    expect(result.reserveTarget[2]).toBeCloseTo(25215, 0)
  })

  it('cash return compounds on reserve balance', () => {
    const result = computeCashReservePlan({
      ...baseParams,
      initialBalance: 30000,
      annualSavingsArray: [20000, 20000, 20000],
    })
    expect(result.reserveBalance[0]).toBeCloseTo(30600, 0)
    expect(result.reserveBalance[1]).toBeCloseTo(31212, 0)
    expect(result.reserveBalance[2]).toBeCloseTo(31836.24, 0)
  })

  it('zero savings years — reserve does not fill, no negative diversion', () => {
    const result = computeCashReservePlan({
      ...baseParams,
      annualSavingsArray: [0, 0, 20000, 20000],
    })
    expect(result.investedSavings[0]).toBe(0)
    expect(result.investedSavings[1]).toBe(0)
    expect(result.reserveBalance[0]).toBe(0)
    expect(result.reserveBalance[1]).toBe(0)
    expect(result.investedSavings[2]).toBe(0)
    expect(result.reserveBalance[2]).toBe(20000)
  })

  it('partial initial balance — fills remainder from savings', () => {
    const result = computeCashReservePlan({
      ...baseParams,
      initialBalance: 10000,
      annualSavingsArray: [20000, 20000, 20000],
    })
    // Year 0: balance starts at 10000, grows to 10200. Shortfall = 19800. Divert 19800, invest 200.
    expect(result.reserveBalance[0]).toBeCloseTo(30000, 0)
    expect(result.investedSavings[0]).toBeCloseTo(200, 0)
    expect(result.investedSavings[1]).toBe(20000)
  })

  it('empty savings array returns empty arrays', () => {
    const result = computeCashReservePlan({
      ...baseParams,
      annualSavingsArray: [],
    })
    expect(result.investedSavings).toEqual([])
    expect(result.reserveBalance).toEqual([])
    expect(result.reserveTarget).toEqual([])
  })

  it('months mode uses months parameter correctly', () => {
    const result = computeCashReservePlan({
      ...baseParams,
      mode: 'months',
      annualSavingsArray: [50000],
    })
    // 6 months × 48000/12 = 24000
    expect(result.reserveTarget[0]).toBe(24000)
  })
})

describe('computeCashReserveOffset', () => {
  it('returns 0 when disabled', () => {
    expect(computeCashReserveOffset(500000, false, 'fixed', 30000, 6, 48000)).toBe(0)
  })

  it('returns target when liquidNW exceeds target (fixed mode)', () => {
    expect(computeCashReserveOffset(500000, true, 'fixed', 30000, 6, 48000)).toBe(30000)
  })

  it('returns liquidNW when it is less than target', () => {
    expect(computeCashReserveOffset(10000, true, 'fixed', 30000, 6, 48000)).toBe(10000)
  })

  it('computes target from months in months mode', () => {
    // 6 months × 48000/12 = 24000
    expect(computeCashReserveOffset(500000, true, 'months', 0, 6, 48000)).toBe(24000)
  })

  it('returns 0 for negative liquidNW', () => {
    expect(computeCashReserveOffset(-50000, true, 'fixed', 30000, 6, 48000)).toBe(0)
  })
})
