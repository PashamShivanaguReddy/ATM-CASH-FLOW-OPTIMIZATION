# PHASE 5 - ATM Transaction Service

## Scope

Phase 5 adds authenticated ATM transaction history and cash operations. Prediction, optimization, notifications, and frontend workflows remain outside this phase and can consume the published application events.

## API Documentation

All endpoints require a JWT issued by the existing authentication flow. `SUPER_ADMIN` can access every ATM. Bank users and `ATM_OPERATOR` users can access only ATMs belonging to their JWT bank scope.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/transactions` | Create an idempotent transaction and, for successful deposits/withdrawals, update ATM cash atomically |
| GET | `/api/transactions` | Pageable transaction search with `atmId`, `from`, `to`, `type`, `status`, `page`, `size`, and `sort` |
| GET | `/api/transactions/{id}` | Get a transaction by database ID |
| GET | `/api/transactions/transaction/{transactionId}` | Get a transaction by its unique business ID |
| GET | `/api/transactions/atm/{atmId}` | Pageable transactions for one authorized ATM |
| GET | `/api/transactions/date-range` | Date-range transaction search using required `from` and `to` instants |
| GET | `/api/transactions/atm/{atmId}/daily-summary` | Successful withdrawal amount/count grouped by UTC date |
| GET | `/api/transactions/atm/{atmId}/hourly-summary` | Successful transaction count grouped by UTC hour |
| GET | `/api/transactions/atm/{atmId}/monthly-summary` | Successful withdrawal amount/count grouped by UTC month |
| GET | `/api/transactions/atm/{atmId}/summary` | Total withdrawals/deposits, count, average/max withdrawal, and peak hour |

Amounts use `BigDecimal`; timestamps use `Instant`. `transactionType` supports `WITHDRAWAL`, `DEPOSIT`, `BALANCE_INQUIRY`, and `OTHER`.

### Idempotency

- Repeating the same `transactionId` with the same payload returns the stored transaction with HTTP `200`.
- Reusing the ID with a different ATM, type, amount, timestamp, success flag, or card type returns HTTP `409`.
- A transaction is never processed twice.

## Business Rules

Successful withdrawals require sufficient current cash. Successful deposits cannot exceed capacity. Inactive, maintenance, and out-of-service ATMs reject new transactions. Failed transactions are persisted as history but do not mutate ATM cash. Cash status is recalculated after every successful cash operation: zero becomes `OUT_OF_SERVICE`, threshold-or-below becomes `LOW_CASH`, otherwise `ACTIVE`.

ATM rows are loaded with `PESSIMISTIC_WRITE`, preventing concurrent cash mutations from reading the same balance. The existing ATM `@Version` remains enabled as an additional optimistic-locking guard.

## DTOs

- `TransactionCreateRequest`: transaction ID, ATM ID, type, positive amount, timestamp, success, card type.
- `TransactionResponse`: persisted transaction representation including database ID and creation time.
- `TransactionSummaryResponse`: aggregate transaction features.
- `TimeAmountResponse`: daily/monthly amount and count or hourly count.

## Database Queries and Indexes

`ATMTransactionRepository` provides pageable filtering by bank ownership, ATM, timestamp range, type, and success; plus aggregate JPQL queries for successful amount sums, count, average withdrawal, and maximum withdrawal. Daily, hourly, monthly, and peak-hour groupings are computed from the authorized transaction slice in UTC.

Indexes include:

- Unique `transaction_id` for idempotency.
- `atm_id` for ATM history and ownership filtering.
- `timestamp` for date ranges.
- `transaction_type` for transaction-type filtering and aggregations.

Successful operations write an `ATM_TRANSACTION` record to `audit_logs` and publish `TransactionCompleted`, `TransactionFailed`, `ATMCashBalanceChanged`, `ATMEnteredLowCash`, or `ATMEnteredOutOfService` application events as applicable.

## Test Results

Focused `TransactionServiceTest`: **10 tests, 0 failures**.

Full validation command:

```text
mvn clean test
```

## Next PHASE 6

Integrate consumers for the transaction events and expose downstream analytics/prediction workflows. Phase 6 is not implemented in this change.
