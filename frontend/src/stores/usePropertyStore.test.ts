import { describe, it, expect, beforeEach } from 'vitest'
import { usePropertyStore } from './usePropertyStore'

describe('usePropertyStore', () => {
  beforeEach(() => {
    usePropertyStore.getState().reset()
  })

  it('has ownershipPercent defaulting to 1.0', () => {
    const state = usePropertyStore.getState()
    expect(state.ownershipPercent).toBe(1)
  })

  it('validates ownershipPercent range', () => {
    const { setField } = usePropertyStore.getState()

    // ownershipPercent validation only runs when ownsProperty is true
    setField('ownsProperty', true)
    setField('ownershipPercent', 0.5)
    expect(usePropertyStore.getState().ownershipPercent).toBe(0.5)
    expect(usePropertyStore.getState().validationErrors.ownershipPercent).toBeUndefined()

    setField('ownershipPercent', 0)
    expect(usePropertyStore.getState().validationErrors.ownershipPercent).toBeDefined()

    setField('ownershipPercent', 1.5)
    expect(usePropertyStore.getState().validationErrors.ownershipPercent).toBeDefined()

    // Edge: exactly 1.0 should be valid
    setField('ownershipPercent', 1)
    expect(usePropertyStore.getState().validationErrors.ownershipPercent).toBeUndefined()

    // Edge: small positive value should be valid
    setField('ownershipPercent', 0.01)
    expect(usePropertyStore.getState().validationErrors.ownershipPercent).toBeUndefined()
  })
})
