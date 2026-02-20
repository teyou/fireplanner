import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  encodeStoresForUrl,
  decodeStoresFromUrl,
  generateShareUrl,
  applyStoreData,
  getPlanFromUrl,
  stripPlanFromUrl,
} from './shareUrl'

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('encodeStoresForUrl', () => {
  it('produces a non-empty compressed string', () => {
    localStorage.setItem('fireplanner-profile', JSON.stringify({ currentAge: 30 }))
    const encoded = encodeStoresForUrl()
    expect(encoded).toBeTruthy()
    expect(typeof encoded).toBe('string')
    expect(encoded.length).toBeGreaterThan(0)
  })

  it('produces URL-safe characters', () => {
    localStorage.setItem('fireplanner-profile', JSON.stringify({ currentAge: 30 }))
    const encoded = encodeStoresForUrl()
    // lz-string encodeURIComponent output should be URL-safe
    expect(encoded).not.toContain(' ')
  })

  it('skips corrupted localStorage entries', () => {
    localStorage.setItem('fireplanner-profile', 'invalid{json')
    localStorage.setItem('fireplanner-income', JSON.stringify({ salary: 72000 }))
    const encoded = encodeStoresForUrl()
    const decoded = decodeStoresFromUrl(encoded)
    expect(decoded).not.toBeNull()
    expect(decoded!['fireplanner-profile']).toBeUndefined()
    expect(decoded!['fireplanner-income']).toEqual({ salary: 72000 })
  })
})

describe('decodeStoresFromUrl', () => {
  it('decodes valid compressed string', () => {
    localStorage.setItem('fireplanner-profile', JSON.stringify({ currentAge: 35 }))
    const encoded = encodeStoresForUrl()
    const decoded = decodeStoresFromUrl(encoded)
    expect(decoded).not.toBeNull()
    expect(decoded!['fireplanner-profile']).toEqual({ currentAge: 35 })
  })

  it('returns null for empty string', () => {
    expect(decodeStoresFromUrl('')).toBeNull()
  })

  it('returns null for invalid compressed string', () => {
    expect(decodeStoresFromUrl('totally-invalid-data-xyz')).toBeNull()
  })

  it('returns null for valid JSON without expected keys', () => {
    // Manually encode something without any store keys
    const { compressToEncodedURIComponent } = require('lz-string')
    const encoded = compressToEncodedURIComponent(JSON.stringify({ randomKey: true }))
    expect(decodeStoresFromUrl(encoded)).toBeNull()
  })

  it('round-trip: encode then decode matches', () => {
    const profileData = { currentAge: 40, retirementAge: 60 }
    const incomeData = { annualSalary: 120000 }
    localStorage.setItem('fireplanner-profile', JSON.stringify(profileData))
    localStorage.setItem('fireplanner-income', JSON.stringify(incomeData))

    const encoded = encodeStoresForUrl()
    const decoded = decodeStoresFromUrl(encoded)

    expect(decoded).not.toBeNull()
    expect(decoded!['fireplanner-profile']).toEqual(profileData)
    expect(decoded!['fireplanner-income']).toEqual(incomeData)
  })
})

describe('generateShareUrl', () => {
  it('produces URL with ?plan= parameter', () => {
    localStorage.setItem('fireplanner-profile', JSON.stringify({ currentAge: 30 }))

    Object.defineProperty(window, 'location', {
      value: { origin: 'https://example.com', pathname: '/app' },
      writable: true,
      configurable: true,
    })

    const { url, tooLong } = generateShareUrl()
    expect(url).toContain('?plan=')
    expect(url).toContain('https://example.com/app')
    expect(typeof tooLong).toBe('boolean')
  })

  it('flags tooLong when URL exceeds 8000 chars', () => {
    // Store large data across multiple keys to exceed URL limit
    for (const key of [
      'fireplanner-profile', 'fireplanner-income', 'fireplanner-allocation',
      'fireplanner-simulation', 'fireplanner-withdrawal', 'fireplanner-property',
    ]) {
      const bigData: Record<string, string> = {}
      for (let i = 0; i < 200; i++) {
        bigData[`field_${i}`] = `value_${'x'.repeat(50)}_${i}`
      }
      localStorage.setItem(key, JSON.stringify(bigData))
    }

    Object.defineProperty(window, 'location', {
      value: { origin: 'https://example.com', pathname: '/' },
      writable: true,
      configurable: true,
    })

    const { tooLong } = generateShareUrl()
    expect(tooLong).toBe(true)
  })
})

describe('applyStoreData', () => {
  it('writes valid store keys to localStorage', () => {
    applyStoreData({
      'fireplanner-profile': { currentAge: 45 },
      'fireplanner-income': { salary: 100000 },
    })
    expect(JSON.parse(localStorage.getItem('fireplanner-profile')!)).toEqual({ currentAge: 45 })
    expect(JSON.parse(localStorage.getItem('fireplanner-income')!)).toEqual({ salary: 100000 })
  })

  it('ignores unknown keys', () => {
    applyStoreData({
      'fireplanner-profile': { currentAge: 45 },
      'unknown-key': { data: 'ignored' },
    })
    expect(localStorage.getItem('unknown-key')).toBeNull()
  })
})

describe('getPlanFromUrl', () => {
  it('returns null when no plan param', () => {
    Object.defineProperty(window, 'location', {
      value: { search: '' },
      writable: true,
      configurable: true,
    })
    expect(getPlanFromUrl()).toBeNull()
  })

  it('returns value when plan param present', () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?plan=abc123' },
      writable: true,
      configurable: true,
    })
    expect(getPlanFromUrl()).toBe('abc123')
  })
})

describe('stripPlanFromUrl', () => {
  it('calls replaceState to remove plan param', () => {
    const replaceStateMock = vi.fn()
    Object.defineProperty(window, 'history', {
      value: { replaceState: replaceStateMock },
      writable: true,
      configurable: true,
    })
    Object.defineProperty(window, 'location', {
      value: { href: 'https://example.com/app?plan=abc123' },
      writable: true,
      configurable: true,
    })

    stripPlanFromUrl()

    expect(replaceStateMock).toHaveBeenCalled()
    const newUrl = replaceStateMock.mock.calls[0][2]
    expect(newUrl).not.toContain('plan=')
  })
})
