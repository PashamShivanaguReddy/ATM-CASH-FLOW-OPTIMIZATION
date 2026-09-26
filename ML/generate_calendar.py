"""Generate a realistic three-year Indian calendar dataset."""

from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd


START_DATE = "2023-01-01"
END_DATE = "2025-12-31"
RANDOM_SEED = 20260729
OUTPUT_FILE = Path(__file__).with_name("calendar.csv")

HOLIDAY_NAMES = {
    "New Year",
    "Republic Day",
    "Mahashivratri",
    "Holi",
    "Ugadi",
    "Ramzan",
    "Bakrid",
    "Independence Day",
    "Ganesh Chaturthi",
    "Dasara",
    "Diwali",
    "Christmas",
    "Gandhi Jayanti",
    "Sankranti",
    "Good Friday",
}

# Dates vary by lunar or regional calendars, so retain them by year rather than
# calculating them with fixed offsets.
HOLIDAYS: Dict[int, Dict[str, str]] = {
    2023: {
        "01-01": "New Year",
        "01-15": "Sankranti",
        "01-26": "Republic Day",
        "02-18": "Mahashivratri",
        "03-08": "Holi",
        "03-22": "Ugadi",
        "04-07": "Good Friday",
        "04-22": "Ramzan",
        "06-29": "Bakrid",
        "08-15": "Independence Day",
        "09-19": "Ganesh Chaturthi",
        "10-02": "Gandhi Jayanti",
        "10-24": "Dasara",
        "11-12": "Diwali",
        "12-25": "Christmas",
    },
    2024: {
        "01-01": "New Year",
        "01-15": "Sankranti",
        "01-26": "Republic Day",
        "03-08": "Mahashivratri",
        "03-25": "Holi",
        "03-29": "Good Friday",
        "04-09": "Ugadi",
        "04-10": "Ramzan",
        "06-17": "Bakrid",
        "08-15": "Independence Day",
        "09-07": "Ganesh Chaturthi",
        "10-02": "Gandhi Jayanti",
        "10-12": "Dasara",
        "10-31": "Diwali",
        "12-25": "Christmas",
    },
    2025: {
        "01-01": "New Year",
        "01-14": "Sankranti",
        "01-26": "Republic Day",
        "02-26": "Mahashivratri",
        "03-14": "Holi",
        "03-30": "Ugadi",
        "03-31": "Ramzan",
        "04-18": "Good Friday",
        "06-07": "Bakrid",
        "08-15": "Independence Day",
        "08-27": "Ganesh Chaturthi",
        "10-02": "Gandhi Jayanti",
        "10-20": "Diwali",
        "12-25": "Christmas",
    },
}

FESTIVAL_OVERRIDES = {
    "2025-10-02": "Dasara",
}

WEATHER_TYPES = ["Sunny", "Cloudy", "Rainy", "Storm"]
EVENT_TYPES = [
    "Cricket Match",
    "Political Rally",
    "Temple Festival",
    "Concert",
    "Shopping Festival",
    "Weekly Market",
    "Election",
]


def _weather_profile(month: int) -> Tuple[List[str], List[float], Tuple[int, int], Tuple[int, int]]:
    """Return seasonal weather probabilities and ranges for an Indian calendar."""
    if month in (6, 7, 8, 9):
        return WEATHER_TYPES, [0.12, 0.25, 0.50, 0.13], (24, 34), (65, 98)
    if month in (3, 4, 5):
        return WEATHER_TYPES, [0.52, 0.25, 0.12, 0.11], (25, 42), (25, 75)
    if month in (10, 11, 12, 1, 2):
        return WEATHER_TYPES, [0.62, 0.28, 0.07, 0.03], (12, 31), (30, 78)
    raise ValueError(f"Invalid month: {month}")


def _holiday_lookup() -> Dict[str, str]:
    """Flatten year-specific holiday definitions into ISO date keys."""
    holidays: Dict[str, str] = {}
    for year, year_holidays in HOLIDAYS.items():
        for month_day, holiday_name in year_holidays.items():
            date_key = f"{year}-{month_day}"
            if date_key in holidays:
                raise ValueError(f"Duplicate holiday date: {date_key}")
            holidays[date_key] = holiday_name
    return holidays


def _local_event(date: pd.Timestamp, rng: np.random.Generator) -> Optional[str]:
    """Assign events with recurring weekly markets and occasional major events."""
    if date.dayofweek == 6:
        return "Weekly Market"
    if rng.random() < 0.08:
        return str(rng.choice(EVENT_TYPES))
    return None


def generate_calendar(start_date: str = START_DATE, end_date: str = END_DATE,
                      seed: int = RANDOM_SEED) -> pd.DataFrame:
    """Generate one row for every date in the requested range."""
    dates = pd.date_range(start=start_date, end=end_date, freq="D")
    rng = np.random.default_rng(seed)
    holiday_lookup = _holiday_lookup()
    records: List[dict] = []

    for date in dates:
        weather_choices, weather_probabilities, temperature_range, humidity_range = _weather_profile(date.month)
        weather = str(rng.choice(weather_choices, p=weather_probabilities))
        rainfall = {
            "Sunny": (0.0, 2.0),
            "Cloudy": (0.0, 8.0),
            "Rainy": (8.0, 55.0),
            "Storm": (35.0, 140.0),
        }[weather]
        date_key = date.strftime("%Y-%m-%d")
        records.append(
            {
                "date": date_key,
                "day_of_week": date.day_name(),
                "week_number": int(date.isocalendar()[1]),
                "month": int(date.month),
                "quarter": f"Q{date.quarter}",
                "year": int(date.year),
                "is_weekend": bool(date.dayofweek >= 5),
                "is_month_start": bool(date.is_month_start),
                "is_month_end": bool(date.is_month_end),
                "is_salary_day": bool(date.day in (1, 7, 25, 30)),
                "holiday_name": holiday_lookup.get(date_key),
                "festival_name": FESTIVAL_OVERRIDES.get(date_key, holiday_lookup.get(date_key)),
                "weather": weather,
                "temperature": round(float(rng.uniform(*temperature_range)), 1),
                "humidity": int(rng.integers(humidity_range[0], humidity_range[1] + 1)),
                "rainfall": round(float(rng.uniform(*rainfall)), 1),
                "local_event": _local_event(date, rng),
            }
        )

    return pd.DataFrame(records)


def validate_calendar(dataframe: pd.DataFrame, start_date: str = START_DATE,
                      end_date: str = END_DATE) -> None:
    """Validate calendar completeness, schema, and allowed categorical values."""
    required_columns = [
        "date", "day_of_week", "week_number", "month", "quarter", "year",
        "is_weekend", "is_month_start", "is_month_end", "is_salary_day",
        "holiday_name", "festival_name", "weather", "temperature", "humidity",
        "rainfall", "local_event",
    ]
    missing_columns = set(required_columns) - set(dataframe.columns)
    if missing_columns:
        raise ValueError(f"Missing required columns: {sorted(missing_columns)}")

    expected_dates = pd.date_range(start=start_date, end=end_date, freq="D").strftime("%Y-%m-%d")
    actual_dates = dataframe["date"].astype(str).tolist()
    if actual_dates != expected_dates.tolist():
        raise ValueError("Calendar must contain every date exactly once and in order")
    if not dataframe["weather"].isin(WEATHER_TYPES).all():
        raise ValueError("Dataset contains an unsupported weather type")
    if not dataframe["local_event"].dropna().isin(EVENT_TYPES).all():
        raise ValueError("Dataset contains an unsupported local event")
    if not dataframe["holiday_name"].dropna().isin(HOLIDAY_NAMES).all():
        raise ValueError("Dataset contains an unsupported holiday")
    if not dataframe["festival_name"].dropna().isin(HOLIDAY_NAMES).all():
        raise ValueError("Dataset contains an unsupported festival")
    generated_names = set(dataframe["holiday_name"].dropna()) | set(dataframe["festival_name"].dropna())
    if generated_names != HOLIDAY_NAMES:
        raise ValueError("Dataset does not include every requested holiday or festival")
    if not dataframe["humidity"].between(0, 100).all() or not dataframe["rainfall"].ge(0).all():
        raise ValueError("Weather measurements are outside valid ranges")


def save_calendar(output_file: Path = OUTPUT_FILE) -> pd.DataFrame:
    """Generate, validate, and save the Indian calendar CSV."""
    dataframe = generate_calendar()
    validate_calendar(dataframe)
    dataframe.to_csv(output_file, index=False)
    return dataframe


if __name__ == "__main__":
    generated_data = save_calendar()
    print(f"Generated {len(generated_data)} calendar dates: {OUTPUT_FILE}")