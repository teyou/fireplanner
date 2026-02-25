# Historical Data Sources and Licensing

Reference document for the annual January data refresh.

## Sources

| Asset Class | Source | Period | License | Notes |
|------------|--------|--------|---------|-------|
| US Equities (S&P 500) | Damodaran (NYU Stern) | 1928-2025 | Academic/free | Annual total returns incl. dividends |
| US Bonds (10-yr Treasury) | FRED (Federal Reserve) | 1928-2025 | Public domain | Returns derived from yield changes |
| SG Equities (STI) | SGX + MAS | 1987-2025 | SG Open Data License | Total return index |
| Intl Equities (MSCI World) | MSCI | 1970-2025 | Free for personal use, attribute MSCI | Gross return USD, convert to SGD |
| REITs | FTSE NAREIT | 1972-2025 | Free with attribution | US REIT; SG REIT from SGX post-2002 |
| Gold | World Gold Council / LBMA | 1968-2025 | Free non-commercial | USD price, convert to SGD |
| Cash (T-Bills) | FRED | 1928-2025 | Public domain | 3-month T-Bill rate |
| SG CPI | SingStat | 1961-2025 | SG Open Data License | Annual CPI index |
| SG Property (URA PPI) | URA | 1975-2025 | SG Open Data License | Private residential PPI |
| USD/SGD FX | MAS | 1981-2025 | SG Open Data License | End-of-year rates |
| CPF Interest Rates | CPF Board | Published rates | Public | OA: 2.5%, SA: 4%, MA: 4% floor |

## Gap Handling

- **STI pre-1987:** Use MSCI Singapore index or proxy with MSCI EM Asia
- **SG CPI pre-1961:** Use 2.5% fixed historical average
- **SG REITs pre-2002:** Use US REIT data as proxy
- **Correlation matrix:** Compute from overlapping years only; document year range used

## Data Format

- All historical data lives in `frontend/src/lib/data/` as TypeScript modules
- `historicalReturnsFull.ts` contains the full 98-row time series (1928-2025) used by MC bootstrap and backtest
- `historicalReturns.ts` contains summary stats (mean, stddev) per asset class
- `ASSET_KEY_TO_COLUMN` mapping bridges `ASSET_CLASSES` keys (`bonds`, `cpf`) to data column names (`usBonds`, `cpfBlended`)
- Each file includes a header comment with source URL, download date, and license
- Returns are annual, nominal, in local currency with a separate FX series for SGD conversion
- CPI values are decimal fractions (0.025 = 2.5%), NOT percentages

## Update Cadence

- Annual refresh in January with previous year's full-year data
- Update `historicalReturnsFull.ts` with new year's data row
- Recompute summary stats in `historicalReturns.ts` if needed
