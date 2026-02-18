import { describe, it, expect } from 'vitest'
import { SeededRNG } from './random'

describe('SeededRNG', () => {
  describe('determinism', () => {
    it('produces identical sequences from the same seed', () => {
      const rng1 = new SeededRNG(42)
      const rng2 = new SeededRNG(42)
      for (let i = 0; i < 100; i++) {
        expect(rng1.next()).toBe(rng2.next())
      }
    })

    it('produces different sequences from different seeds', () => {
      const rng1 = new SeededRNG(42)
      const rng2 = new SeededRNG(123)
      const vals1: number[] = []
      const vals2: number[] = []
      for (let i = 0; i < 20; i++) {
        vals1.push(rng1.next())
        vals2.push(rng2.next())
      }
      // They should not be equal (astronomically unlikely for different seeds)
      const allMatch = vals1.every((v, i) => v === vals2[i])
      expect(allMatch).toBe(false)
    })

    it('deterministic gaussian sequence from same seed', () => {
      const rng1 = new SeededRNG(99)
      const rng2 = new SeededRNG(99)
      for (let i = 0; i < 50; i++) {
        expect(rng1.nextGaussian()).toBe(rng2.nextGaussian())
      }
    })
  })

  describe('next()', () => {
    it('returns values in [0, 1)', () => {
      const rng = new SeededRNG(42)
      for (let i = 0; i < 10000; i++) {
        const val = rng.next()
        expect(val).toBeGreaterThanOrEqual(0)
        expect(val).toBeLessThan(1)
      }
    })

    it('has reasonable distribution (mean near 0.5)', () => {
      const rng = new SeededRNG(42)
      const n = 50000
      let sum = 0
      for (let i = 0; i < n; i++) {
        sum += rng.next()
      }
      const mean = sum / n
      expect(mean).toBeGreaterThan(0.48)
      expect(mean).toBeLessThan(0.52)
    })
  })

  describe('nextGaussian()', () => {
    it('produces mean near 0 and std near 1', () => {
      const rng = new SeededRNG(42)
      const n = 50000
      let sum = 0
      let sumSq = 0
      for (let i = 0; i < n; i++) {
        const g = rng.nextGaussian()
        sum += g
        sumSq += g * g
      }
      const mean = sum / n
      const variance = sumSq / n - mean * mean
      const std = Math.sqrt(variance)
      expect(mean).toBeGreaterThan(-0.05)
      expect(mean).toBeLessThan(0.05)
      expect(std).toBeGreaterThan(0.95)
      expect(std).toBeLessThan(1.05)
    })
  })

  describe('nextGaussianArray()', () => {
    it('returns array of correct length', () => {
      const rng = new SeededRNG(42)
      expect(rng.nextGaussianArray(0).length).toBe(0)
      expect(rng.nextGaussianArray(1).length).toBe(1)
      expect(rng.nextGaussianArray(100).length).toBe(100)
    })

    it('returns deterministic values matching sequential calls', () => {
      const rng1 = new SeededRNG(42)
      const arr = rng1.nextGaussianArray(10)

      const rng2 = new SeededRNG(42)
      for (let i = 0; i < 10; i++) {
        expect(arr[i]).toBe(rng2.nextGaussian())
      }
    })
  })

  describe('nextInt()', () => {
    it('returns integers in [0, max)', () => {
      const rng = new SeededRNG(42)
      for (let i = 0; i < 10000; i++) {
        const val = rng.nextInt(10)
        expect(val).toBeGreaterThanOrEqual(0)
        expect(val).toBeLessThan(10)
        expect(Number.isInteger(val)).toBe(true)
      }
    })

    it('covers all values in range for small max', () => {
      const rng = new SeededRNG(42)
      const seen = new Set<number>()
      for (let i = 0; i < 1000; i++) {
        seen.add(rng.nextInt(5))
      }
      expect(seen.size).toBe(5) // should see 0,1,2,3,4
    })

    it('returns 0 for max=1', () => {
      const rng = new SeededRNG(42)
      for (let i = 0; i < 100; i++) {
        expect(rng.nextInt(1)).toBe(0)
      }
    })
  })
})
