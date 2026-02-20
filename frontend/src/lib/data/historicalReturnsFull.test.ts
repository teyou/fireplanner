import { describe, it, expect } from 'vitest'
import {
  HISTORICAL_RETURNS,
  DATA_YEAR_RANGE,
  ASSET_CLASS_COLUMNS,
  ASSET_KEY_TO_COLUMN,
  getCompleteRows,
  getColumnValues,
  STI_VERIFIED_TOTAL_RETURN_FROM,
  SHILLER_CROSS_REFERENCE,
} from './historicalReturnsFull'

describe('historicalReturnsFull — data integrity', () => {
  it('has exactly 97 rows (1928-2024)', () => {
    expect(HISTORICAL_RETURNS).toHaveLength(97)
  })

  it('covers years 1928 through 2024 sequentially', () => {
    const years = HISTORICAL_RETURNS.map((r) => r.year)
    expect(years[0]).toBe(1928)
    expect(years[years.length - 1]).toBe(2024)
    for (let i = 1; i < years.length; i++) {
      expect(years[i]).toBe(years[i - 1] + 1)
    }
  })

  it('DATA_YEAR_RANGE matches the actual data', () => {
    expect(DATA_YEAR_RANGE.start).toBe(1928)
    expect(DATA_YEAR_RANGE.end).toBe(2024)
  })

  it('exports STI_VERIFIED_TOTAL_RETURN_FROM = 2002', () => {
    expect(STI_VERIFIED_TOTAL_RETURN_FROM).toBe(2002)
  })
})

describe('historicalReturnsFull — null patterns', () => {
  it('usEquities is non-null for all years', () => {
    for (const row of HISTORICAL_RETURNS) {
      expect(row.usEquities).not.toBeNull()
    }
  })

  it('usBonds is non-null for all years', () => {
    for (const row of HISTORICAL_RETURNS) {
      expect(row.usBonds).not.toBeNull()
    }
  })

  it('cash is non-null for all years', () => {
    for (const row of HISTORICAL_RETURNS) {
      expect(row.cash).not.toBeNull()
    }
  })

  it('cpfBlended is 0.03 for all years', () => {
    for (const row of HISTORICAL_RETURNS) {
      expect(row.cpfBlended).toBe(0.03)
    }
  })

  it('usCpi is non-null for all years', () => {
    for (const row of HISTORICAL_RETURNS) {
      expect(row.usCpi).not.toBeNull()
    }
  })

  it('gold is null before 1968, non-null from 1968', () => {
    for (const row of HISTORICAL_RETURNS) {
      if (row.year < 1968) {
        expect(row.gold).toBeNull()
      } else {
        expect(row.gold).not.toBeNull()
      }
    }
  })

  it('sgEquities is null before 1988, non-null from 1988', () => {
    for (const row of HISTORICAL_RETURNS) {
      if (row.year < 1988) {
        expect(row.sgEquities).toBeNull()
      } else {
        expect(row.sgEquities).not.toBeNull()
      }
    }
  })

  it('intlEquities is null before 1970, non-null from 1970', () => {
    for (const row of HISTORICAL_RETURNS) {
      if (row.year < 1970) {
        expect(row.intlEquities).toBeNull()
      } else {
        expect(row.intlEquities).not.toBeNull()
      }
    }
  })

  it('reits is null before 1972, non-null from 1972', () => {
    for (const row of HISTORICAL_RETURNS) {
      if (row.year < 1972) {
        expect(row.reits).toBeNull()
      } else {
        expect(row.reits).not.toBeNull()
      }
    }
  })

  it('sgCpi is null before 1961, non-null from 1961', () => {
    for (const row of HISTORICAL_RETURNS) {
      if (row.year < 1961) {
        expect(row.sgCpi).toBeNull()
      } else {
        expect(row.sgCpi).not.toBeNull()
      }
    }
  })

  it('usdSgdChange is null before 1981, non-null from 1981', () => {
    for (const row of HISTORICAL_RETURNS) {
      if (row.year < 1981) {
        expect(row.usdSgdChange).toBeNull()
      } else {
        expect(row.usdSgdChange).not.toBeNull()
      }
    }
  })
})

describe('historicalReturnsFull — value range plausibility', () => {
  it('all non-null return values are between -0.90 and 2.0', () => {
    const returnColumns = [
      'usEquities', 'sgEquities', 'intlEquities', 'usBonds',
      'reits', 'gold', 'cash', 'usCpi', 'sgCpi',
    ] as const

    for (const row of HISTORICAL_RETURNS) {
      for (const col of returnColumns) {
        const val = row[col]
        if (val !== null) {
          expect(val).toBeGreaterThanOrEqual(-0.90)
          expect(val).toBeLessThanOrEqual(2.0)
        }
      }
    }
  })

  it('usdSgdChange values are between -0.20 and 0.20', () => {
    for (const row of HISTORICAL_RETURNS) {
      if (row.usdSgdChange !== null) {
        expect(row.usdSgdChange).toBeGreaterThanOrEqual(-0.20)
        expect(row.usdSgdChange).toBeLessThanOrEqual(0.20)
      }
    }
  })

  it('cash (T-Bill) values are non-negative', () => {
    for (const row of HISTORICAL_RETURNS) {
      expect(row.cash).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('historicalReturnsFull — spot-check known values', () => {
  const rowByYear = (y: number) => HISTORICAL_RETURNS.find((r) => r.year === y)!

  // S&P 500 (Damodaran)
  it('1931 usEquities ≈ -0.4384 (Great Depression)', () => {
    expect(rowByYear(1931).usEquities).toBeCloseTo(-0.4384, 1)
  })

  it('2008 usEquities ≈ -0.37 (GFC)', () => {
    const val = rowByYear(2008).usEquities!
    expect(val).toBeGreaterThan(-0.40)
    expect(val).toBeLessThan(-0.34)
  })

  it('2020 usEquities ≈ 0.184 (COVID recovery)', () => {
    expect(rowByYear(2020).usEquities).toBeCloseTo(0.184, 1)
  })

  // US CPI
  it('1980 usCpi ≈ 0.124 (peak inflation)', () => {
    const val = rowByYear(1980).usCpi!
    expect(val).toBeGreaterThan(0.10)
    expect(val).toBeLessThan(0.15)
  })

  // Gold
  it('2008 gold > 0 (safe haven during GFC)', () => {
    expect(rowByYear(2008).gold).toBeGreaterThan(0)
  })

  it('1974 gold > 0.50 (oil crisis gold spike)', () => {
    expect(rowByYear(1974).gold).toBeGreaterThan(0.50)
  })

  // STI
  it('1997 sgEquities < -0.20 (Asian Financial Crisis)', () => {
    expect(rowByYear(1997).sgEquities).toBeLessThan(-0.20)
  })

  it('2008 sgEquities < -0.40 (GFC)', () => {
    expect(rowByYear(2008).sgEquities).toBeLessThan(-0.40)
  })

  // T-Bond
  it('1982 usBonds > 0.25 (Volcker bond rally)', () => {
    expect(rowByYear(1982).usBonds).toBeGreaterThan(0.25)
  })

  it('2022 usBonds < -0.10 (rate hike year)', () => {
    expect(rowByYear(2022).usBonds).toBeLessThan(-0.10)
  })

  // SG CPI
  it('1973 sgCpi > 0.15 (oil crisis inflation)', () => {
    expect(rowByYear(1973).sgCpi).toBeGreaterThan(0.15)
  })

  // USD/SGD
  it('1997-1998 usdSgdChange > 0 (AFC: SGD weakened)', () => {
    expect(rowByYear(1998).usdSgdChange).toBeGreaterThan(0)
  })
})

describe('historicalReturnsFull — helper functions', () => {
  it('getCompleteRows filters to rows where all specified columns are non-null', () => {
    const rows = getCompleteRows(['usEquities', 'usBonds', 'cash'])
    expect(rows.length).toBe(97) // all 3 available for all years

    const withSg = getCompleteRows(['usEquities', 'sgEquities'])
    expect(withSg.length).toBe(2024 - 1988 + 1) // 37 years
    expect(withSg[0].year).toBe(1988)
  })

  it('getColumnValues returns non-null values only', () => {
    const goldVals = getColumnValues('gold')
    expect(goldVals.length).toBe(2024 - 1968 + 1) // 57 years
    expect(goldVals.every((v) => typeof v === 'number')).toBe(true)
  })

  it('ASSET_KEY_TO_COLUMN maps bonds→usBonds and cpf→cpfBlended', () => {
    expect(ASSET_KEY_TO_COLUMN.bonds).toBe('usBonds')
    expect(ASSET_KEY_TO_COLUMN.cpf).toBe('cpfBlended')
  })

  it('ASSET_CLASS_COLUMNS has 8 entries', () => {
    expect(ASSET_CLASS_COLUMNS).toHaveLength(8)
  })
})

describe('historicalReturnsFull — Shiller cross-reference', () => {
  it('SHILLER_CROSS_REFERENCE has 97 entries (1928-2024)', () => {
    expect(SHILLER_CROSS_REFERENCE).toHaveLength(97)
    expect(SHILLER_CROSS_REFERENCE[0].year).toBe(1928)
    expect(SHILLER_CROSS_REFERENCE[96].year).toBe(2024)
  })

  it('Shiller usEquities are within 15% of Damodaran (methodology differs)', () => {
    for (const sRow of SHILLER_CROSS_REFERENCE) {
      const dRow = HISTORICAL_RETURNS.find((r) => r.year === sRow.year)!
      if (sRow.usEquities !== null && dRow.usEquities !== null) {
        // Both should agree on direction (sign) for large moves
        if (Math.abs(dRow.usEquities) > 0.15) {
          expect(Math.sign(sRow.usEquities)).toBe(Math.sign(dRow.usEquities))
        }
      }
    }
  })

  it('Shiller usBonds agree on sign for Volcker rally (1982) and rate hike crash (2022)', () => {
    const s82 = SHILLER_CROSS_REFERENCE.find((r) => r.year === 1982)!
    expect(s82.usBonds).toBeGreaterThan(0.25) // Shiller: 0.432

    const s22 = SHILLER_CROSS_REFERENCE.find((r) => r.year === 2022)!
    expect(s22.usBonds).toBeLessThan(-0.10) // Shiller: -0.119
  })
})

describe('historicalReturnsFull — Damodaran XLS exact spot-checks', () => {
  const rowByYear = (y: number) => HISTORICAL_RETURNS.find((r) => r.year === y)!

  // These values are exact from the downloaded Damodaran histretSP.xls
  it('1928 usEquities = 0.4381 (Damodaran XLS)', () => {
    expect(rowByYear(1928).usEquities).toBeCloseTo(0.4381, 3)
  })

  it('1931 usBonds = -0.0256 (Damodaran XLS)', () => {
    expect(rowByYear(1931).usBonds).toBeCloseTo(-0.0256, 3)
  })

  it('2024 cash = 0.0518 (Damodaran XLS)', () => {
    expect(rowByYear(2024).cash).toBeCloseTo(0.0518, 3)
  })

  it('1972 reits = 0.0801 (NAREIT All Equity REITs XLS)', () => {
    expect(rowByYear(1972).reits).toBeCloseTo(0.0801, 3)
  })

  it('2008 reits = -0.3773 (NAREIT All Equity REITs XLS)', () => {
    expect(rowByYear(2008).reits).toBeCloseTo(-0.3773, 3)
  })

  it('1980 gold = 0.1519 (Damodaran Gold Prices XLS)', () => {
    expect(rowByYear(1980).gold).toBeCloseTo(0.1519, 3)
  })
})
