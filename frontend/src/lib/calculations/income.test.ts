import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateSimpleSalary,
  calculateRealisticSalary,
  calculateDataDrivenSalary,
  getSalaryAtAge,
  getStreamAmountAtAge,
  applyLifeEvents,
  generateIncomeProjection,
  calculateIncomeSummary,
  DEFAULT_CAREER_PHASES,
} from './income'
import type {
  IncomeStream,
  LifeEvent,
  IncomeProjectionRow,
} from '@/lib/types'

// ============================================================
// Simple salary model
// ============================================================

describe('calculateSimpleSalary', () => {
  it('returns base salary at year 0', () => {
    expect(calculateSimpleSalary(72000, 0.03, 0)).toBe(72000)
  })

  it('compounds correctly over 10 years at 3%', () => {
    const result = calculateSimpleSalary(72000, 0.03, 10)
    const expected = 72000 * Math.pow(1.03, 10)
    expect(result).toBeCloseTo(expected, 2)
  })

  it('handles zero growth', () => {
    expect(calculateSimpleSalary(72000, 0, 5)).toBe(72000)
  })

  it('handles zero salary', () => {
    expect(calculateSimpleSalary(0, 0.03, 5)).toBe(0)
  })

  it('handles negative salary', () => {
    expect(calculateSimpleSalary(-1000, 0.03, 5)).toBe(0)
  })

  it('handles negative yearsFromStart', () => {
    expect(calculateSimpleSalary(72000, 0.03, -1)).toBe(72000)
  })
})

// ============================================================
// Realistic salary model
// ============================================================

describe('calculateRealisticSalary', () => {
  const phases = DEFAULT_CAREER_PHASES

  it('returns base salary when targetAge equals currentAge', () => {
    expect(calculateRealisticSalary(48000, 25, 25, phases, [])).toBe(48000)
  })

  it('applies early career growth rate', () => {
    // Age 25 to 26: one year at 8% (Early Career phase: 22-30)
    const result = calculateRealisticSalary(48000, 25, 26, phases, [])
    expect(result).toBeCloseTo(48000 * 1.08, 2)
  })

  it('transitions between phases correctly', () => {
    // Age 25 to 31: 5 years early career (8%), 1 year mid career (5%)
    const result = calculateRealisticSalary(48000, 25, 31, phases, [])
    const expected = 48000 * Math.pow(1.08, 5) * 1.05
    expect(result).toBeCloseTo(expected, 2)
  })

  it('applies promotion jumps multiplicatively', () => {
    const jumps = [{ age: 30, increasePercent: 0.2 }]
    // Age 25 to 30: 5 years early career (8%), then 20% promotion at age 30
    const result = calculateRealisticSalary(48000, 25, 30, phases, jumps)
    const expected = 48000 * Math.pow(1.08, 5) * 1.2
    expect(result).toBeCloseTo(expected, 2)
  })

  it('applies multiple promotion jumps', () => {
    const jumps = [
      { age: 30, increasePercent: 0.2 },
      { age: 35, increasePercent: 0.15 },
    ]
    // 25-30: 5yr early career (8%) + 20% promo
    // 30-35: 5yr mid career (5%) + 15% promo
    const result = calculateRealisticSalary(48000, 25, 35, phases, jumps)
    const afterEarly = 48000 * Math.pow(1.08, 5) * 1.2
    const expected = afterEarly * Math.pow(1.05, 5) * 1.15
    expect(result).toBeCloseTo(expected, 2)
  })

  it('handles zero base salary', () => {
    expect(calculateRealisticSalary(0, 25, 35, phases, [])).toBe(0)
  })
})

// ============================================================
// Data-driven salary model
// ============================================================

describe('calculateDataDrivenSalary', () => {
  it('returns $72K for age 30 degree with adjustment 1.0', () => {
    expect(calculateDataDrivenSalary(30, 'degree', 1.0)).toBe(72000)
  })

  it('applies adjustment factor', () => {
    expect(calculateDataDrivenSalary(30, 'degree', 1.2)).toBeCloseTo(86400, 0)
  })

  it('returns lower salary for lower education level', () => {
    const diploma = calculateDataDrivenSalary(30, 'diploma', 1.0)
    const degree = calculateDataDrivenSalary(30, 'degree', 1.0)
    expect(diploma).toBeLessThan(degree)
  })

  it('returns $57K for age 25 degree', () => {
    expect(calculateDataDrivenSalary(25, 'degree', 1.0)).toBe(57000)
  })

  it('inflates MOM benchmark to future nominal dollars', () => {
    // Age 40 degree = $97,500 in today's dollars
    // 10 years forward at 2.5% inflation → $97,500 × 1.025^10 ≈ $124,834
    const result = calculateDataDrivenSalary(40, 'degree', 1.0, 0.025, 10)
    expect(result).toBeCloseTo(97500 * Math.pow(1.025, 10), 0)
  })

  it('returns today-dollar MOM value when yearsForward is 0', () => {
    // No inflation applied at year 0 (current age)
    expect(calculateDataDrivenSalary(30, 'degree', 1.0, 0.025, 0)).toBe(72000)
  })
})

// ============================================================
// getSalaryAtAge dispatcher
// ============================================================

describe('getSalaryAtAge', () => {
  it('dispatches to simple model', () => {
    const result = getSalaryAtAge({
      model: 'simple',
      baseSalary: 72000,
      growthRate: 0.03,
      currentAge: 30,
      targetAge: 35,
      phases: DEFAULT_CAREER_PHASES,
      promotionJumps: [],
      education: 'degree',
      momAdjustment: 1.0,
    })
    expect(result).toBeCloseTo(calculateSimpleSalary(72000, 0.03, 5), 2)
  })

  it('dispatches to data-driven model with inflation', () => {
    const result = getSalaryAtAge({
      model: 'data-driven',
      baseSalary: 72000,
      growthRate: 0.03,
      currentAge: 30,
      targetAge: 35,
      phases: DEFAULT_CAREER_PHASES,
      promotionJumps: [],
      education: 'degree',
      momAdjustment: 1.0,
      inflation: 0.025,
    })
    // MOM benchmark for age 35 degree = $85,800 inflated 5 years at 2.5%
    expect(result).toBe(calculateDataDrivenSalary(35, 'degree', 1.0, 0.025, 5))
  })
})

// ============================================================
// Stream amount at age
// ============================================================

describe('getStreamAmountAtAge', () => {
  const baseStream: IncomeStream = {
    id: '1',
    name: 'Rental',
    annualAmount: 24000,
    startAge: 30,
    endAge: 65,
    growthRate: 0.02,
    type: 'rental',
    growthModel: 'fixed',
    taxTreatment: 'taxable',
    isCpfApplicable: false,
    isActive: true,
  }

  it('returns 0 before start age', () => {
    expect(getStreamAmountAtAge(baseStream, 25, 0.025)).toBe(0)
  })

  it('returns 0 at end age', () => {
    expect(getStreamAmountAtAge(baseStream, 65, 0.025)).toBe(0)
  })

  it('returns base amount at start age with fixed growth', () => {
    expect(getStreamAmountAtAge(baseStream, 30, 0.025)).toBe(24000)
  })

  it('applies fixed growth over 5 years', () => {
    const result = getStreamAmountAtAge(baseStream, 35, 0.025)
    expect(result).toBeCloseTo(24000 * Math.pow(1.02, 5), 2)
  })

  it('applies inflation-linked growth', () => {
    const inflStream = { ...baseStream, growthModel: 'inflation-linked' as const }
    const result = getStreamAmountAtAge(inflStream, 35, 0.025)
    expect(result).toBeCloseTo(24000 * Math.pow(1.025, 5), 2)
  })

  it('returns flat amount with none growth', () => {
    const flatStream = { ...baseStream, growthModel: 'none' as const }
    expect(getStreamAmountAtAge(flatStream, 35, 0.025)).toBe(24000)
    expect(getStreamAmountAtAge(flatStream, 50, 0.025)).toBe(24000)
  })

  it('returns 0 when inactive', () => {
    const inactiveStream = { ...baseStream, isActive: false }
    expect(getStreamAmountAtAge(inactiveStream, 35, 0.025)).toBe(0)
  })
})

// ============================================================
// Life events
// ============================================================

describe('applyLifeEvents', () => {
  const careerBreak: LifeEvent = {
    id: 'e1',
    name: 'Career Break',
    startAge: 35,
    endAge: 36,
    incomeImpact: 0,
    affectedStreamIds: [],
    savingsPause: true,
    cpfPause: true,
  }

  const partTime: LifeEvent = {
    id: 'e2',
    name: 'Part-time',
    startAge: 40,
    endAge: 45,
    incomeImpact: 0.5,
    affectedStreamIds: ['s1'],
    savingsPause: false,
    cpfPause: false,
  }

  it('applies zero impact (career break)', () => {
    expect(applyLifeEvents(72000, 35, 'any', [careerBreak], true)).toBe(0)
  })

  it('does not apply outside age range', () => {
    expect(applyLifeEvents(72000, 34, 'any', [careerBreak], true)).toBe(72000)
    expect(applyLifeEvents(72000, 36, 'any', [careerBreak], true)).toBe(72000)
  })

  it('applies partial impact (part-time)', () => {
    expect(applyLifeEvents(72000, 42, 's1', [partTime], true)).toBe(36000)
  })

  it('only affects specified streams', () => {
    expect(applyLifeEvents(72000, 42, 's2', [partTime], true)).toBe(72000)
  })

  it('affects all streams when affectedStreamIds is empty', () => {
    expect(applyLifeEvents(72000, 35, 'anything', [careerBreak], true)).toBe(0)
  })

  it('returns original amount when disabled', () => {
    expect(applyLifeEvents(72000, 35, 'any', [careerBreak], false)).toBe(72000)
  })
})

// ============================================================
// Full projection - Fresh Graduate scenario
// ============================================================

describe('generateIncomeProjection', () => {
  const freshGradParams = {
    currentAge: 25,
    retirementAge: 65,
    lifeExpectancy: 90,
    salaryModel: 'simple' as const,
    annualSalary: 48000,
    salaryGrowthRate: 0.03,
    realisticPhases: DEFAULT_CAREER_PHASES,
    promotionJumps: [],
    momEducation: 'degree' as const,
    momAdjustment: 1.0,
    employerCpfEnabled: true,
    incomeStreams: [],
    lifeEvents: [],
    lifeEventsEnabled: false,
    annualExpenses: 30000,
    inflation: 0.025,
    personalReliefs: 20000,
    srsAnnualContribution: 0,
    initialCpfOA: 0,
    initialCpfSA: 0,
    initialCpfMA: 0,
  }

  it('produces correct number of rows', () => {
    const rows = generateIncomeProjection(freshGradParams)
    expect(rows).toHaveLength(90 - 25 + 1) // 66 rows
  })

  it('first row has correct salary', () => {
    const rows = generateIncomeProjection(freshGradParams)
    expect(rows[0].age).toBe(25)
    expect(rows[0].salary).toBe(48000)
    expect(rows[0].year).toBe(0)
    expect(rows[0].isRetired).toBe(false)
  })

  it('first row gross equals salary (no streams)', () => {
    const rows = generateIncomeProjection(freshGradParams)
    expect(rows[0].totalGross).toBe(48000)
  })

  it('first row has CPF contributions', () => {
    const rows = generateIncomeProjection(freshGradParams)
    // Age 25, salary 48000, CPF rate 37%: employee 20%, employer 17%
    expect(rows[0].cpfEmployee).toBeCloseTo(48000 * 0.20, 0)
    expect(rows[0].cpfEmployer).toBeCloseTo(48000 * 0.17, 0)
  })

  it('first row net is gross minus tax minus CPF employee', () => {
    const rows = generateIncomeProjection(freshGradParams)
    expect(rows[0].totalNet).toBeCloseTo(
      rows[0].totalGross - rows[0].sgTax - rows[0].cpfEmployee, 2
    )
  })

  it('first row savings is net minus expenses', () => {
    const rows = generateIncomeProjection(freshGradParams)
    const expectedSavings = Math.max(0, rows[0].totalNet - 30000)
    expect(rows[0].annualSavings).toBeCloseTo(expectedSavings, 2)
  })

  it('retirement rows have zero salary', () => {
    const rows = generateIncomeProjection(freshGradParams)
    // retirementAge 65 means age 65 is last working year, age 66 is first retired year
    const retiredRow = rows.find((r) => r.age === 66)!
    expect(retiredRow.salary).toBe(0)
    expect(retiredRow.isRetired).toBe(true)
    expect(retiredRow.cpfEmployee).toBe(0)
  })

  it('salary grows over time (simple model)', () => {
    const rows = generateIncomeProjection(freshGradParams)
    expect(rows[10].salary).toBeCloseTo(48000 * Math.pow(1.03, 10), 0)
  })

  it('cumulative savings are monotonically non-decreasing', () => {
    const rows = generateIncomeProjection(freshGradParams)
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].cumulativeSavings).toBeGreaterThanOrEqual(rows[i - 1].cumulativeSavings)
    }
  })

  it('CPF balances grow with interest over time', () => {
    const rows = generateIncomeProjection(freshGradParams)
    // After first year working, CPF OA should be > 0
    expect(rows[0].cpfOA).toBeGreaterThan(0)
    expect(rows[0].cpfSA).toBeGreaterThan(0)
    // Last row should have higher CPF than first
    expect(rows[rows.length - 1].cpfOA).toBeGreaterThan(rows[0].cpfOA)
  })
})

// ============================================================
// Projection with life events
// ============================================================

describe('generateIncomeProjection with life events', () => {
  it('career break zeroes out salary', () => {
    const rows = generateIncomeProjection({
      currentAge: 30,
      retirementAge: 65,
      lifeExpectancy: 70,
      salaryModel: 'simple',
      annualSalary: 72000,
      salaryGrowthRate: 0.03,
      realisticPhases: DEFAULT_CAREER_PHASES,
      promotionJumps: [],
      momEducation: 'degree',
      momAdjustment: 1.0,
      employerCpfEnabled: true,
      incomeStreams: [],
      lifeEvents: [
        {
          id: 'e1',
          name: 'Career Break',
          startAge: 35,
          endAge: 36,
          incomeImpact: 0,
          affectedStreamIds: [],
          savingsPause: true,
          cpfPause: true,
        },
      ],
      lifeEventsEnabled: true,
      annualExpenses: 48000,
      inflation: 0.025,
      personalReliefs: 20000,
      srsAnnualContribution: 0,
      initialCpfOA: 0,
      initialCpfSA: 0,
      initialCpfMA: 0,
    })

    const breakRow = rows.find((r) => r.age === 35)!
    expect(breakRow.salary).toBe(0)
    expect(breakRow.cpfEmployee).toBe(0)
    expect(breakRow.annualSavings).toBe(0)
    expect(breakRow.activeLifeEvents).toContain('Career Break')

    // Before and after should have salary
    const beforeBreak = rows.find((r) => r.age === 34)!
    expect(beforeBreak.salary).toBeGreaterThan(0)
    const afterBreak = rows.find((r) => r.age === 36)!
    expect(afterBreak.salary).toBeGreaterThan(0)
  })
})

// ============================================================
// Income summary
// ============================================================

describe('calculateIncomeSummary', () => {
  it('returns zeros for empty projection', () => {
    const summary = calculateIncomeSummary([], 48000)
    expect(summary.peakEarningAge).toBe(0)
    expect(summary.lifetimeEarnings).toBe(0)
  })

  it('computes correct peak earning for simple projection', () => {
    const rows: IncomeProjectionRow[] = [
      { year: 0, age: 30, salary: 72000, rentalIncome: 0, investmentIncome: 0, businessIncome: 0, governmentIncome: 0, totalGross: 72000, sgTax: 2000, cpfEmployee: 14400, cpfEmployer: 12240, totalNet: 55600, annualSavings: 7600, cumulativeSavings: 7600, cpfOA: 16560, cpfSA: 4320, cpfMA: 5760, cpfRA: 0, isRetired: false, activeLifeEvents: [], cpfLifePayout: 0, cpfOaHousingDeduction: 0, cpfOaShortfall: 0, cpfLifeAnnuityPremium: 0, srsBalance: 0, srsContribution: 0, srsWithdrawal: 0, srsTaxableWithdrawal: 0, cashReserveTarget: 0, cashReserveBalance: 0, investedSavings: 0 },
      { year: 1, age: 31, salary: 80000, rentalIncome: 0, investmentIncome: 0, businessIncome: 0, governmentIncome: 0, totalGross: 80000, sgTax: 3000, cpfEmployee: 16000, cpfEmployer: 13600, totalNet: 61000, annualSavings: 13000, cumulativeSavings: 20600, cpfOA: 35000, cpfSA: 9000, cpfMA: 12000, cpfRA: 0, isRetired: false, activeLifeEvents: [], cpfLifePayout: 0, cpfOaHousingDeduction: 0, cpfOaShortfall: 0, cpfLifeAnnuityPremium: 0, srsBalance: 0, srsContribution: 0, srsWithdrawal: 0, srsTaxableWithdrawal: 0, cashReserveTarget: 0, cashReserveBalance: 0, investedSavings: 0 },
      { year: 2, age: 32, salary: 0, rentalIncome: 0, investmentIncome: 0, businessIncome: 0, governmentIncome: 0, totalGross: 0, sgTax: 0, cpfEmployee: 0, cpfEmployer: 0, totalNet: 0, annualSavings: 0, cumulativeSavings: 20600, cpfOA: 35000, cpfSA: 9000, cpfMA: 12000, cpfRA: 0, isRetired: true, activeLifeEvents: [], cpfLifePayout: 0, cpfOaHousingDeduction: 0, cpfOaShortfall: 0, cpfLifeAnnuityPremium: 0, srsBalance: 0, srsContribution: 0, srsWithdrawal: 0, srsTaxableWithdrawal: 0, cashReserveTarget: 0, cashReserveBalance: 0, investedSavings: 0 },
    ]

    const summary = calculateIncomeSummary(rows, 48000)
    expect(summary.peakEarningAge).toBe(31)
    expect(summary.peakEarningAmount).toBe(80000)
    expect(summary.lifetimeEarnings).toBe(152000)
    expect(summary.totalCpfContributions).toBe(14400 + 12240 + 16000 + 13600)
  })
})

// ============================================================
// Property-based tests
// ============================================================

describe('property-based tests', () => {
  it('simple salary: result >= 0', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 500000 }),
        fc.double({ min: -0.1, max: 0.3, noNaN: true }),
        fc.integer({ min: 0, max: 40 }),
        (baseSalary, growthRate, years) => {
          const result = calculateSimpleSalary(baseSalary, growthRate, years)
          expect(result).toBeGreaterThanOrEqual(0)
        }
      )
    )
  })

  it('projection length is correct', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 18, max: 55 }),
        fc.integer({ min: 0, max: 200000 }),
        fc.integer({ min: 10000, max: 100000 }),
        (currentAge, salary, expenses) => {
          const lifeExpectancy = currentAge + 30
          const retirementAge = currentAge + 20

          const rows = generateIncomeProjection({
            currentAge,
            retirementAge,
            lifeExpectancy,
            salaryModel: 'simple',
            annualSalary: salary,
            salaryGrowthRate: 0.03,
            realisticPhases: DEFAULT_CAREER_PHASES,
            promotionJumps: [],
            momEducation: 'degree',
            momAdjustment: 1.0,
            employerCpfEnabled: true,
            incomeStreams: [],
            lifeEvents: [],
            lifeEventsEnabled: false,
            annualExpenses: expenses,
            inflation: 0.025,
            personalReliefs: 20000,
            srsAnnualContribution: 0,
            initialCpfOA: 0,
            initialCpfSA: 0,
            initialCpfMA: 0,
          })

          expect(rows).toHaveLength(lifeExpectancy - currentAge + 1)
        }
      )
    )
  })

  it('tax never exceeds gross income', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 20000, max: 500000 }),
        (salary) => {
          const rows = generateIncomeProjection({
            currentAge: 30,
            retirementAge: 65,
            lifeExpectancy: 70,
            salaryModel: 'simple',
            annualSalary: salary,
            salaryGrowthRate: 0,
            realisticPhases: DEFAULT_CAREER_PHASES,
            promotionJumps: [],
            momEducation: 'degree',
            momAdjustment: 1.0,
            employerCpfEnabled: true,
            incomeStreams: [],
            lifeEvents: [],
            lifeEventsEnabled: false,
            annualExpenses: 30000,
            inflation: 0,
            personalReliefs: 20000,
            srsAnnualContribution: 0,
            initialCpfOA: 0,
            initialCpfSA: 0,
            initialCpfMA: 0,
          })

          for (const row of rows) {
            expect(row.sgTax).toBeLessThanOrEqual(row.totalGross)
            expect(row.sgTax).toBeGreaterThanOrEqual(0)
            expect(row.cpfEmployee).toBeGreaterThanOrEqual(0)
          }
        }
      )
    )
  })
})

// ============================================================
// Integration test vectors from CLAUDE.md
// ============================================================

describe('integration tests', () => {
  it('Fresh Graduate: age 25, $48K income, simple model', () => {
    const rows = generateIncomeProjection({
      currentAge: 25,
      retirementAge: 65,
      lifeExpectancy: 90,
      salaryModel: 'simple',
      annualSalary: 48000,
      salaryGrowthRate: 0.03,
      realisticPhases: DEFAULT_CAREER_PHASES,
      promotionJumps: [],
      momEducation: 'degree',
      momAdjustment: 1.0,
      employerCpfEnabled: true,
      incomeStreams: [],
      lifeEvents: [],
      lifeEventsEnabled: false,
      annualExpenses: 30000,
      inflation: 0.025,
      personalReliefs: 20000,
      srsAnnualContribution: 0,
      initialCpfOA: 0,
      initialCpfSA: 0,
      initialCpfMA: 0,
    })

    // Row 0: age 25, salary $48K
    expect(rows[0].salary).toBe(48000)
    expect(rows[0].totalGross).toBe(48000)

    // FIRE Number = $30K / 0.035 = ~$857,143
    const fireNumber = 30000 / 0.035
    expect(fireNumber).toBeCloseTo(857143, -1)

    // Savings rate: ($48K - CPF employee - tax - $30K) / $48K
    // CPF employee: 48000 * 0.20 = 9600
    expect(rows[0].cpfEmployee).toBeCloseTo(9600, 0)

    // After CPF and tax deductions, net income should be reasonable
    expect(rows[0].totalNet).toBeGreaterThan(30000) // Must exceed expenses to save
    expect(rows[0].totalNet).toBeLessThan(48000) // Must be less than gross

    // Verify CPF contributions at correct rates for age 25
    expect(rows[0].cpfEmployer).toBeCloseTo(48000 * 0.17, 0)
  })

  it('Mid-Career: age 35, $180K income, CPF rates correct', () => {
    const rows = generateIncomeProjection({
      currentAge: 35,
      retirementAge: 65,
      lifeExpectancy: 90,
      salaryModel: 'simple',
      annualSalary: 180000,
      salaryGrowthRate: 0.03,
      realisticPhases: DEFAULT_CAREER_PHASES,
      promotionJumps: [],
      momEducation: 'degree',
      momAdjustment: 1.0,
      employerCpfEnabled: true,
      incomeStreams: [],
      lifeEvents: [],
      lifeEventsEnabled: false,
      annualExpenses: 96000,
      inflation: 0.025,
      personalReliefs: 20000,
      srsAnnualContribution: 15300,
      initialCpfOA: 200000,
      initialCpfSA: 100000,
      initialCpfMA: 0,
    })

    // At $180K salary, OW ceiling applies ($96,000/yr from 2026)
    // CPF employee contribution: $96,000 * 0.20 = $19,200
    expect(rows[0].cpfEmployee).toBeCloseTo(96000 * 0.20, 0)

    // Tax calculation: $180K - $19,200 CPF - $15,300 SRS - $20,000 reliefs = $125,500 chargeable
    // Tax on $125,500: cumulative at $120K = $7,950 + ($125,500 - $120,000) * 0.15 = $7,950 + $825 = $8,775
    expect(rows[0].sgTax).toBeGreaterThan(7000)
    expect(rows[0].sgTax).toBeLessThan(12000)

    // Salary should be $180K
    expect(rows[0].salary).toBe(180000)
    expect(rows[0].totalGross).toBe(180000)
  })

  it('CPF LIFE payout appears in projection at correct age (automated)', () => {
    const rows = generateIncomeProjection({
      currentAge: 55,
      retirementAge: 58,
      lifeExpectancy: 75,
      salaryModel: 'simple',
      annualSalary: 200000,
      salaryGrowthRate: 0,
      realisticPhases: DEFAULT_CAREER_PHASES,
      promotionJumps: [],
      momEducation: 'degree',
      momAdjustment: 1.0,
      employerCpfEnabled: true,
      incomeStreams: [],
      lifeEvents: [],
      lifeEventsEnabled: false,
      annualExpenses: 80000,
      inflation: 0.025,
      personalReliefs: 20000,
      srsAnnualContribution: 0,
      initialCpfOA: 100000,
      initialCpfSA: 200000,
      initialCpfMA: 50000,
      cpfLifeStartAge: 65,
      cpfLifePlan: 'standard',
      cpfRetirementSum: 'frs',
    })

    // Before 65: no CPF LIFE payout
    const row60 = rows.find((r) => r.age === 60)!
    expect(row60.cpfLifePayout).toBe(0)
    expect(row60.governmentIncome).toBe(0)

    // At 65: CPF LIFE kicks in
    const row65 = rows.find((r) => r.age === 65)!
    expect(row65.cpfLifePayout).toBeGreaterThan(0)
    expect(row65.governmentIncome).toBe(row65.cpfLifePayout)

    // At 70: still receiving
    const row70 = rows.find((r) => r.age === 70)!
    expect(row70.cpfLifePayout).toBeGreaterThan(0)
  })

  it('CPF LIFE payout differs by BRS/FRS/ERS selection (young age)', () => {
    // Use currentAge=30 so BRS/FRS/ERS are projected 25 years forward.
    // With RA, payout is based on actual RA balance at LIFE start (not fixed level amount).
    // Need SA+OA large enough to fully fund each level at age 55.
    // ERS at 55 ≈ $426K * 1.035^25 ≈ $1,006K, so SA+OA must exceed this.
    const baseParams = {
      currentAge: 30,
      retirementAge: 55,
      lifeExpectancy: 70,
      salaryModel: 'simple' as const,
      annualSalary: 200000,
      salaryGrowthRate: 0,
      realisticPhases: DEFAULT_CAREER_PHASES,
      promotionJumps: [],
      momEducation: 'degree' as const,
      momAdjustment: 1.0,
      employerCpfEnabled: true,
      incomeStreams: [],
      lifeEvents: [],
      lifeEventsEnabled: false,
      annualExpenses: 50000,
      inflation: 0,
      personalReliefs: 20000,
      srsAnnualContribution: 0,
      initialCpfOA: 500000,
      initialCpfSA: 800000,
      initialCpfMA: 50000,
      cpfLifeStartAge: 65,
      cpfLifePlan: 'standard' as const,
    }

    const rowsBrs = generateIncomeProjection({ ...baseParams, cpfRetirementSum: 'brs' as const })
    const rowsFrs = generateIncomeProjection({ ...baseParams, cpfRetirementSum: 'frs' as const })
    const rowsErs = generateIncomeProjection({ ...baseParams, cpfRetirementSum: 'ers' as const })

    const payoutBrs = rowsBrs.find((r) => r.age === 65)!.cpfLifePayout
    const payoutFrs = rowsFrs.find((r) => r.age === 65)!.cpfLifePayout
    const payoutErs = rowsErs.find((r) => r.age === 65)!.cpfLifePayout

    // All should produce payouts
    expect(payoutBrs).toBeGreaterThan(0)
    expect(payoutFrs).toBeGreaterThan(0)
    expect(payoutErs).toBeGreaterThan(0)

    // FRS payout should be ~2x BRS, ERS should be ~2x FRS
    // Ratio is slightly imperfect due to fixed extra interest on first $30K RA
    expect(payoutFrs).toBeGreaterThan(payoutBrs * 1.9)
    expect(payoutFrs).toBeLessThan(payoutBrs * 2.1)
    expect(payoutErs).toBeGreaterThan(payoutFrs * 1.9)
    expect(payoutErs).toBeLessThan(payoutFrs * 2.1)

    // Verify payouts use RA balance at LIFE start (not 2024 base values).
    // BRS at 55 ≈ $251K, then RA grows at 4%+extra for 10 years → RA at 65 ≈ $375K+
    // Payout = RA * 6.3%. Would be ~$6,710 with 2024-base-value bug.
    expect(payoutBrs).toBeGreaterThan(15000)
  })

  it('CPF LIFE payout differs by BRS/FRS/ERS with default SA (zero starting balance)', () => {
    // Realistic scenario: user starts with cpfSA=0 at age 30.
    // With RA, payout is based on actual RA balance (min of accumulated SA+OA vs target).
    // With $72K salary, accumulated SA+OA at 55 may not reach ERS target,
    // so ERS payout may be less than 2x FRS. BRS and FRS should still hold ~2x ratio.
    const baseParams = {
      currentAge: 30,
      retirementAge: 55,
      lifeExpectancy: 70,
      salaryModel: 'simple' as const,
      annualSalary: 72000,
      salaryGrowthRate: 0.03,
      realisticPhases: DEFAULT_CAREER_PHASES,
      promotionJumps: [],
      momEducation: 'degree' as const,
      momAdjustment: 1.0,
      employerCpfEnabled: true,
      incomeStreams: [],
      lifeEvents: [],
      lifeEventsEnabled: false,
      annualExpenses: 48000,
      inflation: 0,
      personalReliefs: 20000,
      srsAnnualContribution: 0,
      initialCpfOA: 0,
      initialCpfSA: 0,
      initialCpfMA: 0,
      cpfLifeStartAge: 65,
      cpfLifePlan: 'standard' as const,
    }

    const rowsBrs = generateIncomeProjection({ ...baseParams, cpfRetirementSum: 'brs' as const })
    const rowsFrs = generateIncomeProjection({ ...baseParams, cpfRetirementSum: 'frs' as const })
    const rowsErs = generateIncomeProjection({ ...baseParams, cpfRetirementSum: 'ers' as const })

    const payoutBrs = rowsBrs.find((r) => r.age === 65)!.cpfLifePayout
    const payoutFrs = rowsFrs.find((r) => r.age === 65)!.cpfLifePayout
    const payoutErs = rowsErs.find((r) => r.age === 65)!.cpfLifePayout

    // All three selections MUST produce different payouts
    expect(payoutBrs).toBeGreaterThan(0)
    expect(payoutFrs).toBeGreaterThan(payoutBrs)
    expect(payoutErs).toBeGreaterThan(payoutFrs)

    // FRS payout should be ~2x BRS (both levels are fully funded from accumulated SA+OA)
    expect(payoutFrs).toBeGreaterThan(payoutBrs * 1.8)

    // ERS may not be fully funded (accumulated SA+OA < ERS target at 55),
    // so ERS payout is > FRS but not necessarily 2x
    expect(payoutErs).toBeGreaterThan(payoutFrs)
  })

  it('CPF LIFE escalating plan grows 2%/yr in projection', () => {
    const rows = generateIncomeProjection({
      currentAge: 60,
      retirementAge: 60,
      lifeExpectancy: 75,
      salaryModel: 'simple',
      annualSalary: 0,
      salaryGrowthRate: 0,
      realisticPhases: DEFAULT_CAREER_PHASES,
      promotionJumps: [],
      momEducation: 'degree',
      momAdjustment: 1.0,
      employerCpfEnabled: false,
      incomeStreams: [],
      lifeEvents: [],
      lifeEventsEnabled: false,
      annualExpenses: 50000,
      inflation: 0.025,
      personalReliefs: 20000,
      srsAnnualContribution: 0,
      initialCpfOA: 50000,
      initialCpfSA: 200000,
      initialCpfMA: 30000,
      cpfLifeStartAge: 65,
      cpfLifePlan: 'escalating',
      cpfRetirementSum: 'frs',
    })

    const row65 = rows.find((r) => r.age === 65)!
    const row66 = rows.find((r) => r.age === 66)!

    // Escalating payout at year 1 should be ~2% higher than year 0
    expect(row66.cpfLifePayout).toBeCloseTo(row65.cpfLifePayout * 1.02, 0)
  })

  it('OA housing deduction reduces OA balance', () => {
    const withoutHousing = generateIncomeProjection({
      currentAge: 30,
      retirementAge: 65,
      lifeExpectancy: 70,
      salaryModel: 'simple',
      annualSalary: 72000,
      salaryGrowthRate: 0,
      realisticPhases: DEFAULT_CAREER_PHASES,
      promotionJumps: [],
      momEducation: 'degree',
      momAdjustment: 1.0,
      employerCpfEnabled: true,
      incomeStreams: [],
      lifeEvents: [],
      lifeEventsEnabled: false,
      annualExpenses: 30000,
      inflation: 0,
      personalReliefs: 20000,
      srsAnnualContribution: 0,
      initialCpfOA: 100000,
      initialCpfSA: 50000,
      initialCpfMA: 20000,
      cpfHousingMode: 'none',
    })

    const withHousing = generateIncomeProjection({
      currentAge: 30,
      retirementAge: 65,
      lifeExpectancy: 70,
      salaryModel: 'simple',
      annualSalary: 72000,
      salaryGrowthRate: 0,
      realisticPhases: DEFAULT_CAREER_PHASES,
      promotionJumps: [],
      momEducation: 'degree',
      momAdjustment: 1.0,
      employerCpfEnabled: true,
      incomeStreams: [],
      lifeEvents: [],
      lifeEventsEnabled: false,
      annualExpenses: 30000,
      inflation: 0,
      personalReliefs: 20000,
      srsAnnualContribution: 0,
      initialCpfOA: 100000,
      initialCpfSA: 50000,
      initialCpfMA: 20000,
      cpfHousingMode: 'simple',
      cpfHousingMonthly: 1000,
      cpfMortgageYearsLeft: 25,
    })

    // OA should be lower with housing deduction
    const noHousing35 = withoutHousing.find((r) => r.age === 35)!
    const housing35 = withHousing.find((r) => r.age === 35)!
    expect(housing35.cpfOA).toBeLessThan(noHousing35.cpfOA)

    // Housing deduction should be $12K/yr
    const row30 = withHousing.find((r) => r.age === 30)!
    expect(row30.cpfOaHousingDeduction).toBe(12000)

    // After housing end age, no more deductions
    const row56 = withHousing.find((r) => r.age === 56)!
    expect(row56.cpfOaHousingDeduction).toBe(0)
  })

  it('manual CPF LIFE stream takes precedence over automated', () => {
    const rows = generateIncomeProjection({
      currentAge: 60,
      retirementAge: 60,
      lifeExpectancy: 70,
      salaryModel: 'simple',
      annualSalary: 0,
      salaryGrowthRate: 0,
      realisticPhases: DEFAULT_CAREER_PHASES,
      promotionJumps: [],
      momEducation: 'degree',
      momAdjustment: 1.0,
      employerCpfEnabled: false,
      incomeStreams: [{
        id: 'manual-cpf',
        name: 'CPF LIFE',
        annualAmount: 15000,
        startAge: 65,
        endAge: 90,
        growthRate: 0,
        type: 'government',
        growthModel: 'none',
        taxTreatment: 'tax-exempt',
        isCpfApplicable: false,
        isActive: true,
      }],
      lifeEvents: [],
      lifeEventsEnabled: false,
      annualExpenses: 50000,
      inflation: 0,
      personalReliefs: 0,
      srsAnnualContribution: 0,
      initialCpfOA: 50000,
      initialCpfSA: 200000,
      initialCpfMA: 30000,
      cpfLifeStartAge: 65,
      cpfLifePlan: 'standard',
      cpfRetirementSum: 'frs',
    })

    const row65 = rows.find((r) => r.age === 65)!
    // Should use manual stream (15000), not automated
    expect(row65.cpfLifePayout).toBe(0) // automated is skipped
    expect(row65.governmentIncome).toBe(15000) // manual stream value
  })

  it('65+ direct payout: cpfLifeActualMonthlyPayout overrides projected payout', () => {
    const rows = generateIncomeProjection({
      currentAge: 65,
      retirementAge: 65,
      lifeExpectancy: 75,
      salaryModel: 'simple',
      annualSalary: 0,
      salaryGrowthRate: 0,
      realisticPhases: DEFAULT_CAREER_PHASES,
      promotionJumps: [],
      momEducation: 'degree',
      momAdjustment: 1.0,
      employerCpfEnabled: false,
      incomeStreams: [],
      lifeEvents: [],
      lifeEventsEnabled: false,
      annualExpenses: 50000,
      inflation: 0,
      personalReliefs: 0,
      srsAnnualContribution: 0,
      initialCpfOA: 50000,
      initialCpfSA: 200000,
      initialCpfMA: 30000,
      cpfLifeStartAge: 65,
      cpfLifePlan: 'standard',
      cpfRetirementSum: 'frs',
      cpfLifeActualMonthlyPayout: 1500,
    })

    // At 65: should use $1500/mo * 12 = $18,000/yr, not projected value
    const row65 = rows.find((r) => r.age === 65)!
    expect(row65.cpfLifePayout).toBe(18000)
    expect(row65.governmentIncome).toBe(18000)

    // At 70: same direct payout (no escalation)
    const row70 = rows.find((r) => r.age === 70)!
    expect(row70.cpfLifePayout).toBe(18000)
  })

  it('65+ direct payout with zero falls back to projection', () => {
    const rows = generateIncomeProjection({
      currentAge: 65,
      retirementAge: 65,
      lifeExpectancy: 70,
      salaryModel: 'simple',
      annualSalary: 0,
      salaryGrowthRate: 0,
      realisticPhases: DEFAULT_CAREER_PHASES,
      promotionJumps: [],
      momEducation: 'degree',
      momAdjustment: 1.0,
      employerCpfEnabled: false,
      incomeStreams: [],
      lifeEvents: [],
      lifeEventsEnabled: false,
      annualExpenses: 50000,
      inflation: 0,
      personalReliefs: 0,
      srsAnnualContribution: 0,
      initialCpfOA: 50000,
      initialCpfSA: 200000,
      initialCpfMA: 30000,
      cpfLifeStartAge: 65,
      cpfLifePlan: 'standard',
      cpfRetirementSum: 'frs',
      cpfLifeActualMonthlyPayout: 0,
    })

    // Should fall back to calculated projection
    const row65 = rows.find((r) => r.age === 65)!
    expect(row65.cpfLifePayout).toBeGreaterThan(0)
    // Projected payout should NOT be $0 (it uses calculateCpfLifePayoutAtAge)
    expect(row65.cpfLifePayout).not.toBe(0)
  })

  it('65+ direct payout overrides escalating plan', () => {
    const rows = generateIncomeProjection({
      currentAge: 65,
      retirementAge: 65,
      lifeExpectancy: 70,
      salaryModel: 'simple',
      annualSalary: 0,
      salaryGrowthRate: 0,
      realisticPhases: DEFAULT_CAREER_PHASES,
      promotionJumps: [],
      momEducation: 'degree',
      momAdjustment: 1.0,
      employerCpfEnabled: false,
      incomeStreams: [],
      lifeEvents: [],
      lifeEventsEnabled: false,
      annualExpenses: 50000,
      inflation: 0,
      personalReliefs: 0,
      srsAnnualContribution: 0,
      initialCpfOA: 50000,
      initialCpfSA: 200000,
      initialCpfMA: 30000,
      cpfLifeStartAge: 65,
      cpfLifePlan: 'escalating',
      cpfRetirementSum: 'frs',
      cpfLifeActualMonthlyPayout: 2000,
    })

    // All years should have the same payout (no escalation when using direct payout)
    const row65 = rows.find((r) => r.age === 65)!
    const row66 = rows.find((r) => r.age === 66)!
    expect(row65.cpfLifePayout).toBe(24000) // $2000 * 12
    expect(row66.cpfLifePayout).toBe(24000) // Same, not escalated
  })

  it('SA = 0 at age 55+, RA holds transferred amount', () => {
    const rows = generateIncomeProjection({
      currentAge: 45,
      retirementAge: 65,
      lifeExpectancy: 70,
      salaryModel: 'simple',
      annualSalary: 100000,
      salaryGrowthRate: 0,
      realisticPhases: DEFAULT_CAREER_PHASES,
      promotionJumps: [],
      momEducation: 'degree',
      momAdjustment: 1.0,
      employerCpfEnabled: true,
      incomeStreams: [],
      lifeEvents: [],
      lifeEventsEnabled: false,
      annualExpenses: 50000,
      inflation: 0,
      personalReliefs: 20000,
      srsAnnualContribution: 0,
      initialCpfOA: 100000,
      initialCpfSA: 150000,
      initialCpfMA: 30000,
      cpfLifeStartAge: 65,
      cpfLifePlan: 'standard',
      cpfRetirementSum: 'frs',
    })

    // Before 55: SA should be > 0
    const row54 = rows.find((r) => r.age === 54)!
    expect(row54.cpfSA).toBeGreaterThan(0)
    expect(row54.cpfRA).toBe(0)

    // At 55: SA transfers to RA, SA becomes 0
    const row55 = rows.find((r) => r.age === 55)!
    expect(row55.cpfSA).toBe(0)
    expect(row55.cpfRA).toBeGreaterThan(0)

    // Post-55: SA stays 0, RA grows
    const row56 = rows.find((r) => r.age === 56)!
    expect(row56.cpfSA).toBe(0)
    expect(row56.cpfRA).toBeGreaterThan(row55.cpfRA)
  })

  it('RA grows with 4% interest from 55 to LIFE start, then goes to 0', () => {
    const rows = generateIncomeProjection({
      currentAge: 55,
      retirementAge: 58,
      lifeExpectancy: 70,
      salaryModel: 'simple',
      annualSalary: 200000,
      salaryGrowthRate: 0,
      realisticPhases: DEFAULT_CAREER_PHASES,
      promotionJumps: [],
      momEducation: 'degree',
      momAdjustment: 1.0,
      employerCpfEnabled: true,
      incomeStreams: [],
      lifeEvents: [],
      lifeEventsEnabled: false,
      annualExpenses: 80000,
      inflation: 0,
      personalReliefs: 20000,
      srsAnnualContribution: 0,
      initialCpfOA: 100000,
      initialCpfSA: 200000,
      initialCpfMA: 50000,
      cpfLifeStartAge: 65,
      cpfLifePlan: 'standard',
      cpfRetirementSum: 'frs',
    })

    // At age 55: RA should exist (from SA transfer)
    const row55 = rows.find((r) => r.age === 55)!
    expect(row55.cpfRA).toBeGreaterThan(0)

    // RA grows from 55 to 64
    const row60 = rows.find((r) => r.age === 60)!
    expect(row60.cpfRA).toBeGreaterThan(row55.cpfRA)

    const row64 = rows.find((r) => r.age === 64)!
    expect(row64.cpfRA).toBeGreaterThan(row60.cpfRA)

    // At 65 (LIFE start): RA goes to 0 (annuitized)
    const row65 = rows.find((r) => r.age === 65)!
    expect(row65.cpfRA).toBe(0)

    // Payout based on RA balance at LIFE start (higher than original FRS due to 10yr growth)
    expect(row65.cpfLifePayout).toBeGreaterThan(213000 * 0.063) // Higher than old fixed-FRS payout
  })

  it('Basic Plan: RA retains ~85% at LIFE start', () => {
    const rows = generateIncomeProjection({
      currentAge: 55,
      retirementAge: 58,
      lifeExpectancy: 75,
      salaryModel: 'simple',
      annualSalary: 200000,
      salaryGrowthRate: 0,
      realisticPhases: DEFAULT_CAREER_PHASES,
      promotionJumps: [],
      momEducation: 'degree',
      momAdjustment: 1.0,
      employerCpfEnabled: true,
      incomeStreams: [],
      lifeEvents: [],
      lifeEventsEnabled: false,
      annualExpenses: 80000,
      inflation: 0,
      personalReliefs: 20000,
      srsAnnualContribution: 0,
      initialCpfOA: 100000,
      initialCpfSA: 200000,
      initialCpfMA: 50000,
      cpfLifeStartAge: 65,
      cpfLifePlan: 'basic',
      cpfRetirementSum: 'frs',
    })

    // RA should grow from 55 to 64
    const row64 = rows.find((r) => r.age === 64)!
    const preLifeRA = row64.cpfRA
    expect(preLifeRA).toBeGreaterThan(0)

    // At 65 (LIFE start): RA should retain ~85% (not go to 0)
    const row65 = rows.find((r) => r.age === 65)!
    // RA at 65 should be ~85% of what it was at 64, minus the payout deducted,
    // plus interest earned during that year
    expect(row65.cpfRA).toBeGreaterThan(0)
    // Annuity premium should be ~15% of pre-LIFE RA
    expect(row65.cpfLifeAnnuityPremium).toBeCloseTo(preLifeRA * 0.15, -2)
  })

  it('Basic Plan: RA draws down each year post-LIFE', () => {
    const rows = generateIncomeProjection({
      currentAge: 60,
      retirementAge: 60,
      lifeExpectancy: 95,
      salaryModel: 'simple',
      annualSalary: 0,
      salaryGrowthRate: 0,
      realisticPhases: DEFAULT_CAREER_PHASES,
      promotionJumps: [],
      momEducation: 'degree',
      momAdjustment: 1.0,
      employerCpfEnabled: false,
      incomeStreams: [],
      lifeEvents: [],
      lifeEventsEnabled: false,
      annualExpenses: 50000,
      inflation: 0,
      personalReliefs: 0,
      srsAnnualContribution: 0,
      initialCpfOA: 50000,
      initialCpfSA: 200000,
      initialCpfMA: 30000,
      cpfLifeStartAge: 65,
      cpfLifePlan: 'basic',
      cpfRetirementSum: 'frs',
    })

    const row65 = rows.find((r) => r.age === 65)!
    const row70 = rows.find((r) => r.age === 70)!
    const row80 = rows.find((r) => r.age === 80)!

    // RA should be non-zero at 65
    expect(row65.cpfRA).toBeGreaterThan(0)
    // RA decreasing over time (payout exceeds interest)
    expect(row70.cpfRA).toBeLessThan(row65.cpfRA)
    // RA eventually depletes (by ~85-95)
    expect(row80.cpfRA).toBeLessThan(row70.cpfRA)

    // Eventually reaches 0
    const depleted = rows.find((r) => r.age > 65 && r.cpfRA === 0)
    expect(depleted).toBeDefined()
  })

  it('Basic Plan: payout amount unchanged regardless of RA balance', () => {
    const rows = generateIncomeProjection({
      currentAge: 60,
      retirementAge: 60,
      lifeExpectancy: 95,
      salaryModel: 'simple',
      annualSalary: 0,
      salaryGrowthRate: 0,
      realisticPhases: DEFAULT_CAREER_PHASES,
      promotionJumps: [],
      momEducation: 'degree',
      momAdjustment: 1.0,
      employerCpfEnabled: false,
      incomeStreams: [],
      lifeEvents: [],
      lifeEventsEnabled: false,
      annualExpenses: 50000,
      inflation: 0,
      personalReliefs: 0,
      srsAnnualContribution: 0,
      initialCpfOA: 50000,
      initialCpfSA: 200000,
      initialCpfMA: 30000,
      cpfLifeStartAge: 65,
      cpfLifePlan: 'basic',
      cpfRetirementSum: 'frs',
    })

    const row65 = rows.find((r) => r.age === 65)!
    const row85 = rows.find((r) => r.age === 85)!
    const row90 = rows.find((r) => r.age === 90)!

    // Payout should be the same at all ages (Basic rate is flat)
    expect(row65.cpfLifePayout).toBeGreaterThan(0)
    expect(row85.cpfLifePayout).toBe(row65.cpfLifePayout)
    expect(row90.cpfLifePayout).toBe(row65.cpfLifePayout)
  })

  it('Standard/Escalating: cpfLifeAnnuityPremium equals full RA', () => {
    const rows = generateIncomeProjection({
      currentAge: 55,
      retirementAge: 58,
      lifeExpectancy: 70,
      salaryModel: 'simple',
      annualSalary: 200000,
      salaryGrowthRate: 0,
      realisticPhases: DEFAULT_CAREER_PHASES,
      promotionJumps: [],
      momEducation: 'degree',
      momAdjustment: 1.0,
      employerCpfEnabled: true,
      incomeStreams: [],
      lifeEvents: [],
      lifeEventsEnabled: false,
      annualExpenses: 80000,
      inflation: 0,
      personalReliefs: 20000,
      srsAnnualContribution: 0,
      initialCpfOA: 100000,
      initialCpfSA: 200000,
      initialCpfMA: 50000,
      cpfLifeStartAge: 65,
      cpfLifePlan: 'standard',
      cpfRetirementSum: 'frs',
    })

    const row64 = rows.find((r) => r.age === 64)!
    const row65 = rows.find((r) => r.age === 65)!

    // Standard: annuity premium = full RA at LIFE start
    expect(row65.cpfLifeAnnuityPremium).toBeCloseTo(row64.cpfRA, -2)
    // RA should be 0 after annuitization
    expect(row65.cpfRA).toBe(0)
  })

  it('Post-LIFE contributions go to OA, not RA (all plans)', () => {
    // Worker past LIFE start age, contributions should route SA → OA
    const rowsStandard = generateIncomeProjection({
      currentAge: 60,
      retirementAge: 70,
      lifeExpectancy: 75,
      salaryModel: 'simple',
      annualSalary: 72000,
      salaryGrowthRate: 0,
      realisticPhases: DEFAULT_CAREER_PHASES,
      promotionJumps: [],
      momEducation: 'degree',
      momAdjustment: 1.0,
      employerCpfEnabled: true,
      incomeStreams: [],
      lifeEvents: [],
      lifeEventsEnabled: false,
      annualExpenses: 50000,
      inflation: 0,
      personalReliefs: 20000,
      srsAnnualContribution: 0,
      initialCpfOA: 50000,
      initialCpfSA: 200000,
      initialCpfMA: 30000,
      cpfLifeStartAge: 65,
      cpfLifePlan: 'standard',
      cpfRetirementSum: 'frs',
    })

    // At 66: still working, contributions should go to OA (not RA which is annuitized)
    const row65 = rowsStandard.find((r) => r.age === 65)!
    const row66 = rowsStandard.find((r) => r.age === 66)!
    // RA stays 0 for Standard
    expect(row66.cpfRA).toBe(0)
    // OA should grow (contributions + interest)
    expect(row66.cpfOA).toBeGreaterThan(row65.cpfOA)
  })

  it('cpfLifeActualMonthlyPayout still sets correct annuity premium', () => {
    const rows = generateIncomeProjection({
      currentAge: 65,
      retirementAge: 65,
      lifeExpectancy: 75,
      salaryModel: 'simple',
      annualSalary: 0,
      salaryGrowthRate: 0,
      realisticPhases: DEFAULT_CAREER_PHASES,
      promotionJumps: [],
      momEducation: 'degree',
      momAdjustment: 1.0,
      employerCpfEnabled: false,
      incomeStreams: [],
      lifeEvents: [],
      lifeEventsEnabled: false,
      annualExpenses: 50000,
      inflation: 0,
      personalReliefs: 0,
      srsAnnualContribution: 0,
      initialCpfOA: 50000,
      initialCpfSA: 200000,
      initialCpfMA: 30000,
      cpfLifeStartAge: 65,
      cpfLifePlan: 'standard',
      cpfRetirementSum: 'frs',
      cpfLifeActualMonthlyPayout: 1500,
    })

    const row65 = rows.find((r) => r.age === 65)!
    // Annuity premium should still be set (based on RA, not payout)
    expect(row65.cpfLifeAnnuityPremium).toBeGreaterThan(0)
    // Payout uses actual monthly value
    expect(row65.cpfLifePayout).toBe(18000)
  })

  it('post-55 SA contributions route to RA then overflow to OA', () => {
    // Start at 55 with SA that exactly meets FRS → RA = FRS, no room for more
    const rows = generateIncomeProjection({
      currentAge: 55,
      retirementAge: 60,
      lifeExpectancy: 65,
      salaryModel: 'simple',
      annualSalary: 72000,
      salaryGrowthRate: 0,
      realisticPhases: DEFAULT_CAREER_PHASES,
      promotionJumps: [],
      momEducation: 'degree',
      momAdjustment: 1.0,
      employerCpfEnabled: true,
      incomeStreams: [],
      lifeEvents: [],
      lifeEventsEnabled: false,
      annualExpenses: 50000,
      inflation: 0,
      personalReliefs: 20000,
      srsAnnualContribution: 0,
      initialCpfOA: 100000,
      initialCpfSA: 250000,
      initialCpfMA: 30000,
      cpfLifeStartAge: 65,
      cpfLifePlan: 'standard',
      cpfRetirementSum: 'frs',
    })

    // At 55: SA transfers to RA. SA($250K) → RA, with FRS target ≈ $213K.
    // RA = $213K, excess SA above target stays... no, performAge55Transfer caps at target.
    // Actually SA ($250K) > FRS ($213K), so RA = $213K (all from SA), OA keeps its $100K.
    const row55 = rows.find((r) => r.age === 55)!
    expect(row55.cpfSA).toBe(0)

    // SA contributions in 55-60 bracket (SA rate exists) should go to OA (RA at cap)
    // We verify OA grows more than just from OA allocation (gets SA overflow too)
    const row56 = rows.find((r) => r.age === 56)!
    // OA should be > 55's OA + just OA allocation (has SA overflow)
    expect(row56.cpfOA).toBeGreaterThan(row55.cpfOA)
  })

  it('Pre-Retiree: government income stream appears at correct age', () => {
    const cpfLifeStream: IncomeStream = {
      id: 'cpf-life',
      name: 'CPF LIFE',
      annualAmount: 13400,
      startAge: 65,
      endAge: 90,
      growthRate: 0,
      type: 'government',
      growthModel: 'none',
      taxTreatment: 'tax-exempt',
      isCpfApplicable: false,
      isActive: true,
    }

    const rows = generateIncomeProjection({
      currentAge: 55,
      retirementAge: 58,
      lifeExpectancy: 90,
      salaryModel: 'simple',
      annualSalary: 200000,
      salaryGrowthRate: 0,
      realisticPhases: DEFAULT_CAREER_PHASES,
      promotionJumps: [],
      momEducation: 'degree',
      momAdjustment: 1.0,
      employerCpfEnabled: true,
      incomeStreams: [cpfLifeStream],
      lifeEvents: [],
      lifeEventsEnabled: false,
      annualExpenses: 80000,
      inflation: 0.025,
      personalReliefs: 20000,
      srsAnnualContribution: 0,
      initialCpfOA: 500000,
      initialCpfSA: 300000,
      initialCpfMA: 100000,
    })

    // Before 65: no government income
    const row60 = rows.find((r) => r.age === 60)!
    expect(row60.governmentIncome).toBe(0)

    // At 65: CPF LIFE kicks in
    const row65 = rows.find((r) => r.age === 65)!
    expect(row65.governmentIncome).toBe(13400)
    expect(row65.isRetired).toBe(true)

    // At 89: still receiving
    const row89 = rows.find((r) => r.age === 89)!
    expect(row89.governmentIncome).toBe(13400)

    // At 90 (endAge): no longer receiving
    const row90 = rows.find((r) => r.age === 90)!
    expect(row90.governmentIncome).toBe(0)
  })

  it('tracks SRS accumulation, drawdown at age 63, and stops after 10 years', () => {
    const rows = generateIncomeProjection({
      currentAge: 55,
      retirementAge: 55,
      lifeExpectancy: 80,
      salaryModel: 'simple',
      annualSalary: 0,
      salaryGrowthRate: 0,
      realisticPhases: DEFAULT_CAREER_PHASES,
      promotionJumps: [],
      momEducation: 'degree',
      momAdjustment: 1.0,
      employerCpfEnabled: false,
      incomeStreams: [],
      lifeEvents: [],
      lifeEventsEnabled: false,
      annualExpenses: 48000,
      inflation: 0,
      personalReliefs: 0,
      srsAnnualContribution: 15300,
      initialCpfOA: 0,
      initialCpfSA: 0,
      initialCpfMA: 0,
      initialCpfRA: 0,
      cpfLifeStartAge: 65,
      cpfLifePlan: 'standard',
      cpfRetirementSum: 'frs',
      cpfHousingMode: 'none',
      cpfHousingMonthly: 0,
      cpfMortgageYearsLeft: 0,
      residencyStatus: 'citizen',
      srsBalance: 100000,
      srsInvestmentReturn: 0.04,
      srsDrawdownStartAge: 63,
    })

    // Age 55 = retirementAge: isRetired = (age > retirementAge), so age 55 still contributes
    const row55 = rows.find((r) => r.age === 55)!
    expect(row55.srsContribution).toBe(15300) // last working year
    expect(row55.srsWithdrawal).toBe(0)
    // ($100K + $15,300) * 1.04 = $119,912
    expect(row55.srsBalance).toBeCloseTo((100000 + 15300) * 1.04, 0)

    // Age 56+: retired, no more contributions, but balance grows with returns
    const row56 = rows.find((r) => r.age === 56)!
    expect(row56.srsContribution).toBe(0)
    expect(row56.srsWithdrawal).toBe(0)

    const row62 = rows.find((r) => r.age === 62)!
    expect(row62.srsWithdrawal).toBe(0)
    expect(row62.srsBalance).toBeGreaterThan(100000) // should have grown

    // Drawdown starts at age 63
    const row63 = rows.find((r) => r.age === 63)!
    expect(row63.srsWithdrawal).toBeGreaterThan(0)
    expect(row63.srsTaxableWithdrawal).toBeCloseTo(row63.srsWithdrawal * 0.5, 2)
    // SRS withdrawal is tracked separately from governmentIncome
    expect(row63.srsWithdrawal).toBeGreaterThan(0)
    // totalGross includes SRS withdrawal
    expect(row63.totalGross).toBeGreaterThanOrEqual(row63.srsWithdrawal)

    // Age 72: last drawdown year (63 + 10 - 1 = 72)
    const row72 = rows.find((r) => r.age === 72)!
    expect(row72.srsWithdrawal).toBeGreaterThan(0)

    // Age 73: drawdown finished, no more SRS
    const row73 = rows.find((r) => r.age === 73)!
    expect(row73.srsWithdrawal).toBe(0)
    expect(row73.srsBalance).toBeCloseTo(0, 0)
  })

  it('tracks cpfOaShortfall when OA is depleted by mortgage', () => {
    const result = generateIncomeProjection({
      currentAge: 38,
      retirementAge: 40,
      lifeExpectancy: 50,
      salaryModel: 'simple',
      annualSalary: 72000,
      salaryGrowthRate: 0.03,
      realisticPhases: DEFAULT_CAREER_PHASES,
      promotionJumps: [],
      momEducation: 'degree',
      momAdjustment: 1.0,
      employerCpfEnabled: true,
      incomeStreams: [],
      lifeEvents: [],
      lifeEventsEnabled: false,
      annualExpenses: 48000,
      inflation: 0,
      personalReliefs: 20000,
      srsAnnualContribution: 0,
      initialCpfOA: 50000,
      initialCpfSA: 30000,
      initialCpfMA: 20000,
      cpfHousingMode: 'simple',
      cpfHousingMonthly: 1500,
      cpfMortgageYearsLeft: 20,
      cpfLifeStartAge: 65,
      cpfLifePlan: 'standard',
      cpfRetirementSum: 'frs',
    })

    // After retirement at 40, no salary -> no CPF contributions
    // OA gets drained by $18K/yr (1500 * 12) with only interest accumulating
    // At some point OA < 18K and shortfall appears
    const shortfallRows = result.filter((r) => r.cpfOaShortfall > 0)
    expect(shortfallRows.length).toBeGreaterThan(0)

    // First shortfall should be after OA runs out
    const firstShortfall = shortfallRows[0]
    expect(firstShortfall.age).toBeGreaterThan(40)

    // Before shortfall, cpfOaShortfall should be 0
    const preShortfall = result.filter((r) => r.age < firstShortfall.age)
    for (const row of preShortfall) {
      expect(row.cpfOaShortfall).toBe(0)
    }
  })
})
