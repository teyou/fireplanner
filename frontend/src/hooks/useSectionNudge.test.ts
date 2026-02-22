import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSectionNudge } from './useSectionNudge'
import { useUIStore } from '@/stores/useUIStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { usePropertyStore } from '@/stores/usePropertyStore'
import { useSimulationStore } from '@/stores/useSimulationStore'

function resetStores() {
  useUIStore.setState({
    mode: 'simple',
    sectionOverrides: {},
    dismissedNudges: [],
    cpfEnabled: true,
    propertyEnabled: false,
    healthcareEnabled: false,
    sectionOrder: 'goal-first',
    statsPosition: 'bottom',
  })
}

describe('useSectionNudge', () => {
  beforeEach(() => {
    resetStores()
  })

  it('returns null when section is in advanced mode', () => {
    useUIStore.setState({ sectionOverrides: { 'section-income': 'advanced' } })
    useProfileStore.setState({ annualIncome: 200000 })
    const { result } = renderHook(() => useSectionNudge('section-income'))
    expect(result.current).toBeNull()
  })

  it('returns null when nudge has been dismissed', () => {
    useUIStore.setState({ dismissedNudges: ['income-srs-tax'] })
    useProfileStore.setState({ annualIncome: 200000 })
    const { result } = renderHook(() => useSectionNudge('section-income'))
    expect(result.current).toBeNull()
  })

  // --- Income nudge ---
  it('returns income SRS nudge when tax savings > $1000', () => {
    useProfileStore.setState({ annualIncome: 150000, currentAge: 35 })
    const { result } = renderHook(() => useSectionNudge('section-income'))
    expect(result.current).not.toBeNull()
    expect(result.current!.id).toBe('income-srs-tax')
    expect(result.current!.message).toContain('SRS')
  })

  it('returns null for income nudge when income is low', () => {
    useProfileStore.setState({ annualIncome: 50000, currentAge: 30 })
    const { result } = renderHook(() => useSectionNudge('section-income'))
    expect(result.current).toBeNull()
  })

  // --- Expenses nudge ---
  it('returns expenses nudge when retirement duration > 30 years', () => {
    useProfileStore.setState({ retirementAge: 45, lifeExpectancy: 90 })
    const { result } = renderHook(() => useSectionNudge('section-expenses'))
    expect(result.current).not.toBeNull()
    expect(result.current!.id).toBe('expenses-long-retirement')
  })

  it('returns null for expenses nudge when retirement duration <= 30', () => {
    useProfileStore.setState({ retirementAge: 60, lifeExpectancy: 85 })
    const { result } = renderHook(() => useSectionNudge('section-expenses'))
    expect(result.current).toBeNull()
  })

  // --- CPF nudge ---
  it('returns CPF nudge when age >= 45', () => {
    useProfileStore.setState({ currentAge: 45, cpfOA: 50000, cpfSA: 50000, liquidNetWorth: 200000 })
    const { result } = renderHook(() => useSectionNudge('section-cpf'))
    expect(result.current).not.toBeNull()
    expect(result.current!.id).toBe('cpf-projections')
  })

  it('returns CPF nudge when CPF OA+SA > $150K even if young', () => {
    useProfileStore.setState({ currentAge: 35, cpfOA: 100000, cpfSA: 60000, liquidNetWorth: 200000 })
    const { result } = renderHook(() => useSectionNudge('section-cpf'))
    expect(result.current).not.toBeNull()
  })

  it('returns null for CPF nudge when young and low CPF', () => {
    useProfileStore.setState({ currentAge: 30, cpfOA: 20000, cpfSA: 10000, liquidNetWorth: 100000 })
    const { result } = renderHook(() => useSectionNudge('section-cpf'))
    expect(result.current).toBeNull()
  })

  // --- Net Worth SRS nudge ---
  it('returns net worth nudge when SRS balance > 0 and contributing', () => {
    useProfileStore.setState({ srsBalance: 10000, srsAnnualContribution: 15300 })
    const { result } = renderHook(() => useSectionNudge('section-net-worth'))
    expect(result.current).not.toBeNull()
    expect(result.current!.id).toBe('networth-srs-planning')
  })

  it('returns null for net worth nudge when no SRS', () => {
    useProfileStore.setState({ srsBalance: 0, srsAnnualContribution: 0 })
    const { result } = renderHook(() => useSectionNudge('section-net-worth'))
    expect(result.current).toBeNull()
  })

  // --- Property nudge ---
  it('returns HDB monetization nudge when user owns HDB', () => {
    usePropertyStore.setState({ ownsProperty: true, propertyType: 'hdb' })
    const { result } = renderHook(() => useSectionNudge('section-property'))
    expect(result.current).not.toBeNull()
    expect(result.current!.id).toBe('property-hdb-monetization')
  })

  // --- Allocation nudge ---
  it('returns allocation nudge when retirement <= 15 years away', () => {
    useProfileStore.setState({ currentAge: 45, retirementAge: 55 })
    const { result } = renderHook(() => useSectionNudge('section-allocation'))
    expect(result.current).not.toBeNull()
    expect(result.current!.id).toBe('allocation-glide-path')
  })

  it('returns null for allocation nudge when retirement is far', () => {
    useProfileStore.setState({ currentAge: 30, retirementAge: 60 })
    const { result } = renderHook(() => useSectionNudge('section-allocation'))
    expect(result.current).toBeNull()
  })

  // --- Projection nudge ---
  it('returns projection nudge when CPF is enabled', () => {
    useUIStore.setState({ cpfEnabled: true })
    const { result } = renderHook(() => useSectionNudge('section-projection'))
    expect(result.current).not.toBeNull()
    expect(result.current!.id).toBe('projection-detail-columns')
  })

  // --- Stress Test nudge ---
  it('returns stress test nudge when MC success < 95%', () => {
    useSimulationStore.setState({ lastMCSuccessRate: 0.82 })
    const { result } = renderHook(() => useSectionNudge('section-stress-test'))
    expect(result.current).not.toBeNull()
    expect(result.current!.id).toBe('stresstest-deep-analysis')
  })

  it('returns null for stress test nudge when MC success >= 95%', () => {
    useSimulationStore.setState({ lastMCSuccessRate: 0.97 })
    const { result } = renderHook(() => useSectionNudge('section-stress-test'))
    expect(result.current).toBeNull()
  })

  it('returns null for stress test nudge when no MC has been run', () => {
    useSimulationStore.setState({ lastMCSuccessRate: null })
    const { result } = renderHook(() => useSectionNudge('section-stress-test'))
    expect(result.current).toBeNull()
  })

  // --- FIRE Settings (handled at component layer) ---
  it('returns null for fire-settings (handled at component layer)', () => {
    const { result } = renderHook(() => useSectionNudge('section-fire-settings'))
    expect(result.current).toBeNull()
  })
})
