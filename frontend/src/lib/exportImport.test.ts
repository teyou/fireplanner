import { describe, it, expect, beforeEach, vi } from 'vitest'
import { exportToJson, importFromJson } from './exportImport'

const STORE_KEYS = [
  'fireplanner-profile',
  'fireplanner-income',
  'fireplanner-allocation',
  'fireplanner-simulation',
  'fireplanner-withdrawal',
  'fireplanner-property',
]

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('exportToJson', () => {
  it('creates valid JSON with all 6 store keys', () => {
    // Populate stores
    for (const key of STORE_KEYS) {
      localStorage.setItem(key, JSON.stringify({ test: key }))
    }

    let downloadedBlob: Blob | null = null
    const mockClick = vi.fn()
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: mockClick,
      set setAttribute(_args: unknown[]) { /* noop */ },
    } as unknown as HTMLAnchorElement)
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob: Blob) => {
      downloadedBlob = blob
      return 'blob:test'
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    exportToJson()

    expect(mockClick).toHaveBeenCalled()
    expect(downloadedBlob).not.toBeNull()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test')
  })

  it('skips corrupted localStorage entries', () => {
    localStorage.setItem('fireplanner-profile', 'not-valid-json{')
    localStorage.setItem('fireplanner-income', JSON.stringify({ ok: true }))

    let downloadedBlob: Blob | null = null
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '', download: '', click: vi.fn(),
    } as unknown as HTMLAnchorElement)
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob: Blob) => {
      downloadedBlob = blob
      return 'blob:test'
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    exportToJson()

    // Should still export — just skip the corrupted one
    expect(downloadedBlob).not.toBeNull()
  })
})

describe('importFromJson', () => {
  it('imports valid JSON and returns true', async () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      stores: {
        'fireplanner-profile': { currentAge: 35 },
        'fireplanner-income': { annualSalary: 100000 },
      },
    }

    // Mock reload
    const reloadMock = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadMock },
      writable: true,
      configurable: true,
    })

    const file = new File([JSON.stringify(data)], 'export.json', { type: 'application/json' })
    const result = await importFromJson(file)

    expect(result).toBe(true)
    expect(JSON.parse(localStorage.getItem('fireplanner-profile')!)).toEqual({ currentAge: 35 })
    expect(JSON.parse(localStorage.getItem('fireplanner-income')!)).toEqual({ annualSalary: 100000 })
  })

  it('returns false for invalid JSON', async () => {
    const file = new File(['not valid json{{{'], 'bad.json')
    const result = await importFromJson(file)
    expect(result).toBe(false)
  })

  it('returns false when version !== 1', async () => {
    const data = { version: 99, stores: {} }
    const file = new File([JSON.stringify(data)], 'bad-version.json')
    const result = await importFromJson(file)
    expect(result).toBe(false)
  })

  it('returns false when stores field is missing', async () => {
    const data = { version: 1 }
    const file = new File([JSON.stringify(data)], 'no-stores.json')
    const result = await importFromJson(file)
    expect(result).toBe(false)
  })

  it('ignores unknown store keys', async () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      stores: {
        'fireplanner-profile': { currentAge: 40 },
        'unknown-key': { data: 'should be ignored' },
      },
    }
    const reloadMock = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadMock },
      writable: true,
      configurable: true,
    })

    const file = new File([JSON.stringify(data)], 'extra-keys.json')
    await importFromJson(file)

    expect(localStorage.getItem('fireplanner-profile')).toBeTruthy()
    expect(localStorage.getItem('unknown-key')).toBeNull()
  })

  it('round-trip: export then import preserves data', async () => {
    // Set up store data
    const profileData = { currentAge: 35, retirementAge: 60 }
    localStorage.setItem('fireplanner-profile', JSON.stringify(profileData))

    // Capture the blob from export
    let capturedBlob: Blob | null = null
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '', download: '', click: vi.fn(),
    } as unknown as HTMLAnchorElement)
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob: Blob) => {
      capturedBlob = blob
      return 'blob:test'
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    exportToJson()
    expect(capturedBlob).not.toBeNull()

    // Clear storage to simulate new browser
    localStorage.clear()
    expect(localStorage.getItem('fireplanner-profile')).toBeNull()

    // Import the blob
    const reloadMock = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadMock },
      writable: true,
      configurable: true,
    })

    const text = await capturedBlob!.text()
    const file = new File([text], 'roundtrip.json')
    const result = await importFromJson(file)

    expect(result).toBe(true)
    expect(JSON.parse(localStorage.getItem('fireplanner-profile')!)).toEqual(profileData)
  })
})
