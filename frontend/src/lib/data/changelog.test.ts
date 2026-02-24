import { describe, it, expect } from 'vitest'
import { CHANGELOG, DATA_VINTAGE } from './changelog'

describe('changelog data integrity', () => {
  it('all dates are in YYYY-MM-DD format', () => {
    for (const entry of CHANGELOG) {
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('DATA_VINTAGE is in YYYY-MM-DD format', () => {
    expect(DATA_VINTAGE).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('entries are sorted newest-first', () => {
    for (let i = 1; i < CHANGELOG.length; i++) {
      expect(CHANGELOG[i].date <= CHANGELOG[i - 1].date).toBe(true)
    }
  })

  it('every entry has a non-empty title and description', () => {
    for (const entry of CHANGELOG) {
      expect(entry.title.length).toBeGreaterThan(0)
      expect(entry.description.length).toBeGreaterThan(0)
    }
  })

  it('category is one of the allowed values', () => {
    const allowed = new Set(['data-update', 'feature', 'fix'])
    for (const entry of CHANGELOG) {
      expect(allowed.has(entry.category)).toBe(true)
    }
  })
})
