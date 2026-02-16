/**
 * JSON export/import for cross-device portability.
 * Serializes all 6 Zustand store states to a downloadable JSON file.
 */

const STORE_KEYS = [
  'fireplanner-profile',
  'fireplanner-income',
  'fireplanner-allocation',
  'fireplanner-simulation',
  'fireplanner-withdrawal',
  'fireplanner-property',
]

interface ExportData {
  version: 1
  exportedAt: string
  stores: Record<string, unknown>
}

/** Export all store state as a downloadable JSON file. */
export function exportToJson(): void {
  const stores: Record<string, unknown> = {}
  for (const key of STORE_KEYS) {
    const raw = localStorage.getItem(key)
    if (raw) {
      try {
        stores[key] = JSON.parse(raw)
      } catch {
        // skip
      }
    }
  }

  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    stores,
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fireplanner-export-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** Import store state from a JSON file. Returns true on success. */
export async function importFromJson(file: File): Promise<boolean> {
  try {
    const text = await file.text()
    const data: ExportData = JSON.parse(text)

    if (data.version !== 1 || !data.stores) {
      throw new Error('Invalid export file format')
    }

    // Validate that stores have expected keys
    for (const [key, value] of Object.entries(data.stores)) {
      if (!STORE_KEYS.includes(key)) continue
      localStorage.setItem(key, JSON.stringify(value))
    }

    window.location.reload()
    return true
  } catch {
    return false
  }
}
