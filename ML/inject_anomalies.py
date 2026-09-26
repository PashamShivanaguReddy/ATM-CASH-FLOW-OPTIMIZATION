"""Inject realistic, reproducible anomalies into the ATM ML dataset."""

from pathlib import Path
from typing import Dict, Tuple

import numpy as np
import pandas as pd


BASE_DIR = Path(__file__).parent
ML_DATASET_FILE = BASE_DIR / "ml_dataset.csv"
ATM_MASTER_FILE = BASE_DIR / "atm_master.csv"
OUTPUT_FILE = BASE_DIR / "ml_dataset_final.csv"
RANDOM_SEED = 20260729
ANOMALY_RATE = 0.01

ANOMALY_TYPES = [
    "Unexpected cash spike",
    "Cash theft simulation",
    "ATM malfunction",
    "Festival crowd",
    "Network outage",
    "Hardware issue",
    "Fraudulent withdrawal pattern",
]

ANOMALY_SEVERITY: Dict[str, str] = {
    "Unexpected cash spike": "High",
    "Cash theft simulation": "Critical",
    "ATM malfunction": "High",
    "Festival crowd": "Medium",
    "Network outage": "Critical",
    "Hardware issue": "High",
    "Fraudulent withdrawal pattern": "Critical",
}


def load_source_data() -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Load the ML dataset and ATM capacities used to bound actual withdrawals."""
    dataset = pd.read_csv(ML_DATASET_FILE)
    atm_master = pd.read_csv(ATM_MASTER_FILE, usecols=["atm_id", "cash_capacity"])
    required_columns = {"date", "atm_id", "tomorrow_withdrawal"}
    if not required_columns.issubset(dataset.columns):
        raise ValueError("ml_dataset.csv is missing the withdrawal target")
    if dataset["tomorrow_withdrawal"].isna().any():
        raise ValueError("Cannot inject anomalies into rows without normal withdrawal values")
    dataset = dataset.merge(atm_master, on="atm_id", how="left", validate="many_to_one")
    if dataset["cash_capacity"].isna().any():
        raise ValueError("Some ML rows have no matching ATM capacity")
    return dataset, atm_master


def _anomalous_amount(normal_withdrawal: float, anomaly_type: str,
                      capacity: float, rng: np.random.Generator) -> float:
    """Generate an anomaly-specific observed withdrawal within ATM capacity."""
    multipliers = {
        "Unexpected cash spike": (1.80, 2.40),
        "Cash theft simulation": (1.60, 2.20),
        "ATM malfunction": (0.00, 0.30),
        "Festival crowd": (1.40, 1.80),
        "Network outage": (0.00, 0.00),
        "Hardware issue": (0.30, 0.60),
        "Fraudulent withdrawal pattern": (2.00, 3.50),
    }
    multiplier_min, multiplier_max = multipliers[anomaly_type]
    multiplier = float(rng.uniform(multiplier_min, multiplier_max))
    observed_amount = max(0.0, normal_withdrawal * multiplier)
    return round(min(float(capacity), observed_amount), 2)


def inject_anomalies(dataset: pd.DataFrame, seed: int = RANDOM_SEED) -> pd.DataFrame:
    """Inject approximately 1% anomalies while preserving the original ML features."""
    rng = np.random.default_rng(seed)
    result = dataset.copy()
    result["normal_withdrawal"] = result["tomorrow_withdrawal"].astype(float)
    result["actual_withdrawal"] = result["normal_withdrawal"]
    result["anomaly"] = False
    result["anomaly_type"] = "None"
    result["severity"] = "None"

    anomaly_count = max(1, int(round(len(result) * ANOMALY_RATE)))
    anomaly_indices = rng.choice(result.index.to_numpy(), size=anomaly_count, replace=False)
    anomaly_labels = np.resize(ANOMALY_TYPES, anomaly_count)
    rng.shuffle(anomaly_labels)

    for row_index, anomaly_type in zip(anomaly_indices, anomaly_labels):
        normal_withdrawal = float(result.at[row_index, "normal_withdrawal"])
        capacity = float(result.at[row_index, "cash_capacity"])
        result.at[row_index, "anomaly"] = True
        result.at[row_index, "anomaly_type"] = anomaly_type
        result.at[row_index, "severity"] = ANOMALY_SEVERITY[anomaly_type]
        result.at[row_index, "actual_withdrawal"] = _anomalous_amount(
            normal_withdrawal,
            anomaly_type,
            capacity,
            rng,
        )

    return result.drop(columns=["cash_capacity"])


def validate_anomaly_dataset(dataset: pd.DataFrame, source_rows: int,
                             capacities: pd.Series) -> None:
    """Validate anomaly rate, labels, preservation, and capacity-safe withdrawals."""
    required_columns = {
        "anomaly", "anomaly_type", "severity", "normal_withdrawal", "actual_withdrawal",
    }
    if not required_columns.issubset(dataset.columns):
        raise ValueError("Anomaly columns are missing from the final ML dataset")
    if len(dataset) != source_rows:
        raise ValueError("Anomaly injection must preserve the source row count")
    expected_anomalies = max(1, int(round(source_rows * ANOMALY_RATE)))
    if int(dataset["anomaly"].sum()) != expected_anomalies:
        raise ValueError("Unexpected anomaly count")
    normal_rows = ~dataset["anomaly"]
    if not dataset.loc[normal_rows, "anomaly_type"].eq("None").all():
        raise ValueError("Normal rows must have anomaly_type=None")
    if not dataset.loc[normal_rows, "severity"].eq("None").all():
        raise ValueError("Normal rows must have severity=None")
    if not dataset.loc[normal_rows, "actual_withdrawal"].eq(dataset.loc[normal_rows, "normal_withdrawal"]).all():
        raise ValueError("Normal withdrawals must remain unchanged")
    max_capacity = dataset["atm_id"].map(capacities)
    if not dataset["actual_withdrawal"].ge(0).all() or not dataset["actual_withdrawal"].le(max_capacity).all():
        raise ValueError("Actual withdrawals exceed ATM capacity or contain invalid values")
    if not dataset.loc[dataset["anomaly"], "anomaly_type"].isin(ANOMALY_TYPES).all():
        raise ValueError("Unsupported anomaly type found")
    if not dataset.loc[dataset["anomaly"], "severity"].isin(set(ANOMALY_SEVERITY.values())).all():
        raise ValueError("Unsupported anomaly severity found")


def save_final_dataset(output_file: Path = OUTPUT_FILE) -> pd.DataFrame:
    """Load, inject, validate, and save the final anomaly-labelled ML dataset."""
    source, atm_master = load_source_data()
    result = inject_anomalies(source)
    capacities = atm_master.set_index("atm_id")["cash_capacity"]
    validate_anomaly_dataset(result, len(source), capacities)
    result.to_csv(output_file, index=False)
    return result


if __name__ == "__main__":
    generated_data = save_final_dataset()
    print(f"Generated {len(generated_data)} anomaly-labelled ML records: {OUTPUT_FILE}")