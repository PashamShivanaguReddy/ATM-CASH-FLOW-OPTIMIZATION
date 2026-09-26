---
applyTo: "**/backend/**/*.java"
---

# Backend Development Rules

Use the existing Spring Boot architecture.

Before modifying a backend file:

- inspect related controller
- inspect service
- inspect repository
- inspect DTO
- inspect entity
- inspect tests

Follow:

Controller
→ Service
→ Repository

Do not put business logic inside controllers.

Use:

- DTOs
- validation
- exception handling
- logging
- proper HTTP status codes

Do not rewrite existing services unnecessarily.

Run relevant tests after changes.