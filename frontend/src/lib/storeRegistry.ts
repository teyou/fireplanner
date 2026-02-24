/**
 * Central registry of store versions and migration functions.
 *
 * Each store's migrate() is extracted from its Zustand persist config
 * so importFromJson can run migrations BEFORE writing to localStorage,
 * rather than relying on post-reload rehydration.
 */

import { useProfileStore } from '@/stores/useProfileStore'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { useAllocationStore } from '@/stores/useAllocationStore'
import { useSimulationStore } from '@/stores/useSimulationStore'
import { useWithdrawalStore } from '@/stores/useWithdrawalStore'
import { usePropertyStore } from '@/stores/usePropertyStore'

export interface StoreRegistryEntry {
  currentVersion: number
  /** Runs the store's migration chain on raw persisted data. */
  migrate: (state: Record<string, unknown>, fromVersion: number) => Record<string, unknown>
  /** Default state for this store (used to fill missing stores on import). */
  defaults: Record<string, unknown>
}

type ZustandPersistStore = {
  persist: {
    getOptions: () => {
      version?: number
      migrate?: (state: unknown, version: number) => unknown
    }
  }
}

function extractEntry(
  store: ZustandPersistStore,
  defaults: Record<string, unknown>
): StoreRegistryEntry {
  const opts = store.persist.getOptions()
  return {
    currentVersion: opts.version ?? 0,
    migrate: (state, fromVersion) => {
      if (!opts.migrate) return state
      return (opts.migrate(state, fromVersion) ?? state) as Record<string, unknown>
    },
    defaults,
  }
}

// NOTE: Default objects are intentionally minimal snapshots. They don't need
// to track every field — Zustand's merge + migrate handles the rest.
// We only need enough for a valid initial state.

export const STORE_REGISTRY: Record<string, StoreRegistryEntry> = {
  'fireplanner-profile': extractEntry(useProfileStore, {
    currentAge: 30,
    retirementAge: 65,
    lifeExpectancy: 90,
    annualExpenses: 48000,
    swr: 0.036,
  }),
  'fireplanner-income': extractEntry(useIncomeStore, {
    salaryModel: 'simple',
    annualSalary: 72000,
    salaryGrowthRate: 0.03,
    employerCpfEnabled: true,
    incomeStreams: [],
    lifeEvents: [],
  }),
  'fireplanner-allocation': extractEntry(useAllocationStore, {}),
  'fireplanner-simulation': extractEntry(useSimulationStore, {}),
  'fireplanner-withdrawal': extractEntry(useWithdrawalStore, {}),
  'fireplanner-property': extractEntry(usePropertyStore, {}),
}

export interface MigratedStoreData {
  state: Record<string, unknown>
  version: number
}

/**
 * Run a store's migration chain on imported data.
 * Returns null if the store key is not in the registry.
 */
export function migrateStoreData(
  storeKey: string,
  data: { state: Record<string, unknown>; version: number }
): MigratedStoreData | null {
  const entry = STORE_REGISTRY[storeKey]
  if (!entry) return null

  const fromVersion = data.version ?? 0
  if (fromVersion >= entry.currentVersion) {
    return { state: data.state, version: entry.currentVersion }
  }

  const migrated = entry.migrate({ ...data.state }, fromVersion)
  return { state: migrated, version: entry.currentVersion }
}
