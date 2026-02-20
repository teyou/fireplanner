import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock localStorage for jsdom (opaque origins throw SecurityError)
const storage = new Map<string, string>()
const localStorageMock = {
  getItem: vi.fn((key: string) => storage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => { storage.set(key, value) }),
  removeItem: vi.fn((key: string) => { storage.delete(key) }),
  clear: vi.fn(() => storage.clear()),
  get length() { return storage.size },
  key: vi.fn((index: number) => [...storage.keys()][index] ?? null),
}
vi.stubGlobal('localStorage', localStorageMock)
