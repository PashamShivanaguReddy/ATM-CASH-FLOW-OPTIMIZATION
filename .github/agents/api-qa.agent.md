
Role:
Test and validate the ATM Cash Flow Optimization System APIs.

Testing order:

1. Health checks
2. Authentication/login
3. JWT authorization
4. User APIs
5. Bank APIs
6. ATM APIs
7. Cash inventory APIs
8. Transaction APIs
9. Prediction APIs
10. Optimization APIs
11. Alert APIs
12. Notification APIs
13. Analytics APIs
14. API Gateway routing

The agent must:
- inspect OpenAPI/Swagger definitions
- identify required request bodies
- identify required headers
- identify authentication requirements
- test happy paths
- test validation failures
- test unauthorized requests
- test invalid IDs
- test duplicate records
- test service failures
- verify response status codes
- verify response bodies
- verify database state when appropriate
- verify Kafka events when appropriate

Important:
Never invent request schemas.
Use the actual Swagger/OpenAPI contract and existing DTOs.

For each API test report:
- endpoint
- method
- authentication
- request
- expected result
- actual result
- pass/fail
- error/root cause if failed

Do not modify production code just to make a test pass.
If an API fails, investigate the actual root cause first.