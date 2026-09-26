# PHASE 6 - Cash Inventory and Refill Management

Phase 6 implements denomination-level ATM cash inventory and the authenticated refill workflow in `cash-inventory-service`.

## APIs

- `GET /api/atms/{atmId}/cash`
- `PUT /api/atms/{atmId}/cash`
- `POST /api/refills`
- `GET /api/refills`
- `GET /api/refills/{id}`
- `GET /api/refills/atm/{atmId}`
- `POST /api/refills/{id}/approve`
- `POST /api/refills/{id}/reject`
- `POST /api/refills/{id}/complete`

Inventory accepts denominations `2000`, `500`, `200`, `100`, and `50`. `totalAmount` and ATM `currentCash` are calculated from note counts. Negative counts, invalid denominations, duplicate denominations, negative cash, and capacity violations are rejected.

Refill transitions are `REQUESTED -> APPROVED`, `REQUESTED -> REJECTED`, and `APPROVED -> COMPLETED`. Bank administrators request refills, bank managers approve or reject them, and ATM operators complete physical refills. Every inventory or refill mutation writes an audit record.

Cash mutations are transactional. ATM rows are loaded with `PESSIMISTIC_WRITE`, and inventory rows are locked during inventory updates to prevent concurrent balance races. Refill completion updates ATM cash, status, and last refill time in the same transaction as the refill status.

## Validation

```text
mvn clean test
```

Result: **BUILD SUCCESS** across all 17 Maven modules. The focused cash inventory suite contains 6 passing tests covering inventory totals, invalid and negative cash, request/approval/rejection/completion, capacity, audit writes, and pessimistic locking.

ML integration is not included.