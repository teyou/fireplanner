import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
  }),
}))

import { pushUndo, tryUndo } from './undo'
import { toast } from 'sonner'

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  // Drain any leftover undo state from previous tests
  tryUndo()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('pushUndo', () => {
  it('calls toast with description and action', () => {
    const restore = vi.fn()
    pushUndo('Deleted item', restore)
    expect(toast).toHaveBeenCalledWith('Deleted item', expect.objectContaining({
      duration: 5000,
      action: expect.objectContaining({ label: 'Undo' }),
    }))
  })

  it('accepts custom duration', () => {
    pushUndo('Test', vi.fn(), 10000)
    expect(toast).toHaveBeenCalledWith('Test', expect.objectContaining({
      duration: 10000,
    }))
  })
})

describe('tryUndo', () => {
  it('returns false when no undo is available', () => {
    expect(tryUndo()).toBe(false)
  })

  it('calls restore function and returns true', () => {
    const restore = vi.fn()
    pushUndo('Test', restore)
    expect(tryUndo()).toBe(true)
    expect(restore).toHaveBeenCalledOnce()
    expect(toast.success).toHaveBeenCalledWith('Undone')
  })

  it('clears undo after use (second tryUndo returns false)', () => {
    pushUndo('Test', vi.fn())
    tryUndo()
    expect(tryUndo()).toBe(false)
  })

  it('undo expires after duration', () => {
    pushUndo('Test', vi.fn(), 5000)
    vi.advanceTimersByTime(5001)
    expect(tryUndo()).toBe(false)
  })

  it('new pushUndo replaces previous undo', () => {
    const restore1 = vi.fn()
    const restore2 = vi.fn()
    pushUndo('First', restore1)
    pushUndo('Second', restore2)
    tryUndo()
    expect(restore1).not.toHaveBeenCalled()
    expect(restore2).toHaveBeenCalledOnce()
  })
})
