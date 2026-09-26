
Define a reusable skill called "ATM API Testing".

Purpose:
Provide a repeatable procedure for testing ATM microservice APIs.

Include:

Prerequisites:
- Docker Compose running
- API Gateway available
- Swagger available
- PostgreSQL available
- required services healthy

Procedure:

1. Check docker compose status.
2. Check API Gateway.
3. Open Swagger through the gateway.
4. Login using the authentication API.
5. Extract access token.
6. Authorize Swagger with Bearer token.
7. Test APIs in dependency order.
8. Save important IDs such as userId, bankId, atmId.
9. Test cash inventory.
10. Test transactions.
11. Verify inventory changes.
12. Test prediction.
13. Test optimization.
14. Test alerts.
15. Test analytics.
16. Record failures.

Include positive and negative test cases.

Important:
Do not guess API schemas.
Always use the current OpenAPI specification.