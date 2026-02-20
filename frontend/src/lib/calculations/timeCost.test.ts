import { describe, it, expect } from 'vitest'
import { calculateOneTimeCost, calculateRecurringCost, type TimeCostBaseInput } from './timeCost'

const baseInput: TimeCostBaseInput = {
  annualExpenses: 48000,
  annualIncome: 72000,
  liquidNetWorth: 100000,
  cpfTotal: 50000,
  swr: 0.04,
  netRealReturn: 0.044,
  retirementAge: 55,
  currentAge: 30,
}

describe('calculateOneTimeCost', () => {
  it('returns zeros when amount <= 0', () => {
    expect(calculateOneTimeCost(baseInput, 0)).toEqual({
      delayYears: 0, delayMonths: 0, opportunityCost: 0,
    })
    expect(calculateOneTimeCost(baseInput, -5000)).toEqual({
      delayYears: 0, delayMonths: 0, opportunityCost: 0,
    })
  })

  it('$50K one-time cost delays FIRE', () => {
    const result = calculateOneTimeCost(baseInput, 50000)
    expect(result.delayYears).toBeGreaterThan(0)
    expect(result.opportunityCost).toBeGreaterThan(50000) // grows over time
  })

  it('opportunity cost grows by compound return', () => {
    const result = calculateOneTimeCost(baseInput, 50000)
    const yearsToRetirement = baseInput.retirementAge - baseInput.currentAge
    const expected = 50000 * Math.pow(1 + baseInput.netRealReturn, yearsToRetirement)
    expect(result.opportunityCost).toBeCloseTo(expected, 0)
  })

  it('handles amount greater than net worth', () => {
    const result = calculateOneTimeCost(baseInput, 200000)
    // Should handle gracefully — NW goes negative
    expect(result.delayYears).toBeGreaterThan(0)
  })

  it('returns Infinity delay when cost makes FIRE unreachable', () => {
    // Very low savings, huge cost
    const input: TimeCostBaseInput = {
      ...baseInput,
      annualIncome: 50000,
      annualExpenses: 49000,
      liquidNetWorth: 0,
      cpfTotal: 0,
    }
    // FIRE number = 49000/0.04 = 1,225,000. Savings = 1000/yr.
    // Giant cost makes NW deeply negative
    const result = calculateOneTimeCost(input, 500000)
    expect(result.delayYears).toBe(Infinity)
  })

  it('delay is 0 when base FIRE is already unreachable', () => {
    // If savings rate is negative, base years is already Infinity
    const input: TimeCostBaseInput = {
      ...baseInput,
      annualIncome: 30000,
      annualExpenses: 48000, // negative savings
      liquidNetWorth: 0,
      cpfTotal: 0,
    }
    const result = calculateOneTimeCost(input, 10000)
    expect(result.delayYears).toBe(0)
  })

  it('delayMonths is between 0 and 11', () => {
    const result = calculateOneTimeCost(baseInput, 25000)
    expect(result.delayMonths).toBeGreaterThanOrEqual(0)
    expect(result.delayMonths).toBeLessThan(12)
  })
})

describe('calculateRecurringCost', () => {
  it('returns zeros when monthlyAmount <= 0', () => {
    expect(calculateRecurringCost(baseInput, 0)).toEqual({
      delayYears: 0, delayMonths: 0, newFireNumber: 0, annualCost: 0,
    })
    expect(calculateRecurringCost(baseInput, -100)).toEqual({
      delayYears: 0, delayMonths: 0, newFireNumber: 0, annualCost: 0,
    })
  })

  it('$500/mo recurring cost delays FIRE and increases FIRE number', () => {
    const result = calculateRecurringCost(baseInput, 500)
    expect(result.delayYears).toBeGreaterThan(0)
    expect(result.annualCost).toBe(6000)
    // New FIRE number = (48000 + 6000) / 0.04 = 1,350,000
    expect(result.newFireNumber).toBe(1350000)
  })

  it('annualCost is monthlyAmount * 12', () => {
    const result = calculateRecurringCost(baseInput, 1000)
    expect(result.annualCost).toBe(12000)
  })

  it('newFireNumber reflects increased expenses', () => {
    const result = calculateRecurringCost(baseInput, 2000)
    const expectedFireNumber = (baseInput.annualExpenses + 24000) / baseInput.swr
    expect(result.newFireNumber).toBe(expectedFireNumber)
  })

  it('returns Infinity when recurring cost makes FIRE unreachable', () => {
    // If new savings become negative enough
    const input: TimeCostBaseInput = {
      ...baseInput,
      annualIncome: 50000,
      annualExpenses: 48000,
      liquidNetWorth: 0,
      cpfTotal: 0,
    }
    // Savings = 2000/yr. Adding $500/mo = $6000/yr cost → savings = -4000
    const result = calculateRecurringCost(input, 500)
    expect(result.delayYears).toBe(Infinity)
  })

  it('delayMonths is between 0 and 11', () => {
    const result = calculateRecurringCost(baseInput, 300)
    expect(result.delayMonths).toBeGreaterThanOrEqual(0)
    expect(result.delayMonths).toBeLessThan(12)
  })
})
