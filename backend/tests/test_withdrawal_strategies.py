"""
Shared test vectors for withdrawal strategies.
Same inputs/outputs used in frontend withdrawal.test.ts for TS/Python parity.
"""

import numpy as np
import pytest

from app.core.withdrawal_strategies import (
    calculate_withdrawal,
    cape_based,
    constant_dollar,
    floor_ceiling,
    guardrails,
    vanguard_dynamic,
    vpw,
)

# ============================================================
# Shared Test Vectors (must match frontend withdrawal.test.ts)
# ============================================================

PORTFOLIO = 2_000_000.0
INFLATION = 0.025
SWR = 0.04
INITIAL_WITHDRAWAL = PORTFOLIO * SWR  # $80,000


class TestConstantDollar:
    def test_year_0(self):
        result = constant_dollar(PORTFOLIO, year=0, initial_withdrawal=INITIAL_WITHDRAWAL, inflation=INFLATION)
        assert result == pytest.approx(80_000.0, rel=1e-6)

    def test_year_1(self):
        result = constant_dollar(PORTFOLIO, year=1, initial_withdrawal=INITIAL_WITHDRAWAL, inflation=INFLATION)
        assert result == pytest.approx(82_000.0, rel=1e-6)

    def test_year_10(self):
        result = constant_dollar(PORTFOLIO, year=10, initial_withdrawal=INITIAL_WITHDRAWAL, inflation=INFLATION)
        expected = 80_000.0 * (1.025**10)
        assert result == pytest.approx(expected, rel=1e-6)

    def test_ignores_portfolio_value(self):
        """Constant dollar doesn't depend on current portfolio."""
        r1 = constant_dollar(1_000_000, year=5, initial_withdrawal=INITIAL_WITHDRAWAL, inflation=INFLATION)
        r2 = constant_dollar(5_000_000, year=5, initial_withdrawal=INITIAL_WITHDRAWAL, inflation=INFLATION)
        assert r1 == pytest.approx(r2, rel=1e-10)

    def test_vectorized(self):
        portfolios = np.array([1_000_000, 2_000_000, 3_000_000])
        result = constant_dollar(portfolios, year=1, initial_withdrawal=INITIAL_WITHDRAWAL, inflation=INFLATION)
        assert result == pytest.approx(82_000.0, rel=1e-6)


class TestVPW:
    def test_30_years_3pct(self):
        """VPW with 30 years remaining at 3% real return."""
        result = vpw(PORTFOLIO, year=0, remaining_years=30, expected_real_return=0.03)
        # PMT(0.03, 30, -1, 0) ≈ 0.05102
        assert result == pytest.approx(PORTFOLIO * 0.05102, rel=0.01)

    def test_20_years_3pct(self):
        result = vpw(PORTFOLIO, year=0, remaining_years=20, expected_real_return=0.03)
        # PMT(0.03, 20, -1, 0) ≈ 0.06722
        assert result == pytest.approx(PORTFOLIO * 0.06722, rel=0.01)

    def test_10_years_3pct(self):
        result = vpw(PORTFOLIO, year=0, remaining_years=10, expected_real_return=0.03)
        # PMT(0.03, 10, -1, 0) ≈ 0.11723
        assert result == pytest.approx(PORTFOLIO * 0.11723, rel=0.01)

    def test_1_year_remaining(self):
        result = vpw(PORTFOLIO, year=0, remaining_years=1, expected_real_return=0.03)
        # Should withdraw nearly all
        assert result == pytest.approx(PORTFOLIO, rel=0.05)

    def test_0_years_remaining(self):
        result = vpw(PORTFOLIO, year=0, remaining_years=0)
        assert result == pytest.approx(PORTFOLIO, rel=1e-6)

    def test_zero_return(self):
        result = vpw(PORTFOLIO, year=0, remaining_years=20, expected_real_return=0.0)
        assert result == pytest.approx(PORTFOLIO / 20, rel=1e-6)

    def test_rate_increases_as_years_decrease(self):
        """VPW rate should increase as remaining years decrease."""
        r30 = vpw(PORTFOLIO, year=0, remaining_years=30, expected_real_return=0.03)
        r20 = vpw(PORTFOLIO, year=0, remaining_years=20, expected_real_return=0.03)
        r10 = vpw(PORTFOLIO, year=0, remaining_years=10, expected_real_return=0.03)
        assert r10 > r20 > r30

    def test_vectorized(self):
        portfolios = np.array([1_000_000, 2_000_000, 3_000_000])
        result = vpw(portfolios, year=0, remaining_years=30, expected_real_return=0.03)
        assert len(result) == 3
        assert result[1] == pytest.approx(2 * result[0], rel=1e-6)


class TestGuardrails:
    def test_year_0(self):
        result = guardrails(
            PORTFOLIO, year=0,
            initial_withdrawal=100_000, prev_withdrawal=0,
            inflation=INFLATION, initial_rate=0.05,
        )
        assert result == pytest.approx(100_000.0, rel=1e-6)

    def test_normal_inflation_adjustment(self):
        """When spending rate is within guardrails, just adjust for inflation."""
        result = guardrails(
            PORTFOLIO, year=1,
            initial_withdrawal=100_000, prev_withdrawal=100_000,
            inflation=INFLATION, initial_rate=0.05,
        )
        assert result == pytest.approx(102_500.0, rel=1e-6)

    def test_capital_preservation_cut(self):
        """When current rate exceeds ceiling, cut withdrawal by adjustment_size."""
        # Portfolio crashed to $800K, prev withdrawal $100K
        # inflation_adjusted = 102,500, current_rate = 102500/800000 = 12.8%
        # ceiling = 0.05 * 1.2 = 6%, so 12.8% > 6% → cut
        result = guardrails(
            800_000, year=1,
            initial_withdrawal=100_000, prev_withdrawal=100_000,
            inflation=INFLATION, initial_rate=0.05,
            ceiling_trigger=1.20, adjustment_size=0.10,
        )
        assert result == pytest.approx(102_500 * 0.90, rel=1e-6)

    def test_prosperity_raise(self):
        """When current rate drops below floor, raise withdrawal."""
        # Portfolio soared to $5M, prev withdrawal $100K
        # inflation_adjusted = 102,500, current_rate = 102500/5000000 = 2.05%
        # floor = 0.05 * 0.80 = 4%, so 2.05% < 4% → raise
        result = guardrails(
            5_000_000, year=1,
            initial_withdrawal=100_000, prev_withdrawal=100_000,
            inflation=INFLATION, initial_rate=0.05,
            floor_trigger=0.80, adjustment_size=0.10,
        )
        assert result == pytest.approx(102_500 * 1.10, rel=1e-6)


class TestVanguardDynamic:
    def test_year_0(self):
        result = vanguard_dynamic(
            PORTFOLIO, year=0,
            initial_withdrawal=INITIAL_WITHDRAWAL, prev_withdrawal=0,
            inflation=INFLATION, swr=SWR,
        )
        assert result == pytest.approx(INITIAL_WITHDRAWAL, rel=1e-6)

    def test_target_within_bounds(self):
        """When target is within ceiling/floor, use target directly."""
        result = vanguard_dynamic(
            PORTFOLIO, year=1,
            initial_withdrawal=INITIAL_WITHDRAWAL, prev_withdrawal=INITIAL_WITHDRAWAL,
            inflation=INFLATION, swr=SWR,
            ceiling=0.05, floor=0.025,
        )
        # target = 2M * 0.04 = 80K, inflation_adj = 82K
        # ceiling_limit = 82K * 1.05 = 86.1K, floor_limit = 82K * 0.975 = 79.95K
        # 80K is within [79.95K, 86.1K]
        assert result == pytest.approx(80_000.0, rel=1e-6)

    def test_ceiling_hit(self):
        """When portfolio grows a lot, ceiling limits increase."""
        result = vanguard_dynamic(
            3_000_000, year=1,
            initial_withdrawal=INITIAL_WITHDRAWAL, prev_withdrawal=INITIAL_WITHDRAWAL,
            inflation=INFLATION, swr=SWR,
            ceiling=0.05, floor=0.025,
        )
        # target = 3M * 0.04 = 120K, inflation_adj = 82K
        # ceiling_limit = 82K * 1.05 = 86.1K → use ceiling
        assert result == pytest.approx(82_000 * 1.05, rel=1e-6)

    def test_floor_hit(self):
        """When portfolio drops, floor limits decrease."""
        result = vanguard_dynamic(
            1_000_000, year=1,
            initial_withdrawal=INITIAL_WITHDRAWAL, prev_withdrawal=INITIAL_WITHDRAWAL,
            inflation=INFLATION, swr=SWR,
            ceiling=0.05, floor=0.025,
        )
        # target = 1M * 0.04 = 40K, inflation_adj = 82K
        # floor_limit = 82K * 0.975 = 79.95K → use floor
        assert result == pytest.approx(82_000 * 0.975, rel=1e-6)


class TestCapeBased:
    def test_year_0_high_cape(self):
        """With high CAPE (30), withdrawal rate is low."""
        result = cape_based(PORTFOLIO, year=0, base_rate=0.04, cape_weight=0.50, current_cape=30.0)
        # cape_rate = 1/30 = 0.0333, blended = 0.5 * 0.0333 + 0.5 * 0.04 = 0.0367
        expected_rate = 0.5 * (1 / 30) + 0.5 * 0.04
        assert result == pytest.approx(PORTFOLIO * expected_rate, rel=1e-6)

    def test_year_10_mean_reverted(self):
        """After 10 years, CAPE should be at long-term mean (17)."""
        result = cape_based(PORTFOLIO, year=10, base_rate=0.04, cape_weight=0.50, current_cape=30.0)
        expected_rate = 0.5 * (1 / 17) + 0.5 * 0.04
        assert result == pytest.approx(PORTFOLIO * expected_rate, rel=1e-6)

    def test_year_5_midway_reversion(self):
        result = cape_based(PORTFOLIO, year=5, base_rate=0.04, cape_weight=0.50, current_cape=30.0)
        mid_cape = 30 + (17 - 30) * 0.5  # 23.5
        expected_rate = 0.5 * (1 / mid_cape) + 0.5 * 0.04
        assert result == pytest.approx(PORTFOLIO * expected_rate, rel=1e-6)

    def test_year_20_still_at_mean(self):
        result = cape_based(PORTFOLIO, year=20, base_rate=0.04, cape_weight=0.50, current_cape=30.0)
        expected_rate = 0.5 * (1 / 17) + 0.5 * 0.04
        assert result == pytest.approx(PORTFOLIO * expected_rate, rel=1e-6)


class TestFloorCeiling:
    def test_within_bounds(self):
        """When target is between floor and ceiling, use target."""
        result = floor_ceiling(PORTFOLIO, year=0, floor_amount=60_000, ceiling_amount=150_000, target_rate=0.045)
        # target = 2M * 0.045 = 90K, within [60K, 150K]
        assert result == pytest.approx(90_000.0, rel=1e-6)

    def test_floor_hit(self):
        """When portfolio is small, floor kicks in."""
        result = floor_ceiling(500_000, year=0, floor_amount=60_000, ceiling_amount=150_000, target_rate=0.045)
        # target = 500K * 0.045 = 22.5K < 60K → floor
        assert result == pytest.approx(60_000.0, rel=1e-6)

    def test_ceiling_hit(self):
        """When portfolio is large, ceiling caps withdrawal."""
        result = floor_ceiling(5_000_000, year=0, floor_amount=60_000, ceiling_amount=150_000, target_rate=0.045)
        # target = 5M * 0.045 = 225K > 150K → ceiling
        assert result == pytest.approx(150_000.0, rel=1e-6)

    def test_vectorized(self):
        portfolios = np.array([500_000, 2_000_000, 5_000_000])
        result = floor_ceiling(portfolios, year=0, floor_amount=60_000, ceiling_amount=150_000, target_rate=0.045)
        np.testing.assert_allclose(result, [60_000, 90_000, 150_000], rtol=1e-6)


class TestDispatcher:
    def test_constant_dollar_dispatch(self):
        result = calculate_withdrawal(
            "constant_dollar", PORTFOLIO, year=0,
            initial_withdrawal=INITIAL_WITHDRAWAL, inflation=INFLATION,
        )
        assert result == pytest.approx(INITIAL_WITHDRAWAL, rel=1e-6)

    def test_unknown_strategy_raises(self):
        with pytest.raises(ValueError, match="Unknown withdrawal strategy"):
            calculate_withdrawal("invalid_strategy", PORTFOLIO, year=0)

    def test_all_strategies_callable(self):
        """Every registered strategy should be callable without error."""
        strategies = {
            "constant_dollar": {"initial_withdrawal": INITIAL_WITHDRAWAL, "inflation": INFLATION},
            "vpw": {"remaining_years": 30, "expected_real_return": 0.03},
            "guardrails": {
                "initial_withdrawal": 100_000, "prev_withdrawal": 100_000,
                "inflation": INFLATION, "initial_rate": 0.05,
            },
            "vanguard_dynamic": {
                "initial_withdrawal": INITIAL_WITHDRAWAL, "prev_withdrawal": INITIAL_WITHDRAWAL,
                "inflation": INFLATION, "swr": SWR,
            },
            "cape_based": {"base_rate": 0.04, "cape_weight": 0.50, "current_cape": 30.0},
            "floor_ceiling": {"floor_amount": 60_000, "ceiling_amount": 150_000, "target_rate": 0.045},
        }
        for name, params in strategies.items():
            result = calculate_withdrawal(name, PORTFOLIO, year=0, **params)
            assert result > 0, f"{name} returned non-positive withdrawal"
