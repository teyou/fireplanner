import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock localStorage before importing the module
const storage = new Map<string, string>()
const localStorageMock = {
  getItem: vi.fn((key: string) => storage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => { storage.set(key, value) }),
  removeItem: vi.fn((key: string) => { storage.delete(key) }),
}
vi.stubGlobal('localStorage', localStorageMock)

import {
  getCheckedItems,
  toggleItem,
  getProgress,
  resetChecklist,
  CHECKLIST_ITEMS,
} from './checklist'

beforeEach(() => {
  storage.clear()
  vi.clearAllMocks()
})

describe('getCheckedItems', () => {
  it('returns empty object on fresh start', () => {
    expect(getCheckedItems()).toEqual({})
  })

  it('handles corrupted localStorage gracefully', () => {
    storage.set('fireplanner-checklist', 'not-valid-json')
    expect(getCheckedItems()).toEqual({})
  })

  it('handles non-object localStorage value gracefully', () => {
    storage.set('fireplanner-checklist', '"a string"')
    expect(getCheckedItems()).toEqual({})
  })

  it('handles array localStorage value gracefully', () => {
    storage.set('fireplanner-checklist', '[1,2,3]')
    expect(getCheckedItems()).toEqual({})
  })
})

describe('toggleItem', () => {
  it('toggles item on and persists to localStorage', () => {
    const result = toggleItem('make-will')
    expect(result).toBe(true)
    expect(getCheckedItems()['make-will']).toBe(true)
  })

  it('toggling twice returns to unchecked', () => {
    toggleItem('make-will')
    const result = toggleItem('make-will')
    expect(result).toBe(false)
    expect(getCheckedItems()['make-will']).toBeUndefined()
  })

  it('can toggle multiple items independently', () => {
    toggleItem('make-will')
    toggleItem('lpa')
    const checked = getCheckedItems()
    expect(checked['make-will']).toBe(true)
    expect(checked['lpa']).toBe(true)
  })
})

describe('getProgress', () => {
  it('returns correct checked/total counts', () => {
    expect(getProgress()).toEqual({ checked: 0, total: CHECKLIST_ITEMS.length })

    toggleItem('make-will')
    toggleItem('lpa')
    expect(getProgress()).toEqual({ checked: 2, total: CHECKLIST_ITEMS.length })
  })

  it('decreases count when item is unchecked', () => {
    toggleItem('make-will')
    toggleItem('lpa')
    toggleItem('make-will') // uncheck
    expect(getProgress().checked).toBe(1)
  })
})

describe('resetChecklist', () => {
  it('clears all checks', () => {
    toggleItem('make-will')
    toggleItem('lpa')
    toggleItem('amd')
    resetChecklist()
    expect(getProgress().checked).toBe(0)
    expect(getCheckedItems()).toEqual({})
  })
})
