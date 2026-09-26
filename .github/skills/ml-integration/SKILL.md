
Define a reusable skill called "ATM ML Integration".

Purpose:
Safely connect the existing trained ML model to the ATM backend.

Important:
The ML model training/data pipeline is already completed.

Never:
- retrain the model
- replace the model
- change the trained model
- change feature engineering
- modify preprocessing
unless explicitly requested.

Procedure:

1. Locate ML service.
2. Identify model loading mechanism.
3. Identify prediction endpoint.
4. Identify request schema.
5. Identify response schema.
6. Verify ML health endpoint.
7. Verify standalone prediction.
8. Verify Docker connectivity.
9. Verify backend-to-ML communication.
10. Verify timeout handling.
11. Verify failure handling.
12. Verify prediction result mapping.
13. Verify API Gateway access where applicable.

Use environment/configuration for service URLs.

Inside Docker:
backend → ML service name

Browser:
browser → API Gateway → backend/ML integration

Never expose internal Docker hostnames to browser Swagger.