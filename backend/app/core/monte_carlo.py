"""
Monte Carlo simulation engine for retirement planning.
Supports 3 methods: parametric (Cholesky), historical bootstrap, fat-tail (Student-t df=5).
Two-phase simulation: accumulation + decumulation.

Formulas from FIRE_PLANNER_MASTER_PLAN_v2.md Section 6.
"""

import numpy as np
from scipy.stats import t as t_dist

from app.core.withdrawal_strategies import (
    cape_based,
    constant_dollar,
    floor_ceiling,
    guardrails,
    vanguard_dynamic,
    vpw,
)


def _build_covariance_matrix(
    std_devs: np.ndarray, correlation_matrix: np.ndarray
) -> np.ndarray:
    """Build covariance matrix from std devs and correlation matrix."""
    n = len(std_devs)
    cov = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            cov[i, j] = std_devs[i] * std_devs[j] * correlation_matrix[i, j]
    return cov


def _generate_returns_parametric(
    rng: np.random.Generator,
    n_sims: int,
    n_years: int,
    weights: np.ndarray,
    expected_returns: np.ndarray,
    cov_matrix: np.ndarray,
) -> np.ndarray:
    """Generate portfolio returns via Cholesky decomposition of multivariate normal."""
    # Cholesky decomposition for correlated normal returns
    try:
        L = np.linalg.cholesky(cov_matrix)
    except np.linalg.LinAlgError:
        # If not positive definite, add small diagonal
        cov_matrix = cov_matrix + np.eye(len(weights)) * 1e-8
        L = np.linalg.cholesky(cov_matrix)

    Z = rng.standard_normal((n_sims, n_years, len(weights)))
    asset_returns = Z @ L.T + expected_returns  # (n_sims, n_years, 8)
    portfolio_returns = asset_returns @ weights  # (n_sims, n_years)
    return portfolio_returns


def _generate_returns_bootstrap(
    rng: np.random.Generator,
    n_sims: int,
    n_years: int,
    weights: np.ndarray,
    historical_returns: np.ndarray | None,
    expected_returns: np.ndarray,
    cov_matrix: np.ndarray,
) -> np.ndarray:
    """Generate portfolio returns by bootstrap sampling from historical data."""
    if historical_returns is not None and len(historical_returns) > 0:
        n_historical = len(historical_returns)
        indices = rng.integers(0, n_historical, size=(n_sims, n_years))
        asset_returns = historical_returns[indices]  # (n_sims, n_years, n_assets)
        portfolio_returns = asset_returns @ weights
        return portfolio_returns
    else:
        # Fallback to parametric if no historical data
        return _generate_returns_parametric(
            rng, n_sims, n_years, weights, expected_returns, cov_matrix
        )


def _generate_returns_fat_tail(
    rng: np.random.Generator,
    n_sims: int,
    n_years: int,
    weights: np.ndarray,
    expected_returns: np.ndarray,
    std_devs: np.ndarray,
) -> np.ndarray:
    """Generate portfolio returns using Student-t distribution (df=5) for fat tails."""
    port_return = float(np.dot(weights, expected_returns))
    port_std = float(np.sqrt(weights @ np.diag(std_devs**2) @ weights))

    # Student-t with df=5, scaled to match portfolio moments
    # Variance of t(df) = df/(df-2), so scale factor = sqrt(df/(df-2)) to get unit variance
    df = 5
    scale_factor = np.sqrt(df / (df - 2))
    Z = t_dist.rvs(df=df, size=(n_sims, n_years), random_state=rng)
    portfolio_returns = port_return + port_std * Z / scale_factor
    return portfolio_returns


def _compute_withdrawals_for_year(
    strategy: str,
    portfolio: np.ndarray,
    year: int,
    n_years_decum: int,
    initial_withdrawal: float,
    prev_withdrawals: np.ndarray,
    inflation: float,
    strategy_params: dict,
) -> np.ndarray:
    """Compute withdrawal amounts for all simulations at a given decumulation year."""
    decum_year = year

    if strategy == "constant_dollar":
        swr = strategy_params.get("swr", 0.04)
        iw = initial_withdrawal if initial_withdrawal > 0 else portfolio * swr
        return constant_dollar(
            portfolio, year=decum_year,
            initial_withdrawal=iw if isinstance(iw, float) else iw,
            inflation=inflation,
        )

    elif strategy == "vpw":
        remaining = n_years_decum - decum_year
        return vpw(
            portfolio, year=decum_year,
            remaining_years=remaining,
            expected_real_return=strategy_params.get("expected_real_return", 0.03),
            target_end_value=strategy_params.get("target_end_value", 0.0),
        )

    elif strategy == "guardrails":
        prev_w = prev_withdrawals if decum_year > 0 else np.zeros_like(portfolio)
        return guardrails(
            portfolio, year=decum_year,
            initial_withdrawal=initial_withdrawal,
            prev_withdrawal=prev_w,
            inflation=inflation,
            initial_rate=strategy_params.get("initial_rate", 0.05),
            ceiling_trigger=strategy_params.get("ceiling_trigger", 1.20),
            floor_trigger=strategy_params.get("floor_trigger", 0.80),
            adjustment_size=strategy_params.get("adjustment_size", 0.10),
        )

    elif strategy == "vanguard_dynamic":
        prev_w = prev_withdrawals if decum_year > 0 else np.zeros_like(portfolio)
        return vanguard_dynamic(
            portfolio, year=decum_year,
            initial_withdrawal=initial_withdrawal,
            prev_withdrawal=prev_w,
            inflation=inflation,
            swr=strategy_params.get("swr", 0.04),
            ceiling=strategy_params.get("ceiling", 0.05),
            floor=strategy_params.get("floor", 0.025),
        )

    elif strategy == "cape_based":
        return cape_based(
            portfolio, year=decum_year,
            base_rate=strategy_params.get("base_rate", 0.04),
            cape_weight=strategy_params.get("cape_weight", 0.50),
            current_cape=strategy_params.get("current_cape", 30.0),
        )

    elif strategy == "floor_ceiling":
        return floor_ceiling(
            portfolio, year=decum_year,
            floor_amount=strategy_params.get("floor_amount", 60000.0),
            ceiling_amount=strategy_params.get("ceiling_amount", 150000.0),
            target_rate=strategy_params.get("target_rate", 0.045),
        )

    else:
        raise ValueError(f"Unknown strategy: {strategy}")


def run_monte_carlo(params: dict) -> dict:
    """
    Run Monte Carlo retirement simulation.

    Args:
        params: Dictionary with simulation parameters.

    Returns:
        Dictionary with success_rate, percentile_bands, terminal_stats,
        failure_distribution.
    """
    # Extract parameters
    n_sims = params.get("n_simulations", 10000)
    seed = params.get("seed")
    rng = np.random.default_rng(seed)

    initial_portfolio = params["initial_portfolio"]
    weights = np.array(params["allocation_weights"])
    expected_returns = np.array(params["expected_returns"])
    std_devs = np.array(params["std_devs"])
    correlation_matrix = np.array(params["correlation_matrix"])
    expense_ratio = params.get("expense_ratio", 0.003)
    inflation = params.get("inflation", 0.025)

    current_age = params["current_age"]
    retirement_age = params["retirement_age"]
    life_expectancy = params["life_expectancy"]

    n_years_accum = max(0, retirement_age - current_age)
    n_years_decum = max(1, life_expectancy - retirement_age)
    n_years_total = n_years_accum + n_years_decum

    annual_savings = params.get("annual_savings", [])
    post_retirement_income = params.get("post_retirement_income", [])

    method = params.get("method", "parametric")
    strategy = params.get("withdrawal_strategy", "constant_dollar")
    strategy_params = params.get("strategy_params", {})

    # Build covariance matrix
    cov_matrix = _build_covariance_matrix(std_devs, correlation_matrix)

    # Generate returns
    if method == "parametric":
        portfolio_returns = _generate_returns_parametric(
            rng, n_sims, n_years_total, weights, expected_returns, cov_matrix
        )
    elif method == "bootstrap":
        historical = params.get("historical_returns")
        if historical is not None:
            historical = np.array(historical)
        portfolio_returns = _generate_returns_bootstrap(
            rng, n_sims, n_years_total, weights, historical, expected_returns, cov_matrix
        )
    elif method == "fat_tail":
        portfolio_returns = _generate_returns_fat_tail(
            rng, n_sims, n_years_total, weights, expected_returns, std_devs
        )
    else:
        raise ValueError(f"Unknown method: {method}")

    # Simulate paths
    balances = np.zeros((n_sims, n_years_total + 1))
    balances[:, 0] = initial_portfolio
    failed = np.zeros(n_sims, dtype=bool)
    failure_year = np.full(n_sims, n_years_total)

    # Track withdrawals for strategies that need previous withdrawal
    prev_withdrawal = np.zeros(n_sims)
    swr = strategy_params.get("swr", 0.04)
    initial_withdrawal_amount = 0.0  # Will be set at retirement

    for t in range(n_years_total):
        if t < n_years_accum:
            # ACCUMULATION: add savings
            savings = annual_savings[t] if t < len(annual_savings) else 0.0
            balances[:, t + 1] = (
                balances[:, t] * (1 + portfolio_returns[:, t] - expense_ratio) + savings
            )
        else:
            # DECUMULATION: subtract withdrawals
            decum_year = t - n_years_accum

            if decum_year == 0:
                # Set initial withdrawal at start of retirement
                initial_withdrawal_amount = float(np.median(balances[:, t])) * swr

            withdrawal = _compute_withdrawals_for_year(
                strategy=strategy,
                portfolio=balances[:, t],
                year=decum_year,
                n_years_decum=n_years_decum,
                initial_withdrawal=initial_withdrawal_amount,
                prev_withdrawals=prev_withdrawal,
                inflation=inflation,
                strategy_params=strategy_params,
            )

            # Subtract post-retirement income
            income = (
                post_retirement_income[decum_year]
                if decum_year < len(post_retirement_income)
                else 0.0
            )
            net_withdrawal = np.maximum(0, withdrawal - income)

            # Don't withdraw more than the portfolio
            net_withdrawal = np.minimum(net_withdrawal, balances[:, t])

            prev_withdrawal = withdrawal

            balances[:, t + 1] = (
                (balances[:, t] - net_withdrawal) * (1 + portfolio_returns[:, t] - expense_ratio)
            )

            # Check for failure
            newly_failed = (balances[:, t + 1] <= 0) & (~failed)
            failed[newly_failed] = True
            failure_year[newly_failed] = decum_year
            balances[:, t + 1] = np.maximum(balances[:, t + 1], 0)

    # Compute outputs
    success_rate = float(1 - np.mean(failed))

    # Percentile bands
    percentile_values = [5, 10, 25, 50, 75, 90, 95]
    percentiles = np.percentile(balances, percentile_values, axis=0)

    years = list(range(n_years_total + 1))
    ages = [current_age + y for y in years]

    percentile_bands = {
        "years": years,
        "ages": ages,
        "p5": percentiles[0].tolist(),
        "p10": percentiles[1].tolist(),
        "p25": percentiles[2].tolist(),
        "p50": percentiles[3].tolist(),
        "p75": percentiles[4].tolist(),
        "p90": percentiles[5].tolist(),
        "p95": percentiles[6].tolist(),
    }

    # Terminal stats
    terminals = balances[:, -1]
    terminal_stats = {
        "median": float(np.median(terminals)),
        "mean": float(np.mean(terminals)),
        "worst": float(np.min(terminals)),
        "best": float(np.max(terminals)),
        "p5": float(np.percentile(terminals, 5)),
        "p95": float(np.percentile(terminals, 95)),
    }

    # Failure distribution by decade
    failed_years = failure_year[failed]
    decades = [(0, 10), (10, 20), (20, 30), (30, 40), (40, 50)]
    bucket_labels = []
    bucket_counts = []
    for start, end in decades:
        if start >= n_years_decum:
            break
        label = f"Year {start + 1}-{min(end, n_years_decum)}"
        count = int(np.sum((failed_years >= start) & (failed_years < end)))
        bucket_labels.append(label)
        bucket_counts.append(count)

    failure_distribution = {
        "buckets": bucket_labels,
        "counts": bucket_counts,
        "total_failures": int(np.sum(failed)),
    }

    return {
        "success_rate": success_rate,
        "percentile_bands": percentile_bands,
        "terminal_stats": terminal_stats,
        "failure_distribution": failure_distribution,
    }
