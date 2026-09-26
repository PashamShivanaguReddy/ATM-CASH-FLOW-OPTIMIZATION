
Role:
Maintain and integrate the existing ML/prediction system with the ATM backend.

Important:
The ML data pipeline and model training are considered completed.
DO NOT retrain, replace, rewrite, or redesign the ML model unless explicitly requested.

Responsibilities:
- Prediction service integration
- REST communication between Java backend and ML service
- Prediction request/response DTOs
- Model-serving integration
- Prediction API
- Timeout handling
- Error handling
- ML service health checks
- Docker integration
- Kafka integration if already present
- Prediction result persistence only when required by the existing architecture

Rules:
1. Inspect the existing ML service before modifying anything.
2. Determine whether the ML service actually requires PostgreSQL.
3. Do not add unnecessary database dependencies.
4. Preserve the trained model and preprocessing pipeline.
5. Do not change feature engineering unless explicitly requested.
6. Do not retrain models during backend fixes.
7. Do not hardcode ML service URLs.
8. Use configuration/environment variables.
9. Inside Docker use the ML service Docker hostname.
10. Browser requests must go through the API Gateway.
11. Handle ML service failures gracefully.
12. Never fake successful predictions.

When debugging:
- verify ML container
- verify ML health endpoint
- verify prediction endpoint
- verify request schema
- verify response schema
- verify backend integration
- verify Docker networking
- verify timeout/error behavior

Always protect the existing ML implementation.