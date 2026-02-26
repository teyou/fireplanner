# Malaysia Historical Market & Economic Data Research

**Purpose:** Inform migration of Singapore FIRE Planner to Malaysia. Maps each SG data column to its MY equivalent, documents sources, licensing, and data gaps.

**Research date:** 2026-02-25

---

## 1. KLCI / FTSE Bursa Malaysia KLCI (Malaysian Equities)

### Index History and Timeline

| Period | Index Name | Notes |
|--------|------------|-------|
| 1977-01-02 | Kuala Lumpur Composite Index (KLCI) | Base value 100 as of 2 Jan 1977; formally launched 4 Apr 1986 with retroactive data |
| 2006 | Bursa Malaysia + FTSE partnership announced | Suite of indices created |
| 2009-07-06 | FTSE Bursa Malaysia KLCI (FBM KLCI) | Replaced old KLCI; opening value taken from KLCI closing on 3 Jul 2009 |
| 2009-present | FBM KLCI (30 constituents) | Free-float, cap-weighted, 30 largest companies by market cap |

**Key fact:** The KLCI was introduced retroactively. The index base date is 1 Jan 1977 = 100, but the index was not formally calculated and published until April 1986. Data going back to January 1977 exists in financial databases. CEIC shows Malaysia equity market index data from as early as January 1974, with an all-time low of 58.6 points in December 1974.

### Available Data Sources

**Price Return (annual, 1977 onwards):**
- Wikipedia annual development table: https://en.wikipedia.org/wiki/FTSE_Bursa_Malaysia_KLCI
  - Contains year-by-year index levels since 1976
- Yahoo Finance (`^KLSE`): https://finance.yahoo.com/quote/%5EKLSE/history/
  - Daily/monthly data downloadable, good coverage from ~1993
- Barchart.com: https://www.barchart.com/stocks/quotes/$KLSE/price-history
  - Daily, weekly, monthly, quarterly data back to 1 Jan 1980; downloadable
- Investing.com: https://www.investing.com/indices/ftse-bursa-malaysia-klci-historical-data
  - Downloadable historical data
- 1stock1.com (price returns only, no dividends): https://www.1stock1.com/1stock1_773.htm
  - Annual price returns from 1994-2024 (see table below)
- CEIC Data (1974-2025, monthly): https://www.ceicdata.com/en/indicator/malaysia/equity-market-index
  - Paid subscription; most comprehensive pre-1980 source

**Total Return (price + dividends):**
- There is no free, downloadable KLCI Total Return Index going back to 1977. FTSE Russell publishes a KLCI factsheet with total return data but detailed year-by-year history requires Bloomberg or FTSE Russell data subscription.
- Bursa Malaysia Historical Data Package: https://www.bursamalaysia.com/historical-data-package
  - Paid commercial data; redistribution requires permission + royalty fee from Bursa Malaysia Information Services Sdn Bhd
- Market dividend yield data (for constructing total return): CEIC has Bursa Malaysia FTSE Composite Index dividend yield from July 2009, averaging 3.04% (median). The KLCI long-term dividend yield has historically been approximately 3-4%.
- A 20-year average total return figure (1996-2016) of 8.94% is referenced in academic sources, incorporating the ~3% average dividend yield on top of price returns.

**KLCI Annual Price Returns (1994-2024 from 1stock1.com):**

Note: These are price-only returns, excluding dividends. To estimate total return, add approximately +3-4% annual dividend yield.

| Year | Price Return |
|------|-------------|
| 1994 | -23.85% |
| 1995 | +2.47% |
| 1996 | +24.40% |
| 1997 | -51.98% (Asian Financial Crisis) |
| 1998 | -1.40% |
| 1999 | +38.59% |
| 2000 | -16.33% |
| 2001 | +2.42% |
| 2002 | -7.15% |
| 2003 | +22.84% |
| 2004 | +14.29% |
| 2005 | -0.84% |
| 2006 | +21.83% |
| 2007 | +31.82% |
| 2008 | -39.33% (GFC) |
| 2009 | +45.17% |
| 2010 | +19.34% |
| 2011 | +0.78% |
| 2012 | +10.34% |
| 2013 | +10.54% |
| 2014 | -5.66% |
| 2015 | -3.90% |
| 2016 | -3.00% |
| 2017 | +9.45% |
| 2018 | -5.91% |
| 2019 | -6.02% |
| 2020 | +2.42% |
| 2021 | -3.67% |
| 2022 | -4.60% |
| 2023 | -2.73% |
| 2024 | +12.90% |

Source: https://www.1stock1.com/1stock1_773.htm (price return only, no dividends, no taxes or commissions)

### Pre-KLCI Era (before 1977)

There is no formal Malaysian equity index before 1977. Options for proxy data:

1. **MSCI Malaysia Index** (launched 29 Feb 1988): Factsheet available at https://www.msci.com/documents/10199/255599/msci-malaysia-index.pdf. Data exists from 1988 onwards in USD. Pre-1988 data is back-calculated. This is the best supplement for 1977-1993 if KLCI price data is unavailable in a clean format.
2. **MSCI Emerging Markets Index**: Malaysia was a founding constituent in January 1988. Pre-1988, no Malaysia-specific EM proxy exists in a clean, free dataset.
3. **For pre-1977:** No reliable free source exists. Recommend using the KLCI 1977 starting value as the beginning of the MY equities time series. This limits the usable MY dataset to 1977-2024 at the earliest, compared to the SG dataset starting in 1987 or the US dataset starting in 1928.

### Dividend Yield for Total Return Construction

To construct approximate total return from price return data:
- 2009-2025 median dividend yield: 3.04% (CEIC, sourced from Bursa Malaysia)
- For pre-2009 periods: use a conservative 3.5% as an approximation
- Source: https://www.ceicdata.com/en/malaysia/bursa-malaysia-dividend-yield/bursa-malaysia-dividend-yield-ftse-composite-index

---

## 2. Malaysia CPI / Inflation

### DOSM CPI Data

**Primary source:** OpenDOSM (Department of Statistics Malaysia)

| Dataset | Coverage | URL |
|---------|----------|-----|
| Annual CPI Inflation by Division | 1961-2024 | https://open.dosm.gov.my/data-catalogue/cpi_annual_inflation |
| Annual CPI by Division | 1961-present | https://open.dosm.gov.my/data-catalogue/cpi_annual |
| Monthly CPI (national) | 1961-present | https://open.dosm.gov.my/dashboard/consumer-prices |

**Direct download URLs:**
- CSV: `https://storage.dosm.gov.my/cpi/cpi_2d_annual_inflation.csv`
- Parquet: `https://storage.dosm.gov.my/cpi/cpi_2d_annual_inflation.parquet`

**FRED alternative (World Bank sourced):**
- Series: `FPCPITOTLZGMYS`
- Coverage: 1960-2024 (annual)
- URL: https://fred.stlouisfed.org/series/FPCPITOTLZGMYS

**Key inflation statistics:**
- Long-term average (1960-2024): ~2.9% per year
- Average 2000-2024: ~2.0% per year
- Average last 5 years (to 2025): ~2.4%
- All-time high: 17.3% in 1974 (oil shock/commodity boom)
- All-time low: -1.1% in 2020 (pandemic)
- 2024 actual: 1.83%

**Pre-1961:** No official DOSM data exists for the Malayan/Malaysian CPI before 1961. For pre-1961 years (relevant only if extending the dataset back to match the US 1928 series), use a fixed 2.5% placeholder or leave the MY dataset starting from 1961. British colonial records exist but are not digitised in any accessible database.

---

## 3. USD/MYR Exchange Rate

### BNM and DOSM Sources

| Source | Coverage | URL | Notes |
|--------|----------|-----|-------|
| DOSM OpenDOSM Monthly Exchange Rates | 1997-2026 | https://open.dosm.gov.my/data-catalogue/exchangerates | 27 currencies incl. USD, middle rates at 1200, CC BY 4.0 |
| DOSM Direct download CSV | 1997-2026 | `https://storage.data.gov.my/finsector/exr/monthly.csv` | 5 computation types per currency |
| BNM Financial Markets Investor Portal (FMIP) | ~2006+ | https://financialmarkets.bnm.gov.my/data-download-exchange-rates | Daily ringgit rates |
| FRED (EXMAUS series) | Jan 1971-Jan 2026 | https://fred.stlouisfed.org/data/EXMAUS | Monthly averages of daily noon NY buying rates, public domain |
| IMF Exchange Rate Archives | Various | https://www.imf.org/external/np/fin/data/param_rms_mth.aspx | Monthly, various start dates |

**Recommendation:** Use FRED `EXMAUS` for the longest consistent series (1971-2024). For 1977-1971, data is not available from FRED either; recommend treating 1977 as the start of the MYR series. FRED data is public domain (Federal Reserve).

### The MYR Peg Period (1998-2005)

**Critical data handling note:**
- September 1998: BNM pegged MYR to USD at exactly **3.80 MYR/USD** as a response to the 1997 Asian Financial Crisis
- 21 July 2005: Peg was lifted; Malaysia moved to a managed float
- During the peg period (Sep 1998-Jul 2005), USD/MYR change = 0.00% every year by definition
- For 1997 pre-peg: MYR depreciated sharply from ~2.50 to ~4.60 MYR/USD before the peg was set at 3.80

**For the data model:** The peg years (1999, 2000, 2001, 2002, 2003, 2004, 2005) should record `usdMyrChange = 0.00` or the actual change. This is accurate data, not a gap. The impact is that any USD-denominated returns had zero currency translation loss/gain during this period, which is economically meaningful and should be preserved as-is.

Source: https://www.bnm.gov.my/significant-milestones-in-the-malaysian-foreign-exchange-market

**USD/MYR Historical Context:**
- 1970s: ~2.30-2.40 MYR/USD (Straits dollar era, relatively stable)
- 1990-1997: ~2.50-2.65 MYR/USD (pre-crisis float)
- Sep 1997-Aug 1998: depreciated to 4.20-4.60
- Sep 1998-Jul 2005: fixed at 3.80
- 2005-2024: managed float, range approximately 3.10-4.80

---

## 4. EPF Dividend Rates (Time Series)

### Source

**Official machine-readable data:**
- data.gov.my data catalogue: https://data.gov.my/data-catalogue/epf_dividend
- License: CC BY 4.0
- CSV download: `https://storage.data.gov.my/welfare/epf_dividend.csv`
- Parquet download: `https://storage.data.gov.my/welfare/epf_dividend.parquet`
- API endpoint: `https://api.data.gov.my/data-catalogue?id=epf_dividend&limit=3`

**Official KWSP dividend page:** https://www.kwsp.gov.my/en/others/resource-centre/dividend

### Complete Historical Dividend Rate Table

**Early years (pre-1983):**

| Year(s) | Conventional (%) | Shariah (%) |
|---------|-----------------|-------------|
| 1952-1959 | 2.50 | - |
| 1960-1962 | 4.00 | - |
| 1963 | 6.60 | - |
| 1964 | 7.00 | - |
| 1965-1967 | 7.25 | - |
| 1968-1970 | 8.00 | - |
| 1971 | 5.25 | - |
| 1972-1973 | 8.50 | - |
| 1974-1975 | 8.00 | - |
| 1976-1978 | 7.50 | - |
| 1979 | 7.70 | - |
| 1980-1982 | 6.70 | - |

Source: Search results citing historical KWSP records; verify against official KWSP annual reports.

**1983-2024 (verified from multiple sources):**

| Year | Conventional (%) | Shariah (%) |
|------|-----------------|-------------|
| 1983-1987 | 8.50 | - |
| 1988-1994 | 8.00 | - |
| 1995 | 7.50 | - |
| 1996 | 7.70 | - |
| 1997 | 6.70 | - |
| 1998 | 6.70 | - |
| 1999 | 6.84 | - |
| 2000 | 6.00 | - |
| 2001 | 5.00 | - |
| 2002 | 4.25 | - |
| 2003 | 4.50 | - |
| 2004 | 4.75 | - |
| 2005 | 5.00 | - |
| 2006 | 5.15 | - |
| 2007 | 5.80 | - |
| 2008 | 4.50 | - |
| 2009 | 5.65 | - |
| 2010 | 5.80 | - |
| 2011 | 6.00 | - |
| 2012 | 6.15 | - |
| 2013 | 6.35 | - |
| 2014 | 6.75 | - |
| 2015 | 6.40 | - |
| 2016 | 5.70 | - |
| 2017 | 6.90 | 6.40 |
| 2018 | 6.15 | 5.90 |
| 2019 | 5.45 | 5.00 |
| 2020 | 5.20 | 4.90 |
| 2021 | 6.10 | 5.65 |
| 2022 | 5.35 | 4.75 |
| 2023 | 5.50 | 5.40 |
| 2024 | 6.30 | 6.30 |

Sources:
- https://the-money-magnet.com/2008/12/epf-kwsp-annual-dividend-rate-from-1983-2007.html/
- https://dollarsandsense.my/guide-to-epf-dividend-rates-how-much-malaysians-have-earned-in-the-past-10-years/
- https://1-million-dollar-blog.com/dividends/employees-provident-funds/

**Key EPF facts:**
- Statutory minimum guaranteed dividend: **2.5% per annum** (EPF Act 1991, for Conventional only)
- No statutory minimum for Shariah
- Shariah savings (Simpanan Shariah) launched: **January 2017**
- EPF founded: **1951**, first dividend declared: **1952**
- Conventional account: ~72% of contributions by default; Shariah: ~28% (opt-in)

### EPF Contribution Rates (for `epfBlended` calculation)

Current rates (as at 2024-2025):

| Age Group | Employee | Employer | Total |
|-----------|----------|----------|-------|
| Below 60 (Malaysian) | 11% | 13% (wages ≤ RM5,000) / 12% (wages > RM5,000) | ~23-24% |
| 60 and above (Malaysian) | 0% | 4% | 4% |

Note: Employer contributes 13% for wages up to RM5,000/month, and 12% for wages above RM5,000/month. Unlike Singapore CPF, there is no employer contribution cessation at a specific age above 60 other than the reduced rate.

Source: https://www.kwsp.gov.my/en/employer/responsibilities/mandatory-contribution

**Comparison to Singapore CPF:**
- SG CPF total contribution rate (under 55): 37% (20% employee + 17% employer)
- MY EPF total contribution rate (under 60): ~23-24% (11% employee + 12-13% employer)
- MY EPF is significantly lower, which affects accumulation projections

**EPF vs CPF structural differences:**
- EPF has one account (or two: Conventional + Shariah) vs CPF's OA/SA/MA split
- EPF has no Ordinary/Special account interest differential; single blended dividend rate applies to the whole balance
- EPF does not have a Retirement Sum scheme (BRS/FRS/ERS equivalent) - members withdraw at age 55/60
- For the `epfBlended` column in `historicalReturnsFull.ts`, use the Conventional dividend rate (which is the applicable rate for ~72% of members, and the full rate pre-2017). The Shariah rate is only relevant from 2017 onwards for opted-in members.

---

## 5. Malaysian REITs (M-REITs)

### History

- **Modern M-REIT market began: 2005** (though listed property trusts existed since 1989)
- First M-REIT: Axis REIT (listed August 2005, originally AmFIRST)
- Islamic REIT guidelines: published August 2005; first Islamic REIT listed August 2006
- **Bursa Malaysia REIT Index (KLRE):** Launched in 2006 as part of the FTSE Bursa Malaysia Index Series in partnership with FTSE Russell

### REIT Index Data

- Ticker: **KLRE** (KL REIT Index)
- Inception: ~2006 (limited to 20 years of data at most)
- Live data: https://www.investing.com/indices/kl-reit-historical-data
- TradingView: https://www.tradingview.com/symbols/MYX-REIT/
- Live dashboard: https://mreit.fifthperson.com/
- There is no free, downloadable KLRE Total Return Index with historical data going back to 2005.

### Major M-REITs and Typical Returns (for reference/yield estimation)

| REIT | IPO Year | Annualized Total Return (IPO to Dec 2024) | Focus |
|------|----------|------------------------------------------|-------|
| Axis REIT | 2005 | ~9.25% | Industrial/Commercial |
| Al-Aqar Healthcare REIT | 2006 | ~5.69% | Healthcare |
| Sunway REIT | 2010 | ~9.03% | Retail/Commercial |
| Pavilion REIT | 2011 | ~8.37% | Retail |
| IGB REIT | 2012 | ~8.05% | Retail |

Source: https://fifthperson.com/top-5-malaysia-reits-2025/

**Typical current dividend yields:** 5-6% for major retail REITs (Pavilion, IGB, Sunway, KLCCP). Historically, yields have been in the 5-7% range.

### Recommendation for MY App

Since M-REITs only have ~20 years of history and no free total-return index dataset, the options are:
1. **Use US REIT data as proxy** (same approach as SG app for pre-2002 SG REIT data). The FTSE NAREIT index goes back to 1972 and is used in the existing SG app.
2. **Use KLRE data from 2005+** (available on Investing.com) and splice with US REIT data for pre-2005 years.
3. **Drop the REIT asset class** for the MY version and replace with a Malaysian property fund or leave as US REITs with a note.

Given the data availability, option 1 (keep US REIT data unchanged) is the pragmatic choice for the initial MY migration. If M-REIT-specific data is needed, Bursa Malaysia offers a paid Historical Data Package.

---

## 6. Malaysian Government Bonds (MGS)

### Available Data Sources

| Source | Coverage | URL | Notes |
|--------|----------|-----|-------|
| BNM Government Securities Yield page | ~2006-2018 | https://www.bnm.gov.my/government-securities-yield | Static webpage, may need to request older data |
| BNM FMIP Benchmark Yields | Current + date search | https://financialmarkets.bnm.gov.my/benchmark-yields | Tenures: 3yr, 5yr, 7yr, 10yr; limited historical depth on public site |
| BNM FMIP Bond Trading Data | Daily | https://financialmarkets.bnm.gov.my/data-download-bond-trading | Downloadable, but start year unclear publicly |
| Trading Economics | Historical chart 10yr | https://tradingeconomics.com/malaysia/government-bond-yield | Shows data from ~1990s; not downloadable for free |
| Investing.com 10-year | Historical | https://www.investing.com/rates-bonds/malaysia-10-year-bond-yield-historical-data | Downloadable; good coverage |
| Asian Bonds Online (ADB) | Various | https://asianbondsonline.adb.org/malaysia/ | Regional bond market data, some downloadable |
| World Government Bonds | Historical | http://www.worldgovernmentbonds.com/bond-historical-data/malaysia/10-years/ | 10-year MGS historical data |

### MGS Overview

- **Types:** Malaysian Treasury Bills (MTB, short-term), Malaysian Government Securities (MGS, conventional long-term), Government Investment Issues (GII, Islamic equivalent)
- **Benchmark tenures:** 3yr, 5yr, 7yr, 10yr (committed issuance); 15yr and 20yr also issued
- **Current 10yr yield (Feb 2026):** ~3.57%
- **Historical 10yr yield range:** Approximately 3.0-5.5% (2000-2024). In the 1990s, yields were higher (5-8%).

### Data Gap for Bond Total Returns

Like most markets, free historical MGS **total return** (price appreciation + coupon) data is not publicly available in a downloadable format from BNM or DOSM. The public data is **yield data**, from which total returns must be approximated.

For the MY `historicalReturnsFull.ts`, the practical approach is:
- Use US Bond data (already in the existing SG file) unchanged for the `usBonds` column
- For a Malaysian-specific bond column (if needed), approximate returns from BNM yield data using: `bondReturn ≈ coupon - durationFactor * yieldChange`
- For periods before reliable MGS yield data (~before 2000), proxy with US Bond returns adjusted for spread

---

## 7. Data Gap Analysis

### Summary of Earliest Available Data by Column

| Column | SG Dataset Start | MY Equivalent | MY Data Start | Gap vs SG |
|--------|-----------------|---------------|---------------|-----------|
| usEquities | 1928 | usEquities (unchanged) | 1928 | None |
| sgEquities | 1987 | myEquities (KLCI) | **1977** | MY starts earlier |
| intlEquities | 1970 | intlEquities (unchanged) | 1970 | None |
| usBonds | 1928 | usBonds (unchanged) | 1928 | None |
| reits | 1972 | reits (unchanged, or M-REIT from 2005) | 1972 / 2005 | 33yr gap if M-REIT used |
| gold | 1968 | gold (unchanged) | 1968 | None |
| cash | 1928 | cash (unchanged) | 1928 | None |
| cpfBlended | ~1952 (EPF inception) | epfBlended (EPF dividend) | **1952** | MY starts earlier |
| usCpi | 1928 | usCpi (unchanged) | 1928 | None |
| sgCpi | 1961 | myCpi (DOSM) | **1961** | Same |
| usdSgdChange | 1981 | usdMyrChange | **1971** (FRED) | MY starts earlier |

**Observation:** Malaysia's homegrown data series are actually better than Singapore's in some dimensions. The KLCI has data from 1977 (vs STI from 1987), EPF data from 1952, and USD/MYR from 1971 via FRED.

### Recommended Starting Year for Complete MY Dataset

The limiting factor is matching all columns for a consistent multi-asset bootstrap. The earliest year where reasonable data exists for ALL columns simultaneously:

- KLCI: 1977
- MY CPI: 1961
- USD/MYR: 1971 (FRED)
- EPF: 1952
- US data (equities, bonds, gold, cash): 1928

**Recommended start year: 1977** (KLCI data defines the constraint)

This gives approximately 48 years of data (1977-2024), compared to the SG dataset which effectively has complete multi-asset data from 1987 (38 years). The MY dataset is actually slightly longer for the consistent multi-asset window.

For the **pre-1977 period** in the MY dataset (if backward extension is desired):
- Use MSCI World or US equities as a global proxy for MY equities
- Note this in the data file header
- EPF, USD/MYR, and CPI data all exist for 1961-1976; only the equity column is missing

### Monte Carlo Bootstrap Recommendation

**With 48 years of data (1977-2024):**
- Historical bootstrap will have a moderate sample size
- For retirements longer than 48 years, bootstrap resampling is the right approach (not rolling-window survival, which requires `yearsInRetirement <= datasetLength`)
- Parametric Monte Carlo (multivariate normal via Cholesky) does not require long history and remains valid regardless of dataset length
- Fat-tail (Student-t) simulation is also dataset-length-independent

**Minimum viable recommendation for bootstrap:**
- 48 years of annual data is adequate for bootstrap resampling for typical 20-35 year retirements
- The SG app's 38 years of consistent multi-asset data (1987-2024) also proves this approach works
- Be explicit in UI that MY bootstrap results are based on 1977-2024 data, not the full 1928-2024 range

---

## 8. Data Licensing

| Source | Dataset | License | Commercial Use? | Attribution Required? | Embed in App? |
|--------|---------|---------|----------------|----------------------|---------------|
| DOSM OpenDOSM | CPI, exchange rates | CC BY 4.0 | Yes | Yes | Yes |
| data.gov.my | EPF dividend | CC BY 4.0 | Yes | Yes | Yes |
| FRED (St. Louis Fed) | USD/MYR (EXMAUS), MY CPI | Public domain (US federal) | Yes | Recommended | Yes |
| Bursa Malaysia | KLCI historical data package | Commercial, proprietary | Requires written permission + royalty fee | Yes | No (without license) |
| Yahoo Finance / 1stock1.com | KLCI price returns | Not for redistribution per ToS | No | - | No |
| FTSE Russell | KLCI index data | Commercial | No (requires license) | - | No |
| BNM | MGS yield, exchange rates | BNM website terms | Personal/non-commercial only | Yes | Unclear |
| KWSP official site | EPF dividend | Crown copyright / Malaysian govt | Educational use OK | Yes | Verify |
| MSCI | MSCI Malaysia index | Free for personal use (with attribution) | Limited commercial | Yes - "Source: MSCI" | With attribution |
| World Bank / IMF (via FRED) | MY CPI inflation | Public domain / CC license | Yes | Yes | Yes |

**Key licensing concern:** The raw KLCI price return data cannot be freely redistributed without a commercial license from Bursa Malaysia. However, the MY app can:
1. Compute and hard-code the historical annual return values into `historicalReturnsFull.ts` (as the SG app does for all data series), citing the source
2. Use FRED `EXMAUS` for USD/MYR data (public domain)
3. Use DOSM OpenDOSM for CPI (CC BY 4.0)
4. Use data.gov.my for EPF dividends (CC BY 4.0)

The SG app precedent (embedding computed values into a TypeScript module with source citations) is legally defensible for personal/non-commercial use and educational FIRE planning purposes. For a commercial app with paying users, a Bursa Malaysia data license should be obtained for the KLCI data.

---

## 9. Proposed Column Mapping: SG to MY

| SG Column | MY Column | Source | Change? | Notes |
|-----------|-----------|--------|---------|-------|
| `usEquities` | `usEquities` | Damodaran (NYU) | No change | S&P 500 annual total returns, 1928-2024 |
| `sgEquities` | `myEquities` | KLCI (Bursa Malaysia), 1stock1.com, Barchart | Replace | KLCI price returns from 1977-2024 + ~3.5% estimated dividend yield pre-2009, CEIC dividend yield 2009+ |
| `intlEquities` | `intlEquities` | MSCI World | No change | USD returns, convert via usdMyrChange |
| `usBonds` | `usBonds` | FRED (10-year Treasury) | No change | Annual returns 1928-2024 |
| `reits` | `reits` | FTSE NAREIT (US); splice KLRE post-2005 | Minimal or no change | Recommend keeping US REIT data; note M-REIT only exists 2005+. If localization desired: use KLRE from 2005, US REIT prior. |
| `gold` | `gold` | World Gold Council / LBMA | No change | USD gold price, convert via usdMyrChange |
| `cash` | `cash` | FRED (3-month T-Bill) | No change | USD cash proxy. Alternatively, could use BNM overnight policy rate (OPR) as local cash proxy if data sourced. |
| `cpfBlended` | `epfBlended` | data.gov.my EPF dividend (`epf_dividend.csv`) | Replace | EPF Conventional dividend rate, 1952-2024. CC BY 4.0. Use Conventional rate (pre-2017 = only rate; 2017+ = use Conventional as the broader series). |
| `usCpi` | `usCpi` | FRED (CPIAUCSL) | No change | Used for real return calculations referencing US data |
| `sgCpi` | `myCpi` | DOSM OpenDOSM (`cpi_2d_annual_inflation.csv`) | Replace | MY CPI annual inflation, 1961-2024. CC BY 4.0. |
| `usdSgdChange` | `usdMyrChange` | FRED (EXMAUS) | Replace | USD/MYR annual % change, 1971-2024. Public domain. Note peg years (1999-2004) = ~0% change. |

### `ASSET_KEY_TO_COLUMN` Mapping Updates

The SG app uses an `ASSET_KEY_TO_COLUMN` mapping (in `historicalReturnsFull.ts`) that bridges asset class keys like `bonds` and `cpf` to column names in the data. For the MY version:

```typescript
// SG version
const ASSET_KEY_TO_COLUMN = {
  usEquities: 'usEquities',
  sgEquities: 'sgEquities',    // CHANGE THIS
  intlEquities: 'intlEquities',
  bonds: 'usBonds',
  reits: 'reits',
  gold: 'gold',
  cash: 'cash',
  cpf: 'cpfBlended',           // CHANGE THIS key and column
};

// MY version
const ASSET_KEY_TO_COLUMN = {
  usEquities: 'usEquities',
  myEquities: 'myEquities',    // was sgEquities -> sgEquities
  intlEquities: 'intlEquities',
  bonds: 'usBonds',
  reits: 'reits',
  gold: 'gold',
  cash: 'cash',
  epf: 'epfBlended',           // was cpf -> cpfBlended
};
```

### `DATA_YEAR_RANGE` Update

The MY `historicalReturnsFull.ts` should set:
```typescript
export const DATA_YEAR_RANGE: [number, number] = [1977, 2024];
```

Pre-1977 rows should be omitted (or marked as proxy data) since the KLCI does not exist before 1977. The EPF, CPI, and USD/MYR data exist for earlier years, but without a MY equity series, the multi-asset bootstrap cannot run for those years.

---

## 10. Summary Recommendations

1. **Start the MY dataset at 1977.** This is when KLCI data begins, giving 48 years of multi-asset history (1977-2024). This is longer than the SG dataset's practical multi-asset window of 1987-2024.

2. **Use FRED `EXMAUS` for USD/MYR** (public domain, Jan 1971-present). Compute year-end-to-year-end percentage changes. Preserve the peg period (1999-2004) as near-zero change values.

3. **Use DOSM OpenDOSM for MY CPI** (CC BY 4.0, 1961-2024). Direct CSV download at `https://storage.dosm.gov.my/cpi/cpi_2d_annual_inflation.csv`.

4. **Use data.gov.my for EPF dividends** (CC BY 4.0, 1952-2024). Direct CSV download at `https://storage.data.gov.my/welfare/epf_dividend.csv`. Use the Conventional rate as the single `epfBlended` value.

5. **Construct KLCI total return** by combining price return data (from 1stock1.com or Barchart, 1980-2024) with estimated dividend yields (~3.5% flat pre-2009, CEIC actual median ~3.04% from 2009). Note: The KLCI price return data from 1stock1.com is for informational purposes; for production use, source cleaner data from Barchart (available back to 1980) or the BNM/Bursa commercial data package.

6. **Keep US REITs** in the `reits` column rather than switching to M-REIT data. M-REIT history is only 20 years (2005+), and no free total-return index is available.

7. **Keep `usBonds` unchanged.** Malaysian MGS yield data is available but total return reconstruction is complex. A locally blended MY bond return proxy could be added in a future iteration.

8. **For Monte Carlo:** With 48 years of data, historical bootstrap and parametric Monte Carlo are both viable. Bootstrap resampling (with replacement) is preferred for simulating retirement periods up to 48 years. For longer retirements, parametric or fat-tail methods are more appropriate.

9. **Attribution in data file headers:** All data files must cite sources, download dates, and applicable licenses per the project's data maintenance standards.

---

## Sources

- [FTSE Bursa Malaysia KLCI - Wikipedia](https://en.wikipedia.org/wiki/FTSE_Bursa_Malaysia_KLCI)
- [FTSE Bursa Malaysia KLCI Historical Data - Investing.com](https://www.investing.com/indices/ftse-malaysia-klci-historical-data)
- [FTSE Bursa Malaysia KLCI Annual Returns - 1stock1.com](https://www.1stock1.com/1stock1_773.htm)
- [FTSE Bursa Malaysia KLCI - Yahoo Finance](https://finance.yahoo.com/quote/%5EKLSE/history/)
- [Bursa Malaysia KLCI Index - Barchart.com](https://www.barchart.com/stocks/quotes/$KLSE/price-history)
- [Malaysia Equity Market Index 1974-2025 - CEIC Data](https://www.ceicdata.com/en/indicator/malaysia/equity-market-index)
- [Bursa Malaysia Dividend Yield FTSE Composite - CEIC](https://www.ceicdata.com/en/malaysia/bursa-malaysia-dividend-yield/bursa-malaysia-dividend-yield-ftse-composite-index)
- [FTSE Bursa Malaysia KLCI Factsheet - FTSE Russell](https://research.ftserussell.com/Analytics/FactSheets/Home/DownloadSingleIssue?issueName=FBMKLCI)
- [MSCI Malaysia Index Factsheet](https://www.msci.com/documents/10199/255599/msci-malaysia-index.pdf)
- [Annual CPI Inflation by Division - OpenDOSM](https://open.dosm.gov.my/data-catalogue/cpi_annual_inflation)
- [Consumer Prices Dashboard - OpenDOSM](https://open.dosm.gov.my/dashboard/consumer-prices)
- [Malaysia CPI Inflation (FPCPITOTLZGMYS) - FRED](https://fred.stlouisfed.org/series/FPCPITOTLZGMYS)
- [Malaysia Inflation Rate - Macrotrends](https://www.macrotrends.net/global-metrics/countries/mys/malaysia/inflation-rate-cpi)
- [Rates & Statistics - Bank Negara Malaysia](https://www.bnm.gov.my/rates-statistics)
- [Ringgit Exchange Rates - BNM FMIP](https://financialmarkets.bnm.gov.my/data-download-exchange-rates)
- [KL USD/MYR Reference Rate - BNM FMIP](https://financialmarkets.bnm.gov.my/data-download-kl-usd-myr-reference-rate)
- [Monthly Exchange Rates - OpenDOSM](https://open.dosm.gov.my/data-catalogue/exchangerates)
- [USD/MYR Exchange Rate (EXMAUS) - FRED](https://fred.stlouisfed.org/data/EXMAUS)
- [Malaysian Ringgit - Wikipedia](https://en.wikipedia.org/wiki/Malaysian_ringgit)
- [BNM Foreign Exchange Milestones](https://www.bnm.gov.my/significant-milestones-in-the-malaysian-foreign-exchange-market)
- [Annual EPF Dividend - data.gov.my](https://data.gov.my/data-catalogue/epf_dividend)
- [EPF Dividend 2024 - KWSP Malaysia](https://www.kwsp.gov.my/en/others/resource-centre/dividend)
- [Historical EPF Dividend Rates - The Money Magnet](https://the-money-magnet.com/2008/12/epf-kwsp-annual-dividend-rate-from-1983-2007.html/)
- [EPF Dividend History 1952-2024 - DollarsAndSense.my](https://dollarsandsense.my/guide-to-epf-dividend-rates-how-much-malaysians-have-earned-in-the-past-10-years/)
- [Historical EPF Dividend Rates - 1-million-dollar-blog](https://1-million-dollar-blog.com/dividends/employees-provident-funds/)
- [EPF Mandatory Contribution Rates - KWSP Malaysia](https://www.kwsp.gov.my/en/employer/responsibilities/mandatory-contribution)
- [Top 5 Malaysia REITs - Fifth Person (2025)](https://fifthperson.com/top-5-malaysia-reits-2025/)
- [KL REIT Index (KLRE) - Investing.com](https://www.investing.com/indices/kl-reit)
- [M-REIT Data Dashboard - Fifth Person](https://mreit.fifthperson.com/)
- [Government Securities Yield - BNM](https://www.bnm.gov.my/government-securities-yield)
- [BNM Benchmark Yields - FMIP](https://financialmarkets.bnm.gov.my/benchmark-yields)
- [BNM Bond Trading Data - FMIP](https://financialmarkets.bnm.gov.my/data-download-bond-trading)
- [Asian Bonds Online Malaysia - ADB](https://asianbondsonline.adb.org/malaysia/)
- [Malaysia 10-Year Bond Yield - Trading Economics](https://tradingeconomics.com/malaysia/government-bond-yield)
- [Bursa Malaysia Historical Data Package](https://www.bursamalaysia.com/historical-data-package)
- [LSEG FTSE Bursa Malaysia Index Series](https://www.lseg.com/en/ftse-russell/indices/bursa-malaysia)
- [OpenDOSM Home](https://open.dosm.gov.my/)
- [data.gov.my Home](https://data.gov.my/)
