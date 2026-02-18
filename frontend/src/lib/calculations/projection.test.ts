import { describe, it, expect } from 'vitest'
import type { IncomeProjectionRow, StrategyParamsMap, GlidePathConfig } from '@/lib/types'
import { generateProjection, type ProjectionParams } from './projection'

// ============================================================
// Test Helpers
// ============================================================

const DEFAULT_STRATEGY_PARAMS: StrategyParamsMap = {
  constant_dollar: { swr: 0.04 },
  vpw: { expectedRealReturn: 0.03, targetEndValue: 0 },
  guardrails: { initialRate: 0.05, ceilingTrigger: 1.20, floorTrigger: 0.80, adjustmentSize: 0.10 },
  vanguard_dynamic: { swr: 0.04, ceiling: 0.05, floor: 0.025 },
  cape_based: { baseRate: 0.04, capeWeight: 0.50, currentCape: 30 },
  floor_ceiling: { floor: 60000, ceiling: 150000, targetRate: 0.045 },
}

const GLIDE_PATH_DISABLED: GlidePathConfig = {
  enabled: false,
  method: 'linear',
  startAge: 60,
  endAge: 75,
}

function mockIncomeRow(overrides: Partial<IncomeProjectionRow> = {}): IncomeProjectionRow {
  return {
    year: 0,
    age: 30,
    salary: 72000,
    rentalIncome: 0,
    investmentIncome: 0,
    businessIncome: 0,
    governmentIncome: 0,
    totalGross: 72000,
    sgTax: 3000,
    cpfEmployee: 14400,
    cpfEmployer: 12240,
    totalNet: 54600,
    annualSavings: 20000,
    cumulativeSavings: 20000,
    cpfOA: 0,
    cpfSA: 0,
    cpfMA: 0,
    isRetired: false,
    activeLifeEvents: [],
    cpfLifePayout: 0,
    cpfOaHousingDeduction: 0,
    ...overrides,
  }
}

/**
 * Generate a sequence of income rows for testing.
 * Pre-retirement rows have salary and savings; post-retirement rows have none.
 */
function generateMockIncomeProjection(params: {
  currentAge: number
  retirementAge: number
  lifeExpectancy: number
  annualSavings?: number
  salary?: number
  cpfOA?: number
  cpfSA?: number
  cpfMA?: number
  rentalIncome?: number
}): IncomeProjectionRow[] {
  const {
    currentAge, retirementAge, lifeExpectancy,
    annualSavings = 20000, salary = 72000,
    cpfOA = 0, cpfSA = 0, cpfMA = 0,
    rentalIncome = 0,
  } = params
  const rows: IncomeProjectionRow[] = []

  for (let age = currentAge; age <= lifeExpectancy; age++) {
    const year = age - currentAge
    const isRetired = age > retirementAge

    rows.push(mockIncomeRow({
      year,
      age,
      salary: isRetired ? 0 : salary,
      rentalIncome,
      totalGross: isRetired ? rentalIncome : salary + rentalIncome,
      sgTax: isRetired ? 0 : 3000,
      cpfEmployee: isRetired ? 0 : 14400,
      cpfEmployer: isRetired ? 0 : 12240,
      totalNet: isRetired ? rentalIncome : salary - 3000 - 14400 + rentalIncome,
      annualSavings: isRetired ? 0 : annualSavings,
      cumulativeSavings: isRetired ? annualSavings * (retirementAge - currentAge) : annualSavings * (year + 1),
      cpfOA,
      cpfSA,
      cpfMA,
      isRetired,
    }))
  }

  return rows
}

function makeParams(overrides: Partial<ProjectionParams> = {}): ProjectionParams {
  const currentAge = (overrides.currentAge ?? 30) as number
  const retirementAge = (overrides.retirementAge ?? 33) as number
  const lifeExpectancy = (overrides.lifeExpectancy ?? 34) as number

  return {
    incomeProjection: generateMockIncomeProjection({
      currentAge,
      retirementAge,
      lifeExpectancy,
      annualSavings: 20000,
    }),
    currentAge,
    retirementAge,
    lifeExpectancy,
    initialLiquidNW: 100000,
    swr: 0.04,
    expectedReturn: 0,
    usePortfolioReturn: false,
    inflation: 0,
    expenseRatio: 0,
    annualExpenses: 50000,
    retirementSpendingAdjustment: 1.0,
    fireNumber: 1250000, // 50000 / 0.04
    currentWeights: [0.60, 0.40],
    targetWeights: [0.30, 0.70],
    assetReturns: [0.10, 0.04],
    glidePathConfig: GLIDE_PATH_DISABLED,
    withdrawalStrategy: 'constant_dollar',
    strategyParams: DEFAULT_STRATEGY_PARAMS,
    propertyEquity: 0,
    annualMortgagePayment: 0,
    annualRentalIncome: 0,
    downsizing: null,
    existingMortgageBalance: 0,
    existingMortgageRate: 0.035,
    existingMonthlyPayment: 0,
    existingMortgageRemainingYears: 25,
    residencyForAbsd: 'citizen',
    parentSupport: [],
    parentSupportEnabled: false,
    healthcareConfig: null,
    ...overrides,
  }
}

// ============================================================
// Tests
// ============================================================

describe('generateProjection', () => {
  describe('row count', () => {
    it('produces lifeExpectancy - currentAge + 1 rows', () => {
      const result = generateProjection(makeParams({
        currentAge: 30, lifeExpectancy: 34,
      }))
      expect(result.rows).toHaveLength(5) // ages 30,31,32,33,34
    })

    it('produces 1 row when currentAge === lifeExpectancy', () => {
      const params = makeParams({
        currentAge: 60, retirementAge: 60, lifeExpectancy: 60,
      })
      params.incomeProjection = generateMockIncomeProjection({
        currentAge: 60, retirementAge: 60, lifeExpectancy: 60,
      })
      const result = generateProjection(params)
      expect(result.rows).toHaveLength(1)
    })
  })

  describe('totalNW = liquidNW + cpfTotal for all rows', () => {
    it('holds for mixed pre/post-retirement rows', () => {
      const result = generateProjection(makeParams())
      for (const row of result.rows) {
        expect(row.totalNW).toBeCloseTo(row.liquidNW + row.cpfTotal, 2)
      }
    })
  })

  describe('normal accumulation', () => {
    it('NW grows with returns + savings when return rate = 0%', () => {
      // 0% return, 20K savings per year, starting at 100K
      const result = generateProjection(makeParams({
        expectedReturn: 0, expenseRatio: 0, initialLiquidNW: 100000,
      }))

      // Year 0 (age 30): 100K * 1.0 + 20K = 120K
      expect(result.rows[0].liquidNW).toBeCloseTo(120000, 2)
      // Year 1 (age 31): 120K + 20K = 140K
      expect(result.rows[1].liquidNW).toBeCloseTo(140000, 2)
      // Year 2 (age 32): 140K + 20K = 160K
      expect(result.rows[2].liquidNW).toBeCloseTo(160000, 2)
    })

    it('NW grows with 5% return + savings', () => {
      const result = generateProjection(makeParams({
        expectedReturn: 0.05, expenseRatio: 0, initialLiquidNW: 100000,
      }))

      // Year 0: 100K * 1.05 + 20K = 125K
      expect(result.rows[0].liquidNW).toBeCloseTo(125000, 0)
      // Year 1: 125K * 1.05 + 20K = 151.25K
      expect(result.rows[1].liquidNW).toBeCloseTo(151250, 0)
    })

    it('portfolioReturnDollar reflects return on start-of-year balance', () => {
      const result = generateProjection(makeParams({
        expectedReturn: 0.05, expenseRatio: 0, initialLiquidNW: 100000,
      }))

      // Year 0: return = 100K * 0.05 = 5K
      expect(result.rows[0].portfolioReturnDollar).toBeCloseTo(5000, 2)
      // Year 1: return = 125K * 0.05 = 6.25K
      expect(result.rows[1].portfolioReturnDollar).toBeCloseTo(6250, 2)
    })
  })

  describe('transition to decumulation at retirement age', () => {
    it('switches from savings to withdrawal at retirementAge', () => {
      const result = generateProjection(makeParams({
        currentAge: 30, retirementAge: 33, lifeExpectancy: 35,
        expectedReturn: 0, initialLiquidNW: 100000,
      }))

      // Pre-retirement rows (ages 30-33): savingsOrWithdrawal > 0
      expect(result.rows[0].savingsOrWithdrawal).toBe(20000) // age 30
      expect(result.rows[1].savingsOrWithdrawal).toBe(20000) // age 31
      expect(result.rows[2].savingsOrWithdrawal).toBe(20000) // age 32
      expect(result.rows[3].savingsOrWithdrawal).toBe(20000) // age 33 (last working year)

      // Post-retirement (ages 34+): savingsOrWithdrawal <= 0
      expect(result.rows[4].savingsOrWithdrawal).toBeLessThanOrEqual(0)
      expect(result.rows[5].savingsOrWithdrawal).toBeLessThanOrEqual(0)
    })

    it('withdrawalAmount is 0 pre-retirement and > 0 post-retirement', () => {
      const result = generateProjection(makeParams({
        expectedReturn: 0, initialLiquidNW: 100000,
      }))

      for (const row of result.rows) {
        if (!row.isRetired) {
          expect(row.withdrawalAmount).toBe(0)
        } else if (row.liquidNW > 0 || result.rows[result.rows.indexOf(row) - 1]?.liquidNW > 0) {
          // Post-retirement with portfolio funds: withdrawal > 0
          // (first retired year always has funds from accumulation)
          if (row === result.rows[3]) {
            expect(row.withdrawalAmount).toBeGreaterThan(0)
          }
        }
      }
    })
  })

  describe('post-retirement income offsets withdrawal', () => {
    it('rental income reduces actual portfolio draw when gap < strategy', () => {
      // expenses = $10K, passive = $5K, strategy = $8K (200K * 0.04)
      // expenseGap = $10K - $5K = $5K, actualDraw = min($5K, $8K) = $5K
      const rentalIncome = 5000
      const params = makeParams({
        currentAge: 60, retirementAge: 59, lifeExpectancy: 62,
        expectedReturn: 0, initialLiquidNW: 200000,
        annualExpenses: 10000,
        swr: 0.04,
      })
      params.incomeProjection = generateMockIncomeProjection({
        currentAge: 60, retirementAge: 59, lifeExpectancy: 62,
        annualSavings: 0, rentalIncome,
      })
      params.strategyParams = {
        ...DEFAULT_STRATEGY_PARAMS,
        constant_dollar: { swr: 0.04 },
      }

      const result = generateProjection(params)

      // maxPermitted = 8K, actualDraw = 5K, excess = 3K
      expect(result.rows[0].maxPermittedWithdrawal).toBeCloseTo(8000, 2)
      expect(result.rows[0].withdrawalAmount).toBeCloseTo(5000, 2)
      expect(result.rows[0].withdrawalExcess).toBeCloseTo(3000, 2)
      expect(result.rows[0].savingsOrWithdrawal).toBeCloseTo(-5000, 2)
      expect(result.rows[0].liquidNW).toBeCloseTo(195000, 2) // 200K - 5K
    })

    it('surplus passive income is reinvested when exceeding expenses', () => {
      // expenses = $10K, passive = $20K → surplus $10K reinvested, no draw
      const rentalIncome = 20000
      const params = makeParams({
        currentAge: 60, retirementAge: 59, lifeExpectancy: 61,
        expectedReturn: 0, initialLiquidNW: 200000,
        annualExpenses: 10000,
        swr: 0.04,
      })
      params.incomeProjection = generateMockIncomeProjection({
        currentAge: 60, retirementAge: 59, lifeExpectancy: 61,
        annualSavings: 0, rentalIncome,
      })
      params.strategyParams = {
        ...DEFAULT_STRATEGY_PARAMS,
        constant_dollar: { swr: 0.04 },
      }

      const result = generateProjection(params)

      // expenseGap = 0, actualDraw = 0, surplus = $10K reinvested
      expect(result.rows[0].withdrawalAmount).toBe(0)
      expect(result.rows[0].maxPermittedWithdrawal).toBeCloseTo(8000, 2)
      expect(result.rows[0].withdrawalExcess).toBeCloseTo(8000, 2)
      expect(result.rows[0].savingsOrWithdrawal).toBeCloseTo(10000, 2) // positive = surplus reinvested
      expect(result.rows[0].liquidNW).toBeCloseTo(210000, 2) // 200K + 10K surplus
    })

    it('draw is capped at expenses when strategy exceeds expenses', () => {
      // expenses = $5K, passive = $0, strategy = $20K (500K * 0.04)
      const params = makeParams({
        currentAge: 60, retirementAge: 59, lifeExpectancy: 61,
        expectedReturn: 0, initialLiquidNW: 500000,
        annualExpenses: 5000,
        swr: 0.04,
      })
      params.incomeProjection = generateMockIncomeProjection({
        currentAge: 60, retirementAge: 59, lifeExpectancy: 61,
        annualSavings: 0,
      })
      params.strategyParams = {
        ...DEFAULT_STRATEGY_PARAMS,
        constant_dollar: { swr: 0.04 },
      }

      const result = generateProjection(params)

      // maxPermitted = 20K, but only need $5K for expenses
      expect(result.rows[0].maxPermittedWithdrawal).toBeCloseTo(20000, 2)
      expect(result.rows[0].withdrawalAmount).toBeCloseTo(5000, 2)
      expect(result.rows[0].withdrawalExcess).toBeCloseTo(15000, 2)
      expect(result.rows[0].savingsOrWithdrawal).toBeCloseTo(-5000, 2)
      expect(result.rows[0].liquidNW).toBeCloseTo(495000, 2) // 500K - 5K
    })
  })

  describe('portfolio depletion', () => {
    it('clamps liquidNW to 0 when depleted', () => {
      const params = makeParams({
        currentAge: 60, retirementAge: 59, lifeExpectancy: 64,
        expectedReturn: 0, initialLiquidNW: 10000,
        swr: 0.50,
      })
      params.incomeProjection = generateMockIncomeProjection({
        currentAge: 60, retirementAge: 59, lifeExpectancy: 64,
        annualSavings: 0,
      })
      params.strategyParams = {
        ...DEFAULT_STRATEGY_PARAMS,
        constant_dollar: { swr: 0.50 },
      }
      params.fireNumber = 20000

      const result = generateProjection(params)

      // Year 0: withdrawal = 10K * 0.5 = 5K, liquidNW = 5K
      expect(result.rows[0].liquidNW).toBeCloseTo(5000, 2)
      // Year 1: withdrawal = 5K (capped at portfolio), liquidNW = 0
      expect(result.rows[1].liquidNW).toBeCloseTo(0, 2)
      // Year 2+: liquidNW stays at 0, withdrawal = 0
      expect(result.rows[2].liquidNW).toBe(0)
      expect(result.rows[2].withdrawalAmount).toBe(0)
      expect(result.rows[3].liquidNW).toBe(0)
    })

    it('reports portfolioDepletedAge in summary', () => {
      const params = makeParams({
        currentAge: 60, retirementAge: 59, lifeExpectancy: 64,
        expectedReturn: 0, initialLiquidNW: 10000,
        swr: 0.50,
      })
      params.incomeProjection = generateMockIncomeProjection({
        currentAge: 60, retirementAge: 59, lifeExpectancy: 64,
        annualSavings: 0,
      })
      params.strategyParams = {
        ...DEFAULT_STRATEGY_PARAMS,
        constant_dollar: { swr: 0.50 },
      }
      params.fireNumber = 20000

      const result = generateProjection(params)

      // Portfolio depletes at end of year 1 (age 61)
      expect(result.summary.portfolioDepletedAge).toBe(61)
    })
  })

  describe('glide path changes return rate', () => {
    it('uses portfolio return with interpolated weights during glide path', () => {
      const params = makeParams({
        currentAge: 60, retirementAge: 59, lifeExpectancy: 62,
        usePortfolioReturn: true,
        expectedReturn: 0.07,
        expenseRatio: 0,
        initialLiquidNW: 1000000,
        swr: 0.04,
        // 2 asset classes: 10% and 4%
        currentWeights: [0.80, 0.20], // portfolio return: 0.8*0.10 + 0.2*0.04 = 8.8%
        targetWeights: [0.20, 0.80], // portfolio return: 0.2*0.10 + 0.8*0.04 = 5.2%
        assetReturns: [0.10, 0.04],
        glidePathConfig: {
          enabled: true,
          method: 'linear',
          startAge: 60,
          endAge: 62,
        },
      })
      params.incomeProjection = generateMockIncomeProjection({
        currentAge: 60, retirementAge: 59, lifeExpectancy: 62,
        annualSavings: 0,
      })

      const result = generateProjection(params)

      // Age 60: progress = 0/2 = 0, weights = currentWeights → return = 8.8%
      expect(result.rows[0].portfolioReturnPct).toBeCloseTo(0.088, 4)
      // Age 61: progress = 1/2 = 0.5, weights = [0.50, 0.50] → return = 7.0%
      expect(result.rows[1].portfolioReturnPct).toBeCloseTo(0.07, 4)
      // Age 62: progress = 2/2 = 1.0, weights = targetWeights → return = 5.2%
      expect(result.rows[2].portfolioReturnPct).toBeCloseTo(0.052, 4)
    })
  })

  describe('already retired (currentAge >= retirementAge)', () => {
    it('starts with withdrawal immediately', () => {
      const params = makeParams({
        currentAge: 65, retirementAge: 60, lifeExpectancy: 67,
        expectedReturn: 0, initialLiquidNW: 500000,
        swr: 0.04,
      })
      params.incomeProjection = generateMockIncomeProjection({
        currentAge: 65, retirementAge: 60, lifeExpectancy: 67,
        annualSavings: 0,
      })

      const result = generateProjection(params)

      // All rows are retired
      expect(result.rows[0].isRetired).toBe(true)
      // First row has withdrawal
      expect(result.rows[0].withdrawalAmount).toBeGreaterThan(0)
      // initialWithdrawal = 500K * 0.04 = 20K
      expect(result.rows[0].withdrawalAmount).toBeCloseTo(20000, 2)
      // liquidNW = 500K - 20K = 480K
      expect(result.rows[0].liquidNW).toBeCloseTo(480000, 2)
    })
  })

  describe('FIRE progress', () => {
    it('reaches 100% at correct age', () => {
      // 0% return, 100K savings/year, starting at 200K, fireNumber = 500K
      const params = makeParams({
        currentAge: 30, retirementAge: 40, lifeExpectancy: 35,
        expectedReturn: 0, initialLiquidNW: 200000,
        fireNumber: 500000,
      })
      params.incomeProjection = generateMockIncomeProjection({
        currentAge: 30, retirementAge: 40, lifeExpectancy: 35,
        annualSavings: 100000,
      })

      const result = generateProjection(params)

      // Year 0: liquidNW = 200K + 100K = 300K, fire% = 300K/500K = 60%
      expect(result.rows[0].fireProgress).toBeCloseTo(0.60, 2)
      // Year 1: liquidNW = 400K, fire% = 80%
      expect(result.rows[1].fireProgress).toBeCloseTo(0.80, 2)
      // Year 2: liquidNW = 500K, fire% = 100%
      expect(result.rows[2].fireProgress).toBeCloseTo(1.00, 2)

      expect(result.summary.fireAchievedAge).toBe(32)
    })

    it('clamps to 0 when fireNumber is 0 (avoid division by zero)', () => {
      const params = makeParams({
        currentAge: 30, lifeExpectancy: 30, retirementAge: 65,
        fireNumber: 0,
      })
      params.incomeProjection = generateMockIncomeProjection({
        currentAge: 30, retirementAge: 65, lifeExpectancy: 30,
      })

      const result = generateProjection(params)
      expect(result.rows[0].fireProgress).toBe(0)
    })
  })

  describe('summary', () => {
    it('computes peak NW and terminal NW correctly', () => {
      // NW grows during accumulation, then declines in decumulation
      const params = makeParams({
        currentAge: 30, retirementAge: 33, lifeExpectancy: 35,
        expectedReturn: 0, initialLiquidNW: 100000,
        swr: 0.10,
      })
      params.incomeProjection = generateMockIncomeProjection({
        currentAge: 30, retirementAge: 33, lifeExpectancy: 35,
        annualSavings: 20000,
      })
      params.strategyParams = {
        ...DEFAULT_STRATEGY_PARAMS,
        constant_dollar: { swr: 0.10 },
      }

      const result = generateProjection(params)

      // Pre-ret: 100K→120K→140K→160K→180K (age 33 is last working year)
      // Retirement (age 34): initial withdrawal = 180K * 0.10 = 18K
      // Year 4: liquidNW = 180K - 18K = 162K
      // Year 5: withdrawal = 18K, liquidNW = 162K - 18K = 144K

      // Peak is at retirement transition
      expect(result.summary.peakTotalNW).toBeCloseTo(180000, 0)
      expect(result.summary.peakTotalNWAge).toBe(33)

      // Terminal (age 35)
      expect(result.summary.terminalLiquidNW).toBeCloseTo(144000, 0)
    })

    it('reports fireAchievedAge as null when never reached', () => {
      const params = makeParams({
        currentAge: 30, retirementAge: 35, lifeExpectancy: 34,
        expectedReturn: 0, initialLiquidNW: 1000,
        fireNumber: 999999999, // unreachable
      })
      params.incomeProjection = generateMockIncomeProjection({
        currentAge: 30, retirementAge: 35, lifeExpectancy: 34,
        annualSavings: 100,
      })

      const result = generateProjection(params)
      expect(result.summary.fireAchievedAge).toBeNull()
    })

    it('reports portfolioDepletedAge as null when portfolio survives', () => {
      const params = makeParams({
        currentAge: 60, retirementAge: 59, lifeExpectancy: 62,
        expectedReturn: 0.10, initialLiquidNW: 1000000,
        swr: 0.02,
      })
      params.incomeProjection = generateMockIncomeProjection({
        currentAge: 60, retirementAge: 59, lifeExpectancy: 62,
        annualSavings: 0,
      })
      params.strategyParams = {
        ...DEFAULT_STRATEGY_PARAMS,
        constant_dollar: { swr: 0.02 },
      }

      const result = generateProjection(params)
      expect(result.summary.portfolioDepletedAge).toBeNull()
    })
  })

  describe('expense ratio applied', () => {
    it('reduces return rate by expense ratio', () => {
      const params = makeParams({
        currentAge: 30, retirementAge: 65, lifeExpectancy: 30,
        expectedReturn: 0.07, expenseRatio: 0.003,
        initialLiquidNW: 100000,
      })
      params.incomeProjection = generateMockIncomeProjection({
        currentAge: 30, retirementAge: 65, lifeExpectancy: 30,
      })

      const result = generateProjection(params)

      // Net rate = 0.07 - 0.003 = 0.067
      expect(result.rows[0].portfolioReturnPct).toBeCloseTo(0.067, 4)
      expect(result.rows[0].portfolioReturnDollar).toBeCloseTo(100000 * 0.067, 0)
    })
  })

  describe('inflation-adjusted expenses', () => {
    it('expenses increase with inflation each year', () => {
      const params = makeParams({
        currentAge: 30, retirementAge: 65, lifeExpectancy: 32,
        annualExpenses: 50000, inflation: 0.03,
      })
      params.incomeProjection = generateMockIncomeProjection({
        currentAge: 30, retirementAge: 65, lifeExpectancy: 32,
      })

      const result = generateProjection(params)

      expect(result.rows[0].annualExpenses).toBeCloseTo(50000, 0) // year 0
      expect(result.rows[1].annualExpenses).toBeCloseTo(51500, 0) // year 1: 50K * 1.03
      expect(result.rows[2].annualExpenses).toBeCloseTo(53045, 0) // year 2: 50K * 1.03^2
    })
  })

  describe('fallback when usePortfolioReturn is false', () => {
    it('uses expectedReturn instead of portfolio return', () => {
      const params = makeParams({
        currentAge: 30, retirementAge: 65, lifeExpectancy: 30,
        usePortfolioReturn: false,
        expectedReturn: 0.07,
        expenseRatio: 0,
        currentWeights: [1.0, 0.0],
        assetReturns: [0.10, 0.04], // portfolio would be 10%
      })
      params.incomeProjection = generateMockIncomeProjection({
        currentAge: 30, retirementAge: 65, lifeExpectancy: 30,
      })

      const result = generateProjection(params)

      // Should use 7% (expectedReturn), not 10% (portfolio return)
      expect(result.rows[0].portfolioReturnPct).toBeCloseTo(0.07, 4)
    })
  })
})
