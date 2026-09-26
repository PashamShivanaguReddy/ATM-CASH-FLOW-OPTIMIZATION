# PHASE 14 - Docker Deployment and Startup Stabilization

Phase 14 documents the Docker deployment validation and the startup fixes required to run the complete ATM platform stack.

## Docker deployment

The platform is started with Docker Compose from the repository root:

```powershell
docker compose --env-file backend/.env -f backend/docker-compose.yml build
docker compose --env-file backend/.env -f backend/docker-compose.yml up -d --wait --wait-timeout 300
```

The Compose deployment includes:

- PostgreSQL 16
- Kafka 3.8.1
- ML forecasting service
- Service registry
- Config server
- API gateway
- Auth, user, bank, ATM, transaction, cash inventory, prediction, alert, optimization, notification, and analytics services

PostgreSQL is published on host port `5433`, Kafka on host port `9094`, and the ML service on host port `8090`. Java service ports are defined in `backend/docker-compose.yml`.

The `java-runtime` Compose service is a build helper that runs `true` and exits with status 0. It is not a long-running application service and should not be used as a health target.

## Startup problems found

### transaction-service datasource

`transaction-service` used JPA repositories but its `application.yml` did not define a datasource. Spring Boot therefore attempted to create a datasource without a URL and reported:

```text
Failed to configure a DataSource: 'url' attribute is not specified
Failed to determine a suitable driver class
```

The service now uses the existing environment naming convention:

```yaml
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  jpa.hibernate.ddl-auto: ${JPA_DDL_AUTO:update}
  jpa.open-in-view: false
```

Docker Compose supplies the PostgreSQL connection through `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`; no credentials are hardcoded.

### prediction-service datasource and startup wiring

`prediction-service` is a Spring Boot service, not the Python ML service. It legitimately uses PostgreSQL for prediction persistence and receives the same database environment variables from Docker Compose.

After rebuilding the Docker image, its datasource initialized correctly and PostgreSQL connections were established. A second startup issue was then exposed in `MLClient`: it has two constructors, but neither constructor was explicitly selected for Spring injection. The existing configured `RestClient` constructor is now annotated with `@Autowired`.

The ML forecasting logic and Python service were not changed.

### Shared Kafka beans

`KafkaConfiguration` and `KafkaEventPublisher` are located in the shared `common` module under `com.atm.common.event`. The application classes scan their own service packages, so the shared classes were not automatically discovered.

The transaction, prediction, and alert application classes now explicitly import the existing shared configuration and publisher:

```java
@Import({GlobalExceptionHandler.class, KafkaConfiguration.class, KafkaEventPublisher.class})
```

This enables the real Kafka producer, `KafkaTemplate`, event publisher, topic configuration, and consumer infrastructure. No dummy or replacement bean was added.

## Files modified

- `transaction-service/src/main/resources/application.yml`
  - Added environment-based PostgreSQL datasource and JPA settings.
- `transaction-service/src/main/java/com/atm/transaction/TransactionServiceApplication.java`
  - Imported shared Kafka configuration and publisher.
- `prediction-service/src/main/java/com/atm/prediction/PredictionServiceApplication.java`
  - Imported shared Kafka configuration and publisher.
- `prediction-service/src/main/java/com/atm/prediction/client/MLClient.java`
  - Marked the existing configured `RestClient` constructor with `@Autowired`.
- `alert-service/src/main/java/com/atm/alert/AlertServiceApplication.java`
  - Imported shared Kafka configuration and publisher.

The API gateway, Python ML model, Docker Compose service list, secrets, and working service implementations were not otherwise modified.

## Build validation

The affected Java modules were compiled and packaged with Maven:

```powershell
mvn -f backend/pom.xml -pl transaction-service,prediction-service,alert-service -am package -DskipTests
mvn -f backend/pom.xml -pl prediction-service -am package -DskipTests
```

Both builds completed with `BUILD SUCCESS`.

Docker images were then rebuilt:

```powershell
docker compose --env-file backend/.env -f backend/docker-compose.yml build
```

Built images:

- `atm-platform-java:local`
- `atm-platform-ml-service:latest`

## Runtime validation

The complete persistent Docker stack was started and health-checked. The following services reported healthy status:

- PostgreSQL
- Kafka
- ML service
- Service registry
- Config server
- Auth service
- User service
- Bank service
- ATM service
- Transaction service
- Cash inventory service
- Prediction service
- Alert service
- Optimization service
- Notification service
- Analytics service
- API gateway

HTTP health checks returned `200` for the ML service at `/health` and for Java services at `/api/v1/status`.

Runtime logs confirmed:

- transaction-service established a PostgreSQL connection.
- prediction-service established a PostgreSQL connection and started successfully.
- transaction, prediction, and alert services initialized Kafka clients.
- prediction and alert consumers subscribed to their expected Kafka topics.
- api-gateway started successfully after its dependent services became healthy.

## Final result

The complete Docker deployment is operational. All persistent infrastructure and application services are healthy, and no startup errors remain. The only exited container is the intentional `java-runtime` build helper, which runs `true` and is not an application service.
