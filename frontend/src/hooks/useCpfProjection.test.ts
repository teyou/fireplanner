import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCpfProjection } from './useCpfProjection'
import { useProfileStore } from '@/stores/useProfileStore'
import { useIncomeStore } from '@/stores/useIncomeStore'

beforeEach(() => {
  useProfileStore.getState().reset()
  useIncomeStore.getState().reset()
})

describe('useCpfProjection', () => {
  it('returns rows with valid defaults', () => {
    const { result } = renderHook(() => useCpfProjection())
    expect(result.current.hasErrors).toBe(false)
    expect(result.current.rows).not.toBeNull()
    expect(result.current.rows!.length).toBeGreaterThan(0)
  })

  it('rows span currentAge to lifeExpectancy', () => {
    const { result } = renderHook(() => useCpfProjection())
    const rows = result.current.rows!
    const profile = useProfileStore.getState()
    expect(rows[0].age).toBe(profile.currentAge)
    expect(rows[rows.length - 1].age).toBe(profile.lifeExpectancy)
  })

  it('first row has annualInterest = 0', () => {
    const { result } = renderHook(() => useCpfProjection())
    expect(result.current.rows![0].annualInterest).toBe(0)
  })

  it('totalBalance = OA + SA + MA + RA', () => {
    const { result } = renderHook(() => useCpfProjection())
    const row = result.current.rows![5]
    expect(row.totalBalance).toBeCloseTo(row.oaBalance + row.saBalance + row.maBalance + row.raBalance, 0)
  })

  it('raBalance appears after age 55 transfer', () => {
    useProfileStore.setState({
      ...useProfileStore.getState(),
      currentAge: 30,
      retirementAge: 55,
      lifeExpectancy: 90,
      validationErrors: {},
    })
    const { result } = renderHook(() => useCpfProjection())
    const rows = result.current.rows!
    const row54 = rows.find(r => r.age === 54)
    const row55 = rows.find(r => r.age === 55)
    if (row54 && row55) {
      expect(row54.raBalance).toBe(0)
      expect(row55.raBalance).toBeGreaterThan(0)
      expect(row55.saBalance).toBe(0)
    }
  })

  it('raCreated milestone at age 55', () => {
    useProfileStore.setState({
      ...useProfileStore.getState(),
      currentAge: 30,
      retirementAge: 55,
      lifeExpectancy: 90,
      validationErrors: {},
    })
    const { result } = renderHook(() => useCpfProjection())
    const rows = result.current.rows!
    const row55 = rows.find(r => r.age === 55)
    // raCreated fires at 55 unless another milestone takes priority
    if (row55 && row55.raBalance > 0) {
      // milestone could be 'brs'/'frs'/'ers' if those thresholds also crossed at 55
      expect(['raCreated', 'brs', 'frs', 'ers']).toContain(row55.milestone)
    }
  })

  it('CPF balances grow over working years', () => {
    const { result } = renderHook(() => useCpfProjection())
    const rows = result.current.rows!
    // Compare early working years - balance should grow
    expect(rows[5].totalBalance).toBeGreaterThan(rows[0].totalBalance)
    expect(rows[10].totalBalance).toBeGreaterThan(rows[5].totalBalance)
  })

  it('annualContribution is zero post-retirement', () => {
    const { result } = renderHook(() => useCpfProjection())
    const rows = result.current.rows!
    const profile = useProfileStore.getState()
    // Find a row well after retirement
    const postRetRow = rows.find(r => r.age === profile.retirementAge + 5)
    if (postRetRow) {
      expect(postRetRow.annualContribution).toBe(0)
    }
  })

  it('CPF LIFE start milestone is flagged', () => {
    const { result } = renderHook(() => useCpfProjection())
    const rows = result.current.rows!
    const profile = useProfileStore.getState()
    const cpfLifeRow = rows.find(r => r.age === profile.cpfLifeStartAge)
    if (cpfLifeRow) {
      expect(cpfLifeRow.milestone).toBe('cpfLifeStart')
    }
  })

  it('cpfLifePayout is zero before CPF LIFE start age', () => {
    const { result } = renderHook(() => useCpfProjection())
    const rows = result.current.rows!
    const profile = useProfileStore.getState()
    const earlyRow = rows.find(r => r.age === profile.cpfLifeStartAge - 1)
    if (earlyRow) {
      expect(earlyRow.cpfLifePayout).toBe(0)
    }
  })

  it('returns null when upstream has validation errors', () => {
    useProfileStore.getState().setField('currentAge', 15)
    const { result } = renderHook(() => useCpfProjection())
    expect(result.current.hasErrors).toBe(true)
    expect(result.current.rows).toBeNull()
  })

  it('annualInterest is always >= 0 (clamped)', () => {
    const { result } = renderHook(() => useCpfProjection())
    const rows = result.current.rows!
    for (const row of rows) {
      expect(row.annualInterest).toBeGreaterThanOrEqual(0)
    }
  })
})
