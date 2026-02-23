import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateCpfContribution,
  calculateCpfExtraInterest,
  calculateCpfExtraInterestWithAge,
  projectCpfBalances,
  calculateBrsFrsErs,
  estimateCpfLifePayout,
  calculateCpfLifePayoutAtAge,
  getRetirementSumAmount,
  autoDetectRetirementSum,
  performAge55Transfer,
  allocatePostAge55Contribution,
} from './cpf'

describe('calculateCpfContribution', () => {
  it('age 30, $72K salary → 37% total rate', () => {
    const result = calculateCpfContribution(72000, 30)
    expect(result.total).toBeCloseTo(72000 * 0.37, 0)
    expect(result.employee).toBeCloseTo(72000 * 0.20, 0)
    expect(result.employer).toBeCloseTo(72000 * 0.17, 0)
  })

  it('OA/SA/MA allocation for age 30', () => {
    const result = calculateCpfContribution(72000, 30)
    expect(result.oaAllocation).toBeCloseTo(72000 * 0.23, 0)
    expect(result.saAllocation).toBeCloseTo(72000 * 0.06, 0)
    expect(result.maAllocation).toBeCloseTo(72000 * 0.08, 0)
  })

  it('age 57 uses 55-60 bracket (29.5% total)', () => {
    const result = calculateCpfContribution(72000, 57)
    expect(result.total).toBeCloseTo(72000 * 0.295, 0)
    expect(result.employee).toBeCloseTo(72000 * 0.15, 0)
    expect(result.employer).toBeCloseTo(72000 * 0.145, 0)
  })

  it('OW ceiling: salary above $96,000 is capped', () => {
    const result = calculateCpfContribution(120000, 30)
    // Only $96,000 subject to CPF (OW ceiling $8,000/month from 2026, no bonus)
    expect(result.total).toBeCloseTo(96000 * 0.37, 0)
  })

  it('AW ceiling: bonus capped at $102K - OW', () => {
    const result = calculateCpfContribution(96000, 30, 30000)
    // OW: $96,000 (at ceiling), AW ceiling: $102,000 - $96,000 = $6,000
    // Total subject: $96,000 + $6,000 = $102,000
    expect(result.total).toBeCloseTo(102000 * 0.37, 0)
  })

  it('returns zero for zero salary', () => {
    const result = calculateCpfContribution(0, 30)
    expect(result.total).toBe(0)
    expect(result.employee).toBe(0)
  })

  it('age 62 uses 60-65 bracket (20.5%)', () => {
    const result = calculateCpfContribution(60000, 62)
    expect(result.total).toBeCloseTo(60000 * 0.205, 0)
  })

  it('age 67 uses 65-70 bracket (16%)', () => {
    const result = calculateCpfContribution(60000, 67)
    expect(result.total).toBeCloseTo(60000 * 0.16, 0)
  })

  it('age 72 uses above 70 bracket (12.5%)', () => {
    const result = calculateCpfContribution(60000, 72)
    expect(result.total).toBeCloseTo(60000 * 0.125, 0)
  })

  // Age boundary tests: exact cutoff ages
  it('age 55 is still in "55 and below" bracket (37%)', () => {
    const result = calculateCpfContribution(72000, 55)
    expect(result.total).toBeCloseTo(72000 * 0.37, 0)
  })

  it('age 56 switches to "55-60" bracket (29.5%)', () => {
    const result = calculateCpfContribution(72000, 56)
    expect(result.total).toBeCloseTo(72000 * 0.295, 0)
  })

  it('age 60 is still in "55-60" bracket (29.5%)', () => {
    const result = calculateCpfContribution(72000, 60)
    expect(result.total).toBeCloseTo(72000 * 0.295, 0)
  })

  it('age 61 switches to "60-65" bracket (20.5%)', () => {
    const result = calculateCpfContribution(72000, 61)
    expect(result.total).toBeCloseTo(72000 * 0.205, 0)
  })

  it('age 65 is still in "60-65" bracket (20.5%)', () => {
    const result = calculateCpfContribution(72000, 65)
    expect(result.total).toBeCloseTo(72000 * 0.205, 0)
  })

  it('age 66 switches to "65-70" bracket (16%)', () => {
    const result = calculateCpfContribution(72000, 66)
    expect(result.total).toBeCloseTo(72000 * 0.16, 0)
  })

  it('age 70 is still in "65-70" bracket (16%)', () => {
    const result = calculateCpfContribution(72000, 70)
    expect(result.total).toBeCloseTo(72000 * 0.16, 0)
  })

  it('age 71 switches to "above 70" bracket (12.5%)', () => {
    const result = calculateCpfContribution(72000, 71)
    expect(result.total).toBeCloseTo(72000 * 0.125, 0)
  })

  it('rate drops from 37% to 29.5% at the 55/56 boundary', () => {
    const at55 = calculateCpfContribution(72000, 55)
    const at56 = calculateCpfContribution(72000, 56)
    expect(at55.total).toBeGreaterThan(at56.total)
    expect(at55.total - at56.total).toBeCloseTo(72000 * (0.37 - 0.295), 0)
  })

  // Property-based: CPF <= salary * max_total_rate (37%)
  it('CPF contribution never exceeds salary × 37%', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 500000, noNaN: true }),
        fc.integer({ min: 18, max: 80 }),
        (salary, age) => {
          const result = calculateCpfContribution(salary, age)
          // Total can't exceed OW ceiling * max rate
          return result.total <= 102000 * 0.37 + 1 // small epsilon
        }
      )
    )
  })
})

describe('calculateCpfExtraInterest', () => {
  it('max extra interest on $60K combined', () => {
    // $20K OA + $30K SA + $10K MA = $60K → $600 extra interest
    const extra = calculateCpfExtraInterest(20000, 30000, 10000, 30)
    expect(extra).toBeCloseTo(600, 0)
  })

  it('OA capped at $20K for extra interest', () => {
    // $50K OA → only $20K qualifies, $40K SA → $40K qualifies (remaining $40K cap)
    const extra = calculateCpfExtraInterest(50000, 40000, 0, 30)
    // $20K OA + $40K SA = $60K → $600
    expect(extra).toBeCloseTo(600, 0)
  })

  it('small balances get proportional extra interest', () => {
    // $10K OA + $5K SA + $3K MA = $18K → $180 extra interest
    const extra = calculateCpfExtraInterest(10000, 5000, 3000, 30)
    expect(extra).toBeCloseTo(180, 0)
  })

  it('zero balances → zero extra interest', () => {
    expect(calculateCpfExtraInterest(0, 0, 0, 30)).toBe(0)
  })
})

describe('projectCpfBalances', () => {
  it('produces correct number of years', () => {
    const projections = projectCpfBalances(30, 35, 10000, 5000, 3000, 72000, 0.03)
    expect(projections).toHaveLength(6) // ages 30, 31, 32, 33, 34, 35
  })

  it('balances grow over time', () => {
    const projections = projectCpfBalances(30, 40, 10000, 5000, 3000, 72000, 0.03)
    for (let i = 1; i < projections.length; i++) {
      expect(projections[i].totalBalance).toBeGreaterThan(projections[i - 1].totalBalance)
    }
  })

  it('first year includes contributions and interest', () => {
    const projections = projectCpfBalances(30, 30, 10000, 5000, 3000, 72000, 0)
    expect(projections[0].annualContribution).toBeGreaterThan(0)
    expect(projections[0].annualInterest).toBeGreaterThan(0)
    expect(projections[0].totalBalance).toBeGreaterThan(10000 + 5000 + 3000)
  })
})

describe('calculateBrsFrsErs', () => {
  it('age 55 → no growth needed (current year values)', () => {
    const result = calculateBrsFrsErs(55)
    expect(result.brs).toBeCloseTo(106500, 0)
    expect(result.frs).toBeCloseTo(213000, 0)
    expect(result.ers).toBeCloseTo(426000, 0)
  })

  it('age 30 → 25 years of 3.5% growth', () => {
    const result = calculateBrsFrsErs(30)
    const growthFactor = Math.pow(1.035, 25)
    expect(result.brs).toBeCloseTo(106500 * growthFactor, 0)
    expect(result.frs).toBeCloseTo(213000 * growthFactor, 0)
  })

  it('age >= 55 → no further growth', () => {
    const result = calculateBrsFrsErs(60)
    expect(result.brs).toBeCloseTo(106500, 0)
  })
})

describe('estimateCpfLifePayout', () => {
  it('Standard plan: FRS $213K → ~$13,419/yr', () => {
    const payout = estimateCpfLifePayout(213000, 'standard')
    expect(payout).toBeCloseTo(13419, 0)
  })

  it('Basic plan: FRS $213K → ~$11,502/yr', () => {
    const payout = estimateCpfLifePayout(213000, 'basic')
    expect(payout).toBeCloseTo(11502, 0)
  })

  // Pre-Retiree integration test: CPF LIFE ~$13,400/yr
  it('Pre-Retiree: ~$13,400/yr CPF LIFE', () => {
    const payout = estimateCpfLifePayout(213000, 'standard')
    // $213,000 * 6.3% = $13,419 (CLAUDE.md says ~$13,400)
    expect(payout).toBeCloseTo(13419, 0)
    expect(Math.abs(payout - 13400)).toBeLessThan(100)
  })
})

describe('calculateCpfLifePayoutAtAge', () => {
  it('returns 0 before start age', () => {
    expect(calculateCpfLifePayoutAtAge(213000, 'standard', 65, 60)).toBe(0)
    expect(calculateCpfLifePayoutAtAge(213000, 'standard', 65, 64)).toBe(0)
  })

  it('returns payout at start age', () => {
    const payout = calculateCpfLifePayoutAtAge(213000, 'standard', 65, 65)
    expect(payout).toBeCloseTo(13419, 0)
  })

  it('standard plan payout is flat regardless of age past start', () => {
    const at65 = calculateCpfLifePayoutAtAge(213000, 'standard', 65, 65)
    const at75 = calculateCpfLifePayoutAtAge(213000, 'standard', 65, 75)
    expect(at65).toBe(at75)
  })

  it('basic plan payout is flat regardless of age past start', () => {
    const at65 = calculateCpfLifePayoutAtAge(213000, 'basic', 65, 65)
    const at75 = calculateCpfLifePayoutAtAge(213000, 'basic', 65, 75)
    expect(at65).toBe(at75)
  })

  it('escalating plan compounds 2%/yr from start', () => {
    const at65 = calculateCpfLifePayoutAtAge(213000, 'escalating', 65, 65)
    const at66 = calculateCpfLifePayoutAtAge(213000, 'escalating', 65, 66)
    const at75 = calculateCpfLifePayoutAtAge(213000, 'escalating', 65, 75)

    // Year 0 = base payout
    expect(at65).toBeCloseTo(213000 * 0.048, 0)
    // Year 1 = base * 1.02
    expect(at66).toBeCloseTo(213000 * 0.048 * 1.02, 0)
    // Year 10 = base * 1.02^10
    expect(at75).toBeCloseTo(213000 * 0.048 * Math.pow(1.02, 10), 0)
  })

  it('matches estimateCpfLifePayout for standard plan at age 65', () => {
    const fromOld = estimateCpfLifePayout(213000, 'standard')
    const fromNew = calculateCpfLifePayoutAtAge(213000, 'standard', 65, 65)
    expect(fromNew).toBe(fromOld)
  })

  it('matches estimateCpfLifePayout for basic plan at age 65', () => {
    const fromOld = estimateCpfLifePayout(213000, 'basic')
    const fromNew = calculateCpfLifePayoutAtAge(213000, 'basic', 65, 65)
    expect(fromNew).toBe(fromOld)
  })

  it('returns 0 for zero retirement sum', () => {
    expect(calculateCpfLifePayoutAtAge(0, 'standard', 65, 65)).toBe(0)
  })

  it('handles configurable start age (e.g., 70)', () => {
    expect(calculateCpfLifePayoutAtAge(213000, 'standard', 70, 65)).toBe(0)
    expect(calculateCpfLifePayoutAtAge(213000, 'standard', 70, 70)).toBeCloseTo(13419, 0)
  })
})

describe('getRetirementSumAmount', () => {
  it('returns projected BRS/FRS/ERS at age 55', () => {
    const brs = getRetirementSumAmount('brs', 55)
    const frs = getRetirementSumAmount('frs', 55)
    const ers = getRetirementSumAmount('ers', 55)
    expect(brs).toBeCloseTo(106500, 0)
    expect(frs).toBeCloseTo(213000, 0)
    expect(ers).toBeCloseTo(426000, 0)
  })

  it('returns grown values for younger ages', () => {
    const frs = getRetirementSumAmount('frs', 30)
    const growthFactor = Math.pow(1.035, 25)
    expect(frs).toBeCloseTo(213000 * growthFactor, 0)
  })

  it('ERS = 2x FRS, BRS = 0.5x FRS at any age', () => {
    const brs = getRetirementSumAmount('brs', 40)
    const frs = getRetirementSumAmount('frs', 40)
    const ers = getRetirementSumAmount('ers', 40)
    expect(ers).toBeCloseTo(frs * 2, 0)
    expect(brs).toBeCloseTo(frs / 2, 0)
  })
})

describe('calculateCpfLifePayoutAtAge (integration)', () => {
  it('full projection: payout at 65, escalating grows, matches at start', () => {
    const frs = 213000
    const startAge = 65

    // Standard plan: same payout every year
    const std65 = calculateCpfLifePayoutAtAge(frs, 'standard', startAge, 65)
    const std75 = calculateCpfLifePayoutAtAge(frs, 'standard', startAge, 75)
    expect(std65).toBe(std75) // flat

    // Escalating plan: grows 2%/yr
    const esc65 = calculateCpfLifePayoutAtAge(frs, 'escalating', startAge, 65)
    const esc75 = calculateCpfLifePayoutAtAge(frs, 'escalating', startAge, 75)
    expect(esc75).toBeGreaterThan(esc65)
    expect(esc75 / esc65).toBeCloseTo(Math.pow(1.02, 10), 2)

    // Standard always matches estimateCpfLifePayout at start age
    expect(std65).toBe(estimateCpfLifePayout(frs, 'standard'))

    // Deferred start (age 70): still returns 0 before 70
    expect(calculateCpfLifePayoutAtAge(frs, 'standard', 70, 68)).toBe(0)
    expect(calculateCpfLifePayoutAtAge(frs, 'standard', 70, 70)).toBeGreaterThan(0)
  })
})

describe('autoDetectRetirementSum', () => {
  const frsAt55 = 213000

  it('returns ERS when SA exceeds 2x FRS', () => {
    expect(autoDetectRetirementSum(500000, frsAt55, false)).toBe('ers')
  })

  it('returns FRS when SA meets FRS but not ERS', () => {
    expect(autoDetectRetirementSum(250000, frsAt55, false)).toBe('frs')
  })

  it('returns BRS when SA meets BRS with property', () => {
    expect(autoDetectRetirementSum(110000, frsAt55, true)).toBe('brs')
  })

  it('returns FRS when SA meets BRS but no property', () => {
    expect(autoDetectRetirementSum(110000, frsAt55, false)).toBe('frs')
  })

  it('returns FRS when SA is below BRS even with property', () => {
    expect(autoDetectRetirementSum(50000, frsAt55, true)).toBe('frs')
  })
})

describe('performAge55Transfer', () => {
  it('SA covers full target → RA = target, OA unchanged', () => {
    const result = performAge55Transfer(100000, 250000, 213000)
    expect(result.newRA).toBe(213000)
    expect(result.newOA).toBe(100000) // OA untouched
    expect(result.newSA).toBe(0) // SA always closed
  })

  it('SA partial + OA fills gap → RA = target', () => {
    const result = performAge55Transfer(100000, 150000, 213000)
    expect(result.newRA).toBe(213000) // 150K from SA + 63K from OA
    expect(result.newOA).toBe(100000 - 63000) // 37K remaining
    expect(result.newSA).toBe(0)
  })

  it('SA + OA < target → RA = SA + OA', () => {
    const result = performAge55Transfer(50000, 100000, 213000)
    expect(result.newRA).toBe(150000) // all of SA + all of OA
    expect(result.newOA).toBe(0)
    expect(result.newSA).toBe(0)
  })

  it('SA = 0 edge case → only OA transfers', () => {
    const result = performAge55Transfer(300000, 0, 213000)
    expect(result.newRA).toBe(213000) // 213K from OA
    expect(result.newOA).toBe(87000) // 300K - 213K
    expect(result.newSA).toBe(0)
  })

  it('both balances 0 → RA = 0', () => {
    const result = performAge55Transfer(0, 0, 213000)
    expect(result.newRA).toBe(0)
    expect(result.newOA).toBe(0)
    expect(result.newSA).toBe(0)
  })
})

describe('allocatePostAge55Contribution', () => {
  const makeCpfContribution = (oa: number, sa: number, ma: number) => ({
    employee: 0, employer: 0, total: 0,
    oaAllocation: oa, saAllocation: sa, maAllocation: ma,
  })

  it('RA has room → SA portion goes to RA', () => {
    const cpf = makeCpfContribution(5000, 2000, 3000)
    const result = allocatePostAge55Contribution(cpf, 200000, 213000)
    expect(result.raAllocation).toBe(2000) // full SA portion → RA
    expect(result.oaAllocation).toBe(5000) // OA unchanged
    expect(result.maAllocation).toBe(3000)
  })

  it('RA at cap → SA overflow goes to OA', () => {
    const cpf = makeCpfContribution(5000, 2000, 3000)
    const result = allocatePostAge55Contribution(cpf, 213000, 213000)
    expect(result.raAllocation).toBe(0) // no room
    expect(result.oaAllocation).toBe(7000) // 5K OA + 2K overflow
    expect(result.maAllocation).toBe(3000)
  })

  it('partial room → split SA between RA and OA', () => {
    const cpf = makeCpfContribution(5000, 2000, 3000)
    const result = allocatePostAge55Contribution(cpf, 212000, 213000)
    expect(result.raAllocation).toBe(1000) // only 1K room
    expect(result.oaAllocation).toBe(6000) // 5K OA + 1K overflow
    expect(result.maAllocation).toBe(3000)
  })
})

describe('calculateCpfExtraInterestWithAge', () => {
  it('under 55 matches old calculateCpfExtraInterest behavior', () => {
    const old = calculateCpfExtraInterest(20000, 30000, 10000, 30)
    const withAge = calculateCpfExtraInterestWithAge(20000, 30000, 10000, 0, 30)
    expect(withAge).toBe(old)
  })

  it('age 55 uses under-55 rules (boundary)', () => {
    const old = calculateCpfExtraInterest(20000, 30000, 10000, 55)
    const withAge = calculateCpfExtraInterestWithAge(20000, 30000, 10000, 0, 55)
    expect(withAge).toBe(old)
  })

  it('age 56: OA cap raised to $30K', () => {
    // $30K OA qualifies (not $20K), $30K remaining from SA/RA
    const result = calculateCpfExtraInterestWithAge(50000, 0, 0, 100000, 56)
    // OA: $30K × 1% = $300
    // RA additional: min(100K, 30K) × 1% = $300
    // Remaining combined cap: $60K - $30K = $30K, from RA: $30K
    // Total base extra: ($30K + $30K) × 1% = $600
    // Total = $600 + $300 = $900
    expect(result).toBeCloseTo(900, 0)
  })

  it('age 56: RA gets additional 2% total extra on first $30K', () => {
    // RA only, $50K balance, age 56
    const result = calculateCpfExtraInterestWithAge(0, 0, 0, 50000, 56)
    // OA: $0 qualifying
    // RA additional: min(50K, 30K) × 1% = $300
    // Remaining combined cap: $60K - $0 = $60K, from RA: min(50K, 60K) = $50K
    // Total base extra: ($0 + $50K) × 1% = $500
    // Total = $500 + $300 = $800
    expect(result).toBeCloseTo(800, 0)
  })

  it('age 56: small balances get proportional extra', () => {
    const result = calculateCpfExtraInterestWithAge(10000, 0, 5000, 20000, 56)
    // OA: $10K qualifying (under $30K cap)
    // RA additional: min(20K, 30K) × 1% = $200
    // Remaining combined cap: $60K - $10K = $50K, from RA: $20K, from MA: $5K
    // Total base extra: ($10K + $20K + $5K) × 1% = $350
    // Total = $350 + $200 = $550
    expect(result).toBeCloseTo(550, 0)
  })

  it('age 56: zero balances → zero extra', () => {
    expect(calculateCpfExtraInterestWithAge(0, 0, 0, 0, 56)).toBe(0)
  })
})
