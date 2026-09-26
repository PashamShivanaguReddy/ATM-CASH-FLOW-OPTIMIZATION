"""Generate leakage-aware machine-learning features for ATM demand prediction."""

from pathlib import Path
from typing import Dict

import numpy as np
import pandas as pd


BASE_DIR = Path(__file__).parent
TRANSACTIONS_FILE = BASE_DIR / "transactions_realistic.csv"
ATM_MASTER_FILE = BASE_DIR / "atm_master.csv"
CALENDAR_FILE = BASE_DIR / "calendar.csv"
OUTPUT_FILE = BASE_DIR / "ml_dataset.csv"

WEATHER_WEIGHTS: Dict[str, float] = {
    "Sunny": 1.00,
    "Cloudy": 0.95,
    "Rainy": 0.85,
    "Storm": 0.70,
}
EVENT_WEIGHTS: Dict[str, float] = {
    "Cricket Match": 1.25,
    "Political Rally": 1.10,
    "Temple Festival": 1.35,
    "Concert": 1.30,
    "Shopping Festival": 1.50,
    "Weekly Market": 1.15,
    "Election": 1.20,
}


def load_feature_inputs() -> pd.DataFrame:
    """Load transactions and enrich them with ATM and calendar attributes."""
    transactions = pd.read_csv(TRANSACTIONS_FILE, parse_dates=["date"])
    atm_master = pd.read_csv(
        ATM_MASTER_FILE,
        usecols=["atm_id", "atm_type", "city", "cash_capacity"],
    )
    calendar = pd.read_csv(
        CALENDAR_FILE,
        parse_dates=["date"],
        usecols=[
            "date", "is_weekend", "is_salary_day", "holiday_name", "festival_name",
            "weather", "local_event",
        ],
    )
    required_transaction_columns = {
        "date", "atm_id", "cash_remaining", "withdrawal_amount", "cash_loaded",
    }
    if not required_transaction_columns.issubset(transactions.columns):
        raise ValueError("transactions_realistic.csv is missing required feature inputs")
    if transactions["atm_id"].nunique() != len(atm_master):
        raise ValueError("ATM IDs do not match between transaction and master data")

    calendar = calendar[calendar["date"] != pd.Timestamp("2024-02-29")]
    data = transactions.merge(atm_master, on="atm_id", how="left", validate="many_to_one")
    data = data.merge(calendar, on="date", how="left", validate="many_to_one")
    if data[["atm_type", "city", "cash_capacity", "weather"]].isna().any().any():
        raise ValueError("Feature enrichment left missing ATM or calendar values")
    return data.sort_values(["atm_id", "date"]).reset_index(drop=True)


def add_temporal_features(data: pd.DataFrame) -> pd.DataFrame:
    """Add prior-only rolling, historical, growth, and target features."""
    data = data.copy()
    grouped_withdrawals = data.groupby("atm_id")["withdrawal_amount"]
    data["previous_day_withdrawal"] = grouped_withdrawals.shift(1)
    for window in (3, 7, 14, 30):
        data["rolling_average_{}".format(window)] = grouped_withdrawals.transform(
            lambda values: values.shift(1).rolling(window, min_periods=1).mean()
        )

    month_group = data.groupby(["atm_id", data["date"].dt.year, data["date"].dt.month])[
        "withdrawal_amount"
    ]
    quarter_group = data.groupby(["atm_id", data["date"].dt.year, data["date"].dt.quarter])[
        "withdrawal_amount"
    ]
    data["monthly_average"] = month_group.transform(
        lambda values: values.shift(1).expanding(min_periods=1).mean()
    )
    data["quarterly_average"] = quarter_group.transform(
        lambda values: values.shift(1).expanding(min_periods=1).mean()
    )

    previous_previous = grouped_withdrawals.shift(2)
    data["withdrawal_growth_rate"] = (
        data["previous_day_withdrawal"] / previous_previous.replace(0, np.nan) - 1.0
    )
    data["tomorrow_withdrawal"] = grouped_withdrawals.shift(-1)
    return data


def add_cash_and_context_features(data: pd.DataFrame) -> pd.DataFrame:
    """Add cash state, known calendar weights, and encoded categorical fields."""
    data = data.copy()
    data["cash_remaining_percentage"] = (
        data["cash_remaining"] / data["cash_capacity"] * 100.0
    )
    data["cash_utilisation"] = 100.0 - data["cash_remaining_percentage"]
    refill_flag = data["cash_loaded"].gt(0)
    last_refill_date = data["date"].where(refill_flag).groupby(data["atm_id"]).ffill()
    data["days_since_last_refill"] = (
        data["date"] - last_refill_date
    ).dt.days.fillna(0).astype(int)

    data["festival_weight"] = np.where(data["festival_name"].notna(), 1.60, 1.00)
    data["holiday_weight"] = np.where(data["holiday_name"].notna(), 1.25, 1.00)
    data["salary_day_weight"] = np.where(data["is_salary_day"], 1.40, 1.00)
    data["weather_weight"] = data["weather"].map(WEATHER_WEIGHTS)
    data["event_weight"] = data["local_event"].map(EVENT_WEIGHTS).fillna(1.00)
    data["atm_type_encoded"] = pd.Categorical(data["atm_type"]).codes
    data["city_encoded"] = pd.Categorical(data["city"]).codes
    return data


def generate_ml_dataset() -> pd.DataFrame:
    """Build a training-ready feature table and remove rows without a target."""
    data = load_feature_inputs()
    data = add_temporal_features(data)
    data = add_cash_and_context_features(data)
    output_columns = [
        "date", "atm_id", "previous_day_withdrawal", "rolling_average_3",
        "rolling_average_7", "rolling_average_14", "rolling_average_30",
        "monthly_average", "quarterly_average", "withdrawal_growth_rate",
        "cash_remaining_percentage", "festival_weight", "holiday_weight",
        "salary_day_weight", "weather_weight", "event_weight", "atm_type_encoded",
        "city_encoded", "days_since_last_refill", "cash_utilisation",
        "tomorrow_withdrawal",
    ]
    dataset = data[output_columns].copy()
    dataset = dataset.dropna().reset_index(drop=True)
    return dataset


def validate_ml_dataset(dataset: pd.DataFrame) -> None:
    """Validate schema, target completeness, uniqueness, and feature ranges."""
    expected_columns = [
        "date", "atm_id", "previous_day_withdrawal", "rolling_average_3",
        "rolling_average_7", "rolling_average_14", "rolling_average_30",
        "monthly_average", "quarterly_average", "withdrawal_growth_rate",
        "cash_remaining_percentage", "festival_weight", "holiday_weight",
        "salary_day_weight", "weather_weight", "event_weight", "atm_type_encoded",
        "city_encoded", "days_since_last_refill", "cash_utilisation",
        "tomorrow_withdrawal",
    ]
    if list(dataset.columns) != expected_columns:
        raise ValueError("ML dataset columns do not match the requested schema")
    if dataset[["date", "atm_id"]].duplicated().any():
        raise ValueError("ML dataset contains duplicate ATM-date rows")
    if dataset["tomorrow_withdrawal"].isna().any():
        raise ValueError("ML target contains missing values")
    if dataset.isna().any().any():
        raise ValueError("ML dataset contains missing feature values")
    if not dataset["cash_remaining_percentage"].between(0, 100).all():
        raise ValueError("Cash remaining percentage must be between 0 and 100")
    if not dataset["cash_utilisation"].between(0, 100).all():
        raise ValueError("Cash utilisation must be between 0 and 100")
    if not dataset["days_since_last_refill"].ge(0).all():
        raise ValueError("Days since refill cannot be negative")


def save_ml_dataset(output_file: Path = OUTPUT_FILE) -> pd.DataFrame:
    """Generate, validate, and save the ML feature dataset."""
    dataset = generate_ml_dataset()
    validate_ml_dataset(dataset)
    dataset.to_csv(output_file, index=False)
    return dataset


if __name__ == "__main__":
    generated_data = save_ml_dataset()
    print(f"Generated {len(generated_data)} ML records: {OUTPUT_FILE}")