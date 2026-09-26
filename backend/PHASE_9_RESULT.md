# PHASE 9 - Cash Refill Optimization Service

Phase 9 implements the cash refill optimization workflow in `optimization-service`. It calculates refill recommendations from ATM cash, predicted demand, safety reserve, ATM capacity, and configurable priority thresholds.

## Optimization API

- `POST /api/optimization/atms/{atmId}/recommend` creates a pending recommendation.
- `GET /api/optimization/atms/{atmId}` returns recommendations for an ATM.
- `GET /api/optimization/recommendations` returns all recommendations.
- `POST /api/optimization/recommendations/{id}/approve` approves a pending recommendation.
- `POST /api/optimization/recommendations/{id}/reject` rejects a pending recommendation.

The service does not use Kafka in this phase.

## Recommendation Data

`OptimizationRecommendation` stores:

- Recommendation ID and ATM reference
- Optional prediction reference
- Current cash
- Predicted demand
- Safety reserve
- Recommended refill amount
- Recommended refill date
- Priority
- Reason
- Status
- Created and updated timestamps

Statuses are `PENDING`, `APPROVED`, `REJECTED`, and `COMPLETED`.

Priorities are `LOW`, `MEDIUM`, `HIGH`, and `CRITICAL`.

## Calculation Rules

Required cash is calculated as:

```text
required cash = predicted demand + safety reserve
```

The refill recommendation is calculated as:

```text
recommended refill = max(required cash - current cash, 0)
```

The result is capped at the ATM's remaining capacity:

```text
recommended refill = min(recommended refill, ATM capacity - current cash)
```

A recommendation that consumes all remaining capacity is marked `CRITICAL`. Zero cash is also treated as critical. Recommendations that require no additional cash explain that the current balance already covers demand and reserve.

The ATM is loaded with a pessimistic write lock while a recommendation is calculated to avoid using stale cash values during concurrent optimization requests.

## Configuration

The following settings are configurable through `application.yml` or environment variables:

- `OPTIMIZATION_DEFAULT_SAFETY_RESERVE`, default `0`
- `OPTIMIZATION_REFILL_LEAD_DAYS`, default `0`
- `OPTIMIZATION_MEDIUM_REFILL_RATIO`, default `0.25`
- `OPTIMIZATION_HIGH_REFILL_RATIO`, default `0.50`
- `OPTIMIZATION_CRITICAL_REFILL_RATIO`, default `0.75`

A request may provide its own predicted demand, safety reserve, and refill date. When predicted demand is omitted, the referenced prediction value is used.

## Validation

The optimization unit tests cover:

- Normal demand
- High demand
- Low cash
- ATM capacity limitation
- Zero cash
- Excessive predicted demand

Validation commands:

```text
mvn -pl optimization-service -am test
mvn test
```

Result: **BUILD SUCCESS**. All six optimization tests and the complete backend Maven test suite pass.
