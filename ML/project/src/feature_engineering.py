"""Feature engineering utilities for the ATM forecasting pipeline."""
from typing import Iterable, Tuple

import numpy as np
import pandas as pd

from config import DATE_COLUMN, ID_COLUMN, TARGET_COLUMN


def load_and_prepare_data(raw_path: str) -> pd.DataFrame:
    """Load the dataset and keep the ATM chronology intact."""
    data = pd.read_csv(raw_path, parse_dates=[DATE_COLUMN])
    missing = {ID_COLUMN, DATE_COLUMN, TARGET_COLUMN}.difference(data.columns)
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")

    data = data.sort_values([ID_COLUMN, DATE_COLUMN]).reset_index(drop=True)
    grouped = data.groupby(ID_COLUMN, sort=False)
    for shift in range(1, 8):
        data[f"next_day_{shift}"] = grouped[TARGET_COLUMN].shift(-shift)

    numeric_columns = [
        column for column in data.columns
        if column not in {ID_COLUMN, DATE_COLUMN, TARGET_COLUMN, "atm_type_encoded", "city_encoded"}
        and pd.api.types.is_numeric_dtype(data[column])
    ]
    for column in numeric_columns:
        if data[column].isna().any():
            data[column] = grouped[column].transform(lambda values: values.fillna(values.median()))

    if data[[ID_COLUMN, DATE_COLUMN]].duplicated().any():
        raise ValueError("Duplicate ATM-date rows were found.")

    data = data.dropna(subset=[f"next_day_{shift}" for shift in range(1, 8)]).reset_index(drop=True)
    return data


def build_model_input(data: pd.DataFrame, feature_columns: Iterable[str]) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Build a clean feature matrix and seven-day target table."""
    feature_frame = data[list(feature_columns)].copy()
    target_frame = data[[f"next_day_{shift}" for shift in range(1, 8)]].copy()
    feature_frame = feature_frame.replace([np.inf, -np.inf], np.nan)
    feature_frame = feature_frame.fillna(feature_frame.median())
    return feature_frame, target_frame
