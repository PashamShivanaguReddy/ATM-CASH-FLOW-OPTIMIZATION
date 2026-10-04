# ATM Forecast and Replenishment Hybrid Service

This project contains a production-ready Python pipeline for forecasting the next 7 days of ATM withdrawals and converting that forecast into a replenishment decision engine.

## Modules

- `src/config.py`: shared project configuration and path constants.
- `src/feature_engineering.py`: chronological preprocessing and feature engineering.
- `src/train.py`: model benchmarking and training entrypoint.
- `src/predict.py`: forecast interface for the persisted model bundle.
- `src/decision_engine.py`: business-rule refill decision logic.
- `src/forecast_service.py`: orchestration between the ML forecast and decision engine.
- `src/route_optimizer.py`: optional OR-Tools route planner with a deterministic fallback.

## Inference model

The inference service loads `models/atm_forecast_model_gbr_candidate.pkl` by default.
Set `ML_MODEL_PATH` to override the prediction artifact path. The training output
`models/atm_forecast_model.pkl` remains the Random Forest artifact and is not used
as the inference default.

The deployed candidate contains seven `GradientBoostingRegressor` horizon models
with 160 estimators per model and `max_depth=3`, trained with scikit-learn 1.2.2.

## Run

```bash
PYTHONPATH=project/src python -c "import train; train.main()"
```

## Outputs

- `project/models/atm_forecast_model.pkl`
- `project/model_metrics.json`
- `project/prediction_results.csv`
- `project/feature_importance.csv`
