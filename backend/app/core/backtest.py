"""
Historical backtesting engine.
Bengen-style rolling window analysis over every possible start year.
Supports US, SG, and blended datasets.
"""

import os

import numpy as np
import pandas as pd

from app.core.withdrawal_strategies import (
    cape_based,
    constant_dollar,
    floor_ceiling,
    guardrails,
    vanguard_dynamic,
    vpw,
)

# Load historical data once at module level
_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
_historical_df: pd.DataFrame | None = None


def _get_historical_data() -> pd.DataFrame:
    """Load historical returns CSV. Cached after first call."""
    global _historical_df
    if _historical_df is None:
        csv_path = os.path.join(_DATA_DIR, "historical_returns.csv")
        _historical_df = pd.read_csv(csv_path, comment="#")
    return _historical_df


# Asset class column mappings
US_COLUMNS = [
    "US_Equities", "Intl_Equities", "US_Bonds", "REITs", "Gold", "Cash",
]
SG_COLUMNS = [
    "SG_Equities",
]


def _get_portfolio_returns(
    df: pd.DataFrame,
    weights: np.ndarray,
    dataset: str,
    blend_ratio: float,
) -> np.ndarray:
    """Compute annual portfolio returns from historical data and allocation weights.

    Simplified: uses the 8-column returns weighted by allocation.
    Asset class order: US Eq, SG Eq, Intl Eq, Bonds, REITs, Gold, Cash, CPF
    """
    columns = [
        "US_Equities", "SG_Equities", "Intl_Equities", "US_Bonds",
        "REITs", "Gold", "Cash", "CPF_Blended",
    ]

    # Fill missing columns with 0
    for col in columns:
        if col not in df.columns:
            df = df.copy()
            df[col] = 0.0

    returns_matrix = df[columns].values  # (n_years, 8)

    if dataset == "sg_only":
        # Zero out US-specific returns, boost SG
        modified = returns_matrix.copy()
        # Use SG equity for all equity allocation
        modified[:, 0] = modified[:, 1]  # US Eq -> SG Eq
        modified[:, 2] = modified[:, 1]  # Intl Eq -> SG Eq
        portfolio_returns = modified @ weights
    elif dataset == "blended":
        # Blend US and SG equity returns
        modified = returns_matrix.copy()
        us_eq = modified[:, 0]
        sg_eq = modified[:, 1]
        blended_eq = blend_ratio * us_eq + (1 - blend_ratio) * sg_eq
        modified[:, 0] = blended_eq
        modified[:, 2] = blended_eq
        portfolio_returns = modified @ weights
    else:
        # US only (default)
        portfolio_returns = returns_matrix @ weights

    return portfolio_returns


def _run_single_window(
    portfolio_returns: np.ndarray,
    start_idx: int,
    duration: int,
    initial_portfolio: float,
    swr: float,
    expense_ratio: float,
    inflation_rates: np.ndarray | None,
    inflation_fixed: float,
    strategy: str,
    strategy_params: dict,
) -> dict:
    """Run backtest for a single rolling window starting at start_idx."""
    portfolio = initial_portfolio
    initial_withdrawal = initial_portfolio * swr
    prev_withdrawal = 0.0
    total_withdrawn = 0.0
    min_balance = initial_portfolio
    worst_year_offset = 0
    best_year_offset = 0
    best_balance = initial_portfolio
    survived = True

    for y in range(duration):
        if start_idx + y >= len(portfolio_returns):
            break

        if portfolio <= 0:
            survived = False
            break

        ret = portfolio_returns[start_idx + y]
        inf = float(inflation_rates[start_idx + y]) if inflation_rates is not None and start_idx + y < len(inflation_rates) else inflation_fixed
        remaining = duration - y

        # Calculate withdrawal
        if strategy == "constant_dollar":
            withdrawal = constant_dollar(portfolio, year=y, initial_withdrawal=initial_withdrawal, inflation=inf)
        elif strategy == "vpw":
            withdrawal = vpw(portfolio, year=y, remaining_years=remaining,
                             expected_real_return=strategy_params.get("expected_real_return", 0.03),
                             target_end_value=strategy_params.get("target_end_value", 0.0))
        elif strategy == "guardrails":
            withdrawal = guardrails(portfolio, year=y, initial_withdrawal=initial_withdrawal,
                                    prev_withdrawal=prev_withdrawal, inflation=inf,
                                    initial_rate=strategy_params.get("initial_rate", 0.05),
                                    ceiling_trigger=strategy_params.get("ceiling_trigger", 1.20),
                                    floor_trigger=strategy_params.get("floor_trigger", 0.80),
                                    adjustment_size=strategy_params.get("adjustment_size", 0.10))
        elif strategy == "vanguard_dynamic":
            withdrawal = vanguard_dynamic(portfolio, year=y, initial_withdrawal=initial_withdrawal,
                                          prev_withdrawal=prev_withdrawal, inflation=inf,
                                          swr=strategy_params.get("swr", 0.04),
                                          ceiling=strategy_params.get("ceiling", 0.05),
                                          floor=strategy_params.get("floor", 0.025))
        elif strategy == "cape_based":
            withdrawal = cape_based(portfolio, year=y,
                                    base_rate=strategy_params.get("base_rate", 0.04),
                                    cape_weight=strategy_params.get("cape_weight", 0.50),
                                    current_cape=strategy_params.get("current_cape", 30.0))
        elif strategy == "floor_ceiling":
            withdrawal = floor_ceiling(portfolio, year=y,
                                       floor_amount=strategy_params.get("floor_amount", 60000.0),
                                       ceiling_amount=strategy_params.get("ceiling_amount", 150000.0),
                                       target_rate=strategy_params.get("target_rate", 0.045))
        else:
            withdrawal = constant_dollar(portfolio, year=y, initial_withdrawal=initial_withdrawal, inflation=inf)

        # Ensure scalar
        if hasattr(withdrawal, '__len__'):
            withdrawal = float(withdrawal)

        withdrawal = min(withdrawal, portfolio)
        total_withdrawn += withdrawal
        prev_withdrawal = withdrawal

        portfolio = (portfolio - withdrawal) * (1 + ret - expense_ratio)

        if portfolio < min_balance:
            min_balance = portfolio
            worst_year_offset = y
        if portfolio > best_balance:
            best_balance = portfolio
            best_year_offset = y

        if portfolio <= 0:
            survived = False
            portfolio = 0
            break

    return {
        "survived": survived,
        "ending_balance": max(0, portfolio),
        "min_balance": max(0, min_balance),
        "worst_year": worst_year_offset,
        "best_year": best_year_offset,
        "total_withdrawn": total_withdrawn,
    }


def run_backtest(params: dict) -> dict:
    """
    Run historical backtest with rolling windows.

    Returns per-year results and summary statistics.
    """
    df = _get_historical_data()

    initial_portfolio = params["initial_portfolio"]
    weights = np.array(params["allocation_weights"])
    swr = params.get("swr", 0.04)
    duration = params.get("retirement_duration", 30)
    dataset = params.get("dataset", "us_only")
    blend_ratio = params.get("blend_ratio", 0.70)
    expense_ratio = params.get("expense_ratio", 0.003)
    inflation_fixed = params.get("inflation", 0.025)
    strategy = params.get("withdrawal_strategy", "constant_dollar")
    strategy_params = params.get("strategy_params", {})

    portfolio_returns = _get_portfolio_returns(df, weights, dataset, blend_ratio)
    years = df["Year"].values

    # Get inflation rates if available
    inflation_col = "US_CPI" if dataset != "sg_only" else "SG_CPI"
    inflation_rates = df[inflation_col].values / 100 if inflation_col in df.columns else None

    results = []
    n_total = len(portfolio_returns) - duration + 1

    for i in range(max(1, n_total)):
        start_year = int(years[i])
        end_year = start_year + duration - 1

        result = _run_single_window(
            portfolio_returns=portfolio_returns,
            start_idx=i,
            duration=duration,
            initial_portfolio=initial_portfolio,
            swr=swr,
            expense_ratio=expense_ratio,
            inflation_rates=inflation_rates,
            inflation_fixed=inflation_fixed,
            strategy=strategy,
            strategy_params=strategy_params,
        )

        results.append({
            "start_year": start_year,
            "end_year": end_year,
            "survived": result["survived"],
            "ending_balance": result["ending_balance"],
            "min_balance": result["min_balance"],
            "worst_year": start_year + result["worst_year"],
            "best_year": start_year + result["best_year"],
            "total_withdrawn": result["total_withdrawn"],
        })

    # Summary
    successful = sum(1 for r in results if r["survived"])
    failed = len(results) - successful
    success_rate = successful / len(results) if results else 0

    ending_balances = [r["ending_balance"] for r in results]
    total_withdrawals = [r["total_withdrawn"] for r in results]

    worst_start = min(results, key=lambda r: r["ending_balance"])["start_year"] if results else 0
    best_start = max(results, key=lambda r: r["ending_balance"])["start_year"] if results else 0

    summary = {
        "total_periods": len(results),
        "successful_periods": successful,
        "failed_periods": failed,
        "success_rate": success_rate,
        "worst_start_year": worst_start,
        "best_start_year": best_start,
        "median_ending_balance": float(np.median(ending_balances)) if ending_balances else 0,
        "average_total_withdrawn": float(np.mean(total_withdrawals)) if total_withdrawals else 0,
    }

    return {
        "results": results,
        "summary": summary,
    }


def generate_heatmap(
    params: dict,
    swr_range: tuple[float, float] = (0.03, 0.06),
    swr_step: float = 0.005,
    duration_range: tuple[int, int] = (15, 45),
    duration_step: int = 5,
) -> dict:
    """Generate SWR x Duration success rate heatmap."""
    swr_values = []
    swr = swr_range[0]
    while swr <= swr_range[1] + 1e-9:
        swr_values.append(round(swr, 4))
        swr += swr_step

    duration_values = list(range(duration_range[0], duration_range[1] + 1, duration_step))

    success_rates = []
    for s in swr_values:
        row = []
        for d in duration_values:
            p = dict(params)
            p["swr"] = s
            p["retirement_duration"] = d
            result = run_backtest(p)
            row.append(result["summary"]["success_rate"])
        success_rates.append(row)

    return {
        "swr_values": swr_values,
        "duration_values": duration_values,
        "success_rates": success_rates,
    }
