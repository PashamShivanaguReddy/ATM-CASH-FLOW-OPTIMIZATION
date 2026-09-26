
Define a reusable skill called "ATM Microservice Development".

Use this standard implementation flow:

1. Identify service responsibility.
2. Inspect existing architecture.
3. Inspect existing entities.
4. Inspect DTOs.
5. Inspect controllers.
6. Inspect services.
7. Inspect repositories.
8. Inspect configuration.
9. Inspect database migrations.
10. Implement the smallest required change.
11. Add validation.
12. Add exception handling.
13. Add tests.
14. Build.
15. Run.
16. Verify API.
17. Verify dependent services.
18. Document the change.

Architecture rules:
- Controllers handle HTTP concerns.
- Services contain business logic.
- Repositories handle persistence.
- DTOs define API contracts.
- Services should not directly access another service's database.
- Inter-service communication must use APIs/events.
- Kafka should be used where asynchronous event communication is appropriate.
- Authentication must remain centralized and secure.
- API Gateway is the browser-facing entry point.

Do not create unnecessary microservices.
Do not duplicate business logic across services.