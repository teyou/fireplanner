# Malaysia Crisis Scenarios: Research for Sequence Risk Stress Testing

**Purpose:** Replace/extend the 2 Singapore-specific crisis scenarios in `crisisScenarios.ts` with Malaysia-equivalent scenarios for the MY FIRE planner.

**Research date:** 2026-02-25

**SG scenarios being replaced:**
- `asian_financial` (region: 'SG') — STI -61%, uses SG-specific returns
- `sg_property_crash` (region: 'SG') — SG URA PPI crash post-1996

---

## Reference: Existing SG Scenarios

For comparison, the SG app's 8 scenarios include:

| id | name | region | startYear | peakDrawdown | recoveryYears | equityReturnSequence |
|----|------|--------|-----------|-------------|---------------|----------------------|
| `asian_financial` | Asian Financial Crisis | SG | 1997 | -61% | 5 | [-0.287, -0.096, 0.660, -0.157, -0.117, 0.225, 0.319] |
| `sg_property_crash` | SG Property Crash (1996) | SG | 1996 | -45% | 11 | [-0.019, -0.287, -0.096, 0.660, -0.157, -0.117, 0.225, 0.319, 0.168, 0.222, -0.076] |

The global scenarios (Great Depression, Oil Crisis, Dot-Com, GFC, COVID, Japan Lost Decade) are equally applicable to Malaysia and can be retained without modification.

---

## 1. 1997-98 Asian Financial Crisis (Malaysia Impact)

### KLCI Peak-to-Trough

| Date | KLCI Level | Event |
|------|-----------|-------|
| Feb 1997 (peak) | 1,271 pts | All-time high before crisis |
| Dec 1997 | 594 pts | Year-end, after partial decline |
| 2 Sep 1998 (trough) | 262 pts | Absolute nadir, day after capital controls announced |

**Peak-to-trough decline: -79.4%** (from 1,271 in Feb 1997 to 262 on 2 Sep 1998)

Sources:
- KLCI trough of 262 on 2 Sep 1998: [1997 Asian Financial Crisis - Wikipedia](https://en.wikipedia.org/wiki/1997_Asian_financial_crisis)
- KLCI peak of 1,271 in Feb 1997: [Malaysia vs the 1997 Asian Financial Crisis - Medium/KYR Institute](https://medium.com/@kyrinstitute/malaysia-vs-the-1997-asian-financial-crisis-how-did-the-government-escape-the-catastrophe-b5afae21a115)

### Year-by-Year KLCI Returns (Annual, Price Only, No Dividends)

From 1stock1.com historical annual return data:

| Year | Year-end KLCI | Annual Return |
|------|--------------|---------------|
| 1996 | 1,237.96 | +24.40% |
| 1997 | 594.44 | **-51.98%** |
| 1998 | 586.13 | **-1.40%** |
| 1999 | 812.33 | **+38.59%** |
| 2000 | 679.64 | **-16.33%** |
| 2001 | 696.09 | +2.42% |
| 2002 | 646.32 | -7.15% |
| 2003 | 793.94 | +22.84% |

**Note on 1998 year-end vs. intraday trough:** The annual return figure of -1.40% for 1998 reflects the Dec 31 close (586 pts) vs Dec 31 1997 close (594 pts). The intraday trough of 262 on 2 Sep 1998 was followed by a strong partial recovery in Q4 1998, driven by the effects of capital controls stabilising the market. The true peak-to-trough drawdown was -79.4% measured intraday.

Source: [FTSE Bursa Index (Malaysia) Yearly Stock Returns - 1stock1.com](https://www.1stock1.com/1stock1_773.htm)

### MYR Depreciation

| Date | MYR/USD | Change |
|------|---------|--------|
| Jun 1997 (pre-crisis) | 2.52 | Baseline |
| End 1997 | 3.77 | -33% |
| Jan 1998 (worst) | 4.50 | -44% |
| 1 Sep 1998 (peg) | 3.80 | Fixed by capital controls |

**Total depreciation: approximately 45% from pre-crisis levels.**

Sources:
- [Malaysia's pathway through financial crisis - Oxford GEG](https://www.geg.ox.ac.uk/sites/default/files/GEG%20WP%202004_08%20Malaysia's%20pathway%20through%20financial%20crisis%20-%20Jomo%20Kwame%20Sundaram.pdf)
- [ADBI Working Paper: Malaysia and the Global Crisis](https://www.adb.org/sites/default/files/publication/156003/adbi-wp148.pdf)

### Capital Controls (September 1998)

On **1 September 1998**, PM Mahathir imposed selective capital controls simultaneously with sacking Deputy PM/Finance Minister Anwar Ibrahim. Key measures:
- MYR pegged at **3.80 to USD**
- Offshore ringgit trading banned; offshore ringgit repatriated to Malaysia
- Malaysian shares delisted from SIMEX (Singapore International Monetary Exchange) — halting long-standing trading of Malaysian equities in Singapore
- Foreign portfolio investors required to hold investments for minimum 1 year before repatriating
- Residents restricted from taking capital abroad

These controls were specifically designed to allow **interest rate cuts without currency collapse** — the opposite of IMF-prescribed austerity.

Source:
- [Malaysia's September 1998 Controls - UNCTAD](https://unctad.org/system/files/official-document/gdsmdpbg2420053_en.pdf)
- [IMF: Malaysia From Crisis to Recovery](https://www.imf.org/external/pubs/nft/op/207/index.htm)

### Recovery Timeline

| Metric | Timeline |
|--------|----------|
| GDP recovery (V-shaped) | 1999: +6.1%, 2000: +8.3% (just 2 years) |
| KLCI recover to pre-crisis 1,271 level | ~2007 (approximately 10 years) |
| KLCI exceed pre-crisis peak (1,275 from 1993) | 2013-2014 (the 1,896 July 2014 all-time high) |

**Key insight:** GDP recovered within 2-3 years, but stock market took nearly a decade to recover in price terms. This is because: (1) the 1998 trough was so extreme due to capital flight, (2) the early 2000s tech bust interrupted recovery, and (3) the ringgit peg at 3.80 continued until July 2005, constraining international capital flows.

Sources:
- [Malaysia Ten Years After the Asian Financial Crisis - ResearchGate](https://www.researchgate.net/publication/255573016_Malaysia_Ten_Years_After_the_Asian_Financial_Crisis)
- GDP figures: [Economic History of Malaysia - Wikipedia](https://en.wikipedia.org/wiki/Economic_history_of_Malaysia)

### Property Market Impact

| Metric | Figure |
|--------|--------|
| House price change 1997 | +1.9% (subdued but positive) |
| House price change 1998 | **-9.5%** |
| House price change 1999 | -2.4% (no recovery) |
| Property transaction volume 1998 | **-32.3%** YoY |
| Property transaction value 1998 | **-47.6%** YoY (to RM27.9bn) |
| Example: Double-storey terrace, Bukit Bandaraya | Fell from RM700K (1996/97) to RM550K (mid-1998): **-21.4%** |
| Construction sector growth | 1996: +16.2%; 1997: +10.6%; 1998: **-23.0%** |

Sources:
- [UNESCAP: Malaysia's Response to the Financial Crisis](https://www.unescap.org/sites/default/files/apdj10-1-1-nambiar.pdf)
- [The Edge Malaysia: Is the Worst Over for Housing Market?](https://theedgemalaysia.com/article/cover-story-worst-over-0)

### EPF Dividend Rates During Crisis

| Year | EPF Dividend (Conventional) |
|------|-----------------------------|
| 1995 | 7.50% |
| 1996 | 7.70% |
| 1997 | **6.70%** (held; market deterioration cushioned by diversified bond portfolio) |
| 1998 | **6.70%** (maintained at same level despite crisis) |
| 1999 | **6.84%** (slight increase) |
| 2000 | **6.00%** (decline as equity gains unwound) |
| 2001 | **5.00%** |
| 2002 | 4.25% (lowest in modern history at the time) |

**Key observation:** EPF dividend rates did NOT crash during 1997-98 despite the equity market chaos. This is because EPF is heavily invested in fixed income (bonds, government securities), which performed well as interest rates were eventually cut. The equity losses were partly offset by bond gains and EPF's diversified mandate.

Source: [Historical EPF Dividend Rates - The Money Magnet](https://the-money-magnet.com/2008/12/epf-kwsp-annual-dividend-rate-from-1983-2007.html/)

---

## 2. 2008 Global Financial Crisis (Malaysia Impact)

### KLCI Decline and Timeline

| Date | KLCI Level | Event |
|------|-----------|-------|
| Jan 11, 2008 (peak) | 1,516 pts | Historic high at the time |
| End 2008 | 876.75 pts | Year-end close |
| Mar 2009 (trough) | ~830-850 pts | Approximate trough (parallel with global March 2009 low) |
| End 2009 | 1,272.78 pts | Full year recovery |
| End 2010 | 1,518.91 pts | Surpassed pre-crisis high |

**Annual price returns:**

| Year | KLCI Year-end | Annual Return |
|------|--------------|---------------|
| 2007 | 1,445.03 | +31.82% |
| 2008 | 876.75 | **-39.33%** |
| 2009 | 1,272.78 | **+45.17%** |
| 2010 | 1,518.91 | **+19.34%** |

**Peak-to-trough: approximately -42% to -45%** from Jan 2008 peak of 1,516 to the March 2009 intraday trough.

Sources:
- [The Star: KLCI Losing Nearly 39% in 2008](https://www.thestar.com.my/business/business-news/2009/01/01/disappointing-2008-with-klci-losing-nearly-39-amid-global-crisis)
- [1stock1.com: FTSE Bursa Index Annual Returns](https://www.1stock1.com/1stock1_773.htm)

### MYR Movement

The ringgit depreciated modestly during the 2008 GFC compared to 1997. Malaysia benefited from prior structural reforms, a current account surplus, and the fact that MYR was still managed (not free-floating). By end-2008, MYR had depreciated approximately 5-8% vs USD, far less than 1997. The OPR was cut from 3.5% (pre-crisis) to 2.0% by early 2009.

### Recovery Timeline

| Metric | Timeline |
|--------|----------|
| KLCI recover to Jan 2008 high (1,516) | End 2010 (approximately 2.5 years) |
| GDP contraction | -1.7% for full year 2009 |
| GDP recovery | 2010: +7.4% |

**Malaysia's 2008 recovery was significantly faster than 1997** — approximately 2-3 years vs nearly a decade. Key differences: Malaysia entered 2008 with lower debt, current account surplus, and large fiscal space for stimulus. Government deployed RM67bn (~10% of GDP) in stimulus.

Sources:
- [ADBI Working Paper: Malaysia and the Global Crisis](https://www.adb.org/sites/default/files/publication/156003/adbi-wp148.pdf)
- [IMF: Malaysian Monetary Policy During GFC 2008-09](https://www.imf.org/en/Publications/WP/Issues/2016/12/31/An-Assessment-of-Malaysian-Monetary-Policy-During-the-Global-Financial-Crisis-of-2008-09-25685)

### EPF Dividend Rates During GFC

| Year | EPF Dividend |
|------|-------------|
| 2007 | 5.80% |
| 2008 | **4.50%** (fell sharply due to equity losses) |
| 2009 | **5.65%** (strong recovery) |
| 2010 | **5.80%** |

The 2008 EPF dividend drop to 4.50% reflects actual equity mark-to-market losses on EPF's listed equity portfolio.

Source: [Historical EPF Dividend Rates - The Money Magnet](https://the-money-magnet.com/2008/12/epf-kwsp-annual-dividend-rate-from-1983-2007.html/)

---

## 3. 2014-2016 Oil/Commodity Crash + 1MDB

### Context

Malaysia is a significant oil and gas exporter (Petronas). Oil prices fell from ~USD105/barrel in mid-2014 to ~USD26/barrel by early 2016. Simultaneously, the 1Malaysia Development Berhad (1MDB) scandal broke — USD3.5bn reportedly misappropriated from a government-linked fund — triggering political turmoil, capital flight, and ratings concerns.

### KLCI Decline

| Year | KLCI Year-end | Annual Return |
|------|--------------|---------------|
| 2013 | 1,866.96 | +10.54% |
| 2014 | 1,761.25 | **-5.66%** |
| 2015 | 1,692.51 | **-3.90%** |
| 2016 | 1,641.73 | **-3.00%** |
| 2017 | 1,796.81 | +9.45% |

**Cumulative drawdown 2014-2016: approximately -12.1%** from the July 2014 all-time high of 1,896.

This period marks the start of KLCI's "lost decade" — the index has not surpassed 1,896 (July 2014) as of early 2026, more than 10 years later.

Sources:
- [1stock1.com: FTSE Bursa Index Annual Returns](https://www.1stock1.com/1stock1_773.htm)
- [The Edge Malaysia: Examining Malaysia's Lost Decade](https://theedgemalaysia.com/node/769138)
- [CNBC: Why Malaysia Shares May Have Hit Bottom (2015)](https://www.cnbc.com/2015/11/03/why-malaysia-shares-may-have-hit-bottom.html)

### MYR Depreciation (2014-2016)

| Date | MYR/USD | Event |
|------|---------|-------|
| Mid-2014 | ~3.20 | Pre-oil crash baseline |
| Sep 2015 | 4.43 | Worst of 2015 (China stock crash + oil + 1MDB) |
| Nov 2016 | 4.45-4.50 | Post-Trump election; ringgit at lowest since 1998 peg era |

**Total depreciation peak to trough: approximately -40% in MYR/USD over this period.**

The ringgit depreciated 42.1% in the one year from end-August 2014 to August 2015.

Sources:
- [Malaysian Ringgit - Wikipedia](https://en.wikipedia.org/wiki/Malaysian_ringgit)
- [The Edge: KLCI Lost Decade](https://theedgemalaysia.com/node/769138)
- [Medium: A Decade in the Range - Why KLSE Missed the Rally 2015-2025](https://trailblazerempire.medium.com/a-decade-in-the-range-why-the-klse-missed-the-rally-from-2015-to-2025-c0e6eb7c7bc4)

### Property Market Impact (2014-2016)

The property overhang (unsold completed units) escalated dramatically:

| Year | Unsold Completed Residential Units | Approx. Value |
|------|-----------------------------------|---------------|
| 2015 | 11,316 (near low) | — |
| 2016 | 14,792 | RM8.56bn (H1 only) |
| 2017 | 20,876 | RM12.26bn (H1 only) |
| 2018 | 31,102 | — |
| 2019 Q3 | 50,008 | RM33.96bn |

**Overhang increased 281% from 2014 to 2018.** The removal of the Developer Interest Bearing Scheme (DIBS) at end-2013, combined with the oil crash and 1MDB, created a severe oversupply-meets-affordability-crisis. House prices stagnated in nominal terms and declined in real (inflation-adjusted) terms.

Sources:
- [EdgeProp: What Shall We Do with the Property Overhang?](https://www.edgeprop.my/content/1638530/what-shall-we-do-property-overhang)
- [iProperty: What Caused Malaysia's Residential Property Overhang?](https://www.iproperty.com.my/news/residential-property-overhang-malaysia/)

### EPF Dividend Rates (2014-2016)

| Year | EPF Dividend |
|------|-------------|
| 2014 | 6.75% |
| 2015 | **6.40%** |
| 2016 | **5.70%** |
| 2017 | 6.90% |

EPF maintained relatively solid returns during this period due to its diversified asset base and international equity holdings.

Source: [Historical EPF Dividend Rates - The Money Magnet](https://the-money-magnet.com/2008/12/epf-kwsp-annual-dividend-rate-from-1983-2007.html/)

---

## 4. 2020 COVID-19 + Political Crisis (Sheraton Move)

### Perfect Storm: Three Simultaneous Shocks

Malaysia faced an unprecedented triple crisis in early 2020:

1. **Sheraton Move (Feb 2020):** Ruling Pakatan Harapan coalition collapsed when Deputy PM Azmin Ali defected; PM Mahathir resigned. A new government (Perikatan Nasional) formed under Muhyiddin Yassin — creating prolonged political uncertainty.

2. **COVID-19 + MCO (Mar 2020):** Malaysia imposed the Movement Control Order (MCO) on 18 March 2020. Estimated economic cost: RM2.4 billion/day during MCO 1.0.

3. **Oil price collapse (Mar 2020):** Brent crude briefly went negative in April 2020, devastating Petronas revenues and government budget.

### KLCI Performance

| Date | KLCI Level | Event |
|------|-----------|-------|
| End 2019 | 1,588.76 | Year-end baseline |
| 23 Mar 2020 (trough) | ~1,219 | Lowest in 10 years (intraday); -20.5% from year-end |
| End 2020 | 1,627.21 | Year-end (modest full-year gain) |
| End 2021 | 1,567.53 | Year-end |
| End 2022 | 1,495.49 | Year-end |

**Annual returns:**

| Year | KLCI Year-end | Annual Return |
|------|--------------|---------------|
| 2019 | 1,588.76 | -6.02% |
| 2020 | 1,627.21 | **+2.42%** |
| 2021 | 1,567.53 | **-3.67%** |
| 2022 | 1,495.49 | **-4.60%** |

**Key observation:** Despite the March 2020 intraday crash of -20.5%, the KLCI ended 2020 marginally positive (+2.42%) due to the massive global liquidity injection (US stimulus, BNM rate cuts). Malaysia's "COVID scenario" in annual return terms looks much milder than the peak-to-trough intraday experience would suggest. This makes it **less useful as a standalone crisis scenario** compared to the intraday severity.

Sources:
- [Fortune: Malaysia Had World's Longest Bull Run — Why Ended in 2020](https://fortune.com/2020/02/24/longest-bull-run-malaysia-prime-minister/)
- [1stock1.com Annual Returns](https://www.1stock1.com/1stock1_773.htm)
- [The Edge Malaysia: Stock Market Crashes Last 40 Years](https://theedgemalaysia.com/node/751570)

### GDP Impact

| Year | Malaysia GDP |
|------|-------------|
| 2019 | +4.3% |
| 2020 | **-5.6%** (worst since 1998) |
| 2021 | +3.1% |

Q2 2020 saw a -17.1% quarterly contraction during full MCO lockdown.

Source: [World Bank: Malaysian Economy Showing Signs of Recovery](https://www.worldbank.org/en/news/press-release/2020/12/17/malaysian-economy-showing-signs-of-recovery-projected-to-grow-by-67-percent-in-2021-following-a-contraction-of-5-8-percent-in-2020)

### EPF Crisis Withdrawals (i-Lestari, i-Sinar, i-Citra)

This is the most significant **long-term retirement savings event** in Malaysian history. The government allowed four exceptional EPF withdrawal facilities:

| Programme | Period | Amount Withdrawn | Members |
|-----------|--------|-----------------|---------|
| i-Lestari | Apr 2020-Mar 2021 | RM18.1bn | 5.16 million |
| i-Sinar | Dec 2020 onwards | RM58.7bn | 6.6 million |
| i-Citra | 2021 | — | — |
| Special Withdrawal | 2022 | — | — |
| **TOTAL (4 programmes)** | **2020-2022** | **RM145 billion** | **8.2 million** |

**Retirement savings consequence:** 6.1 million EPF members were left with less than RM10,000 in their accounts; 3.6 million had less than RM1,000.

Sources:
- [MOF Malaysia: RM145bn EPF Savings Withdrawn](https://www.mof.gov.my/portal/en/news/press-citations/rm145-bln-epf-savings-withdrawn-under-covid-related-withdrawal-programmes)
- [KWSP: EPF Navigates Safely Through Pandemic-Stricken 2020](https://www.kwsp.gov.my/en/w/epf-navigates-safely-through-pandemic-stricken-2020)

### EPF Dividend Rates During COVID

| Year | EPF Dividend (Conventional) | EPF Dividend (Shariah) |
|------|-----------------------------|------------------------|
| 2019 | 5.45% | 5.00% |
| 2020 | **5.20%** | 4.90% |
| 2021 | **6.10%** | 5.65% |
| 2022 | **5.35%** | 4.75% |

EPF maintained reasonable dividends through COVID due to record 2020 gross investment income of RM60.98bn — driven by equity markets recovering strongly in Q3-Q4 2020.

Sources:
- [The Money Magnet: EPF Historical Dividends](https://the-money-magnet.com/2008/12/epf-kwsp-annual-dividend-rate-from-1983-2007.html/)
- [Pensions & Investments: Malaysia's EPF Ends 2020 Up 7.9%](https://www.pionline.com/defined-contribution/malaysias-epf-ends-2020-79-almost-250-billion)

---

## 5. 2022 Rate Hike Cycle + Currency Crisis

### OPR History

Bank Negara Malaysia (BNM) cut the OPR from 3.00% to a historic low of 1.75% during COVID (2020). Normalisation began in 2022:

| Date | OPR Change | New Rate |
|------|-----------|---------|
| May 2022 | +25 bps | 2.00% |
| Jul 2022 | +25 bps | 2.25% |
| Sep 2022 | +25 bps | 2.50% |
| Nov 2022 | +25 bps | 2.75% |
| Jan 2023 | +25 bps | 3.00% |

**Total: 125 bps hike in approximately 9 months** (vs. US Fed 425 bps in the same period).

Source: [BNM OPR Decisions](https://www.bnm.gov.my/monetary-stability/opr-decisions)

### Ringgit in 2022-2023: Near-1998 Lows

The widening US-Malaysia interest rate differential (US +425 bps vs MY +125 bps) drove massive ringgit weakness:

| Date | MYR/USD | Context |
|------|---------|---------|
| End 2021 | ~4.17 | Post-COVID baseline |
| End 2022 | ~4.45 | Lowest in 2022 |
| Oct 2023 | **4.794** | 25-year low — near 1998 crisis levels |
| End 2023 | ~4.59 | Partial recovery |

The ringgit was **-4.1% in 2023**, second-worst performing Asian currency after JPY.

Sources:
- [Bloomberg: MYR Falls to 25-Year Low](https://www.bloomberg.com/news/articles/2023-10-19/ringgit-falls-to-25-year-low-on-dollar-gains-china-weakness)
- [The Star: Ringgit on Recovery Path (2023)](https://www.thestar.com.my/business/business-news/2023/03/29/ringgit-on-recovery-path-after-sustained-depreciation-against-us-in-2022---bank-negara)

### KLCI Performance 2022-2023

| Year | KLCI Year-end | Annual Return |
|------|--------------|---------------|
| 2021 | 1,567.53 | -3.67% |
| 2022 | 1,495.49 | **-4.60%** |
| 2023 | ~1,454 | approximately **-2.7%** |

The 2022 hike cycle was NOT a crisis for Malaysian equities (markets fell modestly, unlike US or bonds). The bigger impact was on **property/mortgage affordability** — a 25 bps OPR hike adds RM55-65/month to a RM500K mortgage. Investors on thin rental yield margins were squeezed. The NAPIC property overhang (50,000+ unsold units inherited from 2014-2019) continued to weigh on the market.

Source: [INCEIF: Malaysia OPR Hikes and Inflation](https://inceif.edu.my/malaysias-opr-hikes-and-inflation/)

---

## 6. Malaysian Property Market Downturns: Summary

### 1997-98 Asian Financial Crisis Property Crash

- House prices: +1.9% (1997), **-9.5% (1998)**, -2.4% (1999)
- Transaction volume: **-32.3%** in 1998
- Transaction value: **-47.6%** in 1998 (to RM27.9bn)
- Construction sector: +16.2% (1996), +10.6% (1997), **-23.0% (1998)**
- Recovery: nominal prices recovered by mid-2000s; inflation-adjusted prices took 15+ years

### 2014-2019 Property Stagnation / Overhang Crisis

This was a slow-burn correction driven by oversupply rather than a price crash:
- Prices plateaued in 2014; grew only 2-3% nominally vs 5-8% inflation = real decline
- Unsold completed units surged from 11,316 (2015) to 50,008 (Q3 2019): **+342%**
- Overhang value grew from ~RM4bn to RM33.96bn: **+749%**
- Sub-sectors worst affected: high-rise condos RM500K+, serviced apartments, commercial shophouses

### COVID-2020 Property Market

- Transaction volumes fell sharply during MCO
- Developer launches suspended
- Government introduced Home Ownership Campaign (HOC) with stamp duty exemptions
- Market rebounded in 2021-2022 as pent-up demand released

Sources:
- [GlobalPropertyGuide: Malaysia Residential Property Market 2026](https://www.globalpropertyguide.com/asia/malaysia/price-history)
- [NAPIC: Property Overhang NAPIC's View 2023](https://napic2.jpph.gov.my/storage/app/media//3-penerbitan/Property_Overhang_NAPIC_View_2023.pdf)
- [iProperty: Residential Property Overhang Malaysia](https://www.iproperty.com.my/news/residential-property-overhang-malaysia/)

---

## 7. Proposed Crisis Scenario Definitions

Based on the research above, here are 2 (or optionally 3) Malaysia-specific scenarios to replace the 2 SG-specific ones.

### Scenario A: `my_asian_financial` — RECOMMENDED REPLACEMENT for `asian_financial`

```typescript
{
  id: 'my_asian_financial',
  name: 'Asian Financial Crisis (MY)',
  region: 'MY',
  startYear: 1997,
  peakDrawdown: -0.79,
  durationYears: 2,          // Main crash 1997-1998
  recoveryYears: 10,         // KLCI took ~10 years to recover to pre-crisis price levels
  equityReturnSequence: [
    -0.520,  // 1997: KLCI -51.98% (year-end annual return)
    -0.014,  // 1998: KLCI -1.40% (year-end; the intraday trough was -79% but market recovered Q4)
     0.386,  // 1999: KLCI +38.59%
    -0.163,  // 2000: KLCI -16.33%
     0.024,  // 2001: KLCI +2.42%
    -0.072,  // 2002: KLCI -7.15%
     0.228,  // 2003: KLCI +22.84%
     0.143,  // 2004: KLCI +14.29%
    -0.008,  // 2005: KLCI -0.84%
     0.218,  // 2006: KLCI +21.83% (back near pre-crisis levels)
     0.318,  // 2007: KLCI +31.82% (new highs)
  ],
  description: 'Currency crisis devastated Malaysia. KLCI fell 79% peak-to-trough (Feb 1997 to Sep 1998). PM Mahathir imposed capital controls and pegged MYR at 3.80 on 1 Sep 1998, diverging from IMF orthodoxy. GDP recovered within 2 years but the stock market took a decade to recover to 1997 price levels.',
}
```

**Note on sequence:** The annual return series uses price-index (no dividends) year-end figures from 1stock1.com. The 1998 annual return of -1.40% appears mild because the KLCI partially recovered from its September trough before year-end. A planner should note that the intraday peak-to-trough was -79%, but the full calendar-year 1997+1998 combined return was approximately -53%. This is the most accurate for annual-step portfolio simulations.

### Scenario B: `my_commodity_political` — RECOMMENDED REPLACEMENT for `sg_property_crash`

```typescript
{
  id: 'my_commodity_political',
  name: 'Oil Crash + 1MDB (MY)',
  region: 'MY',
  startYear: 2014,
  peakDrawdown: -0.12,
  durationYears: 3,          // 2014-2016 continuous decline
  recoveryYears: 10,         // KLCI has not recovered to July 2014 all-time high as of 2026
  equityReturnSequence: [
    -0.057,  // 2014: KLCI -5.66%
    -0.039,  // 2015: KLCI -3.90% (oil crash trough, ringgit -28% vs USD)
    -0.030,  // 2016: KLCI -3.00% (1MDB + Trump-driven MYR weakness)
     0.095,  // 2017: KLCI +9.45% (brief recovery)
    -0.059,  // 2018: KLCI -5.91% (GE14, new govt, policy uncertainty)
    -0.060,  // 2019: KLCI -6.02%
     0.024,  // 2020: KLCI +2.42% (COVID but global QE)
    -0.037,  // 2021: KLCI -3.67%
    -0.046,  // 2022: KLCI -4.60%
    -0.027,  // 2023: KLCI approx. -2.7%
  ],
  description: 'Malaysia\'s decade-long stagnation: oil price crash from USD105 to USD26, 1MDB scandal (USD3.5bn misappropriated), and ringgit weakness to 1998 lows. KLCI fell from its July 2014 all-time high of 1,896 and has not recovered that level in over 10 years. A slow-burn structural underperformance scenario.',
}
```

### Optional Scenario C: `my_covid_political` — Can be added as an additional MY scenario

```typescript
{
  id: 'my_covid_political',
  name: 'COVID-19 + Political Crisis (MY)',
  region: 'MY',
  startYear: 2020,
  peakDrawdown: -0.20,
  durationYears: 1,          // Intraday crash recovered within same year
  recoveryYears: 3,          // KLCI never fully rebounded (still below 2019 levels as of 2023)
  equityReturnSequence: [
     0.024,  // 2020: KLCI +2.42% (full year; hides March -20.5% intraday crash)
    -0.037,  // 2021: KLCI -3.67%
    -0.046,  // 2022: KLCI -4.60%
    -0.027,  // 2023: KLCI approx. -2.7%
  ],
  description: 'Triple shock: Sheraton Move political collapse (Feb 2020), COVID-19 MCO lockdown (Mar 2020), and oil price crash. KLCI fell 20.5% to 10-year lows intraday but recovered with global QE. RM145 billion in emergency EPF withdrawals by 8.2 million members permanently reduced retirement savings for a generation of Malaysian workers.',
}
```

---

## 8. Comparison: SG vs MY — 1997 Asian Financial Crisis

| Dimension | Singapore (STI) | Malaysia (KLCI) |
|-----------|----------------|-----------------|
| **Peak-to-trough** | -61% (from STI ~2,200 to ~856) | **-79%** (KLCI 1,271 to 262) |
| **Calendar year 1997 return** | -31.0% | **-52.0%** |
| **Calendar year 1998 return** | -9.0% | -1.4% (misleading: intraday trough was far worse) |
| **Calendar year 1999 return** | +78.0% | +38.6% |
| **Currency response** | SGD allowed to depreciate ~20% (managed, orderly) | MYR fell 45%, then **pegged at 3.80** (Sep 1998) |
| **Capital controls** | None | Yes — offshore MYR trading banned, 1-year repatriation hold |
| **IMF involvement** | None (Singapore did not need IMF) | Rejected IMF — Mahathir went unilateral |
| **Stock market intervention** | None (allowed to fall) | Capital controls halted trading of MY stocks on Singapore SIMEX |
| **Recovery pattern** | V-shaped; STI +78% in 1999 | Slower; KLCI +38.6% in 1999, then -16% in 2000 |
| **Years to recover to pre-crisis levels** | ~5 years (recovered by 2003-2004) | **~10 years** (recovered ~2007) |
| **Structural aftermath** | None significant; Singapore strengthened regulatory framework | MYR peg remained until July 2005; financial sector restructured (Danamodal, Danaharta) |
| **Property market** | -45% (SG property crash scenario) | -9.5% to -21% depending on location |

### Key Insight: Why MY Was Worse Than SG

1. **Capital structure:** Malaysia had higher short-term foreign debt and more leveraged corporate sector than Singapore.
2. **Currency peg legacy:** MYR was informally pegged to USD at lower levels pre-crisis, making the eventual devaluation more violent.
3. **Political fragility:** The Mahathir-Anwar split (Sep 1998) created additional political risk premium on Malaysian assets.
4. **Export composition:** Malaysia's tech-heavy exports (electronics) were partially insulated, but financial sector was fragile.
5. **Capital controls:** Paradoxically, the 1998 controls helped the economy recover faster in GDP terms but scared foreign investors for years afterward, creating lingering risk premiums.

### Why the SG Scenario Is NOT Appropriate for MY

The SG `asian_financial` scenario uses STI returns:
- 1997: -28.7%
- 1998: -9.6%
- 1999: +66.0%

A Malaysian investor using the STI-based sequence dramatically **underestimates** how badly KLCI behaved (-52% in 1997, much slower 1999 recovery at +38.6% vs STI's +66%). The different policy response (capital controls, MYR peg, SIMEX delisting) created fundamentally different dynamics.

### Which Global Scenarios Apply Equally to MY?

The non-SG scenarios are all applicable to Malaysian investors since they represent global market conditions that affect all equity markets. However, note these MY-specific nuances:

| Scenario | MY Applicability | Adjustment Needed? |
|----------|----------------|--------------------|
| Great Depression | Applicable (global) | KLCI didn't exist; use as general sequence risk |
| 1973 Oil Crisis | Partially applicable | Malaysia was a *net oil exporter* — this scenario would actually be positive for MY macro even if global equities fell |
| Dot-Com Crash | Applicable | KLCI annual returns 2000: -16.3%, 2001: +2.4%, 2002: -7.2% — milder than S&P |
| GFC 2008 | Applicable | KLCI -39.3% in 2008, +45.2% in 2009 — roughly comparable |
| COVID-19 | Applicable | The MY-specific `my_covid_political` scenario better captures local dynamics |
| Japan Lost Decade | Applicable (cautionary tale) | Particularly relevant for MY given the KLCI's own "lost decade" 2014-2024 |

**Note on Oil Crisis relevance:** Malaysia's status as a *net oil exporter* means that a 1970s-style oil embargo actually benefits Malaysia's terms of trade. The 1973 scenario is still valid for portfolio stress testing (global equity decline), but the macro narrative differs.

---

## 9. Complete KLCI Annual Returns Reference (1996-2023)

Full data for scenario calibration from [1stock1.com](https://www.1stock1.com/1stock1_773.htm):

| Year | KLCI Year-end | Annual Return (Price Only) |
|------|--------------|---------------------------|
| 1996 | 1,237.96 | +24.40% |
| 1997 | 594.44 | -51.98% |
| 1998 | 586.13 | -1.40% |
| 1999 | 812.33 | +38.59% |
| 2000 | 679.64 | -16.33% |
| 2001 | 696.09 | +2.42% |
| 2002 | 646.32 | -7.15% |
| 2003 | 793.94 | +22.84% |
| 2004 | 907.43 | +14.29% |
| 2005 | 899.79 | -0.84% |
| 2006 | 1,096.24 | +21.83% |
| 2007 | 1,445.03 | +31.82% |
| 2008 | 876.75 | -39.33% |
| 2009 | 1,272.78 | +45.17% |
| 2010 | 1,518.91 | +19.34% |
| 2011 | 1,530.73 | +0.78% |
| 2012 | 1,688.95 | +10.34% |
| 2013 | 1,866.96 | +10.54% |
| 2014 | 1,761.25 | -5.66% |
| 2015 | 1,692.51 | -3.90% |
| 2016 | 1,641.73 | -3.00% |
| 2017 | 1,796.81 | +9.45% |
| 2018 | 1,690.58 | -5.91% |
| 2019 | 1,588.76 | -6.02% |
| 2020 | 1,627.21 | +2.42% |
| 2021 | 1,567.53 | -3.67% |
| 2022 | 1,495.49 | -4.60% |
| 2023 | ~1,454 | approx. -2.7% |

**Note:** These are price-only returns; total returns including dividends would be approximately 1-2% higher per year. The KLCI is a 30-stock index. Since 2004 it has been the FBM KLCI (FTSE Bursa Malaysia KLCI), maintaining continuity with the historical KLCI series.

---

## 10. Complete EPF Dividend Rate Reference

| Year | EPF Conventional | EPF Shariah |
|------|-----------------|-------------|
| 1995 | 7.50% | — |
| 1996 | 7.70% | — |
| 1997 | 6.70% | — |
| 1998 | 6.70% | — |
| 1999 | 6.84% | — |
| 2000 | 6.00% | — |
| 2001 | 5.00% | — |
| 2002 | 4.25% | — |
| 2003 | 4.50% | — |
| 2004 | 4.75% | — |
| 2005 | 5.00% | — |
| 2006 | 5.15% | — |
| 2007 | 5.80% | — |
| 2008 | 4.50% | — |
| 2009 | 5.65% | — |
| 2010 | 5.80% | — |
| 2011 | 6.00% | — |
| 2012 | 6.15% | — |
| 2013 | 6.35% | — |
| 2014 | 6.75% | — |
| 2015 | 6.40% | — |
| 2016 | 5.70% | — |
| 2017 | 6.90% | 6.40% |
| 2018 | 6.15% | 5.90% |
| 2019 | 5.45% | 5.00% |
| 2020 | 5.20% | 4.90% |
| 2021 | 6.10% | 5.65% |
| 2022 | 5.35% | 4.75% |
| 2023 | 5.50% | 5.40% |
| 2024 | 6.30% | 6.30% |

**Long-run average (2000-2024): approximately 5.6% conventional.**

Source: [The Money Magnet: Historical EPF Dividend Rates 1983-2024](https://the-money-magnet.com/2008/12/epf-kwsp-annual-dividend-rate-from-1983-2007.html/)

---

## Implementation Recommendation

### Replace these 2 SG scenarios:

1. `asian_financial` (region: 'SG', STI-based) → replace with `my_asian_financial` (region: 'MY', KLCI-based)
2. `sg_property_crash` (region: 'SG') → replace with `my_commodity_political` (region: 'MY', 2014-2016 oil+1MDB)

### Optionally add:

3. `my_covid_political` (region: 'MY') — if you want a MY-specific COVID scenario distinct from the US-based `covid` scenario

### Keep unchanged (globally applicable):

- `great_depression` (US)
- `oil_crisis` (US — note: has different macro implication for MY as oil exporter, but equity-sequence still valid)
- `dotcom` (US)
- `gfc` (US)
- `covid` (US)
- `japan_lost_decade` (Intl)

### Total proposed scenarios: 8 (same as SG app) or 9 (if adding `my_covid_political`)

---

## Sources Summary

| Source | URL | Used For |
|--------|-----|---------|
| 1stock1.com KLCI Annual Returns | https://www.1stock1.com/1stock1_773.htm | All KLCI annual return data |
| 1stock1.com STI Annual Returns | https://www.1stock1.com/1stock1_777.htm | SG/MY comparison |
| The Money Magnet: EPF Dividends | https://the-money-magnet.com/2008/12/epf-kwsp-annual-dividend-rate-from-1983-2007.html/ | All EPF dividend data |
| Wikipedia: 1997 Asian Financial Crisis | https://en.wikipedia.org/wiki/1997_Asian_financial_crisis | KLCI trough, capital controls |
| Wikipedia: FTSE Bursa Malaysia KLCI | https://en.wikipedia.org/wiki/FTSE_Bursa_Malaysia_KLCI | Index background |
| Wikipedia: Malaysian Ringgit | https://en.wikipedia.org/wiki/Malaysian_ringgit | MYR/USD history |
| ADBI Working Paper: Malaysia and the Global Crisis | https://www.adb.org/sites/default/files/publication/156003/adbi-wp148.pdf | 2008 GFC impact |
| IMF: Malaysia From Crisis to Recovery | https://www.imf.org/external/pubs/nft/op/207/index.htm | 1997 capital controls |
| UNCTAD: Malaysia's September 1998 Controls | https://unctad.org/system/files/official-document/gdsmdpbg2420053_en.pdf | Capital controls detail |
| UNESCAP: Malaysia's Response to the Financial Crisis | https://www.unescap.org/sites/default/files/apdj10-1-1-nambiar.pdf | Property market 1997-98 |
| The Star: KLCI Losing 39% in 2008 | https://www.thestar.com.my/business/business-news/2009/01/01/disappointing-2008-with-klci-losing-nearly-39-amid-global-crisis | 2008 KLCI decline |
| The Edge Malaysia: Lost Decade | https://theedgemalaysia.com/node/769138 | 2014-2023 underperformance |
| The Edge Malaysia: KLCI's Lost Decade and Fallen Giants | https://theedgemalaysia.com/node/777470 | 2014-2024 context |
| Medium: Decade in the Range (KLSE 2015-2025) | https://trailblazerempire.medium.com/a-decade-in-the-range-why-the-klse-missed-the-rally-from-2015-to-2025-c0e6eb7c7bc4 | Oil crash + 1MDB |
| CNBC: Why Malaysia Shares May Have Hit Bottom (2015) | https://www.cnbc.com/2015/11/03/why-malaysia-shares-may-have-hit-bottom.html | 2015 ringgit/KLCI |
| MOF Malaysia: RM145bn EPF Withdrawals | https://www.mof.gov.my/portal/en/news/press-citations/rm145-bln-epf-savings-withdrawn-under-covid-related-withdrawal-programmes | COVID EPF withdrawals |
| KWSP: EPF 2020 Annual Report | https://www.kwsp.gov.my/annualreport2020/index-en.html | EPF COVID performance |
| Fortune: Malaysia Longest Bull Run Ended 2020 | https://fortune.com/2020/02/24/longest-bull-run-malaysia-prime-minister/ | Sheraton Move context |
| World Bank: Malaysian Economy Recovery 2020 | https://www.worldbank.org/en/news/press-release/2020/12/17/malaysian-economy-showing-signs-of-recovery-projected-to-grow-by-67-percent-in-2021-following-a-contraction-of-5-8-percent-in-2020 | COVID GDP |
| BNM: OPR Decisions | https://www.bnm.gov.my/monetary-stability/opr-decisions | OPR history |
| Bloomberg: MYR Falls to 25-Year Low | https://www.bloomberg.com/news/articles/2023-10-19/ringgit-falls-to-25-year-low-on-dollar-gains-china-weakness | 2023 MYR crisis |
| NAPIC: Property Overhang View 2023 | https://napic2.jpph.gov.my/storage/app/media//3-penerbitan/Property_Overhang_NAPIC_View_2023.pdf | Property overhang data |
| iProperty: Residential Property Overhang | https://www.iproperty.com.my/news/residential-property-overhang-malaysia/ | Overhang causes |
| EdgeProp: Property Overhang | https://www.edgeprop.my/content/1638530/what-shall-we-do-property-overhang | Overhang 2016-2019 data |
| GlobalPropertyGuide: Malaysia Property 2026 | https://www.globalpropertyguide.com/asia/malaysia/price-history | House price history |
| ResearchGate: Malaysia Ten Years After AFC | https://www.researchgate.net/publication/255573016_Malaysia_Ten_Years_After_the_Asian_Financial_Crisis | 10-year recovery analysis |
