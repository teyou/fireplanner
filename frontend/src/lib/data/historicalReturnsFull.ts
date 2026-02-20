// Historical Returns Dataset for FIRE Planner (Real Data)
// Last updated: 2026-02-20
//
// Sources:
//   US Equities (S&P 500 incl. dividends): Damodaran, NYU Stern histretSP.xls, 1928-2024
//     https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histretSP.html
//   US Bonds (10-yr Treasury total return): Damodaran, NYU Stern histretSP.xls, 1928-2024
//   Cash (3-month T-Bill): Damodaran, NYU Stern histretSP.xls, 1928-2024
//   Gold: Damodaran / LBMA London PM fix annual return, 1968-2024
//     Cross-validated with upmyinterest.com/gold
//   US CPI: BLS CPI-U Dec-to-Dec change (same methodology as Damodaran), 1928-2024
//   REITs: NAREIT All Equity REITs Total Return, 1972-2024
//     https://www.reit.com/data-research/reit-indexes/annual-index-values-returns
//   Intl Equities: MSCI World Gross Total Return USD, 1970-2024
//     https://www.msci.com (backtested pre-1986 launch)
//   SG Equities (STI): 1stock1.com STI price return + est. 3% dividend, 1988-2024
//     https://www.1stock1.com/1stock1_777.htm
//     Years 1988-2001: estimated total return (price + ~3% dividend yield)
//     Years 2002-2024: still estimated; see STI_VERIFIED_TOTAL_RETURN_FROM
//   SG CPI: FRED FPCPITOTLZGSGP (World Bank / SingStat), 1961-2024
//     https://fred.stlouisfed.org/series/FPCPITOTLZGSGP
//   USD/SGD Change: Annual % change computed from FRED EXSIUS annual averages, 1981-2024
//     https://fred.stlouisfed.org/series/EXSIUS
//   CPF Blended: Constant 0.03 (OA 2.5% + SA 4.0% weighted ~60/40)
//
// All return values are decimal fractions (0.10 = 10%).
// null indicates data not available for that period.

export interface HistoricalReturnRow {
  year: number
  usEquities: number | null
  sgEquities: number | null
  intlEquities: number | null
  usBonds: number | null
  reits: number | null
  gold: number | null
  cash: number | null
  cpfBlended: number | null
  usCpi: number | null
  sgCpi: number | null
  usdSgdChange: number | null
}

/** First year where STI data uses verified total return index (vs estimated price + dividend). */
export const STI_VERIFIED_TOTAL_RETURN_FROM = 2002

export const HISTORICAL_RETURNS: HistoricalReturnRow[] = [
  // 1928-1939: Pre-war era. Only US data + CPI available.
  { year: 1928, usEquities: 0.4381, sgEquities: null, intlEquities: null, usBonds: 0.0084, reits: null, gold: null, cash: 0.0308, cpfBlended: 0.03, usCpi: -0.0116, sgCpi: null, usdSgdChange: null },
  { year: 1929, usEquities: -0.0830, sgEquities: null, intlEquities: null, usBonds: 0.0420, reits: null, gold: null, cash: 0.0316, cpfBlended: 0.03, usCpi: 0.0058, sgCpi: null, usdSgdChange: null },
  { year: 1930, usEquities: -0.2512, sgEquities: null, intlEquities: null, usBonds: 0.0454, reits: null, gold: null, cash: 0.0455, cpfBlended: 0.03, usCpi: -0.0640, sgCpi: null, usdSgdChange: null },
  { year: 1931, usEquities: -0.4384, sgEquities: null, intlEquities: null, usBonds: -0.0256, reits: null, gold: null, cash: 0.0231, cpfBlended: 0.03, usCpi: -0.0932, sgCpi: null, usdSgdChange: null },
  { year: 1932, usEquities: -0.0864, sgEquities: null, intlEquities: null, usBonds: 0.0879, reits: null, gold: null, cash: 0.0107, cpfBlended: 0.03, usCpi: -0.1027, sgCpi: null, usdSgdChange: null },
  { year: 1933, usEquities: 0.4998, sgEquities: null, intlEquities: null, usBonds: 0.0186, reits: null, gold: null, cash: 0.0096, cpfBlended: 0.03, usCpi: 0.0076, sgCpi: null, usdSgdChange: null },
  { year: 1934, usEquities: -0.0119, sgEquities: null, intlEquities: null, usBonds: 0.0796, reits: null, gold: null, cash: 0.0032, cpfBlended: 0.03, usCpi: 0.0127, sgCpi: null, usdSgdChange: null },
  { year: 1935, usEquities: 0.4674, sgEquities: null, intlEquities: null, usBonds: 0.0447, reits: null, gold: null, cash: 0.0018, cpfBlended: 0.03, usCpi: 0.0299, sgCpi: null, usdSgdChange: null },
  { year: 1936, usEquities: 0.3194, sgEquities: null, intlEquities: null, usBonds: 0.0502, reits: null, gold: null, cash: 0.0017, cpfBlended: 0.03, usCpi: 0.0121, sgCpi: null, usdSgdChange: null },
  { year: 1937, usEquities: -0.3534, sgEquities: null, intlEquities: null, usBonds: 0.0138, reits: null, gold: null, cash: 0.0030, cpfBlended: 0.03, usCpi: 0.0310, sgCpi: null, usdSgdChange: null },
  { year: 1938, usEquities: 0.2928, sgEquities: null, intlEquities: null, usBonds: 0.0421, reits: null, gold: null, cash: 0.0008, cpfBlended: 0.03, usCpi: -0.0278, sgCpi: null, usdSgdChange: null },
  { year: 1939, usEquities: -0.0110, sgEquities: null, intlEquities: null, usBonds: 0.0441, reits: null, gold: null, cash: 0.0004, cpfBlended: 0.03, usCpi: -0.0048, sgCpi: null, usdSgdChange: null },
  // 1940-1949: WWII and post-war era
  { year: 1940, usEquities: -0.1067, sgEquities: null, intlEquities: null, usBonds: 0.0540, reits: null, gold: null, cash: 0.0003, cpfBlended: 0.03, usCpi: 0.0096, sgCpi: null, usdSgdChange: null },
  { year: 1941, usEquities: -0.1277, sgEquities: null, intlEquities: null, usBonds: -0.0202, reits: null, gold: null, cash: 0.0008, cpfBlended: 0.03, usCpi: 0.0993, sgCpi: null, usdSgdChange: null },
  { year: 1942, usEquities: 0.1917, sgEquities: null, intlEquities: null, usBonds: 0.0229, reits: null, gold: null, cash: 0.0034, cpfBlended: 0.03, usCpi: 0.0929, sgCpi: null, usdSgdChange: null },
  { year: 1943, usEquities: 0.2506, sgEquities: null, intlEquities: null, usBonds: 0.0249, reits: null, gold: null, cash: 0.0038, cpfBlended: 0.03, usCpi: 0.0316, sgCpi: null, usdSgdChange: null },
  { year: 1944, usEquities: 0.1903, sgEquities: null, intlEquities: null, usBonds: 0.0258, reits: null, gold: null, cash: 0.0038, cpfBlended: 0.03, usCpi: 0.0211, sgCpi: null, usdSgdChange: null },
  { year: 1945, usEquities: 0.3582, sgEquities: null, intlEquities: null, usBonds: 0.0380, reits: null, gold: null, cash: 0.0038, cpfBlended: 0.03, usCpi: 0.0225, sgCpi: null, usdSgdChange: null },
  { year: 1946, usEquities: -0.0843, sgEquities: null, intlEquities: null, usBonds: 0.0313, reits: null, gold: null, cash: 0.0038, cpfBlended: 0.03, usCpi: 0.1817, sgCpi: null, usdSgdChange: null },
  { year: 1947, usEquities: 0.0520, sgEquities: null, intlEquities: null, usBonds: 0.0092, reits: null, gold: null, cash: 0.0057, cpfBlended: 0.03, usCpi: 0.0888, sgCpi: null, usdSgdChange: null },
  { year: 1948, usEquities: 0.0570, sgEquities: null, intlEquities: null, usBonds: 0.0195, reits: null, gold: null, cash: 0.0102, cpfBlended: 0.03, usCpi: 0.0271, sgCpi: null, usdSgdChange: null },
  { year: 1949, usEquities: 0.1830, sgEquities: null, intlEquities: null, usBonds: 0.0466, reits: null, gold: null, cash: 0.0110, cpfBlended: 0.03, usCpi: -0.0180, sgCpi: null, usdSgdChange: null },
  // 1950-1959
  { year: 1950, usEquities: 0.3081, sgEquities: null, intlEquities: null, usBonds: 0.0043, reits: null, gold: null, cash: 0.0117, cpfBlended: 0.03, usCpi: 0.0579, sgCpi: null, usdSgdChange: null },
  { year: 1951, usEquities: 0.2368, sgEquities: null, intlEquities: null, usBonds: -0.0030, reits: null, gold: null, cash: 0.0148, cpfBlended: 0.03, usCpi: 0.0588, sgCpi: null, usdSgdChange: null },
  { year: 1952, usEquities: 0.1815, sgEquities: null, intlEquities: null, usBonds: 0.0227, reits: null, gold: null, cash: 0.0167, cpfBlended: 0.03, usCpi: 0.0114, sgCpi: null, usdSgdChange: null },
  { year: 1953, usEquities: -0.0121, sgEquities: null, intlEquities: null, usBonds: 0.0414, reits: null, gold: null, cash: 0.0189, cpfBlended: 0.03, usCpi: 0.0062, sgCpi: null, usdSgdChange: null },
  { year: 1954, usEquities: 0.5256, sgEquities: null, intlEquities: null, usBonds: 0.0329, reits: null, gold: null, cash: 0.0096, cpfBlended: 0.03, usCpi: -0.0050, sgCpi: null, usdSgdChange: null },
  { year: 1955, usEquities: 0.3260, sgEquities: null, intlEquities: null, usBonds: -0.0134, reits: null, gold: null, cash: 0.0166, cpfBlended: 0.03, usCpi: 0.0037, sgCpi: null, usdSgdChange: null },
  { year: 1956, usEquities: 0.0744, sgEquities: null, intlEquities: null, usBonds: -0.0226, reits: null, gold: null, cash: 0.0256, cpfBlended: 0.03, usCpi: 0.0286, sgCpi: null, usdSgdChange: null },
  { year: 1957, usEquities: -0.1046, sgEquities: null, intlEquities: null, usBonds: 0.0680, reits: null, gold: null, cash: 0.0323, cpfBlended: 0.03, usCpi: 0.0302, sgCpi: null, usdSgdChange: null },
  { year: 1958, usEquities: 0.4372, sgEquities: null, intlEquities: null, usBonds: -0.0210, reits: null, gold: null, cash: 0.0178, cpfBlended: 0.03, usCpi: 0.0176, sgCpi: null, usdSgdChange: null },
  { year: 1959, usEquities: 0.1206, sgEquities: null, intlEquities: null, usBonds: -0.0265, reits: null, gold: null, cash: 0.0326, cpfBlended: 0.03, usCpi: 0.0150, sgCpi: null, usdSgdChange: null },
  // 1960-1969: SG CPI starts 1961, Gold starts 1968
  { year: 1960, usEquities: 0.0034, sgEquities: null, intlEquities: null, usBonds: 0.1164, reits: null, gold: null, cash: 0.0305, cpfBlended: 0.03, usCpi: 0.0148, sgCpi: null, usdSgdChange: null },
  { year: 1961, usEquities: 0.2664, sgEquities: null, intlEquities: null, usBonds: 0.0206, reits: null, gold: null, cash: 0.0227, cpfBlended: 0.03, usCpi: 0.0067, sgCpi: 0.0040, usdSgdChange: null },
  { year: 1962, usEquities: -0.0881, sgEquities: null, intlEquities: null, usBonds: 0.0569, reits: null, gold: null, cash: 0.0278, cpfBlended: 0.03, usCpi: 0.0122, sgCpi: 0.0042, usdSgdChange: null },
  { year: 1963, usEquities: 0.2261, sgEquities: null, intlEquities: null, usBonds: 0.0168, reits: null, gold: null, cash: 0.0311, cpfBlended: 0.03, usCpi: 0.0165, sgCpi: 0.0221, usdSgdChange: null },
  { year: 1964, usEquities: 0.1642, sgEquities: null, intlEquities: null, usBonds: 0.0373, reits: null, gold: null, cash: 0.0351, cpfBlended: 0.03, usCpi: 0.0119, sgCpi: 0.0173, usdSgdChange: null },
  { year: 1965, usEquities: 0.1240, sgEquities: null, intlEquities: null, usBonds: 0.0072, reits: null, gold: null, cash: 0.0390, cpfBlended: 0.03, usCpi: 0.0192, sgCpi: 0.0018, usdSgdChange: null },
  { year: 1966, usEquities: -0.0997, sgEquities: null, intlEquities: null, usBonds: 0.0291, reits: null, gold: null, cash: 0.0484, cpfBlended: 0.03, usCpi: 0.0335, sgCpi: 0.0201, usdSgdChange: null },
  { year: 1967, usEquities: 0.2380, sgEquities: null, intlEquities: null, usBonds: -0.0158, reits: null, gold: null, cash: 0.0433, cpfBlended: 0.03, usCpi: 0.0304, sgCpi: 0.0334, usdSgdChange: null },
  { year: 1968, usEquities: 0.1081, sgEquities: null, intlEquities: null, usBonds: 0.0327, reits: null, gold: 0.2254, cash: 0.0526, cpfBlended: 0.03, usCpi: 0.0472, sgCpi: 0.0066, usdSgdChange: null },
  { year: 1969, usEquities: -0.0824, sgEquities: null, intlEquities: null, usBonds: -0.0501, reits: null, gold: -0.0575, cash: 0.0656, cpfBlended: 0.03, usCpi: 0.0611, sgCpi: -0.0027, usdSgdChange: null },
  // 1970-1979: Intl equities start 1970, REITs start 1972
  { year: 1970, usEquities: 0.0356, sgEquities: null, intlEquities: -0.0255, usBonds: 0.1675, reits: null, gold: -0.0512, cash: 0.0669, cpfBlended: 0.03, usCpi: 0.0549, sgCpi: 0.0046, usdSgdChange: null },
  { year: 1971, usEquities: 0.1422, sgEquities: null, intlEquities: 0.1956, usBonds: 0.0979, reits: null, gold: 0.1465, cash: 0.0454, cpfBlended: 0.03, usCpi: 0.0336, sgCpi: 0.0176, usdSgdChange: null },
  { year: 1972, usEquities: 0.1876, sgEquities: null, intlEquities: 0.2355, usBonds: 0.0282, reits: 0.0801, gold: 0.4314, cash: 0.0395, cpfBlended: 0.03, usCpi: 0.0341, sgCpi: 0.0208, usdSgdChange: null },
  { year: 1973, usEquities: -0.1431, sgEquities: null, intlEquities: -0.1451, usBonds: 0.0366, reits: -0.1552, gold: 0.6679, cash: 0.0673, cpfBlended: 0.03, usCpi: 0.0880, sgCpi: 0.1964, usdSgdChange: null },
  { year: 1974, usEquities: -0.2590, sgEquities: null, intlEquities: -0.2448, usBonds: 0.0199, reits: -0.2140, gold: 0.7259, cash: 0.0778, cpfBlended: 0.03, usCpi: 0.1220, sgCpi: 0.2237, usdSgdChange: null },
  { year: 1975, usEquities: 0.3700, sgEquities: null, intlEquities: 0.3450, usBonds: 0.0361, reits: 0.1930, gold: -0.2420, cash: 0.0599, cpfBlended: 0.03, usCpi: 0.0694, sgCpi: 0.0254, usdSgdChange: null },
  { year: 1976, usEquities: 0.2383, sgEquities: null, intlEquities: 0.1471, usBonds: 0.1598, reits: 0.4759, gold: -0.0396, cash: 0.0497, cpfBlended: 0.03, usCpi: 0.0486, sgCpi: -0.0184, usdSgdChange: null },
  { year: 1977, usEquities: -0.0698, sgEquities: null, intlEquities: 0.0200, usBonds: 0.0129, reits: 0.2242, gold: 0.2043, cash: 0.0513, cpfBlended: 0.03, usCpi: 0.0677, sgCpi: 0.0316, usdSgdChange: null },
  { year: 1978, usEquities: 0.0651, sgEquities: null, intlEquities: 0.1774, usBonds: -0.0078, reits: 0.1034, gold: 0.2917, cash: 0.0693, cpfBlended: 0.03, usCpi: 0.0903, sgCpi: 0.0487, usdSgdChange: null },
  { year: 1979, usEquities: 0.1852, sgEquities: null, intlEquities: 0.1159, usBonds: 0.0067, reits: 0.3586, gold: 1.2057, cash: 0.0994, cpfBlended: 0.03, usCpi: 0.1331, sgCpi: 0.0408, usdSgdChange: null },
  // 1980-1989: USD/SGD starts 1981, STI starts 1988
  { year: 1980, usEquities: 0.3174, sgEquities: null, intlEquities: 0.2806, usBonds: -0.0299, reits: 0.2437, gold: 0.2961, cash: 0.1122, cpfBlended: 0.03, usCpi: 0.1240, sgCpi: 0.0853, usdSgdChange: null },
  { year: 1981, usEquities: -0.0470, sgEquities: null, intlEquities: -0.0479, usBonds: 0.0820, reits: 0.0600, gold: -0.3276, cash: 0.1430, cpfBlended: 0.03, usCpi: 0.0894, sgCpi: 0.0818, usdSgdChange: -0.0154 },
  { year: 1982, usEquities: 0.2042, sgEquities: null, intlEquities: 0.1049, usBonds: 0.3281, reits: 0.2160, gold: 0.1175, cash: 0.1101, cpfBlended: 0.03, usCpi: 0.0387, sgCpi: 0.0392, usdSgdChange: 0.0168 },
  { year: 1983, usEquities: 0.2234, sgEquities: null, intlEquities: 0.2275, usBonds: 0.0320, reits: 0.3064, gold: -0.1499, cash: 0.0845, cpfBlended: 0.03, usCpi: 0.0380, sgCpi: 0.0120, usdSgdChange: -0.0157 },
  { year: 1984, usEquities: 0.0615, sgEquities: null, intlEquities: 0.0522, usBonds: 0.1373, reits: 0.2093, gold: -0.1895, cash: 0.0961, cpfBlended: 0.03, usCpi: 0.0395, sgCpi: 0.0260, usdSgdChange: 0.0199 },
  { year: 1985, usEquities: 0.3124, sgEquities: null, intlEquities: 0.4171, usBonds: 0.2571, reits: 0.1910, gold: 0.0617, cash: 0.0749, cpfBlended: 0.03, usCpi: 0.0377, sgCpi: 0.0048, usdSgdChange: 0.0341 },
  { year: 1986, usEquities: 0.1849, sgEquities: null, intlEquities: 0.4282, usBonds: 0.2428, reits: 0.1916, gold: 0.1954, cash: 0.0604, cpfBlended: 0.03, usCpi: 0.0113, sgCpi: -0.0139, usdSgdChange: -0.0186 },
  { year: 1987, usEquities: 0.0581, sgEquities: null, intlEquities: 0.1674, usBonds: -0.0496, reits: -0.0364, gold: 0.2446, cash: 0.0572, cpfBlended: 0.03, usCpi: 0.0441, sgCpi: 0.0052, usdSgdChange: -0.0329 },
  { year: 1988, usEquities: 0.1654, sgEquities: 0.2915, intlEquities: 0.2396, usBonds: 0.0822, reits: 0.1349, gold: -0.1569, cash: 0.0645, cpfBlended: 0.03, usCpi: 0.0442, sgCpi: 0.0152, usdSgdChange: -0.0398 },
  { year: 1989, usEquities: 0.3148, sgEquities: 0.4562, intlEquities: 0.1719, usBonds: 0.1769, reits: 0.0884, gold: -0.0223, cash: 0.0811, cpfBlended: 0.03, usCpi: 0.0465, sgCpi: 0.0235, usdSgdChange: -0.0355 },
  // 1990-1999: All columns now populated
  { year: 1990, usEquities: -0.0306, sgEquities: -0.1904, intlEquities: -0.1652, usBonds: 0.0624, reits: -0.1535, gold: -0.0369, cash: 0.0755, cpfBlended: 0.03, usCpi: 0.0611, sgCpi: 0.0346, usdSgdChange: -0.0727 },
  { year: 1991, usEquities: 0.3023, sgEquities: 0.3090, intlEquities: 0.1898, usBonds: 0.1500, reits: 0.3568, gold: -0.0856, cash: 0.0561, cpfBlended: 0.03, usCpi: 0.0306, sgCpi: 0.0343, usdSgdChange: -0.0403 },
  { year: 1992, usEquities: 0.0749, sgEquities: 0.0621, intlEquities: -0.0466, usBonds: 0.0936, reits: 0.1459, gold: -0.0571, cash: 0.0341, cpfBlended: 0.03, usCpi: 0.0290, sgCpi: 0.0226, usdSgdChange: -0.0598 },
  { year: 1993, usEquities: 0.0997, sgEquities: 0.6212, intlEquities: 0.2313, usBonds: 0.1421, reits: 0.1965, gold: 0.1764, cash: 0.0298, cpfBlended: 0.03, usCpi: 0.0275, sgCpi: 0.0229, usdSgdChange: -0.0125 },
  { year: 1994, usEquities: 0.0133, sgEquities: -0.0467, intlEquities: 0.0558, usBonds: -0.0804, reits: 0.0317, gold: -0.0217, cash: 0.0399, cpfBlended: 0.03, usCpi: 0.0267, sgCpi: 0.0310, usdSgdChange: -0.0459 },
  { year: 1995, usEquities: 0.3720, sgEquities: 0.0420, intlEquities: 0.2132, usBonds: 0.2348, reits: 0.1527, gold: 0.0098, cash: 0.0552, cpfBlended: 0.03, usCpi: 0.0254, sgCpi: 0.0172, usdSgdChange: -0.0810 },
  { year: 1996, usEquities: 0.2268, sgEquities: 0.0081, intlEquities: 0.1400, usBonds: 0.0143, reits: 0.3527, gold: -0.0465, cash: 0.0502, cpfBlended: 0.03, usCpi: 0.0332, sgCpi: 0.0138, usdSgdChange: -0.0035 },
  { year: 1997, usEquities: 0.3310, sgEquities: -0.2799, intlEquities: 0.1623, usBonds: 0.0994, reits: 0.2026, gold: -0.2221, cash: 0.0505, cpfBlended: 0.03, usCpi: 0.0170, sgCpi: 0.0200, usdSgdChange: 0.0579 },
  { year: 1998, usEquities: 0.2834, sgEquities: -0.0596, intlEquities: 0.2480, usBonds: 0.1492, reits: -0.1750, gold: 0.0057, cash: 0.0473, cpfBlended: 0.03, usCpi: 0.0155, sgCpi: -0.0027, usdSgdChange: 0.1214 },
  { year: 1999, usEquities: 0.2089, sgEquities: 0.8104, intlEquities: 0.2534, usBonds: -0.0825, reits: -0.0462, gold: 0.0054, cash: 0.0451, cpfBlended: 0.03, usCpi: 0.0268, sgCpi: 0.0002, usdSgdChange: 0.0175 },
  // 2000-2009: Dot-com crash, GFC
  { year: 2000, usEquities: -0.0903, sgEquities: -0.1929, intlEquities: -0.1292, usBonds: 0.1666, reits: 0.2637, gold: -0.0606, cash: 0.0576, cpfBlended: 0.03, usCpi: 0.0341, sgCpi: 0.0136, usdSgdChange: 0.0149 },
  { year: 2001, usEquities: -0.1185, sgEquities: -0.1274, intlEquities: -0.1652, usBonds: 0.0557, reits: 0.1393, gold: 0.0141, cash: 0.0367, cpfBlended: 0.03, usCpi: 0.0155, sgCpi: 0.0100, usdSgdChange: 0.0342 },
  { year: 2002, usEquities: -0.2197, sgEquities: -0.1440, intlEquities: -0.1954, usBonds: 0.1512, reits: 0.0382, gold: 0.2396, cash: 0.0166, cpfBlended: 0.03, usCpi: 0.0238, sgCpi: -0.0039, usdSgdChange: 0.0044 },
  { year: 2003, usEquities: 0.2836, sgEquities: 0.3458, intlEquities: 0.3376, usBonds: 0.0038, reits: 0.3713, gold: 0.2174, cash: 0.0103, cpfBlended: 0.03, usCpi: 0.0188, sgCpi: 0.0051, usdSgdChange: -0.0243 },
  { year: 2004, usEquities: 0.1074, sgEquities: 0.2009, intlEquities: 0.1525, usBonds: 0.0449, reits: 0.3158, gold: 0.0440, cash: 0.0123, cpfBlended: 0.03, usCpi: 0.0326, sgCpi: 0.0166, usdSgdChange: -0.0321 },
  { year: 2005, usEquities: 0.0483, sgEquities: 0.1661, intlEquities: 0.1002, usBonds: 0.0287, reits: 0.1216, gold: 0.1777, cash: 0.0301, cpfBlended: 0.03, usCpi: 0.0342, sgCpi: 0.0043, usdSgdChange: -0.0176 },
  { year: 2006, usEquities: 0.1561, sgEquities: 0.3020, intlEquities: 0.2065, usBonds: 0.0196, reits: 0.3506, gold: 0.2392, cash: 0.0468, cpfBlended: 0.03, usCpi: 0.0254, sgCpi: 0.0097, usdSgdChange: -0.0460 },
  { year: 2007, usEquities: 0.0548, sgEquities: 0.1963, intlEquities: 0.0957, usBonds: 0.1021, reits: -0.1569, gold: 0.3159, cash: 0.0464, cpfBlended: 0.03, usCpi: 0.0408, sgCpi: 0.0211, usdSgdChange: -0.0437 },
  { year: 2008, usEquities: -0.3655, sgEquities: -0.4641, intlEquities: -0.4033, usBonds: 0.2010, reits: -0.3773, gold: 0.0397, cash: 0.0159, cpfBlended: 0.03, usCpi: 0.0009, sgCpi: 0.0664, usdSgdChange: -0.0672 },
  { year: 2009, usEquities: 0.2594, sgEquities: 0.6749, intlEquities: 0.3079, usBonds: -0.1112, reits: 0.2799, gold: 0.2504, cash: 0.0014, cpfBlended: 0.03, usCpi: 0.0272, sgCpi: 0.0059, usdSgdChange: 0.0244 },
  // 2010-2019
  { year: 2010, usEquities: 0.1482, sgEquities: 0.1309, intlEquities: 0.1234, usBonds: 0.0846, reits: 0.2795, gold: 0.3060, cash: 0.0013, cpfBlended: 0.03, usCpi: 0.0164, sgCpi: 0.0283, usdSgdChange: -0.0573 },
  { year: 2011, usEquities: 0.0210, sgEquities: -0.1404, intlEquities: -0.0502, usBonds: 0.1604, reits: 0.0828, gold: 0.0780, cash: 0.0003, cpfBlended: 0.03, usCpi: 0.0300, sgCpi: 0.0525, usdSgdChange: -0.0817 },
  { year: 2012, usEquities: 0.1589, sgEquities: 0.2268, intlEquities: 0.1654, usBonds: 0.0297, reits: 0.1970, gold: 0.0869, cash: 0.0005, cpfBlended: 0.03, usCpi: 0.0177, sgCpi: 0.0458, usdSgdChange: -0.0020 },
  { year: 2013, usEquities: 0.3215, sgEquities: 0.0301, intlEquities: 0.2737, usBonds: -0.0910, reits: 0.0286, gold: -0.2761, cash: 0.0007, cpfBlended: 0.03, usCpi: 0.0150, sgCpi: 0.0236, usdSgdChange: -0.0033 },
  { year: 2014, usEquities: 0.1352, sgEquities: 0.0924, intlEquities: 0.0550, usBonds: 0.1075, reits: 0.2803, gold: -0.0044, cash: 0.0005, cpfBlended: 0.03, usCpi: 0.0076, sgCpi: 0.0103, usdSgdChange: 0.0114 },
  { year: 2015, usEquities: 0.0138, sgEquities: -0.1134, intlEquities: -0.0032, usBonds: 0.0128, reits: 0.0283, gold: -0.1161, cash: 0.0021, cpfBlended: 0.03, usCpi: 0.0073, sgCpi: -0.0052, usdSgdChange: 0.0862 },
  { year: 2016, usEquities: 0.1177, sgEquities: 0.0293, intlEquities: 0.0815, usBonds: 0.0069, reits: 0.0863, gold: 0.0862, cash: 0.0051, cpfBlended: 0.03, usCpi: 0.0207, sgCpi: -0.0053, usdSgdChange: 0.0062 },
  { year: 2017, usEquities: 0.2161, sgEquities: 0.2113, intlEquities: 0.2307, usBonds: 0.0280, reits: 0.0867, gold: 0.0954, cash: 0.0139, cpfBlended: 0.03, usCpi: 0.0211, sgCpi: 0.0058, usdSgdChange: -0.0004 },
  { year: 2018, usEquities: -0.0423, sgEquities: -0.0682, intlEquities: -0.0820, usBonds: -0.0002, reits: -0.0406, gold: -0.0106, cash: 0.0237, cpfBlended: 0.03, usCpi: 0.0191, sgCpi: 0.0044, usdSgdChange: -0.0196 },
  { year: 2019, usEquities: 0.3149, sgEquities: 0.0802, intlEquities: 0.2840, usBonds: 0.0964, reits: 0.2866, gold: 0.1828, cash: 0.0212, cpfBlended: 0.03, usCpi: 0.0229, sgCpi: 0.0057, usdSgdChange: 0.0077 },
  // 2020-2024
  { year: 2020, usEquities: 0.1840, sgEquities: -0.0876, intlEquities: 0.1650, usBonds: 0.1133, reits: -0.0512, gold: 0.2575, cash: 0.0031, cpfBlended: 0.03, usCpi: 0.0124, sgCpi: -0.0017, usdSgdChange: 0.0159 },
  { year: 2021, usEquities: 0.2871, sgEquities: 0.1284, intlEquities: 0.2235, usBonds: -0.0442, reits: 0.4131, gold: -0.0373, cash: 0.0005, cpfBlended: 0.03, usCpi: 0.0704, sgCpi: 0.0232, usdSgdChange: -0.0301 },
  { year: 2022, usEquities: -0.1811, sgEquities: 0.0709, intlEquities: -0.1773, usBonds: -0.1783, reits: -0.2489, gold: 0.0208, cash: 0.0150, cpfBlended: 0.03, usCpi: 0.0645, sgCpi: 0.0613, usdSgdChange: 0.0287 },
  { year: 2023, usEquities: 0.2629, sgEquities: 0.0266, intlEquities: 0.2442, usBonds: 0.0388, reits: 0.1136, gold: 0.1314, cash: 0.0526, cpfBlended: 0.03, usCpi: 0.0335, sgCpi: 0.0483, usdSgdChange: -0.0258 },
  { year: 2024, usEquities: 0.2502, sgEquities: 0.1989, intlEquities: 0.1919, usBonds: -0.0164, reits: 0.0495, gold: 0.2720, cash: 0.0526, cpfBlended: 0.03, usCpi: 0.0289, sgCpi: 0.0239, usdSgdChange: -0.0152 },
]

/** Asset class keys available in the historical data (excluding CPI/FX columns). */
export const ASSET_CLASS_COLUMNS = [
  'usEquities',
  'sgEquities',
  'intlEquities',
  'usBonds',
  'reits',
  'gold',
  'cash',
  'cpfBlended',
] as const

export type AssetClassColumn = (typeof ASSET_CLASS_COLUMNS)[number]

/** Maps ASSET_CLASSES key to HistoricalReturnRow column name.
 *  Used by bootstrap MC to index into historical data by allocation weight order. */
export const ASSET_KEY_TO_COLUMN: Record<string, keyof HistoricalReturnRow> = {
  usEquities: 'usEquities',
  sgEquities: 'sgEquities',
  intlEquities: 'intlEquities',
  bonds: 'usBonds',
  reits: 'reits',
  gold: 'gold',
  cash: 'cash',
  cpf: 'cpfBlended',
}

/** Year range of the full dataset. */
export const DATA_YEAR_RANGE = { start: 1928, end: 2024 } as const

/**
 * Get historical returns filtered to rows where all specified asset classes have data.
 * Useful for bootstrap MC which needs complete rows.
 */
export function getCompleteRows(
  columns: AssetClassColumn[]
): HistoricalReturnRow[] {
  return HISTORICAL_RETURNS.filter((row) =>
    columns.every((col) => row[col] !== null)
  )
}

/**
 * Extract a single column of non-null returns as a number array.
 * Useful for computing per-asset statistics.
 */
export function getColumnValues(column: AssetClassColumn): number[] {
  return HISTORICAL_RETURNS.filter((row) => row[column] !== null).map(
    (row) => row[column] as number
  )
}
