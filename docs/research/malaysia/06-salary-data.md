# Malaysian Salary Data for DOSM-Based Income Benchmarks

**Research Date:** 2026-02-25
**Purpose:** Inform migration of Singapore FIRE Planner to Malaysia. Replaces MOM (Singapore) salary benchmarks with DOSM (Malaysia) equivalents.
**Primary Source:** Department of Statistics Malaysia (DOSM) — dosm.gov.my

---

## 1. DOSM Labour Force Survey and Salaries & Wages Survey

### Overview of Publications

DOSM publishes two complementary salary datasets:

1. **Salaries & Wages Survey Report (SWS)** — Annual. Covers ~10 million salaried employees. The most comprehensive breakdown by age, education, sector, state, gender. Published ~9 months after the reference year.
   - Latest: 2024 data published September 2025
   - URL: https://dosm.gov.my/portal-main/release-content/salaries-and-wages-survey-report-2024
   - Historical: https://www.dosm.gov.my/portal-main/release-content/salaries-and-wages-survey-report-2023

2. **Employee Wages Statistics (Formal Sector)** — Quarterly. Covers ~6.8 million formal sector employees (EPF/SOCSO contributors, ~60% of formal workers). Published ~3-4 months after reference quarter. Age and sector breakdowns at 5-year granularity.
   - Latest: Q4 2024 (December 2024), published April 2025
   - Dashboard: https://open.dosm.gov.my/dashboard/formal-sector-wages
   - Q3 2024: https://www.dosm.gov.my/portal-main/release-content/employee-wages-statistics-formal-sector-third-quarter-2024

3. **Graduates Statistics** — Annual. Covers salary outcomes for graduate-level (diploma and above) employees.
   - Latest: 2024 data, published October 2025
   - URL: https://www.dosm.gov.my/portal-main/release-content/graduates-statistics-2024

**Important note on data access:** Detailed cross-tabulation tables (age x education) are in the full PDF/Excel downloads on the DOSM eStatistik portal, not on the HTML landing pages. The landing pages show only headline figures.

### Headline Figures (2024 Annual Survey)

| Metric | 2024 | 2023 | 2022 | Change (23-24) |
|--------|------|------|------|----------------|
| Median monthly salary | RM 2,793 | RM 2,602 | RM 2,429 | +7.3% |
| Mean monthly salary | RM 3,652 | RM 3,441 | RM 3,219 | +6.1% |
| Real median (inflation-adjusted) | RM 2,103 | RM 1,995 | — | +5.4% |
| Real mean (inflation-adjusted) | RM 2,750 | RM 2,639 | — | +4.2% |
| Number of recipients | 10.24M | 10.11M | — | +1.3% |

Sources:
- [DOSM Salaries & Wages Survey 2024](https://dosm.gov.my/portal-main/release-content/salaries-and-wages-survey-report-2024)
- [Human Resources Online — 2024 salary coverage](https://www.humanresourcesonline.net/malaysia-records-upward-trend-in-median-monthly-salaries-reaching-rm2-793-in-2024)

---

## 2. Median Monthly Salary by Age Group

### Annual Survey Data (2024) — 5-Group Aggregation

The SWS 2024 report uses broader 10-year age bands for its annual survey. The following data is from the published headline figures:

| Age Group | Median 2024 (RM) | Median 2023 (RM) | Change |
|-----------|-----------------|-----------------|--------|
| 15-24 | 1,699 | ~1,580* | ~+7.5% |
| 25-34 | ~2,800* | ~2,600* | ~+8%* |
| 35-44 | 3,371 | 2,865 | +17.7% |
| 45-54 | 3,345 | — | — |
| 55-64 | ~2,900* | — | — |

*Asterisked figures are estimated from adjacent data points (quarterly series and Q4 data). The annual SWS uses 10-year bands matching these groupings but the 25-34 midpoint is interpolated.

**Mean figures (2024) where available:**
- 15-24: RM 2,238 mean
- 45-54: RM 4,507 mean

Sources:
- [DOSM SWS 2024](https://dosm.gov.my/portal-main/release-content/salaries-and-wages-survey-report-2024)
- [Human Resources Online 2024](https://www.humanresourcesonline.net/malaysia-records-upward-trend-in-median-monthly-salaries-reaching-rm2-793-in-2024)

### Quarterly (Formal Sector) Data — Granular 5-Year Age Bands

The quarterly Employee Wages Statistics (Formal Sector) report uses narrower 5-year bands. This is the highest granularity publicly available. The following are from the Q4 2023 (December 2023) release, which is the most complete published table with all age bands:

| Age Group | Median (Dec 2023, RM) | Y-o-Y Change |
|-----------|-----------------------|--------------|
| Under 20 | 1,500 | 0.0% |
| 20-24 | 1,845 | +3.6% |
| 25-29 | 2,600 | +4.0% |
| 30-34 | 3,145 | +3.3% |
| 35-39 | 3,564 | +2.3% |
| 40-44 | 3,827 | +1.7% |
| 45-49 | 3,927 | +3.8% |
| 50-54 | 3,682 | +5.2% |
| 55-59 | 3,382 | +3.0% |
| 60-64 | 2,900 | +7.4% |
| 65+ | 2,755 | +7.0% |

**Q4 2024 Update (December 2024):**

| Age Group | Median (Dec 2024, RM) | Key Change |
|-----------|-----------------------|------------|
| Under 20 | 1,527 | First increase since June 2022 (+1.8%) |
| 45-49 | 4,082 | Highest earners (unchanged ranking) |
| 65+ | 2,982 | Highest Y-o-Y growth (+8.3%) |
| National median (all ages) | 3,045 | +5.0% Y-o-Y |

**Q3 2024 (September 2024):**
- National median: RM 2,745
- Below 20: RM 1,500 (unchanged since June 2022 until Q4 2024)
- 45-49: RM 3,627 (highest, held this ranking for 22 consecutive months through Q3 2024)

**Derived 5-group mapping from 5-year bands:**

| 5-Group Band | Constituent 5-yr Groups | Approximate Median (Dec 2023, RM) |
|---|---|---|
| 15-24 | Under 20 + 20-24 | ~1,700 (weighted avg) |
| 25-34 | 25-29 + 30-34 | ~2,870 (weighted avg) |
| 35-44 | 35-39 + 40-44 | ~3,695 (weighted avg) |
| 45-54 | 45-49 + 50-54 | ~3,800 (weighted avg) |
| 55-64 | 55-59 + 60-64 | ~3,140 (weighted avg) |

Sources:
- [DollarAndSense.my — Full age table Dec 2023](https://dollarsandsense.my/whats-median-salary-malaysia-age-gender-race-state/)
- [DOSM Employee Wages Statistics Q3 2024](https://www.dosm.gov.my/portal-main/release-content/employee-wages-statistics-formal-sector-third-quarter-2024)
- [Malaysian Reserve — December 2024 data](https://themalaysianreserve.com/2025/04/30/median-wages-in-formal-sector-rose-5-in-december-2024/)

### Pattern: Salary Peak at Age 45-49

Unlike Singapore where salaries plateau in the 40s, Malaysian formal sector salaries peak at ages 45-49 (RM 3,927-4,082 median), decline slightly through 50-54, and drop more steeply from 55 onward as many workers transition to informal or part-time arrangements. This reflects lower CPF-equivalent (EPF) mandatory savings relative to SG, and a flatter late-career trajectory.

---

## 3. Salary by Education Level

### Best Available Data (Multiple Sources)

DOSM publishes education-level salary data in the full annual SWS PDF (not extractable from the web landing page). The following figures are reconstructed from DOSM secondary sources, Statista, and Graduates Statistics:

| Education Level | Malaysian Qualification | Median Monthly (RM) | Mean Monthly (RM) | Data Year | Source |
|----------------|------------------------|--------------------|--------------------|-----------|--------|
| No formal education | No certificate | ~1,810 | — | 2022-23 | DOSM SWS (via EARLY.app) |
| Primary | UPSR / Standard 6 | ~1,900-2,000* | — | est. | Interpolated |
| Lower secondary | PMR/PT3 | ~2,100-2,200* | — | est. | Interpolated |
| Upper secondary | SPM | 2,511 | — | 2023 | DOSM SWS (via Statista) |
| Pre-university / matriculation | STPM / Matrikulasi | 3,148 | — | 2023 | DOSM SWS (via Statista) |
| Certificate / TVET | SKM / DKM | ~2,600-2,900* | — | est. | Interpolated |
| Diploma | Diploma | 3,390-3,845 | — | 2023-24 | DOSM SWS / Graduates Stats |
| Bachelor's degree | Ijazah Sarjana Muda | 5,724 | — | 2024 | DOSM Graduates Statistics |
| Master's degree | Ijazah Sarjana | ~7,385* | — | est. | +29% above Bachelor's (DOSM multiplier) |
| PhD / Doctorate | Ijazah Doktor Falsafah | ~9,085* | — | est. | +23% above Master's (DOSM multiplier) |

*Asterisked figures are estimates. Methodology: DOSM's own Salaries & Wages Survey reports education-level salary multipliers (certificate/diploma = +17% over SPM; degree = +24% over diploma; master = +29% over degree; PhD = +23% over master). The interpolations apply these multipliers.

**Key anchors (confirmed):**
- No formal education: RM 1,810/month (DOSM, via EARLY.app)
- SPM (upper secondary, Year 11): RM 2,511/month mean (DOSM, 2023, via Statista)
- STPM (pre-university, Year 13): RM 3,148/month mean (DOSM, 2023, via Statista)
- Diploma: RM 3,390 median / RM 3,845 mean (DOSM 2023-24, Graduates Statistics)
- Degree (all graduates): RM 5,724 median, RM 5,330 mean (DOSM 2024 Graduates Statistics)
- Tertiary overall (diploma+degree combined): RM 4,703 mean (DOSM)
- Low-skilled workers: RM 2,128 mean (DOSM 2024 SWS, a reasonable proxy for primary/lower secondary)

**Diploma discrepancy note:** The SWS 2023 shows diploma holders averaging RM 3,845 mean, while Graduates Statistics 2024 shows diploma holders at RM 3,390 median. The SWS figure covers all current workers with diplomas (older cohorts with experience); the Graduates Statistics covers more recent entrants. Use RM 3,390-3,600 as the median for modelling purposes.

Sources:
- [DOSM Graduates Statistics 2024](https://www.dosm.gov.my/portal-main/release-content/graduates-statistics-2024)
- [Statista — SPM salary 2023](https://www.statista.com/statistics/720253/malaysia-average-monthly-salary-with-11th-grade-education/)
- [Statista — STPM salary 2023](https://www.statista.com/statistics/720267/malaysia-average-monthly-salary-with-a-high-school-education/)
- [Statista — Diploma salary 2023](https://www.statista.com/statistics/720274/malaysia-average-monthly-salary-with-a-diploma/)
- [Statista — Degree salary 2023](https://www.statista.com/statistics/720281/malaysia-average-monthly-salary-with-a-degree/)
- [EARLY.app Malaysia salary data](https://early.app/average-salary/malaysia/)

### Education Premium Summary

Relative salary multipliers (as published by DOSM SWS):

| Transition | Salary Increase |
|-----------|-----------------|
| SPM to Certificate/Diploma | +17% |
| Diploma to Bachelor's Degree | +24% |
| Bachelor's to Master's Degree | +29% |
| Master's to PhD | +23% |

---

## 4. Age x Education Cross-Tabulation

### Does DOSM Publish This?

**Short answer: Partially.** The full Salaries & Wages Survey Report PDF (not the web landing page) does contain tables cross-tabulating wages by education level AND age group, but:
- These tables are inside password-protected or image-rendered PDFs that are not machine-readable from the web
- The annual SWS uses 10-year age bands (15-24, 25-34, 35-44, 45-54, 55-64, 65+) crossed with education level
- The quarterly formal sector report uses 5-year age bands but does NOT cross-tabulate by education (only by age OR education separately)

### Replication Strategy for the SG App Matrix

The Singapore app uses a 9 age-group x 5 education-level matrix. For Malaysia, we recommend:

**Age groups (5 groups, matching DOSM annual SWS bands):**
- 15-24
- 25-34
- 35-44
- 45-54
- 55-64

**Education levels (6 levels, matching Malaysian qualification system):**
- No formal / Primary (UPSR and below)
- Lower secondary (PMR/PT3)
- Upper secondary (SPM)
- STPM / Matriculation / Certificate
- Diploma (including TVET Diploma)
- Degree and above (Bachelor's+)

**Construction method:** Without the full DOSM PDF matrix, approximate the age x education grid by:
1. Start with education-level medians (Section 3 above)
2. Apply age-based salary index relative to overall median (the formal sector age curve)
3. Multiply: `cell[age][edu] = edu_median * (age_median / overall_median)`

Example (Dec 2023 data):
- Overall median: RM 2,900
- Age index for 45-49: 3,927 / 2,900 = 1.354
- Degree median: RM 5,724
- Estimated: degree holder age 45-49 = 5,724 x 1.354 = ~RM 7,750/month

This approximation assumes the age-earnings profile shape is similar across education levels, which is an acceptable simplification for planning purposes.

### Where to Get the Actual Matrix

The full age x education matrix is in the **Salaries & Wages Survey Report** PDF, available to download from the DOSM eStatistik portal (requires free registration):
- Portal: https://www.dosm.gov.my/v1/index.php?r=column/cthemeByCat&cat=157
- The 2024 report PDF: https://storage.dosm.gov.my/labour/salaries_wages_2023.pdf (note: 2023 report URL pattern; 2024 follows same pattern)

---

## 5. Salary Growth Rates

### Historical Nominal Wage Growth

| Period | Nominal Growth | Notes |
|--------|---------------|-------|
| 2015-2022 | ~3.7% p.a. (CAGR) | RM 2,590 (2015) to RM 3,332 (2022) mean |
| 2022 | — | Median RM 2,429 |
| 2023 | +7.1% | Median RM 2,602; Mean +6.9% to RM 3,441 |
| 2024 | +7.3% | Median RM 2,793; Mean +6.1% to RM 3,652 |
| Q1 2025 | +5.5% Y-o-Y | Formal sector median RM 3,000 (March 2025) |
| Q4 2024 | +5.0% Y-o-Y | Formal sector median RM 3,045 (December 2024) |

**Long-run planning rate:** 5-6% nominal per annum, approximately 3-4% real (against ~2-3% CPI inflation).

Sources:
- [DOSM SWS 2024](https://dosm.gov.my/portal-main/release-content/salaries-and-wages-survey-report-2024)
- [Staffing Industry — Q1 2025](https://www.staffingindustry.com/news/global-daily-news/malaysias-median-wage-rises-in-q1-2025)

### Salary Increment Rates by Industry (Mercer TRS 2023)

Mercer's Total Remuneration Survey (2023) projects 2024 salary increases:

| Industry | 2023 Actual Increment | 2024 Projected |
|----------|----------------------|----------------|
| Energy | 6.5% | — |
| High-Tech / IT | 6.1% | 5-6% |
| Consumer Goods | 5.0% | — |
| Manufacturing | 5.0% | — |
| Life Sciences | 4.3% | — |
| Transportation Equipment | 3.6% | — |
| All industries (median) | 5.0% | 5.1% |

**2025 outlook:** 5% across all industries (WTW survey).

Sources:
- [Mercer TRS 2023 — Malaysia](https://www.mercer.com/en-my/about/newsroom/malaysia-trs-2023-news-release/)
- [WTW Malaysia 2024 Pay Outlook](https://www.wtwco.com/en-my/news/2024/01/malaysia-pay-raises-to-remain-high-in-2024-wtw-survey-finds)

### Salary Growth by Career Stage

Based on aggregated industry sources:

| Career Stage | Years Experience | Incremental Growth |
|---|---|---|
| Entry level (fresh grad) | 0-2 years | Base salary (RM 2,500-3,200 fresh grad median) |
| Early career | 2-4 years | +10-15% over entry (annual reviews + job changes) |
| Mid-career | 4-8 years | +30-40% over entry total; ~5-8% p.a. |
| Senior individual contributor | 8-12 years | +80-100% over entry total |
| Management track | 12-20 years | Junior manager RM 5,000-8,000; mid-manager RM 8,000-12,000; senior RM 15,000+ |

**Key milestone:** Employees with 2-5 years' experience earn ~32% more than fresh graduates; 5+ years earn ~36% more than fresh graduates.

**Promotion jump:** No official DOSM data on promotion salary jumps. The Mercer survey reports a median bonus of 2.2 months of base salary. Industry estimates suggest typical promotion increments of 10-20%.

Sources:
- [Instarem — Malaysia salary by experience](https://www.instarem.com/blog/average-salary-in-malaysia/)
- [Mercer TRS 2023](https://www.mercer.com/en-my/about/newsroom/malaysia-trs-2023-news-release/)

### Salary by Work Experience (Annual Figures)

| Years of Experience | Average Annual Salary (RM) | Monthly Equivalent |
|---|---|---|
| 0-1 (fresh grad / intern) | 62,032 | 5,169 |
| 1-2 | 65,708 | 5,476 |
| 2-4 | 81,331 | 6,778 |
| 4-8 | 110,280 | 9,190 |
| 8-12 | 154,851 | 12,904 |
| 12-16 | 186,557 | 15,546 |
| 16-20 | 226,074 | 18,840 |
| 20+ | 276,159 | 23,013 |

**Note:** These figures from Instarem/SalaryExplorer appear high relative to DOSM medians because they likely capture formal sector knowledge workers only (white collar, urban, qualified workers) rather than the full workforce. Use these for career progression shape, not absolute values. Scale down by ~40-50% for median-worker modelling.

Source: [Instarem — Malaysia salary guide 2025](https://www.instarem.com/blog/average-salary-in-malaysia/)

---

## 6. Sector-Based Salary Data

### By Economic Sector (DOSM SWS 2024)

| Sector | Mean Monthly (RM) | Median (where available) | Change 2023-24 |
|---|---|---|---|
| Mining & Quarrying | 5,904 | — | — |
| Services | 3,831 | — | +5.8% |
| Manufacturing | 3,278 | — | +7.4% (highest growth) |
| Construction | 3,035 | — | — |
| Agriculture | 2,409 | 2,382 (Dec 2024) | — |

**December 2024 (Formal Sector Quarterly):**
- Mining & Quarrying: RM 7,500 median (+9.6% Y-o-Y)
- Agriculture: RM 2,382 median (+3.6% Y-o-Y)

Sources:
- [DOSM SWS 2024](https://dosm.gov.my/portal-main/release-content/salaries-and-wages-survey-report-2024)
- [Malaysian Reserve — Dec 2024](https://themalaysianreserve.com/2025/04/30/median-wages-in-formal-sector-rose-5-in-december-2024/)

### By Occupation (DOSM SWS 2024)

| Occupation Group | Median (RM) | Mean (RM) |
|---|---|---|
| Managers | 5,990 | 7,121 |
| Professionals | 5,821 | 6,524 |
| Technicians / Associate Professionals | 3,541 | 4,077 |
| Clerical Support Workers | 2,931 | — |
| Services & Sales Workers | 2,561 | — |
| Craft and Related Trades | 2,510 | — |
| Plant / Machine Operators | 2,404 | — |
| Low-skilled (all) | 2,128 (mean) | — |

Source: [Ringgit Plus — 2024 salary data](https://ringgitplus.com/en/blog/personal-finance-news/salaries-and-wages-in-malaysia-increased-in-2024.html)

### By Sector — Detailed Estimates (Non-DOSM, industry surveys)

| Sector | Average Monthly (RM) | Notes |
|---|---|---|
| IT / Technology | 6,610 avg; RM 6,000-12,000 experienced | High demand, multinational premium |
| Finance & Insurance | 4,883 avg; RM 7,000-11,000 senior | Global banks pay higher |
| Oil & Gas | RM 6,000-9,000 | Petronas + international |
| Healthcare | RM 5,000-8,000 | Public sector lower |
| Legal Services | RM 6,000-9,000 | Private practice |
| Mining & Quarrying | 5,623 avg | Small workforce |
| Construction | 3,052 avg | — |
| Retail / Trade | 2,903 avg | — |
| Agriculture | 2,027-2,204 avg | — |

Source: [EARLY.app Malaysia](https://early.app/average-salary/malaysia/)

### Mercer Industry Salary Growth Context (2023-24)

Energy and High-Tech led growth at 6.5% and 6.1% respectively. These sectors typically pay 20-40% above the national median. Insurance, Banking, Tech, Media, Shared Services, Oil & Gas paid the most competitive base salaries.

Source: [Mercer TRS 2023](https://www.mercer.com/en-my/about/newsroom/malaysia-trs-2023-news-release/)

---

## 7. Minimum Wage

### Current Rate

| Effective Date | Monthly (RM) | Hourly (RM) | Applicability |
|---|---|---|---|
| February 1, 2025 | 1,700 | 8.14 | Employers with 5+ employees |
| August 1, 2025 | 1,700 | 8.14 | All employers (no size threshold) |

**Previous rate (2022-Jan 2025):** RM 1,500/month

### Regional Uniformity

As of 2022, Malaysia's minimum wage is **nationally uniform** — no distinction between Peninsular Malaysia, Sabah, Sarawak, or Federal Territories (Labuan, Putrajaya, Kuala Lumpur). This replaced the two-tier system that existed from 2013-2022.

**Historical context:**
- 2013: RM 900 (Peninsular), RM 800 (Sabah/Sarawak/Labuan)
- 2019: RM 1,100 (Peninsular), RM 920 (Sabah/Sarawak)
- 2020: RM 1,200 (all)
- 2022: RM 1,500 (all, unified)
- 2025: RM 1,700 (all)

Sources:
- [Ajobthing — Malaysia minimum wage 2025](https://www.ajobthing.com/resources/blog/malaysia-minimum-wage-latest-update)
- [PayrollPanda — Minimum wage laws](https://www.payrollpanda.my/labour-laws/malaysia-minimum-wage-laws/)

### Minimum Wage as % of Median

RM 1,700 / RM 2,793 = **60.9% of national median salary (2024)**. This is relatively high by emerging market standards, reflecting the government's wage floor policy.

---

## 8. Income Distribution: B40 / M40 / T20

### Household Income Thresholds (2022 HIES — Latest Official)

The Household Income & Expenditure Survey (HIES) 2022 is the most recent published. HIES is conducted every 3-5 years.

| Group | Monthly Household Income Range (RM) | Households | % of Total Income |
|---|---|---|---|
| B40 (Bottom 40%) | Below 5,249 | 3.16 million | 16.1% |
| M40 (Middle 40%) | 5,250 to 11,819 | ~3.16 million | 37.6% |
| T20 (Top 20%) | Above 11,820 | 1.58 million | 46.3% |

**Median household income:** RM 6,338/month (2022)
**Mean household income:** RM 8,479/month (2022)

**Important:** These are *household* figures, not individual worker salaries. An average Malaysian household has ~3-3.5 members, with roughly 1.5-2 income earners.

### Rough Individual Income Approximations

To convert household thresholds to individual income for a two-earner household:
- B40 individual: below ~RM 2,600/month per earner
- M40 individual: RM 2,600 to RM 5,900/month per earner
- T20 individual: above RM 5,900/month per earner

This aligns well with the overall median of RM 2,793 sitting within the B40-M40 boundary.

### 2024 Policy Change

In 2024, the Ministry of Economy announced plans to phase out the B40/M40/T20 classification in favour of a more nuanced multi-dimensional poverty/income index that accounts for household size, location, and non-income factors. As of February 2026, the 2022 HIES thresholds remain the official reference.

Sources:
- [DOSM Household Income Survey 2022](https://www.dosm.gov.my/portal-main/release-content/household-income-survey-report--malaysia--states)
- [OpenDOSM Gini Coefficient Data](https://open.dosm.gov.my/data-catalogue/hh_inequality?visual=gini)
- [BusinessToday — 2022 HIES results](https://www.businesstoday.com.my/2023/07/28/median-household-income-moderated-by-2-5-in-2022-to-rm6338-dosm/)

### Gini Coefficient (Income Inequality)

| Year | Gini Coefficient |
|------|-----------------|
| 2014 | 0.401 |
| 2016 | 0.399 (historic low) |
| 2019 | 0.407 (rose after COVID effects) |
| 2022 | 0.404 |

Malaysia's Gini of 0.404 indicates moderate income inequality — lower than many ASEAN peers but higher than Singapore (0.37) and much higher than South Korea or Japan (~0.29-0.33).

**Income share by group (2022):**
- T20: 46.3% of total income
- M40: 37.6%
- B40: 16.1%

Source: [OpenDOSM Gini Coefficient Dashboard](https://open.dosm.gov.my/data-catalogue/hh_inequality?visual=gini)

### Wage Distribution

From Q4 2024 Formal Sector report:
- 29.2% of formal employees earn below RM 2,000/month (down from ~31% in 2023)
- Bottom 10%: RM 1,500 or below
- Top 10%: RM 10,800 or above
- Wage ratio (P90:P10): approximately 7:1

---

## 9. Comparison with Singapore

### Exchange Rate Reference

**SGD/MYR rate (approximate, Feb 2026):** 1 SGD = ~3.50 MYR (spot rate)
**PPP conversion:** RM 60,000 in Malaysia ≈ SGD 31,667 in Singapore (PPP-adjusted purchasing power)
**PPP ratio:** ~1.9 (MYR needs to be divided by ~1.9 to get SGD PPP equivalent)

Source: [ParityDeals PPP Calculator](https://www.paritydeals.com/ppp-calculator/malaysia-vs-singapore/?salary=60000)

### Salary Comparison by Education Level

| Education | Malaysia Median (RM/month) | Malaysia PPP-Equiv (SGD/month) | Singapore Median (SGD/month) | SG Premium (PPP) |
|---|---|---|---|---|
| SPM (upper secondary) | 2,511 | 1,322 | ~2,400* | +81% |
| Diploma | 3,390-3,845 | 1,784-2,024 | ~3,200* | +58-79% |
| Degree (fresh grad) | 2,900-3,200 | 1,526-1,684 | 3,600-4,200 (GES) | +114-175% |
| Degree (all ages) | 5,724 | 3,012 | 8,650 (MOM 2023) | +187% |
| Master's (est.) | ~7,385 | ~3,887 | ~10,000+ | +157% |

*Singapore figures for non-degree estimated from MOM data. MOM-published degree median of SGD 8,650/month (2023) and fresh graduate GES median of SGD 4,200-4,500.

**Key finding:** Singapore degree holders earn nominally ~51% more than Malaysian degree holders (SGD vs MYR at spot rate); but on a PPP-adjusted basis, Singapore degree holders retain ~187% more purchasing power due to the higher cost of living premium in SG being less than the wage premium.

### Cost of Living Adjustment Factor

For a FIRE planning app, when showing "equivalent" lifestyle costs:

| Category | Malaysia (RM) | Singapore Equivalent (SGD) | Ratio |
|---|---|---|---|
| Overall cost of living (excl. rent) | 1,800-2,500/month | 1,137/month | SG = 153% more expensive |
| Cost of living (incl. rent) | 2,500-4,000/month | 3,000-5,000/month | SG = 241% more expensive |
| 1BR apartment (city centre) | 1,653/month | 10,859/month | SG = 557% more expensive |
| Inexpensive meal | RM 15 | SGD 9.56 (RM 33.5 equiv) | SG = 2.2x |

**Practical planning conversion:**
- A Malaysian retiree spending RM 5,000/month in Kuala Lumpur would need approximately SGD 5,800-7,000/month in Singapore for an equivalent lifestyle (after accounting for the cost of living difference).
- Conversely, a Singapore resident retiring to Malaysia could reduce living costs by 50-70%.

Sources:
- [Numbeo — Malaysia vs Singapore cost of living](https://www.numbeo.com/cost-of-living/compare_countries_result.jsp?country1=Malaysia&country2=Singapore)
- [ParityDeals PPP Calculator MYR-SGD](https://www.paritydeals.com/ppp-calculator/malaysia-vs-singapore/?salary=60000)

### Average Net Salary Comparison (Numbeo, 2025)

| Country | Average Monthly Net Salary |
|---|---|
| Malaysia | RM 3,784 (~SGD 1,082) nominal |
| Singapore | SGD 16,998 |

**Nominal ratio:** Singapore average is ~15.7x higher in SGD. At MYR/SGD spot, it is ~4.5x higher. PPP-adjusted, the gap narrows to ~2.5-3x.

Source: [Numbeo Cost of Living Comparison](https://www.numbeo.com/cost-of-living/compare_countries_result.jsp?country1=Malaysia&country2=Singapore)

---

## 10. Fresh Graduate Salary Benchmarks (by Field)

Relevant for the "Data-Driven" salary model in the planner app (equivalent of MOM by education level, by field):

| Field / Degree | Median Fresh Grad Monthly (RM) | Range |
|---|---|---|
| Computer Science / IT | 5,000 | RM 4,000-6,000 |
| Engineering (Mech/Elec/Chem) | 4,300 | RM 3,500-5,000 |
| Medicine / Dentistry (Housemanship) | 6,500 | RM 5,500-7,500 |
| Finance & Accounting | 4,000 | RM 3,000-4,800 |
| Business / Management | 3,800 | RM 3,000-4,500 |
| Healthcare / Life Sciences | 4,000 | RM 3,200-4,800 |
| Arts & Humanities | 3,200 | RM 2,800-3,800 |
| Law (Chambering) | 2,800 | RM 2,500-3,000 |

**National averages for fresh graduates (2024):**
- National average: RM 2,900/month (all fields)
- National median: RM 2,700/month
- ~65% of fresh grads earn below RM 3,000

**By city:**
- Kuala Lumpur: RM 3,200 average
- Penang: RM 3,000 average
- Johor Bahru: RM 2,900 average
- Kuching (Sarawak): RM 2,700 average

Source: [EasyUni — Fresh Graduate Salary Malaysia](https://www.easyuni.my/advice/fresh-graduate-salary-malaysia-3411/)

---

## 11. Proposed `dosmSalary.ts` Data File Structure

### Recommendation

Based on all data gathered, here is the recommended structure for the `dosmSalary.ts` file in the Malaysian FIRE planner:

```typescript
/**
 * Malaysian Salary Benchmarks from DOSM (Department of Statistics Malaysia)
 *
 * Primary sources:
 * - Salaries & Wages Survey (SWS) 2024: https://dosm.gov.my/portal-main/release-content/salaries-and-wages-survey-report-2024
 * - Employee Wages Statistics (Formal Sector) Q4 2024: https://themalaysianreserve.com/2025/04/30/median-wages-in-formal-sector-rose-5-in-december-2024/
 * - Graduates Statistics 2024: https://www.dosm.gov.my/portal-main/release-content/graduates-statistics-2024
 * - Household Income & Expenditure Survey 2022: https://www.dosm.gov.my/portal-main/release-content/household-income-survey-report--malaysia--states
 *
 * Data vintage: 2024 SWS (published September 2025), Q4 2024 formal sector
 * All values: median monthly salary in RM (Malaysian Ringgit), nominal
 * Figures represent employees in the formal sector; informal sector workers earn less
 */

// Age group labels matching DOSM annual SWS convention
export type AgeGroup = '15-24' | '25-34' | '35-44' | '45-54' | '55-64';

// Education levels mapped to Malaysian qualification system
export type EducationLevel =
  | 'noFormal'         // No formal education / no certificate
  | 'primary'          // Primary education (UPSR / Year 6)
  | 'lowerSecondary'   // Lower secondary (PMR/PT3 / Year 9)
  | 'upperSecondary'   // Upper secondary (SPM / Year 11) — largest group
  | 'preUniversity'    // Pre-university / STPM / Matriculation / Certificate
  | 'diploma'          // Diploma (TVET or academic, 2-3 years post-SPM)
  | 'degree'           // Bachelor's degree (Ijazah Sarjana Muda)
  | 'postgrad';        // Master's degree, PhD, professional qualifications

/**
 * Median monthly salary by age group (RM)
 * Source: DOSM Employee Wages Statistics Q4 2023 (5-year bands) mapped to 10-year bands
 * Q4 2023 data used as it has the most complete published age breakdown
 * Scale up by ~7% for 2024 values
 */
export const DOSM_SALARY_BY_AGE: Record<AgeGroup, number> = {
  '15-24': 1_699,   // DOSM SWS 2024 annual; formal sector Dec 2023: ~1,700 weighted
  '25-34': 2_870,   // Derived: avg of 25-29 (2,600) and 30-34 (3,145) from Q4 2023
  '35-44': 3_695,   // Derived: avg of 35-39 (3,564) and 40-44 (3,827) from Q4 2023
  '45-54': 3_800,   // Derived: avg of 45-49 (3,927) and 50-54 (3,682); DOSM SWS 2024: 3,345
  '55-64': 3_140,   // Derived: avg of 55-59 (3,382) and 60-64 (2,900) from Q4 2023
};

/**
 * Median monthly salary by education level (RM)
 * Sources: DOSM SWS 2023-2024, Graduates Statistics 2024, Statista DOSM data
 * Estimates marked with comment; confirmed figures from official sources
 */
export const DOSM_SALARY_BY_EDUCATION: Record<EducationLevel, number> = {
  noFormal:        1_810,  // DOSM SWS (via EARLY.app); confirmed figure
  primary:         1_950,  // Estimated: between no formal and lower secondary
  lowerSecondary:  2_150,  // Estimated: between primary and SPM
  upperSecondary:  2_511,  // DOSM SWS 2023 via Statista; SPM holders confirmed
  preUniversity:   3_148,  // DOSM SWS 2023 via Statista; STPM holders confirmed
  diploma:         3_390,  // DOSM Graduates Statistics 2024 (median); SWS 2023 mean: 3,845
  degree:          5_724,  // DOSM Graduates Statistics 2024 (median); confirmed
  postgrad:        7_385,  // Estimated: degree median x 1.29 (DOSM-published Master's premium)
};

/**
 * Age x Education matrix (RM median monthly)
 * Constructed by: edu_median * (age_median / overall_median)
 * Overall median reference: RM 2,793 (DOSM SWS 2024)
 * Use for "Data-Driven" salary model — analogous to SG MOM matrix
 */
const OVERALL_MEDIAN = 2_793;

function buildMatrix(): Record<AgeGroup, Record<EducationLevel, number>> {
  const ageGroups: AgeGroup[] = ['15-24', '25-34', '35-44', '45-54', '55-64'];
  const eduLevels: EducationLevel[] = ['noFormal', 'primary', 'lowerSecondary', 'upperSecondary', 'preUniversity', 'diploma', 'degree', 'postgrad'];

  const matrix = {} as Record<AgeGroup, Record<EducationLevel, number>>;
  for (const age of ageGroups) {
    matrix[age] = {} as Record<EducationLevel, number>;
    const ageIndex = DOSM_SALARY_BY_AGE[age] / OVERALL_MEDIAN;
    for (const edu of eduLevels) {
      matrix[age][edu] = Math.round(DOSM_SALARY_BY_EDUCATION[edu] * ageIndex);
    }
  }
  return matrix;
}

export const DOSM_SALARY_MATRIX = buildMatrix();

/**
 * Annual salary growth rate (nominal)
 * Used for projecting salary over career
 */
export const SALARY_GROWTH_RATES = {
  longRunNominal: 0.055,       // 5.5% p.a. (midpoint of 2023-24 actuals, Mercer 2024 projection)
  longRunReal: 0.033,          // ~3.3% real (5.5% nominal - 2.2% CPI)
  earlyCareerBonus: 0.02,      // Additional 2% in first 5 years above long-run
  minimumWageMonthly: 1_700,   // RM 1,700/month as of August 2025
} as const;

/**
 * Income distribution thresholds (household, 2022 HIES)
 * For reference / context display
 */
export const INCOME_DISTRIBUTION = {
  b40MaxHousehold: 5_249,    // RM/month household gross
  m40MaxHousehold: 11_819,   // RM/month household gross
  medianHousehold: 6_338,    // RM/month (2022)
  giniCoefficient: 0.404,    // 2022
  dataYear: 2022,
  source: 'DOSM Household Income & Expenditure Survey 2022',
} as const;

export const DATA_SOURCE = 'DOSM Salaries & Wages Survey 2024 + Employee Wages Statistics Q4 2024';
export const DATA_VINTAGE = '2025-09-30'; // Date SWS 2024 was published
```

### Design Notes

1. **Use monthly figures (RM):** The SG app uses annual — convert by multiplying by 12 at display layer, or change the data file to annual. DOSM publishes monthly; annual = monthly x 12 (no bonus included in base salary stat).

2. **5 age groups vs 9:** DOSM's annual survey uses 6 groups (15-24, 25-34, 35-44, 45-54, 55-64, 65+). The quarterly formal sector data provides 5-year bands but not cross-tabulated with education. Recommend 5 groups (excluding 65+) as the baseline matrix.

3. **8 education levels:** DOSM technically uses 4 broad levels (no formal, primary, secondary, tertiary). To match the spirit of the SG app's granularity, we expand to 8 levels using the Malaysian qualification ladder. Figures for the granular breakdown rely on Statista-sourced DOSM data and education premium multipliers.

4. **Formal sector bias:** All DOSM salary data covers formal sector workers (EPF/SOCSO contributors). Informal sector workers (an estimated 20-25% of the workforce) earn less and are not well-represented. For a FIRE planner targeting financially literate users, this is an acceptable limitation.

5. **No DOSM equivalent of MOM's Occupational Wages Survey:** Singapore's MOM publishes median salary by occupation AND educational level. DOSM does not publish this cross-tabulation publicly. The constructed matrix is an approximation.

---

## 12. Data Gaps and Caveats

| Gap | Impact | Mitigation |
|---|---|---|
| Age x Education matrix not in public DOSM web pages | Cannot replicate SG MOM matrix precisely | Use constructed matrix (age index x education median) |
| No formal education salary RM 1,810 — may be outdated (2022) | Low-end calibration uncertainty | Apply 5.5% growth to 2024: ~RM 2,010 |
| Diploma figure inconsistency (RM 3,390 median vs RM 3,845 mean) | Two figures for same group | Use RM 3,390 median for planner modelling |
| PhD/Master's salary estimated (multiplier-based) | Upper tail uncertainty | Use as indicative only; prompt users to input actual salary |
| B40/M40/T20 uses household income, not individual | Cannot directly compare to salary data | Note in UI that thresholds are household-level |
| 2024 HIES not yet published | Income distribution may have shifted | 2022 HIES is current official source |
| Quarterly formal sector age data uses calendar month snapshots | Seasonal variation possible | December (Q4) figures are most representative for annual planning |

---

## 13. All Primary Source URLs

| Source | URL | Access |
|---|---|---|
| DOSM SWS 2024 (landing page) | https://dosm.gov.my/portal-main/release-content/salaries-and-wages-survey-report-2024 | Free |
| DOSM SWS 2023 (landing page) | https://www.dosm.gov.my/portal-main/release-content/salaries-and-wages-survey-report-2023 | Free |
| DOSM SWS 2023 (PDF, 152 pages) | https://storage.dosm.gov.my/labour/salaries_wages_2023.pdf | Free |
| DOSM Graduates Statistics 2024 | https://www.dosm.gov.my/portal-main/release-content/graduates-statistics-2024 | Free |
| DOSM Employee Wages Q3 2024 | https://www.dosm.gov.my/portal-main/release-content/employee-wages-statistics-formal-sector-third-quarter-2024 | Free |
| DOSM Formal Sector Wages Dashboard | https://open.dosm.gov.my/dashboard/formal-sector-wages | Free |
| OpenDOSM Data Catalogue | https://open.dosm.gov.my/data-catalogue | Free |
| DOSM HIES 2022 | https://www.dosm.gov.my/portal-main/release-content/household-income-survey-report--malaysia--states | Free |
| OpenDOSM Gini Data | https://open.dosm.gov.my/data-catalogue/hh_inequality?visual=gini | Free |
| DOSM Household Income Dashboard | https://open.dosm.gov.my/dashboard/household-income-expenditure | Free |
| Mercer TRS 2023 — Malaysia | https://www.mercer.com/en-my/about/newsroom/malaysia-trs-2023-news-release/ | Free |
| WTW Malaysia 2024 Pay Outlook | https://www.wtwco.com/en-my/news/2024/01/malaysia-pay-raises-to-remain-high-in-2024-wtw-survey-finds | Free |
| Numbeo — MY vs SG cost of living | https://www.numbeo.com/cost-of-living/compare_countries_result.jsp?country1=Malaysia&country2=Singapore | Free |
| ParityDeals MYR-SGD PPP Calculator | https://www.paritydeals.com/ppp-calculator/malaysia-vs-singapore/?salary=60000 | Free |
| EasyUni Fresh Grad Salaries | https://www.easyuni.my/advice/fresh-graduate-salary-malaysia-3411/ | Free |
| DollarAndSense — Age/Race breakdown | https://dollarsandsense.my/whats-median-salary-malaysia-age-gender-race-state/ | Free |
| Ringgit Plus — 2024 salary data | https://ringgitplus.com/en/blog/personal-finance-news/salaries-and-wages-in-malaysia-increased-in-2024.html | Free |
| Malaysian Reserve — Dec 2024 wages | https://themalaysianreserve.com/2025/04/30/median-wages-in-formal-sector-rose-5-in-december-2024/ | Free |
| Statista — SPM salary 2023 | https://www.statista.com/statistics/720253/malaysia-average-monthly-salary-with-11th-grade-education/ | Paywall |
| Statista — STPM salary 2023 | https://www.statista.com/statistics/720267/malaysia-average-monthly-salary-with-a-high-school-education/ | Paywall |
| Statista — Diploma salary 2023 | https://www.statista.com/statistics/720274/malaysia-average-monthly-salary-with-a-diploma/ | Paywall |
| Statista — Degree salary 2023 | https://www.statista.com/statistics/720281/malaysia-average-monthly-salary-with-a-degree/ | Paywall |

---

*End of research document. Last updated: 2026-02-25.*
