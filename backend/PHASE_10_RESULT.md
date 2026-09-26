# PHASE 10 - API Gateway

Phase 10 introduces a Spring Cloud Gateway so the frontend can access backend APIs through one entry point at `http://localhost:8080` instead of calling each microservice directly.

## Gateway Routes

The gateway forwards requests without duplicating business logic:

- `/api/auth/**` -> Auth Service
- `/api/users/**` -> User Service
- `/api/banks/**` -> Bank Service
- `/api/atms/**` -> ATM Service
- `/api/transactions/**` -> Transaction Service
- `/api/predictions/**` -> Prediction Service
- `/api/alerts/**` -> Alert Service
- `/api/optimization/**` -> Optimization Service

Cash inventory uses these additional paths because its controllers expose both ATM cash and refill APIs:

- `/api/atms/*/cash/**` -> Cash Inventory Service
- `/api/refills/**` -> Cash Inventory Service

The cash inventory routes are evaluated before the broad ATM route so `/api/atms/{atmId}/cash` reaches the correct service.

## Gateway Filters

The gateway provides the following cross-cutting concerns:

- JWT authentication for protected `/api/**` requests
- Public access for `/api/auth/**`, `/api/v1/status`, actuator endpoints, and CORS preflight requests
- Correlation ID generation and propagation through `X-Correlation-ID`
- Request and response logging with method, path, status, correlation ID, and duration
- Configurable in-memory rate limiting for API requests
- Centralized JSON error responses for upstream gateway failures
- Global CORS support for frontend requests

Business rules remain inside the downstream services. The gateway only authenticates, filters, routes, protects, and observes requests.

## Configuration

Service URLs are configurable through environment variables:

- `AUTH_SERVICE_URL`, default `http://localhost:8081`
- `USER_SERVICE_URL`, default `http://localhost:8082`
- `BANK_SERVICE_URL`, default `http://localhost:8083`
- `ATM_SERVICE_URL`, default `http://localhost:8084`
- `TRANSACTION_SERVICE_URL`, default `http://localhost:8085`
- `CASH_INVENTORY_SERVICE_URL`, default `http://localhost:8086`
- `PREDICTION_SERVICE_URL`, default `http://localhost:8087`
- `ALERT_SERVICE_URL`, default `http://localhost:8088`
- `OPTIMIZATION_SERVICE_URL`, default `http://localhost:8089`

Additional gateway settings:

- `JWT_SECRET`, shared with authenticated services
- `CORS_ALLOWED_ORIGINS`, default `http://localhost:3000`
- `GATEWAY_RATE_LIMIT_REQUESTS_PER_MINUTE`, default `120`
- `SERVER_PORT`, default `8080`

## Validation

Gateway tests cover:

- All configured frontend route IDs and service URLs
- Representative paths for every gateway route
- Public authentication endpoints without a token
- Rejection of protected requests without a token
- Forwarding of protected requests with a valid JWT

Validation commands:

```text
mvn -pl api-gateway -am test
mvn test
```

Result: **BUILD SUCCESS**. All five gateway tests and the complete backend Maven test suite pass.
