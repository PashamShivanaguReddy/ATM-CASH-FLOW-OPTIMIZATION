"""Prediction interface for the ATM 7-day forecasting engine."""
from typing import Dict

import numpy as np
import pandas as pd

from config import FEATURE_COLUMNS, MODEL_PATH, RAW_DATA_PATH
from feature_engineering import build_model_input, load_and_prepare_data
from utils import load_pickle


def _normalize_atm_id(atm_id: str) -> str:
    """Normalize ATM IDs into the dataset's zero-padded format, e.g. ATM001 -> ATM0001."""
    candidate = str(atm_id).strip().upper()
    if candidate.startswith("ATM"):
        numeric_part = candidate.replace("ATM", "")
        if numeric_part.isdigit():
            return f"ATM{int(numeric_part):04d}"
    return candidate


def forecast_next_7_days(atm_id: str) -> Dict[str, object]:
    """Produce a seven-day forecast for a specific ATM using the persisted horizon models."""
    artifact = load_pickle(MODEL_PATH)
    horizon_models = artifact["models"]
    feature_columns = artifact["feature_columns"]
    confidence = float(artifact.get("confidence", 0.82))
    interval_width = float(artifact.get("prediction_interval_width", max(0.05, min(0.18, (1.0 - confidence) * 0.40))))
    normalized_atm_id = _normalize_atm_id(atm_id)

    data = load_and_prepare_data(str(RAW_DATA_PATH))
    atm_history = data[data["atm_id"] == normalized_atm_id].sort_values("date").reset_index(drop=True)
    if atm_history.empty:
        raise ValueError(f"No historical data found for ATM {normalized_atm_id}.")

    feature_frame, _ = build_model_input(atm_history, feature_columns)
    latest_feature_row = feature_frame.iloc[-1:].copy()
    daily_forecast = [
        round(float(np.maximum(0.0, model.predict(latest_feature_row)[0])), 2)
        for model in horizon_models
    ]
    total_forecast = round(float(sum(daily_forecast)), 2)
    lower_interval = round(float(max(0.0, total_forecast * (1.0 - interval_width))), 2)
    upper_interval = round(float(total_forecast * (1.0 + interval_width)), 2)

    return {
        "forecast_horizon": "7 Days",
        "daily_forecast": daily_forecast,
        "total_forecast": total_forecast,
        "confidence": round(float(min(0.99, max(0.0, confidence))), 4),
        "prediction_interval": [lower_interval, upper_interval],
    }
