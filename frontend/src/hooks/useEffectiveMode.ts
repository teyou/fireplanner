import { useUIStore } from '@/stores/useUIStore'

/**
 * All sections that have simple/advanced content gating.
 * Superset of InputsPage SectionId — includes results pages.
 */
export type ModeSectionId =
  | 'section-fire-settings'
  | 'section-income'
  | 'section-expenses'
  | 'section-net-worth'
  | 'section-cpf'
  | 'section-property'
  | 'section-allocation'
  | 'section-projection'
  | 'section-stress-test'

/**
 * Returns the effective UI mode for a given section.
 * Checks section overrides first, falls back to global mode.
 */
export function useEffectiveMode(section?: ModeSectionId): 'simple' | 'advanced' {
  const globalMode = useUIStore((s) => s.mode)
  const overrides = useUIStore((s) => s.sectionOverrides)

  if (section && overrides[section]) {
    return overrides[section]!
  }
  return globalMode
}

/**
 * Strategies visible in Simple mode.
 * Constant Dollar (baseline), Guardrails (best-researched adaptive),
 * VPW (popular in FIRE community), Floor & Ceiling (intuitive mental model).
 */
export const SIMPLE_STRATEGIES = [
  'constant_dollar',
  'guardrails',
  'vpw',
  'floor_ceiling',
] as const
