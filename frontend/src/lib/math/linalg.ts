/**
 * Linear algebra utilities for Monte Carlo simulation.
 * Replaces numpy.linalg.cholesky and matrix operations.
 */

/** Dot product of two equal-length vectors. */
export function dot(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i]
  }
  return sum
}

/** General matrix multiplication: A (m×n) * B (n×p) → C (m×p). */
export function matMul(A: number[][], B: number[][]): number[][] {
  const m = A.length
  const n = B.length
  const p = B[0].length
  const C: number[][] = Array.from({ length: m }, () => Array(p).fill(0))
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < p; j++) {
      let sum = 0
      for (let k = 0; k < n; k++) {
        sum += A[i][k] * B[k][j]
      }
      C[i][j] = sum
    }
  }
  return C
}

/** Matrix-vector multiplication: A (m×n) * v (n) → result (m). */
export function matVecMul(A: number[][], v: number[]): number[] {
  const m = A.length
  const result: number[] = Array(m).fill(0)
  for (let i = 0; i < m; i++) {
    let sum = 0
    for (let j = 0; j < v.length; j++) {
      sum += A[i][j] * v[j]
    }
    result[i] = sum
  }
  return result
}

/**
 * Build covariance matrix from standard deviations and correlation matrix.
 * cov[i][j] = stdDevs[i] * stdDevs[j] * correlationMatrix[i][j]
 */
export function buildCovarianceMatrix(
  stdDevs: number[],
  correlationMatrix: number[][]
): number[][] {
  const n = stdDevs.length
  const cov: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      cov[i][j] = stdDevs[i] * stdDevs[j] * correlationMatrix[i][j]
    }
  }
  return cov
}

/**
 * Cholesky decomposition of a symmetric positive-definite matrix A.
 * Returns lower triangular matrix L such that A = L * L^T.
 *
 * If A is not positive definite (diagonal element becomes non-positive during
 * decomposition), adds 1e-8 * I diagonal jitter and retries once.
 */
export function choleskyDecomposition(A: number[][]): number[][] {
  return choleskyInner(A, false)
}

function choleskyInner(A: number[][], jittered: boolean): number[][] {
  const n = A.length
  const L: number[][] = Array.from({ length: n }, () => Array(n).fill(0))

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0
      for (let k = 0; k < j; k++) {
        sum += L[i][k] * L[j][k]
      }

      if (i === j) {
        const diag = A[i][i] - sum
        if (diag <= 0) {
          if (jittered) {
            // Already jittered once — use a tiny positive value to avoid NaN
            L[i][j] = Math.sqrt(1e-8)
          } else {
            // Add jitter and retry
            return choleskyWithJitter(A)
          }
        } else {
          L[i][j] = Math.sqrt(diag)
        }
      } else {
        L[i][j] = (A[i][j] - sum) / L[j][j]
      }
    }
  }

  return L
}

function choleskyWithJitter(A: number[][]): number[][] {
  const n = A.length
  const jittered: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => A[i][j] + (i === j ? 1e-8 : 0))
  )
  return choleskyInner(jittered, true)
}
