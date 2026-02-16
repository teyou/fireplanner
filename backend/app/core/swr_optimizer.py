"""
SWR optimizer: binary search for maximum safe withdrawal rate
at a given target confidence level.
"""

from app.core.monte_carlo import run_monte_carlo


def optimize_swr(
    target_success: float,
    base_params: dict,
    n_sims: int = 2000,
    tolerance: float = 0.001,
    max_iterations: int = 15,
    swr_min: float = 0.02,
    swr_max: float = 0.08,
) -> float:
    """
    Binary search for the maximum SWR that achieves target_success rate.

    Args:
        target_success: Target success rate (e.g., 0.95 for 95%).
        base_params: MC simulation parameters (seed will be fixed).
        n_sims: Number of simulations per iteration (reduced for speed).
        tolerance: Convergence tolerance for SWR.
        max_iterations: Maximum binary search iterations.
        swr_min: Lower bound of SWR search range.
        swr_max: Upper bound of SWR search range.

    Returns:
        Maximum SWR at target confidence, rounded to 3 decimal places.
    """
    params = {**base_params, "n_simulations": n_sims}

    # Use a fixed seed for consistent optimization
    if "seed" not in params or params["seed"] is None:
        params["seed"] = 12345

    low = swr_min
    high = swr_max

    for _ in range(max_iterations):
        mid = (low + high) / 2

        # Update SWR in strategy params
        strategy = params.get("withdrawal_strategy", "constant_dollar")
        sp = dict(params.get("strategy_params", {}))

        if strategy == "constant_dollar":
            sp["swr"] = mid
        elif strategy == "vanguard_dynamic":
            sp["swr"] = mid
        elif strategy == "guardrails":
            sp["initial_rate"] = mid
        elif strategy == "floor_ceiling":
            sp["target_rate"] = mid
        elif strategy == "cape_based":
            sp["base_rate"] = mid
        else:
            sp["swr"] = mid

        params["strategy_params"] = sp
        result = run_monte_carlo(params)
        success = result["success_rate"]

        if success >= target_success:
            low = mid  # Can try higher SWR
        else:
            high = mid  # SWR too high

        if high - low < tolerance:
            break

    return round((low + high) / 2, 3)
