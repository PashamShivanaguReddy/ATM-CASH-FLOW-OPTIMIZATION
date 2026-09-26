"""Hybrid orchestration service for ATM demand forecasting and replenishment planning."""
from typing import Dict, List, Optional

from decision_engine import ATMDecisionEngine
from predict import forecast_next_7_days
from route_optimizer import build_route_plan


def build_hybrid_forecast(
    atm_id: str,
    current_cash: float,
    atm_capacity: float,
    safety_threshold: float,
    cash_van_schedule: str,
    lead_time_days: int = 1,
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
    model_confidence: float = 0.82,
) -> Dict[str, object]:
    """Combine the model forecast with the risk-based decision engine and route optimizer."""
    forecast_payload = forecast_next_7_days(atm_id)
    assessment_payload = ATMDecisionEngine.build_assessment_payload(
        atm_id=atm_id,
        forecast_payload=forecast_payload,
        current_cash=current_cash,
        cash_capacity=atm_capacity,
        next_cash_van_route=cash_van_schedule,
        atm_type=atm_type,
        festival=festival,
        weekend=weekend,
        salary_day=salary_day,
        weather=weather,
        lead_time_days=lead_time_days,
        distance_to_depot_km=distance_to_depot_km,
        historical_stockout_frequency=historical_stockout_frequency,
        average_daily_withdrawal=average_daily_withdrawal,
        previous_refill_delay_days=previous_refill_delay_days,
        cash_utilisation=cash_utilisation,
        days_since_last_refill=days_since_last_refill,
        safety_buffer=max(float(safety_threshold) * atm_capacity, 0.0),
        model_confidence=model_confidence,
    )

    route_group = build_route_plan([assessment_payload])
    assessment_payload["route_group"] = route_group
    return assessment_payload


def run_batch_forecast(
    atm_ids: List[str],
    cash_map: Dict[str, float],
    capacity_map: Dict[str, float],
    atm_meta: Optional[Dict[str, Dict[str, object]]] = None,
) -> Dict[str, object]:
    """Run the hybrid forecast batch for several ATMs and return a consolidated route plan."""
    outputs = []
    atm_meta = atm_meta or {}

    for atm_id in atm_ids:
        meta = atm_meta.get(atm_id, {})
        payload = build_hybrid_forecast(
            atm_id=atm_id,
            current_cash=cash_map[atm_id],
            atm_capacity=capacity_map[atm_id],
            safety_threshold=0.12,
            cash_van_schedule="2026-08-04",
            lead_time_days=1,
            atm_type=meta.get("atm_type", "Village"),
            festival=meta.get("festival", False),
            weekend=meta.get("weekend", False),
            salary_day=meta.get("salary_day", False),
            weather=meta.get("weather", "Sunny"),
            distance_to_depot_km=meta.get("distance_to_depot_km", 20.0),
            historical_stockout_frequency=meta.get("historical_stockout_frequency", 0.10),
            average_daily_withdrawal=meta.get("average_daily_withdrawal", 0.0),
            previous_refill_delay_days=meta.get("previous_refill_delay_days", 2),
            cash_utilisation=meta.get("cash_utilisation", 0.0),
            days_since_last_refill=meta.get("days_since_last_refill", 0),
            model_confidence=meta.get("model_confidence", 0.82),
        )
        outputs.append(payload)

    return {
        "forecast_batch": outputs,
        "route_plan": build_route_plan(outputs),
    }
