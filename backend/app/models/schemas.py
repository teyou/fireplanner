from enum import Enum

from pydantic import BaseModel, Field


# ============================================================
# Enums
# ============================================================


class MonteCarloMethod(str, Enum):
    PARAMETRIC = "parametric"
    BOOTSTRAP = "bootstrap"
    FAT_TAIL = "fat_tail"


class WithdrawalStrategyType(str, Enum):
    CONSTANT_DOLLAR = "constant_dollar"
    VPW = "vpw"
    GUARDRAILS = "guardrails"
    VANGUARD_DYNAMIC = "vanguard_dynamic"
    CAPE_BASED = "cape_based"
    FLOOR_CEILING = "floor_ceiling"


class BacktestDataset(str, Enum):
    US_ONLY = "us_only"
    SG_ONLY = "sg_only"
    BLENDED = "blended"


# ============================================================
# Strategy Parameters
# ============================================================


class ConstantDollarParams(BaseModel):
    swr: float = Field(0.04, ge=0.01, le=0.10)


class VpwParams(BaseModel):
    expected_real_return: float = Field(0.03, ge=-0.05, le=0.15)
    target_end_value: float = Field(0.0, ge=0.0)


class GuardrailsParams(BaseModel):
    initial_rate: float = Field(0.05, ge=0.01, le=0.10)
    ceiling_trigger: float = Field(1.20, ge=1.0, le=2.0)
    floor_trigger: float = Field(0.80, ge=0.3, le=1.0)
    adjustment_size: float = Field(0.10, ge=0.01, le=0.50)


class VanguardDynamicParams(BaseModel):
    swr: float = Field(0.04, ge=0.01, le=0.10)
    ceiling: float = Field(0.05, ge=0.0, le=0.20)
    floor: float = Field(0.025, ge=0.0, le=0.20)


class CapeBasedParams(BaseModel):
    base_rate: float = Field(0.04, ge=0.01, le=0.10)
    cape_weight: float = Field(0.50, ge=0.0, le=1.0)
    current_cape: float = Field(30.0, ge=5.0, le=100.0)


class FloorCeilingParams(BaseModel):
    floor: float = Field(60000.0, ge=0.0)
    ceiling: float = Field(150000.0, ge=0.0)
    target_rate: float = Field(0.045, ge=0.01, le=0.10)


class StrategyParams(BaseModel):
    """Union of all strategy parameters. Only the relevant field is used."""

    constant_dollar: ConstantDollarParams = Field(default_factory=ConstantDollarParams)
    vpw: VpwParams = Field(default_factory=VpwParams)
    guardrails: GuardrailsParams = Field(default_factory=GuardrailsParams)
    vanguard_dynamic: VanguardDynamicParams = Field(default_factory=VanguardDynamicParams)
    cape_based: CapeBasedParams = Field(default_factory=CapeBasedParams)
    floor_ceiling: FloorCeilingParams = Field(default_factory=FloorCeilingParams)


# ============================================================
# Monte Carlo Request/Response
# ============================================================


class MonteCarloRequest(BaseModel):
    # Portfolio
    initial_portfolio: float = Field(gt=0)
    allocation_weights: list[float] = Field(min_length=8, max_length=8)
    expected_returns: list[float] = Field(min_length=8, max_length=8)
    std_devs: list[float] = Field(min_length=8, max_length=8)
    correlation_matrix: list[list[float]] = Field(min_length=8, max_length=8)

    # Timeline
    current_age: int = Field(ge=18, le=100)
    retirement_age: int = Field(ge=18, le=100)
    life_expectancy: int = Field(ge=50, le=120)

    # Savings & income
    annual_savings: list[float] = Field(default_factory=list)
    post_retirement_income: list[float] = Field(default_factory=list)

    # Simulation
    method: MonteCarloMethod = MonteCarloMethod.PARAMETRIC
    n_simulations: int = Field(10000, ge=100, le=100000)
    seed: int | None = None

    # Withdrawal strategy
    withdrawal_strategy: WithdrawalStrategyType = WithdrawalStrategyType.CONSTANT_DOLLAR
    strategy_params: StrategyParams = Field(default_factory=StrategyParams)

    # Fees
    expense_ratio: float = Field(0.003, ge=0.0, le=0.05)
    inflation: float = Field(0.025, ge=0.0, le=0.15)


class PercentileBands(BaseModel):
    """Portfolio balance percentile bands per year."""

    years: list[int]
    ages: list[int]
    p5: list[float]
    p10: list[float]
    p25: list[float]
    p50: list[float]
    p75: list[float]
    p90: list[float]
    p95: list[float]


class TerminalStats(BaseModel):
    median: float
    mean: float
    worst: float
    best: float
    p5: float
    p95: float


class SafeSwr(BaseModel):
    confidence_95: float
    confidence_90: float
    confidence_85: float


class FailureDistribution(BaseModel):
    """Failure counts bucketed by decade of retirement."""

    buckets: list[str]
    counts: list[int]
    total_failures: int


class MonteCarloResponse(BaseModel):
    success_rate: float
    percentile_bands: PercentileBands
    terminal_stats: TerminalStats
    safe_swr: SafeSwr | None = None
    failure_distribution: FailureDistribution
    n_simulations: int
    computation_time_ms: float
    cached: bool = False


# ============================================================
# Sequence Risk Request/Response
# ============================================================


class CrisisScenario(BaseModel):
    id: str
    name: str
    equity_return_sequence: list[float]
    duration_years: int


class MitigationImpact(BaseModel):
    strategy: str
    description: str
    normal_success_rate: float
    crisis_success_rate: float
    success_improvement: float


class SequenceRiskRequest(BaseModel):
    initial_portfolio: float = Field(gt=0)
    allocation_weights: list[float] = Field(min_length=8, max_length=8)
    expected_returns: list[float] = Field(min_length=8, max_length=8)
    std_devs: list[float] = Field(min_length=8, max_length=8)
    correlation_matrix: list[list[float]] = Field(min_length=8, max_length=8)

    retirement_age: int = Field(ge=18, le=100)
    life_expectancy: int = Field(ge=50, le=120)

    withdrawal_strategy: WithdrawalStrategyType = WithdrawalStrategyType.CONSTANT_DOLLAR
    strategy_params: StrategyParams = Field(default_factory=StrategyParams)

    crisis: CrisisScenario
    n_simulations: int = Field(2000, ge=100, le=50000)
    seed: int | None = None

    expense_ratio: float = Field(0.003, ge=0.0, le=0.05)
    inflation: float = Field(0.025, ge=0.0, le=0.15)

    post_retirement_income: list[float] = Field(default_factory=list)


class SequenceRiskResponse(BaseModel):
    normal_success_rate: float
    crisis_success_rate: float
    success_degradation: float
    normal_percentile_bands: PercentileBands
    crisis_percentile_bands: PercentileBands
    mitigations: list[MitigationImpact]
    computation_time_ms: float


# ============================================================
# Backtest Request/Response
# ============================================================


class BacktestRequest(BaseModel):
    initial_portfolio: float = Field(gt=0)
    allocation_weights: list[float] = Field(min_length=8, max_length=8)

    swr: float = Field(0.04, ge=0.01, le=0.10)
    retirement_duration: int = Field(30, ge=5, le=60)

    dataset: BacktestDataset = BacktestDataset.US_ONLY
    blend_ratio: float = Field(0.70, ge=0.0, le=1.0, description="US weight when blended")

    expense_ratio: float = Field(0.003, ge=0.0, le=0.05)
    include_heatmap: bool = True

    withdrawal_strategy: WithdrawalStrategyType = WithdrawalStrategyType.CONSTANT_DOLLAR
    strategy_params: StrategyParams = Field(default_factory=StrategyParams)
    inflation: float = Field(0.025, ge=0.0, le=0.15)


class PerYearResult(BaseModel):
    start_year: int
    end_year: int
    survived: bool
    ending_balance: float
    min_balance: float
    worst_year: int
    best_year: int
    total_withdrawn: float


class BacktestSummary(BaseModel):
    total_periods: int
    successful_periods: int
    failed_periods: int
    success_rate: float
    worst_start_year: int
    best_start_year: int
    median_ending_balance: float
    average_total_withdrawn: float


class HeatmapData(BaseModel):
    swr_values: list[float]
    duration_values: list[int]
    success_rates: list[list[float]]


class BacktestResponse(BaseModel):
    results: list[PerYearResult]
    summary: BacktestSummary
    heatmap: HeatmapData | None = None
    computation_time_ms: float
