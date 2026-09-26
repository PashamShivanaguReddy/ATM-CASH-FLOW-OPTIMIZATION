

Define a reusable skill called "ATM Database Migration".

Technology:
- PostgreSQL
- Spring Boot
- JPA
- existing database migration mechanism if present

Procedure:

1. Inspect existing entities.
2. Inspect existing repositories.
3. Inspect existing migrations/schema.
4. Identify current database structure.
5. Determine whether the requested change actually requires a migration.
6. Avoid duplicate tables/columns.
7. Create migration using the project's existing migration technology.
8. Maintain backward compatibility where possible.
9. Validate migration against PostgreSQL.
10. Build the affected service.
11. Start the service.
12. Verify database state.

Rules:
- Never delete production data.
- Never drop tables without explicit approval.
- Never reset the database just to fix a migration problem.
- Never create duplicate migrations.
- Never invent schema that conflicts with existing entities.
- Keep database ownership aligned with microservice boundaries.

For migration failures, diagnose the existing schema before changing the migration.