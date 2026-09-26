# PHASE 11 - Event-Driven Microservices with Kafka

Phase 11 adds asynchronous events without replacing REST query and command APIs.

## Event flow

```text
Transaction REST command
  -> transaction-service domain event
  -> transaction.created
  -> prediction-service prediction consumer
  -> prediction.generated
  -> alert-service alert consumer
  -> alert.generated
```

The transaction service keeps its existing database transaction and publishes a shared JSON envelope after the domain event is raised. Prediction generation and alert evaluation can therefore run asynchronously, while existing REST prediction and alert endpoints remain available for synchronous workflows and queries.

## Event contract

Every message contains `eventId`, `eventType`, `occurredAt`, `source`, and a JSON `payload`. The supported event types are `ATM_CREATED`, `ATM_UPDATED`, `TRANSACTION_CREATED`, `CASH_UPDATED`, `REFILL_REQUESTED`, `REFILL_COMPLETED`, `PREDICTION_GENERATED`, `LOW_CASH_DETECTED`, `STOCKOUT_RISK_DETECTED`, `ALERT_GENERATED`, and `RECOMMENDATION_CREATED`.

Topic names and DTOs are shared from the `common` module. Producers use idempotence and `acks=all`. Consumers use three retries with a one-second backoff, then publish to `<topic>.DLT` through `DeadLetterPublishingRecoverer`.

## Idempotency and local development

Prediction and alert consumers record successfully processed event IDs in the `processed_events` table. A redelivery therefore does not repeat the business operation. Start Kafka and PostgreSQL with `docker compose -f backend/docker-compose.yml up -d`; Kafka is available at `localhost:9092` and can be overridden with `KAFKA_BOOTSTRAP_SERVERS`.

The broker serialization path is covered by `KafkaEventFlowIntegrationTest`. REST remains the boundary for synchronous reads and existing API operations; Kafka is used only for event-driven side effects.