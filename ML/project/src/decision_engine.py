"""Risk-based business decision engine for ATM cash replenishment.

This module intentionally keeps the trained ML model untouched and improves only
business-layer decisioning.
"""
import logging
from datetime import date, datetime, timedelta
from typing import Dict, List, Optional, Sequence

logger = logging.getLogger(__name__)

ATM_TYPE_WEIGHT = {
    "Airport": 14,
    "Mall": 10,
    "Village": 4,
    "Hospital": 11,
    "Railway": 12,
    "College": 8,
    "IT Park": 9,
}

WEEKEND_WEIGHT = 8
FESTIVAL_WEIGHT = 12
SALARY_DAY_WEIGHT = 9
WEATHER_WEIGHT = {"Rain": 6, "Storm": 10, "Sunny": 0, "Cloudy": 2}


class ATMDecisionEngine:
    """Risk-based ATM cash decision engine.

    The engine evaluates operational exposure using several business factors
    instead of a single fixed cash-threshold comparison.
    """

    @staticmethod
    def compute_priority(risk_score: float) -> str:
        """Map a 0–100 risk score to a bank-ready priority label."""
        if risk_score >= 85:
            return "CRITICAL"
        if risk_score >= 70:
            return "HIGH"
        if risk_score >= 40:
            return "MEDIUM"
        return "LOW"

    @staticmethod
    def estimate_confidence(
        model_confidence: float,
        prediction_interval: Sequence[float],
        total_forecast: float,
        ensemble_strength: float = 0.60,
    ) -> float:
        """Estimate confidence using model confidence and forecast uncertainty."""
        if total_forecast <= 0:
            return round(0.0, 4)

        uncertainty_width = float(prediction_interval[1] - prediction_interval[0])
        uncertainty_ratio = min(1.0, uncertainty_width / max(1.0, total_forecast))
        confidence = model_confidence - (uncertainty_ratio * (1.0 - ensemble_strength))
        return round(float(max(0.0, min(0.99, confidence))), 4)

    @staticmethod
    def _normalize_atm_type(atm_type: Optional[str]) -> str:
        return (atm_type or "Village").strip().title()

    @staticmethod
    def _calculate_cash_coverage_score(current_cash: float, total_forecast: float, cash_capacity: float) -> float:
        """Score available cash coverage against the projected withdrawal demand."""
        if cash_capacity <= 0:
            return 0.0

        cash_ratio = current_cash / max(1.0, cash_capacity)
        forecast_ratio = total_forecast / max(1.0, cash_capacity)
        cash_gap_ratio = max(0.0, (total_forecast - current_cash) / max(1.0, cash_capacity))
        score = 0.0

        if current_cash < total_forecast:
            score += 32
        elif current_cash < total_forecast * 1.10:
            score += 20
        elif current_cash < total_forecast * 1.25:
            score += 10

        if cash_ratio < 0.25:
            score += 18
        elif cash_ratio < 0.40:
            score += 12
        elif cash_ratio < 0.60:
            score += 8
        elif cash_ratio < 0.80:
            score += 4

        if forecast_ratio >= 0.75:
            score += 18
        elif forecast_ratio >= 0.55:
            score += 12
        elif forecast_ratio >= 0.35:
            score += 6

        score += min(20, cash_gap_ratio * 100)
        return min(score, 70)

    @staticmethod
    def _calculate_operation_pressure_score(
        atm_type: str,
        festival: bool,
        weekend: bool,
        salary_day: bool,
        weather: str,
        lead_time_days: int,
        distance_to_depot_km: float,
        historical_stockout_frequency: float,
        average_daily_withdrawal: float,
        previous_refill_delay_days: int,
        cash_utilisation: float,
        days_since_last_refill: int,
        cash_capacity: float,
        total_forecast: float,
    ) -> float:
        """Blend the operational signals that drive ATM cash risk."""
        score = 0.0
        score += ATM_TYPE_WEIGHT.get(atm_type, 6)

        if festival:
            score += FESTIVAL_WEIGHT
        if weekend:
            score += WEEKEND_WEIGHT
        if salary_day:
            score += SALARY_DAY_WEIGHT
        score += WEATHER_WEIGHT.get(weather, 2)

        score += min(10, max(0, lead_time_days - 1) * 3)
        score += min(10, max(0, distance_to_depot_km - 10) * 0.18)
        score += min(15, historical_stockout_frequency * 35)
        score += min(12, max(0, (average_daily_withdrawal / max(1.0, cash_capacity)) * 100) * 0.2)
        score += min(10, max(0, previous_refill_delay_days - 1) * 2)
        score += min(12, cash_utilisation * 45)
        score += min(10, max(0, days_since_last_refill - 2) * 2)

        if total_forecast >= cash_capacity * 0.75:
            score += 10

        return min(score, 85)

    @staticmethod
    def create_reason_list(
        atm_type: str,
        festival: bool,
        weekend: bool,
        salary_day: bool,
        weather: str,
        lead_time_days: int,
        distance_to_depot_km: float,
        historical_stockout_frequency: float,
        cash_after_forecast: float,
        cash_capacity: float,
        safety_buffer: float,
        daily_forecast: Sequence[float],
    ) -> List[str]:
        """Construct explainable business reasons for the risk outcome."""
        reasons: List[str] = []

        if festival:
            reasons.append("Festival approaching")
        if weekend:
            reasons.append("Weekend demand expected")
        if salary_day:
            reasons.append("Salary day demand expected")
        if atm_type:
            reasons.append(f"{atm_type} ATM")
        if weather != "Sunny":
            reasons.append(f"Weather condition: {weather}")

        if cash_after_forecast < safety_buffer:
            reasons.append("Cash falls below safety threshold")
        if lead_time_days >= 3:
            reasons.append(f"Cash van lead time is {lead_time_days} days")
        if distance_to_depot_km > 25:
            reasons.append("Distance to nearest cash depot is high")
        if historical_stockout_frequency >= 0.25:
            reasons.append("High historical stockout frequency")
        if any(day > 0.25 * cash_capacity for day in daily_forecast):
            reasons.append("High daily withdrawal spike is forecasted")

        return reasons[:6]

    @staticmethod
    def calculate_risk_score(
        current_cash: float,
        cash_capacity: float,
        total_forecast: float,
        daily_forecast: Sequence[float],
        atm_type: str = "Village",
        festival: bool = False,
        weekend: bool = False,
        salary_day: bool = False,
        weather: str = "Sunny",
        lead_time_days: int = 1,
        distance_to_depot_km: float = 20.0,
        historical_stockout_frequency: float = 0.10,
        average_daily_withdrawal: float = 0.0,
        previous_refill_delay_days: int = 2,
        cash_utilisation: float = 0.0,
        days_since_last_refill: int = 0,
        safety_buffer: float = 0.0,
        model_confidence: float = 0.82,
        prediction_interval: Optional[Sequence[float]] = None,
    ) -> Dict[str, object]:
        """Return a business-ready risk assessment block."""
        if prediction_interval is None:
            prediction_interval = [max(0.0, total_forecast * 0.90), max(0.0, total_forecast * 1.10)]

        cash_coverage_score = ATMDecisionEngine._calculate_cash_coverage_score(current_cash, total_forecast, cash_capacity)
        operational_pressure_score = ATMDecisionEngine._calculate_operation_pressure_score(
            atm_type=ATMDecisionEngine._normalize_atm_type(atm_type),
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
            cash_capacity=cash_capacity,
            total_forecast=total_forecast,
        )

        risk_score = min(100.0, round(cash_coverage_score + operational_pressure_score, 2))
        priority = ATMDecisionEngine.compute_priority(risk_score)
        confidence = ATMDecisionEngine.estimate_confidence(
            model_confidence=model_confidence,
            prediction_interval=prediction_interval,
            total_forecast=total_forecast,
        )

        return {
            "risk_score": risk_score,
            "priority": priority,
            "confidence": confidence,
        }

    @staticmethod
    def calculate_cash_survival(
        current_cash: float,
        daily_forecast: Sequence[float],
        next_cash_van_route: str,
        route_date_offset_days: int = 0,
    ) -> Dict[str, object]:
        """Compute day-by-day remaining cash and estimated stockout date."""
        remaining_cash = current_cash
        daily_remaining_cash: List[float] = []
        stockout_day: Optional[int] = None

        for day_number, forecast_value in enumerate(daily_forecast, start=1):
            remaining_cash -= float(forecast_value)
            daily_remaining_cash.append(round(float(remaining_cash), 2))
            if remaining_cash <= 0 and stockout_day is None:
                stockout_day = day_number

        route_date = datetime.strptime(next_cash_van_route, "%Y-%m-%d") + timedelta(days=route_date_offset_days)
        estimated_stockout_date = None
        if stockout_day is not None:
            estimated_stockout_date = (date.today() + timedelta(days=stockout_day - 1)).isoformat()

        will_last_until_route = remaining_cash >= 0
        return {
            "daily_remaining_cash": daily_remaining_cash,
            "estimated_stockout_date": estimated_stockout_date,
            "will_last_until_route": bool(will_last_until_route),
            "next_cash_van_route": route_date.strftime("%Y-%m-%d"),
        }

    @staticmethod
    def build_refill_decision(
        daily_forecast: Sequence[float],
        current_cash: float,
        atm_capacity: float,
        safety_buffer: float,
        cash_van_schedule: str,
        lead_time_days: int = 1,
        bank_policy_max_refill_ratio: float = 0.65,
    ) -> Dict[str, object]:
        """Build a smart refill amount that respects capacity and bank policy."""
        total_forecast = float(sum(daily_forecast))
        route_date = datetime.strptime(cash_van_schedule, "%Y-%m-%d") + timedelta(days=lead_time_days)
        if atm_capacity <= 0:
            return {
                "recommended_refill_amount": 0.0,
                "recommended_refill_date": route_date.strftime("%Y-%m-%d"),
                "safety_buffer": round(float(safety_buffer), 2),
            }

        minimum_cash_target = max(
            current_cash + safety_buffer,
            total_forecast * 0.85,
            atm_capacity * 0.55,
        )
        required_refill = max(0.0, minimum_cash_target - current_cash)
        max_refill_amount = atm_capacity * bank_policy_max_refill_ratio
        recommended_refill_amount = min(required_refill, max_refill_amount)

        return {
            "recommended_refill_amount": round(float(recommended_refill_amount), 2),
            "recommended_refill_date": route_date.strftime("%Y-%m-%d"),
            "safety_buffer": round(float(safety_buffer), 2),
        }

    @staticmethod
    def build_assessment_payload(
        atm_id: str,
        forecast_payload: Dict[str, object],
        current_cash: float,
        cash_capacity: float,
        next_cash_van_route: str,
        atm_type: str = "Village",
        festival: bool = False,
        weekend: bool = False,
        salary_day: bool = False,
        weather: str = "Sunny",
        lead_time_days: int = 1,
        distance_to_depot_km: float = 20.0,
        historical_stockout_frequency: float = 0.10,
        average_daily_withdrawal: float = 0.0,
        previous_refill_delay_days: int = 2,
        cash_utilisation: float = 0.0,
        days_since_last_refill: int = 0,
        safety_buffer: float = 0.0,
        model_confidence: float = 0.82,
    ) -> Dict[str, object]:
        """Assemble the full business response payload."""
        daily_forecast = list(forecast_payload.get("daily_forecast", []))
        total_forecast = float(forecast_payload.get("total_forecast", sum(daily_forecast)))
        prediction_interval = forecast_payload.get("prediction_interval", [total_forecast * 0.9, total_forecast * 1.1])
        risk_assessment = ATMDecisionEngine.calculate_risk_score(
            current_cash=current_cash,
            cash_capacity=cash_capacity,
            total_forecast=total_forecast,
            daily_forecast=daily_forecast,
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
            safety_buffer=safety_buffer,
            model_confidence=model_confidence,
            prediction_interval=prediction_interval,
        )

        cash_after_forecast = current_cash - total_forecast
        reason = ATMDecisionEngine.create_reason_list(
            atm_type=ATMDecisionEngine._normalize_atm_type(atm_type),
            festival=festival,
            weekend=weekend,
            salary_day=salary_day,
            weather=weather,
            lead_time_days=lead_time_days,
            distance_to_depot_km=distance_to_depot_km,
            historical_stockout_frequency=historical_stockout_frequency,
            cash_after_forecast=cash_after_forecast,
            cash_capacity=cash_capacity,
            safety_buffer=safety_buffer,
            daily_forecast=daily_forecast,
        )
        cash_survival = ATMDecisionEngine.calculate_cash_survival(
            current_cash=current_cash,
            daily_forecast=daily_forecast,
            next_cash_van_route=next_cash_van_route,
            route_date_offset_days=lead_time_days,
        )
        decision = ATMDecisionEngine.build_refill_decision(
            daily_forecast=daily_forecast,
            current_cash=current_cash,
            atm_capacity=cash_capacity,
            safety_buffer=safety_buffer,
            cash_van_schedule=next_cash_van_route,
            lead_time_days=lead_time_days,
        )
        decision["priority"] = risk_assessment["priority"]
        decision["confidence"] = risk_assessment["confidence"]
        decision["risk_score"] = risk_assessment["risk_score"]

        logger.info("Completed risk assessment for %s with risk score %s", atm_id, risk_assessment["risk_score"])
        return {
            "atm_id": atm_id,
            "forecast": forecast_payload,
            "risk_assessment": risk_assessment,
            "cash_survival": cash_survival,
            "decision": decision,
            "reason": reason,
        }


def build_refill_decision(
    daily_forecast: Sequence[float],
    current_cash: float,
    atm_capacity: float,
    safety_threshold: float,
    cash_van_schedule: str,
    lead_time_days: int = 1,
    prediction_interval: Optional[Sequence[float]] = None,
    prediction_variance: float = 150000.0,
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
    """Backward-compatible wrapper that returns a bank-grade decision payload."""
    safety_buffer = max(float(safety_threshold) * atm_capacity, 0.0)
    forecast_payload = {
        "daily_forecast": list(daily_forecast),
        "total_forecast": sum(daily_forecast),
        "prediction_interval": list(prediction_interval or [sum(daily_forecast) * 0.9, sum(daily_forecast) * 1.1]),
        "confidence": model_confidence,
    }
    return ATMDecisionEngine.build_assessment_payload(
        atm_id="",
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
        safety_buffer=safety_buffer,
        model_confidence=model_confidence,
    )
