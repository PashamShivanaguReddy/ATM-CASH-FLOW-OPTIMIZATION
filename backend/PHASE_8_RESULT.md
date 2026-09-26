# PHASE 8 - Alert and Risk Detection Service

Phase 8 implements the alert engine in `alert-service`. It detects ATM cash and operational risks from current cash, configured thresholds, predicted demand, ATM status, and recent transaction behavior.

## Alert APIs

- `GET /api/alerts` lists alerts, with optional `atmId` and `status` filters.
- `GET /api/alerts/{id}` returns one alert.
- `GET /api/alerts/atm/{atmId}` returns alerts for an ATM.
- `GET /api/alerts/status/{status}` returns alerts by status.
- `POST /api/alerts/{id}/acknowledge` acknowledges an alert.
- `POST /api/alerts/{id}/resolve` resolves an alert and records `resolvedAt`.

The alert service also exposes the internal evaluation endpoint `POST /api/alerts/internal/evaluate`, which is called after a prediction is persisted.

## Detection Rules

The engine supports these alert types:

- `LOW_CASH`: current cash is at or below the ATM minimum cash threshold.
- `STOCKOUT_RISK`: current cash is below predicted demand plus the minimum threshold safety reserve.
- `HIGH_DEMAND`: predicted demand exceeds the ATM maximum cash threshold.
- `ATM_OUT_OF_SERVICE`: the ATM status is `OUT_OF_SERVICE`.
- `UNUSUAL_ACTIVITY`: recent activity contains at least three failed transactions or withdrawals above the maximum cash threshold.

Severity levels are `LOW`, `MEDIUM`, `HIGH`, and `CRITICAL`. A stockout where current cash is below predicted demand is `CRITICAL`. An ATM with zero cash or an out-of-service status also receives a critical alert.

## Persistence and Deduplication

Alerts are stored with:

- Alert type
- Severity
- Message
- ATM reference
- Created timestamp
- Status
- Resolved timestamp

Open alerts use statuses `ACTIVE` and `ACKNOWLEDGED`. The engine does not create another alert with the same ATM and alert type while an open alert exists. Resolved alerts may be generated again if the same risk returns later.

All alert creation, acknowledgement, and resolution operations write an `AuditLog` entry. Notifications are intentionally not implemented in this phase.

## Prediction Integration

After saving a prediction, `prediction-service` calls the alert evaluation endpoint with the ATM ID and predicted demand. Alert evaluation is best effort: an unavailable alert service is logged and does not invalidate the already-persisted prediction.

## Validation

```text
mvn -pl alert-service -am test
mvn -pl prediction-service -am test
mvn test
```

Result: **BUILD SUCCESS** across all 17 Maven modules. Alert tests cover critical stockout detection, duplicate suppression, and audited resolution. Prediction tests continue to pass with the alert callback integration.
