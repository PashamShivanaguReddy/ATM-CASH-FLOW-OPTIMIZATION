import { UserRole, UserStatus } from './auth';

export interface UserDto {
  id: number;
  bankId: number | null;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
  bankId?: number | null;
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  bankId?: number | null;
}

export interface UserFilterParams {
  search?: string;
  role?: UserRole | '';
  status?: UserStatus | '';
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}
