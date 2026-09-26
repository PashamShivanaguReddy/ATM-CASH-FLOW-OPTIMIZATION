# ATM Cash Flow Optimization System

## Project Context

This is an ATM Cash Flow Optimization platform.

The system analyzes ATM transaction and cash-inventory data to:

- predict ATM cash demand
- identify cash shortage risk
- identify excess cash
- recommend replenishment
- optimize cash allocation
- reduce transportation cost
- reduce ATM cash-out incidents
- provide explainable recommendations

## IMPORTANT

The existing ML and backend implementations were already developed.

DO NOT rewrite or replace them unless explicitly requested.

Before changing existing code:

1. Inspect the implementation.
2. Understand its purpose.
3. Identify dependencies.
4. Check how it integrates with other services.
5. Make the smallest safe change.

## Development Philosophy

Never blindly generate large amounts of code.

Follow:

Analyze
→ Plan
→ Implement
→ Test
→ Review

Prefer small incremental changes.

Do not modify unrelated files.

Do not create duplicate functionality.

Reuse existing classes, services, utilities and APIs when appropriate.

Before modifying anything, inspect the relevant implementation and its dependencies. Fix root causes, make the smallest safe change, and do not create duplicate configurations, classes, APIs, utilities, or database migrations.

## Backend

The backend uses Java/Spring Boot.

Follow the existing project architecture.

Prefer:

Controller
→ Service
→ Repository
→ Database

Use DTOs where appropriate.

Use validation.

Use proper exception handling.

Use appropriate HTTP status codes.

Do not put unnecessary business logic in controllers.

## Database

PostgreSQL is used by the project.

Before changing database structure:

- inspect existing entities
- inspect migrations
- inspect relationships
- inspect indexes
- inspect existing queries

Do not delete existing data.

Do not invent database structures if an existing structure can be reused.

## ML

The project already contains ML/optimization functionality.

Do not replace existing models without first evaluating the current implementation.

Check:

- input data
- preprocessing
- features
- prediction pipeline
- model integration
- evaluation
- error handling

Never fabricate model metrics.

## ATM Business Logic

When implementing ATM optimization functionality consider:

- current cash
- ATM capacity
- minimum reserve
- predicted demand
- historical demand
- replenishment lead time
- cash availability
- transportation cost
- ATM location
- shortage risk
- excess cash
- scheduled replenishment

Separate:

Forecasting
from
Optimization
from
Replenishment Recommendation.

## Security

Never:

- hardcode passwords
- hardcode API keys
- expose secrets
- commit credentials
- log sensitive information

Check:

- authentication
- authorization
- input validation
- SQL injection
- IDOR
- CORS
- JWT security
- sensitive data exposure

Never disable authentication, authorization, validation, or other security controls merely to bypass an error.

## Testing

After meaningful changes:

1. Build the affected service.
2. Run relevant tests.
3. Fix failures.
4. Check for regressions.

Never claim a feature is complete without validation.

## Docker

Respect the existing Docker architecture.

Before changing:

- ports
- services
- volumes
- networks
- environment variables

inspect the existing configuration.

Do not randomly change working Docker configuration.

Container-to-container communication must use Docker service names. Browser communication must use localhost and the API Gateway. Never delete databases or Docker volumes without explicit approval.

## Communication

For non-trivial tasks, first explain:

1. What you found
2. What needs to change
3. Which files are affected
4. Implementation approach
5. Testing approach

Then implement.

For major architectural changes, ask for confirmation before proceeding.