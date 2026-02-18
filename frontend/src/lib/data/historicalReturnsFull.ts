// Historical Returns Dataset for FIRE Planner (Synthetic Data)
// Generated: 2026-02-17
// Converted from: backend/app/data/historical_returns.csv
//
// Purpose: Realistic synthetic approximation of historical asset class returns
//          for Monte Carlo simulation, backtesting, and sequence risk analysis.
// License: Synthetic data for educational/planning purposes only — not actual market data.
//
// Sources (patterns approximated):
//   US Equities: Based on S&P 500 patterns (Damodaran NYU Stern methodology), 1928-2024
//   SG Equities (STI): Based on SGX Straits Times Index patterns, 1970-2024
//   Intl Equities: Based on MSCI World ex-US patterns, 1972-2024
//   US Bonds: Based on 10-year Treasury patterns (FRED methodology), 1928-2024
//   REITs: Based on FTSE NAREIT patterns, 1972-2024
//   Gold: Based on LBMA gold price patterns, 1968-2024
//   Cash: Based on 3-month T-Bill rates (FRED), 1928-2024
//   CPF: Singapore CPF blended OA+SA rate (constant 3%)
//   US CPI: US inflation (FRED patterns), 1928-2024
//   SG CPI: Singapore inflation (SingStat patterns), 1961-2024
//   USD/SGD Change: USD/SGD exchange rate annual change (MAS patterns), 1981-2024
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

export const HISTORICAL_RETURNS: HistoricalReturnRow[] = [
  { year: 1928, usEquities: 0.4361, sgEquities: null, intlEquities: null, usBonds: 0.0084, reits: null, gold: null, cash: 0.0356, cpfBlended: 0.03, usCpi: -0.0097, sgCpi: null, usdSgdChange: null },
  { year: 1929, usEquities: -0.0842, sgEquities: null, intlEquities: null, usBonds: 0.0442, reits: null, gold: null, cash: 0.0475, cpfBlended: 0.03, usCpi: -0.0020, sgCpi: null, usdSgdChange: null },
  { year: 1930, usEquities: -0.2512, sgEquities: null, intlEquities: null, usBonds: 0.0466, reits: null, gold: null, cash: 0.0241, cpfBlended: 0.03, usCpi: -0.0630, sgCpi: null, usdSgdChange: null },
  { year: 1931, usEquities: -0.4384, sgEquities: null, intlEquities: null, usBonds: 0.0207, reits: null, gold: null, cash: 0.0107, cpfBlended: 0.03, usCpi: -0.0930, sgCpi: null, usdSgdChange: null },
  { year: 1932, usEquities: -0.0864, sgEquities: null, intlEquities: null, usBonds: 0.0822, reits: null, gold: null, cash: 0.0088, cpfBlended: 0.03, usCpi: -0.1030, sgCpi: null, usdSgdChange: null },
  { year: 1933, usEquities: 0.4998, sgEquities: null, intlEquities: null, usBonds: 0.0138, reits: null, gold: null, cash: 0.0031, cpfBlended: 0.03, usCpi: 0.0051, sgCpi: null, usdSgdChange: null },
  { year: 1934, usEquities: 0.0219, sgEquities: null, intlEquities: null, usBonds: 0.0784, reits: null, gold: null, cash: 0.0016, cpfBlended: 0.03, usCpi: 0.0202, sgCpi: null, usdSgdChange: null },
  { year: 1935, usEquities: 0.4157, sgEquities: null, intlEquities: null, usBonds: 0.0445, reits: null, gold: null, cash: 0.0017, cpfBlended: 0.03, usCpi: 0.0299, sgCpi: null, usdSgdChange: null },
  { year: 1936, usEquities: 0.3112, sgEquities: null, intlEquities: null, usBonds: 0.0475, reits: null, gold: null, cash: 0.0018, cpfBlended: 0.03, usCpi: 0.0121, sgCpi: null, usdSgdChange: null },
  { year: 1937, usEquities: -0.3503, sgEquities: null, intlEquities: null, usBonds: 0.0123, reits: null, gold: null, cash: 0.0031, cpfBlended: 0.03, usCpi: 0.0290, sgCpi: null, usdSgdChange: null },
  { year: 1938, usEquities: 0.2928, sgEquities: null, intlEquities: null, usBonds: 0.0421, reits: null, gold: null, cash: 0.0032, cpfBlended: 0.03, usCpi: -0.0278, sgCpi: null, usdSgdChange: null },
  { year: 1939, usEquities: -0.0110, sgEquities: null, intlEquities: null, usBonds: 0.0445, reits: null, gold: null, cash: 0.0002, cpfBlended: 0.03, usCpi: 0.0000, sgCpi: null, usdSgdChange: null },
  { year: 1940, usEquities: -0.1067, sgEquities: null, intlEquities: null, usBonds: 0.0509, reits: null, gold: null, cash: 0.0000, cpfBlended: 0.03, usCpi: 0.0096, sgCpi: null, usdSgdChange: null },
  { year: 1941, usEquities: -0.1277, sgEquities: null, intlEquities: null, usBonds: 0.0047, reits: null, gold: null, cash: 0.0015, cpfBlended: 0.03, usCpi: 0.0996, sgCpi: null, usdSgdChange: null },
  { year: 1942, usEquities: 0.1917, sgEquities: null, intlEquities: null, usBonds: 0.0207, reits: null, gold: null, cash: 0.0027, cpfBlended: 0.03, usCpi: 0.0929, sgCpi: null, usdSgdChange: null },
  { year: 1943, usEquities: 0.2506, sgEquities: null, intlEquities: null, usBonds: 0.0200, reits: null, gold: null, cash: 0.0035, cpfBlended: 0.03, usCpi: 0.0318, sgCpi: null, usdSgdChange: null },
  { year: 1944, usEquities: 0.1903, sgEquities: null, intlEquities: null, usBonds: 0.0200, reits: null, gold: null, cash: 0.0038, cpfBlended: 0.03, usCpi: 0.0231, sgCpi: null, usdSgdChange: null },
  { year: 1945, usEquities: 0.3582, sgEquities: null, intlEquities: null, usBonds: 0.0337, reits: null, gold: null, cash: 0.0038, cpfBlended: 0.03, usCpi: 0.0225, sgCpi: null, usdSgdChange: null },
  { year: 1946, usEquities: -0.0843, sgEquities: null, intlEquities: null, usBonds: 0.0003, reits: null, gold: null, cash: 0.0038, cpfBlended: 0.03, usCpi: 0.1826, sgCpi: null, usdSgdChange: null },
  { year: 1947, usEquities: 0.0520, sgEquities: null, intlEquities: null, usBonds: 0.0000, reits: null, gold: null, cash: 0.0043, cpfBlended: 0.03, usCpi: 0.0901, sgCpi: null, usdSgdChange: null },
  { year: 1948, usEquities: 0.0550, sgEquities: null, intlEquities: null, usBonds: 0.0100, reits: null, gold: null, cash: 0.0081, cpfBlended: 0.03, usCpi: 0.0290, sgCpi: null, usdSgdChange: null },
  { year: 1949, usEquities: 0.1831, sgEquities: null, intlEquities: null, usBonds: 0.0445, reits: null, gold: null, cash: 0.0106, cpfBlended: 0.03, usCpi: -0.0180, sgCpi: null, usdSgdChange: null },
  { year: 1950, usEquities: 0.3081, sgEquities: null, intlEquities: null, usBonds: 0.0000, reits: null, gold: null, cash: 0.0112, cpfBlended: 0.03, usCpi: 0.0580, sgCpi: null, usdSgdChange: null },
  { year: 1951, usEquities: 0.2368, sgEquities: null, intlEquities: null, usBonds: 0.0039, reits: null, gold: null, cash: 0.0138, cpfBlended: 0.03, usCpi: 0.0587, sgCpi: null, usdSgdChange: null },
  { year: 1952, usEquities: 0.1815, sgEquities: null, intlEquities: null, usBonds: 0.0200, reits: null, gold: null, cash: 0.0164, cpfBlended: 0.03, usCpi: 0.0088, sgCpi: null, usdSgdChange: null },
  { year: 1953, usEquities: -0.0099, sgEquities: null, intlEquities: null, usBonds: 0.0200, reits: null, gold: null, cash: 0.0182, cpfBlended: 0.03, usCpi: 0.0062, sgCpi: null, usdSgdChange: null },
  { year: 1954, usEquities: 0.5256, sgEquities: null, intlEquities: null, usBonds: 0.0300, reits: null, gold: null, cash: 0.0195, cpfBlended: 0.03, usCpi: -0.0050, sgCpi: null, usdSgdChange: null },
  { year: 1955, usEquities: 0.3260, sgEquities: null, intlEquities: null, usBonds: 0.0000, reits: null, gold: null, cash: 0.0220, cpfBlended: 0.03, usCpi: 0.0037, sgCpi: null, usdSgdChange: null },
  { year: 1956, usEquities: 0.0744, sgEquities: null, intlEquities: null, usBonds: 0.0200, reits: null, gold: null, cash: 0.0248, cpfBlended: 0.03, usCpi: 0.0286, sgCpi: null, usdSgdChange: null },
  { year: 1957, usEquities: -0.1057, sgEquities: null, intlEquities: null, usBonds: 0.0600, reits: null, gold: null, cash: 0.0281, cpfBlended: 0.03, usCpi: 0.0302, sgCpi: null, usdSgdChange: null },
  { year: 1958, usEquities: 0.4336, sgEquities: null, intlEquities: null, usBonds: 0.0200, reits: null, gold: null, cash: 0.0331, cpfBlended: 0.03, usCpi: 0.0176, sgCpi: null, usdSgdChange: null },
  { year: 1959, usEquities: 0.1195, sgEquities: null, intlEquities: null, usBonds: 0.0200, reits: null, gold: null, cash: 0.0359, cpfBlended: 0.03, usCpi: 0.0150, sgCpi: null, usdSgdChange: null },
  { year: 1960, usEquities: 0.0047, sgEquities: null, intlEquities: null, usBonds: 0.0900, reits: null, gold: null, cash: 0.0369, cpfBlended: 0.03, usCpi: 0.0148, sgCpi: null, usdSgdChange: null },
  { year: 1961, usEquities: 0.2689, sgEquities: null, intlEquities: null, usBonds: -0.0200, reits: null, gold: null, cash: 0.0238, cpfBlended: 0.03, usCpi: 0.0067, sgCpi: 0.0210, usdSgdChange: null },
  { year: 1962, usEquities: -0.0873, sgEquities: null, intlEquities: null, usBonds: -0.0200, reits: null, gold: null, cash: 0.0273, cpfBlended: 0.03, usCpi: 0.0122, sgCpi: 0.0180, usdSgdChange: null },
  { year: 1963, usEquities: 0.2280, sgEquities: null, intlEquities: null, usBonds: 0.0000, reits: null, gold: null, cash: 0.0312, cpfBlended: 0.03, usCpi: 0.0165, sgCpi: 0.0175, usdSgdChange: null },
  { year: 1964, usEquities: 0.1648, sgEquities: null, intlEquities: null, usBonds: 0.0300, reits: null, gold: null, cash: 0.0350, cpfBlended: 0.03, usCpi: 0.0119, sgCpi: 0.0165, usdSgdChange: null },
  { year: 1965, usEquities: 0.1245, sgEquities: null, intlEquities: null, usBonds: 0.0000, reits: null, gold: null, cash: 0.0373, cpfBlended: 0.03, usCpi: 0.0192, sgCpi: 0.0155, usdSgdChange: null },
  { year: 1966, usEquities: -0.1006, sgEquities: null, intlEquities: null, usBonds: 0.0200, reits: null, gold: null, cash: 0.0406, cpfBlended: 0.03, usCpi: 0.0335, sgCpi: 0.0145, usdSgdChange: null },
  { year: 1967, usEquities: 0.2398, sgEquities: null, intlEquities: null, usBonds: 0.0700, reits: null, gold: null, cash: 0.0453, cpfBlended: 0.03, usCpi: 0.0304, sgCpi: 0.0125, usdSgdChange: null },
  { year: 1968, usEquities: 0.1106, sgEquities: null, intlEquities: null, usBonds: 0.0300, reits: null, gold: 0.0580, cash: 0.0521, cpfBlended: 0.03, usCpi: 0.0472, sgCpi: 0.0115, usdSgdChange: null },
  { year: 1969, usEquities: -0.0850, sgEquities: null, intlEquities: null, usBonds: 0.0500, reits: null, gold: 0.0820, cash: 0.0666, cpfBlended: 0.03, usCpi: 0.0611, sgCpi: 0.0105, usdSgdChange: null },
  { year: 1970, usEquities: 0.0401, sgEquities: 0.0823, intlEquities: null, usBonds: 0.1200, reits: null, gold: 0.0730, cash: 0.0649, cpfBlended: 0.03, usCpi: 0.0549, sgCpi: 0.0095, usdSgdChange: null },
  { year: 1971, usEquities: 0.1431, sgEquities: 0.0945, intlEquities: null, usBonds: 0.0900, reits: null, gold: 0.1315, cash: 0.0439, cpfBlended: 0.03, usCpi: 0.0336, sgCpi: 0.0085, usdSgdChange: null },
  { year: 1972, usEquities: 0.1898, sgEquities: 0.1234, intlEquities: 0.1856, usBonds: 0.0200, reits: 0.0678, gold: 0.4385, cash: 0.0384, cpfBlended: 0.03, usCpi: 0.0341, sgCpi: 0.0075, usdSgdChange: null },
  { year: 1973, usEquities: -0.1466, sgEquities: -0.0823, intlEquities: -0.1456, usBonds: 0.0300, reits: 0.1576, gold: -0.1185, cash: 0.0693, cpfBlended: 0.03, usCpi: 0.0880, sgCpi: 0.2650, usdSgdChange: null },
  { year: 1974, usEquities: -0.2647, sgEquities: -0.1534, intlEquities: -0.2318, usBonds: 0.0200, reits: -0.2178, gold: -0.2445, cash: 0.0800, cpfBlended: 0.03, usCpi: 0.1220, sgCpi: 0.2235, usdSgdChange: null },
  { year: 1975, usEquities: 0.3723, sgEquities: 0.0456, intlEquities: 0.3512, usBonds: 0.0300, reits: 0.1975, gold: 0.2415, cash: 0.0580, cpfBlended: 0.03, usCpi: 0.0694, sgCpi: 0.0285, usdSgdChange: null },
  { year: 1976, usEquities: 0.2384, sgEquities: 0.0623, intlEquities: 0.0245, usBonds: 0.1100, reits: 0.4678, gold: -0.0425, cash: 0.0508, cpfBlended: 0.03, usCpi: 0.0486, sgCpi: 0.0245, usdSgdChange: null },
  { year: 1977, usEquities: -0.0718, sgEquities: -0.0234, intlEquities: -0.0256, usBonds: 0.0100, reits: 0.2245, gold: 0.2245, cash: 0.0514, cpfBlended: 0.03, usCpi: 0.0677, sgCpi: 0.0315, usdSgdChange: null },
  { year: 1978, usEquities: 0.0656, sgEquities: 0.0834, intlEquities: 0.1223, usBonds: 0.0000, reits: 0.0923, gold: 0.3715, cash: 0.0718, cpfBlended: 0.03, usCpi: 0.0903, sgCpi: 0.0485, usdSgdChange: null },
  { year: 1979, usEquities: 0.1844, sgEquities: 0.1245, intlEquities: 0.0534, usBonds: -0.0400, reits: 0.3578, gold: 0.1285, cash: 0.1038, cpfBlended: 0.03, usCpi: 0.1331, sgCpi: 0.0385, usdSgdChange: null },
  { year: 1980, usEquities: 0.3242, sgEquities: 0.2156, intlEquities: 0.2378, usBonds: -0.0300, reits: 0.2478, gold: 0.1245, cash: 0.1124, cpfBlended: 0.03, usCpi: 0.1240, sgCpi: 0.0855, usdSgdChange: null },
  { year: 1981, usEquities: -0.0491, sgEquities: -0.0345, intlEquities: 0.0245, usBonds: 0.0200, reits: 0.0656, gold: 0.0945, cash: 0.1471, cpfBlended: 0.03, usCpi: 0.0894, sgCpi: 0.0405, usdSgdChange: 0.0000 },
  { year: 1982, usEquities: 0.2155, sgEquities: 0.0823, intlEquities: 0.0856, usBonds: 0.3200, reits: 0.2123, gold: 0.0845, cash: 0.1054, cpfBlended: 0.03, usCpi: 0.0387, sgCpi: 0.0385, usdSgdChange: 0.0245 },
  { year: 1983, usEquities: 0.2256, sgEquities: 0.1456, intlEquities: 0.2234, usBonds: 0.0200, reits: 0.3045, gold: 0.0456, cash: 0.0880, cpfBlended: 0.03, usCpi: 0.0380, sgCpi: 0.0125, usdSgdChange: 0.0185 },
  { year: 1984, usEquities: 0.0627, sgEquities: 0.0245, intlEquities: -0.0523, usBonds: 0.1300, reits: 0.2078, gold: -0.0234, cash: 0.0985, cpfBlended: 0.03, usCpi: 0.0395, sgCpi: 0.0275, usdSgdChange: -0.0125 },
  { year: 1985, usEquities: 0.3216, sgEquities: 0.0534, intlEquities: 0.5623, usBonds: 0.2500, reits: 0.1923, gold: 0.0123, cash: 0.0772, cpfBlended: 0.03, usCpi: 0.0328, sgCpi: 0.0065, usdSgdChange: -0.0245 },
  { year: 1986, usEquities: 0.1847, sgEquities: 0.0923, intlEquities: 0.6923, usBonds: 0.1500, reits: 0.1934, gold: 0.2134, cash: 0.0616, cpfBlended: 0.03, usCpi: 0.0113, sgCpi: 0.0135, usdSgdChange: 0.0856 },
  { year: 1987, usEquities: 0.0523, sgEquities: 0.0123, intlEquities: 0.1645, usBonds: 0.0000, reits: 0.0045, gold: -0.2145, cash: 0.0547, cpfBlended: 0.03, usCpi: 0.0444, sgCpi: 0.0055, usdSgdChange: -0.0534 },
  { year: 1988, usEquities: 0.1661, sgEquities: 0.1834, intlEquities: 0.2334, usBonds: 0.0600, reits: 0.1378, gold: 0.0623, cash: 0.0635, cpfBlended: 0.03, usCpi: 0.0442, sgCpi: 0.0175, usdSgdChange: -0.0185 },
  { year: 1989, usEquities: 0.3169, sgEquities: 0.3823, intlEquities: 0.1078, usBonds: 0.1400, reits: 0.0923, gold: 0.0323, cash: 0.0837, cpfBlended: 0.03, usCpi: 0.0465, sgCpi: 0.0235, usdSgdChange: -0.0075 },
  { year: 1990, usEquities: -0.0310, sgEquities: -0.0823, intlEquities: -0.1678, usBonds: 0.0700, reits: 0.1534, gold: -0.0445, cash: 0.0781, cpfBlended: 0.03, usCpi: 0.0611, sgCpi: 0.0355, usdSgdChange: 0.0365 },
  { year: 1991, usEquities: 0.3047, sgEquities: 0.1456, intlEquities: 0.1923, usBonds: 0.1500, reits: 0.3534, gold: 0.0534, cash: 0.0556, cpfBlended: 0.03, usCpi: 0.0306, sgCpi: 0.0345, usdSgdChange: -0.0285 },
  { year: 1992, usEquities: 0.0762, sgEquities: 0.0623, intlEquities: 0.0456, usBonds: 0.0600, reits: 0.1645, gold: 0.0245, cash: 0.0351, cpfBlended: 0.03, usCpi: 0.0290, sgCpi: 0.0285, usdSgdChange: -0.0145 },
  { year: 1993, usEquities: 0.1008, sgEquities: 0.4923, intlEquities: 0.2234, usBonds: 0.1100, reits: 0.1923, gold: 0.1823, cash: 0.0290, cpfBlended: 0.03, usCpi: 0.0275, sgCpi: 0.0235, usdSgdChange: -0.0385 },
  { year: 1994, usEquities: 0.0132, sgEquities: -0.1234, intlEquities: -0.0534, usBonds: -0.0800, reits: 0.0356, gold: -0.0234, cash: 0.0390, cpfBlended: 0.03, usCpi: 0.0267, sgCpi: 0.0345, usdSgdChange: 0.0456 },
  { year: 1995, usEquities: 0.3758, sgEquities: 0.0234, intlEquities: 0.1156, usBonds: 0.1800, reits: 0.1823, gold: 0.0345, cash: 0.0560, cpfBlended: 0.03, usCpi: 0.0254, sgCpi: 0.0185, usdSgdChange: -0.0234 },
  { year: 1996, usEquities: 0.2296, sgEquities: 0.0456, intlEquities: 0.0623, usBonds: 0.0000, reits: 0.3534, gold: 0.0123, cash: 0.0521, cpfBlended: 0.03, usCpi: 0.0332, sgCpi: 0.0145, usdSgdChange: -0.0123 },
  { year: 1997, usEquities: 0.3336, sgEquities: -0.3534, intlEquities: 0.1545, usBonds: -0.0100, reits: 0.1834, gold: 0.0323, cash: 0.0519, cpfBlended: 0.03, usCpi: 0.0170, sgCpi: 0.0235, usdSgdChange: 0.1856 },
  { year: 1998, usEquities: 0.2858, sgEquities: -0.0823, intlEquities: 0.2234, usBonds: 0.1200, reits: 0.0456, gold: 0.0145, cash: 0.0486, cpfBlended: 0.03, usCpi: 0.0155, sgCpi: 0.0005, usdSgdChange: 0.0623 },
  { year: 1999, usEquities: 0.2104, sgEquities: 0.3756, intlEquities: 0.2678, usBonds: 0.0000, reits: 0.0245, gold: 0.0056, cash: 0.0448, cpfBlended: 0.03, usCpi: 0.0268, sgCpi: 0.0000, usdSgdChange: -0.0185 },
  { year: 2000, usEquities: -0.0910, sgEquities: -0.2145, intlEquities: -0.1234, usBonds: 0.1600, reits: -0.0534, gold: -0.0345, cash: 0.0598, cpfBlended: 0.03, usCpi: 0.0341, sgCpi: 0.0135, usdSgdChange: 0.0956 },
  { year: 2001, usEquities: -0.1189, sgEquities: -0.1823, intlEquities: -0.1645, usBonds: 0.0400, reits: -0.1534, gold: 0.0245, cash: 0.0333, cpfBlended: 0.03, usCpi: 0.0155, sgCpi: 0.0105, usdSgdChange: 0.0534 },
  { year: 2002, usEquities: -0.2210, sgEquities: -0.0623, intlEquities: -0.1956, usBonds: 0.1400, reits: -0.0823, gold: 0.2456, cash: 0.0165, cpfBlended: 0.03, usCpi: 0.0238, sgCpi: 0.0045, usdSgdChange: -0.0623 },
  { year: 2003, usEquities: 0.2869, sgEquities: 0.2834, intlEquities: 0.3334, usBonds: 0.0000, reits: 0.3723, gold: 0.1934, cash: 0.0094, cpfBlended: 0.03, usCpi: 0.0188, sgCpi: 0.0055, usdSgdChange: -0.0745 },
  { year: 2004, usEquities: 0.1088, sgEquities: 0.1523, intlEquities: 0.2023, usBonds: 0.0300, reits: 0.3145, gold: 0.0523, cash: 0.0114, cpfBlended: 0.03, usCpi: 0.0326, sgCpi: 0.0175, usdSgdChange: -0.0423 },
  { year: 2005, usEquities: 0.0491, sgEquities: 0.0645, intlEquities: 0.1356, usBonds: 0.0200, reits: 0.1234, gold: 0.1823, cash: 0.0298, cpfBlended: 0.03, usCpi: 0.0346, sgCpi: 0.0055, usdSgdChange: 0.0334 },
  { year: 2006, usEquities: 0.1579, sgEquities: 0.2734, intlEquities: 0.2656, usBonds: 0.0100, reits: 0.3423, gold: 0.2245, cash: 0.0480, cpfBlended: 0.03, usCpi: 0.0254, sgCpi: 0.0105, usdSgdChange: -0.0285 },
  { year: 2007, usEquities: 0.0549, sgEquities: 0.2045, intlEquities: 0.1123, usBonds: 0.0800, reits: 0.1534, gold: -0.0834, cash: 0.0463, cpfBlended: 0.03, usCpi: 0.0407, sgCpi: 0.0235, usdSgdChange: 0.0556 },
  { year: 2008, usEquities: -0.3700, sgEquities: -0.4956, intlEquities: -0.4023, usBonds: 0.2000, reits: -0.3834, gold: 0.0534, cash: 0.0142, cpfBlended: 0.03, usCpi: 0.0009, sgCpi: 0.0645, usdSgdChange: 0.1334 },
  { year: 2009, usEquities: 0.2646, sgEquities: 0.7534, intlEquities: 0.2978, usBonds: 0.0000, reits: 0.2756, gold: 0.2345, cash: 0.0010, cpfBlended: 0.03, usCpi: 0.0272, sgCpi: 0.0065, usdSgdChange: -0.0956 },
  { year: 2010, usEquities: 0.1506, sgEquities: 0.1023, intlEquities: 0.0823, usBonds: 0.0600, reits: 0.2678, gold: 0.2923, cash: 0.0012, cpfBlended: 0.03, usCpi: 0.0164, sgCpi: 0.0285, usdSgdChange: -0.0545 },
  { year: 2011, usEquities: 0.0211, sgEquities: 0.1534, intlEquities: 0.0545, usBonds: 0.1600, reits: 0.0823, gold: 0.1023, cash: 0.0003, cpfBlended: 0.03, usCpi: 0.0300, sgCpi: 0.0545, usdSgdChange: 0.0734 },
  { year: 2012, usEquities: 0.1600, sgEquities: 0.2334, intlEquities: 0.1656, usBonds: 0.0200, reits: 0.1934, gold: 0.0734, cash: 0.0005, cpfBlended: 0.03, usCpi: 0.0177, sgCpi: 0.0455, usdSgdChange: -0.0623 },
  { year: 2013, usEquities: 0.3239, sgEquities: 0.0245, intlEquities: 0.2256, usBonds: 0.0000, reits: 0.0234, gold: -0.2834, cash: 0.0002, cpfBlended: 0.03, usCpi: 0.0150, sgCpi: 0.0245, usdSgdChange: -0.0456 },
  { year: 2014, usEquities: 0.1369, sgEquities: 0.0534, intlEquities: 0.0456, usBonds: 0.1000, reits: 0.2823, gold: 0.0123, cash: 0.0002, cpfBlended: 0.03, usCpi: 0.0076, sgCpi: 0.0105, usdSgdChange: 0.0523 },
  { year: 2015, usEquities: 0.0138, sgEquities: -0.1456, intlEquities: 0.0234, usBonds: 0.0100, reits: 0.0256, gold: -0.1045, cash: 0.0002, cpfBlended: 0.03, usCpi: 0.0007, sgCpi: 0.0055, usdSgdChange: -0.0285 },
  { year: 2016, usEquities: 0.1196, sgEquities: 0.0023, intlEquities: 0.0734, usBonds: 0.0000, reits: 0.0845, gold: 0.0823, cash: 0.0020, cpfBlended: 0.03, usCpi: 0.0213, sgCpi: 0.0055, usdSgdChange: 0.0634 },
  { year: 2017, usEquities: 0.2183, sgEquities: 0.1834, intlEquities: 0.2534, usBonds: 0.0200, reits: 0.0456, gold: 0.1334, cash: 0.0069, cpfBlended: 0.03, usCpi: 0.0221, sgCpi: 0.0065, usdSgdChange: -0.0745 },
  { year: 2018, usEquities: -0.0438, sgEquities: -0.0834, intlEquities: -0.0823, usBonds: 0.0000, reits: 0.0123, gold: 0.0145, cash: 0.0181, cpfBlended: 0.03, usCpi: 0.0190, sgCpi: 0.0065, usdSgdChange: 0.0956 },
  { year: 2019, usEquities: 0.3157, sgEquities: 0.0745, intlEquities: 0.2756, usBonds: 0.0800, reits: 0.2534, gold: 0.1823, cash: 0.0215, cpfBlended: 0.03, usCpi: 0.0181, sgCpi: 0.0065, usdSgdChange: -0.0234 },
  { year: 2020, usEquities: 0.1840, sgEquities: 0.0456, intlEquities: 0.1534, usBonds: 0.0800, reits: 0.0823, gold: 0.2523, cash: 0.0038, cpfBlended: 0.03, usCpi: 0.0123, sgCpi: 0.0015, usdSgdChange: -0.0634 },
  { year: 2021, usEquities: 0.2889, sgEquities: 0.0923, intlEquities: 0.2134, usBonds: 0.0000, reits: 0.4123, gold: 0.0134, cash: 0.0004, cpfBlended: 0.03, usCpi: 0.0703, sgCpi: 0.0245, usdSgdChange: -0.0345 },
  { year: 2022, usEquities: -0.1811, sgEquities: -0.1234, intlEquities: -0.1756, usBonds: 0.1200, reits: -0.2534, gold: 0.0034, cash: 0.0142, cpfBlended: 0.03, usCpi: 0.0650, sgCpi: 0.0615, usdSgdChange: 0.0734 },
  { year: 2023, usEquities: 0.2638, sgEquities: 0.0534, intlEquities: 0.1856, usBonds: 0.0000, reits: 0.1134, gold: 0.1345, cash: 0.0463, cpfBlended: 0.03, usCpi: 0.0326, sgCpi: 0.0475, usdSgdChange: -0.0423 },
  { year: 2024, usEquities: 0.2512, sgEquities: 0.0834, intlEquities: 0.1745, usBonds: 0.0100, reits: 0.1023, gold: 0.2756, cash: 0.0476, cpfBlended: 0.03, usCpi: 0.0279, sgCpi: 0.0255, usdSgdChange: 0.0185 },
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
