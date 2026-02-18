import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SectionOrder = 'goal-first' | 'story-first' | 'already-fire'
type StatsPosition = 'bottom' | 'top' | 'sidebar'

interface UIState {
  sectionOrder: SectionOrder
  statsPosition: StatsPosition
  cpfEnabled: boolean
  propertyEnabled: boolean
  healthcareEnabled: boolean
  allocationAdvanced: boolean
}

interface UIActions {
  setField: <K extends keyof UIState>(field: K, value: UIState[K]) => void
}

const DEFAULT_UI: UIState = {
  sectionOrder: 'goal-first',
  statsPosition: 'bottom',
  cpfEnabled: true,
  propertyEnabled: false,
  healthcareEnabled: false,
  allocationAdvanced: false,
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      ...DEFAULT_UI,

      setField: (field, value) => set({ [field]: value }),
    }),
    {
      name: 'fireplanner-ui',
      version: 2,
      migrate: (persisted, version) => {
        const state = persisted as Record<string, unknown>
        if (version < 2) {
          // Existing users: CPF ON (preserve their data), others OFF
          return {
            ...state,
            cpfEnabled: true,
            propertyEnabled: false,
            healthcareEnabled: false,
            allocationAdvanced: false,
          }
        }
        return state
      },
    }
  )
)
