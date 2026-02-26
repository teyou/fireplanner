import { describe, it, expect } from 'vitest'
import { getDetectedMigrations } from './migrationDetector'

describe('getDetectedMigrations', () => {
  it('returns empty array when no pre-hydration versions exist', () => {
    const result = getDetectedMigrations({
      'fireplanner-profile': { currentVersion: 5 },
    })
    expect(result).toEqual([])
  })

  it('returns empty array for empty registry', () => {
    const result = getDetectedMigrations({})
    expect(result).toEqual([])
  })

  it('DetectedMigration type has correct shape', () => {
    const migration = { storeKey: 'test', fromVersion: 1, toVersion: 2 }
    expect(migration.storeKey).toBe('test')
    expect(migration.fromVersion).toBe(1)
    expect(migration.toVersion).toBe(2)
  })
})
