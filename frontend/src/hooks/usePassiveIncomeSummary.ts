import { useMemo } from 'react'
import { useProjection } from '@/hooks/useProjection'

export interface PassiveIncomeSource {
  label: string
  annualAmount: number
}

export interface PassiveIncomeYearRow {
  age: number
  rentalIncome: number
  investmentIncome: number
  businessIncome: number
  governmentIncome: number
  totalPassive: number
  expenses: number
}

export interface PassiveIncomeSummary {
  totalAtRetirement: number
  requiredExpenses: number
  gap: number
  coverageRatio: number
  sources: PassiveIncomeSource[]
  yearlyBreakdown: PassiveIncomeYearRow[]
}

/**
 * Derived hook: summarises passive income coverage during retirement.
 * Reads entirely from useProjection() rows — no direct store reads for
 * income data. Returns null when projection data is unavailable.
 */
export function usePassiveIncomeSummary(): PassiveIncomeSummary | null {
  const { rows } = useProjection()

  return useMemo(() => {
    if (!rows || rows.length === 0) return null

    const retiredRows = rows.filter((r) => r.isRetired)
    if (retiredRows.length === 0) return null

    // Build yearly breakdown from retired rows
    const yearlyBreakdown: PassiveIncomeYearRow[] = retiredRows.map((r) => ({
      age: r.age,
      rentalIncome: r.rentalIncome,
      investmentIncome: r.investmentIncome,
      businessIncome: r.businessIncome,
      governmentIncome: r.governmentIncome,
      totalPassive:
        r.rentalIncome + r.investmentIncome + r.businessIncome + r.governmentIncome,
      expenses: r.annualExpenses,
    }))

    // Use first retirement year for headline metrics
    const firstRow = yearlyBreakdown[0]
    const totalAtRetirement = firstRow.totalPassive
    const requiredExpenses = firstRow.expenses
    const gap = requiredExpenses - totalAtRetirement
    const coverageRatio = requiredExpenses > 0 ? totalAtRetirement / requiredExpenses : 0

    // Build sources array (non-zero only)
    const sources: PassiveIncomeSource[] = []
    if (firstRow.rentalIncome > 0) {
      sources.push({ label: 'Rental Income', annualAmount: firstRow.rentalIncome })
    }
    if (firstRow.investmentIncome > 0) {
      sources.push({ label: 'Investment Income', annualAmount: firstRow.investmentIncome })
    }
    if (firstRow.businessIncome > 0) {
      sources.push({ label: 'Business Income', annualAmount: firstRow.businessIncome })
    }
    if (firstRow.governmentIncome > 0) {
      sources.push({ label: 'Government / CPF LIFE', annualAmount: firstRow.governmentIncome })
    }

    return {
      totalAtRetirement,
      requiredExpenses,
      gap,
      coverageRatio,
      sources,
      yearlyBreakdown,
    }
  }, [rows])
}
