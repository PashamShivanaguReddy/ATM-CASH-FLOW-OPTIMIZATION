"""Generate daily ATM transaction records from the ATM and calendar datasets."""

from pathlib import Path
from typing import Dict, Tuple

import numpy as np
import pandas as pd


BASE_DIR = Path(__file__).parent
ATM_MASTER_FILE = BASE_DIR / "atm_master.csv"
CALENDAR_FILE = BASE_DIR / "calendar.csv"
OUTPUT_FILE = BASE_DIR / "transactions.csv"
RANDOM_SEED = 20260729
EXPECTED_ATMS = 100
EXPECTED_DAYS = 1095
EXCLUDED_LEAP_DATE = "2024-02-29"

ATM_TYPE_PROFILES: Dict[str, Dict[str, float]] = {
    "Airport": {"demand_multiplier": 1.55, "noise": 0.16, "ticket_size": 3200, "deposit_ratio": 0.08},
    "Mall": {"demand_multiplier": 1.20, "noise": 0.14, "ticket_size": 2700, "deposit_ratio": 0.12},
    "IT Park": {"demand_multiplier": 1.10, "noise": 0.12, "ticket_size": 3100, "deposit_ratio": 0.14},
    "Market Area": {"demand_multiplier": 1.05, "noise": 0.14, "ticket_size": 2400, "deposit_ratio": 0.18},
    "Railway Station": {"demand_multiplier": 1.15, "noise": 0.15, "ticket_size": 2300, "deposit_ratio": 0.10},
    "Tourist Area": {"demand_multiplier": 1.08, "noise": 0.16, "ticket_size": 2900, "deposit_ratio": 0.09},
    "Bus Stand": {"demand_multiplier": 0.95, "noise": 0.15, "ticket_size": 1900, "deposit_ratio": 0.10},
    "Hospital": {"demand_multiplier": 0.82, "noise": 0.05, "ticket_size": 2200, "deposit_ratio": 0.13},
    "College": {"demand_multiplier": 0.72, "noise": 0.17, "ticket_size": 1600, "deposit_ratio": 0.08},
    "Residential": {"demand_multiplier": 0.78, "noise": 0.11, "ticket_size": 2100, "deposit_ratio": 0.16},
    "Village": {"demand_multiplier": 0.45, "noise": 0.18, "ticket_size": 1300, "deposit_ratio": 0.20},
}

ATM_STATUS_DOWNTIME: Dict[str, Tuple[float, float]] = {
    "Operational": (0.0, 0.20),
    "Degraded": (0.50, 2.50),
    "Maintenance": (2.00, 6.00),
    "Outage": (6.00, 12.00),
}


def load_source_data() -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Load and validate the existing ATM master and calendar datasets."""
    atm_master = pd.read_csv(ATM_MASTER_FILE)
    calendar = pd.read_csv(CALENDAR_FILE)
    required_atm_columns = {"atm_id", "atm_type", "cash_capacity", "average_daily_withdrawal"}
    required_calendar_columns = {
        "date", "is_weekend", "is_salary_day", "holiday_name", "festival_name", "weather",
    }
    if not required_atm_columns.issubset(atm_master.columns):
        raise ValueError("atm_master.csv is missing required transaction inputs")
    if not required_calendar_columns.issubset(calendar.columns):
        raise ValueError("calendar.csv is missing required transaction inputs")
    if len(atm_master) != EXPECTED_ATMS or atm_master["atm_id"].nunique() != EXPECTED_ATMS:
        raise ValueError("Expected 100 unique ATMs in atm_master.csv")

    calendar["date"] = pd.to_datetime(calendar["date"])
    calendar = calendar[calendar["date"].dt.strftime("%Y-%m-%d") != EXCLUDED_LEAP_DATE].copy()
    calendar = calendar.sort_values("date").reset_index(drop=True)
    if len(calendar) != EXPECTED_DAYS or calendar["date"].duplicated().any():
        raise ValueError("Calendar must provide 1,095 unique non-leap transaction dates")
    return atm_master, calendar


def _demand_multiplier(atm_type: str, calendar_row: pd.Series) -> float:
    """Apply ATM-type behavior to the base demand signal."""
    multiplier = ATM_TYPE_PROFILES[atm_type]["demand_multiplier"]
    is_weekend = bool(calendar_row["is_weekend"])
    is_salary_day = bool(calendar_row["is_salary_day"])
    has_festival = pd.notna(calendar_row["festival_name"]) or pd.notna(calendar_row["holiday_name"])
    day_of_month = int(calendar_row["date"].day)

    if atm_type == "Mall" and is_weekend:
        multiplier *= 1.35
    elif atm_type == "Residential" and is_salary_day:
        multiplier *= 1.45
    elif atm_type == "College" and day_of_month in (10, 20):
        multiplier *= 1.55
    elif atm_type == "Railway Station" and has_festival:
        multiplier *= 1.45
    elif atm_type == "Bus Stand" and is_weekend:
        multiplier *= 1.25
    elif atm_type == "Hospital":
        multiplier *= 1.0
    elif atm_type == "Airport":
        multiplier *= 1.10 if has_festival else 1.0
    elif atm_type == "Village" and has_festival:
        multiplier *= 1.25
    elif atm_type in ("IT Park", "Market Area", "Tourist Area") and is_weekend:
        multiplier *= 1.10
    return multiplier


def _status_and_downtime(rng: np.random.Generator, atm_type: str) -> Tuple[str, float]:
    """Generate operational status and downtime, with stable hospital service."""
    status_probabilities = {
        "Hospital": [0.975, 0.020, 0.004, 0.001],
        "Airport": [0.965, 0.025, 0.008, 0.002],
    }.get(atm_type, [0.955, 0.030, 0.012, 0.003])
    status = str(rng.choice(list(ATM_STATUS_DOWNTIME), p=status_probabilities))
    downtime_min, downtime_max = ATM_STATUS_DOWNTIME[status]
    return status, round(float(rng.uniform(downtime_min, downtime_max)), 2)


def generate_transactions(atm_master: pd.DataFrame, calendar: pd.DataFrame,
                           seed: int = RANDOM_SEED) -> pd.DataFrame:
    """Generate one daily transaction record for each ATM and calendar date."""
    rng = np.random.default_rng(seed)
    records = []

    for calendar_row in calendar.itertuples(index=False):
        calendar_series = pd.Series(calendar_row._asdict())
        for atm in atm_master.itertuples(index=False):
            profile = ATM_TYPE_PROFILES[atm.atm_type]
            noise = max(0.10, rng.normal(1.0, profile["noise"]))
            multiplier = _demand_multiplier(atm.atm_type, calendar_series)
            withdrawal_transactions = max(
                1,
                int(round(atm.average_daily_withdrawal * multiplier * noise)),
            )
            average_withdrawal = max(100.0, rng.normal(profile["ticket_size"], profile["ticket_size"] * 0.12))
            withdrawal_amount = withdrawal_transactions * average_withdrawal
            withdrawal_amount = min(withdrawal_amount, atm.cash_capacity * 0.82)
            deposit_ratio = max(0.02, rng.normal(profile["deposit_ratio"], 0.03))
            deposit_amount = max(0.0, withdrawal_amount * deposit_ratio)
            deposit_transactions = max(0, int(round(withdrawal_transactions * deposit_ratio)))
            number_of_transactions = withdrawal_transactions + deposit_transactions
            average_transaction_amount = (withdrawal_amount + deposit_amount) / number_of_transactions
            cash_loaded = max(0.0, withdrawal_amount - (atm.cash_capacity * 0.45))
            cash_loaded = min(cash_loaded, atm.cash_capacity)
            cash_remaining = min(
                atm.cash_capacity,
                max(0.0, atm.cash_capacity - withdrawal_amount + deposit_amount + cash_loaded),
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


def validate_transactions(dataframe: pd.DataFrame) -> None:
    """Validate transaction count, uniqueness, schema, and cash constraints."""
    required_columns = {
        "date", "atm_id", "cash_loaded", "cash_remaining", "withdrawal_amount",
        "deposit_amount", "number_of_transactions", "average_transaction_amount",
        "atm_status", "downtime_hours",
    }
    if set(dataframe.columns) != required_columns:
        raise ValueError(f"Unexpected transaction columns: {sorted(set(dataframe.columns) ^ required_columns)}")
    if len(dataframe) != EXPECTED_ATMS * EXPECTED_DAYS:
        raise ValueError("Expected exactly 109,500 daily ATM transaction records")
    if dataframe[["date", "atm_id"]].duplicated().any():
        raise ValueError("Each ATM must have one transaction record per date")
    if not dataframe["cash_loaded"].ge(0).all() or not dataframe["cash_remaining"].ge(0).all():
        raise ValueError("Cash values cannot be negative")
    if not dataframe["withdrawal_amount"].gt(0).all() or not dataframe["number_of_transactions"].gt(0).all():
        raise ValueError("Every ATM transaction record must have positive activity")
    if not dataframe["atm_status"].isin(ATM_STATUS_DOWNTIME).all():
        raise ValueError("Dataset contains an unsupported ATM status")
    if not dataframe["downtime_hours"].between(0, 24).all():
        raise ValueError("Downtime must be between 0 and 24 hours")


def save_transactions(output_file: Path = OUTPUT_FILE) -> pd.DataFrame:
    """Load source data, generate transactions, validate, and save CSV."""
    atm_master, calendar = load_source_data()
    transactions = generate_transactions(atm_master, calendar)
    validate_transactions(transactions)
    transactions.to_csv(output_file, index=False)
    return transactions


if __name__ == "__main__":
    generated_data = save_transactions()
    print(f"Generated {len(generated_data)} transaction records: {OUTPUT_FILE}")