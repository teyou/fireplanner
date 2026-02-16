// ============================================================
// Core Domain Types
// ============================================================

export type LifeStage = 'pre-fire' | 'post-fire'
export type FireType = 'regular' | 'lean' | 'fat' | 'coast' | 'barista'
export type MaritalStatus = 'single' | 'married'
export type ResidencyStatus = 'citizen' | 'pr' | 'foreigner'
export type SalaryModel = 'simple' | 'realistic' | 'data-driven'
export type RebalanceFrequency = 'annual' | 'semi-annual' | 'quarterly'

// ============================================================
// Profile Store
// ============================================================

export interface ProfileState {
  // Personal
  currentAge: number
  retirementAge: number
  lifeExpectancy: number
  lifeStage: LifeStage
  maritalStatus: MaritalStatus
  residencyStatus: ResidencyStatus

  // Financial
  annualIncome: number
  annualExpenses: number
  liquidNetWorth: number
  cpfOA: number
  cpfSA: number
  cpfMA: number
  srsBalance: number
  srsAnnualContribution: number

  // FIRE Targets
  fireType: FireType
  swr: number

  // Assumptions
  expectedReturn: number
  inflation: number
  expenseRatio: number
  rebalanceFrequency: RebalanceFrequency

  // Validation
  validationErrors: ValidationErrors
}

// ============================================================
// Income Store
// ============================================================

export interface IncomeStream {
  id: string
  name: string
  annualAmount: number
  startAge: number
  endAge: number
  growthRate: number
  isTaxable: boolean
  isCpfApplicable: boolean
}

export interface LifeEvent {
  id: string
  name: string
  age: number
  amount: number
  isRecurring: boolean
  endAge?: number
}

export interface IncomeState {
  salaryModel: SalaryModel
  annualSalary: number
  salaryGrowthRate: number
  employerCpfEnabled: boolean
  incomeStreams: IncomeStream[]
  lifeEvents: LifeEvent[]
  validationErrors: ValidationErrors
}

// ============================================================
// Calculation Results
// ============================================================

export interface FireMetrics {
  fireNumber: number
  leanFireNumber: number
  fatFireNumber: number
  coastFireNumber: number
  baristaFireIncome: number
  yearsToFire: number
  fireAge: number
  progress: number
  savingsRate: number
  annualSavings: number
  totalNetWorth: number
}

export interface CpfContribution {
  employee: number
  employer: number
  total: number
  oaAllocation: number
  saAllocation: number
  maAllocation: number
}

export interface CpfProjection {
  age: number
  oaBalance: number
  saBalance: number
  maBalance: number
  totalBalance: number
  annualContribution: number
  annualInterest: number
}

export interface TaxResult {
  chargeableIncome: number
  taxPayable: number
  effectiveRate: number
  marginalRate: number
}

// ============================================================
// Data File Types
// ============================================================

export interface CpfRateEntry {
  ageGroup: string
  minAge: number
  maxAge: number
  employeeRate: number
  employerRate: number
  totalRate: number
  oaRate: number
  saRate: number
  maRate: number
}

export interface TaxBracket {
  from: number
  to: number
  rate: number
  cumulativeTax: number
}

export interface MomSalaryEntry {
  ageGroup: string
  belowSecondary: number
  secondary: number
  postSecondary: number
  diploma: number
  degree: number
}

// ============================================================
// Validation
// ============================================================

export type ValidationErrors = Record<string, string>
