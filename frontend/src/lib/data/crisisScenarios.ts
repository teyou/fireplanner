/**
 * 8 historical crisis scenarios for sequence risk analysis.
 * Each scenario defines equity return sequences during the crisis period
 * and recovery, used to stress-test withdrawal strategies.
 *
 * Sources: Damodaran (NYU Stern), FRED, SGX, MSCI.
 */

import type { CrisisScenario } from '@/lib/types'

export const CRISIS_SCENARIOS: CrisisScenario[] = [
  {
    id: 'great_depression',
    name: 'Great Depression',
    region: 'US',
    startYear: 1929,
    peakDrawdown: -0.86,
    durationYears: 3,
    recoveryYears: 15,
    equityReturnSequence: [-0.086, -0.249, -0.434, -0.085, 0.540, -0.013, 0.476, 0.338, -0.351, -0.011, -0.014, -0.100, 0.199, 0.258, 0.367],
    description: 'The worst market crash in US history. S&P 500 fell 86% from peak to trough over 3 years, taking 15 years to recover to 1929 levels.',
  },
  {
    id: 'oil_crisis',
    name: '1973 Oil Crisis',
    region: 'US',
    startYear: 1973,
    peakDrawdown: -0.48,
    durationYears: 2,
    recoveryYears: 7,
    equityReturnSequence: [-0.147, -0.265, 0.372, 0.239, -0.072, 0.066, 0.185, 0.324, -0.049],
    description: 'OPEC oil embargo triggered stagflation. Stocks fell 48% while inflation surged above 10%, creating a nightmare scenario for retirees.',
  },
  {
    id: 'asian_financial',
    name: 'Asian Financial Crisis',
    region: 'SG',
    startYear: 1997,
    peakDrawdown: -0.61,
    durationYears: 2,
    recoveryYears: 5,
    equityReturnSequence: [-0.287, -0.096, 0.660, -0.157, -0.117, 0.225, 0.319],
    description: 'Currency crisis spread across Southeast Asia. STI fell 61% as capital fled the region. Singapore recovered faster than regional peers.',
  },
  {
    id: 'dotcom',
    name: 'Dot-Com Crash',
    region: 'US',
    startYear: 2000,
    peakDrawdown: -0.49,
    durationYears: 3,
    recoveryYears: 7,
    equityReturnSequence: [-0.091, -0.119, -0.221, 0.287, 0.109, 0.049, 0.158, 0.055, -0.370],
    description: 'Technology bubble burst. S&P 500 fell 49% over 3 years. Many retirees who started withdrawing in 2000 faced devastating sequence risk.',
  },
  {
    id: 'gfc',
    name: 'Global Financial Crisis',
    region: 'US',
    startYear: 2007,
    peakDrawdown: -0.57,
    durationYears: 2,
    recoveryYears: 5,
    equityReturnSequence: [0.055, -0.370, 0.265, 0.151, 0.021, 0.160, 0.324],
    description: 'Subprime mortgage crisis triggered global banking collapse. S&P 500 fell 57%. Aggressive fiscal/monetary response led to faster recovery.',
  },
  {
    id: 'covid',
    name: 'COVID-19 Crash',
    region: 'US',
    startYear: 2020,
    peakDrawdown: -0.34,
    durationYears: 1,
    recoveryYears: 1,
    equityReturnSequence: [-0.125, 0.285, -0.182, 0.264],
    description: 'Fastest 30%+ drawdown in history (23 trading days). Unprecedented monetary stimulus drove the fastest recovery in history.',
  },
  {
    id: 'japan_lost_decade',
    name: 'Japan Lost Decade',
    region: 'Intl',
    startYear: 1990,
    peakDrawdown: -0.82,
    durationYears: 10,
    recoveryYears: 30,
    equityReturnSequence: [-0.383, -0.038, -0.213, 0.025, 0.134, 0.004, -0.068, -0.218, -0.071, 0.617, -0.234, -0.191, -0.182, 0.244, 0.075],
    description: 'Nikkei 225 fell 82% from 1990 peak and has never fully recovered in real terms. A cautionary tale of prolonged stagnation.',
  },
  {
    id: 'sg_property_crash',
    name: 'SG Property Crash (1996)',
    region: 'SG',
    startYear: 1996,
    peakDrawdown: -0.45,
    durationYears: 3,
    recoveryYears: 11,
    equityReturnSequence: [-0.019, -0.287, -0.096, 0.660, -0.157, -0.117, 0.225, 0.319, 0.168, 0.222, -0.076],
    description: 'Property prices crashed 45% after government cooling measures and Asian Financial Crisis. URA PPI did not recover until 2007.',
  },
]
