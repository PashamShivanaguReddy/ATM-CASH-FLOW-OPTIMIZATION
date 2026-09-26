"""Simple API-facing wrapper for the ATM forecasting service."""
from typing import Dict, List, Optional

from forecast_service import build_hybrid_forecast, run_batch_forecast


def forecast_atm(
    atm_id: str,
    current_cash: float,
    atm_capacity: Optional[float] = None,
    cash_capacity: Optional[float] = None,
    atm_type: str = "Village",
    festival: bool = False,
    weekend: bool = False,
    salary_day: bool = False,
    weather: str = "Sunny",
    distance_to_depot_km: float = 20.0,
    historical_stockout_frequency: float = 0.10,
    average_daily_withdrawal: float = 0.0,
    previous_refill_delay_days: int = 2,
    cash_utilisation: float = 0.0,
    days_since_last_refill: int = 0,
) -> Dict[str, object]:
    """Return a single-ATM business-ready payload with forecast, risk, cash survival, decision, and route context."""
    if atm_capacity is None:
        atm_capacity = cash_capacity
    if atm_capacity is None:
        raise ValueError("Either atm_capacity or cash_capacity must be provided.")

    return build_hybrid_forecast(
        atm_id=atm_id,
        current_cash=current_cash,
        atm_capacity=atm_capacity,
        safety_threshold=0.12,
        cash_van_schedule="2026-08-04",
        lead_time_days=1,
        atm_type=atm_type,
        festival=festival,
        weekend=weekend,
        salary_day=salary_day,
        weather=weather,
        distance_to_depot_km=distance_to_depot_km,
        historical_stockout_frequency=historical_stockout_frequency,
        average_daily_withdrawal=average_daily_withdrawal,
        previous_refill_delay_days=previous_refill_delay_days,
        cash_utilisation=cash_utilisation,
        days_since_last_refill=days_since_last_refill,
    )


def forecast_batch(atm_ids: List[str], cash_map: Dict[str, float], capacity_map: Dict[str, float]) -> Dict[str, object]:
    """Return a batched business payload with per-ATM results plus a consolidated route plan."""
    return run_batch_forecast(atm_ids, cash_map, capacity_map)
