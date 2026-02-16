"""Sequence risk stress testing API route."""

import time

from fastapi import APIRouter

from app.core.sequence_risk import run_sequence_risk
from app.models.schemas import SequenceRiskRequest, SequenceRiskResponse

router = APIRouter()


@router.post("/sequence-risk", response_model=SequenceRiskResponse)
async def sequence_risk_endpoint(request: SequenceRiskRequest) -> SequenceRiskResponse:
    """Run sequence risk analysis comparing normal vs crisis scenarios."""
    start = time.perf_counter()

    strategy_params_dict = {}
    sp = request.strategy_params
    strategy_key = request.withdrawal_strategy.value

    # Extract the relevant strategy params
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
        "expected_returns": request.expected_returns,
        "std_devs": request.std_devs,
        "correlation_matrix": request.correlation_matrix,
        "retirement_age": request.retirement_age,
        "life_expectancy": request.life_expectancy,
        "withdrawal_strategy": strategy_key,
        "strategy_params": strategy_params_dict,
        "crisis": {
            "id": request.crisis.id,
            "name": request.crisis.name,
            "equity_return_sequence": request.crisis.equity_return_sequence,
            "duration_years": request.crisis.duration_years,
        },
        "n_simulations": request.n_simulations,
        "seed": request.seed,
        "expense_ratio": request.expense_ratio,
        "inflation": request.inflation,
        "post_retirement_income": request.post_retirement_income,
    }

    result = run_sequence_risk(params)

    elapsed_ms = (time.perf_counter() - start) * 1000

    return SequenceRiskResponse(
        normal_success_rate=result["normal_success_rate"],
        crisis_success_rate=result["crisis_success_rate"],
        success_degradation=result["success_degradation"],
        normal_percentile_bands=result["normal_percentile_bands"],
        crisis_percentile_bands=result["crisis_percentile_bands"],
        mitigations=result["mitigations"],
        computation_time_ms=elapsed_ms,
    )
