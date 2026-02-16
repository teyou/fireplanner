import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { IncomeState, IncomeStream, LifeEvent, ValidationErrors } from '@/lib/types'

interface IncomeActions {
  setField: <K extends keyof Omit<IncomeState, 'validationErrors' | 'incomeStreams' | 'lifeEvents'>>(
    field: K,
    value: IncomeState[K]
  ) => void
  addIncomeStream: (stream: IncomeStream) => void
  removeIncomeStream: (id: string) => void
  updateIncomeStream: (id: string, updates: Partial<IncomeStream>) => void
  addLifeEvent: (event: LifeEvent) => void
  removeLifeEvent: (id: string) => void
  reset: () => void
}

const INCOME_DATA_KEYS = [
  'salaryModel', 'annualSalary', 'salaryGrowthRate', 'employerCpfEnabled',
  'incomeStreams', 'lifeEvents',
] as const

const DEFAULT_INCOME: Omit<IncomeState, 'validationErrors'> = {
  salaryModel: 'simple',
  annualSalary: 72000,
  salaryGrowthRate: 0.03,
  employerCpfEnabled: true,
  incomeStreams: [],
  lifeEvents: [],
}

function extractIncomeData(state: IncomeState & IncomeActions): Omit<IncomeState, 'validationErrors'> {
  const data: Record<string, unknown> = {}
  for (const key of INCOME_DATA_KEYS) {
    data[key] = state[key]
  }
  return data as Omit<IncomeState, 'validationErrors'>
}

function computeValidationErrors(
  state: Omit<IncomeState, 'validationErrors'>
): ValidationErrors {
  const errors: ValidationErrors = {}

  if (state.annualSalary < 0) {
    errors.annualSalary = 'Salary must be non-negative'
  }

  if (state.salaryGrowthRate < -0.1 || state.salaryGrowthRate > 0.3) {
    errors.salaryGrowthRate = 'Growth rate must be between -10% and 30%'
  }

  return errors
}

export const useIncomeStore = create<IncomeState & IncomeActions>()(
  persist(
    (set) => ({
      ...DEFAULT_INCOME,
      validationErrors: computeValidationErrors(DEFAULT_INCOME),

      setField: (field, value) =>
        set((state) => {
          const stateData = extractIncomeData(state)
          const updated = { ...stateData, [field]: value }
          return {
            [field]: value,
            validationErrors: computeValidationErrors(updated),
          }
        }),

      addIncomeStream: (stream) =>
        set((state) => ({
          incomeStreams: [...state.incomeStreams, stream],
        })),

      removeIncomeStream: (id) =>
        set((state) => ({
          incomeStreams: state.incomeStreams.filter((s) => s.id !== id),
        })),

      updateIncomeStream: (id, updates) =>
        set((state) => ({
          incomeStreams: state.incomeStreams.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),

      addLifeEvent: (event) =>
        set((state) => ({
          lifeEvents: [...state.lifeEvents, event],
        })),

      removeLifeEvent: (id) =>
        set((state) => ({
          lifeEvents: state.lifeEvents.filter((e) => e.id !== id),
        })),

      reset: () =>
        set({
          ...DEFAULT_INCOME,
          validationErrors: computeValidationErrors(DEFAULT_INCOME),
        }),
    }),
    {
      name: 'fireplanner-income',
      version: 1,
      partialize: (state) => {
        const data: Record<string, unknown> = {}
        for (const key of INCOME_DATA_KEYS) {
          data[key] = state[key]
        }
        return data
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          const stateData = extractIncomeData(state)
          state.validationErrors = computeValidationErrors(stateData)
        }
      },
    }
  )
)
