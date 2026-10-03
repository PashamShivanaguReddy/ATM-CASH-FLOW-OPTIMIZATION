import type { UserRole } from "./auth";

export type UserStatus = "ACTIVE" | "INACTIVE" | "LOCKED";

export interface UserRecord {
  id: number;
  bankId: number | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
}

export interface UserInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string;
  bankId?: number | null;
  role: UserRole;
  status?: UserStatus;
}

export interface UserListParams {
  page: number;
  pageSize: number;
  search?: string;
  role?: UserRole | "";
  status?: UserStatus | "";
}

export interface UserListResult {
  items: UserRecord[];
  page: number;
  pageSize: number;
  total: number;
}