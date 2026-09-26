"""HTTP entrypoint for the ATM forecasting service."""
from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from api import forecast_atm, forecast_batch
from predict import forecast_next_7_days

app = FastAPI(title="ATM ML Service", version="1.0.0")


class ForecastRequest(BaseModel):
    atm_id: str
    current_cash: float = Field(ge=0)
    atm_capacity: float = Field(gt=0)
    atm_type: str = "Village"
    festival: bool = False
    weekend: bool = False
    salary_day: bool = False
    weather: str = "Sunny"
    distance_to_depot_km: float = Field(default=20.0, ge=0)
    historical_stockout_frequency: float = Field(default=0.10, ge=0, le=1)
    average_daily_withdrawal: float = Field(default=0.0, ge=0)
    previous_refill_delay_days: int = Field(default=2, ge=0)
    cash_utilisation: float = Field(default=0.0, ge=0, le=1)
    days_since_last_refill: int = Field(default=0, ge=0)


class BatchRequest(BaseModel):
    atm_ids: List[str]
    cash_map: Dict[str, float]
    capacity_map: Dict[str, float]


class LegacyPredictionRequest(BaseModel):
    atmId: str
    predictionDate: str
    features: Dict[str, float] = {}


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "UP", "service": "ml-service"}


@app.post("/api/v1/forecast")
def forecast(request: ForecastRequest) -> Dict[str, Any]:
    try:
        return forecast_atm(**request.model_dump())
    except (ValueError, KeyError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@app.post("/api/v1/forecast/batch")
def batch_forecast(request: BatchRequest) -> Dict[str, Any]:
    try:
        return forecast_batch(request.atm_ids, request.cash_map, request.capacity_map)
    except (ValueError, KeyError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@app.post("/predict")
def legacy_predict(request: LegacyPredictionRequest) -> Dict[str, Any]:
    """Keep the existing Java prediction client compatible with the ML API."""
    try:
        result = forecast_next_7_days(request.atmId)
        return {
            "atmId": request.atmId,
            "predictionDate": request.predictionDate,
            "predictedDemand": result["total_forecast"],
            "confidenceScore": result["confidence"],
            "modelVersion": "atm-forecast-model",
        }
    except (ValueError, KeyError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
