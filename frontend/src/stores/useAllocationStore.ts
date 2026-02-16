import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AllocationState, AllocationTemplate, GlidePathConfig, ValidationErrors } from '@/lib/types'
import { validateAllocationField } from '@/lib/validation/schemas'
import { ALLOCATION_TEMPLATES } from '@/lib/data/historicalReturns'

interface AllocationActions {
  setCurrentWeights: (weights: number[]) => void
  setTargetWeights: (weights: number[]) => void
  applyTemplate: (template: Exclude<AllocationTemplate, 'custom'>, target?: 'current' | 'target') => void
  setReturnOverride: (index: number, value: number | null) => void
  setStdDevOverride: (index: number, value: number | null) => void
  setGlidePathConfig: (config: GlidePathConfig) => void
  setField: <K extends keyof Omit<AllocationState, 'validationErrors'>>(
    field: K,
    value: AllocationState[K]
  ) => void
  reset: () => void
}

const ALLOCATION_DATA_KEYS = [
  'currentWeights', 'targetWeights', 'selectedTemplate',
  'returnOverrides', 'stdDevOverrides', 'glidePathConfig',
] as const

const DEFAULT_ALLOCATION: Omit<AllocationState, 'validationErrors'> = {
  currentWeights: [...ALLOCATION_TEMPLATES.balanced],
  targetWeights: [...ALLOCATION_TEMPLATES.conservative],
  selectedTemplate: 'balanced',
  returnOverrides: [null, null, null, null, null, null, null, null],
  stdDevOverrides: [null, null, null, null, null, null, null, null],
  glidePathConfig: {
    enabled: false,
    method: 'linear',
    startAge: 60,
    endAge: 75,
  },
}

function extractAllocationData(
  state: AllocationState & AllocationActions
): Omit<AllocationState, 'validationErrors'> {
  const data: Record<string, unknown> = {}
  for (const key of ALLOCATION_DATA_KEYS) {
    data[key] = state[key]
  }
  return data as Omit<AllocationState, 'validationErrors'>
}

function computeValidationErrors(
  state: Omit<AllocationState, 'validationErrors'>
): ValidationErrors {
  const errors: ValidationErrors = {}

  const cwErr = validateAllocationField('currentWeights', state.currentWeights)
  if (cwErr) errors.currentWeights = cwErr

  const twErr = validateAllocationField('targetWeights', state.targetWeights)
  if (twErr) errors.targetWeights = twErr

  // Individual weight bounds
  for (let i = 0; i < state.currentWeights.length; i++) {
    const w = state.currentWeights[i]
    if (w < 0) errors[`currentWeight_${i}`] = 'Weight cannot be negative'
    if (w > 1) errors[`currentWeight_${i}`] = 'Weight cannot exceed 100%'
  }

  for (let i = 0; i < state.targetWeights.length; i++) {
    const w = state.targetWeights[i]
    if (w < 0) errors[`targetWeight_${i}`] = 'Weight cannot be negative'
    if (w > 1) errors[`targetWeight_${i}`] = 'Weight cannot exceed 100%'
  }

  // Glide path validation
  if (state.glidePathConfig.enabled) {
    if (state.glidePathConfig.startAge >= state.glidePathConfig.endAge) {
      errors['glidePathConfig.startAge'] = 'Start age must be less than end age'
    }
  }

  return errors
}

export const useAllocationStore = create<AllocationState & AllocationActions>()(
  persist(
    (set) => ({
      ...DEFAULT_ALLOCATION,
      validationErrors: computeValidationErrors(DEFAULT_ALLOCATION),

      setCurrentWeights: (weights) =>
        set((state) => {
          const stateData = extractAllocationData(state)
          const updated = { ...stateData, currentWeights: weights, selectedTemplate: 'custom' as AllocationTemplate }
          return {
            currentWeights: weights,
            selectedTemplate: 'custom',
            validationErrors: computeValidationErrors(updated),
          }
        }),

      setTargetWeights: (weights) =>
        set((state) => {
          const stateData = extractAllocationData(state)
          const updated = { ...stateData, targetWeights: weights }
          return {
            targetWeights: weights,
            validationErrors: computeValidationErrors(updated),
          }
        }),

      applyTemplate: (template, target = 'current') =>
        set((state) => {
          const templateWeights = [...ALLOCATION_TEMPLATES[template]]
          const stateData = extractAllocationData(state)
          if (target === 'current') {
            const updated = { ...stateData, currentWeights: templateWeights, selectedTemplate: template }
            return {
              currentWeights: templateWeights,
              selectedTemplate: template,
              validationErrors: computeValidationErrors(updated),
            }
          } else {
            const updated = { ...stateData, targetWeights: templateWeights }
            return {
              targetWeights: templateWeights,
              validationErrors: computeValidationErrors(updated),
            }
          }
        }),

      setReturnOverride: (index, value) =>
        set((state) => {
          const overrides = [...state.returnOverrides]
          overrides[index] = value
          const stateData = extractAllocationData(state)
          const updated = { ...stateData, returnOverrides: overrides }
          return {
            returnOverrides: overrides,
            validationErrors: computeValidationErrors(updated),
          }
        }),

      setStdDevOverride: (index, value) =>
        set((state) => {
          const overrides = [...state.stdDevOverrides]
          overrides[index] = value
          const stateData = extractAllocationData(state)
          const updated = { ...stateData, stdDevOverrides: overrides }
          return {
            stdDevOverrides: overrides,
            validationErrors: computeValidationErrors(updated),
          }
        }),

      setGlidePathConfig: (config) =>
        set((state) => {
          const stateData = extractAllocationData(state)
          const updated = { ...stateData, glidePathConfig: config }
          return {
            glidePathConfig: config,
            validationErrors: computeValidationErrors(updated),
          }
        }),

      setField: (field, value) =>
        set((state) => {
          const stateData = extractAllocationData(state)
          const updated = { ...stateData, [field]: value }
          return {
            [field]: value,
            validationErrors: computeValidationErrors(updated),
          }
        }),

      reset: () =>
        set({
          ...DEFAULT_ALLOCATION,
          validationErrors: computeValidationErrors(DEFAULT_ALLOCATION),
        }),
    }),
    {
      name: 'fireplanner-allocation',
      version: 1,
      partialize: (state) => {
        const data: Record<string, unknown> = {}
        for (const key of ALLOCATION_DATA_KEYS) {
          data[key] = state[key]
        }
        return data
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          const stateData = extractAllocationData(state)
          state.validationErrors = computeValidationErrors(stateData)
        }
      },
    }
  )
)
