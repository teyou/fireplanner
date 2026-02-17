/**
 * Scenario comparison: save/load/compare up to 5 named planning scenarios.
 * Each scenario stores serialized state of all 6 Zustand stores.
 * Persisted in localStorage under 'fireplanner-scenarios' key.
 */

const STORAGE_KEY = 'fireplanner-scenarios'
const MAX_SCENARIOS = 5

export interface ScenarioMetadata {
  id: string
  name: string
  createdAt: string
}

interface ScenarioSnapshot {
  metadata: ScenarioMetadata
  stores: Record<string, unknown>
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function readAll(): ScenarioSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function writeAll(scenarios: ScenarioSnapshot[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios))
}

/** List all saved scenarios (metadata only). */
export function listScenarios(): ScenarioMetadata[] {
  return readAll().map((s) => s.metadata)
}

/** Save current state as a named scenario. Returns the new scenario ID. */
export function saveScenario(name: string): string {
  const scenarios = readAll()

  if (scenarios.length >= MAX_SCENARIOS) {
    throw new Error(`Maximum ${MAX_SCENARIOS} scenarios reached. Delete one first.`)
  }

  // Collect all persisted store data from localStorage
  const storeKeys = [
    'fireplanner-profile',
    'fireplanner-income',
    'fireplanner-allocation',
    'fireplanner-simulation',
    'fireplanner-withdrawal',
    'fireplanner-property',
  ]

  const stores: Record<string, unknown> = {}
  for (const key of storeKeys) {
    const raw = localStorage.getItem(key)
    if (raw) {
      try {
        stores[key] = JSON.parse(raw)
      } catch {
        // skip corrupted store
      }
    }
  }

  const id = generateId()
  const snapshot: ScenarioSnapshot = {
    metadata: {
      id,
      name,
      createdAt: new Date().toISOString(),
    },
    stores,
  }

  scenarios.push(snapshot)
  writeAll(scenarios)
  return id
}

/** Load a scenario by ID. Restores all store state via rehydration (no page reload). */
export function loadScenario(id: string, rehydrate?: () => void): boolean {
  const scenarios = readAll()
  const scenario = scenarios.find((s) => s.metadata.id === id)
  if (!scenario) return false

  // Write each store back to localStorage
  for (const [key, value] of Object.entries(scenario.stores)) {
    localStorage.setItem(key, JSON.stringify(value))
  }

  // Rehydrate stores if callback provided, otherwise fall back to reload
  if (rehydrate) {
    rehydrate()
  } else {
    window.location.reload()
  }
  return true
}

/** Delete a scenario by ID. */
export function deleteScenario(id: string): boolean {
  const scenarios = readAll()
  const filtered = scenarios.filter((s) => s.metadata.id !== id)
  if (filtered.length === scenarios.length) return false
  writeAll(filtered)
  return true
}
