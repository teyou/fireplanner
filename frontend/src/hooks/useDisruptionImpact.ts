import { useMemo, useState, useCallback } from 'react'
import type { LifeEvent } from '@/lib/types'
import { generateIncomeProjection } from '@/lib/calculations/income'
import { getBaseInputs, computeMetrics } from '@/hooks/useWhatIfMetrics'
import { useProfileStore } from '@/stores/useProfileStore'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { useAllocationStore } from '@/stores/useAllocationStore'
import { usePropertyStore } from '@/stores/usePropertyStore'

// ============================================================
// Disruption Template Types
// ============================================================

export interface DisruptionTemplate {
  label: string
  category: 'career' | 'health' | 'family'
  event: Omit<LifeEvent, 'id' | 'startAge' | 'endAge' | 'affectedStreamIds'>
  defaultAgeOffset: number
  durationYears: number
  // Probability context (displayed, not used in simulation)
  probability?: number          // cumulative probability (0.25 = 25%)
  probabilityByAge?: number     // "by age X" qualifier
  probabilitySource?: string    // citation
  // Expense impacts
  additionalAnnualExpense?: number
  lumpSumCost?: number
  expenseReductionPercent?: number
}

export const DISRUPTION_TEMPLATES: DisruptionTemplate[] = [
  {
    label: 'Job Loss (6 months)',
    category: 'career',
    defaultAgeOffset: 2,
    durationYears: 1,
    event: { name: 'Job Loss (6 months)', incomeImpact: 0, savingsPause: true, cpfPause: true },
    probability: 0.15,
    probabilityByAge: 0,
    probabilitySource: 'MOM Retrenchment Statistics 2024',
  },
  {
    label: 'Job Loss (12 months)',
    category: 'career',
    defaultAgeOffset: 2,
    durationYears: 2,
    event: { name: 'Job Loss (12 months)', incomeImpact: 0, savingsPause: true, cpfPause: true },
    probability: 0.15,
    probabilityByAge: 0,
    probabilitySource: 'MOM Retrenchment Statistics 2024',
  },
  {
    label: 'Partial Disability',
    category: 'health',
    defaultAgeOffset: 5,
    durationYears: 3,
    event: { name: 'Partial Disability', incomeImpact: 0.5, savingsPause: false, cpfPause: false },
  },
  {
    label: 'Parent Care',
    category: 'family',
    defaultAgeOffset: 10,
    durationYears: 5,
    event: { name: 'Parent Care', incomeImpact: 0.8, savingsPause: false, cpfPause: false },
  },
  {
    label: 'Recession Pay Cut',
    category: 'career',
    defaultAgeOffset: 3,
    durationYears: 2,
    event: { name: 'Recession Pay Cut', incomeImpact: 0.8, savingsPause: false, cpfPause: false },
    probability: 0.15,
    probabilityByAge: 0,
    probabilitySource: 'MOM Labour Market Report 2024',
  },
]

// ============================================================
// Disruption Impact Types
// ============================================================

export interface DisruptionMetrics {
  fireNumber: number
  yearsToFire: number
  fireAge: number
  portfolioAtRetirement: number
}

export interface DisruptionDeltas {
  fireNumber: number
  yearsToFire: number
  fireAge: number
  portfolioAtRetirement: number
}

export interface DisruptionImpactResult {
  selectedIndex: number | null
  startAge: number
  baseMetrics: DisruptionMetrics | null
  disruptedMetrics: DisruptionMetrics | null
  deltas: DisruptionDeltas | null
  hasData: boolean
  selectTemplate: (index: number | null) => void
  setStartAge: (age: number) => void
}

// ============================================================
// Hook: useDisruptionImpact
// ============================================================

export function useDisruptionImpact(): DisruptionImpactResult {
  const profile = useProfileStore()
  const income = useIncomeStore()
  const allocation = useAllocationStore()
  const property = usePropertyStore()

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [customStartAge, setCustomStartAge] = useState<number | null>(null)

  const template = selectedIndex !== null ? DISRUPTION_TEMPLATES[selectedIndex] : null

  // Calculate the effective start age
  const effectiveStartAge = useMemo(() => {
    if (!template) return profile.currentAge + 2
    if (customStartAge !== null) return customStartAge
    return Math.max(profile.currentAge + 1, profile.currentAge + template.defaultAgeOffset)
  }, [template, customStartAge, profile.currentAge])

  const selectTemplate = useCallback((index: number | null) => {
    setSelectedIndex(index)
    setCustomStartAge(null) // Reset custom age when changing template
  }, [])

  const setStartAge = useCallback((age: number) => {
    setCustomStartAge(age)
  }, [])

  const result = useMemo(() => {
    const profileErrors = profile.validationErrors
    if (Object.keys(profileErrors).length > 0) {
      return {
        baseMetrics: null,
        disruptedMetrics: null,
        deltas: null,
        hasData: false,
      }
    }

    // Compute base metrics
    const baseInputs = getBaseInputs(profile, income, allocation, property)
    const baseMetrics = computeMetrics(baseInputs)

    if (!template) {
      return {
        baseMetrics,
        disruptedMetrics: null,
        deltas: null,
        hasData: true,
      }
    }

    // Create the disruption event
    const clampedStartAge = Math.max(profile.currentAge + 1, effectiveStartAge)
    const endAge = clampedStartAge + template.durationYears
    const disruptionEvent: LifeEvent = {
      id: 'disruption-preview',
      name: template.event.name,
      startAge: clampedStartAge,
      endAge,
      incomeImpact: template.event.incomeImpact,
      affectedStreamIds: [],
      savingsPause: template.event.savingsPause,
      cpfPause: template.event.cpfPause,
    }

    // Recompute income projection with disruption event appended
    const incomeHasErrors = Object.keys(income.validationErrors).length > 0
    let disruptedIncome = baseInputs.annualIncome
    if (!incomeHasErrors) {
      const allEvents = [...income.lifeEvents, disruptionEvent]
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
        lifeEvents: allEvents,
        lifeEventsEnabled: true, // Force enabled for disruption preview
        annualExpenses: profile.annualExpenses,
        expenseAdjustments: profile.expenseAdjustments,
        inflation: profile.inflation,
        personalReliefs: income.personalReliefs,
        srsAnnualContribution: profile.srsAnnualContribution,
        initialCpfOA: profile.cpfOA,
        initialCpfSA: profile.cpfSA,
        initialCpfMA: profile.cpfMA,
        initialCpfRA: profile.cpfRA,
        cpfLifeStartAge: profile.cpfLifeStartAge,
        cpfLifePlan: profile.cpfLifePlan,
        cpfRetirementSum: profile.cpfRetirementSum,
        cpfHousingMode: profile.cpfHousingMode,
        cpfHousingMonthly: profile.cpfHousingMonthly,
        cpfMortgageYearsLeft: profile.cpfMortgageYearsLeft,
      })
      if (projection.length > 0) {
        disruptedIncome = projection[0].totalGross
      }
    }

    // Compute disrupted metrics with modified income
    const disruptedInputs = {
      ...baseInputs,
      annualIncome: disruptedIncome,
    }
    const disruptedMetrics = computeMetrics(disruptedInputs)

    // Calculate deltas
    const deltas: DisruptionDeltas = {
      fireNumber: disruptedMetrics.fireNumber - baseMetrics.fireNumber,
      yearsToFire: isFinite(disruptedMetrics.yearsToFire) && isFinite(baseMetrics.yearsToFire)
        ? disruptedMetrics.yearsToFire - baseMetrics.yearsToFire
        : NaN,
      fireAge: isFinite(disruptedMetrics.fireAge) && isFinite(baseMetrics.fireAge)
        ? disruptedMetrics.fireAge - baseMetrics.fireAge
        : NaN,
      portfolioAtRetirement: disruptedMetrics.portfolioAtRetirement - baseMetrics.portfolioAtRetirement,
    }

    return {
      baseMetrics,
      disruptedMetrics,
      deltas,
      hasData: true,
    }
  }, [
    profile, income, allocation, property,
    template, effectiveStartAge,
  ])

  return {
    selectedIndex,
    startAge: effectiveStartAge,
    baseMetrics: result.baseMetrics,
    disruptedMetrics: result.disruptedMetrics,
    deltas: result.deltas,
    hasData: result.hasData,
    selectTemplate,
    setStartAge,
  }
}
