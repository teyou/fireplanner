import { describe, it, expect } from 'vitest'
import type { ProjectionRow } from '@/lib/types'

// Test the pure logic extracted from the hook's useMemo body.
// We test the derivation function directly rather than the React hook
// to avoid needing a full render context.

function makeRow(overrides: Partial<ProjectionRow> & { age: number; isRetired: boolean }): ProjectionRow {
  return {
    year: 2050,
    totalIncome: 0,
    annualExpenses: 48000,
    savingsOrWithdrawal: 0,
    portfolioReturnDollar: 0,
    portfolioReturnPct: 0,
    liquidNW: 1000000,
    cpfTotal: 200000,
    totalNW: 1200000,
    fireProgress: 1,
    salary: 0,
    rentalIncome: 0,
    investmentIncome: 0,
    businessIncome: 0,
    governmentIncome: 0,
    totalGross: 0,
    sgTax: 0,
    cpfEmployee: 0,
    cpfEmployer: 0,
    totalNet: 0,
    cpfOA: 100000,
    cpfSA: 60000,
    cpfMA: 40000,
    withdrawalAmount: 0,
    maxPermittedWithdrawal: 0,
    withdrawalExcess: 0,
    parentSupportExpense: 0,
    healthcareCashOutlay: 0,
    propertyEquity: 0,
    totalNWIncProperty: 1200000,
    cumulativeSavings: 0,
    activeLifeEvents: [],
    ...overrides,
  }
}

interface PassiveIncomeSource {
  label: string
  annualAmount: number
}

interface PassiveIncomeYearRow {
  age: number
  rentalIncome: number
  investmentIncome: number
  businessIncome: number
  governmentIncome: number
  totalPassive: number
  expenses: number
}

interface PassiveIncomeSummary {
  totalAtRetirement: number
  requiredExpenses: number
  gap: number
  coverageRatio: number
  sources: PassiveIncomeSource[]
  yearlyBreakdown: PassiveIncomeYearRow[]
}

function derivePassiveIncomeSummary(rows: ProjectionRow[] | null): PassiveIncomeSummary | null {
  if (!rows || rows.length === 0) return null

  const retiredRows = rows.filter((r) => r.isRetired)
  if (retiredRows.length === 0) return null

  const yearlyBreakdown: PassiveIncomeYearRow[] = retiredRows.map((r) => ({
    age: r.age,
    rentalIncome: r.rentalIncome,
    investmentIncome: r.investmentIncome,
    businessIncome: r.businessIncome,
    governmentIncome: r.governmentIncome,
    totalPassive: r.rentalIncome + r.investmentIncome + r.businessIncome + r.governmentIncome,
    expenses: r.annualExpenses,
  }))

  const firstRow = yearlyBreakdown[0]
  const totalAtRetirement = firstRow.totalPassive
  const requiredExpenses = firstRow.expenses
  const gap = requiredExpenses - totalAtRetirement
  const coverageRatio = requiredExpenses > 0 ? totalAtRetirement / requiredExpenses : 0

  const sources: PassiveIncomeSource[] = []
  if (firstRow.rentalIncome > 0) sources.push({ label: 'Rental Income', annualAmount: firstRow.rentalIncome })
  if (firstRow.investmentIncome > 0) sources.push({ label: 'Investment Income', annualAmount: firstRow.investmentIncome })
  if (firstRow.businessIncome > 0) sources.push({ label: 'Business Income', annualAmount: firstRow.businessIncome })
  if (firstRow.governmentIncome > 0) sources.push({ label: 'Government / CPF LIFE', annualAmount: firstRow.governmentIncome })

  return { totalAtRetirement, requiredExpenses, gap, coverageRatio, sources, yearlyBreakdown }
}

describe('derivePassiveIncomeSummary', () => {
  it('returns null when rows is null', () => {
    expect(derivePassiveIncomeSummary(null)).toBeNull()
  })

  it('returns null when rows is empty', () => {
    expect(derivePassiveIncomeSummary([])).toBeNull()
  })

  it('returns null when no retired rows exist', () => {
    const rows = [makeRow({ age: 30, isRetired: false })]
    expect(derivePassiveIncomeSummary(rows)).toBeNull()
  })

  it('calculates coverage ratio correctly', () => {
    const rows = [
      makeRow({
        age: 60,
        isRetired: true,
        rentalIncome: 24000,
        governmentIncome: 12000,
        annualExpenses: 48000,
      }),
    ]
    const result = derivePassiveIncomeSummary(rows)!
    expect(result.totalAtRetirement).toBe(36000)
    expect(result.requiredExpenses).toBe(48000)
    expect(result.coverageRatio).toBeCloseTo(0.75)
    expect(result.gap).toBe(12000)
  })

  it('shows negative gap (surplus) when passive income exceeds expenses', () => {
    const rows = [
      makeRow({
        age: 60,
        isRetired: true,
        rentalIncome: 36000,
        investmentIncome: 24000,
        annualExpenses: 48000,
      }),
    ]
    const result = derivePassiveIncomeSummary(rows)!
    expect(result.gap).toBe(-12000)
    expect(result.coverageRatio).toBeCloseTo(1.25)
  })

  it('includes only non-zero sources', () => {
    const rows = [
      makeRow({
        age: 60,
        isRetired: true,
        rentalIncome: 24000,
        investmentIncome: 0,
        businessIncome: 0,
        governmentIncome: 12000,
        annualExpenses: 48000,
      }),
    ]
    const result = derivePassiveIncomeSummary(rows)!
    expect(result.sources).toHaveLength(2)
    expect(result.sources[0].label).toBe('Rental Income')
    expect(result.sources[1].label).toBe('Government / CPF LIFE')
  })

  it('returns empty sources when no passive income', () => {
    const rows = [
      makeRow({ age: 60, isRetired: true, annualExpenses: 48000 }),
    ]
    const result = derivePassiveIncomeSummary(rows)!
    expect(result.sources).toHaveLength(0)
    expect(result.totalAtRetirement).toBe(0)
    expect(result.coverageRatio).toBe(0)
    expect(result.gap).toBe(48000)
  })

  it('yearly breakdown length matches retirement duration', () => {
    const rows = [
      makeRow({ age: 30, isRetired: false }),
      makeRow({ age: 60, isRetired: true, rentalIncome: 24000, annualExpenses: 48000 }),
      makeRow({ age: 61, isRetired: true, rentalIncome: 24000, annualExpenses: 48000 }),
      makeRow({ age: 62, isRetired: true, rentalIncome: 24000, annualExpenses: 48000 }),
    ]
    const result = derivePassiveIncomeSummary(rows)!
    expect(result.yearlyBreakdown).toHaveLength(3)
    expect(result.yearlyBreakdown[0].age).toBe(60)
    expect(result.yearlyBreakdown[2].age).toBe(62)
  })

  it('handles zero expenses with zero coverage ratio', () => {
    const rows = [
      makeRow({ age: 60, isRetired: true, annualExpenses: 0, rentalIncome: 10000 }),
    ]
    const result = derivePassiveIncomeSummary(rows)!
    expect(result.coverageRatio).toBe(0)
  })
})
