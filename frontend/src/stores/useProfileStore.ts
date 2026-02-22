import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProfileState, ParentSupport, RetirementWithdrawal, HealthcareConfig, ValidationErrors } from '@/lib/types'
import { validateProfileField } from '@/lib/validation/schemas'
import { validateProfileConsistency } from '@/lib/validation/rules'

interface ProfileActions {
  setField: <K extends keyof Omit<ProfileState, 'validationErrors'>>(
    field: K,
    value: ProfileState[K]
  ) => void
  addParentSupport: (entry: ParentSupport) => void
  removeParentSupport: (id: string) => void
  updateParentSupport: (id: string, updates: Partial<Omit<ParentSupport, 'id'>>) => void
  addRetirementWithdrawal: (entry: RetirementWithdrawal) => void
  removeRetirementWithdrawal: (id: string) => void
  updateRetirementWithdrawal: (id: string, updates: Partial<Omit<RetirementWithdrawal, 'id'>>) => void
  reset: () => void
}

const PROFILE_DATA_KEYS = [
  'currentAge', 'retirementAge', 'lifeExpectancy', 'lifeStage', 'maritalStatus',
  'residencyStatus', 'annualIncome', 'annualExpenses', 'liquidNetWorth',
  'cpfOA', 'cpfSA', 'cpfMA', 'cpfRA', 'srsBalance', 'srsAnnualContribution', 'srsInvestmentReturn', 'srsDrawdownStartAge',
  'fireType', 'swr', 'fireNumberBasis', 'retirementSpendingAdjustment',
  'expectedReturn', 'usePortfolioReturn', 'inflation', 'expenseRatio', 'rebalanceFrequency',
  'retirementPhase', 'cpfLifeActualMonthlyPayout',
  'cpfLifeStartAge', 'cpfLifePlan', 'cpfRetirementSum',
  // cpfHousingMode, cpfHousingMonthly, cpfMortgageYearsLeft — DEPRECATED: now derived from property store
  'parentSupportEnabled', 'parentSupport',
  'healthcareConfig',
  'retirementWithdrawals',
] as const

const DEFAULT_HEALTHCARE_CONFIG: HealthcareConfig = {
  enabled: false,
  mediShieldLifeEnabled: true,
  ispTier: 'none',
  careShieldLifeEnabled: true,
  oopBaseAmount: 1200,
  oopModel: 'age-curve',
  oopInflationRate: 0.03,
  oopReferenceAge: 30,
  oopCurveVariant: 'study-backed',
  mediSaveTopUpAnnual: 0,
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
  cpfRA: 0,
  srsBalance: 0,
  srsAnnualContribution: 0,
  srsInvestmentReturn: 0.04,
  srsDrawdownStartAge: 63,
  fireType: 'regular',
  swr: 0.04,
  fireNumberBasis: 'fireAge',
  retirementSpendingAdjustment: 1.0,
  expectedReturn: 0.07,
  usePortfolioReturn: true,
  inflation: 0.025,
  expenseRatio: 0.003,
  rebalanceFrequency: 'annual',
  retirementPhase: null,
  cpfLifeActualMonthlyPayout: 0,
  cpfLifeStartAge: 65,
  cpfLifePlan: 'standard',
  cpfRetirementSum: 'frs',
  // DEPRECATED: CPF housing now sourced from property store. Kept for backward compat on load.
  cpfHousingMode: 'none',
  cpfHousingMonthly: 0,
  cpfMortgageYearsLeft: 25,
  parentSupportEnabled: false,
  parentSupport: [],
  healthcareConfig: DEFAULT_HEALTHCARE_CONFIG,
  retirementWithdrawals: [],
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

          // Sync oopReferenceAge when currentAge changes (if user hasn't customized it away from old currentAge)
          if (field === 'currentAge' && typeof value === 'number') {
            const hc = updated.healthcareConfig
            if (hc.oopReferenceAge === stateData.currentAge) {
              updated.healthcareConfig = { ...hc, oopReferenceAge: value }
            }
          }

          return {
            ...updated,
            validationErrors: computeValidationErrors(updated),
          }
        }),

      addParentSupport: (entry: ParentSupport) =>
        set((state) => {
          const stateData = extractProfileData(state)
          const updated = { ...stateData, parentSupport: [...stateData.parentSupport, entry] }
          return {
            parentSupport: updated.parentSupport,
            validationErrors: computeValidationErrors(updated),
          }
        }),

      removeParentSupport: (id: string) =>
        set((state) => {
          const stateData = extractProfileData(state)
          const updated = { ...stateData, parentSupport: stateData.parentSupport.filter((e) => e.id !== id) }
          return {
            parentSupport: updated.parentSupport,
            validationErrors: computeValidationErrors(updated),
          }
        }),

      updateParentSupport: (id: string, updates: Partial<Omit<ParentSupport, 'id'>>) =>
        set((state) => {
          const stateData = extractProfileData(state)
          const updated = {
            ...stateData,
            parentSupport: stateData.parentSupport.map((e) =>
              e.id === id ? { ...e, ...updates } : e
            ),
          }
          return {
            parentSupport: updated.parentSupport,
            validationErrors: computeValidationErrors(updated),
          }
        }),

      addRetirementWithdrawal: (entry: RetirementWithdrawal) =>
        set((state) => {
          const stateData = extractProfileData(state)
          const updated = { ...stateData, retirementWithdrawals: [...stateData.retirementWithdrawals, entry] }
          return {
            retirementWithdrawals: updated.retirementWithdrawals,
            validationErrors: computeValidationErrors(updated),
          }
        }),

      removeRetirementWithdrawal: (id: string) =>
        set((state) => {
          const stateData = extractProfileData(state)
          const updated = { ...stateData, retirementWithdrawals: stateData.retirementWithdrawals.filter((e) => e.id !== id) }
          return {
            retirementWithdrawals: updated.retirementWithdrawals,
            validationErrors: computeValidationErrors(updated),
          }
        }),

      updateRetirementWithdrawal: (id: string, updates: Partial<Omit<RetirementWithdrawal, 'id'>>) =>
        set((state) => {
          const stateData = extractProfileData(state)
          const updated = {
            ...stateData,
            retirementWithdrawals: stateData.retirementWithdrawals.map((e) =>
              e.id === id ? { ...e, ...updates } : e
            ),
          }
          return {
            retirementWithdrawals: updated.retirementWithdrawals,
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
      version: 13,
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
        if (version < 3) {
          state.retirementSpendingAdjustment = state.retirementSpendingAdjustment ?? 1.0
        }
        if (version < 4) {
          state.retirementPhase = state.retirementPhase ?? null
          state.cpfLifeActualMonthlyPayout = state.cpfLifeActualMonthlyPayout ?? 0
        }
        if (version < 5) {
          state.parentSupportEnabled = state.parentSupportEnabled ?? false
          state.parentSupport = state.parentSupport ?? []
        }
        if (version < 6) {
          state.healthcareConfig = state.healthcareConfig ?? DEFAULT_HEALTHCARE_CONFIG
        }
        if (version < 7) {
          const hc = state.healthcareConfig as Record<string, unknown> | undefined
          if (hc) {
            hc.oopInflationRate = hc.oopInflationRate ?? 0.03
            hc.oopReferenceAge = hc.oopReferenceAge ?? (state.currentAge as number ?? 30)
          }
        }
        if (version < 8) {
          state.retirementWithdrawals = state.retirementWithdrawals ?? []
        }
        if (version < 9) {
          state.cpfRA = state.cpfRA ?? 0
        }
        if (version < 10) {
          const rws = state.retirementWithdrawals as Array<Record<string, unknown>> | undefined
          state.retirementWithdrawals = (rws ?? []).map(rw => ({
            ...rw,
            durationYears: rw.durationYears ?? 1,
          }))
        }
        if (version < 11) {
          state.srsInvestmentReturn ??= 0.04
          state.srsDrawdownStartAge ??= 63
        }
        if (version < 12) {
          const hc = state.healthcareConfig as Record<string, unknown> | undefined
          if (hc) {
            hc.oopCurveVariant = hc.oopCurveVariant ?? 'study-backed'
          }
        }
        // v13: ISP downgrade fields are optional (undefined = no downgrade), no migration needed
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
