// ============================================================
// Core Domain Types
// ============================================================

export type LifeStage = 'pre-fire' | 'post-fire'
export type FireType = 'regular' | 'lean' | 'fat' | 'coast' | 'barista'
export type MaritalStatus = 'single' | 'married'
export type ResidencyStatus = 'citizen' | 'pr' | 'foreigner'
export type SalaryModel = 'simple' | 'realistic' | 'data-driven'
export type RebalanceFrequency = 'annual' | 'semi-annual' | 'quarterly'
export type IncomeStreamType = 'employment' | 'rental' | 'investment' | 'business' | 'government'
export type GrowthModel = 'fixed' | 'inflation-linked' | 'none'
export type TaxTreatment = 'taxable' | 'tax-exempt' | 'cpf' | 'srs'
export type EducationLevel = 'belowSecondary' | 'secondary' | 'postSecondary' | 'diploma' | 'degree'

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

export interface CareerPhase {
  label: string
  minAge: number
  maxAge: number
  growthRate: number
}

export interface PromotionJump {
  age: number
  increasePercent: number
}

export interface IncomeStream {
  id: string
  name: string
  annualAmount: number
  startAge: number
  endAge: number
  growthRate: number
  type: IncomeStreamType
  growthModel: GrowthModel
  taxTreatment: TaxTreatment
  isCpfApplicable: boolean
  isActive: boolean
}

export interface LifeEvent {
  id: string
  name: string
  startAge: number
  endAge: number
  incomeImpact: number
  affectedStreamIds: string[]
  savingsPause: boolean
  cpfPause: boolean
}

export interface IncomeState {
  salaryModel: SalaryModel
  annualSalary: number
  salaryGrowthRate: number
  employerCpfEnabled: boolean
  incomeStreams: IncomeStream[]
  lifeEvents: LifeEvent[]
  realisticPhases: CareerPhase[]
  promotionJumps: PromotionJump[]
  momEducation: EducationLevel
  momAdjustment: number
  lifeEventsEnabled: boolean
  personalReliefs: number
  validationErrors: ValidationErrors
}

export interface IncomeProjectionRow {
  year: number
  age: number
  salary: number
  rentalIncome: number
  investmentIncome: number
  businessIncome: number
  governmentIncome: number
  totalGross: number
  sgTax: number
  cpfEmployee: number
  cpfEmployer: number
  totalNet: number
  annualSavings: number
  cumulativeSavings: number
  cpfOA: number
  cpfSA: number
  cpfMA: number
  isRetired: boolean
  activeLifeEvents: string[]
}

export interface IncomeSummaryStats {
  peakEarningAge: number
  peakEarningAmount: number
  lifetimeEarnings: number
  averageSavingsRate: number
  totalCpfContributions: number
  incomeReplacementRatio: number
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
// Asset Allocation
// ============================================================

export type AssetClass = 'usEquities' | 'sgEquities' | 'intlEquities' | 'bonds' | 'reits' | 'gold' | 'cash' | 'cpf'

export type AllocationTemplate = 'conservative' | 'balanced' | 'aggressive' | 'allWeather' | 'singaporeCentric' | 'cpfHeavy' | 'custom'

export type GlidePathMethod = 'linear' | 'slowStart' | 'fastStart'

export interface AssetClassData {
  key: AssetClass
  label: string
  expectedReturn: number
  stdDev: number
}

export interface GlidePathConfig {
  enabled: boolean
  method: GlidePathMethod
  startAge: number
  endAge: number
}

export interface PortfolioStats {
  expectedReturn: number
  realReturn: number
  netReturn: number
  stdDev: number
  sharpe: number
  var95: number
  var99: number
  diversificationRatio: number
}

export interface AllocationState {
  currentWeights: number[]
  targetWeights: number[]
  selectedTemplate: AllocationTemplate
  returnOverrides: (number | null)[]
  stdDevOverrides: (number | null)[]
  glidePathConfig: GlidePathConfig
  validationErrors: ValidationErrors
}

// ============================================================
// Validation
// ============================================================

export type ValidationErrors = Record<string, string>
