import { describe, it, expect } from 'vitest'
import {
  choleskyDecomposition,
  buildCovarianceMatrix,
  matMul,
  dot,
  matVecMul,
} from './linalg'

describe('dot', () => {
  it('computes dot product of two vectors', () => {
    expect(dot([1, 2, 3], [4, 5, 6])).toBe(32)
  })

  it('returns 0 for empty vectors', () => {
    expect(dot([], [])).toBe(0)
  })

  it('handles single-element vectors', () => {
    expect(dot([5], [3])).toBe(15)
  })

  it('handles negative values', () => {
    expect(dot([1, -2], [-3, 4])).toBe(-11)
  })
})

describe('matMul', () => {
  it('multiplies 2x2 identity times 2x2 matrix', () => {
    const I = [
      [1, 0],
      [0, 1],
    ]
    const A = [
      [3, 4],
      [5, 6],
    ]
    expect(matMul(I, A)).toEqual(A)
  })

  it('multiplies 2x3 * 3x2 matrices', () => {
    const A = [
      [1, 2, 3],
      [4, 5, 6],
    ]
    const B = [
      [7, 8],
      [9, 10],
      [11, 12],
    ]
    expect(matMul(A, B)).toEqual([
      [58, 64],
      [139, 154],
    ])
  })

  it('multiplies 1x1 matrices', () => {
    expect(matMul([[3]], [[4]])).toEqual([[12]])
  })
})

describe('matVecMul', () => {
  it('multiplies identity matrix by vector', () => {
    const I = [
      [1, 0],
      [0, 1],
    ]
    expect(matVecMul(I, [3, 4])).toEqual([3, 4])
  })

  it('multiplies 2x3 matrix by 3-vector', () => {
    const A = [
      [1, 2, 3],
      [4, 5, 6],
    ]
    expect(matVecMul(A, [1, 0, -1])).toEqual([-2, -2])
  })

  it('handles single-element', () => {
    expect(matVecMul([[5]], [3])).toEqual([15])
  })
})

describe('buildCovarianceMatrix', () => {
  it('builds covariance from stdDevs and correlations', () => {
    // 2 asset classes: stdDevs = [0.10, 0.20], corr = [[1, 0.5], [0.5, 1]]
    // cov[0][0] = 0.10*0.10*1 = 0.01
    // cov[0][1] = 0.10*0.20*0.5 = 0.01
    // cov[1][0] = 0.20*0.10*0.5 = 0.01
    // cov[1][1] = 0.20*0.20*1 = 0.04
    const stdDevs = [0.10, 0.20]
    const corr = [
      [1, 0.5],
      [0.5, 1],
    ]
    const cov = buildCovarianceMatrix(stdDevs, corr)
    expect(cov[0][0]).toBeCloseTo(0.01, 10)
    expect(cov[0][1]).toBeCloseTo(0.01, 10)
    expect(cov[1][0]).toBeCloseTo(0.01, 10)
    expect(cov[1][1]).toBeCloseTo(0.04, 10)
  })

  it('diagonal is variance when correlation diagonal is 1', () => {
    const stdDevs = [0.15, 0.20, 0.05]
    const corr = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]
    const cov = buildCovarianceMatrix(stdDevs, corr)
    expect(cov[0][0]).toBeCloseTo(0.0225, 10) // 0.15^2
    expect(cov[1][1]).toBeCloseTo(0.04, 10) // 0.20^2
    expect(cov[2][2]).toBeCloseTo(0.0025, 10) // 0.05^2
    // off-diagonal should be 0
    expect(cov[0][1]).toBeCloseTo(0, 10)
    expect(cov[1][2]).toBeCloseTo(0, 10)
  })
})

describe('choleskyDecomposition', () => {
  it('decomposes a simple 2x2 positive definite matrix', () => {
    // A = [[4, 2], [2, 3]]
    // L = [[2, 0], [1, sqrt(2)]]
    const A = [
      [4, 2],
      [2, 3],
    ]
    const L = choleskyDecomposition(A)
    expect(L[0][0]).toBeCloseTo(2, 10)
    expect(L[0][1]).toBe(0)
    expect(L[1][0]).toBeCloseTo(1, 10)
    expect(L[1][1]).toBeCloseTo(Math.sqrt(2), 10)
  })

  it('satisfies A = L * L^T', () => {
    const A = [
      [4, 2],
      [2, 3],
    ]
    const L = choleskyDecomposition(A)
    // Compute L * L^T
    const n = L.length
    const LLT: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        let sum = 0
        for (let k = 0; k < n; k++) {
          sum += L[i][k] * L[j][k]
        }
        LLT[i][j] = sum
      }
    }
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        expect(LLT[i][j]).toBeCloseTo(A[i][j], 8)
      }
    }
  })

  it('decomposes a 3x3 identity matrix to identity', () => {
    const I = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]
    const L = choleskyDecomposition(I)
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        expect(L[i][j]).toBeCloseTo(i === j ? 1 : 0, 10)
      }
    }
  })

  it('returns lower triangular matrix (upper triangle is zero)', () => {
    const A = [
      [9, 6, 3],
      [6, 8, 4],
      [3, 4, 5],
    ]
    const L = choleskyDecomposition(A)
    for (let i = 0; i < 3; i++) {
      for (let j = i + 1; j < 3; j++) {
        expect(L[i][j]).toBe(0)
      }
    }
  })

  it('handles near-singular matrix with jitter', () => {
    // Matrix with zero eigenvalue — should succeed with jitter
    const A = [
      [1, 1],
      [1, 1],
    ]
    // Without jitter this would fail (not positive definite)
    // With 1e-8 jitter it should succeed
    const L = choleskyDecomposition(A)
    // Verify L exists and is lower triangular
    expect(L.length).toBe(2)
    expect(L[0][1]).toBe(0)
    // L * L^T should be close to A (within jitter tolerance)
    const reconstructed = matMul(L, [
      [L[0][0], L[1][0]],
      [L[0][1], L[1][1]],
    ])
    expect(reconstructed[0][0]).toBeCloseTo(1, 6)
    expect(reconstructed[0][1]).toBeCloseTo(1, 6)
  })

  it('handles double-jitter fallback for severely non-positive-definite matrix', () => {
    // Matrix with off-diagonal elements > diagonal elements.
    // After first jitter (adding 1e-8*I), Cholesky still encounters a negative
    // diagonal because sum of squared L values exceeds the jittered diagonal:
    //   L[0][0] = sqrt(1 + 1e-8) ≈ 1
    //   L[1][0] = 2 / 1 = 2
    //   diag for [1][1] = (1 + 1e-8) - 4 = -3 + 1e-8 < 0 → double-jitter fires
    // The double-jitter path sets L[i][j] = sqrt(1e-8) instead of throwing.
    const A = [
      [1, 2, 2],
      [2, 1, 2],
      [2, 2, 1],
    ]

    // Should not throw
    const L = choleskyDecomposition(A)

    // Verify output dimensions
    expect(L.length).toBe(3)
    expect(L[0].length).toBe(3)
    expect(L[1].length).toBe(3)
    expect(L[2].length).toBe(3)

    // Verify L is lower triangular
    expect(L[0][1]).toBe(0)
    expect(L[0][2]).toBe(0)
    expect(L[1][2]).toBe(0)

    // All diagonal elements should be positive (sqrt of positive value or sqrt(1e-8))
    for (let i = 0; i < 3; i++) {
      expect(L[i][i]).toBeGreaterThan(0)
    }

    // L*L^T won't perfectly reconstruct A because jitter modifies the matrix.
    // But the result should be a valid lower-triangular matrix with finite values.
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        expect(Number.isFinite(L[i][j])).toBe(true)
      }
    }
  })

  it('works with the 8x8 correlation matrix structure', () => {
    // Simplified version of the real 8x8 corr matrix (already positive semi-definite)
    const corr = [
      [1.0, 0.55, 0.85, -0.05, 0.60, 0.05, 0.02, 0.0],
      [0.55, 1.0, 0.65, -0.1, 0.5, 0.1, 0.02, 0.0],
      [0.85, 0.65, 1.0, -0.03, 0.55, 0.08, 0.02, 0.0],
      [-0.05, -0.1, -0.03, 1.0, 0.15, 0.2, 0.3, 0.0],
      [0.6, 0.5, 0.55, 0.15, 1.0, 0.1, 0.05, 0.0],
      [0.05, 0.1, 0.08, 0.2, 0.1, 1.0, 0.05, 0.0],
      [0.02, 0.02, 0.02, 0.3, 0.05, 0.05, 1.0, 0.0],
      [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0],
    ]
    const L = choleskyDecomposition(corr)
    expect(L.length).toBe(8)

    // Verify L * L^T ≈ corr
    const n = 8
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        let sum = 0
        for (let k = 0; k < n; k++) {
          sum += L[i][k] * L[j][k]
        }
        expect(sum).toBeCloseTo(corr[i][j], 6)
      }
    }
  })
})
