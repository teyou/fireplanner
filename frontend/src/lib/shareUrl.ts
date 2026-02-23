/**
 * Share Plan via URL — encodes all 6 store states into a compressed URL query parameter.
 * Reuses the same STORE_KEYS as exportImport.ts.
 */

import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'

const STORE_KEYS = [
  'fireplanner-profile',
  'fireplanner-income',
  'fireplanner-allocation',
  'fireplanner-simulation',
  'fireplanner-withdrawal',
  'fireplanner-property',
]

const MAX_URL_LENGTH = 8000

/** Read all store data from localStorage and compress to a URL-safe string. */
export function encodeStoresForUrl(): string {
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
  return compressToEncodedURIComponent(JSON.stringify(stores))
}

/** Decode a compressed string back to store data. Returns null on failure. */
export function decodeStoresFromUrl(compressed: string): Record<string, unknown> | null {
  try {
    const json = decompressFromEncodedURIComponent(compressed)
    if (!json) return null
    const data = JSON.parse(json) as Record<string, unknown>
    // Basic validation: must be an object with at least one expected key
    const hasValidKey = Object.keys(data).some((k) => STORE_KEYS.includes(k))
    return hasValidKey ? data : null
  } catch {
    return null
  }
}

/** Generate the full shareable URL with ?plan= query parameter. */
export function generateShareUrl(): { url: string; tooLong: boolean } {
  const encoded = encodeStoresForUrl()
  const base = window.location.origin + window.location.pathname
  const url = `${base}?plan=${encoded}`
  return { url, tooLong: url.length > MAX_URL_LENGTH }
}

/** Write decoded store data to localStorage. Does NOT reload — caller handles that. */
export function applyStoreData(stores: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(stores)) {
    if (!STORE_KEYS.includes(key)) continue
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage unavailable */ }
  }
}

/** Check if the current URL has a ?plan= parameter. */
export function getPlanFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search)
  return params.get('plan')
}

/** Strip the ?plan= parameter from the URL without triggering navigation. */
export function stripPlanFromUrl(): void {
  const url = new URL(window.location.href)
  url.searchParams.delete('plan')
  window.history.replaceState({}, '', url.toString())
}
