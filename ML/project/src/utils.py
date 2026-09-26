"""Shared utilities for training, diagnostics, and result persistence."""
import json
import pickle
from pathlib import Path
from typing import Dict, Iterable

import numpy as np
import pandas as pd


def ensure_directory(path: Path) -> None:
    """Create the parent directory tree for a file path."""
    path.parent.mkdir(parents=True, exist_ok=True)


def mape(actual: pd.Series, predicted: np.ndarray) -> float:
    """Calculate MAPE while excluding zero actual values from the denominator."""
    actual_values = actual.to_numpy(dtype=float)
    predicted_values = np.asarray(predicted, dtype=float)
    non_zero = actual_values != 0
    if not non_zero.any():
        return float("nan")
    return float(np.mean(np.abs((actual_values[non_zero] - predicted_values[non_zero]) / actual_values[non_zero])) * 100.0)


def save_pickle(obj: object, destination: Path) -> None:
    """Persist a Python object to pickle."""
    ensure_directory(destination)
    with destination.open("wb") as handle:
        pickle.dump(obj, handle)


def load_pickle(source: Path) -> object:
    """Load a pickled object from disk."""
    with source.open("rb") as handle:
        return pickle.load(handle)


def save_json(payload: Dict[str, object], destination: Path) -> None:
    """Save a dictionary payload as JSON."""
    ensure_directory(destination)
    with destination.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)


def summarise_feature_importance(model: object, feature_columns: Iterable[str]) -> pd.DataFrame:
    """Return the ranked feature importances for the selected model."""
    feature_list = list(feature_columns)
    if hasattr(model, "feature_importances_"):
        importances = pd.Series(model.feature_importances_, index=feature_list)
    else:
        importances = pd.Series(np.zeros(len(feature_list)), index=feature_list)
    return importances.sort_values(ascending=False).reset_index()


def build_prediction_table(test: pd.DataFrame, predictions: np.ndarray) -> pd.DataFrame:
    """Create a standard actual-vs-predicted comparison table."""
    result = pd.DataFrame({
        "atm_id": test["atm_id"].values,
        "date": test["date"].dt.strftime("%Y-%m-%d").values,
        "actual_withdrawal": test["tomorrow_withdrawal"].values,
        "predicted_withdrawal": np.maximum(0.0, predictions),
    })
    result["absolute_error"] = (result["actual_withdrawal"] - result["predicted_withdrawal"]).abs()
    result["percentage_error"] = np.where(
        result["actual_withdrawal"] != 0,
        result["absolute_error"] / result["actual_withdrawal"].abs() * 100.0,
        np.nan,
    )
    return result
