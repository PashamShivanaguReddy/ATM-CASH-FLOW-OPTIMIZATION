# ATM Cash Forecasting and Decision Intelligence Report

## Table of Contents

- [1. Executive Summary](#1-executive-summary)
- [2. Business Goal](#2-business-goal)
- [3. Project Architecture](#3-project-architecture)
- [4. Data and Feature Pipeline](#4-data-and-feature-pipeline)
- [5. Forecast Model Design](#5-forecast-model-design)
- [6. Business Decision Engine](#6-business-decision-engine)
- [7. Hybrid Orchestration Service](#7-hybrid-orchestration-service)
- [8. Route Optimization Layer](#8-route-optimization-layer)
- [9. API and Service Interface](#9-api-and-service-interface)
- [10. Sample Response Shape](#10-sample-response-shape)
- [11. Validation and Regression Testing](#11-validation-and-regression-testing)
- [12. Operational Workflow](#12-operational-workflow)
- [13. What Makes This Application Strong](#13-what-makes-this-application-strong)
- [14. Current Status](#14-current-status)
- [15. Practical Limitations and Future Improvements](#15-practical-limitations-and-future-improvements)
- [16. Final Conclusion](#16-final-conclusion)

---

## 1. Executive Summary

This application is a hybrid ATM cash-management system that combines:

- a 7-day withdrawal forecasting model,
- a business risk and refill decision engine,
- a route optimization layer for cash-van planning,
- and a service/API interface for operational use.

The core idea is not only to forecast user withdrawals, but to decide whether each ATM needs cash replenishment, how much to refill, and how to prioritize servicing across multiple ATM locations.

The project keeps the trained machine-learning model frozen and improves only the business layer, consistent with a real bank-style ATM cash management process.

---

## 2. Business Goal

The system is designed to answer three operational questions:

1. How much cash will each ATM withdraw over the next 7 days?
2. Is the ATM at risk of running out of cash before the next cash-van visit?
3. If risk is elevated, how much cash should be replenished and in what route order should the ATM be serviced?

This is a real-world decision support workflow for ATM cash operations rather than a simple next-day prediction problem.

---

## 3. Project Architecture

### 3.1 Main Components

The application is split into several functional layers:

- Data generation and preparation
- Exploratory analysis and dataset engineering
- Model training and validation
- Forecast inference
- Risk and refill decision logic
- Route plan generation
- API/service orchestration

### 3.2 Key Files

- [generate_atm_master.py](generate_atm_master.py)
- [generate_calendar.py](generate_calendar.py)
- [generate_transactions.py](generate_transactions.py)
- [generate_transactions_realistic.py](generate_transactions_realistic.py)
- [generate_ml_dataset.py](generate_ml_dataset.py)
- [run_eda.py](run_eda.py)
- [project/src/config.py](project/src/config.py)
- [project/src/feature_engineering.py](project/src/feature_engineering.py)
- [project/src/train.py](project/src/train.py)
- [project/src/predict.py](project/src/predict.py)
- [project/src/decision_engine.py](project/src/decision_engine.py)
- [project/src/forecast_service.py](project/src/forecast_service.py)
- [project/src/route_optimizer.py](project/src/route_optimizer.py)
- [project/src/api.py](project/src/api.py)
- [run_test_cases.py](run_test_cases.py)
- [tests/test_business_regression.py](tests/test_business_regression.py)

---

## 4. Data and Feature Pipeline

### 4.1 Input Data

The system uses a synthetic but realistic ATM dataset with fields such as:

- ATM ID
- Transaction date
- Withdrawals
- ATM type
- City / regional metadata
- Weather and event context
- Calendar features such as holidays and salary days
- Refill and cash-capacity information

The major dataset file used for model training is:

- [ml_dataset_final.csv](ml_dataset_final.csv)

### 4.2 Feature Engineering

The feature engineering logic is implemented in [project/src/feature_engineering.py](project/src/feature_engineering.py).

It does the following:

- loads the dataset in chronological order,
- sorts by ATM and date,
- ensures each ATM history remains in the correct time sequence,
- creates forward-looking target columns for the next 7 days,
- fills missing numeric values using group-wise medians,
- produces clean feature and target frames for model training.

The feature set includes:

- previous_day_withdrawal
- rolling_average_3
- rolling_average_7
- rolling_average_14
- rolling_average_30
- monthly_average
- quarterly_average
- withdrawal_growth_rate
- cash_remaining_percentage
- festival_weight
- holiday_weight
- salary_day_weight
- weather_weight
- event_weight
- atm_type_encoded
- city_encoded
- days_since_last_refill
- cash_utilisation

These features allow the model to combine historical cash demand with operational context and seasonality.

---

## 5. Forecast Model Design

### 5.1 Forecast Goal

The model predicts the next 7 days of ATM withdrawals instead of only tomorrow's amount.

This is implemented as a multi-horizon regression problem:

- one model instance per day in the next 7-day window,
- each model learns to predict the withdrawal for one horizon,
- the system aggregates all 7 predictions into a full 7-day forecast.

### 5.2 Training Logic

The training workflow is in [project/src/train.py](project/src/train.py).

Important details:

- data is split chronologically per ATM,
- ATMs are not shuffled across time,
- the model trains on a rolling historical pattern,
- each candidate model is trained on seven independent horizons,
- the final benchmark compares average RMSE, MAE, MAPE, and R².

### 5.3 Candidate Models

The code benchmarks multiple regressors:

- Random Forest
- Gradient Boosting
- XGBoost (if installed)
- LightGBM (if installed)
- CatBoost (if installed)

The best-performing model was selected based on lowest average RMSE. In the current project configuration, the best model is the Random Forest regressor.

### 5.4 Persistence

The trained model artifact is stored as:

- [project/models/atm_forecast_model.pkl](project/models/atm_forecast_model.pkl)

The model bundle includes:

- the trained horizon-specific models,
- feature columns used for inference,
- model confidence,
- prediction interval width.

The benchmark metrics are also preserved in:

- [project/model_metrics.json](project/model_metrics.json)

These metrics were generated during model selection and retained for traceability, comparison, and reporting.

### 5.4.1 Preserved Model Metrics

The saved evaluation file shows the following outcome:

- Best model: Random Forest
- Average RMSE: 122241.70
- Average MAE: 75571.77
- Average MAPE: 17.28%
- Average R²: 0.8490

Per-horizon values remained stable across the 7-day forecast window, with RMSE ranging from approximately 119,500 to 124,500 and R² staying near 0.84 to 0.86. This confirms the chosen model remains strong and consistent across all forecast horizons.

### 5.5 Inference Method

The inference logic is in [project/src/predict.py](project/src/predict.py).

The function `forecast_next_7_days(atm_id)` does the following:

- normalizes ATM ID format,
- loads the latest dataset history for that ATM,
- rebuilds the last feature row,
- predicts each of the 7 horizons,
- returns daily values, total forecast, confidence, and prediction interval.

### 5.6 Model Formula / Behaviour

At a high level, the forecasting model learns a function like:

$$
\hat{y}_{t+1}, \hat{y}_{t+2}, ..., \hat{y}_{t+7} = f(X_t)
$$

where:

- $X_t$ represents the ATM cash and operational features at time $t$
- the target is the predicted withdrawal amount for each future day

The actual model is a tree-based ensemble, which is well suited for tabular operational data with nonlinear patterns.

---

## 6. Business Decision Engine

The decision layer is implemented in [project/src/decision_engine.py](project/src/decision_engine.py).

This is the key business logic layer that decides whether an ATM requires replenishment.

### 6.1 Why It Exists

The model alone predicts cash demand. However, ATM operations need business judgment, such as:

- current cash available,
- ATM capacity,
- forecasted withdrawals,
- distance to depot,
- lead time for cash van,
- ATM type,
- weather impact,
- weekend and festival demand,
- historical stockout frequency,
- safety buffer policy.

### 6.2 Risk Score Calculation

The engine calculates a risk score made from two major components:

1. cash coverage score
2. operational pressure score

A simplified structure is:

- if current cash is below forecast demand, risk rises sharply,
- if cash ratio is weak against ATM capacity, risk rises,
- if the ATM is in a high-traffic or high-risk location, risk rises,
- if weather, festival, salary day, or weekend demand is present, risk rises,
- if the ATM is far from the depot or gets frequent stockouts, risk rises.

The risk score is then mapped to:

- CRITICAL: score >= 85
- HIGH: score >= 70
- MEDIUM: score >= 40
- LOW: below 40

### 6.3 Cash Survival Analysis

The decision engine also models how cash depletes day by day over the 7-day horizon:

- daily_remaining_cash is computed for each forecast day,
- early negative balance predicts a stockout risk,
- the engine estimates a stockout date when applicable,
- the service decides whether the ATM can survive until the next cash route.

### 6.4 Refill Decision Logic

The refill decision is not a simple threshold check. Instead, it considers:

- demand forecast,
- safety buffer,
- ATM capacity,
- cash van schedule,
- lead time,
- bank policy maximum refill ratio.

The logic computes a minimum cash target and then recommends the refill amount as the minimum required value capped by bank policy.

### 6.5 Explainability

The engine provides a human-readable `reason` list such as:

- Festival approaching
- Weekend demand expected
- Salary day demand expected
- Weather condition: Rain
- Cash falls below safety threshold
- High daily withdrawal spike is forecasted

This is important because real ATM cash operations require human-readable justification for decisions.

---

## 7. Hybrid Orchestration Service

The orchestration layer is in [project/src/forecast_service.py](project/src/forecast_service.py).

This service combines the model forecast with the decision engine outputs.

It returns a single business response containing:

- forecast
- risk_assessment
- cash_survival
- decision
- reason
- route_group

This is the main “decision intelligence” layer for the app.

---

## 8. Route Optimization Layer

The route planning logic is in [project/src/route_optimizer.py](project/src/route_optimizer.py).

### 8.1 Purpose

When multiple ATMs are at risk, they should be grouped into a cash-van route for efficiency.

### 8.2 Behavior

If OR-Tools is not available, it falls back to a deterministic heuristic:

- sort by urgency,
- prioritize CRITICAL before HIGH,
- order by refill amount,
- assign route stops.

When OR-Tools is installed, the route planner can use a more formal optimization routine.

### 8.3 Route Payload

The route metadata contains:

- route_id
- route_date
- vehicle
- vehicles
- stops
- sequence
- estimated_distance
- estimated_time
- optimizer type

---

## 9. API and Service Interface

The application exposes a public service layer in [project/src/api.py](project/src/api.py).

This layer serves the hybrid result in a clean, bank-ready schema. It supports a unified structure where a caller can submit ATM identification and operating context and receive:

- the 7-day forecast,
- risk score and priority,
- recommended refill amount,
- stockout validation,
- route plan.

The main service logic is designed to be reproducible and easy to integrate into internal bank systems or dashboards.

---

## 10. Sample Response Shape

A typical output structure is:

```json
{
  "atm_id": "ATM001",
  "forecast": {
    "forecast_horizon": "7 Days",
    "daily_forecast": [12000, 15000, 14000, 17000, 16000, 18000, 19000],
    "total_forecast": 111000,
    "confidence": 0.88,
    "prediction_interval": [85000, 132000]
  },
  "risk_assessment": {
    "risk_score": 100.0,
    "priority": "CRITICAL",
    "confidence": 0.88
  },
  "cash_survival": {
    "daily_remaining_cash": [90000, 75000, 61000, 44000, 28000, 10000, -6000],
    "estimated_stockout_date": "2026-08-29",
    "will_last_until_route": false
  },
  "decision": {
    "recommended_refill_amount": 2600000.0,
    "recommended_refill_date": "2026-08-05",
    "priority": "CRITICAL",
    "confidence": 0.88,
    "risk_score": 100.0
  },
  "reason": [
    "Festival approaching",
    "Cash falls below safety threshold",
    "High daily withdrawal spike is forecasted"
  ]
}
```

---

## 11. Validation and Regression Testing

The project includes regression checks in:

- [run_test_cases.py](run_test_cases.py)
- [tests/test_business_regression.py](tests/test_business_regression.py)
- [test_cases.csv](test_cases.csv)

These tests validate that the system behaves consistently in common ATM scenarios, including:

- low-risk ATM with minimal refill need,
- critical ATM requiring urgent replenishment,
- high-priority route planning,
- realistic business decision classification.

---

## 12. Operational Workflow

The end-to-end application flow is:

1. Load ATM historical and contextual data.
2. Build the 7-day feature matrix.
3. Train and benchmark ML models.
4. Save the best model artifact.
5. For a target ATM, forecast the next 7 days.
6. Evaluate risk using cash coverage and operational pressure.
7. Compute expected cash survival over the horizon.
8. Recommend refill amount and refill date.
9. Group high-priority ATMs into a route plan.
10. Return the combined decision payload for operations or dashboards.

---

## 13. What Makes This Application Strong

This implementation is strong because it blends:

- pattern recognition from ML,
- financial operations logic,
- business explainability,
- route optimization,
- operational decision support.

It is not just a model demo; it behaves like a bank-ready ATM cash management decision system.

---

## 14. Current Status

The system has already been developed to a practical production-like stage, with:

- model training and benchmark workflow in place,
- persisted forecasting artifact,
- risk-based decision engine implemented,
- route grouping built,
- API/service layer ready,
- regression validation in place.

---

## 15. Practical Limitations and Future Improvements

Current limitations include:

- synthetic data rather than full real bank transaction data,
- route optimizer uses heuristic fallback when OR-Tools is unavailable,
- model is trained on tabular features and not on streaming time-series systems,
- decision logic is policy-driven and may need recalibration in production with real ATM operations data.

Future enhancements could include:

- integration with real bank ATM telemetry,
- daily drift detection,
- online retraining pipeline,
- scheduling and optimization with full OR-Tools vehicle routing,
- dashboard reporting and alerting,
- monitoring for stockout and cash exposure trends.

---

## 16. Final Conclusion

This application is a complete ATM cash forecasting and replenishment planning engine. It is built around a 7-day ML forecast, but the more important operational innovation is the decision intelligence layer: it evaluates real bank-like risk, plans refill decisions, explains why a decision was made, and groups ATM service tasks into a feasible route plan.

It successfully bridges predictive analytics with business operations, which is exactly what a real ATM cash management system requires.
