import { useProfileStore } from '@/stores/useProfileStore'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { useAllocationStore } from '@/stores/useAllocationStore'
import { usePropertyStore } from '@/stores/usePropertyStore'

type SectionId =
  | 'section-personal'
  | 'section-fire-settings'
  | 'section-income'
  | 'section-expenses'
  | 'section-net-worth'
  | 'section-cpf'
  | 'section-property'
  | 'section-allocation'

interface SectionCompletion {
  isComplete: boolean
}

interface UseSectionCompletionResult {
  sections: Record<SectionId, SectionCompletion>
  completedCount: number
  totalSections: number
}

export function useSectionCompletion(): UseSectionCompletionResult {
  const profile = useProfileStore()
  const income = useIncomeStore()
  const allocation = useAllocationStore()
  const property = usePropertyStore()

  const sections: Record<SectionId, SectionCompletion> = {
    'section-personal': {
      isComplete:
        profile.currentAge !== 30 ||
        profile.retirementAge !== 65 ||
        profile.lifeExpectancy !== 90 ||
        profile.maritalStatus !== 'single' ||
        profile.residencyStatus !== 'citizen',
    },
    'section-fire-settings': {
      isComplete:
        profile.swr !== 0.04 ||
        profile.fireType !== 'regular' ||
        profile.expectedReturn !== 0.07 ||
        profile.inflation !== 0.025,
    },
    'section-income': {
      isComplete:
        income.annualSalary !== 72000 ||
        income.salaryModel !== 'simple' ||
        income.incomeStreams.length > 0,
    },
    'section-expenses': {
      isComplete: profile.annualExpenses !== 48000,
    },
    'section-net-worth': {
      isComplete: profile.liquidNetWorth !== 0,
    },
    'section-cpf': {
      isComplete: profile.cpfOA !== 0 || profile.cpfSA !== 0,
    },
    'section-property': {
      isComplete: property.ownsProperty !== false,
    },
    'section-allocation': {
      isComplete: allocation.selectedTemplate !== 'balanced',
    },
  }

  const completedCount = Object.values(sections).filter((s) => s.isComplete).length
  const totalSections = Object.keys(sections).length

  return { sections, completedCount, totalSections }
}
