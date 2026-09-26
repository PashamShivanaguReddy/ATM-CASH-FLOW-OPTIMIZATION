# Phase 3 Result: Authentication and Authorization

## Architecture

- `auth-service` owns registration, login, logout, access-token issuance, and refresh-token rotation.
- Existing domain `User`, `UserRole`, `UserStatus`, `AuditLog`, and repositories are reused.
- Passwords are stored only as BCrypt hashes. Public DTOs never expose `passwordHash`.
- Refresh tokens are random opaque values. Only their SHA-256 hashes are persisted in `refresh_tokens`; the raw value is returned once.
- The security filter validates Bearer JWTs and creates Spring Security authorities from the `role` claim.
- Every non-public auth-service route requires authentication by default. Method authorization is enabled with `@PreAuthorize`.
- Authentication events are written to `audit_logs` for registration, login, logout-related token revocation, and refresh.

## JWT Flow

1. `POST /api/auth/login` validates email and password through `UserDetailsService` and BCrypt.
2. A short-lived access JWT is created with `userId`, `email`, `role`, `bankId`, `iat`, and `exp` claims.
3. A random refresh token is generated and only its SHA-256 hash is persisted.
4. Clients send the access token as `Authorization: Bearer <token>`.
5. `JwtAuthenticationFilter` validates signature and expiration before setting the security context.
6. `POST /api/auth/refresh` validates active, unexpired, non-revoked refresh state, revokes the old token, and rotates a new refresh token.
7. JWT secret, access expiry, refresh expiry, database settings, and CORS origins are environment-configurable.

## Role Permissions Matrix

| Capability | SUPER_ADMIN | BANK_ADMIN | BANK_MANAGER | ATM_OPERATOR |
|---|---:|---:|---:|---:|
| Full system access | Yes | No | No | No |
| Manage bank users | Yes | Yes | No | No |
| Manage ATMs | Yes | Yes | No | No |
| View transactions | Yes | Yes | Yes | Assigned scope |
| View predictions | Yes | Yes | Yes | Assigned scope |
| Manage refills | Yes | Yes | No | Record refills |
| View alerts | Yes | Yes | Yes | Assigned scope |
| Approve refill recommendations | Yes | No | Yes | No |
| Update cash inventory | Yes | Yes | No | Yes |

Public registration deliberately creates `ATM_OPERATOR` only, preventing privilege escalation. Privileged users must be provisioned by an authenticated administrative workflow.

## Endpoints

- `POST /api/auth/register` returns `201 Created` and access/refresh tokens.
- `POST /api/auth/login` returns `200 OK` and access/refresh tokens.
- `POST /api/auth/refresh` returns `200 OK` with a rotated refresh token.
- `POST /api/auth/logout` returns `200 OK` and revokes the supplied refresh token.
- `GET /api/auth/authorization/administration-check` demonstrates `@PreAuthorize` for `SUPER_ADMIN` and `BANK_ADMIN`.

Authentication failures return `401`; authenticated users without the required role return `403`; duplicate email returns `409`; invalid request data returns `400`.

## Example Requests

```http
POST /api/auth/login
Content-Type: application/json

{"email":"operator@example.com","password":"correct horse battery staple"}
```

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "7O2...",
    "tokenType": "Bearer",
    "expiresInSeconds": 3600,
    "userId": 42,
    "email": "operator@example.com",
    "role": "ATM_OPERATOR",
    "bankId": 7
  }
}
```

```http
POST /api/auth/refresh
Content-Type: application/json

{"refreshToken":"7O2..."}
```

```json
{"success":true,"message":"Token refreshed","data":{"accessToken":"eyJ...","refreshToken":"new...","expiresInSeconds":3600,"tokenType":"Bearer"}}
```

## Files Created or Modified

- `auth-service/pom.xml`
- `auth-service/src/main/resources/application.yml`
- `auth-service/src/main/java/com/atm/auth/AuthServiceApplication.java`
- `auth-service/src/main/java/com/atm/auth/config/AuthenticationConfig.java`
- `auth-service/src/main/java/com/atm/auth/controller/AuthController.java`
- `auth-service/src/main/java/com/atm/auth/controller/AuthorizationController.java`
- `auth-service/src/main/java/com/atm/auth/dto/*`
- `auth-service/src/main/java/com/atm/auth/entity/RefreshToken.java`
- `auth-service/src/main/java/com/atm/auth/repository/RefreshTokenRepository.java`
- `auth-service/src/main/java/com/atm/auth/security/*`
- `auth-service/src/main/java/com/atm/auth/service/AuthService.java`
- `auth-service/src/test/java/com/atm/auth/*`

## Verification

`mvn -f backend/pom.xml clean test` completed successfully across all reactor modules. Auth tests cover successful login, invalid password, refresh rotation, expired JWT, invalid JWT, absence of sensitive claims, and privileged-role authorization metadata.

## Recommended Phase 4

Implement authenticated business-service APIs with shared JWT validation and resource-level bank/ATM ownership checks, then add user administration, ATM operations, refill workflows, and frontend integration. Phase 4 is intentionally not implemented here.
