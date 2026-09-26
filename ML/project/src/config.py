"""Central configuration for the ATM forecast service."""
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
PLOTS_DIR = BASE_DIR / "plots"
SRC_DIR = BASE_DIR / "src"

RAW_DATA_PATH = Path(__import__("os").environ.get("ML_DATA_PATH", str(BASE_DIR.parent / "ml_dataset_final.csv")))
MODEL_PATH = MODELS_DIR / "atm_forecast_model.pkl"
METRICS_PATH = BASE_DIR / "model_metrics.json"
PREDICTION_RESULTS_PATH = BASE_DIR / "prediction_results.csv"
FEATURE_IMPORTANCE_PATH = BASE_DIR / "feature_importance.csv"

ID_COLUMN = "atm_id"
DATE_COLUMN = "date"
TARGET_COLUMN = "tomorrow_withdrawal"
FORECAST_HORIZON = 7
RANDOM_SEED = 20260729

FEATURE_COLUMNS = [
    "previous_day_withdrawal",
    "rolling_average_3",
    "rolling_average_7",
    "rolling_average_14",
    "rolling_average_30",
    "monthly_average",
    "quarterly_average",
    "withdrawal_growth_rate",
    "cash_remaining_percentage",
    "festival_weight",
    "holiday_weight",
    "salary_day_weight",
    "weather_weight",
    "event_weight",
    "atm_type_encoded",
    "city_encoded",
    "days_since_last_refill",
    "cash_utilisation",
]
