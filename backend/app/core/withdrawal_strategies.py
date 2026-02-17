"""
6 withdrawal strategies for use inside Monte Carlo simulation loop.
Each function takes scalar or NumPy array inputs for vectorized MC.

Formulas from FIRE_PLANNER_MASTER_PLAN_v2.md Section 7.
"""

import numpy as np


def resolve_initial_rate(strategy_params: dict, default: float = 0.04) -> float:
    """Resolve the effective withdrawal rate from strategy params.
    Mirrors frontend: sp.swr ?? sp.initialRate ?? sp.targetRate ?? swr
    """
    return (
        strategy_params.get("swr")
        or strategy_params.get("initial_rate")
        or strategy_params.get("target_rate")
        or default
    )


def constant_dollar(
    portfolio: np.ndarray | float,
    year: int,
    initial_withdrawal: float,
    inflation: float,
    **kwargs,
) -> np.ndarray | float:
    """Strategy 1: Constant Dollar (4% Rule).
    Year 1: portfolio * SWR. Year N: previous * (1 + inflation).
    """
    return initial_withdrawal * (1 + inflation) ** year


def vpw(
    portfolio: np.ndarray | float,
    year: int,
    remaining_years: int,
    expected_real_return: float = 0.03,
    target_end_value: float = 0.0,
    **kwargs,
) -> np.ndarray | float:
    """Strategy 2: Variable Percentage Withdrawal.
    VPW rate = PMT(r, n, -1, fv) as a positive fraction.
    Withdrawal = portfolio * rate.
    """
    if remaining_years <= 0:
        return portfolio  # Spend it all in the last year

    r = expected_real_return
    n = remaining_years

    if abs(r) < 1e-10:
        # Zero return: simple linear spend-down
        rate = 1.0 / n if target_end_value == 0 else max(0, (1.0 - target_end_value) / n)
    else:
        # PMT formula: rate = r / (1 - (1+r)^-n) adjusted for target end value
        pv_factor = (1 + r) ** (-n)
        rate = (r * (1 - target_end_value * pv_factor)) / (1 - pv_factor)
        rate = max(0.0, rate)

    return portfolio * rate


def guardrails(
    portfolio: np.ndarray | float,
    year: int,
    initial_withdrawal: float,
    prev_withdrawal: float,
    inflation: float,
    initial_rate: float = 0.05,
    ceiling_trigger: float = 1.20,
    floor_trigger: float = 0.80,
    adjustment_size: float = 0.10,
    prev_year_return: np.ndarray | float | None = None,
    **kwargs,
) -> np.ndarray | float:
    """Strategy 3: Guardrails (Guyton-Klinger).
    Inflation-adjust previous withdrawal, then check capital preservation
    and prosperity rules.

    Includes Portfolio Management Rule (PMR): skip inflation adjustment
    in years following a negative portfolio return.
    """
    if year == 0:
        return initial_withdrawal

    # PMR: skip inflation adjustment if prior year return was negative
    if prev_year_return is not None and isinstance(portfolio, np.ndarray):
        base = np.where(prev_year_return < 0, prev_withdrawal, prev_withdrawal * (1 + inflation))
    elif prev_year_return is not None and prev_year_return < 0:
        base = prev_withdrawal
    else:
        base = prev_withdrawal * (1 + inflation)

    # Avoid division by zero
    safe_portfolio = np.maximum(portfolio, 1.0) if isinstance(portfolio, np.ndarray) else max(portfolio, 1.0)
    current_rate = base / safe_portfolio

    # Capital Preservation Rule: cut if spending rate too high
    ceiling = initial_rate * ceiling_trigger
    # Prosperity Rule: raise if spending rate too low
    floor = initial_rate * floor_trigger

    if isinstance(portfolio, np.ndarray):
        result = base * np.ones_like(portfolio)
        cut_mask = current_rate > ceiling
        raise_mask = current_rate < floor
        result = np.where(cut_mask, base * (1 - adjustment_size), result)
        result = np.where(raise_mask, base * (1 + adjustment_size), result)
        return result
    else:
        if current_rate > ceiling:
            return base * (1 - adjustment_size)
        elif current_rate < floor:
            return base * (1 + adjustment_size)
        return base


def vanguard_dynamic(
    portfolio: np.ndarray | float,
    year: int,
    initial_withdrawal: float,
    prev_withdrawal: float,
    inflation: float,
    swr: float = 0.04,
    ceiling: float = 0.05,
    floor: float = 0.025,
    **kwargs,
) -> np.ndarray | float:
    """Strategy 4: Vanguard Dynamic Spending.
    Target = portfolio * SWR, capped by ceiling/floor relative to
    inflation-adjusted previous withdrawal.
    """
    if year == 0:
        return initial_withdrawal

    target = portfolio * swr
    inflation_adjusted = prev_withdrawal * (1 + inflation)

    ceiling_limit = inflation_adjusted * (1 + ceiling)
    floor_limit = inflation_adjusted * (1 - floor)

    if isinstance(portfolio, np.ndarray):
        result = target.copy()
        result = np.where(target > ceiling_limit, ceiling_limit, result)
        result = np.where(target < floor_limit, floor_limit, result)
        return result
    else:
        if target > ceiling_limit:
            return ceiling_limit
        elif target < floor_limit:
            return floor_limit
        return target


def cape_based(
    portfolio: np.ndarray | float,
    year: int,
    base_rate: float = 0.04,
    cape_weight: float = 0.50,
    current_cape: float = 30.0,
    **kwargs,
) -> np.ndarray | float:
    """Strategy 5: CAPE-Based withdrawal.
    CAPE mean-reverts from current toward 17 over 10 years (deterministic).
    Blended rate = cape_weight * (1/CAPE) + (1-cape_weight) * base_rate.
    """
    # CAPE mean-reversion: linear toward 17 over 10 years
    long_term_cape = 17.0
    if year < 10:
        cape = current_cape + (long_term_cape - current_cape) * (year / 10.0)
    else:
        cape = long_term_cape

    cape_rate = 1.0 / cape
    blended_rate = cape_weight * cape_rate + (1 - cape_weight) * base_rate

    return portfolio * blended_rate


def floor_ceiling(
    portfolio: np.ndarray | float,
    year: int,
    floor_amount: float = 60000.0,
    ceiling_amount: float = 150000.0,
    target_rate: float = 0.045,
    **kwargs,
) -> np.ndarray | float:
    """Strategy 6: Floor-and-Ceiling.
    Target = portfolio * target_rate, clamped between floor and ceiling.
    """
    target = portfolio * target_rate

    if isinstance(portfolio, np.ndarray):
        return np.clip(target, floor_amount, ceiling_amount)
    else:
        return max(floor_amount, min(ceiling_amount, target))


# ============================================================
# Dispatcher
# ============================================================

STRATEGY_FUNCTIONS = {
    "constant_dollar": constant_dollar,
    "vpw": vpw,
    "guardrails": guardrails,
    "vanguard_dynamic": vanguard_dynamic,
    "cape_based": cape_based,
    "floor_ceiling": floor_ceiling,
}


def calculate_withdrawal(
    strategy: str,
    portfolio: np.ndarray | float,
    year: int,
    **params,
) -> np.ndarray | float:
    """Dispatch to the appropriate withdrawal strategy function."""
    fn = STRATEGY_FUNCTIONS.get(strategy)
    if fn is None:
        raise ValueError(f"Unknown withdrawal strategy: {strategy}")
    return fn(portfolio=portfolio, year=year, **params)
