import { toast } from 'sonner'

let undoTimer: ReturnType<typeof setTimeout> | null = null
let undoRestoreFn: (() => void) | null = null

export function pushUndo(description: string, restore: () => void, durationMs = 5000) {
  // Cancel any previous undo
  if (undoTimer) {
    clearTimeout(undoTimer)
    undoTimer = null
  }
  undoRestoreFn = restore

  toast(description, {
    duration: durationMs,
    action: {
      label: 'Undo',
      onClick: () => {
        if (undoRestoreFn) {
          undoRestoreFn()
          undoRestoreFn = null
        }
        if (undoTimer) {
          clearTimeout(undoTimer)
          undoTimer = null
        }
      },
    },
  })

  undoTimer = setTimeout(() => {
    undoRestoreFn = null
    undoTimer = null
  }, durationMs)
}

/** Attempt to undo the last action. Returns true if an undo was available. */
export function tryUndo(): boolean {
  if (!undoRestoreFn) return false
  undoRestoreFn()
  undoRestoreFn = null
  if (undoTimer) {
    clearTimeout(undoTimer)
    undoTimer = null
  }
  toast.success('Undone')
  return true
}
