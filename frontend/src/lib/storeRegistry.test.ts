import { describe, it, expect } from 'vitest'
import { STORE_REGISTRY, migrateStoreData } from './storeRegistry'

describe('STORE_REGISTRY', () => {
  it('has entries for all 6 data stores', () => {
    const keys = Object.keys(STORE_REGISTRY)
    expect(keys).toContain('fireplanner-profile')
    expect(keys).toContain('fireplanner-income')
    expect(keys).toContain('fireplanner-allocation')
    expect(keys).toContain('fireplanner-simulation')
    expect(keys).toContain('fireplanner-withdrawal')
    expect(keys).toContain('fireplanner-property')
    expect(keys).toHaveLength(6)
  })

  it('each entry has currentVersion >= 1 and a migrate function', () => {
    for (const [, entry] of Object.entries(STORE_REGISTRY)) {
      expect(entry.currentVersion).toBeGreaterThanOrEqual(1)
      expect(typeof entry.migrate).toBe('function')
      expect(entry.defaults).toBeDefined()
    }
  })
})

describe('migrateStoreData', () => {
  it('returns data unchanged when version matches current', () => {
    const data = { state: { currentAge: 35 }, version: STORE_REGISTRY['fireplanner-profile'].currentVersion }
    const result = migrateStoreData('fireplanner-profile', data)
    expect(result).not.toBeNull()
    expect(result!.state.currentAge).toBe(35)
    expect(result!.version).toBe(STORE_REGISTRY['fireplanner-profile'].currentVersion)
  })

  it('migrates old profile data (adds missing fields)', () => {
    // Version 1 data — missing cpfLifeStartAge, healthcareConfig, etc.
    const data = { state: { currentAge: 30, retirementAge: 65 }, version: 1 }
    const result = migrateStoreData('fireplanner-profile', data)
    expect(result).not.toBeNull()
    expect(result!.version).toBe(STORE_REGISTRY['fireplanner-profile'].currentVersion)
    expect(result!.state.cpfLifeStartAge).toBe(65)
    expect(result!.state.healthcareConfig).toBeDefined()
    expect(result!.state.financialGoals).toEqual([])
  })

  it('returns null for unknown store key', () => {
    const data = { state: { foo: 'bar' }, version: 1 }
    const result = migrateStoreData('unknown-key', data)
    expect(result).toBeNull()
  })
})
