# PHASE 7 - ML Prediction Service Integration

The prediction service now connects the Spring Boot backend to an external ML API without retraining or reimplementing the model.

## Backend APIs

- `POST /api/predictions/{atmId}` creates and persists a prediction. The request body requires `predictionDate`; `atmId` and `features` are accepted for contract compatibility, but PostgreSQL history is authoritative.
- `GET /api/predictions/{atmId}` returns saved predictions.
- `GET /api/predictions/{atmId}/latest` returns the latest saved prediction.
- `GET /api/predictions/{atmId}/forecast` returns saved predictions for today through the next seven days.

## ML contract

The backend calls `POST /predict` with the ATM code, prediction date, and withdrawal-derived features:

- `historicalDemand`: successful withdrawal amount over the previous 30 days
- `averageDailyWithdrawal`: historical demand divided by 30
- `peakHourDemand`: largest UTC hourly withdrawal total in the history window
- `dayOfWeek`: zero-based day of week
- `month`: calendar month

Responses are validated for ATM/date identity, non-negative demand, confidence in `[0, 1]`, and a non-empty model version of at most 64 characters.

## Configuration

- `ML_SERVICE_URL` defaults to `http://localhost:8000`
- `ML_SERVICE_CONNECT_TIMEOUT_MS` defaults to `1000`
- `ML_SERVICE_READ_TIMEOUT_MS` defaults to `3000`

The client retries one timeout or transport failure because inference is side-effect free. Failures and invalid responses return service-level errors, and prediction request logs contain only ATM code, date, and feature count.

## Validation

```text
mvn -pl prediction-service -am test
```

Result: **BUILD SUCCESS**. Six tests cover successful persistence, timeout, unavailable ML service, invalid ML response, missing ATM, and database failure.
