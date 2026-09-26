# ATM Cash Flow Optimization System

This directory contains the Java 17 / Spring Boot 3 backend, the local Docker deployment foundation, and the service contracts for the ATM platform. The Python forecasting service is containerized from `../ML`.

## Architecture

A Maven reactor contains the shared `common` contract module and independently deployable services: API gateway, auth, user, bank, ATM, transaction, cash inventory, prediction, alert, optimization, notification, analytics, config server, and service registry. Services currently expose health endpoints and a foundation for REST, validation, persistence, security, and API documentation. Business workflows and cross-service messaging are reserved for Phase 2.

## Run locally without Docker

Prerequisites: Java 17+, Maven 3.9+, and PostgreSQL 15+ (database wiring is ready; no business migrations are included yet).

```powershell
$env:DB_URL="jdbc:postgresql://localhost:5433/atm"
$env:DB_USERNAME="atm"
$env:DB_PASSWORD="change-me"
mvn -f backend/pom.xml clean verify
mvn -f backend/pom.xml -pl common -am install -DskipTests
mvn -f backend/atm-service/pom.xml spring-boot:run
```

The Compose PostgreSQL container is published on host port `5433` by default because host port `5432` may already be used by another PostgreSQL instance. PostgreSQL still listens on port `5432` inside the container.

Each service has `application.yml`, `application-dev.yml`, `application-test.yml`, and `application-prod.yml`. Activate a profile with `SPRING_PROFILES_ACTIVE=dev`. Environment variables can override every deployment-specific value.

## Docker deployment

Prerequisites: Docker Desktop with Docker Compose v2.

1. Clone the project.
2. Copy `backend/.env.example` to `backend/.env` and replace every placeholder with a real value. Keep `.env` out of version control.
3. Start infrastructure and services from the repository root:

```powershell
docker compose --env-file backend/.env -f backend/docker-compose.yml up --build
```

4. Verify health:

```powershell
docker compose --env-file backend/.env -f backend/docker-compose.yml ps
Invoke-WebRequest http://localhost:8080/api/v1/status
```

5. Open Swagger at `http://localhost:8080/swagger-ui.html`. Browser and frontend traffic should use the API Gateway rather than direct microservice ports.
6. Test authentication through the auth endpoints documented in Swagger, then send the returned bearer token in the `Authorization` header.
7. Test the ATM API at `http://localhost:8080/api/atms`.
8. Test the prediction API at `http://localhost:8080/api/predictions/{atmId}/forecast`.

Stop the stack with `docker compose --env-file backend/.env -f backend/docker-compose.yml down`. Add `-v` only when intentionally deleting the PostgreSQL and Kafka data volumes.

## Environment variables

`SERVER_PORT`, `SERVICE_URL`, `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRATION_MS`, `ML_SERVICE_URL`, `SPRING_PROFILES_ACTIVE`, and `LOG_LEVEL` are supported. `SERVER_PORT` and `SERVICE_URL` should be set per service when running multiple services. Never commit real credentials or secrets.

## API documentation

For each running web service, Swagger UI is available at `/swagger-ui.html` and the OpenAPI document at `/v3/api-docs`. Health is exposed at `/actuator/health`.

The ML service exposes `GET http://localhost:8090/health`, `POST /api/v1/forecast`, and `POST /api/v1/forecast/batch`. Its model and dataset are copied into the image and the dataset location can be overridden with `ML_DATA_PATH`.
