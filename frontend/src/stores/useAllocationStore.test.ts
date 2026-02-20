import { describe, it, expect, beforeEach } from 'vitest'
import { useAllocationStore } from './useAllocationStore'
import { ALLOCATION_TEMPLATES } from '@/lib/data/historicalReturns'

beforeEach(() => {
  useAllocationStore.getState().reset()
})

describe('useAllocationStore', () => {
  describe('initial state', () => {
    it('has balanced template weights', () => {
      const state = useAllocationStore.getState()
      expect(state.currentWeights).toEqual([...ALLOCATION_TEMPLATES.balanced])
      expect(state.selectedTemplate).toBe('balanced')
    })

    it('has conservative target weights', () => {
      const state = useAllocationStore.getState()
      expect(state.targetWeights).toEqual([...ALLOCATION_TEMPLATES.conservative])
    })

    it('has null return/stdDev overrides', () => {
      const state = useAllocationStore.getState()
      expect(state.returnOverrides).toEqual(Array(8).fill(null))
      expect(state.stdDevOverrides).toEqual(Array(8).fill(null))
    })

    it('has glide path disabled', () => {
      expect(useAllocationStore.getState().glidePathConfig.enabled).toBe(false)
    })

    it('has no validation errors', () => {
      expect(Object.keys(useAllocationStore.getState().validationErrors)).toHaveLength(0)
    })
  })

  describe('setCurrentWeights', () => {
    it('updates weights and sets template to custom', () => {
      const weights = [0.5, 0.1, 0.1, 0.1, 0.05, 0.05, 0.05, 0.05]
      useAllocationStore.getState().setCurrentWeights(weights)
      const state = useAllocationStore.getState()
      expect(state.currentWeights).toEqual(weights)
      expect(state.selectedTemplate).toBe('custom')
    })

    it('produces validation error when weights do not sum to 1', () => {
      const weights = [0.5, 0.5, 0.1, 0, 0, 0, 0, 0] // sum = 1.1
      useAllocationStore.getState().setCurrentWeights(weights)
      expect(useAllocationStore.getState().validationErrors.currentWeights).toBeTruthy()
    })
  })

  describe('applyTemplate', () => {
    it('applies conservative template to current weights', () => {
      useAllocationStore.getState().applyTemplate('conservative')
      const state = useAllocationStore.getState()
      expect(state.currentWeights).toEqual([...ALLOCATION_TEMPLATES.conservative])
      expect(state.selectedTemplate).toBe('conservative')
    })

    it('applies aggressive template to current weights', () => {
      useAllocationStore.getState().applyTemplate('aggressive')
      const state = useAllocationStore.getState()
      expect(state.currentWeights).toEqual([...ALLOCATION_TEMPLATES.aggressive])
      expect(state.selectedTemplate).toBe('aggressive')
    })

    it('applies template to target weights when specified', () => {
      useAllocationStore.getState().applyTemplate('aggressive', 'target')
      expect(useAllocationStore.getState().targetWeights).toEqual([...ALLOCATION_TEMPLATES.aggressive])
      // selected template should not change when applying to target
      expect(useAllocationStore.getState().selectedTemplate).toBe('balanced')
    })
  })

  describe('overrides', () => {
    it('sets return override for single asset', () => {
      useAllocationStore.getState().setReturnOverride(0, 0.10)
      const overrides = useAllocationStore.getState().returnOverrides
      expect(overrides[0]).toBe(0.10)
      expect(overrides[1]).toBeNull()
    })

    it('sets std dev override for single asset', () => {
      useAllocationStore.getState().setStdDevOverride(2, 0.20)
      const overrides = useAllocationStore.getState().stdDevOverrides
      expect(overrides[2]).toBe(0.20)
      expect(overrides[0]).toBeNull()
    })

    it('clears override by setting null', () => {
      useAllocationStore.getState().setReturnOverride(0, 0.10)
      useAllocationStore.getState().setReturnOverride(0, null)
      expect(useAllocationStore.getState().returnOverrides[0]).toBeNull()
    })
  })

  describe('glide path', () => {
    it('enables glide path', () => {
      useAllocationStore.getState().setGlidePathConfig({
        enabled: true, method: 'linear', startAge: 55, endAge: 65,
      })
      expect(useAllocationStore.getState().glidePathConfig.enabled).toBe(true)
    })

    it('sets glide path method', () => {
      useAllocationStore.getState().setGlidePathConfig({
        enabled: true, method: 'slowStart', startAge: 55, endAge: 65,
      })
      expect(useAllocationStore.getState().glidePathConfig.method).toBe('slowStart')
    })

    it('validates startAge >= endAge when enabled', () => {
      useAllocationStore.getState().setGlidePathConfig({
        enabled: true, method: 'linear', startAge: 70, endAge: 60,
      })
      expect(useAllocationStore.getState().validationErrors['glidePathConfig.startAge']).toBeTruthy()
    })

    it('no error for startAge >= endAge when disabled', () => {
      useAllocationStore.getState().setGlidePathConfig({
        enabled: false, method: 'linear', startAge: 70, endAge: 60,
      })
      expect(useAllocationStore.getState().validationErrors['glidePathConfig.startAge']).toBeUndefined()
    })
  })

  describe('reset', () => {
    it('clears overrides and restores template', () => {
      useAllocationStore.getState().setReturnOverride(0, 0.10)
      useAllocationStore.getState().applyTemplate('aggressive')
      useAllocationStore.getState().reset()
      const state = useAllocationStore.getState()
      expect(state.selectedTemplate).toBe('balanced')
      expect(state.returnOverrides).toEqual(Array(8).fill(null))
      expect(state.currentWeights).toEqual([...ALLOCATION_TEMPLATES.balanced])
    })
  })
})
