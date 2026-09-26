# ATM Cash Flow Optimization System

## Complete Frontend, Backend, and ML/AI Microservices Architecture

---

## 1. High-Level Architecture

```text
                         +--------------------------+
                         |          USERS           |
                         |                          |
                         | Bank Admin               |
                         | Bank Manager             |
                         | ATM Operator             |
                         | End User                 |
                         +------------+-------------+
                                      |
                                      | HTTPS
                                      v
                         +--------------------------+
                         |       FRONTEND            |
                         |   React + TypeScript      |
                         |                          |
                         | Login                    |
                         | Dashboard                |
                         | ATM Management           |
                         | Transactions             |
                         | Predictions              |
                         | Recommendations          |
                         | Alerts                   |
                         | Reports                  |
                         +------------+-------------+
                                      |
                                      v
                         +--------------------------+
                         |       API GATEWAY         |
                         |   Spring Cloud Gateway    |
                         |                          |
                         | Routing                  |
                         | Authentication           |
                         | Authorization             |
                         | Rate Limiting            |
                         | Request Validation       |
                         +------------+-------------+
                                      |
          +---------------------------+----------------------------+
          |                           |                            |
          v                           v                            v
 +-----------------+        +-----------------+          +-----------------+
 |  AUTH SERVICE   |        |   USER SERVICE  |          |   ATM SERVICE   |
 |                 |        |                 |          |                 |
 | Login           |        | Users           |          | ATM CRUD        |
 | JWT             |        | Roles           |          | ATM status      |
 | Security        |        | Permissions     |          | Cash details    |
 +--------+--------+        +-----------------+          +--------+--------+
          |                                                       |
          |                         +-----------------------------+
          |                         |
          |                         v
          |                +---------------------+
          |                | TRANSACTION SERVICE |
          |                |                     |
          |                | Withdrawals         |
          |                | Deposits            |
          |                | Transactions        |
          |                | Transaction history |
          |                +----------+----------+
          |                           |
          |                           v
          |                     +------------+
          |                     |   KAFKA    |
          |                     |   EVENT    |
          |                     |   BUS      |
          |                     +-----+------+
          |                           |
          |              +------------+-------------+------------+
          |              |                          |            |
          |              v                          v            v
          |       +------------+              +----------+ +-------------+
          |       | CASH       |              | FEATURE  | | AUDIT       |
          |       | MANAGEMENT |              | SERVICE  | | SERVICE     |
          |       | SERVICE    |              |          | |             |
          |       +-----+------+              +----+-----+ +-------------+
          |             |                          |
          |             |                          v
          |             |                   +--------------+
          |             |                   |  ML SERVICE  |
          |             |                   |              |
          |             |                   | Python       |
          |             |                   | FastAPI      |
          |             |                   | Scikit-learn|
          |             |                   +------+-------+
          |             |                          |
          |             |                          v
          |             |                   +--------------+
          |             |                   |  ML MODEL    |
          |             |                   |              |
          |             |                   | model.pkl    |
          |             |                   | model version|
          |             |                   +--------------+
          |             |
          |             v
          |     +----------------+
          |     | RECOMMENDATION |
          |     | ENGINE         |
          |     |                |
          |     | Refill amount  |
          |     | Risk level     |
          |     | Priority       |
          |     +--------+-------+
          |              |
          |              v
          |     +-----------------+
          |     | NOTIFICATION    |
          |     | SERVICE         |
          |     |                 |
          |     | Email           |
          |     | SMS             |
          |     | Dashboard Alert|
          |     +-----------------+
```

---

## 2. Technology Stack

### Frontend

- React.js
- TypeScript
- Vite
- React Router
- Axios
- Material UI or Tailwind CSS
- Recharts
- React Query or Redux Toolkit

### Backend

- Java
- Spring Boot
- Spring Security
- JWT
- Spring Data JPA
- Hibernate
- Spring Cloud Gateway
- Spring Validation
- OpenAPI / Swagger

### ML / AI

- Python
- FastAPI
- Pandas
- NumPy
- Scikit-learn
- Joblib
- Pydantic

### Infrastructure and Operations

| Area | Technology |
| --- | --- |
| Database | PostgreSQL |
| Cache | Redis |
| Message broker | Apache Kafka |
| Containerization | Docker, Docker Compose |
| Reverse proxy | Nginx |
| Monitoring | Prometheus, Grafana |
| Logging | ELK / OpenSearch |
| Testing | JUnit, Mockito, Pytest, Postman |
| CI/CD | GitHub Actions |
| Deployment | Docker initially, Kubernetes later |

---

## 3. Frontend Architecture

```text
frontend/
|
+- src/
|  |
|  +- components/
|  |  +- Navbar/
|  |  +- Sidebar/
|  |  +- DashboardCard/
|  |  +- ATMCard/
|  |  +- PredictionCard/
|  |  +- AlertCard/
|  |  +- DataTable/
|  |  +- Charts/
|  |  +- Loading/
|  |
|  +- pages/
|  |  +- Login/
|  |  +- Dashboard/
|  |  +- ATMs/
|  |  +- ATMDetails/
|  |  +- Transactions/
|  |  +- Predictions/
|  |  +- Recommendations/
|  |  +- Alerts/
|  |  +- Reports/
|  |  +- Users/
|  |
|  +- services/
|  |  +- authApi.ts
|  |  +- userApi.ts
|  |  +- atmApi.ts
|  |  +- transactionApi.ts
|  |  +- predictionApi.ts
|  |  +- reportApi.ts
|  |  +- notificationApi.ts
|  |
|  +- store/
|  |  +- authStore.ts
|  |  +- atmStore.ts
|  |  +- dashboardStore.ts
|  |
|  +- hooks/
|  +- utils/
|  +- types/
|  +- routes/
|  +- App.tsx
|  +- main.tsx
|
+- package.json
+- Dockerfile
```

---

## 4. Frontend Pages

### Login Page

- Email
- Password
- Login button

After successful login, the frontend receives:

- JWT token
- User role
- User information

### Bank Manager Dashboard

Metrics:

- Total ATMs
- Active ATMs
- Warning ATMs
- Critical ATMs
- Total cash
- Today's withdrawals
- Predicted demand
- Pending refills

Charts:

- Cash demand
- ATM performance
- Daily withdrawals
- Weekly forecast
- Monthly trends

Table columns:

- ATM ID
- Location
- Current cash
- Predicted demand
- Risk
- Recommended refill
- Status

### ATM Management

- View ATMs
- Add ATM
- Edit ATM
- Delete ATM
- Search ATM
- Filter ATM
- View ATM details

### ATM Details

- ATM ID
- Location
- Latitude
- Longitude
- Maximum capacity
- Current cash
- Status
- Last refill
- Last transaction
- Historical transactions
- Cash usage chart
- ML prediction
- Risk level
- Recommended refill

### Transactions

Fields:

- Transaction ID
- ATM ID
- Transaction type
- Amount
- Timestamp
- User / customer reference

Filters:

- ATM
- Date
- Transaction type
- Amount

### Predictions

- ATM ID
- Current cash
- Predicted demand
- Prediction date
- Shortage probability
- Risk level
- Recommended refill

### Recommendations

Example:

```text
ATM003

Predicted shortage:
Tomorrow

Current cash:
INR 50,000

Predicted demand:
INR 1,80,000

Recommended refill:
INR 1,50,000

Priority:
HIGH
```

### Alerts

- High cash demand
- Low cash
- Critical cash
- ATM offline
- Predicted shortage

### Reports

- Daily report
- Weekly report
- Monthly report
- ATM performance report
- Cash optimization report
- Prediction accuracy report

---

## 5. User Roles

### BANK_ADMIN

Can:

- Create, delete, and update users
- Create, delete, and update ATMs
- View all transactions
- View predictions
- View reports
- Configure the system

### BANK_MANAGER

Can:

- View ATMs
- Add and update ATMs
- View transactions
- View predictions
- View recommendations
- View reports
- View alerts

### ATM_OPERATOR

Can:

- View assigned ATMs
- View ATM status
- Update cash refill
- View alerts
- View transactions

### END_USER

Can:

- Find an ATM
- View ATM availability
- View approximate cash status

---

## 6. API Gateway

All frontend requests go through:

```text
http://localhost:8080/api
```

Routes:

| Route | Destination |
| --- | --- |
| `/api/auth/**` | Auth Service |
| `/api/users/**` | User Service |
| `/api/atms/**` | ATM Service |
| `/api/transactions/**` | Transaction Service |
| `/api/cash/**` | Cash Management Service |
| `/api/predictions/**` | ML Service |
| `/api/reports/**` | Report Service |
| `/api/alerts/**` | Notification Service |

The frontend should not directly access every backend service:

```text
Frontend -> API Gateway -> Microservices
```

Gateway responsibilities:

- Routing
- Authentication
- Authorization
- Rate limiting
- Request validation

---

## 7. Auth Service

**Technology:** Java, Spring Boot, Spring Security, JWT, PostgreSQL

Responsibilities:

- User login
- Password hashing
- JWT generation
- JWT validation
- Role management
- Authentication
- Authorization

Endpoints:

```text
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me
```

Login flow:

```text
Frontend
  -> POST /api/auth/login
  -> API Gateway
  -> Auth Service
  -> PostgreSQL
  -> Validate username/password
  -> Generate JWT
  -> Return JWT
  -> Frontend
```

JWT claims:

- `userId`
- `username`
- `role`
- `issuedAt`
- `expiration`

---

## 8. User Service

Responsibilities:

- User profiles
- Roles
- Permissions
- Bank branches
- ATM assignments

Endpoints:

```text
GET    /users
GET    /users/{id}
POST   /users
PUT    /users/{id}
DELETE /users/{id}
GET    /users/{id}/atms
```

---

## 9. ATM Service

Responsibilities:

- ATM registration
- ATM updates
- ATM deletion
- ATM status
- ATM configuration
- ATM location

ATM fields:

- `id`
- `atmCode`
- `bankId`
- `branchId`
- `location`
- `latitude`
- `longitude`
- `atmType`
- `maximumCashCapacity`
- `currentCash`
- `status`
- `lastRefill`
- `lastTransaction`
- `createdAt`
- `updatedAt`

Endpoints:

```text
POST /atms
GET  /atms
GET  /atms/{id}
PUT  /atms/{id}
DELETE /atms/{id}
GET  /atms/{id}/status
GET  /atms/{id}/cash
GET  /atms/{id}/transactions
GET  /atms/{id}/predictions
```

---

## 10. Transaction Service

Responsibilities:

- Record transactions
- Store transaction history
- Calculate transaction statistics
- Publish transaction events

Transaction fields:

- `transactionId`
- `atmId`
- `transactionType`
- `amount`
- `timestamp`
- `status`

Transaction types:

- `WITHDRAWAL`
- `DEPOSIT`
- `REFILL`
- `CASH_ADJUSTMENT`

Example:

```json
{
  "atmId": "ATM001",
  "transactionType": "WITHDRAWAL",
  "amount": 10000,
  "timestamp": "2026-08-26T15:30:00"
}
```

Endpoints:

```text
POST /transactions
GET  /transactions
GET  /transactions/{id}
GET  /transactions/atm/{atmId}
GET  /transactions/date-range
```

---

## 11. Cash Management Service

Responsibilities:

- Track current ATM cash
- Track refills
- Calculate cash balance
- Determine ATM status
- Calculate shortage

Example calculation:

```text
Opening Cash:  INR 5,00,000
Withdrawals:   -INR 1,50,000
Deposits:      +INR 20,000
Refill:        +INR 2,00,000
Current Cash:  INR 5,70,000
```

Status rules:

| Cash level | Status |
| --- | --- |
| Greater than 40% of capacity | `NORMAL` |
| Between 20% and 40% | `WARNING` |
| Between 10% and 20% | `CRITICAL` |
| Less than 10% | `EMPTY` |

---

## 12. Feature Service

This service prepares data for the ML model.

Inputs:

- Historical transactions
- ATM information
- Current cash
- Time
- Date
- Day of week
- Holiday
- Previous demand

Feature engineering:

- Daily withdrawal total
- Hourly withdrawal
- Weekly average
- Monthly average
- Rolling average
- Previous day demand
- Previous week demand
- Peak-hour demand
- Holiday indicator
- Day-of-week indicator
- Current cash

Example input:

```text
ATM001

Current cash:
INR 2,50,000
Previous day withdrawal:
INR 1,20,000
7-day average:
INR 1,10,000
30-day average:
INR 1,15,000
Day:
Wednesday
Hour:
14
Holiday:
No
```

Output: an ML-ready feature vector.

---

## 13. ML Service

**Technology:** Python, FastAPI, Pandas, NumPy, Scikit-learn, Joblib, Pydantic

```text
ml-service/
|
+- app/
|  +- main.py
|  +- routes/
|  |  +- prediction.py
|  +- services/
|  |  +- prediction_service.py
|  +- models/
|  |  +- model.pkl
|  +- schemas/
|  |  +- prediction_schema.py
|  +- utils/
|
+- requirements.txt
+- Dockerfile
```

The service provides model loading, inference, prediction schemas, and the prediction API.

---

## 14. ML Training Architecture

```text
Historical CSV / Database
          -> Data Cleaning
          -> Data Validation
          -> Feature Engineering
          -> Train/Test Split
          -> Model Training
          -> Model Evaluation
          -> Best Model
          -> model.pkl
          -> ML Model Store
```

The completed ML training belongs in this part of the architecture.

---

## 15. ML Prediction Architecture

```text
Live Transaction / Dashboard Request
                -> Feature Service
                -> ML Prediction API
                -> Load model.pkl
                -> Model Inference
                -> Predicted Cash Demand
                -> Risk Calculation
                -> Recommendation Engine
                -> Result
```

Endpoint:

```text
POST /predict
```

Input:

```json
{
  "atm_id": "ATM001",
  "day_of_week": 3,
  "hour": 14,
  "previous_day_withdrawal": 120000,
  "average_withdrawal": 110000,
  "current_cash": 250000,
  "holiday": 0
}
```

Output:

```json
{
  "atm_id": "ATM001",
  "predicted_cash_demand": 145000,
  "current_cash": 250000,
  "remaining_cash": 105000,
  "shortage_probability": 0.82,
  "risk_level": "HIGH",
  "recommended_refill": 150000
}
```

---

## 16. ML Model Logic

The ML model predicts future cash demand. Business logic then calculates:

```text
Predicted Demand - Current Cash = Potential Shortage
Potential Shortage + Safety Buffer = Recommended Refill
```

Example:

```text
Predicted Demand: INR 1,80,000
Current Cash:     INR 1,00,000
Shortage:         INR 80,000
Safety Buffer:    INR 40,000
Recommended Refill: INR 1,20,000
```

---

## 17. New ATM ML Logic

A new ATM does not have historical data. It uses a cold-start strategy:

```text
NEW ATM
  -> Start transaction collection
  -> Collect historical data
  -> Feature generation
  -> Prediction
```

During the initial period, use:

- Bank-wide historical patterns
- Nearby ATM patterns
- Day/time patterns
- Default baseline

After enough data is collected, use ATM-specific historical patterns.

---

## 18. Recommendation Engine

The ML model predicts demand; the recommendation engine decides the operational action.

Example:

```text
Predicted Demand = INR 1,80,000
Current Cash = INR 1,00,000
Shortage = INR 80,000
Safety Buffer = INR 40,000
Recommended Refill = INR 1,20,000
```

Output:

```text
ATM001
Risk: HIGH
Priority: HIGH
Recommended Refill: INR 1,20,000
Expected Shortage: Tomorrow
```

Possible priorities:

- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

---

## 19. Kafka Event Architecture

```text
Transaction Service
        -> Kafka
        -> ATM_TRANSACTION_CREATED
        -> Cash Service
        -> Feature Service
        -> Audit Service
        -> ML Service
        -> Prediction
        -> Recommendation
        -> Notification
```

Kafka topics:

- `atm.transaction.created`
- `atm.transaction.updated`
- `atm.cash.updated`
- `atm.prediction.created`
- `atm.alert.created`
- `atm.refill.created`
- `audit.event.created`

Kafka consumers should be idempotent, and event payloads should include stable IDs for tracing and replay.

---

## 20. Notification Service

Responsibilities:

- Email
- SMS
- Dashboard notifications
- Critical alerts

Flow:

```text
Prediction
  -> Risk = HIGH
  -> Notification Service
  -> Email/SMS/Dashboard
```

Example notification:

```text
ATM003 CASH ALERT

Expected shortage:
Within 2 days

Current cash:
INR 50,000

Predicted demand:
INR 1,80,000

Recommended refill:
INR 1,50,000

Priority:
HIGH
```

---

## 21. Report Service

Reports:

- Daily reports
- Weekly reports
- Monthly reports
- ATM performance
- Cash utilization
- Prediction accuracy
- Refill history
- Optimization reports

Example:

```text
ATM CASH OPTIMIZATION REPORT

Total ATMs: 245
Critical ATMs: 5
Predicted shortages: 18
Cash utilization: 78%
Emergency refills avoided: 32
Estimated savings: INR 2.4L
```

---

## 22. Audit Service

Every important action should be recorded.

Record:

- User
- Action
- Timestamp
- ATM
- Old value
- New value
- IP/device information

Example:

```text
Manager updated ATM001

Old capacity: INR 5,00,000
New capacity: INR 6,00,000
Timestamp: 2026-08-26 18:30
```

---

## 23. Database Architecture

Use PostgreSQL with logical database ownership per service:

| Service | Database |
| --- | --- |
| Auth Service | `auth_db` |
| User Service | `user_db` |
| ATM Service | `atm_db` |
| Transaction Service | `transaction_db` |
| Prediction Service | `prediction_db` |
| Report Service | `report_db` |
| Audit Service | `audit_db` |

Each microservice owns its data. Services must not directly modify another service's database.

---

## 24. Redis

Use Redis for:

- ATM current status
- Frequently requested predictions
- Dashboard caching
- Session/cache data
- Rate limiting

Example keys:

```text
ATM001 -> CURRENT_CASH = 250000
ATM002 -> CURRENT_CASH = 80000
ATM003 -> CURRENT_CASH = 20000
```

---

## 25. API Flows

### Login

```text
Frontend -> API Gateway -> Auth Service -> PostgreSQL -> JWT -> Frontend
```

### Add ATM

```text
Frontend -> API Gateway -> ATM Service -> ATM Database -> Response -> Frontend
```

### Transaction

```text
Frontend/ATM
  -> API Gateway
  -> Transaction Service
  -> Transaction DB
  -> Kafka
  -> Cash Service
  -> Feature Service
  -> ML Service
  -> Prediction
  -> Recommendation
  -> Notification
```

### Dashboard

```text
Frontend
  -> API Gateway
  -> ATM Service
  -> Cash Service
  -> Prediction Service
  -> Redis/PostgreSQL
  -> Dashboard
```

---

## 26. Complete Project Structure

```text
atm-cash-optimization/
|
+- frontend/
|  +- atm-dashboard/
|     +- src/
|     |  +- components/
|     |  +- pages/
|     |  +- services/
|     |  +- store/
|     |  +- hooks/
|     |  +- types/
|     |  +- utils/
|     |  +- routes/
|     |  +- App.tsx
|     |  +- main.tsx
|     +- package.json
|     +- Dockerfile
|
+- backend/
|  +- api-gateway/
|  +- auth-service/
|  +- user-service/
|  +- atm-service/
|  +- transaction-service/
|  +- cash-management-service/
|  +- notification-service/
|  +- report-service/
|  +- audit-service/
|
+- ml/
|  +- training/
|  |  +- dataset/
|  |  +- preprocessing/
|  |  +- training.py
|  |  +- evaluation.py
|  |  +- model.pkl
|  +- ml-service/
|     +- app/
|     |  +- main.py
|     |  +- routes/
|     |  +- services/
|     |  +- schemas/
|     |  +- models/
|     |  +- utils/
|     +- requirements.txt
|     +- Dockerfile
|
+- infrastructure/
|  +- postgres/
|  +- redis/
|  +- kafka/
|  +- nginx/
|  +- prometheus/
|  +- grafana/
|
+- docs/
|  +- architecture/
|  +- api/
|  +- database/
|  +- ml/
|
+- docker-compose.yml
+- .env
+- README.md
+- .gitignore
```

---

## 27. Backend Microservice Package Structure

Example: ATM Service

```text
atm-service/
|
+- src/main/java/com/atm/
   +- controller/
   |  +- ATMController.java
   +- service/
   |  +- ATMService.java
   +- repository/
   |  +- ATMRepository.java
   +- entity/
   |  +- ATM.java
   +- dto/
   |  +- ATMRequest.java
   |  +- ATMResponse.java
   +- exception/
   +- config/
   +- ATMServiceApplication.java
```

Every Spring Boot service follows a similar structure.

---

## 28. Security

Request path:

```text
Frontend
  -> HTTPS
  -> API Gateway
  -> JWT Validation
  -> Role Authorization
  -> Microservice
```

Authorization examples:

```text
/admin/**     -> BANK_ADMIN only
/manager/**   -> BANK_ADMIN + BANK_MANAGER
/operator/**  -> BANK_ADMIN + BANK_MANAGER + ATM_OPERATOR
```

Security requirements:

- Never store plaintext passwords.
- Use BCrypt for password hashing.
- Store sensitive configuration in environment variables.

Environment variables:

```text
DB_USERNAME
DB_PASSWORD
JWT_SECRET
KAFKA_URL
REDIS_URL
```

---

## 29. Monitoring

Prometheus collects:

- CPU
- Memory
- Request count
- Response time
- Error count
- Service health
- Kafka metrics
- Database metrics

Grafana dashboards display:

- API requests
- Service errors
- ML prediction requests
- ML latency
- Kafka messages
- ATM alerts
- Database usage

---

## 30. Logging

Every service generates structured logs.

Example:

```text
2026-08-26 18:30:12
INFO
ATM-Service
ATM001
Cash updated successfully
```

Error example:

```text
ERROR
ML-Service
Prediction failed
ATM001
```

Use centralized logging with ELK or OpenSearch.

---

## 31. Docker Architecture

Each service gets its own Docker container.

Containers:

- Frontend
- API Gateway
- Auth Service
- User Service
- ATM Service
- Transaction Service
- Cash Service
- Notification Service
- Report Service
- Audit Service
- ML Service
- PostgreSQL
- Redis
- Kafka
- Zookeeper or KRaft
- Nginx
- Prometheus
- Grafana

---

## 32. Docker Compose

Local development flow:

```text
Frontend
  -> API Gateway
  -> Backend Services
  -> PostgreSQL
  -> Redis
  -> Kafka
  -> ML Service
```

Docker Compose starts the complete local environment.

---

## 33. Production Deployment

```text
Internet
  -> Cloudflare
  -> Nginx
  -> Load Balancer
  -> API Gateway
  -> Kubernetes
  -> Microservices
```

Kubernetes services:

- Auth Service
- User Service
- ATM Service
- Transaction Service
- Cash Service
- ML Service
- Notification Service
- Report Service
- Audit Service

Infrastructure:

- PostgreSQL
- Redis
- Kafka

Monitoring:

- Prometheus
- Grafana

---

## 34. Complete Business Flow

### Step 1: Manager Login

The bank manager logs in through the frontend. The Auth Service validates the credentials and returns a JWT.

### Step 2: Add ATM

```text
ATM ID: ATM001
Location: Hyderabad
Capacity: INR 5,00,000
Current Cash: INR 3,00,000
```

Flow:

```text
Frontend -> API Gateway -> ATM Service -> ATM Database
```

### Step 3: Transaction

```text
ATM001 -> Withdrawal -> INR 10,000
```

The Transaction Service stores the transaction and publishes an event to Kafka.

### Step 4: Cash Update

```text
Previous: INR 3,00,000
Withdrawal: INR 10,000
Current: INR 2,90,000
```

### Step 5: Feature Generation

```text
Current cash: INR 2,90,000
Previous day demand: INR 1,20,000
7-day average: INR 1,10,000
Day: Wednesday
Hour: 14
```

### Step 6: ML Prediction

```text
Expected demand: INR 1,45,000
```

### Step 7: Recommendation

```text
Current: INR 2,90,000
Expected demand: INR 1,45,000
Safety buffer: INR 40,000
Risk: LOW
Action: No refill required
```

### Step 8: Critical ATM

```text
ATM003
Current: INR 50,000
Predicted demand: INR 1,80,000
Shortage: INR 1,30,000
Safety buffer: INR 40,000
Recommended refill: INR 1,70,000
Risk: CRITICAL
```

### Step 9: Notification

The Notification Service sends an alert that ATM003 requires immediate cash refill.

### Step 10: Manager View

```text
CRITICAL ATM
ATM003

Current Cash: INR 50,000
Predicted Demand: INR 1,80,000
Recommended Refill: INR 1,70,000
Priority: CRITICAL
```

---

## 35. Training Versus Production

### Training

```text
Historical CSV
  -> Data Cleaning
  -> Feature Engineering
  -> Train Model
  -> Evaluate
  -> Save model.pkl
```

### Production

```text
Live Data
  -> Feature Service
  -> ML API
  -> Load model.pkl
  -> Prediction
  -> Recommendation
  -> Frontend
```

The model must not be retrained every time a prediction is requested.

---

## 36. Future Model Retraining

Production data continuously accumulates:

```text
Day 1:   100 transactions
Day 30:  10,000 transactions
Day 90:  50,000 transactions
```

Periodic retraining flow:

```text
Historical DB
  -> Training Pipeline
  -> New Model
  -> Evaluation
  -> Compare with old model
  -> Deploy if better
```

Model versions:

```text
Model V1 -> Model V2 -> Model V3 -> ...
```

---

## 37. Final Architecture

```text
                         USERS
                           |
                           v
                    REACT FRONTEND
                           |
                           v
                         NGINX
                           |
                           v
                    API GATEWAY
                           |
       +-------------------+--------------------+
       |                   |                    |
       v                   v                    v
 AUTH SERVICE         USER SERVICE         ATM SERVICE
                                                |
                                                v
                                       TRANSACTION SERVICE
                                                |
                                                v
                                              KAFKA
                                                |
       +----------------------------------------+---------------------+
       |                                        |                     |
       v                                        v                     v
 CASH MANAGEMENT                         FEATURE SERVICE         AUDIT SERVICE
                                                |
                                                v
                                          ML SERVICE
                                                |
                                                v
                                          MODEL.PKL
                                                |
                                                v
                                      RECOMMENDATION ENGINE
                                                |
                                                v
                                        NOTIFICATION SERVICE
                                                |
                                                v
                                         REPORT SERVICE
```

### Data Layer

- Auth DB
- User DB
- ATM DB
- Transaction DB
- Prediction DB
- Report DB
- Audit DB
- PostgreSQL
- Redis
- Kafka

### Monitoring and Logging

```text
Prometheus -> Grafana
Logging -> ELK / OpenSearch
```

---

## 38. Recommended Implementation Order

### Phase 1: Backend Foundation

- [ ] Create Spring Boot project
- [ ] Create PostgreSQL database
- [ ] Build Auth Service
- [ ] Build JWT authentication
- [ ] Build User Service
- [ ] Build ATM Service
- [ ] Build API Gateway
- [ ] Test APIs with Postman

### Phase 2: Frontend

- [ ] Create React project
- [ ] Create login page
- [ ] Connect login API
- [ ] Implement protected routes
- [ ] Implement role-based UI
- [ ] Create dashboard
- [ ] Create ATM management
- [ ] Create ATM details
- [ ] Create transaction page
- [ ] Create charts

### Phase 3: Transactions

- [ ] Build Transaction Service
- [ ] Store transaction history
- [ ] Build Cash Management Service
- [ ] Calculate current cash
- [ ] Add transaction validation

### Phase 4: ML Integration

- [ ] Create FastAPI ML Service
- [ ] Move trained model into ML Service
- [ ] Create `/predict` endpoint
- [ ] Create prediction schema
- [ ] Test ML API
- [ ] Connect Java backend to ML API
- [ ] Display predictions in React

### Phase 5: AI Recommendations

- [ ] Calculate shortage
- [ ] Calculate safety buffer
- [ ] Calculate recommended refill
- [ ] Calculate risk
- [ ] Calculate priority
- [ ] Display recommendations

### Phase 6: Event-Driven Architecture

- [ ] Install Kafka
- [ ] Create transaction topic
- [ ] Publish transaction events
- [ ] Consume transaction events
- [ ] Connect Feature Service
- [ ] Trigger prediction
- [ ] Trigger alerts

### Phase 7: Support Services

- [ ] Notification Service
- [ ] Report Service
- [ ] Audit Service
- [ ] Email alerts
- [ ] Dashboard alerts
- [ ] PDF/CSV reports

### Phase 8: Production

- [ ] Dockerize all services
- [ ] Docker Compose
- [ ] Nginx
- [ ] Redis
- [ ] Prometheus
- [ ] Grafana
- [ ] Centralized logging
- [ ] CI/CD
- [ ] Cloud deployment

---

## 39. Most Important Architecture Decision

Use:

| Responsibility | Technology |
| --- | --- |
| Business microservices | Java + Spring Boot |
| ML/AI | Python + FastAPI |
| Frontend | React + TypeScript |
| Persistent data | PostgreSQL |
| Cache | Redis |
| Asynchronous communication | Kafka |
| Deployment | Docker |
| Future production scaling | Kubernetes |
| Monitoring | Prometheus + Grafana |
| Centralized logging | ELK / OpenSearch |

Final request flow:

```text
USER
  -> REACT
  -> NGINX
  -> API GATEWAY
  -> SPRING BOOT MICROSERVICES
  -> POSTGRESQL / REDIS / KAFKA
  -> FEATURE SERVICE
  -> PYTHON ML SERVICE
  -> ML MODEL
  -> PREDICTION
  -> RECOMMENDATION
  -> NOTIFICATION
  -> REACT DASHBOARD
```

Key separation:

```text
FRONTEND
    = presentation

JAVA MICROSERVICES
    = business logic + banking operations

PYTHON ML SERVICE
    = prediction/inference

KAFKA
    = asynchronous communication

POSTGRESQL
    = persistent data

REDIS
    = cache

DOCKER
    = deployment

PROMETHEUS + GRAFANA
    = monitoring
```

This architecture keeps the ML model isolated from the Java business layer while providing an enterprise-style foundation for ATM cash-flow optimization.
