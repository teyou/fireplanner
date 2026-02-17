"""
Sequence risk stress testing engine.
Applies historical crisis return sequences to the first N years of retirement,
then runs Monte Carlo for the remainder.
"""

import numpy as np

from app.core.monte_carlo import (
    _build_covariance_matrix,
    _compute_withdrawals_for_year,
    _generate_returns_parametric,
)
from app.core.withdrawal_strategies import resolve_initial_rate


def _run_single_scenario(
    rng: np.random.Generator,
    n_sims: int,
    initial_portfolio: float,
    weights: np.ndarray,
    expected_returns: np.ndarray,
    cov_matrix: np.ndarray,
    n_years_decum: int,
    retirement_age: int,
    strategy: str,
    strategy_params: dict,
    inflation: float,
    expense_ratio: float,
    post_retirement_income: list,
    crisis_returns: np.ndarray | None = None,
) -> dict:
    """Run MC simulation with optional crisis return sequence in early years."""
    n_crisis = len(crisis_returns) if crisis_returns is not None else 0

    # Generate parametric returns for all years
    all_returns = _generate_returns_parametric(
        rng, n_sims, n_years_decum, weights, expected_returns, cov_matrix
    )

    # Override early years with crisis returns (applied to all sims)
    if crisis_returns is not None and n_crisis > 0:
        apply_years = min(n_crisis, n_years_decum)
        for y in range(apply_years):
            all_returns[:, y] = crisis_returns[y]

    # Simulate
    balances = np.zeros((n_sims, n_years_decum + 1))
    balances[:, 0] = initial_portfolio
    failed = np.zeros(n_sims, dtype=bool)
    failure_year = np.full(n_sims, n_years_decum)

    prev_withdrawal = np.zeros(n_sims)
    swr = resolve_initial_rate(strategy_params)
    initial_withdrawal_amount = initial_portfolio * swr

    for t in range(n_years_decum):
        # Pass previous year's return for Guyton-Klinger PMR
        pyr = all_returns[:, t - 1] if t > 0 else None

        withdrawal = _compute_withdrawals_for_year(
            strategy=strategy,
            portfolio=balances[:, t],
            year=t,
            n_years_decum=n_years_decum,
            initial_withdrawal=initial_withdrawal_amount,
            prev_withdrawals=prev_withdrawal,
            inflation=inflation,
            strategy_params=strategy_params,
            prev_year_return=pyr,
        )

        income = post_retirement_income[t] if t < len(post_retirement_income) else 0.0
        net_withdrawal = np.maximum(0, withdrawal - income)
        net_withdrawal = np.minimum(net_withdrawal, balances[:, t])

        prev_withdrawal = withdrawal

        balances[:, t + 1] = (
            (balances[:, t] - net_withdrawal) * (1 + all_returns[:, t] - expense_ratio)
        )

        newly_failed = (balances[:, t + 1] <= 0) & (~failed)
        failed[newly_failed] = True
        failure_year[newly_failed] = t
        balances[:, t + 1] = np.maximum(balances[:, t + 1], 0)

    # Compute percentile bands
    percentile_values = [5, 10, 25, 50, 75, 90, 95]
    percentiles = np.percentile(balances, percentile_values, axis=0)

    years = list(range(n_years_decum + 1))
    ages = [retirement_age + y for y in years]

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

    return {
        "success_rate": float(1 - np.mean(failed)),
        "percentile_bands": percentile_bands,
    }


def _run_mitigation(
    rng: np.random.Generator,
    n_sims: int,
    initial_portfolio: float,
    weights: np.ndarray,
    expected_returns: np.ndarray,
    cov_matrix: np.ndarray,
    n_years_decum: int,
    retirement_age: int,
    strategy: str,
    strategy_params: dict,
    inflation: float,
    expense_ratio: float,
    post_retirement_income: list,
    crisis_returns: np.ndarray | None,
    mitigation_name: str,
    mitigation_desc: str,
    baseline_crisis_rate: float,
    modified_weights: np.ndarray | None = None,
    modified_strategy_params: dict | None = None,
) -> dict:
    """Run a single mitigation scenario and return impact vs unmitigated baseline."""
    eff_weights = modified_weights if modified_weights is not None else weights
    eff_params = modified_strategy_params if modified_strategy_params is not None else strategy_params

    normal = _run_single_scenario(
        rng=np.random.default_rng(rng.integers(0, 2**32)),
        n_sims=n_sims,
        initial_portfolio=initial_portfolio,
        weights=eff_weights,
        expected_returns=expected_returns,
        cov_matrix=cov_matrix,
        n_years_decum=n_years_decum,
        retirement_age=retirement_age,
        strategy=strategy,
        strategy_params=eff_params,
        inflation=inflation,
        expense_ratio=expense_ratio,
        post_retirement_income=post_retirement_income,
        crisis_returns=None,
    )

    crisis = _run_single_scenario(
        rng=np.random.default_rng(rng.integers(0, 2**32)),
        n_sims=n_sims,
        initial_portfolio=initial_portfolio,
        weights=eff_weights,
        expected_returns=expected_returns,
        cov_matrix=cov_matrix,
        n_years_decum=n_years_decum,
        retirement_age=retirement_age,
        strategy=strategy,
        strategy_params=eff_params,
        inflation=inflation,
        expense_ratio=expense_ratio,
        post_retirement_income=post_retirement_income,
        crisis_returns=crisis_returns,
    )

    return {
        "strategy": mitigation_name,
        "description": mitigation_desc,
        "normal_success_rate": normal["success_rate"],
        "crisis_success_rate": crisis["success_rate"],
        "success_improvement": crisis["success_rate"] - baseline_crisis_rate,
    }


def run_sequence_risk(params: dict) -> dict:
    """
    Run sequence risk analysis comparing normal vs crisis scenarios.

    Includes 3 mitigation strategies:
    - Bond tent: increase bond allocation in early retirement
    - Cash buffer: hold 2 years expenses in cash
    - Flexible spending: reduce withdrawal rate by 15%
    """
    n_sims = params.get("n_simulations", 2000)
    seed = params.get("seed")
    rng = np.random.default_rng(seed)

    initial_portfolio = params["initial_portfolio"]
    weights = np.array(params["allocation_weights"])
    expected_returns = np.array(params["expected_returns"])
    std_devs = np.array(params["std_devs"])
    correlation_matrix = np.array(params["correlation_matrix"])
    expense_ratio = params.get("expense_ratio", 0.003)
    inflation = params.get("inflation", 0.025)

    retirement_age = params["retirement_age"]
    life_expectancy = params["life_expectancy"]
    n_years_decum = max(1, life_expectancy - retirement_age)

    strategy = params.get("withdrawal_strategy", "constant_dollar")
    strategy_params = params.get("strategy_params", {})
    post_retirement_income = params.get("post_retirement_income", [])

    crisis = params.get("crisis", {})
    crisis_returns = np.array(crisis.get("equity_return_sequence", []))

    cov_matrix = _build_covariance_matrix(std_devs, correlation_matrix)

    # Normal scenario
    normal_result = _run_single_scenario(
        rng=np.random.default_rng(rng.integers(0, 2**32)),
        n_sims=n_sims,
        initial_portfolio=initial_portfolio,
        weights=weights,
        expected_returns=expected_returns,
        cov_matrix=cov_matrix,
        n_years_decum=n_years_decum,
        retirement_age=retirement_age,
        strategy=strategy,
        strategy_params=strategy_params,
        inflation=inflation,
        expense_ratio=expense_ratio,
        post_retirement_income=post_retirement_income,
        crisis_returns=None,
    )

    # Crisis scenario
    crisis_result = _run_single_scenario(
        rng=np.random.default_rng(rng.integers(0, 2**32)),
        n_sims=n_sims,
        initial_portfolio=initial_portfolio,
        weights=weights,
        expected_returns=expected_returns,
        cov_matrix=cov_matrix,
        n_years_decum=n_years_decum,
        retirement_age=retirement_age,
        strategy=strategy,
        strategy_params=strategy_params,
        inflation=inflation,
        expense_ratio=expense_ratio,
        post_retirement_income=post_retirement_income,
        crisis_returns=crisis_returns,
    )

    # Mitigations
    mitigations = []

    # 1. Bond tent: shift 20% from equities to bonds in early retirement
    bond_tent_weights = weights.copy()
    # Move 20% from equity classes (0,1,2) to bonds (3)
    equity_total = bond_tent_weights[0] + bond_tent_weights[1] + bond_tent_weights[2]
    shift = min(0.20, equity_total)
    if equity_total > 0:
        for i in [0, 1, 2]:
            reduction = shift * (bond_tent_weights[i] / equity_total)
            bond_tent_weights[i] -= reduction
        bond_tent_weights[3] += shift

    baseline_crisis_rate = crisis_result["success_rate"]

    mitigations.append(_run_mitigation(
        rng=np.random.default_rng(rng.integers(0, 2**32)),
        n_sims=n_sims,
        initial_portfolio=initial_portfolio,
        weights=bond_tent_weights,
        expected_returns=expected_returns,
        cov_matrix=cov_matrix,
        n_years_decum=n_years_decum,
        retirement_age=retirement_age,
        strategy=strategy,
        strategy_params=strategy_params,
        inflation=inflation,
        expense_ratio=expense_ratio,
        post_retirement_income=post_retirement_income,
        crisis_returns=crisis_returns,
        mitigation_name="Conservative Allocation",
        mitigation_desc="Shift 20% from equities to bonds throughout retirement to reduce volatility exposure.",
        baseline_crisis_rate=baseline_crisis_rate,
    ))

    # 2. Cash buffer: hold 2 years expenses in cash (reduce portfolio, zero-risk buffer)
    annual_expense_est = initial_portfolio * resolve_initial_rate(strategy_params)
    cash_buffer = annual_expense_est * 2
    reduced_portfolio = max(initial_portfolio - cash_buffer, initial_portfolio * 0.5)

    mitigations.append(_run_mitigation(
        rng=np.random.default_rng(rng.integers(0, 2**32)),
        n_sims=n_sims,
        initial_portfolio=reduced_portfolio,
        weights=weights,
        expected_returns=expected_returns,
        cov_matrix=cov_matrix,
        n_years_decum=n_years_decum,
        retirement_age=retirement_age,
        strategy=strategy,
        strategy_params=strategy_params,
        inflation=inflation,
        expense_ratio=expense_ratio,
        post_retirement_income=[inc + cash_buffer / min(2, n_years_decum) for inc in (post_retirement_income[:2] if len(post_retirement_income) >= 2 else [0.0, 0.0])] + post_retirement_income[2:],
        crisis_returns=crisis_returns,
        mitigation_name="Cash Buffer (2 Years)",
        mitigation_desc="Hold 2 years of expenses in cash outside the portfolio, drawing from buffer in early crisis years.",
        baseline_crisis_rate=baseline_crisis_rate,
    ))

    # 3. Flexible spending: reduce SWR by 15%
    flexible_params = dict(strategy_params)
    if "swr" in flexible_params:
        flexible_params["swr"] = flexible_params["swr"] * 0.85
    if "initial_rate" in flexible_params:
        flexible_params["initial_rate"] = flexible_params["initial_rate"] * 0.85
    if "target_rate" in flexible_params:
        flexible_params["target_rate"] = flexible_params["target_rate"] * 0.85

    mitigations.append(_run_mitigation(
        rng=np.random.default_rng(rng.integers(0, 2**32)),
        n_sims=n_sims,
        initial_portfolio=initial_portfolio,
        weights=weights,
        expected_returns=expected_returns,
        cov_matrix=cov_matrix,
        n_years_decum=n_years_decum,
        retirement_age=retirement_age,
        strategy=strategy,
        strategy_params=flexible_params,
        inflation=inflation,
        expense_ratio=expense_ratio,
        post_retirement_income=post_retirement_income,
        crisis_returns=crisis_returns,
        mitigation_name="Flexible Spending (-15%)",
        mitigation_desc="Reduce withdrawal rate by 15% to preserve capital during market downturns.",
        baseline_crisis_rate=baseline_crisis_rate,
        modified_strategy_params=flexible_params,
    ))

    return {
        "normal_success_rate": normal_result["success_rate"],
        "crisis_success_rate": crisis_result["success_rate"],
        "success_degradation": normal_result["success_rate"] - crisis_result["success_rate"],
        "normal_percentile_bands": normal_result["percentile_bands"],
        "crisis_percentile_bands": crisis_result["percentile_bands"],
        "mitigations": mitigations,
    }
