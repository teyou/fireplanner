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

  expectedReturn: 0.07,
  inflation: 0.025,
  expenseRatio: 0.003,
  rebalanceFrequency: 'annual',
}

function computeValidationErrors(
  state: Omit<ProfileState, 'validationErrors'>
): ValidationErrors {
  const errors: ValidationErrors = {}

  // Per-field validation
  for (const [field, value] of Object.entries(state)) {
    const err = validateProfileField(field, value)
    if (err) errors[field] = err
  }

  // Cross-field consistency
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
          const updated = { ...state, [field]: value }
          const { validationErrors: _prev, setField: _sf, reset: _r, ...stateOnly } = updated
          return {
            [field]: value,
            validationErrors: computeValidationErrors(stateOnly as Omit<ProfileState, 'validationErrors'>),
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
      version: 1,
      partialize: (state) => {
        const { validationErrors: _ve, setField: _sf, reset: _r, ...persisted } = state
        return persisted as Omit<ProfileState, 'validationErrors'>
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          const { validationErrors: _ve, setField: _sf, reset: _r, ...stateOnly } = state
          state.validationErrors = computeValidationErrors(
            stateOnly as Omit<ProfileState, 'validationErrors'>
          )
        }
      },
    }
  )
)
