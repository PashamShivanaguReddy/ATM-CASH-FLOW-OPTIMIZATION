# Browser Operations Report

Date: 2026-10-02
Application: Flowline at http://localhost:5173
Environment: local development stack running through the API gateway at http://localhost:8080

## Verified super-admin access

The development super-admin account was authenticated successfully against the live gateway endpoint.

Evidence:
- POST /api/auth/login
- Email: e2e-admin-20260912@example.com
- Result: success = true
- Role returned: SUPER_ADMIN

## Operations performed

### 1) Auth verification

The live login request returned a valid JWT and user profile.

Observed response summary:
- message: Login successful
- email: e2e-admin-20260912@example.com
- role: SUPER_ADMIN
- userId: 7

### 2) Bank verification

GET /api/banks?page=0&size=10 returned active bank records without creating duplicates.

Observed bank data:
- Bank ID 1: E2E Validation Bank
- Bank ID 2: Test Bank

### 3) ATM verification

The environment contained seven ATMs before these sample operations. Two new active ATMs were created under Bank ID 1:

- ATM ID 8: ATM-SAMPLE-20261002-A, current cash 22,000
- ATM ID 9: ATM-SAMPLE-20261002-B, current cash 23,000

Both were read back from the ATM API and remained ACTIVE.

### 4) Transactions

Eight successful transactions were created and individually verified by transaction ID: all supported transaction types on each new ATM.

- WITHDRAWAL
- DEPOSIT
- BALANCE_INQUIRY
- OTHER

Withdrawal and deposit amounts were selected to remain within each ATM's cash and capacity limits.

### 5) Cash inventory

Denomination inventory was set to match each ATM's cash after transactions, then reconciled again after refill completion:

- ATM ID 8: 22,000 total
- ATM ID 9: 23,000 total

Both totals were confirmed through GET /api/atms/{atmId}/cash.

### 6) Refills

One sample refill was requested, approved, and completed for each new ATM:

- Refill ID 3, ATM ID 8: 3,000, COMPLETED
- Refill ID 4, ATM ID 9: 4,000, COMPLETED

The resulting ATM cash and denomination totals agree.

### 7) Prediction and recommendation

A genuine model-backed prediction was generated for existing ATM0001, which has historical records in the ML dataset. The two newly created sample ATM codes do not have historical ML data, so they were not given fabricated predictions.

- Prediction ID 1, ATM ID 1, date 2026-10-03
- Predicted demand: 4,055,063.01
- Model confidence: 0.7972
- Model version: atm-forecast-model
- Recommendation ID 1, linked to Prediction ID 1, status PENDING
- Recommended refill: 13,500, capped by ATM0001's available capacity

The prediction and recommendation were read back successfully from their APIs. The predicted demand is substantially greater than ATM0001's capacity; the recommendation correctly reports the capacity-limited refill amount.

## Result

The requested sample operational data is present in the development environment: two new ATMs, eight transactions covering every supported type, reconciled cash inventory, two completed refills, one model-backed prediction, and one linked pending recommendation.

## Verification notes

- Super-admin login, bank/ATM reads, all eight sample transaction lookups, both inventory records, both completed refills, prediction, and recommendation were verified through the live APIs.
- Transactions initially returned HTTP 500 because PostgreSQL could not infer a nullable enum parameter type in the JPQL search query. Search now builds criteria only for supplied filters; after deployment, the list endpoint returned HTTP 200 with 23 records.
- Cash inventory and refill controllers return raw JSON values, while the frontend adapters expected `{ data: ... }`. The adapters now accept either raw or enveloped values, including refill actions.
- Frontend tests: 13 passed. Frontend production build: successful. Transaction-service tests: 12 passed. Maven backend package: successful.
- The shared browser tabs are still on the Sign in page. Sign in to Flowline with the configured development super-admin account and refresh the Transactions, Refills, and Cash inventory pages to view the records.