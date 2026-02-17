import { toast } from 'sonner'

let undoTimer: ReturnType<typeof setTimeout> | null = null
let undoRestore: (() => void) | null = null

export function pushUndo(description: string, restore: () => void, durationMs = 5000) {
  // Cancel any previous undo
  if (undoTimer) {
    clearTimeout(undoTimer)
    undoTimer = null
  }
  undoRestore = restore

  toast(description, {
    duration: durationMs,
    action: {
      label: 'Undo',
      onClick: () => {
        if (undoRestore) {
          undoRestore()
          undoRestore = null
        }
        if (undoTimer) {
          clearTimeout(undoTimer)
          undoTimer = null
        }
      },
    },
  })

  undoTimer = setTimeout(() => {
    undoRestore = null
    undoTimer = null
  }, durationMs)
}
