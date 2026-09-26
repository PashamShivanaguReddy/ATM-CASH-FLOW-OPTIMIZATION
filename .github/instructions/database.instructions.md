---
applyTo: "**/*.{sql,yml,yaml}"
---

# Database Rules

PostgreSQL is the primary database.

Before changing database structure:

- inspect existing migrations
- inspect entities
- inspect relationships
- inspect indexes
- inspect queries

Never delete data without explicit instruction.

Avoid unnecessary schema changes.

Consider query performance and indexes.
