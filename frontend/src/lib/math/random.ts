/**
 * Seeded pseudo-random number generator for deterministic Monte Carlo simulation.
 * Replaces numpy.random.default_rng with a JS implementation.
 *
 * Uses xoshiro128** for uniform random numbers (fast, high quality, 128-bit state).
 * Seeded via SplitMix32 to expand a single 32-bit seed into the 128-bit state.
 * Gaussian generation uses the Box-Muller transform.
 */

export class SeededRNG {
  private s0: number
  private s1: number
  private s2: number
  private s3: number

  // Box-Muller cache: generates pairs, stores the spare
  private hasSpare = false
  private spare = 0

  constructor(seed: number) {
    // Initialize 128-bit state from seed using SplitMix32
    seed = seed | 0 // ensure 32-bit integer
    this.s0 = splitmix32(seed)
    seed = (seed + 0x9e3779b9) | 0
    this.s1 = splitmix32(seed)
    seed = (seed + 0x9e3779b9) | 0
    this.s2 = splitmix32(seed)
    seed = (seed + 0x9e3779b9) | 0
    this.s3 = splitmix32(seed)

    // Ensure state is not all zeros
    if ((this.s0 | this.s1 | this.s2 | this.s3) === 0) {
      this.s0 = 1
    }
  }

  /** Returns a uniform random number in [0, 1). */
  next(): number {
    const result = this.xoshiro128ss()
    // Convert uint32 to [0, 1) by dividing by 2^32
    return (result >>> 0) / 4294967296
  }

  /** Returns a standard normal (mean=0, std=1) random number via Box-Muller. */
  nextGaussian(): number {
    if (this.hasSpare) {
      this.hasSpare = false
      return this.spare
    }

    // Box-Muller transform: generates two independent standard normal values
    let u: number, v: number, s: number
    do {
      u = 2.0 * this.next() - 1.0
      v = 2.0 * this.next() - 1.0
      s = u * u + v * v
    } while (s >= 1.0 || s === 0.0)

    const mul = Math.sqrt((-2.0 * Math.log(s)) / s)
    this.spare = v * mul
    this.hasSpare = true
    return u * mul
  }

  /** Returns an array of n standard normal random numbers. */
  nextGaussianArray(n: number): number[] {
    const arr: number[] = new Array(n)
    for (let i = 0; i < n; i++) {
      arr[i] = this.nextGaussian()
    }
    return arr
  }

  /** Returns a random integer in [0, max). */
  nextInt(max: number): number {
    return Math.floor(this.next() * max)
  }

  /** xoshiro128** core: returns a 32-bit unsigned integer. */
  private xoshiro128ss(): number {
    let { s0, s1, s2, s3 } = this

    const result = Math.imul(rotl(Math.imul(s1, 5), 7), 9)

    const t = s1 << 9

    s2 ^= s0
    s3 ^= s1
    s1 ^= s2
    s0 ^= s3

    s2 ^= t

    s3 = rotl(s3, 11)

    this.s0 = s0
    this.s1 = s1
    this.s2 = s2
    this.s3 = s3

    return result
  }
}

/** 32-bit left rotation. */
function rotl(x: number, k: number): number {
  return (x << k) | (x >>> (32 - k))
}

/** SplitMix32: expands a 32-bit seed to a 32-bit hash. */
function splitmix32(seed: number): number {
  seed = (seed + 0x9e3779b9) | 0
  let t = seed ^ (seed >>> 16)
  t = Math.imul(t, 0x85ebca6b)
  t = t ^ (t >>> 13)
  t = Math.imul(t, 0xc2b2ae35)
  t = t ^ (t >>> 16)
  return t
}
