import { useMemo } from 'react'
import type { IncomeProjectionRow, IncomeSummaryStats, ProfileState, IncomeState } from '@/lib/types'
import type { IncomeProjectionParams } from '@/lib/calculations/income'
import { generateIncomeProjection, calculateIncomeSummary } from '@/lib/calculations/income'
import { useProfileStore } from '@/stores/useProfileStore'
import { useIncomeStore } from '@/stores/useIncomeStore'

/**
 * Build projection params from store state (non-hook helper).
 * Returns null if either store has validation errors.
 */
export function buildProjectionParams(
  profile: ProfileState,
  income: IncomeState
): IncomeProjectionParams | null {
  const profileErrors = profile.validationErrors
  const incomeErrors = income.validationErrors
  if (Object.keys(profileErrors).length > 0 || Object.keys(incomeErrors).length > 0) {
    return null
  }
  return {
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
    cpfLifeStartAge: profile.cpfLifeStartAge,
    cpfLifePlan: profile.cpfLifePlan,
    cpfRetirementSum: profile.cpfRetirementSum,
    cpfHousingMode: profile.cpfHousingMode,
    cpfHousingMonthly: profile.cpfHousingMonthly,
    cpfMortgageYearsLeft: profile.cpfMortgageYearsLeft,
  }
}

interface IncomeProjectionResult {
  projection: IncomeProjectionRow[] | null
  summary: IncomeSummaryStats | null
  hasErrors: boolean
  errors: Record<string, string>
}

/**
 * Derived hook: reads profile + income stores, checks validation,
 * computes full year-by-year income projection and summary stats.
 * Returns null projection/summary when upstream validation fails.
 */
export function useIncomeProjection(): IncomeProjectionResult {
  const profile = useProfileStore()
  const income = useIncomeStore()

  return useMemo(() => {
    const profileErrors = profile.validationErrors
    const incomeErrors = income.validationErrors
    const allErrors = { ...profileErrors, ...incomeErrors }

    if (Object.keys(allErrors).length > 0) {
      return { projection: null, summary: null, hasErrors: true, errors: allErrors }
    }

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
      cpfLifeStartAge: profile.cpfLifeStartAge,
      cpfLifePlan: profile.cpfLifePlan,
      cpfRetirementSum: profile.cpfRetirementSum,
      cpfHousingMode: profile.cpfHousingMode,
      cpfHousingMonthly: profile.cpfHousingMonthly,
      cpfMortgageYearsLeft: profile.cpfMortgageYearsLeft,
    })

    const summary = calculateIncomeSummary(projection, profile.annualExpenses)

    return { projection, summary, hasErrors: false, errors: {} }
  }, [
    profile.currentAge,
    profile.retirementAge,
    profile.lifeExpectancy,
    profile.annualExpenses,
    profile.inflation,
    profile.srsAnnualContribution,
    profile.cpfOA,
    profile.cpfSA,
    profile.cpfMA,
    profile.cpfLifeStartAge,
    profile.cpfLifePlan,
    profile.cpfRetirementSum,
    profile.cpfHousingMode,
    profile.cpfHousingMonthly,
    profile.cpfMortgageYearsLeft,
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
