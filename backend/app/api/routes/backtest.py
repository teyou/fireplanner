"""Historical backtesting API route."""

import time

from fastapi import APIRouter

from app.core.backtest import generate_heatmap, run_backtest
from app.models.schemas import BacktestRequest, BacktestResponse

router = APIRouter()


@router.post("/backtest", response_model=BacktestResponse)
async def backtest_endpoint(request: BacktestRequest) -> BacktestResponse:
    """Run historical backtest with rolling windows."""
    start = time.perf_counter()

    # Extract strategy params
    sp = request.strategy_params
    strategy_key = request.withdrawal_strategy.value

    param_map = {
        "constant_dollar": lambda: {"swr": sp.constant_dollar.swr},
        "vpw": lambda: {
            "expected_real_return": sp.vpw.expected_real_return,
            "target_end_value": sp.vpw.target_end_value,
        },
        "guardrails": lambda: {
            "initial_rate": sp.guardrails.initial_rate,
            "ceiling_trigger": sp.guardrails.ceiling_trigger,
            "floor_trigger": sp.guardrails.floor_trigger,
            "adjustment_size": sp.guardrails.adjustment_size,
        },
        "vanguard_dynamic": lambda: {
            "swr": sp.vanguard_dynamic.swr,
            "ceiling": sp.vanguard_dynamic.ceiling,
            "floor": sp.vanguard_dynamic.floor,
        },
        "cape_based": lambda: {
            "base_rate": sp.cape_based.base_rate,
            "cape_weight": sp.cape_based.cape_weight,
            "current_cape": sp.cape_based.current_cape,
        },
        "floor_ceiling": lambda: {
            "floor_amount": sp.floor_ceiling.floor,
            "ceiling_amount": sp.floor_ceiling.ceiling,
            "target_rate": sp.floor_ceiling.target_rate,
        },
    }
    strategy_params_dict = param_map.get(strategy_key, lambda: {})()

    params = {
        "initial_portfolio": request.initial_portfolio,
        "allocation_weights": request.allocation_weights,
        "swr": request.swr,
        "retirement_duration": request.retirement_duration,
        "dataset": request.dataset.value,
        "blend_ratio": request.blend_ratio,
        "expense_ratio": request.expense_ratio,
        "inflation": request.inflation,
        "withdrawal_strategy": strategy_key,
        "strategy_params": strategy_params_dict,
    }

    result = run_backtest(params)

    heatmap = None
    if request.include_heatmap:
        heatmap = generate_heatmap(params)

    elapsed_ms = (time.perf_counter() - start) * 1000

    return BacktestResponse(
        results=result["results"],
        summary=result["summary"],
        heatmap=heatmap,
        computation_time_ms=elapsed_ms,
    )
