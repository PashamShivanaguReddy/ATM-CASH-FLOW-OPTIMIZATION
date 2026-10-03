import type { AuthSession, UserRole } from "../types/auth";

export function makeSession(role: UserRole = "BANK_ADMIN"): AuthSession {
  return {
    user: { id: "17", name: "Casey Operator", email: "casey@example.com", role, bankId: 8 },
    tokens: { accessToken: "access-token", refreshToken: "refresh-token" },
    expiresAt: Date.now() + 60_000,
  };
}
