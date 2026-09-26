"""Simulate ATM cash balances and automatic replenishment decisions."""

from pathlib import Path
from typing import Dict, Tuple

import numpy as np
import pandas as pd


BASE_DIR = Path(__file__).parent
TRANSACTIONS_FILE = BASE_DIR / "transactions_realistic.csv"
ATM_MASTER_FILE = BASE_DIR / "atm_master.csv"
OUTPUT_FILE = BASE_DIR / "atm_refill.csv"
RANDOM_SEED = 20260729
REFILL_TRIGGER_PERCENT = 40.0
REFILL_TARGET_PERCENT = 80.0


def load_source_data() -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Load transaction flows and ATM capacities needed for cash simulation."""
    transactions = pd.read_csv(TRANSACTIONS_FILE, parse_dates=["date"])
    atm_master = pd.read_csv(ATM_MASTER_FILE, usecols=["atm_id", "cash_capacity"])
    required_transaction_columns = {"date", "atm_id", "withdrawal_amount", "deposit_amount"}
    if not required_transaction_columns.issubset(transactions.columns):
        raise ValueError("transactions_realistic.csv is missing cash-flow columns")
    if not {"atm_id", "cash_capacity"}.issubset(atm_master.columns):
        raise ValueError("atm_master.csv is missing ATM capacity information")
    if transactions["atm_id"].nunique() != len(atm_master):
        raise ValueError("ATM IDs do not match between the source datasets")
    transactions = transactions.merge(atm_master, on="atm_id", how="left", validate="many_to_one")
    if transactions["cash_capacity"].isna().any():
        raise ValueError("Some transaction records have no ATM capacity")
    return transactions.sort_values(["atm_id", "date"]).reset_index(drop=True), atm_master


def classify_priority(cash_percentage_remaining: float) -> Tuple[str, bool]:
    """Apply the requested priority thresholds to the pre-refill balance."""
    if cash_percentage_remaining < 10.0:
        return "Critical", True
    if cash_percentage_remaining < 20.0:
        return "High", True
    if cash_percentage_remaining <= 40.0:
        return "Medium", True
    return "Low", False


def simulate_cash_management(transactions: pd.DataFrame,
                              seed: int = RANDOM_SEED) -> pd.DataFrame:
    """Carry ATM balances forward and automatically refill low-cash ATMs."""
    rng = np.random.default_rng(seed)
    records = []

    for atm_id, atm_transactions in transactions.groupby("atm_id", sort=False):
        capacity = float(atm_transactions["cash_capacity"].iloc[0])
        opening_cash = float(rng.uniform(0.75, 0.95) * capacity)
        days_since_last_refill = 0

        for transaction in atm_transactions.itertuples(index=False):
            current_cash = min(
                capacity,
                max(0.0, opening_cash + float(transaction.deposit_amount) - float(transaction.withdrawal_amount)),
            )
            cash_percentage_remaining = round((current_cash / capacity) * 100.0, 2)
            priority, refill_required = classify_priority(cash_percentage_remaining)
            recommended_refill_amount = 0.0
            refill_date = None
            cash_remaining = current_cash

            if refill_required:
                recommended_refill_amount = max(
                    0.0,
                    (capacity * REFILL_TARGET_PERCENT / 100.0) - current_cash,
                )
                cash_remaining = min(capacity, current_cash + recommended_refill_amount)
                refill_date = transaction.date.strftime("%Y-%m-%d")
                days_since_last_refill = 0
            else:
                days_since_last_refill += 1

            cash_utilisation = ((capacity - current_cash) / capacity) * 100.0
            records.append(
                {
                    "date": transaction.date.strftime("%Y-%m-%d"),
                    "atm_id": atm_id,
                    "current_cash": round(current_cash, 2),
                    "cash_remaining": round(cash_remaining, 2),
                    "cash_utilisation": round(cash_utilisation, 2),
                    "cash_percentage_remaining": round(cash_percentage_remaining, 2),
                    "days_since_last_refill": days_since_last_refill,
                    "refill_required": refill_required,
                    "recommended_refill_amount": round(recommended_refill_amount, 2),
                    "refill_date": refill_date,
                    "priority": priority,
                }
            )
            opening_cash = cash_remaining

    return pd.DataFrame(records)


def validate_refill_data(refill_data: pd.DataFrame, transactions: pd.DataFrame) -> None:
    """Validate one management record per source transaction and refill history."""
    required_columns = {
        "date", "atm_id", "current_cash", "cash_remaining", "cash_utilisation",
        "cash_percentage_remaining", "days_since_last_refill", "refill_required",
        "recommended_refill_amount", "refill_date", "priority",
    }
    if set(refill_data.columns) != required_columns:
        raise ValueError("Unexpected columns in atm_refill.csv")
    if len(refill_data) != len(transactions):
        raise ValueError("There must be one cash-management record per transaction record")
    if refill_data[["date", "atm_id"]].duplicated().any():
        raise ValueError("Duplicate ATM-date cash-management records found")
    if not refill_data["priority"].isin(["Critical", "High", "Medium", "Low"]).all():
        raise ValueError("Unsupported cash priority found")
    if not refill_data["cash_utilisation"].between(0, 100).all():
        raise ValueError("Cash utilisation must remain between 0% and 100%")
    if not refill_data["cash_percentage_remaining"].between(0, 100).all():
        raise ValueError("Cash percentage remaining must remain between 0% and 100%")
    if not refill_data["recommended_refill_amount"].ge(0).all():
        raise ValueError("Recommended refill amounts cannot be negative")
    if not refill_data.loc[refill_data["refill_required"], "refill_date"].notna().all():
        raise ValueError("Required refills must have a refill date")
    if refill_data.loc[~refill_data["refill_required"], "refill_date"].notna().any():
        raise ValueError("Non-required refills must not have a refill date")


def save_refill_history(output_file: Path = OUTPUT_FILE) -> pd.DataFrame:
    """Run the simulation, calculate refill intervals, validate, and save CSV."""
    transactions, _ = load_source_data()
    refill_data = simulate_cash_management(transactions)
    validate_refill_data(refill_data, transactions)
    refill_data.to_csv(output_file, index=False)
    return refill_data


if __name__ == "__main__":
    generated_data = save_refill_history()
    print(f"Generated {len(generated_data)} ATM cash-management records: {OUTPUT_FILE}")