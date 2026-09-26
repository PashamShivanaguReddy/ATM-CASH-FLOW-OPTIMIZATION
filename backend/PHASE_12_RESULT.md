# PHASE 12 - Dashboard and Analytics APIs

Phase 12 adds frontend-facing analytics APIs for the bank manager dashboard through the `analytics-service`.

## Dashboard endpoints

All endpoints are available through the API gateway under `/api/dashboard`:

- `GET /api/dashboard/summary`
- `GET /api/dashboard/atm-status`
- `GET /api/dashboard/cash-demand`
- `GET /api/dashboard/transactions`
- `GET /api/dashboard/predictions`
- `GET /api/dashboard/alerts`
- `GET /api/dashboard/refills`
- `GET /api/dashboard/recommendations`

The summary response contains:

- Total ATMs
- Active ATMs
- Low-cash ATMs
- Critical ATMs
- Total cash
- Today's withdrawals
- Today's transaction count
- Predicted demand
- Pending refills
- Open alerts
- High-risk ATMs

Example response:

```json
{
  "totalAtms": 250,
  "activeAtms": 235,
  "lowCashAtms": 12,
  "criticalAtms": 3,
  "totalCash": 1000000.00,
  "todaysWithdrawals": 42000.00,
  "todaysTransactions": 180,
  "predictedDemand": 425000.00,
  "pendingRefills": 18,
  "openAlerts": 9,
  "highRiskAtms": 6
}
```

## Filtering and pagination

Dashboard requests support `bankId` and `atmId` filters where applicable. Date-based endpoints support ISO dates through `from` and `to` parameters. Alerts, refills, and recommendations also support status filters.

Paged responses accept:

- `page`, zero-based page number
- `size`, capped at 100 items

Paged responses use this frontend-friendly shape:

```json
{
  "content": [],
  "page": 0,
  "size": 25,
  "totalElements": 0,
  "totalPages": 0
}
```

## Query optimization

Dashboard KPIs use database-side `count`, `sum`, and `count distinct` aggregation queries. Transactions and other dashboard collections are filtered and paged in the database before being mapped to response DTOs; the service does not load the complete transaction history into memory.

The analytics service reads the shared PostgreSQL schema with Hibernate validation enabled. Database connection settings are configurable through `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`.

## Gateway route

The API gateway forwards `/api/dashboard/**` to analytics-service. The default analytics service URL is `http://localhost:8092` and can be overridden with `ANALYTICS_SERVICE_URL`.

## Validation

Dashboard service tests cover aggregate summary mapping and paged ATM status responses. Gateway tests cover analytics route registration and `/api/dashboard/summary` path matching.

Validation commands:

```text
mvn -pl analytics-service -am test
mvn -pl api-gateway -am test
```

Result: **BUILD SUCCESS**.
