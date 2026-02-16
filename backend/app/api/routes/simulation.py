"""Monte Carlo simulation API route with optional Redis caching."""

import hashlib
import json
import time

from fastapi import APIRouter

from app.config import settings
from app.core.monte_carlo import run_monte_carlo
from app.core.swr_optimizer import optimize_swr
from app.models.schemas import MonteCarloRequest, MonteCarloResponse

router = APIRouter()

# Lazy Redis connection — None if unavailable
_redis_client = None
_redis_checked = False


def _get_redis():
    global _redis_client, _redis_checked
    if _redis_checked:
        return _redis_client
    _redis_checked = True

    if not settings.REDIS_URL:
        return None

    try:
        import redis

        _redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        _redis_client.ping()
        return _redis_client
    except Exception:
        _redis_client = None
        return None


def _cache_key(request: MonteCarloRequest) -> str:
    """SHA-256 hash of deterministically sorted request body."""
    body = request.model_dump_json()
    # Sort JSON keys for deterministic hashing
    data = json.loads(body)
    sorted_body = json.dumps(data, sort_keys=True)
    return f"mc:{hashlib.sha256(sorted_body.encode()).hexdigest()}"


@router.post("/monte-carlo", response_model=MonteCarloResponse)
def run_simulation(request: MonteCarloRequest):
    # Check cache
    redis_client = _get_redis()
    if redis_client:
        key = _cache_key(request)
        try:
            cached = redis_client.get(key)
            if cached:
                data = json.loads(cached)
                data["cached"] = True
                return MonteCarloResponse(**data)
        except Exception:
            pass  # Cache miss or error, proceed with computation

    start = time.perf_counter()

    # Build params dict from request
    params = {
        "initial_portfolio": request.initial_portfolio,
        "allocation_weights": request.allocation_weights,
        "expected_returns": request.expected_returns,
        "std_devs": request.std_devs,
        "correlation_matrix": request.correlation_matrix,
        "current_age": request.current_age,
        "retirement_age": request.retirement_age,
        "life_expectancy": request.life_expectancy,
        "annual_savings": request.annual_savings,
        "post_retirement_income": request.post_retirement_income,
        "method": request.method.value,
        "n_simulations": request.n_simulations,
        "seed": request.seed,
        "withdrawal_strategy": request.withdrawal_strategy.value,
        "expense_ratio": request.expense_ratio,
        "inflation": request.inflation,
    }

    # Extract the relevant strategy params
    strategy = request.withdrawal_strategy.value
    sp = getattr(request.strategy_params, strategy)
    params["strategy_params"] = sp.model_dump()

    result = run_monte_carlo(params)

    # Run SWR optimization for 3 confidence levels
    try:
        safe_swr = {
            "confidence_95": optimize_swr(0.95, params, n_sims=min(request.n_simulations, 2000)),
            "confidence_90": optimize_swr(0.90, params, n_sims=min(request.n_simulations, 2000)),
            "confidence_85": optimize_swr(0.85, params, n_sims=min(request.n_simulations, 2000)),
        }
    except Exception:
        safe_swr = None

    elapsed_ms = (time.perf_counter() - start) * 1000

    response_data = {
        "success_rate": result["success_rate"],
        "percentile_bands": result["percentile_bands"],
        "terminal_stats": result["terminal_stats"],
        "safe_swr": safe_swr,
        "failure_distribution": result["failure_distribution"],
        "n_simulations": request.n_simulations,
        "computation_time_ms": round(elapsed_ms, 1),
        "cached": False,
    }

    # Store in cache
    if redis_client:
        key = _cache_key(request)
        try:
            redis_client.setex(key, 3600, json.dumps(response_data))
        except Exception:
            pass  # Non-critical

    return MonteCarloResponse(**response_data)
