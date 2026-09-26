# Phase 4 Result: ATM Management Service

## Scope

Phase 4 implements the complete ATM management backend. It provides authenticated ATM CRUD operations, bank and status filtering, pagination, sorting, validation, authorization, audit logging, automatic cash-status calculation, and safe deactivation.

Phase 5 functionality is not implemented.

## ATM Data Model

The existing `ATM` domain entity is used with these fields:

- `id`
- `atmCode`
- `bankId`
- `location`
- `city`
- `state`
- `latitude`
- `longitude`
- `atmType`
- `status`
- `cashCapacity`
- `minimumCashThreshold`
- `maximumCashThreshold`
- `currentCash`
- `lastRefillAt`
- `createdAt`
- `updatedAt`

The database schema already contained the ATM table, foreign keys, unique ATM code constraint, audit log table, and ATM transaction relationship. No new migration was required.

## API Endpoints

All endpoints are under `/api/atms` and require a valid Bearer JWT unless stated otherwise.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/atms` | Create an ATM |
| `GET` | `/api/atms` | List ATMs with pagination, sorting, and optional filters |
| `GET` | `/api/atms/{id}` | Get an ATM by ID |
| `PUT` | `/api/atms/{id}` | Update an ATM |
| `DELETE` | `/api/atms/{id}` | Soft-delete/deactivate an ATM |
| `GET` | `/api/atms/bank/{bankId}` | List ATMs for a bank |
| `GET` | `/api/atms/status/{status}` | List ATMs by status |
| `GET` | `/api/atms/{id}/summary` | Get ATM cash and transaction summary |

### Query Parameters

`GET /api/atms` supports:

- `bankId`
- `status`
- `page`, default `0`
- `size`, Spring Data default
- `sort`, for example `createdAt,desc`

Example:

```http
GET /api/atms?status=LOW_CASH&page=0&size=20&sort=createdAt,desc
Authorization: Bearer <access-token>
```

## Request Example

```http
POST /api/atms
Authorization: Bearer <access-token>
Content-Type: application/json
```

```json
{
  "atmCode": "ATM-001",
  "bankId": 1,
  "location": "Main Street Branch",
  "city": "Mumbai",
  "state": "Maharashtra",
  "latitude": 19.076000,
  "longitude": 72.877700,
  "atmType": "STANDARD",
  "cashCapacity": 100000.00,
  "minimumCashThreshold": 10000.00,
  "maximumCashThreshold": 90000.00,
  "currentCash": 50000.00
}
```

The create endpoint returns `201 Created`.

## Response Example

```json
{
  "id": 10,
  "atmCode": "ATM-001",
  "bankId": 1,
  "location": "Main Street Branch",
  "city": "Mumbai",
  "state": "Maharashtra",
  "latitude": 19.076000,
  "longitude": 72.877700,
  "atmType": "STANDARD",
  "status": "ACTIVE",
  "cashCapacity": 100000.00,
  "minimumCashThreshold": 10000.00,
  "maximumCashThreshold": 90000.00,
  "currentCash": 50000.00,
  "lastRefillAt": null,
  "createdAt": "2026-09-11T08:00:00Z",
  "updatedAt": "2026-09-11T08:00:00Z"
}
```

List endpoints return Spring Data pagination metadata and a `content` array of ATM responses.

## Business Rules

- `atmCode` is unique.
- `cashCapacity` must be positive.
- Cash values cannot be negative.
- `minimumCashThreshold` cannot exceed `maximumCashThreshold`.
- `currentCash` cannot exceed `cashCapacity`.
- Latitude must be between `-90` and `90`.
- Longitude must be between `-180` and `180`.
- Required text fields and ATM type are validated with Bean Validation.
- Current cash equal to zero sets status to `OUT_OF_SERVICE`.
- Current cash at or below the minimum threshold sets status to `LOW_CASH`.
- Otherwise, a missing requested status defaults to `ACTIVE`.
- Delete is implemented as soft deletion by setting status to `INACTIVE`.
- Soft deletion is safe when transaction history exists because the ATM row and its relationships are retained.
- ATM transaction count is included in the ATM summary response.

## Authorization

JWT validation is implemented locally in `atm-service` using the same signing secret and claims issued by `auth-service`.

The JWT claims used by the ATM service are:

- `userId`
- `email` / subject
- `role`
- `bankId`

Authorization behavior:

- `SUPER_ADMIN` can access ATMs across banks.
- `BANK_ADMIN`, `BANK_MANAGER`, and `ATM_OPERATOR` are restricted to their own bank.
- Bank users cannot enumerate or access ATMs belonging to another bank.
- ATM modifications require an authorized role and matching bank ownership.
- ATM operators are currently authorized at bank scope because the existing domain model has no per-ATM assignment table.
- Authentication failures return `401 Unauthorized`.
- Authorization failures return `403 Forbidden`.

## Exception Handling

Common API error handling now supports:

- `404 Not Found` for missing ATMs and banks
- `409 Conflict` for duplicate ATM codes
- `400 Bad Request` for validation and business-rule failures
- `403 Forbidden` for authorization failures
- `500 Internal Server Error` for unexpected failures

Errors use the shared `ErrorResponse` contract.

## Audit Logging

Create, update, and deactivate operations write records to `audit_logs` with:

- Acting user
- Action name
- Entity type `ATM`
- ATM ID
- Previous value summary
- New value summary
- Timestamp
- Client IP address

Delete operations record `ATM_DEACTIVATED` rather than physically deleting the ATM.

## Files Created or Modified

### ATM Service

- `atm-service/pom.xml`
- `atm-service/src/main/java/com/atm/atm/controller/ATMController.java`
- `atm-service/src/main/java/com/atm/atm/service/ATMService.java`
- `atm-service/src/main/java/com/atm/atm/service/AtmPrincipal.java`
- `atm-service/src/main/java/com/atm/atm/dto/AtmRequest.java`
- `atm-service/src/main/java/com/atm/atm/dto/AtmResponse.java`
- `atm-service/src/main/java/com/atm/atm/dto/AtmSummaryResponse.java`
- `atm-service/src/main/java/com/atm/atm/exception/AtmAuthorizationException.java`
- `atm-service/src/main/java/com/atm/atm/config/SecurityConfig.java`
- `atm-service/src/main/java/com/atm/atm/config/JwtService.java`
- `atm-service/src/main/java/com/atm/atm/config/JwtAuthenticationFilter.java`
- `atm-service/src/main/resources/application.yml`
- `atm-service/src/test/java/com/atm/atm/service/ATMServiceTest.java`

### Domain and Common Modules

- `domain/src/main/java/com/atm/domain/repository/ATMRepository.java`
- `domain/src/main/java/com/atm/domain/repository/ATMTransactionRepository.java`
- `common/src/main/java/com/atm/common/exception/ConflictException.java`
- `common/src/main/java/com/atm/common/exception/BusinessRuleException.java`
- `common/src/main/java/com/atm/common/exception/GlobalExceptionHandler.java`

## Tests

`ATMServiceTest` covers:

- ATM creation
- Duplicate ATM code
- Invalid cash capacity
- Invalid thresholds
- ATM update
- ATM retrieval
- Pagination
- Bank filtering
- Status filtering
- Authorization
- ATM not found

Verification results:

```text
ATMServiceTest: 10 tests, 0 failures, 0 errors
mvn clean test: BUILD SUCCESS
```

The full Maven reactor completed successfully across all backend modules.

## Phase 5 Recommendation

Phase 5 should implement transaction management and cash operations:

- Transaction creation and lookup APIs
- Withdrawal and deposit cash-balance updates
- Idempotency using `transactionId`
- Optimistic-locking and concurrency protection
- Transaction history and reporting
- Integration with cash inventory and refill workflows
- Event publication for alerts and downstream analytics

Phase 5 is intentionally not included in this document's implementation scope.
