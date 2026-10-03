# Deployment

This deployment uses the existing Compose stack in `backend/docker-compose.yml`. The frontend is built as static assets and is hosted separately; Compose does not include a frontend container.

## Prerequisites

- Docker Engine/Desktop with Compose v2
- Java 17+ and Maven 3.9+ for the local backend verification build
- Node.js/npm for the frontend build
- Allocate more than 8 GiB to Docker for a concurrent cold start. This environment OOM-killed Java services at 8 GiB; the staged startup below limits the startup peak.

## 1. Configure Environment

From the repository root in PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
notepad backend/.env
```

Replace every placeholder. Use a unique PostgreSQL password and a random `JWT_SECRET` of at least 32 bytes. Set `SPRING_PROFILES_ACTIVE=prod` and keep `JPA_DDL_AUTO=validate`. Set `CORS_ALLOWED_ORIGINS` to the exact browser origin(s), `PUBLIC_BASE_URL` to the externally reachable gateway URL, and `VITE_API_BASE_URL` to `/api` when the web host proxies that path to the gateway. Never commit `backend/.env`.

For production, store secrets in the hosting platform's secret manager rather than a checked-in file. The sample also includes `VITE_API_BASE_URL` for the frontend build; Vite reads it from the build environment, not from Compose.

## Cloud deployment configuration for this project

These are the actual values you provided for the hosted deployment and why they are required:

```text
FRONTEND_URL=https://atm-frontend.pages.dev
API_GATEWAY_URL=https://atm-api-gateway.onrender.com
ML_SERVICE_URL=https://atm-ml.onrender.com
VITE_API_BASE_URL=https://atm-api-gateway.onrender.com
JWT_SECRET=rV9!qL2#xT7@pM4$zK8&nW6^cH3*eY5
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@atm-system.local
ADMIN_PASSWORD=AtmAdmin!2026#Secure
DATABASE_URL=postgresql://<NEON_USER>:<NEON_PASSWORD>@<NEON_HOST>/<NEON_DATABASE>?sslmode=require
KAFKA_BOOTSTRAP_URL=<UPSTASH_KAFKA_BOOTSTRAP_URL>
KAFKA_USERNAME=<UPSTASH_KAFKA_USERNAME>
KAFKA_PASSWORD=<UPSTASH_KAFKA_PASSWORD>
```

Why these values matter:

- `FRONTEND_URL` is the Cloudflare Pages public URL. The browser must load the frontend from this domain, not from `localhost`.
- `API_GATEWAY_URL` is the production entry point for all backend API traffic. The React frontend must call only this URL. This is the URL used by the gateway and by the browser. It is required for CORS and runtime API calls.
- `ML_SERVICE_URL` is required because the prediction service calls the Python forecasting API. In production, the ML service is not local and cannot use `http://localhost:8090`.
- `VITE_API_BASE_URL` is required during the frontend build. This value is injected into the built frontend bundle so the browser talks to the gateway rather than to local dev ports.
- `JWT_SECRET` must match the secret used by the auth service and the gateway. If the secret differs between services, JWT validation fails and all protected routes return unauthorized.
- `ADMIN_USERNAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` are used to bootstrap the initial super-admin account. These values must be set before login is tested against the live deployment.
- `DATABASE_URL` is required for every Spring Boot service that connects to PostgreSQL. Do not use the Docker `postgres` hostname in production; use the Neon host instead.
- Kafka values must be set because the production event bus is Upstash, not the local Docker Kafka container. Do not use `localhost:9092` or `kafka:9092` in cloud deployment.

Important: the Neon and Upstash values are intentionally left as placeholders in this guide because they are secrets and must be filled in from your actual provider account. Do not paste them into source control.

## 2. Build Frontend

```powershell
Push-Location frontend
$env:VITE_API_BASE_URL = "/api"
npm install
npm run build
Pop-Location
```

Publish `frontend/dist` to a static web host. Configure that host or its reverse proxy to forward `/api/*` to the API Gateway on port `8080`, preserving the path. If the API uses a different origin, set `VITE_API_BASE_URL` to its `/api` URL and allow the frontend origin in `CORS_ALLOWED_ORIGINS`.

## 3. Build Backend

```powershell
mvn -f backend/pom.xml verify
```

For cloud deployment, the backend build is still the same locally; the runtime env values are different. Render will build the JARs from the repo and then run them with the production environment variables set in the service dashboard.

## 4. Build Containers

```powershell
$compose = @("--env-file", "backend/.env", "-f", "backend/docker-compose.yml")
docker compose @compose build
```

Compose builds the shared Java runtime image and the ML image. The Java image contains all backend service JARs. The ML image includes `ML/project/models/atm_forecast_model.pkl`, the dataset, and dependencies from `ML/requirements.txt`.

## 5. Start Database and Broker

```powershell
docker compose @compose up --detach --wait postgres kafka
```

PostgreSQL data and Kafka data persist in named Compose volumes.

## 6. Start ML Service

```powershell
docker compose @compose up --detach --wait --wait-timeout 240 ml-service
```

FastAPI warms the cached model before becoming healthy. Verify `http://localhost:8090/health` before starting prediction-service.

## 7. Start All Services

Start Java services serially so a limited Docker host does not spike memory. The ordering waits for the ATM service's Flyway migrations before the other database-backed services and starts the gateway last.

```powershell
$services = @(
  "service-registry", "config-server", "atm-service", "cash-inventory-service",
  "auth-service", "user-service", "bank-service", "transaction-service",
  "alert-service", "optimization-service", "prediction-service",
  "notification-service", "analytics-service", "api-gateway"
)
foreach ($service in $services) {
  docker compose @compose up --detach --no-deps --wait --wait-timeout 300 $service
  if ($LASTEXITCODE -ne 0) { throw "Service failed to become healthy: $service" }
}
```

## 8. Verify Health

```powershell
docker compose @compose ps
Invoke-RestMethod http://localhost:8080/api/v1/status
Invoke-RestMethod http://localhost:8090/health
docker compose @compose exec -T postgres sh -lc 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

The gateway is published on `8080`; ML is published on `8090`. PostgreSQL and Kafka use host ports `5433` and `9094`. Other Java services are internal-only. Their `/api/v1/status` checks run inside each container; use `docker compose @compose exec -T <service> curl -fsS http://localhost:<service-port>/api/v1/status` to query one directly.

## 9. Run E2E Smoke Test

This smoke test uses the bootstrap credentials in the ignored environment file, does not print the token, checks the authenticated API routes, creates a prediction recommendation, approves it, creates a refill, approves and completes the refill, and verifies the updated ATM cash inventory. It exercises the actual current production-style deployment path end-to-end.

The production deployment using Render + Cloudflare + Neon + Upstash follows the same flow, but with the public URLs below instead of localhost:

```text
Frontend: https://atm-frontend.pages.dev
Gateway: https://atm-api-gateway.onrender.com
ML: https://atm-ml.onrender.com
```

Production smoke test against the hosted deployment:

```powershell
$base = "https://atm-api-gateway.onrender.com"
$login = Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType "application/json" -Body (@{ email = "admin@atm-system.local"; password = "AtmAdmin!2026#Secure" } | ConvertTo-Json)
$token = $login.data.accessToken
$headers = @{ Authorization = "Bearer $token" }

$dashboard = Invoke-RestMethod -Uri "$base/api/dashboard/summary" -Headers $headers
$banks = Invoke-RestMethod -Uri "$base/api/banks?page=0&size=20" -Headers $headers
$atms = Invoke-RestMethod -Uri "$base/api/atms?page=0&size=100" -Headers $headers
$atmId = ($atms.content | Select-Object -First 1).id

$prediction = Invoke-RestMethod -Method Post -Uri "$base/api/predictions/$atmId" -Headers $headers -ContentType "application/json" -Body (@{ atmId = $atmId; predictionDate = (Get-Date).ToString('yyyy-MM-dd') } | ConvertTo-Json)
$recommendation = Invoke-RestMethod -Method Post -Uri "$base/api/optimization/atms/$atmId/recommend" -Headers $headers -ContentType "application/json" -Body (@{ predictionId = $prediction.id } | ConvertTo-Json)
Invoke-RestMethod -Method Post -Uri "$base/api/optimization/recommendations/$($recommendation.id)/approve" -Headers $headers | Out-Null

$refill = Invoke-RestMethod -Method Post -Uri "$base/api/refills" -Headers $headers -ContentType "application/json" -Body (@{ atmId = $atmId; refillAmount = 50; notes = "Rendered cloud validation"; recommendationId = $recommendation.id } | ConvertTo-Json)
Invoke-RestMethod -Method Post -Uri "$base/api/refills/$($refill.id)/approve" -Headers $headers | Out-Null
Invoke-RestMethod -Method Post -Uri "$base/api/refills/$($refill.id)/complete" -Headers $headers | Out-Null
$inventory = Invoke-RestMethod -Uri "$base/api/atms/$atmId/cash" -Headers $headers

"OK - production flow passed for ATM $atmId; total cash: $($inventory.totalCash)"
```

### Why these values must be user-supplied

The cloud deployment cannot be fully completed without the actual provider-specific values:

- Neon host and database name are unique to your account.
- Upstash bootstrap URL and credential values are unique to your Kafka cluster.
- Cloudflare Pages public domain is your chosen domain.
- Render services create their own URLs after deployment.

These real values are not in the repo and must be added in the hosting platform settings.


```powershell
$values = @{}
Get-Content backend/.env | ForEach-Object {
  if ($_ -match '^\s*([^#=\s]+)=(.*)$') {
    $parts = $_.Split('=', 2)
    $values[$parts[0]] = $parts[1]
  }
}
$base = "http://localhost:$($values['GATEWAY_PORT'])"
$login = Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType "application/json" -Body (@{ email = $values['INITIAL_SUPER_ADMIN_EMAIL']; password = $values['INITIAL_SUPER_ADMIN_PASSWORD'] } | ConvertTo-Json)
$headers = @{ Authorization = "Bearer $($login.data.accessToken)" }
$paths = @("/api/dashboard/summary", "/api/dashboard/alerts", "/api/transactions?page=0&size=5", "/api/refills", "/api/alerts", "/api/optimization/recommendations")
foreach ($path in $paths) { Invoke-RestMethod -Uri "$base$path" -Headers $headers | Out-Null; "OK $path" }
$atms = Invoke-RestMethod -Uri "$base/api/atms?page=0&size=100" -Headers $headers
$atm = $atms.content | Where-Object { $_.currentCash + 50 -le $_.cashCapacity } | Select-Object -First 1
if (-not $atm) { throw "No ATM with refill capacity; seed a bank and ATM, then retry." }
$atmId = $atm.id
Invoke-RestMethod -Uri "$base/api/atms/$atmId/cash" -Headers $headers | Out-Null
$prediction = Invoke-RestMethod -Method Post -Uri "$base/api/predictions/$atmId" -Headers $headers -ContentType "application/json" -Body (@{ atmId = "$atmId"; predictionDate = (Get-Date -Format "yyyy-MM-dd") } | ConvertTo-Json)
$recommendation = Invoke-RestMethod -Method Post -Uri "$base/api/optimization/atms/$atmId/recommend" -Headers $headers -ContentType "application/json" -Body (@{ predictionId = $prediction.id } | ConvertTo-Json)
Invoke-RestMethod -Method Post -Uri "$base/api/optimization/recommendations/$($recommendation.id)/approve" -Headers $headers | Out-Null
$refill = Invoke-RestMethod -Method Post -Uri "$base/api/refills" -Headers $headers -ContentType "application/json" -Body (@{ atmId = $atmId; refillAmount = 50; notes = "Deployment smoke $(Get-Date -Format s)"; recommendationId = $recommendation.id } | ConvertTo-Json)
Invoke-RestMethod -Method Post -Uri "$base/api/refills/$($refill.id)/approve" -Headers $headers | Out-Null
Invoke-RestMethod -Method Post -Uri "$base/api/refills/$($refill.id)/complete" -Headers $headers | Out-Null
$inventory = Invoke-RestMethod -Uri "$base/api/atms/$atmId/cash" -Headers $headers
"OK prediction, recommendation approval, refill approval, refill completion, and cash update for ATM $atmId. Total cash: $($inventory.totalCash)"
```

A newly initialized database has schema migrations and may already include sample data. Validate the bank/ATM records before running the smoke test and use an ATM with available capacity. The current deployment uses the Docker Kafka service name `kafka:9092` for inter-container communications; do not use `localhost:9092` inside containers.

## 10. Stop or Restart

```powershell
docker compose @compose restart
docker compose @compose down
```

`down` preserves the PostgreSQL and Kafka volumes. Do not use `down --volumes` unless intentionally deleting all persisted data.

## Network and Production Notes

- Browser traffic should reach the API Gateway only. Internal URLs use Compose DNS names such as `auth-service`, `postgres`, `kafka`, and `ml-service`.
- Eureka registry and Config Server containers are included, but the current services do not configure discovery/config clients; the gateway uses explicit service URLs.
- PostgreSQL, Kafka, and ML ports are published for local operations. Restrict or unpublish them in production, use TLS at the public reverse proxy, and do not expose Kafka's plaintext listener to untrusted networks.
- Fresh database schema is applied by the ATM service migrations. No business seed data is bundled; set initial super-admin credentials in the environment and provision a bank and ATMs after startup.

# Complete Free/Low-Cost Cloud Deployment Guide (Render + Cloudflare + Neon + Upstash)

This is the production deployment path for the exact values you provided. The sections below show where to change the repo, what to change, and what values must be supplied by the user before deployment.

## Why user input is required

The cloud deployment cannot be fully configured without actual provider-specific values. These are not stored in the repository and are unique to your account or environment:

- Neon database host, database name, username, and password
- Upstash Kafka bootstrap URL, username, and password
- Cloudflare Pages public frontend URL
- Render service public URLs
- The JWT secret that must match between gateway and auth services
- Initial admin email and password used for bootstrap login

This is why the deployment guide needs the user to fill in these values before final production deployment is attempted.

### The values already supplied by the user

```text
FRONTEND_URL=https://atm-frontend.pages.dev
API_GATEWAY_URL=https://atm-api-gateway.onrender.com
ML_SERVICE_URL=https://atm-ml.onrender.com
VITE_API_BASE_URL=https://atm-api-gateway.onrender.com
JWT_SECRET=rV9!qL2#xT7@pM4$zK8&nW6^cH3*eY5
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@atm-system.local
ADMIN_PASSWORD=AtmAdmin!2026#Secure
DATABASE_URL=postgresql://<NEON_USER>:<NEON_PASSWORD>@<NEON_HOST>/<NEON_DATABASE>?sslmode=require
KAFKA_BOOTSTRAP_URL=<UPSTASH_KAFKA_BOOTSTRAP_URL>
KAFKA_USERNAME=<UPSTASH_KAFKA_USERNAME>
KAFKA_PASSWORD=<UPSTASH_KAFKA_PASSWORD>
```

The Neon and Upstash values must be replaced with real values from your accounts before deploy.


This guide is for deploying the ATM Cash Flow Optimization project without Oracle, AWS, GCP, or Azure. The recommended stack is:

- Frontend: Cloudflare Pages
- Java backend services: Render
- PostgreSQL: Neon
- Kafka: Upstash Kafka
- ML service: Render

This is the most practical free/low-cost architecture for this project because the repo contains multiple services and event-driven components.

## 1. What this project needs in the cloud

This repository is not a single app. It is a multi-service stack with:

- React/Vite frontend
- Spring Boot API Gateway
- Spring Boot auth service
- User, bank, ATM, transaction, prediction, optimization, analytics, cash inventory, alert, notification services
- PostgreSQL database
- Kafka event bus
- Python ML service

Because of this, you should not try to host the whole system as one service. Use one Render service per Java app, and make the gateway the public entry point for the browser.

## 2. Files to change in the repo

These are the files you need to review and configure for production deployment:

- `backend/.env.example` — sample environment variables for local deployment
- `backend/docker-compose.yml` — local Docker-only deployment config, not for cloud deployment
- `backend/api-gateway/src/main/resources/application.yml` — public gateway service URLs and JWT config
- `backend/*/src/main/resources/application.yml` — each Java service's DB, Kafka, and profile config
- `backend/*/src/main/resources/application-prod.yml` — production profile overrides if used
- `frontend/src/services/api.ts` — frontend API base URL
- `frontend/src/services/env.d.ts` — Vite env typing
- `frontend/package.json` — build script
- `ML/project/api_server.py` or ML entrypoints — Python service startup config

Where to change the important values:

- Use environment variables instead of `localhost`
- Use public URLs in production instead of Docker hostnames like `postgres`, `kafka`, `ml-service`
- Use Cloudflare Pages public frontend URL and Render public backend URLs
- Replace Kafka bootstrap servers for the cloud broker

## 3. Production deployment architecture

Recommended cloud design:

- Frontend: `https://your-app.pages.dev`
- API gateway: `https://atm-gateway.onrender.com`
- Auth service: `https://atm-auth.onrender.com`
- Bank service: `https://atm-bank.onrender.com`
- ATM service: `https://atm-atm.onrender.com`
- Transaction service: `https://atm-transaction.onrender.com`
- Cash inventory service: `https://atm-cash.onrender.com`
- Prediction service: `https://atm-prediction.onrender.com`
- Alert service: `https://atm-alert.onrender.com`
- Optimization service: `https://atm-optimization.onrender.com`
- Analytics service: `https://atm-analytics.onrender.com`
- ML service: `https://atm-ml.onrender.com`
- PostgreSQL: Neon managed database
- Kafka: Upstash managed Kafka cluster

The frontend should never call direct service URLs. It should use only the API Gateway URL.

## 4. Create the PostgreSQL database in Neon

1. Go to Neon and create a new project.
2. Name the database, for example `atm-prod`.
3. Copy the connection string.
4. It will look similar to:

```text
postgresql://<user>:<password>@ep-xxxxx.us-east-2.aws.neon.tech/<dbname>?sslmode=require
```

Convert it to a Spring JDBC URL:

```text
jdbc:postgresql://<host>:5432/<dbname>?sslmode=require
```

Set the following backend environment variables in Render:

```text
DB_URL=jdbc:postgresql://<host>:5432/<dbname>?sslmode=require
DB_USERNAME=<neon-user>
DB_PASSWORD=<strong-password>
SPRING_PROFILES_ACTIVE=prod
JPA_DDL_AUTO=validate
```

Notes:

- Do not use localhost in production.
- Neon uses a host name, not `postgres`.
- Set the database variables in every Java service that uses PostgreSQL.
- Keep all secrets in the hosting environment, not in source control.

## 5. Create Kafka in Upstash

1. Sign up for Upstash.
2. Create a Kafka cluster.
3. Copy:
   - bootstrap server URL
   - username
   - password

Your Java app must use the broker with SASL/SSL, because this is remote cloud Kafka, not Docker local Kafka.

Set these environment variables for your Kafka-enabled services:

```text
KAFKA_BOOTSTRAP_SERVERS=<upstash-bootstrap-server>
SPRING_KAFKA_BOOTSTRAP_SERVERS=<upstash-bootstrap-server>
SPRING_KAFKA_PROPERTIES_SECURITY_PROTOCOL=SASL_SSL
SPRING_KAFKA_PROPERTIES_SASL_MECHANISM=SCRAM-SHA-256
SPRING_KAFKA_PROPERTIES_SASL_JAAS_CONFIG=org.apache.kafka.common.security.scram.ScramLoginModule required username="<upstash-username>" password="<upstash-password>";
```

What to change in code:

In the Java service config files, Kafka should read from environment variables and not default to localhost in production. The project already contains patterns like:

```yaml
spring:
  kafka:
    bootstrap-servers: ${SPRING_KAFKA_BOOTSTRAP_SERVERS:${KAFKA_BOOTSTRAP_SERVERS:localhost:9092}}
```

This is correct only if the env value is set in cloud deployment. In cloud, do not leave `localhost:9092` as the real runtime value.

For this project, the required production rule is:

- `localhost` is allowed only for local Docker or local testing
- `kafka:9092` is allowed only inside Docker Compose
- cloud deployment should use the Upstash broker host and SASL config

## 6. Deploy the Python ML service on Render

1. Go to Render.
2. Create a new Web Service.
3. Connect your GitHub repository.
4. Set the root directory to `ML`.
5. Use a Python runtime.
6. Install dependencies using:

```bash
pip install -r requirements.txt
```

7. Start command:

```bash
uvicorn project.api_server:app --host 0.0.0.0 --port ${PORT:-10000}
```

8. Set environment variables:

```text
PORT=10000
ML_DATA_PATH=/app/ml_dataset_final.csv
```

9. Copy the public URL after deployment, for example:

```text
https://atm-ml.onrender.com
```

10. Set backend environment variable:

```text
ML_SERVICE_URL=https://atm-ml.onrender.com
```

Check the health endpoint:

```bash
curl https://atm-ml.onrender.com/health
```

## 7. Deploy Java services to Render

Use one Render Web Service per service. Do not collapse everything into one app unless you intentionally want a monolith.

Recommended service set:

- `api-gateway`
- `auth-service`
- `user-service`
- `bank-service`
- `atm-service`
- `transaction-service`
- `cash-inventory-service`
- `prediction-service`
- `alert-service`
- `optimization-service`
- `analytics-service`
- `notification-service`

### 7.1 API Gateway service

The gateway is the main public endpoint for the browser and frontend.

Render settings:

- Root directory: `backend`
- Build command:

```bash
mvn -f pom.xml -DskipTests package
```

- Start command:

```bash
java -jar api-gateway/target/api-gateway.jar
```

Environment variables:

```text
SERVER_PORT=8080
SPRING_PROFILES_ACTIVE=prod
JWT_SECRET=<32+ char secret>
CORS_ALLOWED_ORIGINS=https://your-app.pages.dev
AUTH_SERVICE_URL=https://atm-auth.onrender.com
USER_SERVICE_URL=https://atm-user.onrender.com
BANK_SERVICE_URL=https://atm-bank.onrender.com
ATM_SERVICE_URL=https://atm-atm.onrender.com
TRANSACTION_SERVICE_URL=https://atm-transaction.onrender.com
CASH_INVENTORY_SERVICE_URL=https://atm-cash.onrender.com
PREDICTION_SERVICE_URL=https://atm-prediction.onrender.com
ALERT_SERVICE_URL=https://atm-alert.onrender.com
OPTIMIZATION_SERVICE_URL=https://atm-optimization.onrender.com
ANALYTICS_SERVICE_URL=https://atm-analytics.onrender.com
```

This matches the values in `backend/api-gateway/src/main/resources/application.yml`.

### 7.2 Auth service

Render settings:

- Root directory: `backend`
- Build command:

```bash
mvn -f pom.xml -DskipTests package
```

- Start command:

```bash
java -jar auth-service/target/auth-service.jar
```

Environment variables:

```text
SERVER_PORT=8081
SPRING_PROFILES_ACTIVE=prod
DATABASE_URL=jdbc:postgresql://<host>:5432/<dbname>?sslmode=require
DB_URL=jdbc:postgresql://<host>:5432/<dbname>?sslmode=require
DB_USERNAME=<neon-user>
DB_PASSWORD=<strong-password>
JWT_SECRET=<same as gateway>
JWT_EXPIRATION_MS=3600000
PUBLIC_BASE_URL=https://atm-gateway.onrender.com
INITIAL_SUPER_ADMIN_EMAIL=admin@yourdomain.com
INITIAL_SUPER_ADMIN_PASSWORD=StrongPassword123!
CORS_ALLOWED_ORIGINS=https://your-app.pages.dev
JPA_DDL_AUTO=validate
LOG_LEVEL=INFO
```

### 7.3 User service

```text
SERVER_PORT=8082
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://<host>:5432/<dbname>?sslmode=require
DB_USERNAME=<neon-user>
DB_PASSWORD=<strong-password>
JWT_SECRET=<same as gateway>
```

### 7.4 Bank service

```text
SERVER_PORT=8083
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://<host>:5432/<dbname>?sslmode=require
DB_USERNAME=<neon-user>
DB_PASSWORD=<strong-password>
JWT_SECRET=<same as gateway>
```

### 7.5 ATM service

```text
SERVER_PORT=8084
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://<host>:5432/<dbname>?sslmode=require
DB_USERNAME=<neon-user>
DB_PASSWORD=<strong-password>
JWT_SECRET=<same as gateway>
```

### 7.6 Transaction service

```text
SERVER_PORT=8085
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://<host>:5432/<dbname>?sslmode=require
DB_USERNAME=<neon-user>
DB_PASSWORD=<strong-password>
JWT_SECRET=<same as gateway>
KAFKA_BOOTSTRAP_SERVERS=<upstash-bootstrap-server>
SPRING_KAFKA_BOOTSTRAP_SERVERS=<upstash-bootstrap-server>
SPRING_KAFKA_PROPERTIES_SECURITY_PROTOCOL=SASL_SSL
SPRING_KAFKA_PROPERTIES_SASL_MECHANISM=SCRAM-SHA-256
SPRING_KAFKA_PROPERTIES_SASL_JAAS_CONFIG=org.apache.kafka.common.security.scram.ScramLoginModule required username="<upstash-username>" password="<upstash-password>";
```

### 7.7 Cash inventory service

```text
SERVER_PORT=8086
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://<host>:5432/<dbname>?sslmode=require
DB_USERNAME=<neon-user>
DB_PASSWORD=<strong-password>
JWT_SECRET=<same as gateway>
KAFKA_BOOTSTRAP_SERVERS=<upstash-bootstrap-server>
SPRING_KAFKA_BOOTSTRAP_SERVERS=<upstash-bootstrap-server>
SPRING_KAFKA_PROPERTIES_SECURITY_PROTOCOL=SASL_SSL
SPRING_KAFKA_PROPERTIES_SASL_MECHANISM=SCRAM-SHA-256
SPRING_KAFKA_PROPERTIES_SASL_JAAS_CONFIG=org.apache.kafka.common.security.scram.ScramLoginModule required username="<upstash-username>" password="<upstash-password>";
```

### 7.8 Prediction service

```text
SERVER_PORT=8087
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://<host>:5432/<dbname>?sslmode=require
DB_USERNAME=<neon-user>
DB_PASSWORD=<strong-password>
JWT_SECRET=<same as gateway>
ML_SERVICE_URL=https://atm-ml.onrender.com
ALERT_SERVICE_URL=https://atm-alert.onrender.com
KAFKA_BOOTSTRAP_SERVERS=<upstash-bootstrap-server>
SPRING_KAFKA_BOOTSTRAP_SERVERS=<upstash-bootstrap-server>
SPRING_KAFKA_PROPERTIES_SECURITY_PROTOCOL=SASL_SSL
SPRING_KAFKA_PROPERTIES_SASL_MECHANISM=SCRAM-SHA-256
SPRING_KAFKA_PROPERTIES_SASL_JAAS_CONFIG=org.apache.kafka.common.security.scram.ScramLoginModule required username="<upstash-username>" password="<upstash-password>";
```

### 7.9 Alert service

```text
SERVER_PORT=8088
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://<host>:5432/<dbname>?sslmode=require
DB_USERNAME=<neon-user>
DB_PASSWORD=<strong-password>
JWT_SECRET=<same as gateway>
KAFKA_BOOTSTRAP_SERVERS=<upstash-bootstrap-server>
SPRING_KAFKA_BOOTSTRAP_SERVERS=<upstash-bootstrap-server>
SPRING_KAFKA_PROPERTIES_SECURITY_PROTOCOL=SASL_SSL
SPRING_KAFKA_PROPERTIES_SASL_MECHANISM=SCRAM-SHA-256
SPRING_KAFKA_PROPERTIES_SASL_JAAS_CONFIG=org.apache.kafka.common.security.scram.ScramLoginModule required username="<upstash-username>" password="<upstash-password>";
```

### 7.10 Optimization service

```text
SERVER_PORT=8089
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://<host>:5432/<dbname>?sslmode=require
DB_USERNAME=<neon-user>
DB_PASSWORD=<strong-password>
JWT_SECRET=<same as gateway>
```

### 7.11 Analytics service

```text
SERVER_PORT=8092
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://<host>:5432/<dbname>?sslmode=require
DB_USERNAME=<neon-user>
DB_PASSWORD=<strong-password>
JWT_SECRET=<same as gateway>
```

## 8. Deploy the frontend to Cloudflare Pages

1. Open Cloudflare Pages.
2. Create a project from your GitHub repo.
3. Set framework preset to `Vite` or use a custom build.
4. Set project root to the repository root or use the repo integration correctly for a monorepo.
5. Build settings:

```bash
cd frontend
npm install
npm run build
```

6. Output directory:

```text
frontend/dist
```

7. Add environment variable:

```text
VITE_API_BASE_URL=https://atm-gateway.onrender.com/api
```

This is the key value used by `frontend/src/services/api.ts`.

Check the current frontend API setup:

```ts
baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api"
```

This already supports production deployment if the env is set correctly during build.

## 9. Use the right production URL behavior

This project must avoid direct local backend references. The browser should call only:

```text
https://atm-gateway.onrender.com/api/...
```

The frontend should never call:

- `http://localhost:8080`
- `http://localhost:8081`
- `http://localhost:9092`
- Docker private names such as `kafka`, `postgres`, `ml-service`

These values are valid only in local Docker development.

## 10. Final production environment template

Create a production template file like this as a local note or Render environment variable list:

```text
# Shared values
JWT_SECRET=your-long-random-secret
SPRING_PROFILES_ACTIVE=prod
CORS_ALLOWED_ORIGINS=https://your-app.pages.dev

# Neon Postgres
DB_URL=jdbc:postgresql://<host>:5432/<dbname>?sslmode=require
DB_USERNAME=<neon-user>
DB_PASSWORD=<strong-password>

# Upstash Kafka
KAFKA_BOOTSTRAP_SERVERS=<upstash-bootstrap-server>
SPRING_KAFKA_BOOTSTRAP_SERVERS=<upstash-bootstrap-server>
SPRING_KAFKA_PROPERTIES_SECURITY_PROTOCOL=SASL_SSL
SPRING_KAFKA_PROPERTIES_SASL_MECHANISM=SCRAM-SHA-256
SPRING_KAFKA_PROPERTIES_SASL_JAAS_CONFIG=org.apache.kafka.common.security.scram.ScramLoginModule required username="<upstash-username>" password="<upstash-password>";

# ML service
ML_SERVICE_URL=https://atm-ml.onrender.com

# Gateway public URLs
PUBLIC_BASE_URL=https://atm-gateway.onrender.com
AUTH_SERVICE_URL=https://atm-auth.onrender.com
USER_SERVICE_URL=https://atm-user.onrender.com
BANK_SERVICE_URL=https://atm-bank.onrender.com
ATM_SERVICE_URL=https://atm-atm.onrender.com
TRANSACTION_SERVICE_URL=https://atm-transaction.onrender.com
CASH_INVENTORY_SERVICE_URL=https://atm-cash.onrender.com
PREDICTION_SERVICE_URL=https://atm-prediction.onrender.com
ALERT_SERVICE_URL=https://atm-alert.onrender.com
OPTIMIZATION_SERVICE_URL=https://atm-optimization.onrender.com
ANALYTICS_SERVICE_URL=https://atm-analytics.onrender.com
```

## 11. Deployment run order

Use this order in practice:

1. Create Neon database
2. Create Upstash Kafka cluster
3. Deploy ML service on Render
4. Deploy PostgreSQL-backed Java services on Render
5. Deploy gateway last
6. Deploy frontend on Cloudflare Pages
7. Run health and business validation

## 12. Health checks and validation commands

After deployment, validate these endpoints:

### Gateway health

```bash
curl https://atm-gateway.onrender.com/api/v1/status
```

### ML health

```bash
curl https://atm-ml.onrender.com/health
```

### Auth login

```bash
curl -X POST https://atm-gateway.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourdomain.com","password":"StrongPassword123!"}'
```

### Dashboard check

```bash
curl -H "Authorization: Bearer <token>" https://atm-gateway.onrender.com/api/dashboard/summary
```

### Bank and ATM checks

```bash
curl -H "Authorization: Bearer <token>" "https://atm-gateway.onrender.com/api/banks?page=0&size=20"
curl -H "Authorization: Bearer <token>" "https://atm-gateway.onrender.com/api/atms?page=0&size=100"
```

### Prediction and recommendation flow

```bash
curl -X POST https://atm-gateway.onrender.com/api/predictions/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"atmId":1,"predictionDate":"2026-10-03"}'
```

```bash
curl -X POST https://atm-gateway.onrender.com/api/optimization/atms/1/recommend \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"predictionId":<prediction_id>}'
```

### Refill creation, approval, completion

```bash
curl -X POST https://atm-gateway.onrender.com/api/refills \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"atmId":1,"refillAmount":50,"notes":"cloud deploy validation","recommendationId":<recommendation_id>}'
```

```bash
curl -X POST https://atm-gateway.onrender.com/api/refills/<refill_id>/approve \
  -H "Authorization: Bearer <token>"
```

```bash
curl -X POST https://atm-gateway.onrender.com/api/refills/<refill_id>/complete \
  -H "Authorization: Bearer <token>"
```

## 13. Frontend build commands

From the project root:

```bash
cd frontend
npm install
VITE_API_BASE_URL=https://atm-gateway.onrender.com/api npm run build
```

Or in PowerShell:

```powershell
cd frontend
npm install
$env:VITE_API_BASE_URL = "https://atm-gateway.onrender.com/api"
npm run build
```

This confirms the production bundle compiles correctly and that no localhost backend URL is baked into the static build.

## 14. Important things to check before you consider the deployment ready

- No hardcoded `localhost` URLs remain in production config
- No `kafka:9092`, `postgres`, or `ml-service` names are used in cloud YAML or env config
- No secrets are committed to Git
- Frontend points to the public API Gateway URL
- All Java services are reachable through their public endpoints or via the gateway
- Kafka bootstrap config uses Upstash credentials with SASL/SSL
- ML service is reachable and health-checking correctly
- JWT secret is the same across the auth and gateway services
- Gateway origin allows the Cloudflare Pages domain

## 15. Common mistakes

- Using Docker service names in cloud deployment
- Using `localhost:9092` for Kafka inside a rendered container
- Forgetting to set `VITE_API_BASE_URL` in Cloudflare Pages
- Forgetting to set `CORS_ALLOWED_ORIGINS`
- Starting Render services without setting `SPRING_PROFILES_ACTIVE=prod`
- Using the same missing secret on multiple services
- Deploying the frontend into Cloudflare without building the production bundle first
- Exposing backend service URLs directly to the browser
- Giving Kafka a plaintext listener in production instead of a secure cloud broker

## 16. Best practical deployment recommendation for this repo

If you want the easiest real-world stack for this repository, use:

- Cloudflare Pages for the frontend
- Render for the Java service set
- Neon for PostgreSQL
- Upstash Kafka for messaging
- Render for the Python ML service

This is the best combination for a free/low-cost system that matches the architecture of this project.

## 17. Production checklist before launch

Before calling the system ready, verify all of these:

- [ ] Each app is deployed as a separate Render service
- [ ] Database is live on Neon
- [ ] Kafka is live on Upstash
- [ ] ML service is live on Render
- [ ] Gateway is live and reachable
- [ ] Frontend is live on Cloudflare Pages
- [ ] Frontend `VITE_API_BASE_URL` points to the gateway
- [ ] JWT auth works
- [ ] Bank and ATM data can be created
- [ ] Prediction calls work
- [ ] Optimization recommendations can be created and approved
- [ ] Refill requests can be created, approved, and completed
- [ ] Kafka topics and event flow are working
- [ ] No `localhost` or Docker-only values remain in production config
- [ ] CORS allows the correct browser origin
- [ ] No secrets are committed to source control

This is the complete cloud deployment guide for the ATM project using free/low-cost hosting services.
