"""Training entrypoint for the ATM seven-day forecasting engine."""
from pathlib import Path
from typing import Dict, List, Tuple

import json
import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from config import FEATURE_COLUMNS, MODEL_PATH, METRICS_PATH, PREDICTION_RESULTS_PATH, RAW_DATA_PATH, RANDOM_SEED
from feature_engineering import build_model_input, load_and_prepare_data
from utils import build_prediction_table, ensure_directory, mape, save_json, save_pickle, summarise_feature_importance


def create_candidate_models() -> Dict[str, object]:
    """Create the set of benchmark models for the seven-day forecasting task."""
    models: Dict[str, object] = {
        "Random Forest": RandomForestRegressor(
            n_estimators=140,
            max_depth=16,
            min_samples_leaf=3,
            max_features="sqrt",
            random_state=RANDOM_SEED,
            n_jobs=-1,
        ),
        "Gradient Boosting": GradientBoostingRegressor(
            n_estimators=160,
            learning_rate=0.07,
            max_depth=3,
            random_state=RANDOM_SEED,
        ),
    }

    try:
        import xgboost as xgb

        models["XGBoost"] = xgb.XGBRegressor(
            n_estimators=400,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.9,
            colsample_bytree=0.9,
            objective="reg:squarederror",
            random_state=RANDOM_SEED,
            n_jobs=-1,
        )
    except Exception:
        pass

    try:
        import lightgbm as lgb

        models["LightGBM"] = lgb.LGBMRegressor(
            n_estimators=400,
            learning_rate=0.05,
            num_leaves=31,
            random_state=RANDOM_SEED,
            n_jobs=-1,
        )
    except Exception:
        pass

    try:
        import catboost as cb

        models["CatBoost"] = cb.CatBoostRegressor(
            iterations=400,
            learning_rate=0.05,
            depth=8,
            loss_function="RMSE",
            random_seed=RANDOM_SEED,
            verbose=False,
        )
    except Exception:
        pass

    return models


def split_train_test(data: pd.DataFrame, test_size: float = 0.20) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Split each ATM history chronologically without shuffling."""
    train_parts: List[pd.DataFrame] = []
    test_parts: List[pd.DataFrame] = []

    for _, group in data.groupby("atm_id", sort=False):
        ordered = group.sort_values("date").reset_index(drop=True)
        if len(ordered) < 5:
            train_parts.append(ordered)
            continue
        split_index = max(1, int(len(ordered) * (1.0 - test_size)))
        train_parts.append(ordered.iloc[:split_index].copy())
        test_parts.append(ordered.iloc[split_index:].copy())

    train = pd.concat(train_parts, ignore_index=True).sort_values(["atm_id", "date"]).reset_index(drop=True)
    test = pd.concat(test_parts, ignore_index=True).sort_values(["atm_id", "date"]).reset_index(drop=True)
    return train, test


def fit_seven_day_regressors(train_features: pd.DataFrame, train_targets: pd.DataFrame, model: object) -> List[object]:
    """Train one cloned model per forecast horizon."""
    horizon_models = []
    for horizon in range(1, 8):
        horizon_model = clone(model)
        horizon_model.fit(train_features, train_targets[f"next_day_{horizon}"])
        horizon_models.append(horizon_model)
    return horizon_models


def benchmark_models(train: pd.DataFrame, test: pd.DataFrame) -> Tuple[Dict[str, object], pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Benchmark every candidate regressor over the seven-day horizon."""
    train_features, train_targets = build_model_input(train, FEATURE_COLUMNS)
    test_features, test_targets = build_model_input(test, FEATURE_COLUMNS)

    benchmark_rows = []
    best_overall = None
    best_summary = None

    for model_name, model in create_candidate_models().items():
        horizon_models = fit_seven_day_regressors(train_features, train_targets, model)
        horizon_predictions = []
        for horizon_model in horizon_models:
            horizon_prediction = np.maximum(0.0, horizon_model.predict(test_features))
            horizon_predictions.append(horizon_prediction)

        horizon_predictions = np.column_stack(horizon_predictions)
        horizon_metrics = []
        for horizon in range(1, 8):
            target_column = test_targets[f"next_day_{horizon}"].to_numpy()
            horizon_metric = {
                "horizon": horizon,
                "mae": float(mean_absolute_error(target_column, horizon_predictions[:, horizon - 1])),
                "rmse": float(mean_squared_error(target_column, horizon_predictions[:, horizon - 1]) ** 0.5),
                "mape": float(mape(pd.Series(target_column), horizon_predictions[:, horizon - 1])),
                "r2": float(r2_score(target_column, horizon_predictions[:, horizon - 1])),
            }
            horizon_metrics.append(horizon_metric)

        aggregate = {
            "model": model_name,
            "avg_rmse": float(np.mean([metric["rmse"] for metric in horizon_metrics])),
            "avg_mae": float(np.mean([metric["mae"] for metric in horizon_metrics])),
            "avg_mape": float(np.mean([metric["mape"] for metric in horizon_metrics])),
            "avg_r2": float(np.mean([metric["r2"] for metric in horizon_metrics])),
            "horizons": horizon_metrics,
        }
        benchmark_rows.append(aggregate)

        if best_overall is None or aggregate["avg_rmse"] < best_summary["avg_rmse"]:
            confidence = round(
                float(
                    min(
                        0.99,
                        max(
                            0.55,
                            0.50 + (aggregate["avg_r2"] * 0.35) + max(0.0, (1.0 - aggregate["avg_mape"]) * 0.10),
                        ),
                    )
                ),
                4,
            )
            interval_width = round(float(max(0.05, min(0.18, (1.0 - confidence) * 0.40))), 4)
            best_overall = {
                "model_name": model_name,
                "models": horizon_models,
                "feature_columns": FEATURE_COLUMNS,
                "confidence": confidence,
                "prediction_interval_width": interval_width,
            }
            best_summary = aggregate

    benchmark = pd.DataFrame(benchmark_rows).sort_values("avg_rmse").reset_index(drop=True)
    if best_overall is None:
        raise RuntimeError("No candidate model could be trained.")

    best_predictions = np.column_stack([predictor.predict(test_features) for predictor in best_overall["models"]])
    best_predictions = np.maximum(0.0, best_predictions)
    prediction_table = build_prediction_table(test, best_predictions.mean(axis=1))
    return best_overall, benchmark, test_features, prediction_table


def persist_artifacts(best_model: Dict[str, object], metrics_payload: Dict[str, object], prediction_table: pd.DataFrame) -> None:
    """Persist the trained artifact bundle and evaluation tables."""
    ensure_directory(MODEL_PATH)
    save_pickle(best_model, MODEL_PATH)
    save_json(metrics_payload, METRICS_PATH)
    prediction_table.to_csv(PREDICTION_RESULTS_PATH, index=False)

    importance_df = summarise_feature_importance(best_model["models"][0], FEATURE_COLUMNS)
    importance_df.columns = ["feature", "importance"]
    importance_df.to_csv(Path("project/feature_importance.csv"), index=False)


def main() -> None:
    """Run the complete training and benchmark export workflow."""
    data = load_and_prepare_data(str(RAW_DATA_PATH))
    train, test = split_train_test(data, test_size=0.20)
    best_model, benchmark, test_features, prediction_table = benchmark_models(train, test)
    metrics_payload = {
        "best_model": best_model["model_name"],
        "benchmarks": benchmark.to_dict(orient="records"),
    }
    persist_artifacts(best_model, metrics_payload, prediction_table)
    print(json.dumps(metrics_payload, indent=2))


if __name__ == "__main__":
    main()
