import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PropertyState, ValidationErrors } from '@/lib/types'

interface PropertyActions {
  setField: <K extends keyof Omit<PropertyState, 'validationErrors'>>(
    field: K,
    value: PropertyState[K]
  ) => void
  reset: () => void
}

const PROPERTY_DATA_KEYS = [
  'propertyType', 'purchasePrice', 'leaseYears', 'appreciationRate',
  'rentalYield', 'mortgageRate', 'mortgageTerm', 'ltv',
  'residencyForAbsd', 'propertyCount',
  'ownsProperty', 'existingPropertyValue', 'existingMortgageBalance',
  'existingMonthlyPayment', 'existingRentalIncome',
] as const

const DEFAULT_PROPERTY: Omit<PropertyState, 'validationErrors'> = {
  propertyType: 'condo',
  purchasePrice: 1500000,
  leaseYears: 99,
  appreciationRate: 0.03,
  rentalYield: 0.03,
  mortgageRate: 0.035,
  mortgageTerm: 25,
  ltv: 0.75,
  residencyForAbsd: 'citizen',
  propertyCount: 0,
  ownsProperty: false,
  existingPropertyValue: 0,
  existingMortgageBalance: 0,
  existingMonthlyPayment: 0,
  existingRentalIncome: 0,
}

function extractPropertyData(
  state: PropertyState & PropertyActions
): Omit<PropertyState, 'validationErrors'> {
  const data: Record<string, unknown> = {}
  for (const key of PROPERTY_DATA_KEYS) {
    data[key] = state[key]
  }
  return data as Omit<PropertyState, 'validationErrors'>
}

function computeValidationErrors(
  state: Omit<PropertyState, 'validationErrors'>
): ValidationErrors {
  const errors: ValidationErrors = {}

  if (state.purchasePrice <= 0) {
    errors.purchasePrice = 'Purchase price must be positive'
  }
  if (state.leaseYears < 1 || state.leaseYears > 999) {
    errors.leaseYears = 'Lease must be between 1 and 999 years'
  }
  if (state.mortgageRate < 0 || state.mortgageRate > 0.15) {
    errors.mortgageRate = 'Mortgage rate must be between 0% and 15%'
  }
  if (state.mortgageTerm < 1 || state.mortgageTerm > 35) {
    errors.mortgageTerm = 'Mortgage term must be between 1 and 35 years'
  }
  if (state.ltv < 0 || state.ltv > 1) {
    errors.ltv = 'LTV must be between 0% and 100%'
  }

  if (state.ownsProperty) {
    if (state.existingPropertyValue < 0) {
      errors.existingPropertyValue = 'Property value cannot be negative'
    }
    if (state.existingMortgageBalance < 0) {
      errors.existingMortgageBalance = 'Mortgage balance cannot be negative'
    }
    if (state.existingMonthlyPayment < 0) {
      errors.existingMonthlyPayment = 'Monthly payment cannot be negative'
    }
    if (state.existingRentalIncome < 0) {
      errors.existingRentalIncome = 'Rental income cannot be negative'
    }
  }

  return errors
}

export const usePropertyStore = create<PropertyState & PropertyActions>()(
  persist(
    (set) => ({
      ...DEFAULT_PROPERTY,
      validationErrors: computeValidationErrors(DEFAULT_PROPERTY),

      setField: (field, value) =>
        set((state) => {
          const stateData = extractPropertyData(state)
          const updated = { ...stateData, [field]: value }
          return {
            [field]: value,
            validationErrors: computeValidationErrors(updated),
          }
        }),

      reset: () =>
        set({
          ...DEFAULT_PROPERTY,
          validationErrors: computeValidationErrors(DEFAULT_PROPERTY),
        }),
    }),
    {
      name: 'fireplanner-property',
      version: 2,
      migrate: (persisted, version) => {
        const state = persisted as Record<string, unknown>
        if (version < 2) {
          state.ownsProperty = state.ownsProperty ?? false
          state.existingPropertyValue = state.existingPropertyValue ?? 0
          state.existingMortgageBalance = state.existingMortgageBalance ?? 0
          state.existingMonthlyPayment = state.existingMonthlyPayment ?? 0
          state.existingRentalIncome = state.existingRentalIncome ?? 0
        }
        return state
      },
      partialize: (state) => {
        const data: Record<string, unknown> = {}
        for (const key of PROPERTY_DATA_KEYS) {
          data[key] = state[key]
        }
        return data
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          const stateData = extractPropertyData(state)
          state.validationErrors = computeValidationErrors(stateData)
        }
      },
    }
  )
)
