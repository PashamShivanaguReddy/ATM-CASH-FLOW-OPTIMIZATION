# ATM Cash Flow Optimization System - Phase 2

## Scope

Phase 2 adds the relational database and core domain foundation only. Authentication, ML integration, Kafka, API Gateway behavior, notifications, optimization workflows, and REST business endpoints remain deferred.

## ER Relationship Explanation

- `Bank` is the parent of `User` and `ATM` (`Bank 1 -> N Users`, `Bank 1 -> N ATMs`).
- `ATM` owns the operational history: transactions, denomination inventory rows, refills, predictions, alerts, and optimization recommendations (`ATM 1 -> N` for each).
- `CashRefill` optionally records the requesting and approving `User`.
- `OptimizationRecommendation` optionally references the `Prediction` that produced it.
- `AuditLog` optionally references the acting `User`.
- Relationships are lazy. Entity back-references and collections are ignored for JSON serialization; future REST APIs must return DTOs, never entities.

## Entities and Contracts

The `domain` module contains `Bank`, `User`, `ATM`, `ATMTransaction`, `CashInventory`, `CashRefill`, `Prediction`, `Alert`, `OptimizationRecommendation`, and `AuditLog` entities. Enums are stored as strings, financial values use `BigDecimal`, and mutable entities inherit `@Version` optimistic locking plus UTC `createdAt`/`updatedAt` lifecycle fields. `AuditLog` is immutable history and has its own timestamp without an update version.

Each entity has a matching DTO in `com.atm.domain.dto`, with Bean Validation constraints on identifiers, required fields, email values, amounts, coordinates, and confidence scores.

## Migration Files

- `domain/src/main/resources/db/migration/V1__create_core_domain_schema.sql` creates all ten tables, foreign keys, unique constraints, timestamps, numeric monetary columns, and indexes.
- No seed data is included in the production migration. Development/test data must be added only through a separate development profile or test fixture and must remain synthetic.

## Repositories

`BankRepository`, `UserRepository`, `ATMRepository`, `ATMTransactionRepository`, `CashInventoryRepository`, `CashRefillRepository`, `PredictionRepository`, `AlertRepository`, `OptimizationRecommendationRepository`, and `AuditLogRepository` extend `JpaRepository`. They include lookups for unique codes, ATM ownership, alert status, and timestamp/date ranges.

## Important Indexes and Constraints

Indexes cover `bank_code`, `atm_code`, `transaction_id`, `atm_id` on all ATM-owned tables, transaction `timestamp`, prediction `prediction_date`, alert `status`, and audit user/timestamp queries. `bank_code`, `atm_code`, `transaction_id`, and user `email` are unique. Inventory also has a unique `(atm_id, denomination)` constraint.

## Start PostgreSQL and Run Migrations

From the repository root:

```powershell
docker compose -f backend/docker-compose.yml up -d
$env:DB_URL="jdbc:postgresql://localhost:5433/atm"
$env:DB_USERNAME="atm"
$env:DB_PASSWORD="change-me"
mvn -f backend/pom.xml -pl atm-service -am install -DskipTests
mvn -f backend/atm-service/pom.xml spring-boot:run
```

Flyway runs automatically when `atm-service` starts with the default or `dev` profile. `spring.jpa.hibernate.ddl-auto=validate` ensures Hibernate validates the migration rather than creating or changing tables. Set `FLYWAY_ENABLED=false` only when explicitly testing without migrations.

## Test Results

`mvn -f backend/pom.xml clean test` passed for the complete Maven reactor. The new `DomainRepositoryTest` uses an embedded H2 database to verify repository discovery, persistence, lifecycle timestamps, and the unique bank-code lookup.

## Remaining Phase 3 Work

Phase 3 can add authentication and JWT authorization, service-owned REST APIs and application services, authorization by role, inter-service contracts, Kafka events, ML/prediction integration, notification delivery, optimization execution, and end-to-end PostgreSQL integration tests. None of that behavior is implemented in Phase 2.