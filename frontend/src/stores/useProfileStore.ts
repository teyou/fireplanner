import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProfileState, ValidationErrors } from '@/lib/types'
import { validateProfileField } from '@/lib/validation/schemas'
import { validateProfileConsistency } from '@/lib/validation/rules'

interface ProfileActions {
  setField: <K extends keyof Omit<ProfileState, 'validationErrors'>>(
    field: K,
    value: ProfileState[K]
  ) => void
  reset: () => void
}

const PROFILE_DATA_KEYS = [
  'currentAge', 'retirementAge', 'lifeExpectancy', 'lifeStage', 'maritalStatus',
  'residencyStatus', 'annualIncome', 'annualExpenses', 'liquidNetWorth',
  'cpfOA', 'cpfSA', 'cpfMA', 'srsBalance', 'srsAnnualContribution',
  'fireType', 'swr', 'fireNumberBasis', 'expectedReturn', 'usePortfolioReturn', 'inflation', 'expenseRatio', 'rebalanceFrequency',
  'cpfLifeStartAge', 'cpfLifePlan', 'cpfRetirementSum', 'cpfHousingMode', 'cpfHousingMonthly', 'cpfMortgageYearsLeft',
] as const

const DEFAULT_PROFILE: Omit<ProfileState, 'validationErrors'> = {
  currentAge: 30,
  retirementAge: 65,
  lifeExpectancy: 90,
  lifeStage: 'pre-fire',
  maritalStatus: 'single',
  residencyStatus: 'citizen',
  annualIncome: 72000,
  annualExpenses: 48000,
  liquidNetWorth: 0,
  cpfOA: 0,
  cpfSA: 0,
  cpfMA: 0,
  srsBalance: 0,
  srsAnnualContribution: 0,
  fireType: 'regular',
  swr: 0.04,
  fireNumberBasis: 'today',
  expectedReturn: 0.07,
  usePortfolioReturn: true,
  inflation: 0.025,
  expenseRatio: 0.003,
  rebalanceFrequency: 'annual',
  cpfLifeStartAge: 65,
  cpfLifePlan: 'standard',
  cpfRetirementSum: 'frs',
  cpfHousingMode: 'none',
  cpfHousingMonthly: 0,
  cpfMortgageYearsLeft: 25,
}

function extractProfileData(state: ProfileState & ProfileActions): Omit<ProfileState, 'validationErrors'> {
  const data: Record<string, unknown> = {}
  for (const key of PROFILE_DATA_KEYS) {
    data[key] = state[key]
  }
  return data as Omit<ProfileState, 'validationErrors'>
}

function computeValidationErrors(
  state: Omit<ProfileState, 'validationErrors'>
): ValidationErrors {
  const errors: ValidationErrors = {}

  for (const [field, value] of Object.entries(state)) {
    const err = validateProfileField(field, value)
    if (err) errors[field] = err
  }

  const crossErrors = validateProfileConsistency(state)
  Object.assign(errors, crossErrors)

  return errors
}

export const useProfileStore = create<ProfileState & ProfileActions>()(
  persist(
    (set) => ({
      ...DEFAULT_PROFILE,
      validationErrors: computeValidationErrors(DEFAULT_PROFILE),

      setField: (field, value) =>
        set((state) => {
          const stateData = extractProfileData(state)
          const updated = { ...stateData, [field]: value }
          return {
            [field]: value,
            validationErrors: computeValidationErrors(updated),
          }
        }),

      reset: () =>
        set({
          ...DEFAULT_PROFILE,
          validationErrors: computeValidationErrors(DEFAULT_PROFILE),
        }),
    }),
    {
      name: 'fireplanner-profile',
      version: 2,
      migrate: (persisted, version) => {
        const state = persisted as Record<string, unknown>
        if (version < 2) {
          state.cpfLifeStartAge = state.cpfLifeStartAge ?? 65
          state.cpfLifePlan = state.cpfLifePlan ?? 'standard'
          state.cpfRetirementSum = state.cpfRetirementSum ?? 'frs'
          state.cpfHousingMode = state.cpfHousingMode ?? 'none'
          state.cpfHousingMonthly = state.cpfHousingMonthly ?? 0
          // Migrate cpfHousingEndAge → cpfMortgageYearsLeft
          if (state.cpfHousingEndAge != null) {
            const age = (state.currentAge as number) ?? 30
            state.cpfMortgageYearsLeft = Math.max(0, (state.cpfHousingEndAge as number) - age)
            delete state.cpfHousingEndAge
          } else {
            state.cpfMortgageYearsLeft = state.cpfMortgageYearsLeft ?? 25
          }
        }
        return state
      },
      partialize: (state) => {
        const data: Record<string, unknown> = {}
        for (const key of PROFILE_DATA_KEYS) {
          data[key] = state[key]
        }
        return data
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          const stateData = extractProfileData(state)
          state.validationErrors = computeValidationErrors(stateData)
        }
      },
    }
  )
)
