import { z } from 'zod'

// ============================================================
// Field-level schemas (for per-field validation in stores)
// ============================================================

export const ageSchema = z.number().int().min(18).max(100)
export const retirementAgeSchema = z.number().int().min(30).max(100)
export const lifeExpectancySchema = z.number().int().min(50).max(120)
export const swrSchema = z.number().min(0.01).max(0.10)
export const expensesSchema = z.number().positive()
export const inflationSchema = z.number().min(0).max(0.15)
export const expenseRatioSchema = z.number().min(0).max(0.03)
export const returnSchema = z.number().min(-0.10).max(0.30)
export const nonNegativeSchema = z.number().min(0)
export const salaryGrowthSchema = z.number().min(-0.10).max(0.30)

// ============================================================
// Profile Schema
// ============================================================

export const profileSchema = z.object({
  currentAge: ageSchema,
  retirementAge: retirementAgeSchema,
  lifeExpectancy: lifeExpectancySchema,
  lifeStage: z.enum(['pre-fire', 'post-fire']),
  maritalStatus: z.enum(['single', 'married']),
  residencyStatus: z.enum(['citizen', 'pr', 'foreigner']),

  annualIncome: nonNegativeSchema,
  annualExpenses: expensesSchema,
  liquidNetWorth: z.number(),
  cpfOA: nonNegativeSchema,
  cpfSA: nonNegativeSchema,
  cpfMA: nonNegativeSchema,
  srsBalance: nonNegativeSchema,
  srsAnnualContribution: nonNegativeSchema,

  fireType: z.enum(['regular', 'lean', 'fat', 'coast', 'barista']),
  swr: swrSchema,

  expectedReturn: returnSchema,
  inflation: inflationSchema,
  expenseRatio: expenseRatioSchema,
  rebalanceFrequency: z.enum(['annual', 'semi-annual', 'quarterly']),
}).refine(
  (data) => data.retirementAge > data.currentAge,
  { message: 'Retirement age must be greater than current age', path: ['retirementAge'] }
).refine(
  (data) => data.lifeExpectancy > data.retirementAge,
  { message: 'Life expectancy must be greater than retirement age', path: ['lifeExpectancy'] }
)

// ============================================================
// Income Schema
// ============================================================

export const momAdjustmentSchema = z.number().min(0.1).max(3.0)
export const personalReliefsSchema = z.number().min(0).max(200000)
export const incomeImpactSchema = z.number().min(0).max(2)

export const careerPhaseSchema = z.object({
  label: z.string().min(1),
  minAge: z.number().int().min(18).max(100),
  maxAge: z.number().int().min(18).max(100),
  growthRate: z.number().min(-0.5).max(0.5),
})

export const promotionJumpSchema = z.object({
  age: z.number().int().min(18).max(100),
  increasePercent: z.number().min(0.01).max(2.0),
})

export const incomeStreamSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  annualAmount: nonNegativeSchema,
  startAge: ageSchema,
  endAge: z.number().int().min(18).max(120),
  growthRate: salaryGrowthSchema,
  type: z.enum(['employment', 'rental', 'investment', 'business', 'government']),
  growthModel: z.enum(['fixed', 'inflation-linked', 'none']),
  taxTreatment: z.enum(['taxable', 'tax-exempt', 'cpf', 'srs']),
  isCpfApplicable: z.boolean(),
  isActive: z.boolean(),
})

export const lifeEventSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  startAge: ageSchema,
  endAge: z.number().int().min(18).max(120),
  incomeImpact: incomeImpactSchema,
  affectedStreamIds: z.array(z.string()),
  savingsPause: z.boolean(),
  cpfPause: z.boolean(),
})

export const incomeSchema = z.object({
  salaryModel: z.enum(['simple', 'realistic', 'data-driven']),
  annualSalary: nonNegativeSchema,
  salaryGrowthRate: salaryGrowthSchema,
  employerCpfEnabled: z.boolean(),
  incomeStreams: z.array(incomeStreamSchema),
  lifeEvents: z.array(lifeEventSchema),
  realisticPhases: z.array(careerPhaseSchema),
  promotionJumps: z.array(promotionJumpSchema),
  momEducation: z.enum(['belowSecondary', 'secondary', 'postSecondary', 'diploma', 'degree']),
  momAdjustment: momAdjustmentSchema,
  lifeEventsEnabled: z.boolean(),
  personalReliefs: personalReliefsSchema,
})

// ============================================================
// Schema-to-field mapping for single-field validation
// ============================================================

/** Validate a single profile field and return error message or null */
export function validateProfileField(
  field: string,
  value: unknown
): string | null {
  const fieldSchemas: Record<string, z.ZodType> = {
    currentAge: ageSchema,
    retirementAge: retirementAgeSchema,
    lifeExpectancy: lifeExpectancySchema,
    annualIncome: nonNegativeSchema,
    annualExpenses: expensesSchema,
    liquidNetWorth: z.number(),
    cpfOA: nonNegativeSchema,
    cpfSA: nonNegativeSchema,
    cpfMA: nonNegativeSchema,
    srsBalance: nonNegativeSchema,
    srsAnnualContribution: nonNegativeSchema,
    swr: swrSchema,
    expectedReturn: returnSchema,
    inflation: inflationSchema,
    expenseRatio: expenseRatioSchema,
  }

  const schema = fieldSchemas[field]
  if (!schema) return null

  const result = schema.safeParse(value)
  if (result.success) return null
  return result.error.issues[0]?.message ?? 'Invalid value'
}

/** Validate a single income field and return error message or null */
export function validateIncomeField(
  field: string,
  value: unknown
): string | null {
  const fieldSchemas: Record<string, z.ZodType> = {
    annualSalary: nonNegativeSchema,
    salaryGrowthRate: salaryGrowthSchema,
    momAdjustment: momAdjustmentSchema,
    personalReliefs: personalReliefsSchema,
  }

  const schema = fieldSchemas[field]
  if (!schema) return null

  const result = schema.safeParse(value)
  if (result.success) return null
  return result.error.issues[0]?.message ?? 'Invalid value'
}
