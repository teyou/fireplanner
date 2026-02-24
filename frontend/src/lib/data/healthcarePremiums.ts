// Healthcare Premium Data — Singapore
//
// MediShield Life premiums:
//   Source: CPF Board (https://www.cpf.gov.sg/member/healthcare-financing/medishield-life/medishield-life-premiums)
//   As of: 1 Apr 2025
//   License: Public data
//
// CareShield LIFE premiums:
//   Source: careshieldlife.gov.sg
//   As of: 2025
//   License: Public data
//
// Integrated Shield Plan (ISP) additional premiums:
//   Source: MOH ISP comparison table (https://www.moh.gov.sg/healthcare-schemes-subsidies/medishield-life/comparison-of-integrated-shield-plans)
//   As of: 2025
//   Note: Representative mid-range across insurers. Actual premiums vary by insurer and plan.
//
// MediSave Additional Withdrawal Limits (AWL):
//   Source: CPF Board (https://www.cpf.gov.sg/member/healthcare-financing/medisave)
//   As of: 2025
//   License: Public data

/**
 * MediSave Basic Healthcare Sum (BHS) — annual contribution limit.
 * Source: CPF Board (https://www.cpf.gov.sg/member/healthcare-financing/medisave)
 * As of: 2025
 */
export const MEDISAVE_BHS = 37740

/**
 * MediShield Life annual premiums by age bracket.
 * These are the base premiums before any subsidies.
 * Premiums are fully payable from MediSave.
 */
export const MEDISHIELD_LIFE_PREMIUMS: { minAge: number; maxAge: number; annual: number }[] = [
  { minAge: 0, maxAge: 20, annual: 130 },
  { minAge: 21, maxAge: 30, annual: 175 },
  { minAge: 31, maxAge: 40, annual: 310 },
  { minAge: 41, maxAge: 50, annual: 465 },
  { minAge: 51, maxAge: 60, annual: 710 },
  { minAge: 61, maxAge: 65, annual: 980 },
  { minAge: 66, maxAge: 70, annual: 1270 },
  { minAge: 71, maxAge: 73, annual: 1530 },
  { minAge: 74, maxAge: 78, annual: 1730 },
  { minAge: 79, maxAge: 83, annual: 1930 },
  { minAge: 84, maxAge: 88, annual: 2130 },
  { minAge: 89, maxAge: 93, annual: 2330 },
  { minAge: 94, maxAge: 120, annual: 2530 },
]

/**
 * Integrated Shield Plan additional premiums by tier and age bracket.
 * These are ADDITIONAL to MediShield Life (i.e. ISP rider cost).
 * Representative mid-range values across insurers.
 */
export type IspTier = 'none' | 'basic' | 'standard' | 'enhanced'

export const ISP_ADDITIONAL_PREMIUMS: Record<Exclude<IspTier, 'none'>, { minAge: number; maxAge: number; annual: number }[]> = {
  basic: [
    { minAge: 0, maxAge: 30, annual: 200 },
    { minAge: 31, maxAge: 40, annual: 350 },
    { minAge: 41, maxAge: 50, annual: 550 },
    { minAge: 51, maxAge: 60, annual: 900 },
    { minAge: 61, maxAge: 65, annual: 1400 },
    { minAge: 66, maxAge: 70, annual: 2000 },
    { minAge: 71, maxAge: 75, annual: 2700 },
    { minAge: 76, maxAge: 80, annual: 3400 },
    { minAge: 81, maxAge: 85, annual: 4200 },
    { minAge: 86, maxAge: 120, annual: 5000 },
  ],
  standard: [
    { minAge: 0, maxAge: 30, annual: 400 },
    { minAge: 31, maxAge: 40, annual: 650 },
    { minAge: 41, maxAge: 50, annual: 1000 },
    { minAge: 51, maxAge: 60, annual: 1700 },
    { minAge: 61, maxAge: 65, annual: 2600 },
    { minAge: 66, maxAge: 70, annual: 3800 },
    { minAge: 71, maxAge: 75, annual: 5200 },
    { minAge: 76, maxAge: 80, annual: 6800 },
    { minAge: 81, maxAge: 85, annual: 8500 },
    { minAge: 86, maxAge: 120, annual: 10000 },
  ],
  enhanced: [
    { minAge: 0, maxAge: 30, annual: 700 },
    { minAge: 31, maxAge: 40, annual: 1100 },
    { minAge: 41, maxAge: 50, annual: 1800 },
    { minAge: 51, maxAge: 60, annual: 3000 },
    { minAge: 61, maxAge: 65, annual: 4800 },
    { minAge: 66, maxAge: 70, annual: 7000 },
    { minAge: 71, maxAge: 75, annual: 9500 },
    { minAge: 76, maxAge: 80, annual: 12500 },
    { minAge: 81, maxAge: 85, annual: 16000 },
    { minAge: 86, maxAge: 120, annual: 19000 },
  ],
}

/**
 * CareShield LIFE annual premiums by age bracket.
 * CareShield LIFE provides basic long-term care insurance.
 * Premiums are paid from age 30 until age 67 (or until the policyholder
 * becomes severely disabled). After 67, no more premiums.
 */
export const CARESHIELD_LIFE_PREMIUMS: { minAge: number; maxAge: number; annual: number }[] = [
  { minAge: 30, maxAge: 35, annual: 210 },
  { minAge: 36, maxAge: 40, annual: 240 },
  { minAge: 41, maxAge: 45, annual: 290 },
  { minAge: 46, maxAge: 50, annual: 350 },
  { minAge: 51, maxAge: 55, annual: 430 },
  { minAge: 56, maxAge: 60, annual: 530 },
  { minAge: 61, maxAge: 67, annual: 650 },
  // No premiums after 67
]

/**
 * MediSave Additional Withdrawal Limits (AWL) for ISP premiums by age.
 * This is the maximum annual amount that can be withdrawn from MediSave
 * to pay for ISP premiums (on top of MediShield Life which is fully MediSave-payable).
 */
export const MEDISAVE_AWL: { minAge: number; maxAge: number; annual: number }[] = [
  { minAge: 0, maxAge: 40, annual: 300 },
  { minAge: 41, maxAge: 70, annual: 600 },
  { minAge: 71, maxAge: 80, annual: 900 },
  { minAge: 81, maxAge: 120, annual: 1200 },
]

/**
 * Look up a value from an age-bracket table.
 */
export function lookupByAge(
  table: { minAge: number; maxAge: number; annual: number }[],
  age: number,
): number {
  const bracket = table.find((b) => age >= b.minAge && age <= b.maxAge)
  return bracket?.annual ?? 0
}
