import { useMemo } from 'react'
import type { FireMetrics } from '@/lib/types'
import { calculateAllFireMetrics } from '@/lib/calculations/fire'
import { generateIncomeProjection } from '@/lib/calculations/income'
import { useProfileStore } from '@/stores/useProfileStore'
import { useIncomeStore } from '@/stores/useIncomeStore'

interface FireCalculationsResult {
  metrics: FireMetrics | null
  hasErrors: boolean
  errors: Record<string, string>
}

/**
 * Derived hook: reads profile + income stores, checks validation, computes FIRE metrics.
 * When income projection is available, uses row 0's totalGross as effective income
 * and row 0's annualSavings for more accurate FIRE calculations.
 * Falls back to profile.annualIncome when income projection is unavailable.
 */
export function useFireCalculations(): FireCalculationsResult {
  const profile = useProfileStore()
  const income = useIncomeStore()

  return useMemo(() => {
    const profileErrors = profile.validationErrors

    // If profile has validation errors, don't compute
    if (Object.keys(profileErrors).length > 0) {
      return { metrics: null, hasErrors: true, errors: profileErrors }
    }

    const cpfTotal = profile.cpfOA + profile.cpfSA + profile.cpfMA

    // Try to get effective income from income projection
    let effectiveIncome = profile.annualIncome
    const incomeErrors = income.validationErrors
    const incomeHasErrors = Object.keys(incomeErrors).length > 0

    if (!incomeHasErrors) {
      const projection = generateIncomeProjection({
        currentAge: profile.currentAge,
        retirementAge: profile.retirementAge,
        lifeExpectancy: profile.lifeExpectancy,
        salaryModel: income.salaryModel,
        annualSalary: income.annualSalary,
        salaryGrowthRate: income.salaryGrowthRate,
        realisticPhases: income.realisticPhases,
        promotionJumps: income.promotionJumps,
        momEducation: income.momEducation,
        momAdjustment: income.momAdjustment,
        employerCpfEnabled: income.employerCpfEnabled,
        incomeStreams: income.incomeStreams,
        lifeEvents: income.lifeEvents,
        lifeEventsEnabled: income.lifeEventsEnabled,
        annualExpenses: profile.annualExpenses,
        inflation: profile.inflation,
        personalReliefs: income.personalReliefs,
        srsAnnualContribution: profile.srsAnnualContribution,
        initialCpfOA: profile.cpfOA,
        initialCpfSA: profile.cpfSA,
        initialCpfMA: profile.cpfMA,
      })

      if (projection.length > 0) {
        effectiveIncome = projection[0].totalGross
      }
    }

    const metrics = calculateAllFireMetrics({
      currentAge: profile.currentAge,
      retirementAge: profile.retirementAge,
      annualIncome: effectiveIncome,
      annualExpenses: profile.annualExpenses,
      liquidNetWorth: profile.liquidNetWorth,
      cpfTotal,
      swr: profile.swr,
      expectedReturn: profile.expectedReturn,
      inflation: profile.inflation,
      expenseRatio: profile.expenseRatio,
    })

    return { metrics, hasErrors: false, errors: {} }
  }, [
    profile.currentAge,
    profile.retirementAge,
    profile.lifeExpectancy,
    profile.annualIncome,
    profile.annualExpenses,
    profile.liquidNetWorth,
    profile.cpfOA,
    profile.cpfSA,
    profile.cpfMA,
    profile.swr,
    profile.expectedReturn,
    profile.inflation,
    profile.expenseRatio,
    profile.srsAnnualContribution,
    profile.validationErrors,
    income.salaryModel,
    income.annualSalary,
    income.salaryGrowthRate,
    income.realisticPhases,
    income.promotionJumps,
    income.momEducation,
    income.momAdjustment,
    income.employerCpfEnabled,
    income.incomeStreams,
    income.lifeEvents,
    income.lifeEventsEnabled,
    income.personalReliefs,
    income.validationErrors,
  ])
}
