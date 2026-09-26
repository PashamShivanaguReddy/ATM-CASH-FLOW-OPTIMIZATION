"""Evaluate an ATM withdrawal model and export prediction diagnostics."""

from pathlib import Path
from typing import Dict, Optional, Tuple

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)


BASE_DIR = Path(__file__).parent
INPUT_FILE = BASE_DIR / "ml_dataset_final.csv"
MODEL_FILE = BASE_DIR / "atm_model.joblib"
OUTPUT_DIR = BASE_DIR / "model_evaluation"
PREDICTION_FILE = OUTPUT_DIR / "prediction_results.csv"
RANDOM_SEED = 20260729
TARGET = "tomorrow_withdrawal"

FEATURES = [
    "previous_day_withdrawal", "rolling_average_3", "rolling_average_7",
    "rolling_average_14", "rolling_average_30", "monthly_average",
    "quarterly_average", "withdrawal_growth_rate", "cash_remaining_percentage",
    "festival_weight", "holiday_weight", "salary_day_weight", "weather_weight",
    "event_weight", "atm_type_encoded", "city_encoded", "days_since_last_refill",
    "cash_utilisation",
]


def load_data() -> pd.DataFrame:
    """Load and validate the final ML dataset."""
    data = pd.read_csv(INPUT_FILE, parse_dates=["date"])
    missing = set(FEATURES + [TARGET, "atm_id", "date"]) - set(data.columns)
    if missing:
        raise ValueError("Missing evaluation columns: {}".format(sorted(missing)))
    data = data.sort_values(["date", "atm_id"]).reset_index(drop=True)
    if data[FEATURES + [TARGET]].isna().any().any():
        raise ValueError("Evaluation features or target contain missing values")
    return data


def load_or_train_model(train: pd.DataFrame, feature_columns: list) -> Tuple[object, str]:
    """Load a compatible saved model, or train the reproducible fallback model."""
    if MODEL_FILE.exists():
        try:
            import joblib
            model = joblib.load(MODEL_FILE)
            if hasattr(model, "predict") and list(getattr(model, "feature_names_in_", feature_columns)) == feature_columns:
                return model, "loaded saved model: {}".format(MODEL_FILE.name)
        except Exception:
            pass

    model = RandomForestRegressor(
        n_estimators=160,
        max_depth=18,
        min_samples_leaf=3,
        max_features="sqrt",
        random_state=RANDOM_SEED,
        n_jobs=-1,
    )
    model.fit(train[feature_columns], train[TARGET])
    return model, "trained RandomForestRegressor fallback; no compatible saved model found"


def calculate_mape(actual: pd.Series, predicted: np.ndarray) -> float:
    """Calculate MAPE while excluding zero actual values from the denominator."""
    actual_values = actual.to_numpy(dtype=float)
    predicted_values = np.asarray(predicted, dtype=float)
    nonzero = actual_values != 0
    if not nonzero.any():
        return float("nan")
    return float(np.mean(np.abs((actual_values[nonzero] - predicted_values[nonzero]) / actual_values[nonzero])) * 100.0)


def build_predictions(test: pd.DataFrame, predictions: np.ndarray) -> pd.DataFrame:
    """Create the requested comparison table and error fields."""
    result = pd.DataFrame({
        "ATM_ID": test["atm_id"].values,
        "Date": test["date"].dt.strftime("%Y-%m-%d").values,
        "Actual Withdrawal": test[TARGET].values,
        "Predicted Withdrawal": np.maximum(0.0, predictions),
    })
    result["Prediction Error"] = result["Actual Withdrawal"] - result["Predicted Withdrawal"]
    result["Percentage Error"] = np.where(
        result["Actual Withdrawal"].ne(0),
        result["Prediction Error"].abs() / result["Actual Withdrawal"].abs() * 100.0,
        np.nan,
    )
    result["High Error (>20%)"] = result["Percentage Error"] > 20.0
    return result


def save_plots(test: pd.DataFrame, predictions: np.ndarray, results: pd.DataFrame,
               model: object, feature_columns: list) -> None:
    """Save all requested evaluation plots."""
    actual = test[TARGET].to_numpy()
    residuals = actual - predictions
    plt.style.use("seaborn-whitegrid")

    fig, ax = plt.subplots(figsize=(9, 7))
    ax.scatter(actual, predictions, alpha=0.25, s=10, color="#1976a2")
    axis_min = min(actual.min(), predictions.min())
    axis_max = max(actual.max(), predictions.max())
    ax.plot([axis_min, axis_max], [axis_min, axis_max], "r--", label="Perfect prediction")
    ax.set(xlabel="Actual withdrawal", ylabel="Predicted withdrawal", title="Actual vs Predicted Scatter Plot")
    ax.legend()
    fig.tight_layout()
    fig.savefig(OUTPUT_DIR / "actual_vs_predicted_scatter.png", dpi=160)
    plt.close(fig)

    ordered = test.assign(predicted=predictions).sort_values(["date", "atm_id"])
    fig, ax = plt.subplots(figsize=(14, 6))
    ax.plot(ordered["date"], ordered[TARGET], label="Actual", alpha=0.65, linewidth=1)
    ax.plot(ordered["date"], ordered["predicted"], label="Predicted", alpha=0.65, linewidth=1)
    ax.set(xlabel="Date", ylabel="Withdrawal", title="Actual vs Predicted Line Graph")
    ax.legend()
    fig.autofmt_xdate()
    fig.tight_layout()
    fig.savefig(OUTPUT_DIR / "actual_vs_predicted_line.png", dpi=160)
    plt.close(fig)

    fig, ax = plt.subplots(figsize=(9, 6))
    ax.scatter(predictions, residuals, alpha=0.25, s=10, color="#e76f51")
    ax.axhline(0, color="black", linestyle="--")
    ax.set(xlabel="Predicted withdrawal", ylabel="Residual (actual - predicted)", title="Residual Error Plot")
    fig.tight_layout()
    fig.savefig(OUTPUT_DIR / "residual_error.png", dpi=160)
    plt.close(fig)

    fig, ax = plt.subplots(figsize=(9, 6))
    ax.hist(residuals, bins=50, color="#2a9d8f", edgecolor="white")
    ax.set(xlabel="Prediction error", ylabel="Frequency", title="Error Distribution Histogram")
    fig.tight_layout()
    fig.savefig(OUTPUT_DIR / "error_distribution.png", dpi=160)
    plt.close(fig)

    if hasattr(model, "feature_importances_"):
        importance = pd.Series(model.feature_importances_, index=feature_columns).sort_values()
        fig, ax = plt.subplots(figsize=(10, 7))
        importance.plot(kind="barh", ax=ax, color="#6a4c93")
        ax.set(xlabel="Importance", title="Feature Importance")
        fig.tight_layout()
        fig.savefig(OUTPUT_DIR / "feature_importance.png", dpi=160)
        plt.close(fig)

    largest = results.nlargest(20, "Percentage Error").sort_values("Percentage Error")
    fig, ax = plt.subplots(figsize=(11, 8))
    labels = largest["ATM_ID"] + " | " + largest["Date"]
    ax.barh(labels, largest["Percentage Error"], color="#e63946")
    ax.axvline(20, color="black", linestyle="--", label="20% threshold")
    ax.set(xlabel="Absolute percentage error", title="Top 20 Largest Prediction Errors")
    ax.legend()
    fig.tight_layout()
    fig.savefig(OUTPUT_DIR / "top_20_prediction_errors.png", dpi=160)
    plt.close(fig)


def write_report(metrics: Dict[str, float], summary: Dict[str, object], model_source: str,
                 results: pd.DataFrame, feature_columns: list) -> None:
    """Write metrics, summary, flagged rows, samples, and conclusion to text files."""
    flagged = results[results["High Error (>20%)"]].sort_values("Percentage Error", ascending=False)
    flagged.to_csv(OUTPUT_DIR / "high_error_predictions.csv", index=False)
    results.sample(n=min(20, len(results)), random_state=RANDOM_SEED).to_csv(
        OUTPUT_DIR / "random_prediction_samples.csv", index=False
    )

    actual_mean = summary["actual_mean"]
    mae_ratio = metrics["mae"] / actual_mean if actual_mean else float("inf")
    if metrics["r2"] < 0.50 or mae_ratio > 0.25:
        conclusion = "Accuracy is not yet strong enough for unattended cash-replenishment decisions."
    elif metrics["r2"] < 0.75 or mae_ratio > 0.15:
        conclusion = "The model is usable as a decision-support forecast, with operational guardrails."
    else:
        conclusion = "The model is a strong forecasting candidate, subject to live-data validation."
    overfit_note = "The chronological holdout is the main overfitting check; compare this result with cross-validation before deployment."

    report = """ATM CASH DEMAND MODEL EVALUATION
================================

Model source: {model_source}
Features used: {features}

TEST METRICS
------------
Total test records: {records:,}
MAE: {mae:,.2f}
MSE: {mse:,.2f}
RMSE: {rmse:,.2f}
MAPE: {mape:,.2f}%
R2 Score: {r2:,.4f}

ERROR SUMMARY
-------------
Average absolute error: {avg_error:,.2f}
Maximum absolute error: {max_error:,.2f}
Minimum absolute error: {min_error:,.2f}
Best prediction: {best}
Worst prediction: {worst}
Rows above 20% error: {high_error:,} ({high_error_rate:.2f}%)

CONCLUSION
----------
{conclusion}
{overfit_note}
The model should not be called overfit or underfit from one holdout alone; add rolling time-series validation and compare train versus test error.

RECOMMENDATIONS
---------------
* Add real ATM cash-out/refill logs, outages, bank holidays, weather by location, and cash-in-transit lead times.
* Tune Gradient Boosting, XGBoost or LightGBM against the Random Forest baseline using time-series cross-validation.
* Keep lag and rolling features strictly prior-only; fit transformations on training data only.
* Treat anomalies as operational signals. Compare training with anomaly rows retained, capped, and separately modelled.
* Optimise business metrics too: stockout rate, emergency refill rate, excess cash, and service-level attainment.
""".format(
        model_source=model_source,
        features=", ".join(feature_columns),
        records=summary["records"], mae=metrics["mae"], mse=metrics["mse"], rmse=metrics["rmse"],
        mape=metrics["mape"], r2=metrics["r2"], avg_error=summary["avg_error"],
        max_error=summary["max_error"], min_error=summary["min_error"], best=summary["best"],
        worst=summary["worst"], high_error=summary["high_error"],
        high_error_rate=summary["high_error_rate"], conclusion=conclusion, overfit_note=overfit_note,
    )
    (OUTPUT_DIR / "evaluation_report.txt").write_text(report, encoding="utf-8")
    pd.DataFrame([metrics]).to_csv(OUTPUT_DIR / "evaluation_metrics.csv", index=False)


def main() -> None:
    """Run the complete evaluation from input loading through artifact export."""
    OUTPUT_DIR.mkdir(exist_ok=True)
    data = load_data()
    split_index = int(len(data) * 0.80)
    train = data.iloc[:split_index].copy()
    test = data.iloc[split_index:].copy()
    model, model_source = load_or_train_model(train, FEATURES)
    predictions = model.predict(test[FEATURES])
    results = build_predictions(test, predictions)
    results.to_csv(PREDICTION_FILE, index=False)

    actual = test[TARGET]
    metrics = {
        "mae": float(mean_absolute_error(actual, predictions)),
        "mse": float(mean_squared_error(actual, predictions)),
        "rmse": float(mean_squared_error(actual, predictions) ** 0.5),
        "mape": calculate_mape(actual, predictions),
        "r2": float(r2_score(actual, predictions)),
    }
    absolute_errors = results["Prediction Error"].abs()
    best_index = results["Percentage Error"].idxmin()
    worst_index = results["Percentage Error"].idxmax()
    summary = {
        "records": len(test),
        "actual_mean": float(actual.mean()),
        "avg_error": float(absolute_errors.mean()),
        "max_error": float(absolute_errors.max()),
        "min_error": float(absolute_errors.min()),
        "best": "{} on {} ({:.2f}%)".format(results.loc[best_index, "ATM_ID"], results.loc[best_index, "Date"], results.loc[best_index, "Percentage Error"]),
        "worst": "{} on {} ({:.2f}%)".format(results.loc[worst_index, "ATM_ID"], results.loc[worst_index, "Date"], results.loc[worst_index, "Percentage Error"]),
        "high_error": int(results["High Error (>20%)"].sum()),
        "high_error_rate": float(results["High Error (>20%)"].mean() * 100.0),
    }
    save_plots(test, predictions, results, model, FEATURES)
    write_report(metrics, summary, model_source, results, FEATURES)

    print(model_source)
    print("Total Test Records:", summary["records"])
    print("Average Error: {:.2f}".format(summary["avg_error"]))
    print("Maximum Error: {:.2f}".format(summary["max_error"]))
    print("Minimum Error: {:.2f}".format(summary["min_error"]))
    print("Best Prediction:", summary["best"])
    print("Worst Prediction:", summary["worst"])
    print("MAE: {:.2f} | MSE: {:.2f} | RMSE: {:.2f} | MAPE: {:.2f}% | R2: {:.4f}".format(
        metrics["mae"], metrics["mse"], metrics["rmse"], metrics["mape"], metrics["r2"]
    ))
    print("Rows with error >20%:", summary["high_error"])
    print("\n20 random prediction samples:")
    print(results.sample(n=min(20, len(results)), random_state=RANDOM_SEED).to_string(index=False))
    print("\nSaved evaluation artifacts to:", OUTPUT_DIR)


if __name__ == "__main__":
    main()