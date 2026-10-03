export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  bankId: number | null;
}

export type UserRole = "SUPER_ADMIN" | "BANK_ADMIN" | "BANK_MANAGER" | "ATM_OPERATOR";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession {
  user: AuthUser;
  tokens: AuthTokens;
  expiresAt: number;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
  userId: number;
  email: string;
  role: UserRole;
  bankId: number | null;
}