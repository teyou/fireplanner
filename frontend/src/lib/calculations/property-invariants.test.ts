import { describe, it } from 'vitest'
import * as fc from 'fast-check'
import { calculateFireNumber, calculateYearsToFire } from './fire'
import { calculateProgressiveTax } from './tax'
import { calculateCpfContribution } from './cpf'
import { calculateBSD, calculateABSD } from './property'
import { calculateOneTimeCost, calculateRecurringCost } from './timeCost'

describe('property-based invariants', () => {
  it('FIRE number is always positive when expenses > 0 and SWR > 0', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 1000000, noNaN: true }),
        fc.double({ min: 0.001, max: 0.1, noNaN: true }),
        (expenses, swr) => {
          return calculateFireNumber(expenses, swr) > 0
        },
      ),
    )
  })

  it('years to FIRE >= 0 with positive return and savings', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.001, max: 0.2, noNaN: true }),
        fc.double({ min: 1000, max: 500000, noNaN: true }),
        fc.double({ min: 0, max: 5000000, noNaN: true }),
        fc.double({ min: 100000, max: 10000000, noNaN: true }),
        (r, savings, nw, fire) => {
          const years = calculateYearsToFire(r, savings, nw, fire)
          return years >= 0 || years === Infinity
        },
      ),
    )
  })

  it('tax payable <= chargeable income', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 2000000, noNaN: true }),
        (chargeableIncome) => {
          const result = calculateProgressiveTax(chargeableIncome)
          return result.taxPayable <= Math.max(0, chargeableIncome)
        },
      ),
    )
  })

  it('tax payable >= 0', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 2000000, noNaN: true }),
        (chargeableIncome) => {
          const result = calculateProgressiveTax(chargeableIncome)
          return result.taxPayable >= 0
        },
      ),
    )
  })

  it('CPF contribution <= salary × max rate (37%)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 200000, noNaN: true }),
        fc.integer({ min: 18, max: 100 }),
        (salary, age) => {
          const result = calculateCpfContribution(salary, age)
          return result.total <= salary * 0.37 + 0.01
        },
      ),
    )
  })

  it('BSD monotonically increases with price', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 100000, max: 5000000, noNaN: true }),
        fc.double({ min: 100001, max: 5000001, noNaN: true }),
        (price1, price2) => {
          const lower = Math.min(price1, price2)
          const higher = Math.max(price1, price2)
          if (lower === higher) return true
          return calculateBSD(higher) >= calculateBSD(lower)
        },
      ),
    )
  })

  it('ABSD >= 0', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 100000, max: 10000000, noNaN: true }),
        fc.constantFrom('citizen' as const, 'pr' as const, 'foreigner' as const),
        fc.integer({ min: 0, max: 5 }),
        (price, residency, count) => {
          return calculateABSD(price, residency, count) >= 0
        },
      ),
    )
  })

  it('one-time cost delay >= 0', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 200000, noNaN: true }),
        (amount) => {
          const result = calculateOneTimeCost({
            annualExpenses: 48000,
            annualIncome: 72000,
            liquidNetWorth: 100000,
            cpfTotal: 50000,
            swr: 0.04,
            netRealReturn: 0.044,
            retirementAge: 55,
            currentAge: 30,
          }, amount)
          return result.delayYears >= 0 || result.delayYears === Infinity
        },
      ),
    )
  })

  it('recurring cost newFireNumber >= base FIRE number when monthly > 0', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 5000, noNaN: true }),
        (monthly) => {
          const base = { annualExpenses: 48000, annualIncome: 72000, liquidNetWorth: 100000, cpfTotal: 50000, swr: 0.04, netRealReturn: 0.044, retirementAge: 55, currentAge: 30 }
          const result = calculateRecurringCost(base, monthly)
          const baseFireNumber = calculateFireNumber(base.annualExpenses, base.swr)
          return result.newFireNumber >= baseFireNumber
        },
      ),
    )
  })

  it('tax is monotonically non-decreasing with income', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 2000000, noNaN: true }),
        fc.double({ min: 0, max: 2000000, noNaN: true }),
        (income1, income2) => {
          const lower = Math.min(income1, income2)
          const higher = Math.max(income1, income2)
          const taxLow = calculateProgressiveTax(lower).taxPayable
          const taxHigh = calculateProgressiveTax(higher).taxPayable
          return taxHigh >= taxLow
        },
      ),
    )
  })

  it('effective tax rate is non-decreasing (progressive)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 2000000, noNaN: true }),
        fc.double({ min: 1, max: 2000000, noNaN: true }),
        (income1, income2) => {
          const lower = Math.min(income1, income2)
          const higher = Math.max(income1, income2)
          if (lower === higher) return true
          const rateLow = calculateProgressiveTax(lower).effectiveRate
          const rateHigh = calculateProgressiveTax(higher).effectiveRate
          return rateHigh >= rateLow - 0.0001 // small epsilon for floating point
        },
      ),
    )
  })
})
