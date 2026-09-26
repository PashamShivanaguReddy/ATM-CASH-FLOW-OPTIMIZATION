"""Generate a realistic Indian ATM master dataset."""

from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
from faker import Faker


RECORD_COUNT = 100
RANDOM_SEED = 20260729
OUTPUT_FILE = Path(__file__).with_name("atm_master.csv")

BANKS = [
    "SBI",
    "HDFC",
    "ICICI",
    "Axis",
    "PNB",
    "Canara",
    "Union Bank",
    "Bank of Baroda",
]

CITY_DETAILS: Dict[str, Dict[str, object]] = {
    "Hyderabad": {"state": "Telangana", "latitude": 17.3850, "longitude": 78.4867},
    "Bengaluru": {"state": "Karnataka", "latitude": 12.9716, "longitude": 77.5946},
    "Chennai": {"state": "Tamil Nadu", "latitude": 13.0827, "longitude": 80.2707},
    "Mumbai": {"state": "Maharashtra", "latitude": 19.0760, "longitude": 72.8777},
    "Delhi": {"state": "Delhi", "latitude": 28.6139, "longitude": 77.2090},
    "Pune": {"state": "Maharashtra", "latitude": 18.5204, "longitude": 73.8567},
    "Visakhapatnam": {"state": "Andhra Pradesh", "latitude": 17.6868, "longitude": 83.2185},
    "Kolkata": {"state": "West Bengal", "latitude": 22.5726, "longitude": 88.3639},
    "Ahmedabad": {"state": "Gujarat", "latitude": 23.0225, "longitude": 72.5714},
    "Jaipur": {"state": "Rajasthan", "latitude": 26.9124, "longitude": 75.7873},
}

ATM_TYPES = [
    "Airport",
    "Mall",
    "Railway Station",
    "Hospital",
    "Residential",
    "Village",
    "College",
    "Bus Stand",
    "IT Park",
    "Tourist Area",
    "Market Area",
]

DEMAND_BANDS: Dict[str, Tuple[int, int]] = {
    "Airport": (260, 520),
    "Mall": (220, 440),
    "IT Park": (190, 380),
    "Market Area": (170, 350),
    "Railway Station": (160, 340),
    "Tourist Area": (150, 320),
    "Bus Stand": (130, 290),
    "Hospital": (110, 250),
    "College": (90, 220),
    "Residential": (70, 180),
    "Village": (30, 100),
}


def generate_atm_records(record_count: int = RECORD_COUNT, seed: int = RANDOM_SEED) -> pd.DataFrame:
    """Create ATM records with reproducible values and realistic constraints."""
    if record_count <= 0:
        raise ValueError("record_count must be greater than zero")

    fake = Faker("en_IN")
    fake.seed_instance(seed)
    rng = np.random.default_rng(seed)
    cities = list(CITY_DETAILS)

    records: List[dict] = []
    for index in range(record_count):
        city = cities[index % len(cities)]
        city_detail = CITY_DETAILS[city]
        atm_type = str(rng.choice(ATM_TYPES))
        demand_min, demand_max = DEMAND_BANDS[atm_type]
        average_daily_withdrawal = int(rng.integers(demand_min, demand_max + 1))
        cash_capacity = int(rng.choice([500000, 750000, 1000000, 1500000, 2000000]))
        threshold_ratio = float(rng.uniform(0.20, 0.35))

        records.append(
            {
                "atm_id": f"ATM{index + 1:04d}",
                "bank_name": str(rng.choice(BANKS)),
                "city": city,
                "state": city_detail["state"],
                "locality": fake.street_name(),
                "latitude": round(float(city_detail["latitude"]) + rng.uniform(-0.08, 0.08), 6),
                "longitude": round(float(city_detail["longitude"]) + rng.uniform(-0.08, 0.08), 6),
                "atm_type": atm_type,
                "cash_capacity": cash_capacity,
                "installation_year": int(rng.integers(2010, 2025)),
                "average_daily_withdrawal": average_daily_withdrawal,
                "cash_replenishment_threshold": int(cash_capacity * threshold_ratio),
                "operating_hours": "24x7",
            }
        )

    return pd.DataFrame(records)


def validate_atm_master(dataframe: pd.DataFrame, expected_count: int = RECORD_COUNT) -> None:
    """Validate the generated schema and key business rules."""
    required_columns = [
        "atm_id", "bank_name", "city", "state", "locality", "latitude", "longitude",
        "atm_type", "cash_capacity", "installation_year", "average_daily_withdrawal",
        "cash_replenishment_threshold", "operating_hours",
    ]
    missing_columns = set(required_columns) - set(dataframe.columns)
    if missing_columns:
        raise ValueError(f"Missing required columns: {sorted(missing_columns)}")
    if len(dataframe) != expected_count or dataframe["atm_id"].nunique() != expected_count:
        raise ValueError("Dataset must contain the expected number of unique ATMs")
    if not dataframe["bank_name"].isin(BANKS).all():
        raise ValueError("Dataset contains an unsupported bank")
    if not dataframe["city"].isin(CITY_DETAILS).all() or not dataframe["atm_type"].isin(ATM_TYPES).all():
        raise ValueError("Dataset contains an unsupported city or ATM type")
    if not (dataframe["cash_replenishment_threshold"] < dataframe["cash_capacity"]).all():
        raise ValueError("Replenishment thresholds must be below cash capacity")


def save_atm_master(output_file: Path = OUTPUT_FILE) -> pd.DataFrame:
    """Generate, validate, and save the ATM master CSV."""
    dataframe = generate_atm_records()
    validate_atm_master(dataframe)
    dataframe.to_csv(output_file, index=False)
    return dataframe


if __name__ == "__main__":
    generated_data = save_atm_master()
    print(f"Generated {len(generated_data)} ATMs: {OUTPUT_FILE}")