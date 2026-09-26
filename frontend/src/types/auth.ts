export type UserRole =
  | 'SUPER_ADMIN'
  | 'BANK_ADMIN'
  | 'BANK_MANAGER'
  | 'ATM_OPERATOR';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';

export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: UserRole;
  status?: UserStatus;
  bankId?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
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

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
}
