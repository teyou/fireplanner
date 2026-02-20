import { describe, it, expect, beforeEach, vi } from 'vitest'
import { listScenarios, saveScenario, loadScenario, deleteScenario } from './scenarios'

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('listScenarios', () => {
  it('returns empty array when no scenarios saved', () => {
    expect(listScenarios()).toEqual([])
  })

  it('returns empty array when localStorage is corrupted', () => {
    localStorage.setItem('fireplanner-scenarios', 'not-valid-json')
    expect(listScenarios()).toEqual([])
  })

  it('returns metadata for saved scenarios', () => {
    saveScenario('My Plan A')
    const list = listScenarios()
    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('My Plan A')
    expect(list[0].id).toBeTruthy()
    expect(list[0].createdAt).toBeTruthy()
  })
})

describe('saveScenario', () => {
  it('saves scenario and returns ID', () => {
    const id = saveScenario('Test Scenario')
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('stores current store data from localStorage', () => {
    localStorage.setItem('fireplanner-profile', JSON.stringify({ currentAge: 35 }))
    localStorage.setItem('fireplanner-income', JSON.stringify({ salary: 100000 }))

    saveScenario('With Data')
    const list = listScenarios()
    expect(list).toHaveLength(1)
  })

  it('allows up to 5 scenarios', () => {
    for (let i = 1; i <= 5; i++) {
      saveScenario(`Scenario ${i}`)
    }
    expect(listScenarios()).toHaveLength(5)
  })

  it('throws when saving 6th scenario', () => {
    for (let i = 1; i <= 5; i++) {
      saveScenario(`Scenario ${i}`)
    }
    expect(() => saveScenario('Scenario 6')).toThrow('Maximum 5 scenarios reached')
  })

  it('each scenario gets unique ID', () => {
    const id1 = saveScenario('Plan A')
    const id2 = saveScenario('Plan B')
    expect(id1).not.toBe(id2)
  })
})

describe('loadScenario', () => {
  it('returns false for non-existent ID', () => {
    expect(loadScenario('non-existent')).toBe(false)
  })

  it('restores store data to localStorage', () => {
    localStorage.setItem('fireplanner-profile', JSON.stringify({ currentAge: 35 }))
    const id = saveScenario('Saved Plan')

    // Change the profile
    localStorage.setItem('fireplanner-profile', JSON.stringify({ currentAge: 50 }))

    // Load the saved scenario
    const rehydrate = vi.fn()
    const result = loadScenario(id, rehydrate)

    expect(result).toBe(true)
    expect(JSON.parse(localStorage.getItem('fireplanner-profile')!)).toEqual({ currentAge: 35 })
    expect(rehydrate).toHaveBeenCalled()
  })

  it('calls window.location.reload when no rehydrate callback', () => {
    localStorage.setItem('fireplanner-profile', JSON.stringify({ currentAge: 35 }))
    const id = saveScenario('Plan')

    const reloadMock = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadMock },
      writable: true,
      configurable: true,
    })

    loadScenario(id)
    expect(reloadMock).toHaveBeenCalled()
  })
})

describe('deleteScenario', () => {
  it('returns false for non-existent ID', () => {
    expect(deleteScenario('non-existent')).toBe(false)
  })

  it('removes scenario and returns true', () => {
    const id = saveScenario('To Delete')
    expect(listScenarios()).toHaveLength(1)

    const result = deleteScenario(id)
    expect(result).toBe(true)
    expect(listScenarios()).toHaveLength(0)
  })

  it('does not affect other scenarios', () => {
    const id1 = saveScenario('Keep')
    const id2 = saveScenario('Delete')

    deleteScenario(id2)
    const list = listScenarios()
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe(id1)
  })
})
