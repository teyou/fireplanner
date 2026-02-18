// ============================================================
// Core Domain Types
// ============================================================

export type LifeStage = 'pre-fire' | 'post-fire'
export type FireType = 'regular' | 'lean' | 'fat' | 'coast' | 'barista'
export type MaritalStatus = 'single' | 'married'
export type ResidencyStatus = 'citizen' | 'pr' | 'foreigner'
export type SalaryModel = 'simple' | 'realistic' | 'data-driven'
export type RebalanceFrequency = 'annual' | 'semi-annual' | 'quarterly'
export type FireNumberBasis = 'today' | 'retirement' | 'fireAge'
export type AnalysisMode = 'currentNW' | 'fireNumber' | 'projectedNW'
export type IncomeStreamType = 'employment' | 'rental' | 'investment' | 'business' | 'government'
export type GrowthModel = 'fixed' | 'inflation-linked' | 'none'
export type TaxTreatment = 'taxable' | 'tax-exempt' | 'cpf' | 'srs'
export type EducationLevel = 'belowSecondary' | 'secondary' | 'postSecondary' | 'diploma' | 'degree'
export type CpfLifePlan = 'basic' | 'standard' | 'escalating'
export type CpfRetirementSum = 'brs' | 'frs' | 'ers'
export type CpfHousingMode = 'none' | 'simple' | 'property-linked'
export type RetirementPhase = 'before-55' | '55-to-64' | '65-plus'

// ============================================================
// Healthcare Configuration
// ============================================================

export type IspTierOption = 'none' | 'basic' | 'standard' | 'enhanced'
export type OopModel = 'fixed' | 'age-curve'

export interface HealthcareConfig {
  enabled: boolean
  mediShieldLifeEnabled: boolean
  ispTier: IspTierOption
  careShieldLifeEnabled: boolean
  oopBaseAmount: number
  oopModel: OopModel
  mediSaveTopUpAnnual: number
}

// ============================================================
// Parent Support
// ============================================================

export interface ParentSupport {
  id: string
  label: string
  monthlyAmount: number
  startAge: number
  endAge: number
  growthRate: number
}

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
  fireNumberBasis: FireNumberBasis

  // Retirement spending
  retirementSpendingAdjustment: number

  // Assumptions
  expectedReturn: number
  usePortfolioReturn: boolean
  inflation: number
  expenseRatio: number
  rebalanceFrequency: RebalanceFrequency

  // Retirement phase (Already FIRE pathway)
  retirementPhase: RetirementPhase | null  // null for pre-fire users
  cpfLifeActualMonthlyPayout: number       // 65+ users enter known payout

  // CPF LIFE Configuration
  cpfLifeStartAge: number
  cpfLifePlan: CpfLifePlan
  cpfRetirementSum: CpfRetirementSum
  cpfHousingMode: CpfHousingMode
  cpfHousingMonthly: number
  cpfMortgageYearsLeft: number

  // Aging Parent Support
  parentSupportEnabled: boolean
  parentSupport: ParentSupport[]

  // Healthcare & Insurance
  healthcareConfig: HealthcareConfig

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
  cpfLifePayout: number
  cpfOaHousingDeduction: number
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
  propertyEquity: number
  totalNWIncProperty: number
  cpfDependency: boolean
  liquidBridgeGapYears: number | null
  liquidDepletionAge: number | null
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
// Monte Carlo Simulation (W4)
// ============================================================

export type MonteCarloMethod = 'parametric' | 'bootstrap' | 'fat_tail'

export type WithdrawalStrategyType =
  | 'constant_dollar'
  | 'vpw'
  | 'guardrails'
  | 'vanguard_dynamic'
  | 'cape_based'
  | 'floor_ceiling'

export interface ConstantDollarParams {
  swr: number
}

export interface VpwParams {
  expectedRealReturn: number
  targetEndValue: number
}

export interface GuardrailsParams {
  initialRate: number
  ceilingTrigger: number
  floorTrigger: number
  adjustmentSize: number
}

export interface VanguardDynamicParams {
  swr: number
  ceiling: number
  floor: number
}

export interface CapeBasedParams {
  baseRate: number
  capeWeight: number
  currentCape: number
}

export interface FloorCeilingParams {
  floor: number
  ceiling: number
  targetRate: number
}

export interface StrategyParamsMap {
  constant_dollar: ConstantDollarParams
  vpw: VpwParams
  guardrails: GuardrailsParams
  vanguard_dynamic: VanguardDynamicParams
  cape_based: CapeBasedParams
  floor_ceiling: FloorCeilingParams
}

export interface MonteCarloParams {
  initialPortfolio: number
  allocationWeights: number[]
  expectedReturns: number[]
  stdDevs: number[]
  correlationMatrix: number[][]
  currentAge: number
  retirementAge: number
  lifeExpectancy: number
  annualSavings: number[]
  postRetirementIncome: number[]
  method: MonteCarloMethod
  nSimulations: number
  seed?: number
  withdrawalStrategy: WithdrawalStrategyType
  strategyParams: StrategyParamsMap
  expenseRatio: number
  inflation: number
}

export interface PercentileBands {
  years: number[]
  ages: number[]
  p5: number[]
  p10: number[]
  p25: number[]
  p50: number[]
  p75: number[]
  p90: number[]
  p95: number[]
}

export interface TerminalStats {
  median: number
  mean: number
  worst: number
  best: number
  p5: number
  p95: number
}

export interface SafeSwr {
  confidence_95: number
  confidence_90: number
  confidence_85: number
}

export interface FailureDistribution {
  buckets: string[]
  counts: number[]
  total_failures: number
}

export interface MonteCarloResult {
  success_rate: number
  percentile_bands: PercentileBands
  terminal_stats: TerminalStats
  safe_swr: SafeSwr | null
  failure_distribution: FailureDistribution
  n_simulations: number
  computation_time_ms: number
  cached: boolean
}

export interface SimulationState {
  mcMethod: MonteCarloMethod
  selectedStrategy: WithdrawalStrategyType
  strategyParams: StrategyParamsMap
  nSimulations: number
  analysisMode: AnalysisMode
  validationErrors: ValidationErrors
}

// ============================================================
// Withdrawal Strategies (W5)
// ============================================================

export interface WithdrawalResult {
  year: number
  age: number
  portfolio: number
  withdrawal: number
}

export interface WithdrawalSummary {
  strategyName: string
  avgWithdrawal: number
  minWithdrawal: number
  maxWithdrawal: number
  stdDevWithdrawal: number
  terminalPortfolio: number
  survived: boolean
}

export interface WithdrawalState {
  selectedStrategies: WithdrawalStrategyType[]
  strategyParams: StrategyParamsMap
  validationErrors: ValidationErrors
}

// ============================================================
// Sequence Risk (W5)
// ============================================================

export interface CrisisScenario {
  id: string
  name: string
  region: string
  startYear: number
  peakDrawdown: number
  durationYears: number
  recoveryYears: number
  equityReturnSequence: number[]
  description: string
}

export interface SequenceRiskResult {
  normal_success_rate: number
  crisis_success_rate: number
  success_degradation: number
  normal_percentile_bands: PercentileBands
  crisis_percentile_bands: PercentileBands
  mitigations: MitigationImpact[]
  computation_time_ms: number
}

export interface MitigationImpact {
  strategy: string
  description: string
  normal_success_rate: number
  crisis_success_rate: number
  success_improvement: number
}

// ============================================================
// Historical Backtest (W6)
// ============================================================

export type BacktestDataset = 'us_only' | 'sg_only' | 'blended'

export interface BacktestParams {
  initial_portfolio: number
  allocation_weights: number[]
  swr: number
  retirement_duration: number
  dataset: BacktestDataset
  blend_ratio: number
  expense_ratio: number
  include_heatmap: boolean
  withdrawal_strategy: WithdrawalStrategyType
  strategy_params: StrategyParamsMap
  inflation: number
}

export interface PerYearResult {
  start_year: number
  end_year: number
  survived: boolean
  ending_balance: number
  min_balance: number
  worst_year: number
  best_year: number
  total_withdrawn: number
}

export interface BacktestSummary {
  total_periods: number
  successful_periods: number
  failed_periods: number
  success_rate: number
  worst_start_year: number
  best_start_year: number
  median_ending_balance: number
  average_total_withdrawn: number
}

export interface HeatmapData {
  swr_values: number[]
  duration_values: number[]
  success_rates: number[][]
}

export interface BacktestResult {
  results: PerYearResult[]
  summary: BacktestSummary
  heatmap: HeatmapData | null
  computation_time_ms: number
}

// ============================================================
// Property (W7)
// ============================================================

export type PropertyType = 'hdb' | 'condo' | 'landed'

export type DownsizingScenario = 'none' | 'sell-and-downsize' | 'sell-and-rent'

export interface DownsizingConfig {
  scenario: DownsizingScenario
  sellAge: number
  expectedSalePrice: number
  // Sell-and-Downsize
  newPropertyCost: number
  newMortgageRate: number
  newMortgageTerm: number
  newLtv: number
  // Sell-and-Rent
  monthlyRent: number
  rentGrowthRate: number
}

export interface PropertyState {
  // New purchase analysis
  propertyType: PropertyType
  purchasePrice: number
  leaseYears: number
  appreciationRate: number
  rentalYield: number
  mortgageRate: number
  mortgageTerm: number
  ltv: number
  residencyForAbsd: 'citizen' | 'pr' | 'foreigner'
  propertyCount: number
  // Existing property
  ownsProperty: boolean
  existingPropertyValue: number
  existingMortgageBalance: number
  existingMonthlyPayment: number
  existingRentalIncome: number
  existingMortgageRate: number
  existingMortgageRemainingYears: number
  // Downsizing
  downsizing: DownsizingConfig
  validationErrors: ValidationErrors
}

// ============================================================
// Year-by-Year Projection
// ============================================================

export interface ProjectionRow {
  age: number
  year: number
  isRetired: boolean
  // Default columns
  totalIncome: number
  annualExpenses: number
  savingsOrWithdrawal: number
  portfolioReturnDollar: number
  portfolioReturnPct: number
  liquidNW: number
  cpfTotal: number
  totalNW: number
  fireProgress: number
  // Expanded: income breakdown
  salary: number
  rentalIncome: number
  investmentIncome: number
  businessIncome: number
  governmentIncome: number
  totalGross: number
  // Expanded: tax/CPF deductions
  sgTax: number
  cpfEmployee: number
  cpfEmployer: number
  totalNet: number
  // Expanded: CPF balances
  cpfOA: number
  cpfSA: number
  cpfMA: number
  // Expanded: withdrawal detail
  withdrawalAmount: number
  maxPermittedWithdrawal: number
  withdrawalExcess: number
  // Property
  propertyEquity: number
  totalNWIncProperty: number
  // Expanded: parent support
  parentSupportExpense: number
  // Expanded: healthcare
  healthcareCashOutlay: number
  // Expanded: other
  cumulativeSavings: number
  activeLifeEvents: string[]
}

export interface ProjectionSummary {
  fireAchievedAge: number | null
  peakTotalNW: number
  peakTotalNWAge: number
  terminalLiquidNW: number
  terminalTotalNW: number
  portfolioDepletedAge: number | null
}

// ============================================================
// Validation
// ============================================================

export type ValidationErrors = Record<string, string>
