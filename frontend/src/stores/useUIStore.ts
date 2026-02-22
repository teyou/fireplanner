import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SectionOrder = 'goal-first' | 'story-first' | 'already-fire'
type StatsPosition = 'bottom' | 'top'

interface UIState {
  sectionOrder: SectionOrder
  statsPosition: StatsPosition
  cpfEnabled: boolean
  propertyEnabled: boolean
  healthcareEnabled: boolean
  mode: 'simple' | 'advanced'
  sectionOverrides: Partial<Record<string, 'simple' | 'advanced'>>
  dismissedNudges: string[]
}

interface UIActions {
  setField: <K extends keyof UIState>(field: K, value: UIState[K]) => void
  setSectionMode: (section: string, mode: 'simple' | 'advanced') => void
  clearSectionOverrides: () => void
  dismissNudge: (nudgeId: string) => void
}

const DEFAULT_UI: UIState = {
  sectionOrder: 'goal-first',
  statsPosition: 'bottom',
  cpfEnabled: true,
  propertyEnabled: false,
  healthcareEnabled: false,
  mode: 'simple',
  sectionOverrides: {},
  dismissedNudges: [],
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set, get) => ({
      ...DEFAULT_UI,

      setField: (field, value) => {
        if (field === 'mode') {
          set({ [field]: value, sectionOverrides: {} })
        } else {
          set({ [field]: value })
        }
      },

      setSectionMode: (section, mode) =>
        set((state) => ({
          sectionOverrides: { ...state.sectionOverrides, [section]: mode },
        })),

      clearSectionOverrides: () => set({ sectionOverrides: {} }),

      dismissNudge: (nudgeId) =>
        set((state) => ({
          dismissedNudges: state.dismissedNudges.includes(nudgeId)
            ? state.dismissedNudges
            : [...state.dismissedNudges, nudgeId],
        })),
    }),
    {
      name: 'fireplanner-ui',
      version: 4,
      migrate: (persisted, version) => {
        const state = persisted as Record<string, unknown>
        if (version < 2) {
          state.cpfEnabled = true
          state.propertyEnabled = false
          state.healthcareEnabled = false
        }
        if (version < 3) {
          // Migrate allocationAdvanced → mode
          state.mode = state.allocationAdvanced ? 'advanced' : 'simple'
          delete state.allocationAdvanced
          // Migrate sidebar → bottom
          if (state.statsPosition === 'sidebar') {
            state.statsPosition = 'bottom'
          }
        }
        if (version < 4) {
          state.sectionOverrides = {}
          state.dismissedNudges = []
        }
        return state
      },
    }
  )
)
