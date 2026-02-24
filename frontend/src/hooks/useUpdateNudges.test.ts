import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useUpdateNudges } from './useUpdateNudges'
import { useUIStore } from '@/stores/useUIStore'
import { CHANGELOG, DATA_VINTAGE } from '@/lib/data/changelog'

// Mock migrationDetector — no real localStorage in test env
vi.mock('@/lib/migrationDetector', () => ({
  getDetectedMigrations: vi.fn(() => []),
}))

// Re-import so we can control the mock
import { getDetectedMigrations } from '@/lib/migrationDetector'
const mockGetDetectedMigrations = vi.mocked(getDetectedMigrations)

beforeEach(() => {
  useUIStore.setState({
    lastSeenChangelogDate: null,
    lastSeenDataVintage: null,
    dismissedNudges: [],
  })
  mockGetDetectedMigrations.mockReturnValue([])
})

describe('useUpdateNudges', () => {
  it('returns empty array when DATA_VINTAGE is current', () => {
    useUIStore.setState({ lastSeenDataVintage: DATA_VINTAGE })
    const { result } = renderHook(() => useUpdateNudges('section-cpf'))
    expect(result.current).toEqual([])
  })

  it('returns nudges for matching sections when vintage is stale', () => {
    useUIStore.setState({ lastSeenDataVintage: '2025-01-01' })
    const { result } = renderHook(() => useUpdateNudges('section-cpf'))
    // CHANGELOG has a CPF entry affecting section-cpf
    const cpfNudges = result.current.filter((n) => n.id.includes('section-cpf'))
    expect(cpfNudges.length).toBeGreaterThan(0)
  })

  it('returns empty for sections with no matching changelog entries', () => {
    useUIStore.setState({ lastSeenDataVintage: '2025-01-01' })
    const { result } = renderHook(() => useUpdateNudges('section-nonexistent'))
    // No changelog entries affect this section, and no migrations
    expect(result.current).toEqual([])
  })

  it('respects dismissedNudges filter', () => {
    useUIStore.setState({ lastSeenDataVintage: '2025-01-01' })

    // Find the first changelog entry that targets section-cpf
    const cpfEntry = CHANGELOG.find(
      (e) => e.affectedSections?.includes('section-cpf') && e.category === 'data-update'
    )
    if (!cpfEntry) return // skip if no matching entry

    const nudgeId = `changelog-${cpfEntry.date}-section-cpf`
    useUIStore.setState({ dismissedNudges: [nudgeId] })

    const { result } = renderHook(() => useUpdateNudges('section-cpf'))
    expect(result.current.find((n) => n.id === nudgeId)).toBeUndefined()
  })

  it('includes migration-detected nudges for matching sections', () => {
    mockGetDetectedMigrations.mockReturnValue([
      { storeKey: 'fireplanner-profile', fromVersion: 4, toVersion: 5 },
    ])
    const { result } = renderHook(() => useUpdateNudges('section-personal'))
    const migrationNudges = result.current.filter((n) => n.id.startsWith('migration-'))
    expect(migrationNudges.length).toBe(1)
    expect(migrationNudges[0].id).toBe('migration-fireplanner-profile-v5')
  })

  it('does not include migration nudges for non-matching sections', () => {
    mockGetDetectedMigrations.mockReturnValue([
      { storeKey: 'fireplanner-profile', fromVersion: 4, toVersion: 5 },
    ])
    const { result } = renderHook(() => useUpdateNudges('section-cpf'))
    const migrationNudges = result.current.filter((n) => n.id.startsWith('migration-'))
    expect(migrationNudges.length).toBe(0)
  })

  it('combines changelog and migration nudges', () => {
    useUIStore.setState({ lastSeenDataVintage: '2025-01-01' })
    mockGetDetectedMigrations.mockReturnValue([
      { storeKey: 'fireplanner-allocation', fromVersion: 2, toVersion: 3 },
    ])
    const { result } = renderHook(() => useUpdateNudges('section-allocation'))
    const changelogNudges = result.current.filter((n) => n.id.startsWith('changelog-'))
    const migrationNudges = result.current.filter((n) => n.id.startsWith('migration-'))
    expect(changelogNudges.length).toBeGreaterThan(0)
    expect(migrationNudges.length).toBe(1)
  })
})
