import { describe, it, expect } from 'vitest'
import {
  projectSrsBalance,
  computeSrsDrawdownSchedule,
  computeSrsEarlyPenalty,
  compareSrsVsRstu,
} from './srs'

describe('projectSrsBalance', () => {
  it('projects balance with contributions and investment returns', () => {
    const result = projectSrsBalance({
      currentBalance: 100000,
      annualContribution: 15300,
      investmentReturn: 0.04,
      years: 5,
      contributionCap: 15300,
    })
    expect(result).toHaveLength(5)
    // Year 1: (100000 + 15300) * 1.04 = 119912
    expect(result[0].balance).toBeCloseTo(119912, 0)
    // Each year should be higher than the last
    for (let i = 1; i < result.length; i++) {
      expect(result[i].balance).toBeGreaterThan(result[i - 1].balance)
    }
  })

  it('caps contributions at the cap', () => {
    const result = projectSrsBalance({
      currentBalance: 0,
      annualContribution: 50000, // exceeds cap
      investmentReturn: 0,
      years: 1,
      contributionCap: 15300,
    })
    expect(result[0].contribution).toBe(15300)
    expect(result[0].balance).toBe(15300)
  })

  it('handles zero contribution', () => {
    const result = projectSrsBalance({
      currentBalance: 100000,
      annualContribution: 0,
      investmentReturn: 0.04,
      years: 3,
      contributionCap: 15300,
    })
    expect(result[0].balance).toBeCloseTo(104000, 0)
    expect(result[2].balance).toBeCloseTo(112486, 0) // 100000 * 1.04^3
  })
})

describe('computeSrsDrawdownSchedule', () => {
  it('spreads balance equally over 10 years', () => {
    const result = computeSrsDrawdownSchedule({
      balance: 200000,
      startAge: 63,
      durationYears: 10,
    })
    expect(result).toHaveLength(10)
    expect(result[0].age).toBe(63)
    expect(result[0].withdrawal).toBe(20000)
    expect(result[0].taxableAmount).toBe(10000) // 50% concession
    expect(result[9].age).toBe(72)
    expect(result[9].remainingBalance).toBe(0)
  })

  it('applies 50% tax concession on every withdrawal', () => {
    const result = computeSrsDrawdownSchedule({
      balance: 100000,
      startAge: 63,
      durationYears: 10,
    })
    result.forEach((row) => {
      expect(row.taxableAmount).toBe(row.withdrawal * 0.5)
    })
  })

  it('handles custom start age and duration', () => {
    const result = computeSrsDrawdownSchedule({
      balance: 50000,
      startAge: 65,
      durationYears: 5,
    })
    expect(result).toHaveLength(5)
    expect(result[0].age).toBe(65)
    expect(result[0].withdrawal).toBe(10000)
    expect(result[4].age).toBe(69)
  })
})

describe('computeSrsEarlyPenalty', () => {
  it('applies 5% penalty and full taxable amount', () => {
    const result = computeSrsEarlyPenalty(100000)
    expect(result.penalty).toBe(5000)
    expect(result.taxableAmount).toBe(100000) // no 50% concession
  })
})

describe('compareSrsVsRstu', () => {
  it('computes directional comparison', () => {
    const result = compareSrsVsRstu({
      currentIncome: 120000,
      currentMarginalRate: 0.15,
      amount: 15300,
    })
    // SRS: saves 15300 * 0.15 = 2295 now, pays 15300 * 0.5 * 0.02 = 153 later
    expect(result.srsNetBenefit).toBeCloseTo(2295 - 153, 0)
    // RSTU: saves 15300 * 0.15 = 2295, no withdrawal tax
    expect(result.rstuNetBenefit).toBeCloseTo(2295, 0)
    expect(result.recommendation).toBeTruthy()
  })
})
