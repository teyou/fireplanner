import { describe, it, expect } from 'vitest'
import { cn, formatCurrency, formatPercent, clamp, roundTo } from './utils'

describe('formatCurrency', () => {
  it('formats positive integer', () => {
    expect(formatCurrency(1234)).toBe('$1,234')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0')
  })

  it('formats negative value with leading minus', () => {
    expect(formatCurrency(-1234)).toBe('-$1,234')
  })

  it('formats with decimal places', () => {
    expect(formatCurrency(1234.567, 2)).toBe('$1,234.57')
  })

  it('formats large numbers with commas', () => {
    expect(formatCurrency(1200000)).toBe('$1,200,000')
  })
})

describe('formatPercent', () => {
  it('formats decimal as percentage with 2 decimals by default', () => {
    expect(formatPercent(0.04)).toBe('4.00%')
  })

  it('formats with zero decimals', () => {
    expect(formatPercent(0.04, 0)).toBe('4%')
  })

  it('formats zero', () => {
    expect(formatPercent(0)).toBe('0.00%')
  })

  it('formats values greater than 1', () => {
    expect(formatPercent(1.5)).toBe('150.00%')
  })
})

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('clamps to min when below', () => {
    expect(clamp(-1, 0, 10)).toBe(0)
  })

  it('clamps to max when above', () => {
    expect(clamp(15, 0, 10)).toBe(10)
  })

  it('handles min === max', () => {
    expect(clamp(5, 3, 3)).toBe(3)
  })

  it('returns boundary values exactly', () => {
    expect(clamp(0, 0, 10)).toBe(0)
    expect(clamp(10, 0, 10)).toBe(10)
  })
})

describe('roundTo', () => {
  it('rounds to 2 decimal places', () => {
    expect(roundTo(1.2345, 2)).toBe(1.23)
  })

  it('rounds up at midpoint', () => {
    expect(roundTo(1.235, 2)).toBe(1.24)
  })

  it('rounds to 0 decimal places', () => {
    expect(roundTo(1.6, 0)).toBe(2)
  })

  it('handles negative numbers', () => {
    expect(roundTo(-1.2345, 2)).toBe(-1.23)
  })
})

describe('cn', () => {
  it('merges tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('handles falsy values', () => {
    expect(cn('text-red-500', undefined, 'font-bold')).toBe('text-red-500 font-bold')
  })

  it('handles conditional classes', () => {
    const isActive = true
    expect(cn('base', isActive && 'active')).toBe('base active')
  })
})
