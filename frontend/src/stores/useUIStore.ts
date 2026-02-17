import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SectionOrder = 'goal-first' | 'story-first' | 'already-fire'
type StatsPosition = 'bottom' | 'top' | 'sidebar'

interface UIState {
  sectionOrder: SectionOrder
  statsPosition: StatsPosition
}

interface UIActions {
  setField: <K extends keyof UIState>(field: K, value: UIState[K]) => void
}

const DEFAULT_UI: UIState = {
  sectionOrder: 'goal-first',
  statsPosition: 'bottom',
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      ...DEFAULT_UI,

      setField: (field, value) => set({ [field]: value }),
    }),
    {
      name: 'fireplanner-ui',
      version: 1,
    }
  )
)
