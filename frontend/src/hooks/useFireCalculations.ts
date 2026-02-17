import { useMemo } from 'react'
import type { FireMetrics } from '@/lib/types'
import { calculateAllFireMetrics } from '@/lib/calculations/fire'
import { calculatePortfolioReturn } from '@/lib/calculations/portfolio'
import { generateIncomeProjection } from '@/lib/calculations/income'
import { useProfileStore } from '@/stores/useProfileStore'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { useAllocationStore } from '@/stores/useAllocationStore'
import { usePropertyStore } from '@/stores/usePropertyStore'
import { ASSET_CLASSES } from '@/lib/data/historicalReturns'

interface FireCalculationsResult {
  metrics: FireMetrics | null
  hasErrors: boolean
  errors: Record<string, string>
}

/**
 * Derived hook: reads profile + income + allocation stores, checks validation, computes FIRE metrics.
 * When allocation has no validation errors, uses portfolio expected return from Markowitz
 * instead of profile.expectedReturn. Falls back to profile.expectedReturn when allocation has errors.
 * When income projection is available, uses row 0's totalGross as effective income.
 */
export function useFireCalculations(): FireCalculationsResult {
  const profile = useProfileStore()
  const income = useIncomeStore()
  const allocation = useAllocationStore()
  const property = usePropertyStore()

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
        cpfLifeStartAge: profile.cpfLifeStartAge,
        cpfLifePlan: profile.cpfLifePlan,
        cpfRetirementSum: profile.cpfRetirementSum,
        cpfHousingMode: profile.cpfHousingMode,
        cpfHousingMonthly: profile.cpfHousingMonthly,
        cpfMortgageYearsLeft: profile.cpfMortgageYearsLeft,
      })

      if (projection.length > 0) {
        effectiveIncome = projection[0].totalGross
      }
    }

    // Use portfolio expected return from allocation when user has opted in and allocation is valid
    let expectedReturn = profile.expectedReturn
    const allocationErrors = allocation.validationErrors
    const allocationHasErrors = Object.keys(allocationErrors).length > 0

    if (profile.usePortfolioReturn && !allocationHasErrors) {
      const effectiveReturns = ASSET_CLASSES.map((ac, i) =>
        allocation.returnOverrides[i] ?? ac.expectedReturn
      )
      expectedReturn = calculatePortfolioReturn(allocation.currentWeights, effectiveReturns)
    }

    // Compute property equity from existing property
    const propertyEquity = property.ownsProperty
      ? Math.max(0, property.existingPropertyValue - property.existingMortgageBalance)
      : 0

    const metrics = calculateAllFireMetrics({
      currentAge: profile.currentAge,
      retirementAge: profile.retirementAge,
      annualIncome: effectiveIncome,
      annualExpenses: profile.annualExpenses,
      liquidNetWorth: profile.liquidNetWorth,
      cpfTotal,
      swr: profile.swr,
      expectedReturn,
      inflation: profile.inflation,
      expenseRatio: profile.expenseRatio,
      fireType: profile.fireType,
      fireNumberBasis: profile.fireNumberBasis,
      cpfLifeStartAge: profile.cpfLifeStartAge,
      lifeExpectancy: profile.lifeExpectancy,
      retirementSpendingAdjustment: profile.retirementSpendingAdjustment,
      propertyEquity,
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
    profile.usePortfolioReturn,
    profile.inflation,
    profile.expenseRatio,
    profile.fireType,
    profile.fireNumberBasis,
    profile.retirementSpendingAdjustment,
    profile.srsAnnualContribution,
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
    allocation.currentWeights,
    allocation.returnOverrides,
    allocation.validationErrors,
    property.ownsProperty,
    property.existingPropertyValue,
    property.existingMortgageBalance,
  ])
}
