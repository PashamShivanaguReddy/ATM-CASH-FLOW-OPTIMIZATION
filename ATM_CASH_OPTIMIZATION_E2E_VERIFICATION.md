# ATM Cash Optimization Lifecycle: Change and Runtime Verification Report

Date: 2026-10-02  
Environment: local Docker Compose stack, PostgreSQL 16, Kafka 3.8.1, Spring Boot services, Python ML service

## Summary

The full automated lifecycle was **not verified as passing**. Individual API and database stages worked, but Kafka consumers/event handoffs were unavailable or misconfigured. Several downstream operations were performed through their APIs to inspect their database effects; these do not count as proof that the event-driven lifecycle is connected.

No source files were edited during this runtime verification. The Java and Python Docker images were rebuilt from the existing workspace, PostgreSQL migration V3 was applied, and one Kafka container restart was attempted without deleting its volume.

## Implementation Changes Covered

The lifecycle code changes documented here add or connect these pieces:

- Persisted prediction evaluations in `prediction_evaluations`, uniquely keyed by prediction, with actual and predicted demand, absolute error, optional percentage error, model version, date, and evaluation time.
- A UTC daily scheduler for completed prediction windows and a manual evaluation endpoint at `POST /api/predictions/evaluations/{predictionId}`. Open/future windows are rejected.
- Forecast feedback for a later optimization request, selected by ATM, model version, and prediction date. Explicit demand overrides are not adjusted.
- A recommendation reference on `CashRefill` and a uniqueness constraint so only one refill can link to a recommendation.
- A `recommendation.approved` event and an inventory consumer intended to create one linked `REQUESTED` refill. Recommendation approval and refill approval remain distinct transitions.
- Refill-requested and refill-completed event publication, scheduled after transaction commit.
- A `cash.updated` consumer intended to reconcile denomination inventory from locked ATM cash. Successful withdrawal/deposit values and refill values are constrained to the supported 50-unit increment; optimization rounds refill recommendations to that increment while respecting capacity.
- A transaction Kafka bridge that publishes after commit.
- Regression coverage for transaction denomination validation, inventory reconciliation, linked-refill idempotency, forecast feedback, and denomination-compatible recommendations.

The migration is `backend/domain/src/main/resources/db/migration/V3__prediction_evaluations_and_refill_links.sql`.

## Runtime Test Data

All new operational records were synthetic and created through the live API or the existing test database:

- ATM ID 10, code `ATM-LIVE-20261002-E2E1`, bank ID 1, initial cash 20,000, capacity 50,000.
- Successful Oct 1 withdrawals: 5,000 and 2,500. A further successful Sep 30 withdrawal of 10,000 was created after refill completion to test another state update.
- Prediction ID 2 for Oct 2, demand 517,045.23, model `atm-forecast-model`.
- Recommendation ID 2 for prediction 2, refill recommendation 37,500; recommendation ID 3 was later created for prediction 2 with an explicit demand and a 10,000 capacity-limited amount.
- Refill ID 6 linked to recommendation 2, amount 37,500, completed once.

These records remain in the development database; they were not deleted.

## Runtime Stage Results

| Stage | Status | Runtime evidence |
|---|---|---|
| Transaction | PASS | Gateway accepted the two Oct 1 withdrawals and the Sep 30 seed withdrawal; all are stored as successful transactions. |
| ATM cash update | PASS | ATM cash went from 20,000 to 12,500 after the first two withdrawals, to 50,000 at refill completion, then to 40,000 after the seed withdrawal. |
| Kafka `transaction.created` | PASS | Topic records were read directly, including ATM 10 transaction IDs 25 and 26. |
| Transaction-to-prediction consumer | FAIL | No transaction event was recorded in `processed_events`; prediction-service had subscribed, but Kafka group coordination failed and no consumer processing was committed. |
| Live ML prediction | PARTIAL | The current Python `/predict` endpoint returned HTTP 200 after the ML image was rebuilt. Spring prediction 2 was persisted from 23 transaction-history-derived features. The automated Kafka-triggered prediction path did not run. |
| Kafka `prediction.generated` | PASS | The record for prediction ID 2 / ATM 10 was read directly from the topic. |
| Risk evaluation | PASS | PostgreSQL contains active `STOCKOUT_RISK` and `HIGH_DEMAND` alerts for ATM 10 after prediction 2. |
| Prediction-to-optimization automation | FAIL | No automated recommendation was created from `prediction.generated`; no optimization Kafka consumer was observed. |
| Recommendation creation | PARTIAL | Direct optimization API calls persisted recommendations. Repeating a call with explicit prediction ID 2 returned the existing recommendation ID. A later call without that ID created another recommendation for prediction 2. |
| Duplicate recommendation check | FAIL | PostgreSQL has two recommendation rows for prediction ID 2. |
| Recommendation approval | PASS | Recommendation 2 transitioned to `APPROVED` through the API. |
| Approval-to-refill event handoff | FAIL | Approval did not produce a `refill.requested` record or refill row. The `recommendation.approved` topic had zero records. |
| Linked refill request | PARTIAL | A manual API call created exactly one refill row, ID 6 linked to recommendation 2. Repeating the request was rejected with HTTP 400. The initial request returned HTTP 500 after the row committed. |
| Refill approval | PASS | Refill 6 transitioned from `REQUESTED` to `APPROVED` through the API. |
| Refill completion | PARTIAL | Completion returned HTTP 500, but PostgreSQL committed one `COMPLETED` refill, marked recommendation 2 `COMPLETED`, and raised ATM cash to 50,000. A second completion was rejected with HTTP 400. `refill.completed` remained absent from Kafka. |
| Denomination reconciliation | PARTIAL | Immediately after refill completion, denomination total equaled 50,000. After the later 10,000 withdrawal, inventory was reconciled manually through the API. Final ATM cash and denomination total are both 40,000; automatic transaction-triggered reconciliation was not observed. |
| Refill increment | PASS | The 37,500 refill and 10,000 follow-up recommendation are multiples of the supported 50-unit increment. |
| Actual withdrawal selection | PARTIAL | PostgreSQL shows 7,500 in successful Oct 1 withdrawals. No failed withdrawal was included in this runtime sample, and no evaluation completed to prove its exclusion. |
| Prediction-vs-actual evaluation | FAIL | No evaluation row exists. Evaluation of Oct 2 prediction 2 was correctly rejected with HTTP 400 because its window was still open. The attempt to create an Oct 1 prediction returned HTTP 503. |
| Feedback/next optimization cycle | PARTIAL | A later API recommendation used current cash 40,000 and capped refill at the remaining 10,000 capacity. It reused prediction 2 and had no persisted evaluation feedback; this does not prove the requested closed feedback loop. |

## Database Snapshot

At final verification:

- Flyway versions 1, 2, and 3 were successful; `prediction_evaluations` and `cash_refills.recommendation_id` exist.
- ATM 10: current cash 40,000; capacity 50,000; denomination total 40,000.
- Prediction rows for ATM 10: one, ID 2.
- Recommendation rows for ATM 10: two, both reference prediction 2; one `COMPLETED`, one `PENDING`.
- Linked refill rows for ATM 10: one, ID 6, `COMPLETED`.
- Prediction-evaluation rows for ATM 10: zero.
- Refill duplicate and duplicate-completion retries were rejected with HTTP 400.

## Kafka and Runtime Failures

- Kafka topic records were readable, but consumer-group list/describe calls timed out. A single Kafka restart did not restore consumer processing; broker logs reported `DUPLICATE_BROKER_REGISTRATION` during KRaft recovery.
- The cash-inventory container logged repeated connection attempts to `localhost:9092`. Its Compose service does not receive `KAFKA_BOOTSTRAP_SERVERS`, so the in-container default is incorrect. The optimization service also does not receive that variable, and its default is likewise localhost.
- Kafka offsets for the test records were present on `transaction.created`, `cash.updated`, and `prediction.generated`; offsets for `recommendation.created`, `recommendation.approved`, `refill.requested`, and `refill.completed` remained zero.
- PostgreSQL initially rejected connections with `sorry, too many clients already`. Several DB-connected services were stopped to release pool connections. At the final snapshot, `user-service`, `bank-service`, and `analytics-service` were still stopped; other core services, PostgreSQL, Kafka, and ML reported healthy status.
- The old ML container rejected the synthetic ATM as lacking historical data. Rebuilding the existing ML image made the current feature-payload `/predict` endpoint return HTTP 200. The model emitted scikit-learn artifact-version and feature-name warnings.
- Some post-commit Kafka send failures caused HTTP 500 responses after PostgreSQL had committed the associated refill state. Callers must not treat those HTTP errors as proof that the database mutation rolled back.

## Automated Tests

The clean targeted Maven reactor run completed successfully with JaCoCo skipped:

- Transaction service: 12 passed
- Cash inventory service: 10 passed
- Prediction service: 7 passed
- Optimization service: 10 passed
- Total: **39 passed, 0 failed**

These unit/service tests are useful coverage, but they do not override the live Kafka and database evidence above.

## Overall Assessment

The real stack demonstrated working transaction APIs, cash updates, a live Python-backed prediction, risk alerts, manual recommendation/refill transitions, persisted refill completion, and cash/denomination equality after explicit reconciliation. It did **not** demonstrate the complete automatic flow: Kafka consumer processing, prediction-triggered optimization, approval-triggered refill creation, automatic post-transaction denomination reconciliation, prediction evaluation, or evaluation-driven feedback all remain unverified or failed at runtime.
