import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useEffectiveMode } from './useEffectiveMode'
import { useUIStore } from '@/stores/useUIStore'

describe('useEffectiveMode', () => {
  beforeEach(() => {
    useUIStore.setState({
      mode: 'simple',
      sectionOverrides: {},
      dismissedNudges: [],
      sectionOrder: 'goal-first',
      statsPosition: 'bottom',
      cpfEnabled: true,
      propertyEnabled: false,
      healthcareEnabled: false,
    })
  })

  it('returns global mode when called without section', () => {
    const { result } = renderHook(() => useEffectiveMode())
    expect(result.current).toBe('simple')
  })

  it('returns global mode when section has no override', () => {
    const { result } = renderHook(() => useEffectiveMode('section-income'))
    expect(result.current).toBe('simple')
  })

  it('returns section override when one exists', () => {
    useUIStore.setState({
      sectionOverrides: { 'section-income': 'advanced' },
    })
    const { result } = renderHook(() => useEffectiveMode('section-income'))
    expect(result.current).toBe('advanced')
  })

  it('returns global mode for sections without override even when other sections have overrides', () => {
    useUIStore.setState({
      sectionOverrides: { 'section-income': 'advanced' },
    })
    const { result } = renderHook(() => useEffectiveMode('section-cpf'))
    expect(result.current).toBe('simple')
  })

  it('returns advanced global mode when no overrides exist', () => {
    useUIStore.setState({ mode: 'advanced' })
    const { result } = renderHook(() => useEffectiveMode('section-income'))
    expect(result.current).toBe('advanced')
  })

  it('override can downgrade from global advanced to section simple', () => {
    useUIStore.setState({
      mode: 'advanced',
      sectionOverrides: { 'section-allocation': 'simple' },
    })
    const { result } = renderHook(() => useEffectiveMode('section-allocation'))
    expect(result.current).toBe('simple')
  })
})
