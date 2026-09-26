"""Generate rule-driven daily ATM transactions with banking demand effects."""

from pathlib import Path
from typing import Dict, Tuple

import numpy as np
import pandas as pd

from generate_transactions import (
    ATM_MASTER_FILE,
    ATM_STATUS_DOWNTIME,
    EXPECTED_ATMS,
    EXPECTED_DAYS,
    load_source_data,
)


OUTPUT_FILE = Path(__file__).with_name("transactions_realistic.csv")
RANDOM_SEED = 20260729

ATM_TYPE_MULTIPLIERS: Dict[str, float] = {
    "Airport": 2.20,
    "Mall": 1.60,
    "IT Park": 1.35,
    "Market Area": 1.25,
    "Railway Station": 1.45,
    "Tourist Area": 1.30,
    "Bus Stand": 1.05,
    "Hospital": 0.80,
    "College": 0.70,
    "Residential": 0.75,
    "Village": 0.45,
}

EVENT_MULTIPLIERS: Dict[str, float] = {
    "Cricket Match": 1.25,
    "Political Rally": 1.10,
    "Temple Festival": 1.35,
    "Concert": 1.30,
    "Shopping Festival": 1.50,
    "Weekly Market": 1.15,
    "Election": 1.20,
}

WEATHER_MULTIPLIERS: Dict[str, float] = {
    "Sunny": 1.00,
    "Cloudy": 0.95,
    "Rainy": 0.85,
    "Storm": 0.70,
}


def season_multiplier(month: int) -> float:
    """Model broad seasonal changes in cash demand across India."""
    if month in (3, 4, 5):
        return 1.05
    if month in (6, 7, 8, 9):
        return 0.95
    return 1.00


def event_multiplier(calendar_row: pd.Series) -> float:
    """Return the event effect, with no-event days remaining neutral."""
    event_name = calendar_row.get("local_event")
    if pd.isna(event_name):
        return 1.00
    return EVENT_MULTIPLIERS[str(event_name)]


def generate_realistic_transactions(atm_master: pd.DataFrame, calendar: pd.DataFrame,
                                    seed: int = RANDOM_SEED) -> pd.DataFrame:
    """Generate one transaction record for each ATM and each non-leap date."""
    rng = np.random.default_rng(seed)
    records = []

    for calendar_row in calendar.itertuples(index=False):
        calendar_series = pd.Series(calendar_row._asdict())
        for atm in atm_master.itertuples(index=False):
            weekend_multiplier = 1.20 if bool(calendar_series["is_weekend"]) else 1.00
            salary_multiplier = 1.40 if bool(calendar_series["is_salary_day"]) else 1.00
            festival_multiplier = 1.60 if pd.notna(calendar_series["festival_name"]) else 1.00
            holiday_multiplier = 1.25 if pd.notna(calendar_series["holiday_name"]) else 1.00
            weather_factor = WEATHER_MULTIPLIERS[str(calendar_series["weather"])]
            event_factor = event_multiplier(calendar_series)
            season_factor = season_multiplier(calendar_row.date.month)
            atm_factor = ATM_TYPE_MULTIPLIERS[atm.atm_type]

            noise_std = float(rng.uniform(0.05, 0.10))
            gaussian_noise = max(0.70, rng.normal(1.00, noise_std))
            demand_multiplier = (
                weekend_multiplier
                * salary_multiplier
                * festival_multiplier
                * holiday_multiplier
                * weather_factor
                * event_factor
                * season_factor
                * atm_factor
                * gaussian_noise
            )

            base_transactions = max(1.0, float(atm.average_daily_withdrawal))
            withdrawal_transactions = max(1, int(round(base_transactions * demand_multiplier)))
            average_withdrawal = max(100.0, float(rng.normal(1800.0, 216.0)))
            withdrawal_amount = min(
                float(atm.cash_capacity),
                withdrawal_transactions * average_withdrawal,
            )
            deposit_ratio = max(0.02, float(rng.normal(0.14, 0.03)))
            deposit_amount = withdrawal_amount * deposit_ratio
            deposit_transactions = max(0, int(round(withdrawal_transactions * deposit_ratio)))
            number_of_transactions = withdrawal_transactions + deposit_transactions
            average_transaction_amount = (withdrawal_amount + deposit_amount) / number_of_transactions
            cash_loaded = min(
                float(atm.cash_capacity),
                max(0.0, withdrawal_amount - (float(atm.cash_capacity) * 0.40)),
            )
            cash_remaining = min(
                float(atm.cash_capacity),
                max(0.0, float(atm.cash_capacity) - withdrawal_amount + deposit_amount + cash_loaded),
            )
            atm_status, downtime_hours = _status_and_downtime(rng, atm.atm_type)

            records.append(
                {
                    "date": calendar_row.date.strftime("%Y-%m-%d"),
                    "atm_id": atm.atm_id,
                    "cash_loaded": round(cash_loaded, 2),
                    "cash_remaining": round(cash_remaining, 2),
                    "withdrawal_amount": round(withdrawal_amount, 2),
                    "deposit_amount": round(deposit_amount, 2),
                    "number_of_transactions": number_of_transactions,
                    "average_transaction_amount": round(average_transaction_amount, 2),
                    "atm_status": atm_status,
                    "downtime_hours": downtime_hours,
                }
            )

    return pd.DataFrame(records)


def _status_and_downtime(rng: np.random.Generator, atm_type: str) -> Tuple[str, float]:
    """Generate a realistic ATM operating status and downtime duration."""
    status_probabilities = {
        "Hospital": [0.975, 0.020, 0.004, 0.001],
        "Airport": [0.965, 0.025, 0.008, 0.002],
    }.get(atm_type, [0.955, 0.030, 0.012, 0.003])
    status = str(rng.choice(list(ATM_STATUS_DOWNTIME), p=status_probabilities))
    downtime_min, downtime_max = ATM_STATUS_DOWNTIME[status]
    return status, round(float(rng.uniform(downtime_min, downtime_max)), 2)


def validate_realistic_transactions(dataframe: pd.DataFrame, atm_master: pd.DataFrame) -> None:
    """Validate output shape, uniqueness, non-negative values, and capacity limits."""
    required_columns = {
        "date", "atm_id", "cash_loaded", "cash_remaining", "withdrawal_amount",
        "deposit_amount", "number_of_transactions", "average_transaction_amount",
        "atm_status", "downtime_hours",
    }
    if set(dataframe.columns) != required_columns:
        raise ValueError("Unexpected columns in transactions_realistic.csv")
    if len(dataframe) != EXPECTED_ATMS * EXPECTED_DAYS:
        raise ValueError("Expected exactly 109,500 realistic transaction records")
    if dataframe[["date", "atm_id"]].duplicated().any():
        raise ValueError("Duplicate ATM-date transaction records found")
    capacities = atm_master.set_index("atm_id")["cash_capacity"]
    max_capacity = dataframe["atm_id"].map(capacities)
    if dataframe["withdrawal_amount"].gt(max_capacity).any():
        raise ValueError("Withdrawal amount exceeds ATM cash capacity")
    if not dataframe[["cash_loaded", "cash_remaining", "deposit_amount"]].ge(0).all().all():
        raise ValueError("Cash amounts cannot be negative")
    if not dataframe["atm_status"].isin(ATM_STATUS_DOWNTIME).all():
        raise ValueError("Unsupported ATM status found")
    if not dataframe["downtime_hours"].between(0, 24).all():
        raise ValueError("Downtime must be between 0 and 24 hours")


def save_realistic_transactions(output_file: Path = OUTPUT_FILE) -> pd.DataFrame:
    """Load source datasets, generate realistic transactions, validate, and save."""
    atm_master, calendar = load_source_data()
    transactions = generate_realistic_transactions(atm_master, calendar)
    validate_realistic_transactions(transactions, atm_master)
    transactions.to_csv(output_file, index=False)
    return transactions


if __name__ == "__main__":
    generated_data = save_realistic_transactions()
    print(f"Generated {len(generated_data)} realistic transaction records: {OUTPUT_FILE}")