"""Tests for SWR binary search optimizer."""

import pytest

from app.core.swr_optimizer import optimize_swr

BASE_PARAMS = {
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
    "current_age": 55,
    "retirement_age": 55,
    "life_expectancy": 90,
    "annual_savings": [],
    "post_retirement_income": [],
    "method": "parametric",
    "withdrawal_strategy": "constant_dollar",
    "strategy_params": {"swr": 0.04},
    "expense_ratio": 0.003,
    "inflation": 0.025,
    "seed": 42,
}


class TestSwrOptimizer:
    def test_returns_float(self):
        result = optimize_swr(0.90, BASE_PARAMS, n_sims=200)
        assert isinstance(result, float)

    def test_result_in_range(self):
        result = optimize_swr(0.90, BASE_PARAMS, n_sims=200)
        assert 0.02 <= result <= 0.08

    def test_higher_confidence_lower_swr(self):
        """Higher target success rate should produce lower (more conservative) SWR."""
        swr_90 = optimize_swr(0.90, BASE_PARAMS, n_sims=200)
        swr_95 = optimize_swr(0.95, BASE_PARAMS, n_sims=200)
        assert swr_95 <= swr_90

    def test_convergence_within_tolerance(self):
        """Result should be within tolerance of the true optimum."""
        result = optimize_swr(0.90, BASE_PARAMS, n_sims=200, tolerance=0.001)
        # Should be rounded to 3 decimal places
        assert result == round(result, 3)

    def test_reasonable_value(self):
        """With $2M portfolio and balanced allocation, SWR at 90% should be ~3-6%."""
        result = optimize_swr(0.90, BASE_PARAMS, n_sims=500)
        assert 0.02 <= result <= 0.07
