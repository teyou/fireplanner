import { describe, it, expect } from 'vitest'
import {
  calculateHealthcareCostAtAge,
  calculateMediSaveDeduction,
  projectMediSaveTimeline,
  generateHealthcareProjection,
  calculateLifetimeHealthcareCost,
  type HealthcareConfig,
} from './healthcare'

const DEFAULT_CONFIG: HealthcareConfig = {
  enabled: true,
  mediShieldLifeEnabled: true,
  ispTier: 'none',
  careShieldLifeEnabled: true,
  oopBaseAmount: 1200,
  oopModel: 'age-curve',
  mediSaveTopUpAnnual: 0,
}

describe('calculateHealthcareCostAtAge', () => {
  it('returns all zeros when disabled', () => {
    const result = calculateHealthcareCostAtAge({ ...DEFAULT_CONFIG, enabled: false }, 50)
    expect(result.totalCost).toBe(0)
    expect(result.cashOutlay).toBe(0)
    expect(result.mediSaveDeductible).toBe(0)
  })

  it('includes MediShield Life premium at age 30', () => {
    const result = calculateHealthcareCostAtAge(DEFAULT_CONFIG, 30)
    expect(result.mediShieldLifePremium).toBe(175) // age 21-30 bracket
  })

  it('includes MediShield Life premium at age 65', () => {
    const result = calculateHealthcareCostAtAge(DEFAULT_CONFIG, 65)
    expect(result.mediShieldLifePremium).toBe(980) // age 61-65 bracket
  })

  it('has no MediShield when disabled', () => {
    const config: HealthcareConfig = { ...DEFAULT_CONFIG, mediShieldLifeEnabled: false }
    const result = calculateHealthcareCostAtAge(config, 50)
    expect(result.mediShieldLifePremium).toBe(0)
  })

  it('includes ISP additional premiums when tier is set', () => {
    const config: HealthcareConfig = { ...DEFAULT_CONFIG, ispTier: 'standard' }
    const result = calculateHealthcareCostAtAge(config, 50)
    expect(result.ispAdditionalPremium).toBe(1000) // standard tier, age 41-50
  })

  it('has no ISP additional when tier is none', () => {
    const result = calculateHealthcareCostAtAge(DEFAULT_CONFIG, 50)
    expect(result.ispAdditionalPremium).toBe(0)
  })

  it('includes CareShield LIFE premiums for age 30-67', () => {
    const result = calculateHealthcareCostAtAge(DEFAULT_CONFIG, 45)
    expect(result.careShieldLifePremium).toBe(290) // age 41-45 bracket
  })

  it('has no CareShield LIFE premiums after age 67', () => {
    const result = calculateHealthcareCostAtAge(DEFAULT_CONFIG, 70)
    expect(result.careShieldLifePremium).toBe(0)
  })

  it('has no CareShield when disabled', () => {
    const config: HealthcareConfig = { ...DEFAULT_CONFIG, careShieldLifeEnabled: false }
    const result = calculateHealthcareCostAtAge(config, 45)
    expect(result.careShieldLifePremium).toBe(0)
  })

  it('calculates OOP with age-curve model', () => {
    const result30 = calculateHealthcareCostAtAge(DEFAULT_CONFIG, 30)
    const result65 = calculateHealthcareCostAtAge(DEFAULT_CONFIG, 65)
    // At 30: multiplier = 1.0, OOP = 1200
    expect(result30.oopExpense).toBeCloseTo(1200, 0)
    // At 65: multiplier = 3.2, OOP = 1200 * 3.2 = 3840
    expect(result65.oopExpense).toBeCloseTo(3840, 0)
  })

  it('calculates OOP with fixed model', () => {
    const config: HealthcareConfig = { ...DEFAULT_CONFIG, oopModel: 'fixed', oopBaseAmount: 2000 }
    const result30 = calculateHealthcareCostAtAge(config, 30)
    const result80 = calculateHealthcareCostAtAge(config, 80)
    expect(result30.oopExpense).toBe(2000)
    expect(result80.oopExpense).toBe(2000)
  })

  it('computes totalCost as sum of all components', () => {
    const config: HealthcareConfig = { ...DEFAULT_CONFIG, ispTier: 'basic' }
    const result = calculateHealthcareCostAtAge(config, 50)
    const expectedTotal = result.mediShieldLifePremium +
      result.ispAdditionalPremium +
      result.careShieldLifePremium +
      result.oopExpense
    expect(result.totalCost).toBeCloseTo(expectedTotal, 2)
  })

  it('cash outlay = total - MediSave deductible', () => {
    const config: HealthcareConfig = { ...DEFAULT_CONFIG, ispTier: 'enhanced' }
    const result = calculateHealthcareCostAtAge(config, 50)
    expect(result.cashOutlay).toBeCloseTo(result.totalCost - result.mediSaveDeductible, 2)
  })

  it('cash outlay >= 0 (never negative)', () => {
    const result = calculateHealthcareCostAtAge(DEFAULT_CONFIG, 30)
    expect(result.cashOutlay).toBeGreaterThanOrEqual(0)
  })
})

describe('calculateMediSaveDeduction', () => {
  it('fully covers MediShield Life premiums', () => {
    const deduction = calculateMediSaveDeduction(500, 0, 0, 50)
    expect(deduction).toBe(500)
  })

  it('caps ISP additional at AWL', () => {
    // AWL at age 50: 600
    const deduction = calculateMediSaveDeduction(0, 1000, 0, 50)
    expect(deduction).toBe(600) // capped at AWL
  })

  it('ISP below AWL is fully deductible', () => {
    // AWL at age 50: 600
    const deduction = calculateMediSaveDeduction(0, 400, 0, 50)
    expect(deduction).toBe(400)
  })

  it('fully covers CareShield LIFE premiums', () => {
    const deduction = calculateMediSaveDeduction(0, 0, 300, 50)
    expect(deduction).toBe(300)
  })

  it('combines all deductible components', () => {
    const deduction = calculateMediSaveDeduction(500, 800, 300, 50)
    // MediShield: 500 (full)
    // ISP: min(800, AWL=600) = 600
    // CareShield: 300
    expect(deduction).toBe(1400)
  })

  it('deduction never exceeds premiums total', () => {
    const deduction = calculateMediSaveDeduction(100, 100, 100, 30)
    // MediShield: 100, ISP: min(100, AWL=300) = 100, CareShield: 100
    expect(deduction).toBe(300)
  })
})

describe('projectMediSaveTimeline', () => {
  it('returns entries for each year', () => {
    const maBalances = Array.from({ length: 11 }, (_, i) => 50000 + i * 2000) // 50K growing
    const timeline = projectMediSaveTimeline(DEFAULT_CONFIG, 30, 40, maBalances, 0)
    expect(timeline.entries).toHaveLength(11)
    expect(timeline.entries[0].age).toBe(30)
    expect(timeline.entries[10].age).toBe(40)
  })

  it('deducts healthcare premiums from MA balance', () => {
    const maBalances = [50000, 52000]
    const timeline = projectMediSaveTimeline(DEFAULT_CONFIG, 30, 31, maBalances, 0)
    expect(timeline.entries[0].healthcareDeduction).toBeGreaterThan(0)
    expect(timeline.entries[0].endBalance).toBeLessThan(50000)
  })

  it('detects depletion when MA runs out', () => {
    // Very small MA, high costs
    const config: HealthcareConfig = { ...DEFAULT_CONFIG, ispTier: 'enhanced' }
    const maBalances = Array.from({ length: 31 }, () => 100) // tiny MA
    const timeline = projectMediSaveTimeline(config, 60, 90, maBalances, 0)
    expect(timeline.depletionAge).not.toBeNull()
    expect(timeline.depletionAge).toBeGreaterThanOrEqual(60)
  })

  it('returns null depletion when MA never depletes', () => {
    const maBalances = Array.from({ length: 11 }, () => 1000000) // very large MA
    const timeline = projectMediSaveTimeline(DEFAULT_CONFIG, 30, 40, maBalances, 0)
    expect(timeline.depletionAge).toBeNull()
  })

  it('applies annual top-up', () => {
    const maBalances = [50000, 52000]
    const withTopUp = projectMediSaveTimeline(DEFAULT_CONFIG, 30, 31, maBalances, 5000)
    const withoutTopUp = projectMediSaveTimeline(DEFAULT_CONFIG, 30, 31, maBalances, 0)
    expect(withTopUp.entries[0].endBalance).toBeGreaterThan(withoutTopUp.entries[0].endBalance)
  })
})

describe('generateHealthcareProjection', () => {
  it('returns empty when disabled', () => {
    const projection = generateHealthcareProjection({ ...DEFAULT_CONFIG, enabled: false }, 30, 90)
    expect(projection.rows).toHaveLength(0)
    expect(projection.lifetimeTotalCost).toBe(0)
    expect(projection.lifetimeCashOutlay).toBe(0)
    expect(projection.lifetimeMediSaveUsed).toBe(0)
  })

  it('generates rows from startAge to endAge', () => {
    const projection = generateHealthcareProjection(DEFAULT_CONFIG, 30, 90)
    expect(projection.rows).toHaveLength(61) // 30 to 90 inclusive
    expect(projection.rows[0].age).toBe(30)
    expect(projection.rows[60].age).toBe(90)
  })

  it('lifetime cost is sum of all row costs', () => {
    const projection = generateHealthcareProjection(DEFAULT_CONFIG, 30, 50)
    const manualSum = projection.rows.reduce((acc, r) => acc + r.totalCost, 0)
    expect(projection.lifetimeTotalCost).toBeCloseTo(manualSum, 2)
  })

  it('lifetime cash outlay is sum of all row cash outlays', () => {
    const projection = generateHealthcareProjection(DEFAULT_CONFIG, 30, 50)
    const manualSum = projection.rows.reduce((acc, r) => acc + r.cashOutlay, 0)
    expect(projection.lifetimeCashOutlay).toBeCloseTo(manualSum, 2)
  })

  it('lifetime MediSave used is sum of all row deductibles', () => {
    const projection = generateHealthcareProjection(DEFAULT_CONFIG, 30, 50)
    const manualSum = projection.rows.reduce((acc, r) => acc + r.mediSaveDeductible, 0)
    expect(projection.lifetimeMediSaveUsed).toBeCloseTo(manualSum, 2)
  })

  it('costs increase with age', () => {
    const projection = generateHealthcareProjection(DEFAULT_CONFIG, 30, 90)
    const costAt30 = projection.rows.find((r) => r.age === 30)!.totalCost
    const costAt80 = projection.rows.find((r) => r.age === 80)!.totalCost
    expect(costAt80).toBeGreaterThan(costAt30)
  })
})

describe('calculateLifetimeHealthcareCost', () => {
  it('returns the lifetimeTotalCost from projection', () => {
    const projection = generateHealthcareProjection(DEFAULT_CONFIG, 30, 50)
    expect(calculateLifetimeHealthcareCost(projection)).toBe(projection.lifetimeTotalCost)
  })
})

describe('invariants', () => {
  const AGES = [30, 40, 50, 60, 70, 80, 90]
  const CONFIGS: HealthcareConfig[] = [
    DEFAULT_CONFIG,
    { ...DEFAULT_CONFIG, ispTier: 'basic' },
    { ...DEFAULT_CONFIG, ispTier: 'standard' },
    { ...DEFAULT_CONFIG, ispTier: 'enhanced' },
    { ...DEFAULT_CONFIG, oopModel: 'fixed' },
    { ...DEFAULT_CONFIG, mediShieldLifeEnabled: false, careShieldLifeEnabled: false },
  ]

  for (const config of CONFIGS) {
    for (const age of AGES) {
      it(`total >= 0 at age ${age} (ISP: ${config.ispTier}, OOP: ${config.oopModel})`, () => {
        const result = calculateHealthcareCostAtAge(config, age)
        expect(result.totalCost).toBeGreaterThanOrEqual(0)
      })

      it(`MediSave deduction <= premium total at age ${age}`, () => {
        const result = calculateHealthcareCostAtAge(config, age)
        const premiumTotal = result.mediShieldLifePremium + result.ispAdditionalPremium + result.careShieldLifePremium
        expect(result.mediSaveDeductible).toBeLessThanOrEqual(premiumTotal)
      })

      it(`cash outlay = total - deductible at age ${age}`, () => {
        const result = calculateHealthcareCostAtAge(config, age)
        expect(result.cashOutlay).toBeCloseTo(Math.max(0, result.totalCost - result.mediSaveDeductible), 2)
      })
    }
  }
})
