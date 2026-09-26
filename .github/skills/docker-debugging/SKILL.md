

Define a reusable skill called "ATM Docker Debugging".

Create a systematic Docker debugging procedure.

Include commands for:

- docker compose ps
- docker compose logs
- service-specific logs
- rebuilding a single service
- rebuilding all services
- restarting a service
- checking networks
- checking environment variables
- checking container health
- checking exposed ports

Use this general workflow:

STATUS
→ LOGS
→ CONFIG
→ NETWORK
→ DEPENDENCIES
→ ROOT CAUSE
→ MINIMAL FIX
→ REBUILD
→ VERIFY

Include common ATM project problems:
- datasource URL missing
- PostgreSQL connection failure
- Kafka connection failure
- Config Server unavailable
- Eureka unavailable
- API Gateway routing failure
- browser cannot resolve Docker hostname
- Swagger Failed to Fetch
- container unhealthy
- health check timeout
- missing Spring bean

Never recommend destructive commands such as deleting volumes unless explicitly approved.