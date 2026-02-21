import { useUIStore } from '@/stores/useUIStore'

/**
 * Returns the effective UI mode. Currently returns the global mode.
 * Extensible for per-section overrides in a future version.
 */
export function useEffectiveMode(): 'simple' | 'advanced' {
  return useUIStore((s) => s.mode)
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
