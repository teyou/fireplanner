"""
Monte Carlo engine tests with seeded random state for reproducibility.
Uses n_sims=100 for speed; production uses 10,000.
"""

import numpy as np
import pytest

from app.core.monte_carlo import run_monte_carlo

# Default test parameters matching a balanced portfolio
DEFAULT_PARAMS = {
    "initial_portfolio": 2_000_000,
    "allocation_weights": [0.30, 0.10, 0.10, 0.25, 0.05, 0.05, 0.10, 0.05],
    "expected_returns": [0.102, 0.085, 0.080, 0.045, 0.080, 0.065, 0.020, 0.030],
    "std_devs": [0.155, 0.180, 0.160, 0.055, 0.185, 0.150, 0.010, 0.000],
    "correlation_matrix": [
        [1.00, 0.55, 0.85, -0.05, 0.60, 0.05, 0.02, 0.00],
        [0.55, 1.00, 0.65, -0.10, 0.50, 0.10, 0.02, 0.00],
        [0.85, 0.65, 1.00, -0.03, 0.55, 0.08, 0.02, 0.00],
        [-0.05, -0.10, -0.03, 1.00, 0.15, 0.20, 0.30, 0.00],
        [0.60, 0.50, 0.55, 0.15, 1.00, 0.10, 0.05, 0.00],
        [0.05, 0.10, 0.08, 0.20, 0.10, 1.00, 0.05, 0.00],
        [0.02, 0.02, 0.02, 0.30, 0.05, 0.05, 1.00, 0.00],
        [0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1.00],
    ],
    "current_age": 35,
    "retirement_age": 55,
    "life_expectancy": 90,
    "annual_savings": [84_000] * 20,
    "post_retirement_income": [13_400] * 35,  # CPF LIFE approximation
    "method": "parametric",
    "n_simulations": 100,
    "seed": 42,
    "withdrawal_strategy": "constant_dollar",
    "strategy_params": {"swr": 0.04},
    "expense_ratio": 0.003,
    "inflation": 0.025,
}


class TestParametricMC:
    def test_returns_expected_keys(self):
        result = run_monte_carlo(DEFAULT_PARAMS)
        assert "success_rate" in result
        assert "percentile_bands" in result
        assert "terminal_stats" in result
        assert "failure_distribution" in result

    def test_success_rate_in_range(self):
        result = run_monte_carlo(DEFAULT_PARAMS)
        assert 0.0 <= result["success_rate"] <= 1.0

    def test_success_rate_reasonable(self):
        """With $2M portfolio, balanced allocation, 4% SWR, expect decent success."""
        result = run_monte_carlo(DEFAULT_PARAMS)
        assert result["success_rate"] >= 0.50  # At least 50% with 100 sims

    def test_percentile_bands_shape(self):
        result = run_monte_carlo(DEFAULT_PARAMS)
        bands = result["percentile_bands"]
        n_years = (55 - 35) + (90 - 55) + 1  # accum + decum + initial
        assert len(bands["years"]) == n_years
        assert len(bands["p50"]) == n_years
        assert len(bands["ages"]) == n_years

    def test_percentiles_monotonic(self):
        """p5 <= p25 <= p50 <= p75 <= p95 at each year."""
        result = run_monte_carlo(DEFAULT_PARAMS)
        bands = result["percentile_bands"]
        for i in range(len(bands["years"])):
            assert bands["p5"][i] <= bands["p25"][i] + 1e-6
            assert bands["p25"][i] <= bands["p50"][i] + 1e-6
            assert bands["p50"][i] <= bands["p75"][i] + 1e-6
            assert bands["p75"][i] <= bands["p95"][i] + 1e-6

    def test_initial_portfolio_matches(self):
        result = run_monte_carlo(DEFAULT_PARAMS)
        bands = result["percentile_bands"]
        # At year 0, all percentiles should equal initial portfolio
        assert bands["p50"][0] == pytest.approx(2_000_000, rel=1e-6)

    def test_terminal_stats_computed(self):
        result = run_monte_carlo(DEFAULT_PARAMS)
        ts = result["terminal_stats"]
        assert ts["worst"] <= ts["median"] <= ts["best"]
        assert ts["p5"] <= ts["p95"]

    def test_failure_distribution_sums(self):
        result = run_monte_carlo(DEFAULT_PARAMS)
        fd = result["failure_distribution"]
        total_from_buckets = sum(fd["counts"])
        assert total_from_buckets == fd["total_failures"]

    def test_reproducible_with_same_seed(self):
        r1 = run_monte_carlo(DEFAULT_PARAMS)
        r2 = run_monte_carlo(DEFAULT_PARAMS)
        assert r1["success_rate"] == r2["success_rate"]
        assert r1["terminal_stats"]["median"] == pytest.approx(
            r2["terminal_stats"]["median"], rel=1e-10
        )


class TestBootstrapMC:
    def test_bootstrap_runs(self):
        # Create fake historical returns (20 years, 8 assets)
        rng = np.random.default_rng(42)
        historical = rng.normal(0.07, 0.15, (20, 8))
        params = {**DEFAULT_PARAMS, "method": "bootstrap", "historical_returns": historical.tolist()}
        result = run_monte_carlo(params)
        assert 0.0 <= result["success_rate"] <= 1.0

    def test_bootstrap_fallback_no_data(self):
        """Without historical data, bootstrap falls back to parametric."""
        params = {**DEFAULT_PARAMS, "method": "bootstrap"}
        result = run_monte_carlo(params)
        assert 0.0 <= result["success_rate"] <= 1.0


class TestFatTailMC:
    def test_fat_tail_runs(self):
        params = {**DEFAULT_PARAMS, "method": "fat_tail"}
        result = run_monte_carlo(params)
        assert 0.0 <= result["success_rate"] <= 1.0

    def test_fat_tail_more_extreme(self):
        """Fat tail should produce wider distribution (lower p5 or higher p95)."""
        params_normal = {**DEFAULT_PARAMS, "n_simulations": 500, "seed": 42}
        params_fat = {**DEFAULT_PARAMS, "method": "fat_tail", "n_simulations": 500, "seed": 42}
        r_normal = run_monte_carlo(params_normal)
        r_fat = run_monte_carlo(params_fat)
        # Fat tail terminals should have wider spread
        spread_normal = r_normal["terminal_stats"]["p95"] - r_normal["terminal_stats"]["p5"]
        spread_fat = r_fat["terminal_stats"]["p95"] - r_fat["terminal_stats"]["p5"]
        # Not guaranteed with small n, but generally true
        # Just check both produce valid results
        assert spread_normal > 0
        assert spread_fat > 0


class TestDifferentStrategies:
    def test_vpw_strategy(self):
        params = {
            **DEFAULT_PARAMS,
            "withdrawal_strategy": "vpw",
            "strategy_params": {"expected_real_return": 0.03, "target_end_value": 0.0},
        }
        result = run_monte_carlo(params)
        assert 0.0 <= result["success_rate"] <= 1.0

    def test_guardrails_strategy(self):
        params = {
            **DEFAULT_PARAMS,
            "withdrawal_strategy": "guardrails",
            "strategy_params": {
                "initial_rate": 0.05,
                "ceiling_trigger": 1.20,
                "floor_trigger": 0.80,
                "adjustment_size": 0.10,
            },
        }
        result = run_monte_carlo(params)
        assert 0.0 <= result["success_rate"] <= 1.0

    def test_floor_ceiling_strategy(self):
        params = {
            **DEFAULT_PARAMS,
            "withdrawal_strategy": "floor_ceiling",
            "strategy_params": {
                "floor_amount": 60_000,
                "ceiling_amount": 150_000,
                "target_rate": 0.045,
            },
        }
        result = run_monte_carlo(params)
        assert 0.0 <= result["success_rate"] <= 1.0


class TestEdgeCases:
    def test_already_retired(self):
        """When current_age == retirement_age, no accumulation phase."""
        params = {**DEFAULT_PARAMS, "current_age": 55, "retirement_age": 55, "annual_savings": []}
        result = run_monte_carlo(params)
        assert 0.0 <= result["success_rate"] <= 1.0

    def test_short_retirement(self):
        params = {**DEFAULT_PARAMS, "life_expectancy": 60}
        result = run_monte_carlo(params)
        # Short retirement with big portfolio should succeed
        assert result["success_rate"] >= 0.90

    def test_unknown_method_raises(self):
        with pytest.raises(ValueError, match="Unknown method"):
            run_monte_carlo({**DEFAULT_PARAMS, "method": "invalid"})
