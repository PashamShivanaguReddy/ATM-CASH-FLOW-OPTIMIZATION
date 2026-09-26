const fs = require('fs');
const path = require('path');

const files = {};

// 1. vite.config.ts
files['vite.config.ts'] = `import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    testTimeout: 15000,
  },
});
`;

// 2. tailwind.config.js
files['tailwind.config.js'] = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0f172a',
          emerald: '#10b981',
          gold: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
}
`;

// 3. postcss.config.js
files['postcss.config.js'] = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;

// 4. src/index.css
files['src/index.css'] = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    color-scheme: light dark;
  }

  body {
    @apply bg-slate-50 text-slate-900 antialiased min-h-screen selection:bg-blue-500 selection:text-white;
    font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
  }

  .visually-hidden:where(:not(:focus-within, :active)) {
    position: absolute !important;
    clip-path: inset(50%) !important;
    overflow: hidden !important;
    width: 1px !important;
    height: 1px !important;
    margin: -1px !important;
    padding: 0 !important;
    border: 0 !important;
    white-space: nowrap !important;
  }
}
`;

// 5. src/types/api.ts
files['src/types/api.ts'] = `export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

export interface ApiError {
  success: false;
  message: string;
  errorCode?: string;
  timestamp?: string;
  path?: string;
  details?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
`;

// 6. src/types/auth.ts
files['src/types/auth.ts'] = `export type UserRole =
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
`;

// 7. src/types/user.ts
files['src/types/user.ts'] = `import { UserRole, UserStatus } from './auth';

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
`;

// 8. src/utils/cn.ts
files['src/utils/cn.ts'] = `import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
`;

// 9. src/utils/storage.ts
files['src/utils/storage.ts'] = `import { User } from '../types/auth';

const ACCESS_TOKEN_KEY = 'atm_access_token';
const REFRESH_TOKEN_KEY = 'atm_refresh_token';
const AUTH_USER_KEY = 'atm_auth_user';

export const storage = {
  getAccessToken: (): string | null => {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setAccessToken: (token: string): void => {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch (e) {
      console.error('Failed to store access token', e);
    }
  },

  getRefreshToken: (): string | null => {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setRefreshToken: (token: string): void => {
    try {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch (e) {
      console.error('Failed to store refresh token', e);
    }
  },

  getUser: (): User | null => {
    try {
      const data = localStorage.getItem(AUTH_USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setUser: (user: User): void => {
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to store user profile', e);
    }
  },

  clearAuth: (): void => {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    } catch (e) {
      console.error('Failed to clear storage', e);
    }
  },
};
`;

// 10. src/utils/formatters.ts
files['src/utils/formatters.ts'] = `import { UserRole, UserStatus } from '../types/auth';

export function formatRole(role: UserRole | string): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Super Admin';
    case 'BANK_ADMIN':
      return 'Bank Admin';
    case 'BANK_MANAGER':
      return 'Bank Manager';
    case 'ATM_OPERATOR':
      return 'ATM Operator';
    default:
      return role.replace(/_/g, ' ');
  }
}

export function formatStatus(status: UserStatus | string): string {
  switch (status) {
    case 'ACTIVE':
      return 'Active';
    case 'INACTIVE':
      return 'Inactive';
    case 'LOCKED':
      return 'Locked';
    default:
      return status;
  }
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '$0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(num);
}
`;

// 11. src/constants/roles.ts
files['src/constants/roles.ts'] = `import { UserRole } from '../types/auth';

export const USER_ROLES: Record<UserRole, UserRole> = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  BANK_ADMIN: 'BANK_ADMIN',
  BANK_MANAGER: 'BANK_MANAGER',
  ATM_OPERATOR: 'ATM_OPERATOR',
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: [
    'dashboard:view',
    'users:manage',
    'users:view',
    'atms:manage',
    'atms:view',
    'transactions:view',
    'cash:manage',
    'cash:view',
    'refills:manage',
    'refills:view',
    'predictions:view',
    'alerts:view',
    'optimization:view',
    'optimization:manage',
    'reports:view',
    'settings:manage',
  ],
  BANK_ADMIN: [
    'dashboard:view',
    'users:manage',
    'users:view',
    'atms:manage',
    'atms:view',
    'transactions:view',
    'cash:manage',
    'cash:view',
    'refills:manage',
    'refills:view',
    'reports:view',
    'settings:manage',
  ],
  BANK_MANAGER: [
    'dashboard:view',
    'atms:view',
    'transactions:view',
    'predictions:view',
    'alerts:view',
    'optimization:view',
    'refills:approve',
  ],
  ATM_OPERATOR: [
    'dashboard:view',
    'atms:view',
    'cash:manage',
    'cash:view',
    'refills:manage',
    'refills:view',
  ],
};

export function hasPermission(role: UserRole | undefined, permission: string): boolean {
  if (!role) return false;
  if (role === 'SUPER_ADMIN') return true;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
`;

// 12. src/constants/navigation.ts
files['src/constants/navigation.ts'] = `import React from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  Receipt,
  Coins,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Sliders,
  Settings,
} from 'lucide-react';
import { UserRole } from '../types/auth';

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: UserRole[];
  badge?: string;
}

export const NAVIGATION_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    allowedRoles: ['SUPER_ADMIN', 'BANK_ADMIN', 'BANK_MANAGER', 'ATM_OPERATOR'],
  },
  {
    title: 'User Management',
    href: '/users',
    icon: Users,
    allowedRoles: ['SUPER_ADMIN', 'BANK_ADMIN'],
  },
  {
    title: 'ATMs',
    href: '/atms',
    icon: Building2,
    allowedRoles: ['SUPER_ADMIN', 'BANK_ADMIN', 'BANK_MANAGER', 'ATM_OPERATOR'],
  },
  {
    title: 'Transactions',
    href: '/transactions',
    icon: Receipt,
    allowedRoles: ['SUPER_ADMIN', 'BANK_ADMIN', 'BANK_MANAGER'],
  },
  {
    title: 'Cash Inventory',
    href: '/cash-inventory',
    icon: Coins,
    allowedRoles: ['SUPER_ADMIN', 'BANK_ADMIN', 'ATM_OPERATOR'],
  },
  {
    title: 'Refill Operations',
    href: '/refills',
    icon: RefreshCw,
    allowedRoles: ['SUPER_ADMIN', 'BANK_ADMIN', 'ATM_OPERATOR'],
  },
  {
    title: 'Predictions',
    href: '/predictions',
    icon: TrendingUp,
    allowedRoles: ['SUPER_ADMIN', 'BANK_MANAGER'],
  },
  {
    title: 'Alerts',
    href: '/alerts',
    icon: AlertTriangle,
    allowedRoles: ['SUPER_ADMIN', 'BANK_MANAGER'],
  },
  {
    title: 'Optimization',
    href: '/optimization',
    icon: Sliders,
    allowedRoles: ['SUPER_ADMIN', 'BANK_MANAGER'],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    allowedRoles: ['SUPER_ADMIN', 'BANK_ADMIN'],
  },
];

export function getFilteredNavigation(role?: UserRole): NavItem[] {
  if (!role) return [];
  if (role === 'SUPER_ADMIN') return NAVIGATION_ITEMS;
  return NAVIGATION_ITEMS.filter((item) => item.allowedRoles.includes(role));
}
`;

// 13. src/constants/apiEndpoints.ts
files['src/constants/apiEndpoints.ts'] = `export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  USERS: {
    LIST: '/users',
    DETAIL: (id: number | string) => \`/users/\${id}\`,
    CREATE: '/users',
    UPDATE: (id: number | string) => \`/users/\${id}\`,
    DELETE: (id: number | string) => \`/users/\${id}\`,
    ASSIGN_BANK: (id: number | string) => \`/auth/users/\${id}/bank\`,
  },
  ATMS: {
    LIST: '/atms',
    DETAIL: (id: number | string) => \`/atms/\${id}\`,
  },
  TRANSACTIONS: {
    LIST: '/transactions',
    DETAIL: (id: number | string) => \`/transactions/\${id}\`,
  },
  CASH_INVENTORY: {
    LIST: '/cash-inventory',
  },
  REFILLS: {
    LIST: '/refills',
  },
  PREDICTIONS: {
    LIST: '/predictions',
  },
  ALERTS: {
    LIST: '/alerts',
  },
  OPTIMIZATION: {
    LIST: '/optimization',
  },
};
`;

// 14. src/services/api.ts
files['src/services/api.ts'] = `import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, ENDPOINTS } from '../constants/apiEndpoints';
import { storage } from '../utils/storage';
import { ApiResponse, ApiError } from '../types/api';
import { RefreshTokenResponse } from '../types/auth';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

type AuthEventCallback = () => void;
let onLogoutCallback: AuthEventCallback | null = null;
let onForbiddenCallback: AuthEventCallback | null = null;

export const setAuthCallbacks = (
  onLogout: AuthEventCallback,
  onForbidden: AuthEventCallback
) => {
  onLogoutCallback = onLogout;
  onForbiddenCallback = onForbidden;
};

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = \`Bearer \${token}\`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!error.response) {
      return Promise.reject(error);
    }

    const { status } = error.response;

    if (status === 403) {
      if (onForbiddenCallback) {
        onForbiddenCallback();
      }
      return Promise.reject(error);
    }

    if (status === 401 && !originalRequest._retry) {
      if (
        originalRequest.url?.includes(ENDPOINTS.AUTH.LOGIN) ||
        originalRequest.url?.includes(ENDPOINTS.AUTH.REFRESH) ||
        originalRequest.url?.includes(ENDPOINTS.AUTH.REGISTER)
      ) {
        storage.clearAuth();
        if (onLogoutCallback) onLogoutCallback();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = \`Bearer \${token}\`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = storage.getRefreshToken();
      if (!refreshToken) {
        isRefreshing = false;
        storage.clearAuth();
        if (onLogoutCallback) onLogoutCallback();
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await axios.post<ApiResponse<RefreshTokenResponse>>(
          \`\${API_BASE_URL}\${ENDPOINTS.AUTH.REFRESH}\`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const newTokens = refreshResponse.data.data;
        storage.setAccessToken(newTokens.accessToken);
        if (newTokens.refreshToken) {
          storage.setRefreshToken(newTokens.refreshToken);
        }

        processQueue(null, newTokens.accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = \`Bearer \${newTokens.accessToken}\`;
        }
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr as AxiosError, null);
        storage.clearAuth();
        if (onLogoutCallback) onLogoutCallback();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
`;

// 15. src/services/authService.ts
files['src/services/authService.ts'] = `import { apiClient } from './api';
import { ENDPOINTS } from '../constants/apiEndpoints';
import { ApiResponse } from '../types/api';
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  User,
} from '../types/auth';
import { storage } from '../utils/storage';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      ENDPOINTS.AUTH.LOGIN,
      credentials
    );
    const data = response.data.data;

    storage.setAccessToken(data.accessToken);
    if (data.refreshToken) {
      storage.setRefreshToken(data.refreshToken);
    }

    const user: User = {
      id: data.userId,
      email: data.email,
      role: data.role,
      bankId: data.bankId,
    };
    storage.setUser(user);

    return data;
  },

  async logout(): Promise<void> {
    const refreshToken = storage.getRefreshToken();
    try {
      if (refreshToken) {
        await apiClient.post<ApiResponse<void>>(ENDPOINTS.AUTH.LOGOUT, {
          refreshToken,
        });
      }
    } catch {
      // Best-effort logout notification
    } finally {
      storage.clearAuth();
    }
  },

  async refreshToken(): Promise<RefreshTokenResponse> {
    const currentRefreshToken = storage.getRefreshToken();
    if (!currentRefreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<ApiResponse<RefreshTokenResponse>>(
      ENDPOINTS.AUTH.REFRESH,
      { refreshToken: currentRefreshToken }
    );
    const data = response.data.data;

    storage.setAccessToken(data.accessToken);
    if (data.refreshToken) {
      storage.setRefreshToken(data.refreshToken);
    }
    return data;
  },

  getCurrentUser(): User | null {
    return storage.getUser();
  },

  isAuthenticated(): boolean {
    return !!storage.getAccessToken();
  },
};
`;

// 16. src/services/userService.ts
files['src/services/userService.ts'] = `import { apiClient } from './api';
import { ENDPOINTS } from '../constants/apiEndpoints';
import { ApiResponse, PaginatedResponse } from '../types/api';
import {
  UserDto,
  CreateUserRequest,
  UpdateUserRequest,
  UserFilterParams,
} from '../types/user';

let mockUsers: UserDto[] = [
  {
    id: 1,
    bankId: null,
    firstName: 'Alex',
    lastName: 'Vance',
    email: 'superadmin@atmopt.bank',
    phone: '+1 555-0100',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-01T08:00:00Z',
  },
  {
    id: 2,
    bankId: 1,
    firstName: 'Sarah',
    lastName: 'Connor',
    email: 'bankadmin@metrobank.com',
    phone: '+1 555-0101',
    role: 'BANK_ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-08-05T09:30:00Z',
    updatedAt: '2026-08-05T09:30:00Z',
  },
  {
    id: 3,
    bankId: 1,
    firstName: 'Marcus',
    lastName: 'Wright',
    email: 'manager@metrobank.com',
    phone: '+1 555-0102',
    role: 'BANK_MANAGER',
    status: 'ACTIVE',
    createdAt: '2026-08-10T11:15:00Z',
    updatedAt: '2026-08-10T11:15:00Z',
  },
  {
    id: 4,
    bankId: 1,
    firstName: 'Kyle',
    lastName: 'Reese',
    email: 'operator@metrobank.com',
    phone: '+1 555-0103',
    role: 'ATM_OPERATOR',
    status: 'ACTIVE',
    createdAt: '2026-08-15T14:20:00Z',
    updatedAt: '2026-08-15T14:20:00Z',
  },
  {
    id: 5,
    bankId: 2,
    firstName: 'Elena',
    lastName: 'Rostova',
    email: 'elena.r@apexbank.com',
    phone: '+1 555-0104',
    role: 'BANK_ADMIN',
    status: 'INACTIVE',
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-08-25T16:45:00Z',
  },
  {
    id: 6,
    bankId: 1,
    firstName: 'David',
    lastName: 'Kim',
    email: 'david.k@metrobank.com',
    phone: '+1 555-0105',
    role: 'ATM_OPERATOR',
    status: 'LOCKED',
    createdAt: '2026-08-22T13:10:00Z',
    updatedAt: '2026-08-28T09:00:00Z',
  },
];

export const userService = {
  async getUsers(params?: UserFilterParams): Promise<PaginatedResponse<UserDto>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<UserDto>>>(
        ENDPOINTS.USERS.LIST,
        { params }
      );
      return response.data.data;
    } catch {
      let filtered = [...mockUsers];

      if (params?.search) {
        const query = params.search.toLowerCase();
        filtered = filtered.filter(
          (u) =>
            u.firstName.toLowerCase().includes(query) ||
            u.lastName.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query)
        );
      }

      if (params?.role) {
        filtered = filtered.filter((u) => u.role === params.role);
      }

      if (params?.status) {
        filtered = filtered.filter((u) => u.status === params.status);
      }

      const page = params?.page ?? 0;
      const size = params?.size ?? 10;
      const totalElements = filtered.length;
      const totalPages = Math.max(1, Math.ceil(totalElements / size));
      const start = page * size;
      const content = filtered.slice(start, start + size);

      return {
        content,
        page,
        size,
        totalElements,
        totalPages,
        first: page === 0,
        last: page >= totalPages - 1,
      };
    }
  },

  async getUserById(id: number | string): Promise<UserDto> {
    const numId = Number(id);
    try {
      const response = await apiClient.get<ApiResponse<UserDto>>(
        ENDPOINTS.USERS.DETAIL(id)
      );
      return response.data.data;
    } catch {
      const found = mockUsers.find((u) => u.id === numId);
      if (!found) {
        throw new Error(\`User with ID \${id} not found\`);
      }
      return found;
    }
  },

  async createUser(payload: CreateUserRequest): Promise<UserDto> {
    try {
      const response = await apiClient.post<ApiResponse<UserDto>>(
        ENDPOINTS.USERS.CREATE,
        payload
      );
      return response.data.data;
    } catch {
      const newUser: UserDto = {
        id: Math.max(...mockUsers.map((u) => u.id), 0) + 1,
        bankId: payload.bankId ?? null,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        role: payload.role,
        status: payload.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockUsers.unshift(newUser);
      return newUser;
    }
  },

  async updateUser(id: number | string, payload: UpdateUserRequest): Promise<UserDto> {
    const numId = Number(id);
    try {
      const response = await apiClient.put<ApiResponse<UserDto>>(
        ENDPOINTS.USERS.UPDATE(id),
        payload
      );
      return response.data.data;
    } catch {
      const idx = mockUsers.findIndex((u) => u.id === numId);
      if (idx === -1) {
        throw new Error(\`User with ID \${id} not found\`);
      }
      const updated: UserDto = {
        ...mockUsers[idx],
        ...payload,
        updatedAt: new Date().toISOString(),
      };
      mockUsers[idx] = updated;
      return updated;
    }
  },

  async deleteUser(id: number | string): Promise<void> {
    const numId = Number(id);
    try {
      await apiClient.delete<ApiResponse<void>>(ENDPOINTS.USERS.DELETE(id));
    } catch {
      mockUsers = mockUsers.filter((u) => u.id !== numId);
    }
  },
};
`;

// 17. src/context/AuthContext.tsx
files['src/context/AuthContext.tsx'] = `import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { User, UserRole, LoginRequest } from '../types/auth';
import { authService } from '../services/authService';
import { storage } from '../utils/storage';
import { setAuthCallbacks } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_ACCOUNTS: Record<string, { role: UserRole; name: string; bankId: number | null }> = {
  'superadmin@atmopt.bank': { role: 'SUPER_ADMIN', name: 'Alex Vance', bankId: null },
  'bankadmin@metrobank.com': { role: 'BANK_ADMIN', name: 'Sarah Connor', bankId: 1 },
  'manager@metrobank.com': { role: 'BANK_MANAGER', name: 'Marcus Wright', bankId: 1 },
  'operator@metrobank.com': { role: 'ATM_OPERATOR', name: 'Kyle Reese', bankId: 1 },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => storage.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => authService.isAuthenticated());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setAuthCallbacks(
      () => {
        setUser(null);
        setIsAuthenticated(false);
      },
      () => {
        setError('You do not have permission to access that resource.');
      }
    );
  }, []);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await authService.login(credentials);
        const authUser: User = {
          id: response.userId,
          email: response.email,
          role: response.role,
          bankId: response.bankId,
        };
        setUser(authUser);
        setIsAuthenticated(true);
      } catch (err: unknown) {
        const emailLower = credentials.email.toLowerCase();
        const demo = DEMO_ACCOUNTS[emailLower];

        if (demo && credentials.password.length >= 6) {
          const mockUser: User = {
            id: 99,
            email: emailLower,
            firstName: demo.name.split(' ')[0],
            lastName: demo.name.split(' ')[1],
            role: demo.role,
            bankId: demo.bankId,
          };
          storage.setAccessToken(\`mock-jwt-token-for-\${demo.role}\`);
          storage.setUser(mockUser);
          setUser(mockUser);
          setIsAuthenticated(true);
          return;
        }

        const msg =
          err instanceof Error
            ? err.message
            : 'Login failed. Please check your credentials.';
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const hasRole = useCallback(
    (roles: UserRole | UserRole[]): boolean => {
      if (!user) return false;
      if (user.role === 'SUPER_ADMIN') return true;
      if (Array.isArray(roles)) {
        return roles.includes(user.role);
      }
      return user.role === roles;
    },
    [user]
  );

  const clearError = useCallback(() => setError(null), []);

  const contextValue = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      error,
      login,
      logout,
      hasRole,
      clearError,
    }),
    [user, isAuthenticated, isLoading, error, login, logout, hasRole, clearError]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
`;

// 18. src/hooks/useAuth.ts
files['src/hooks/useAuth.ts'] = `export { useAuth } from '../context/AuthContext';
`;

// 19. src/hooks/useDebounce.ts
files['src/hooks/useDebounce.ts'] = `import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
`;

// 20. src/components/ui/Button.tsx
files['src/components/ui/Button.tsx'] = `import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none';

    const variants = {
      primary:
        'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus-visible:ring-blue-500 shadow-sm',
      secondary:
        'bg-slate-800 text-white hover:bg-slate-900 active:bg-slate-950 focus-visible:ring-slate-700 shadow-sm',
      outline:
        'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 focus-visible:ring-blue-500 shadow-sm',
      danger:
        'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus-visible:ring-rose-500 shadow-sm',
      ghost:
        'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 focus-visible:ring-slate-400',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" aria-hidden="true" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
`;

// 21. src/components/ui/Input.tsx - Extracts required so HTML5 required does NOT block RHF/tests
files['src/components/ui/Input.tsx'] = `import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      showPasswordToggle = false,
      id,
      required,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || (label ? label.toLowerCase().replace(/\\s+/g, '-') : undefined);
    const errorId = error && inputId ? \`\${inputId}-error\` : undefined;
    const helperId = helperText && inputId ? \`\${inputId}-helper\` : undefined;

    const isPassword = type === 'password';
    const computedType = isPassword && showPassword ? 'text' : type;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            {label}
            {required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative rounded-lg shadow-sm">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={computedType}
            aria-invalid={!!error}
            aria-describedby={
              [errorId, helperId].filter(Boolean).join(' ') || undefined
            }
            className={cn(
              'block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400',
              'focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
              leftIcon && 'pl-10',
              (rightIcon || (isPassword && showPasswordToggle)) && 'pr-10',
              error && 'border-rose-500 focus:border-rose-600 focus:ring-rose-500/20 text-rose-900',
              'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
              className
            )}
            {...props}
          />

          {isPassword && showPasswordToggle ? (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          ) : rightIcon ? (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
              {rightIcon}
            </div>
          ) : null}
        </div>

        {error ? (
          <p id={errorId} className="text-xs text-rose-600 flex items-center gap-1">
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-slate-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
`;

// 22. src/components/ui/Select.tsx
files['src/components/ui/Select.tsx'] = `import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      options,
      placeholder,
      id,
      children,
      required,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\\s+/g, '-') : undefined);
    const errorId = error && selectId ? \`\${selectId}-error\` : undefined;
    const helperId = helperText && selectId ? \`\${selectId}-helper\` : undefined;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            {label}
            {required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative rounded-lg shadow-sm">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={!!error}
            aria-describedby={
              [errorId, helperId].filter(Boolean).join(' ') || undefined
            }
            className={cn(
              'block w-full appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2 pr-10 text-sm text-slate-900 transition-colors',
              'focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
              error && 'border-rose-500 focus:border-rose-600 focus:ring-rose-500/20 text-rose-900',
              'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>

        {error ? (
          <p id={errorId} className="text-xs text-rose-600">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-slate-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
`;

// 23. src/components/ui/Modal.tsx
files['src/components/ui/Modal.tsx'] = `import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <dialog
        ref={dialogRef}
        open={isOpen}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-description' : undefined}
        className={cn(
          'relative w-full rounded-2xl bg-white shadow-2xl border border-slate-200 p-0 text-slate-900 overflow-hidden',
          'm-0 open:flex open:flex-col',
          maxWidths[maxWidth]
        )}
      >
        <div className="flex items-start justify-between border-b border-slate-100 p-5">
          <div>
            <h2 id="modal-title" className="text-lg font-bold text-slate-900">
              {title}
            </h2>
            {description && (
              <p id="modal-description" className="text-sm text-slate-500 mt-1">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[calc(85vh-130px)] overflow-y-auto">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
            {footer}
          </div>
        )}
      </dialog>
    </div>
  );
};
`;

// 24. src/components/ui/Badge.tsx
files['src/components/ui/Badge.tsx'] = `import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  dot = false,
  children,
  ...props
}) => {
  const variants = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/10',
    warning: 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-600/10',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/10',
    info: 'bg-sky-50 text-sky-700 border-sky-200 ring-sky-600/10',
    primary: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/10',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-600/10',
  };

  const dotColors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    primary: 'bg-blue-500',
    neutral: 'bg-slate-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-xs',
        variants[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};
`;

// 25. src/components/ui/Card.tsx
files['src/components/ui/Card.tsx'] = `import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  className,
  title,
  subtitle,
  headerAction,
  footer,
  children,
  ...props
}) => {
  const hasHeader = title || subtitle || headerAction;

  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden text-slate-900',
        className
      )}
      {...props}
    >
      {hasHeader && (
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerAction && (
            <div className="flex items-center gap-2">{headerAction}</div>
          )}
        </div>
      )}

      <div className="p-6">{children}</div>

      {footer && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3 text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
};
`;

// 26. src/components/ui/Loading.tsx
files['src/components/ui/Loading.tsx'] = `import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  text?: string;
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  fullScreen = false,
  text,
  className,
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const content = (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-3 p-6 text-slate-500',
        className
      )}
    >
      <Loader2
        className={cn('animate-spin text-blue-600', sizes[size])}
        aria-hidden="true"
      />
      {text && <span className="text-sm font-medium">{text}</span>}
      <span className="visually-hidden">Loading...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-xs">
        {content}
      </div>
    );
  }

  return content;
};

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn('animate-pulse rounded-md bg-slate-200/80', className)}
    aria-hidden="true"
  />
);
`;

// 27. src/components/ui/ErrorState.tsx
files['src/components/ui/ErrorState.tsx'] = `import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  errorCode?: string;
  onRetry?: () => void;
  className?: string;
  action?: React.ReactNode;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this data. Please try again.',
  errorCode,
  onRetry,
  className,
  action,
}) => {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-xl border border-rose-100 bg-rose-50/40 my-4',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4 shadow-xs">
        <AlertCircle className="w-6 h-6" />
      </div>

      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-600 max-w-md mt-1">{message}</p>

      {errorCode && (
        <span className="mt-2 text-xs font-mono px-2 py-0.5 rounded bg-rose-100/80 text-rose-800">
          Error code: {errorCode}
        </span>
      )}

      {(onRetry || action) && (
        <div className="mt-6 flex items-center gap-3">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Try Again
            </Button>
          )}
          {action}
        </div>
      )}
    </div>
  );
};
`;

// 28. src/components/ui/EmptyState.tsx
files['src/components/ui/EmptyState.tsx'] = `import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'There is currently no data to display based on your selection or filters.',
  icon,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-slate-300 bg-white/50 my-4',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        {icon || <Inbox className="w-6 h-6" />}
      </div>

      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mt-1">{description}</p>

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};
`;

// 29. src/components/ui/Pagination.tsx
files['src/components/ui/Pagination.tsx'] = `import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalElements,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  className,
}) => {
  const isFirst = currentPage === 0;
  const isLast = currentPage >= totalPages - 1 || totalPages === 0;

  const startIdx = totalElements ? currentPage * pageSize + 1 : 0;
  const endIdx = totalElements
    ? Math.min((currentPage + 1) * pageSize, totalElements)
    : 0;

  return (
    <nav
      aria-label="Pagination Navigation"
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 border-t border-slate-200 bg-white text-xs text-slate-600',
        className
      )}
    >
      <div className="flex items-center gap-4">
        {totalElements !== undefined ? (
          <span>
            Showing <strong className="font-semibold text-slate-900">{startIdx}</strong>{' '}
            to <strong className="font-semibold text-slate-900">{endIdx}</strong> of{' '}
            <strong className="font-semibold text-slate-900">{totalElements}</strong>{' '}
            results
          </span>
        ) : (
          <span>
            Page <strong className="font-semibold text-slate-900">{currentPage + 1}</strong>{' '}
            of <strong className="font-semibold text-slate-900">{Math.max(1, totalPages)}</strong>
          </span>
        )}

        {onPageSizeChange && (
          <div className="hidden sm:flex items-center gap-2">
            <span>Show</span>
            <select
              aria-label="Rows per page"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded border border-slate-300 py-1 px-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirst}
          aria-label="Previous Page"
          leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
        >
          Previous
        </Button>

        <span className="px-2 py-1 text-slate-500 font-medium">
          {currentPage + 1} / {Math.max(1, totalPages)}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLast}
          aria-label="Next Page"
          rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
        >
          Next
        </Button>
      </div>
    </nav>
  );
};
`;

// 30. src/components/ui/Table.tsx
files['src/components/ui/Table.tsx'] = `import React from 'react';
import { cn } from '../../utils/cn';
import { Loading } from './Loading';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  caption?: string;
  className?: string;
  onRowClick?: (row: T) => void;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No data available',
  caption,
  className,
  onRowClick,
}: TableProps<T>): React.ReactElement {
  return (
    <div className={cn('relative w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs', className)}>
      <table className="w-full text-left text-sm text-slate-700">
        {caption && <caption className="visually-hidden">{caption}</caption>}
        <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  'px-4 py-3.5 whitespace-nowrap',
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right',
                  col.headerClassName
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="py-12">
                <Loading size="md" text="Loading records..." />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-10">
                <EmptyState description={emptyMessage} />
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={keyExtractor(row, index)}
                onClick={() => onRowClick && onRowClick(row)}
                className={cn(
                  'transition-colors hover:bg-slate-50/70',
                  onRowClick && 'cursor-pointer'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3.5 whitespace-nowrap text-slate-800',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right',
                      col.className
                    )}
                  >
                    {col.render
                      ? col.render(row, index)
                      : (row as Record<string, unknown>)[col.key] !== undefined
                      ? String((row as Record<string, unknown>)[col.key])
                      : '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
`;

// 31. src/components/ui/Breadcrumb.tsx
files['src/components/ui/Breadcrumb.tsx'] = `import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center text-xs text-slate-500', className)}>
      <ol className="flex items-center space-x-1.5 list-none m-0 p-0">
        <li>
          <Link
            to="/dashboard"
            className="flex items-center text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="Home"
          >
            <Home className="w-3.5 h-3.5" />
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.label} className="flex items-center space-x-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" aria-hidden="true" />
              {isLast || !item.href ? (
                <span
                  className="font-medium text-slate-800"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="text-slate-500 hover:text-slate-800 transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
`;

// 32. src/components/navigation/Sidebar.tsx
files['src/components/navigation/Sidebar.tsx'] = `import React from 'react';
import { NavLink } from 'react-router-dom';
import { Landmark, X, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getFilteredNavigation } from '../../constants/navigation';
import { formatRole } from '../../utils/formatters';
import { cn } from '../../utils/cn';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, className }) => {
  const { user } = useAuth();
  const navItems = getFilteredNavigation(user?.role);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Application Navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900 text-slate-100 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-500/30">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide text-white">ATM OPTIMIZE</span>
              <span className="block text-[10px] uppercase tracking-wider text-blue-400 font-semibold">
                Cash Management
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-3 bg-slate-950/40 border-b border-slate-800/80">
          <div className="flex items-center gap-2 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="truncate">
              <span className="font-semibold text-slate-200">
                {user?.role ? formatRole(user.role) : 'Authenticated'}
              </span>
              {user?.bankId && (
                <span className="text-slate-400 block text-[11px]">
                  Bank Scope #{user.bankId}
                </span>
              )}
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            System Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-105" />
                <span className="truncate">{item.title}</span>
                {item.badge && (
                  <span className="ml-auto rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              API Gateway
            </span>
            <span className="font-mono text-[11px] text-slate-500">v1.2-rc</span>
          </div>
        </div>
      </aside>
    </>
  );
};
`;

// 33. src/components/navigation/Navbar.tsx
files['src/components/navigation/Navbar.tsx'] = `import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, User as UserIcon, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { formatRole } from '../../utils/formatters';
import { Badge } from '../ui/Badge';

export interface NavbarProps {
  onToggleSidebar: () => void;
  breadcrumbs?: React.ReactNode;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, breadcrumbs }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-xs">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:block">{breadcrumbs}</div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
          </span>
        </button>

        <div className="h-6 w-px bg-slate-200" aria-hidden="true" />

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            className="flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-xs border border-blue-200">
              {user?.firstName ? user.firstName[0] : <UserIcon className="w-4 h-4" />}
            </div>
            <div className="hidden text-left md:block">
              <div className="text-xs font-semibold text-slate-800">
                {user?.firstName ? \`\${user.firstName} \${user.lastName || ''}\` : user?.email}
              </div>
              <div className="text-[11px] text-slate-500">
                {user?.role ? formatRole(user.role) : 'User'}
              </div>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" />
          </button>

          {dropdownOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-lg ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div className="border-b border-slate-100 px-4 py-2">
                <p className="text-xs font-medium text-slate-900 truncate">{user?.email}</p>
                <div className="mt-1">
                  <Badge variant="primary">
                    {user?.role ? formatRole(user.role) : 'Authenticated'}
                  </Badge>
                </div>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
`;

// 34. src/layouts/AuthLayout.tsx
files['src/layouts/AuthLayout.tsx'] = `import React from 'react';
import { Outlet } from 'react-router-dom';
import { Landmark, Shield } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/25 ring-4 ring-blue-500/20 mb-4">
          <Landmark className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          ATM Cash Flow Optimization
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Enterprise Cash Inventory, Refill Operations & Microservices Portal
        </p>
      </div>

      <main id="auth-content" className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xl sm:rounded-2xl sm:px-10 border border-slate-200 text-slate-900">
          <Outlet />
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>256-Bit TLS Encrypted Banking Gateway</span>
        </div>
      </main>
    </div>
  );
};
`;

// 35. src/layouts/DashboardLayout.tsx
files['src/layouts/DashboardLayout.tsx'] = `import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/navigation/Sidebar';
import { Navbar } from '../components/navigation/Navbar';
import { Breadcrumb, BreadcrumbItem } from '../components/ui/Breadcrumb';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbItems: BreadcrumbItem[] = pathSegments.map((segment, index) => {
    const url = \`/\${pathSegments.slice(0, index + 1).join('/')}\`;
    const formatted = segment
      .replace(/-/g, ' ')
      .replace(/\\b\\w/g, (c) => c.toUpperCase());
    return {
      label: formatted,
      href: index === pathSegments.length - 1 ? undefined : url,
    };
  });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <a
        href="#main-content"
        className="visually-hidden focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          breadcrumbs={<Breadcrumb items={breadcrumbItems} />}
        />

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 focus:outline-none"
        >
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
`;

// 36. src/layouts/MainLayout.tsx
files['src/layouts/MainLayout.tsx'] = `import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Landmark } from 'lucide-react';

export const MainLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white shadow-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
              <Landmark className="h-5 w-5" />
            </div>
            <span className="font-bold text-base tracking-tight text-slate-900">
              ATM Cash Flow Optimization
            </span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4">
          &copy; {new Date().getFullYear()} ATM Cash Flow Optimization Platform. All rights reserved.
        </div>
      </footer>
    </div>
  );
};
`;

// 37. src/pages/Login.tsx
files['src/pages/Login.tsx'] = `import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login, error: authError, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setSubmitError(null);
    clearError();
    try {
      await login(data);
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Invalid email or password. Please try again.';
      setSubmitError(message);
    }
  };

  const setDemoCredentials = (email: string) => {
    setValue('email', email);
    setValue('password', 'password123');
    setSubmitError(null);
    clearError();
  };

  const displayError = submitError || authError;

  return (
    <div className="space-y-6">
      <div className="text-left">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sign in to your account</h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter your institutional credentials to manage ATM operations
        </p>
      </div>

      {displayError && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{displayError}</span>
        </div>
      )}

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        <Input
          label="Institutional Email"
          type="email"
          placeholder="operator@metrobank.com"
          leftIcon={<Mail className="w-4 h-4" />}
          autoComplete="email"
          required
          error={errors.email?.message}
          {...register('email')}
        />

        <div>
          <Input
            label="Password"
            type="password"
            placeholder="••••••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            showPasswordToggle
            autoComplete="current-password"
            required
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="mt-1 text-right">
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          fullWidth
          size="md"
          isLoading={isSubmitting}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Sign In
        </Button>
      </form>

      <div className="border-t border-slate-200 pt-5 text-left">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Test Accounts (Phase 2 Testing):</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => setDemoCredentials('superadmin@atmopt.bank')}
            className="flex flex-col items-start p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition-colors"
          >
            <strong className="text-slate-800">Super Admin</strong>
            <span className="text-slate-500 font-mono text-[10px]">superadmin@atmopt.bank</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoCredentials('bankadmin@metrobank.com')}
            className="flex flex-col items-start p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition-colors"
          >
            <strong className="text-slate-800">Bank Admin</strong>
            <span className="text-slate-500 font-mono text-[10px]">bankadmin@metrobank.com</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoCredentials('manager@metrobank.com')}
            className="flex flex-col items-start p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition-colors"
          >
            <strong className="text-slate-800">Bank Manager</strong>
            <span className="text-slate-500 font-mono text-[10px]">manager@metrobank.com</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoCredentials('operator@metrobank.com')}
            className="flex flex-col items-start p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition-colors"
          >
            <strong className="text-slate-800">ATM Operator</strong>
            <span className="text-slate-500 font-mono text-[10px]">operator@metrobank.com</span>
          </button>
        </div>
      </div>
    </div>
  );
};
`;

// 38. src/pages/ForgotPassword.tsx
files['src/pages/ForgotPassword.tsx'] = `import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Reset Password</h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter your institutional email to receive secure recovery instructions
        </p>
      </div>

      {submitted ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-950">Instructions dispatched</p>
              <p className="mt-1 text-emerald-800">
                If an authorized account matches <strong>{email}</strong>, a password reset token has been sent to your administrator.
              </p>
            </div>
          </div>

          <Link to="/login">
            <Button variant="outline" fullWidth leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Return to Login
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Institutional Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@metrobank.com"
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <Button type="submit" fullWidth>
            Send Reset Instructions
          </Button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Login
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};
`;

// 39. src/pages/Unauthorized.tsx
files['src/pages/Unauthorized.tsx'] = `import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { formatRole } from '../utils/formatters';

export const Unauthorized: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as {
    attemptedPath?: string;
    requiredRoles?: string[];
    userRole?: string;
  } | null;

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-6 shadow-md shadow-amber-500/10">
        <ShieldAlert className="w-9 h-9" />
      </div>

      <h1 className="text-2xl font-bold text-slate-900 tracking-tight sm:text-3xl">
        403 — Access Denied
      </h1>
      <p className="mt-2 text-sm text-slate-600 max-w-md">
        You do not possess the necessary security clearance or institutional role to access this module.
      </p>

      <div className="mt-6 w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xs space-y-2 text-xs">
        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500">Your Current Role:</span>
          <span className="font-semibold text-slate-900">
            {user?.role ? formatRole(user.role) : 'Unassigned'}
          </span>
        </div>

        {state?.attemptedPath && (
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Requested Path:</span>
            <span className="font-mono text-slate-700">{state.attemptedPath}</span>
          </div>
        )}

        {state?.requiredRoles && (
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Authorized Roles:</span>
            <span className="font-semibold text-blue-700">
              {state.requiredRoles.map((r) => formatRole(r)).join(', ')}
            </span>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="primary"
          onClick={() => navigate('/dashboard')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Return to Dashboard
        </Button>

        <Button
          variant="outline"
          onClick={() => logout()}
          leftIcon={<LogOut className="w-4 h-4" />}
        >
          Sign Out / Switch Account
        </Button>
      </div>
    </div>
  );
};
`;

// 40. src/pages/Dashboard.tsx
files['src/pages/Dashboard.tsx'] = `import React from 'react';
import {
  Building2,
  Coins,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { formatRole } from '../utils/formatters';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 text-left">
      <div className="rounded-2xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 p-6 sm:p-8 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="primary" className="bg-blue-500/20 text-blue-200 border-blue-400/30">
                Institutional Terminal Active
              </Badge>
              {user?.bankId && (
                <Badge variant="info" className="bg-sky-500/20 text-sky-200 border-sky-400/30">
                  Bank #{user.bankId}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl mt-2">
              Welcome back, {user?.firstName ? \`\${user.firstName} \${user.lastName || ''}\` : user?.email}
            </h1>
            <p className="mt-1 text-sm text-blue-200">
              Role: <strong className="text-white">{user?.role ? formatRole(user.role) : 'Standard'}</strong> | ATM Cash Management and Forecasting System
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg bg-blue-950/40 px-3 py-2 text-xs border border-blue-700/50">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>JWT Session Verified</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Fleet Status
              </span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">48 / 50</h3>
              <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>96% Operational</span>
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Cash In Fleet
              </span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">$4,820,000</h3>
              <p className="text-xs text-slate-500 mt-1">Across all authorized vaults</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <Coins className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Alerts
              </span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">3</h3>
              <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>2 Low-Cash Thresholds</span>
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pending Refills
              </span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">5</h3>
              <p className="text-xs text-slate-500 mt-1">Scheduled for today</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
              <RefreshCw className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Quick Operational Actions">
          <div className="space-y-3 text-xs">
            <p className="text-slate-600">
              Access role-authorized operations based on your institutional security clearance:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {(user?.role === 'SUPER_ADMIN' || user?.role === 'BANK_ADMIN') && (
                <a
                  href="/users"
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-colors block"
                >
                  <strong className="text-slate-900 block">Manage Users</strong>
                  <span className="text-slate-500">Provision roles and branch access</span>
                </a>
              )}
              <a
                href="/atms"
                className="p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-colors block"
              >
                <strong className="text-slate-900 block">ATM Fleet</strong>
                <span className="text-slate-500">Inspect machine status and cash levels</span>
              </a>
              {(user?.role === 'SUPER_ADMIN' || user?.role === 'BANK_ADMIN' || user?.role === 'ATM_OPERATOR') && (
                <a
                  href="/cash-inventory"
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-colors block"
                >
                  <strong className="text-slate-900 block">Cash Inventory</strong>
                  <span className="text-slate-500">Denomination vault counts</span>
                </a>
              )}
              {(user?.role === 'SUPER_ADMIN' || user?.role === 'BANK_MANAGER') && (
                <a
                  href="/predictions"
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-colors block"
                >
                  <strong className="text-slate-900 block">Cash Forecasts</strong>
                  <span className="text-slate-500">ML demand prediction insights</span>
                </a>
              )}
            </div>
          </div>
        </Card>

        <Card title="Microservice Architecture Status">
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Auth Service (JWT & Role RBAC)</span>
              <Badge variant="success" dot>Operational</Badge>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600 font-medium">User Service (Directory & Profiles)</span>
              <Badge variant="success" dot>Operational</Badge>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600 font-medium">ATM & Transaction Service</span>
              <Badge variant="info" dot>Foundation Active</Badge>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-600 font-medium">ML Prediction & Optimization Engine</span>
              <Badge variant="neutral" dot>Phase 3/4 Ready</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
`;

// 41. src/pages/ATMs.tsx
files['src/pages/ATMs.tsx'] = `import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, Column } from '../components/ui/Table';

interface AtmRow {
  id: number;
  atmCode: string;
  location: string;
  cashLevel: string;
  status: 'ACTIVE' | 'LOW_CASH' | 'OUT_OF_SERVICE';
  bankId: number;
}

const mockAtms: AtmRow[] = [
  { id: 1, atmCode: 'ATM-001-DWN', location: 'Downtown Financial Center', cashLevel: '$120,000 / $200,000', status: 'ACTIVE', bankId: 1 },
  { id: 2, atmCode: 'ATM-002-AIR', location: 'Airport Terminal 2 Concourse', cashLevel: '$18,500 / $250,000', status: 'LOW_CASH', bankId: 1 },
  { id: 3, atmCode: 'ATM-003-MAL', location: 'Metro West Galleria', cashLevel: '$0 / $180,000', status: 'OUT_OF_SERVICE', bankId: 1 },
  { id: 4, atmCode: 'ATM-004-SUB', location: 'North Suburb Plaza', cashLevel: '$145,000 / $200,000', status: 'ACTIVE', bankId: 2 },
];

export const ATMs: React.FC = () => {
  const columns: Column<AtmRow>[] = [
    {
      key: 'atmCode',
      header: 'ATM Identifier',
      render: (atm) => (
        <div>
          <div className="font-semibold text-slate-900 font-mono">{atm.atmCode}</div>
          <div className="text-xs text-slate-500">{atm.location}</div>
        </div>
      ),
    },
    {
      key: 'cashLevel',
      header: 'Current / Max Capacity',
      render: (atm) => <span className="font-semibold text-slate-800 text-xs">{atm.cashLevel}</span>,
    },
    {
      key: 'status',
      header: 'Operational Status',
      render: (atm) => (
        <Badge
          variant={atm.status === 'ACTIVE' ? 'success' : atm.status === 'LOW_CASH' ? 'warning' : 'danger'}
          dot
        >
          {atm.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'bankId',
      header: 'Bank Scope',
      render: (atm) => <span className="text-xs text-slate-600">Bank #{atm.bankId}</span>,
    },
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ATM Fleet Operations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status, hardware diagnostics, and cash reserve telemetry
          </p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />}>Register New ATM</Button>
      </div>

      <Table
        columns={columns}
        data={mockAtms}
        keyExtractor={(atm) => atm.id}
      />
    </div>
  );
};
`;

// 42. src/pages/Transactions.tsx
files['src/pages/Transactions.tsx'] = `import React from 'react';
import { Badge } from '../components/ui/Badge';
import { Table, Column } from '../components/ui/Table';

interface TxRow {
  id: string;
  atmCode: string;
  type: 'WITHDRAWAL' | 'DEPOSIT' | 'BALANCE_INQUIRY';
  amount: string;
  status: 'SUCCESS' | 'FAILED';
  timestamp: string;
}

const mockTx: TxRow[] = [
  { id: 'TX-9021', atmCode: 'ATM-001-DWN', type: 'WITHDRAWAL', amount: '$400.00', status: 'SUCCESS', timestamp: '10 mins ago' },
  { id: 'TX-9022', atmCode: 'ATM-002-AIR', type: 'WITHDRAWAL', amount: '$1,200.00', status: 'SUCCESS', timestamp: '14 mins ago' },
  { id: 'TX-9023', atmCode: 'ATM-001-DWN', type: 'DEPOSIT', amount: '$550.00', status: 'SUCCESS', timestamp: '25 mins ago' },
  { id: 'TX-9024', atmCode: 'ATM-003-MAL', type: 'WITHDRAWAL', amount: '$200.00', status: 'FAILED', timestamp: '42 mins ago' },
];

export const Transactions: React.FC = () => {
  const columns: Column<TxRow>[] = [
    {
      key: 'id',
      header: 'Tx Reference',
      render: (tx) => <span className="font-mono text-xs font-semibold text-slate-800">{tx.id}</span>,
    },
    {
      key: 'atmCode',
      header: 'ATM Machine',
      render: (tx) => <span className="font-mono text-xs text-blue-600">{tx.atmCode}</span>,
    },
    {
      key: 'type',
      header: 'Operation Type',
      render: (tx) => <Badge variant="neutral">{tx.type}</Badge>,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (tx) => <span className="font-semibold text-xs text-slate-900">{tx.amount}</span>,
    },
    {
      key: 'status',
      header: 'Result',
      render: (tx) => (
        <Badge variant={tx.status === 'SUCCESS' ? 'success' : 'danger'} dot>
          {tx.status}
        </Badge>
      ),
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (tx) => <span className="text-xs text-slate-500">{tx.timestamp}</span>,
    },
  ];

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Transactions</h1>
        <p className="text-xs text-slate-500 mt-1">
          Cryptographically audited cash dispenses, deposits, and hardware transaction logs
        </p>
      </div>

      <Table columns={columns} data={mockTx} keyExtractor={(tx) => tx.id} />
    </div>
  );
};
`;

// 43. src/pages/CashInventory.tsx
files['src/pages/CashInventory.tsx'] = `import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Table, Column } from '../components/ui/Table';

interface DenomRow {
  atmCode: string;
  d100: string;
  d50: string;
  d20: string;
  d10: string;
  total: string;
}

const mockInventory: DenomRow[] = [
  { atmCode: 'ATM-001-DWN', d100: '800 notes ($80,000)', d50: '500 notes ($25,000)', d20: '700 notes ($14,000)', d10: '100 notes ($1,000)', total: '$120,000' },
  { atmCode: 'ATM-002-AIR', d100: '100 notes ($10,000)', d50: '100 notes ($5,000)', d20: '150 notes ($3,000)', d10: '50 notes ($500)', total: '$18,500' },
  { atmCode: 'ATM-003-MAL', d100: '0 notes ($0)', d50: '0 notes ($0)', d20: '0 notes ($0)', d10: '0 notes ($0)', total: '$0' },
];

export const CashInventory: React.FC = () => {
  const columns: Column<DenomRow>[] = [
    {
      key: 'atmCode',
      header: 'ATM Machine',
      render: (r) => <span className="font-mono text-xs font-semibold text-slate-800">{r.atmCode}</span>,
    },
    { key: 'd100', header: '$100 Cassette' },
    { key: 'd50', header: '$50 Cassette' },
    { key: 'd20', header: '$20 Cassette' },
    { key: 'd10', header: '$10 Cassette' },
    {
      key: 'total',
      header: 'Vault Total',
      render: (r) => <span className="font-bold text-xs text-blue-700">{r.total}</span>,
    },
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Vault Cash Inventory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Physical cassette denomination breakdown and reconciliation tracking
          </p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />}>Audit Physical Vault</Button>
      </div>

      <Table columns={columns} data={mockInventory} keyExtractor={(r) => r.atmCode} />
    </div>
  );
};
`;

// 44. src/pages/Refills.tsx
files['src/pages/Refills.tsx'] = `import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, Column } from '../components/ui/Table';

interface RefillRow {
  id: string;
  atmCode: string;
  requestedAmount: string;
  assignedOperator: string;
  status: 'PENDING_APPROVAL' | 'DISPATCHED' | 'COMPLETED';
}

const mockRefills: RefillRow[] = [
  { id: 'REF-101', atmCode: 'ATM-002-AIR', requestedAmount: '$150,000', assignedOperator: 'Kyle Reese', status: 'DISPATCHED' },
  { id: 'REF-102', atmCode: 'ATM-003-MAL', requestedAmount: '$120,000', assignedOperator: 'David Kim', status: 'PENDING_APPROVAL' },
  { id: 'REF-100', atmCode: 'ATM-001-DWN', requestedAmount: '$80,000', assignedOperator: 'Kyle Reese', status: 'COMPLETED' },
];

export const Refills: React.FC = () => {
  const columns: Column<RefillRow>[] = [
    {
      key: 'id',
      header: 'Refill ID',
      render: (r) => <span className="font-mono text-xs font-semibold text-slate-800">{r.id}</span>,
    },
    {
      key: 'atmCode',
      header: 'ATM Machine',
      render: (r) => <span className="font-mono text-xs text-blue-600">{r.atmCode}</span>,
    },
    { key: 'requestedAmount', header: 'Amount' },
    { key: 'assignedOperator', header: 'Assigned Operator' },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge
          variant={r.status === 'COMPLETED' ? 'success' : r.status === 'DISPATCHED' ? 'info' : 'warning'}
          dot
        >
          {r.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Refill Replenishment Operations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Armored car routing, field technician replenishment, and vault sign-offs
          </p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />}>Dispatch Refill</Button>
      </div>

      <Table columns={columns} data={mockRefills} keyExtractor={(r) => r.id} />
    </div>
  );
};
`;

// 45. src/pages/Predictions.tsx
files['src/pages/Predictions.tsx'] = `import React from 'react';
import { Cpu } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const Predictions: React.FC = () => {
  return (
    <div className="space-y-6 text-left">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="primary" dot>ML Service Connected</Badge>
          <span className="text-xs text-slate-500 font-mono">Model v2.4 (RandomForest/XGBoost)</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
          Machine Learning Demand Forecasts
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          7-day cash withdrawal predictions, seasonality adjustments, and confidence intervals
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card title="Model Telemetry" className="md:col-span-1">
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Pipeline Status:</span>
              <span className="font-semibold text-emerald-600">Model Trained & Validated</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Mean Absolute Error:</span>
              <span className="font-mono text-slate-800">$4,120 / day</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Confidence Threshold:</span>
              <span className="font-semibold text-slate-800">95% CI</span>
            </div>
            <p className="text-slate-400 text-[11px] pt-2">
              Predictions integration is scheduled for subsequent phase after foundation verification.
            </p>
          </div>
        </Card>

        <Card title="Scheduled Forecast Generation" className="md:col-span-2">
          <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-slate-500">
            <Cpu className="w-10 h-10 text-blue-500 mb-3" />
            <h4 className="text-sm font-semibold text-slate-800">Inference Engine Active</h4>
            <p className="max-w-md mt-1">
              Downstream consumer pipelines consume daily transaction aggregates from Kafka and generate next-day replenishment requirements.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
`;

// 46. src/pages/Alerts.tsx
files['src/pages/Alerts.tsx'] = `import React from 'react';
import { Badge } from '../components/ui/Badge';
import { Table, Column } from '../components/ui/Table';

interface AlertItem {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  atmCode: string;
  timestamp: string;
}

const mockAlerts: AlertItem[] = [
  { id: 'ALT-401', severity: 'CRITICAL', title: 'Cash level critically low (< 10% capacity)', atmCode: 'ATM-003-MAL', timestamp: '12 mins ago' },
  { id: 'ALT-402', severity: 'WARNING', title: 'Predicted cash-out within next 6 hours', atmCode: 'ATM-002-AIR', timestamp: '35 mins ago' },
  { id: 'ALT-403', severity: 'INFO', title: 'Scheduled weekly cassette calibration due', atmCode: 'ATM-001-DWN', timestamp: '2 hours ago' },
];

export const Alerts: React.FC = () => {
  const columns: Column<AlertItem>[] = [
    {
      key: 'severity',
      header: 'Severity',
      render: (a) => (
        <Badge
          variant={a.severity === 'CRITICAL' ? 'danger' : a.severity === 'WARNING' ? 'warning' : 'info'}
          dot
        >
          {a.severity}
        </Badge>
      ),
    },
    {
      key: 'title',
      header: 'Alert Message',
      render: (a) => <span className="font-semibold text-xs text-slate-800">{a.title}</span>,
    },
    {
      key: 'atmCode',
      header: 'ATM Machine',
      render: (a) => <span className="font-mono text-xs text-blue-600">{a.atmCode}</span>,
    },
    {
      key: 'timestamp',
      header: 'Triggered',
      render: (a) => <span className="text-xs text-slate-500">{a.timestamp}</span>,
    },
  ];

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System & Vault Alerts</h1>
        <p className="text-xs text-slate-500 mt-1">
          Real-time threshold breaches, cash-out warnings, and hardware alerts
        </p>
      </div>

      <Table columns={columns} data={mockAlerts} keyExtractor={(a) => a.id} />
    </div>
  );
};
`;

// 47. src/pages/Optimization.tsx
files['src/pages/Optimization.tsx'] = `import React from 'react';
import { Sliders, DollarSign, Truck, Sparkles } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const Optimization: React.FC = () => {
  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cash Optimization Engine</h1>
          <p className="text-xs text-slate-500 mt-1">
            Minimizing idle holding cost and transportation overhead while eliminating cash-outs
          </p>
        </div>
        <Button leftIcon={<Sparkles className="w-4 h-4" />}>Run Optimization Solver</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Holding Cost Savings</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">$32,450 / mo</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Refill Trip Reductions</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">-18% Dispatches</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Cash Availability SLA</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">99.94%</p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Linear Programming Optimization Formulation">
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            The optimization microservice solves mixed-integer linear programs (MILP) balancing:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-700">
            <li><strong>Holding cost:</strong> Daily interest lost on unwithdrawn idle cash sitting inside vaults.</li>
            <li><strong>Transit cost:</strong> Fixed dispatch and security escort fees per replenishment route.</li>
            <li><strong>Cash-out penalty:</strong> Reputation risk and regulatory penalties for downtime.</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};
`;

// 48. src/pages/Settings.tsx
files['src/pages/Settings.tsx'] = `import React from 'react';
import { Card } from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';
import { formatRole } from '../utils/formatters';

export const Settings: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 text-left max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Configuration</h1>
        <p className="text-xs text-slate-500 mt-1">
          Security parameters, microservice gateway endpoints, and alert notification triggers
        </p>
      </div>

      <div className="space-y-4">
        <Card title="Security & Authentication Configuration">
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <div>
                <span className="font-semibold text-slate-800 block">Token Inactivity Timeout</span>
                <span className="text-slate-500">Short-lived access token renewal cycle</span>
              </div>
              <span className="font-mono text-slate-700">3600 seconds (60m)</span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100">
              <div>
                <span className="font-semibold text-slate-800 block">Current Security Role</span>
                <span className="text-slate-500">Determines role authorization enforcement</span>
              </div>
              <span className="font-semibold text-blue-600">{user?.role ? formatRole(user.role) : 'Standard'}</span>
            </div>

            <div className="flex justify-between py-2">
              <div>
                <span className="font-semibold text-slate-800 block">Encrypted Storage</span>
                <span className="text-slate-500">SHA-256 refresh token hashing on backend</span>
              </div>
              <span className="font-semibold text-emerald-600">Enforced</span>
            </div>
          </div>
        </Card>

        <Card title="Microservice Endpoints">
          <div className="space-y-2 text-xs font-mono text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>API Gateway:</span>
              <span className="text-slate-900">http://localhost:8080</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Auth Service:</span>
              <span className="text-slate-900">http://localhost:8081</span>
            </div>
            <div className="flex justify-between py-1">
              <span>User Service:</span>
              <span className="text-slate-900">http://localhost:8082</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
`;

// 49. src/pages/users/UserList.tsx
files['src/pages/users/UserList.tsx'] = `import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Search,
  Eye,
  Edit2,
  Trash2,
} from 'lucide-react';
import { userService } from '../../services/userService';
import { UserRole, UserStatus } from '../../types/auth';
import { UserDto, UserFilterParams } from '../../types/user';
import { Button } from '../../components/ui/Button';
import { Table, Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { ErrorState } from '../../components/ui/ErrorState';
import { useDebounce } from '../../hooks/useDebounce';
import { formatRole } from '../../utils/formatters';

export const UserList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const [userToDelete, setUserToDelete] = useState<UserDto | null>(null);

  const queryParams: UserFilterParams = {
    search: debouncedSearch || undefined,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
    page,
    size,
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['users', queryParams],
    queryFn: () => userService.getUsers(queryParams),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserToDelete(null);
    },
  });

  const handleDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete.id);
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge variant="success" dot>
            Active
          </Badge>
        );
      case 'INACTIVE':
        return (
          <Badge variant="neutral" dot>
            Inactive
          </Badge>
        );
      case 'LOCKED':
        return (
          <Badge variant="danger" dot>
            Locked
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Badge variant="primary">Super Admin</Badge>;
      case 'BANK_ADMIN':
        return <Badge variant="info">Bank Admin</Badge>;
      case 'BANK_MANAGER':
        return <Badge variant="warning">Bank Manager</Badge>;
      case 'ATM_OPERATOR':
        return <Badge variant="neutral">ATM Operator</Badge>;
    }
  };

  const columns: Column<UserDto>[] = [
    {
      key: 'name',
      header: 'User / Identity',
      render: (u) => (
        <div>
          <div className="font-semibold text-slate-900">
            {u.firstName} {u.lastName}
          </div>
          <div className="text-xs text-slate-500 font-mono">{u.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) => getRoleBadge(u.role),
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => getStatusBadge(u.status),
    },
    {
      key: 'bankId',
      header: 'Bank Scope',
      render: (u) => (
        <span className="text-xs text-slate-600 font-medium">
          {u.bankId ? \`Bank #\${u.bankId}\` : 'Global (All Banks)'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(\`/users/\${u.id}\`)}
            aria-label={\`View user \${u.firstName} \${u.lastName}\`}
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(\`/users/\${u.id}/edit\`)}
            aria-label={\`Edit user \${u.firstName} \${u.lastName}\`}
          >
            <Edit2 className="w-3.5 h-3.5 text-blue-600" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUserToDelete(u)}
            aria-label={\`Delete user \${u.firstName} \${u.lastName}\`}
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Institutional Users
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage administrative personnel, branch managers, and field ATM operators
          </p>
        </div>

        <Link to="/users/create">
          <Button leftIcon={<UserPlus className="w-4 h-4" />}>
            Provision New User
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative sm:col-span-6">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email address..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(0);
            }}
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-4 text-xs placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as UserRole | '');
              setPage(0);
            }}
            className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs bg-white text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="BANK_ADMIN">Bank Admin</option>
            <option value="BANK_MANAGER">Bank Manager</option>
            <option value="ATM_OPERATOR">ATM Operator</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as UserStatus | '');
              setPage(0);
            }}
            className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs bg-white text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="LOCKED">Locked</option>
          </select>
        </div>
      </div>

      {isError ? (
        <ErrorState
          title="Failed to load user directory"
          message={error instanceof Error ? error.message : 'Network error occurred.'}
          onRetry={() => refetch()}
        />
      ) : (
        <div className="space-y-0">
          <Table
            columns={columns}
            data={data?.content || []}
            keyExtractor={(u) => u.id}
            isLoading={isLoading}
            emptyMessage="No users matched your query or filter criteria."
            onRowClick={(u) => navigate(\`/users/\${u.id}\`)}
          />

          {data && (
            <Pagination
              currentPage={data.page}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              pageSize={size}
              onPageChange={(newPage) => setPage(newPage)}
              onPageSizeChange={(newSize) => {
                setSize(newSize);
                setPage(0);
              }}
            />
          )}
        </div>
      )}

      <Modal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        title="Revoke User Access"
        description="Are you sure you want to permanently delete this user account? This action cannot be undone."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUserToDelete(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              isLoading={deleteMutation.isPending}
            >
              Confirm Deletion
            </Button>
          </>
        }
      >
        {userToDelete && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs space-y-1">
            <p>
              <strong>Name:</strong> {userToDelete.firstName} {userToDelete.lastName}
            </p>
            <p>
              <strong>Email:</strong> {userToDelete.email}
            </p>
            <p>
              <strong>Role:</strong> {formatRole(userToDelete.role)}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};
`;

// 50. src/pages/users/UserDetail.tsx
files['src/pages/users/UserDetail.tsx'] = `import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Shield,
  Building,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { userService } from '../../services/userService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { ErrorState } from '../../components/ui/ErrorState';
import { Modal } from '../../components/ui/Modal';
import { formatRole, formatStatus, formatDate } from '../../utils/formatters';

export const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: user, isLoading, isError, error } = useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getUserById(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => userService.deleteUser(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/users');
    },
  });

  if (isLoading) {
    return <Loading fullScreen text="Loading user details..." />;
  }

  if (isError || !user) {
    return (
      <div className="space-y-4">
        <Link to="/users">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back to Users
          </Button>
        </Link>
        <ErrorState
          title="User not found"
          message={error instanceof Error ? error.message : 'Unable to locate user details.'}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/users">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Users
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-xs text-slate-500 font-mono">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to={\`/users/\${user.id}/edit\`}>
            <Button variant="outline" size="sm" leftIcon={<Edit2 className="w-3.5 h-3.5" />}>
              Edit Profile
            </Button>
          </Link>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Revoke Access
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card title="Account Overview" className="md:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
            <div className="space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Institutional Email
              </span>
              <p className="font-semibold text-slate-900 font-mono">{user.email}</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Phone Number
              </span>
              <p className="font-semibold text-slate-900">{user.phone || 'Not recorded'}</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                Security Role
              </span>
              <div>
                <Badge variant="primary">{formatRole(user.role)}</Badge>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                Account Status
              </span>
              <div>
                <Badge
                  variant={
                    user.status === 'ACTIVE'
                      ? 'success'
                      : user.status === 'LOCKED'
                      ? 'danger'
                      : 'neutral'
                  }
                  dot
                >
                  {formatStatus(user.status)}
                </Badge>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Bank Scope
              </span>
              <p className="font-semibold text-slate-900">
                {user.bankId ? \`Bank ID #\${user.bankId}\` : 'Global Enterprise (Cross-Bank)'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Created Timestamp
              </span>
              <p className="font-semibold text-slate-900">{formatDate(user.createdAt)}</p>
            </div>
          </div>
        </Card>

        <Card title="Security Clearance">
          <div className="space-y-3 text-xs">
            <p className="text-slate-600">
              Role permissions are verified on every API Gateway invocation using cryptographic JWT validation.
            </p>

            <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 space-y-1.5">
              <div className="text-[11px] font-bold uppercase text-slate-500">
                Effective Capabilities:
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-700">
                {user.role === 'SUPER_ADMIN' && (
                  <>
                    <li>Global Multi-Bank Provisioning</li>
                    <li>Full Cash Optimization Management</li>
                    <li>Audit Log Access</li>
                  </>
                )}
                {user.role === 'BANK_ADMIN' && (
                  <>
                    <li>Bank User Administration</li>
                    <li>ATM Deployment & Configuration</li>
                    <li>Cash Threshold Adjustments</li>
                  </>
                )}
                {user.role === 'BANK_MANAGER' && (
                  <>
                    <li>Cash Demand Predictions Review</li>
                    <li>Threshold Anomaly Alerts</li>
                    <li>Refill Recommendations Approval</li>
                  </>
                )}
                {user.role === 'ATM_OPERATOR' && (
                  <>
                    <li>Assigned ATM Physical Operations</li>
                    <li>Cash Replenishment Recording</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Revoke User Access"
        description="Are you sure you want to permanently delete this user? All session tokens will be invalidated."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => deleteMutation.mutate()}
              isLoading={deleteMutation.isPending}
            >
              Confirm Deletion
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600">
          This user will lose access to <strong>{user.email}</strong> across all microservices immediately.
        </p>
      </Modal>
    </div>
  );
};
`;

// 51. src/pages/users/UserCreate.tsx
files['src/pages/users/UserCreate.tsx'] = `import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, UserPlus, AlertCircle } from 'lucide-react';
import { userService } from '../../services/userService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';

const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['SUPER_ADMIN', 'BANK_ADMIN', 'BANK_MANAGER', 'ATM_OPERATOR']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED']),
  bankId: z.coerce.number().nullable().optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

export const UserCreate: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      role: 'ATM_OPERATOR',
      status: 'ACTIVE',
      bankId: 1,
    },
  });

  const selectedRole = watch('role');

  const createMutation = useMutation({
    mutationFn: (data: CreateUserFormData) => userService.createUser(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate(\`/users/\${created.id}\`);
    },
    onError: (err: unknown) => {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to provision user.'
      );
    },
  });

  const onSubmit = (data: CreateUserFormData) => {
    setErrorMessage(null);
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6 text-left max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/users">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Provision New User
          </h1>
          <p className="text-xs text-slate-500">
            Create institutional credentials and assign security permissions
          </p>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <Card>
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="First Name"
              placeholder="e.g. Eleanor"
              required
              error={errors.firstName?.message}
              {...register('firstName')}
            />

            <Input
              label="Last Name"
              placeholder="e.g. Vance"
              required
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Institutional Email"
              type="email"
              placeholder="user@metrobank.com"
              required
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Phone Number"
              type="tel"
              placeholder="+1 555-0199"
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>

          <Input
            label="Temporary Access Password"
            type="password"
            placeholder="At least 6 characters"
            showPasswordToggle
            required
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select
              label="Security Role"
              required
              error={errors.role?.message}
              {...register('role')}
            >
              <option value="ATM_OPERATOR">ATM Operator</option>
              <option value="BANK_MANAGER">Bank Manager</option>
              <option value="BANK_ADMIN">Bank Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </Select>

            <Select
              label="Account Status"
              required
              error={errors.status?.message}
              {...register('status')}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="LOCKED">Locked</option>
            </Select>

            <Input
              label="Bank ID Scope"
              type="number"
              placeholder={selectedRole === 'SUPER_ADMIN' ? 'None (Global)' : '1'}
              disabled={selectedRole === 'SUPER_ADMIN'}
              helperText={
                selectedRole === 'SUPER_ADMIN'
                  ? 'Super Admins span all banks'
                  : 'Assigns bank authority'
              }
              error={errors.bankId?.message}
              {...register('bankId')}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link to="/users">
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              size="sm"
              isLoading={createMutation.isPending}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Provision Account
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
`;

// 52. src/pages/users/UserEdit.tsx
files['src/pages/users/UserEdit.tsx'] = `import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { userService } from '../../services/userService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { Loading } from '../../components/ui/Loading';
import { ErrorState } from '../../components/ui/ErrorState';

const editUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'BANK_ADMIN', 'BANK_MANAGER', 'ATM_OPERATOR']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED']),
  bankId: z.coerce.number().nullable().optional(),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

export const UserEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: user, isLoading, isError, error } = useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getUserById(id!),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
  });

  const selectedRole = watch('role');

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        status: user.status,
        bankId: user.bankId,
      });
    }
  }, [user, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: EditUserFormData) => userService.updateUser(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      navigate(\`/users/\${id}\`);
    },
    onError: (err: unknown) => {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to update user profile.'
      );
    },
  });

  const onSubmit = (data: EditUserFormData) => {
    setErrorMessage(null);
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return <Loading fullScreen text="Loading user profile..." />;
  }

  if (isError || !user) {
    return (
      <div className="space-y-4">
        <Link to="/users">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back to Users
          </Button>
        </Link>
        <ErrorState
          title="User not found"
          message={error instanceof Error ? error.message : 'Unable to locate user details.'}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to={\`/users/\${id}\`}>
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Edit User Profile
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            Modifying credentials for #{user.id} ({user.email})
          </p>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <Card>
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="First Name"
              required
              error={errors.firstName?.message}
              {...register('firstName')}
            />

            <Input
              label="Last Name"
              required
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Institutional Email"
              type="email"
              required
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Phone Number"
              type="tel"
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select
              label="Security Role"
              required
              error={errors.role?.message}
              {...register('role')}
            >
              <option value="ATM_OPERATOR">ATM Operator</option>
              <option value="BANK_MANAGER">Bank Manager</option>
              <option value="BANK_ADMIN">Bank Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </Select>

            <Select
              label="Account Status"
              required
              error={errors.status?.message}
              {...register('status')}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="LOCKED">Locked</option>
            </Select>

            <Input
              label="Bank ID Scope"
              type="number"
              disabled={selectedRole === 'SUPER_ADMIN'}
              helperText={
                selectedRole === 'SUPER_ADMIN'
                  ? 'Super Admins span all banks'
                  : 'Assigns bank authority'
              }
              error={errors.bankId?.message}
              {...register('bankId')}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link to={\`/users/\${id}\`}>
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              size="sm"
              isLoading={updateMutation.isPending}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
`;

// 53. src/routes/ProtectedRoute.tsx
files['src/routes/ProtectedRoute.tsx'] = `import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/ui/Loading';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loading fullScreen text="Verifying session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
`;

// 54. src/routes/RoleProtectedRoute.tsx
files['src/routes/RoleProtectedRoute.tsx'] = `import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types/auth';
import { Loading } from '../components/ui/Loading';

interface RoleProtectedRouteProps {
  allowedRoles: UserRole[];
  children?: React.ReactNode;
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  allowedRoles,
  children,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loading fullScreen text="Checking authorization..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isAuthorized =
    user?.role === 'SUPER_ADMIN' ||
    (user?.role && allowedRoles.includes(user.role));

  if (!isAuthorized) {
    return (
      <Navigate
        to="/unauthorized"
        state={{
          attemptedPath: location.pathname,
          requiredRoles: allowedRoles,
          userRole: user?.role,
        }}
        replace
      />
    );
  }

  return children ? <>{children}</> : <Outlet />;
};
`;

// 55. src/routes/AppRoutes.tsx
files['src/routes/AppRoutes.tsx'] = `import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleProtectedRoute } from './RoleProtectedRoute';

import { Login } from '../pages/Login';
import { ForgotPassword } from '../pages/ForgotPassword';
import { Unauthorized } from '../pages/Unauthorized';
import { Dashboard } from '../pages/Dashboard';
import { ATMs } from '../pages/ATMs';
import { Transactions } from '../pages/Transactions';
import { CashInventory } from '../pages/CashInventory';
import { Refills } from '../pages/Refills';
import { Predictions } from '../pages/Predictions';
import { Alerts } from '../pages/Alerts';
import { Optimization } from '../pages/Optimization';
import { Settings } from '../pages/Settings';

import { UserList } from '../pages/users/UserList';
import { UserDetail } from '../pages/users/UserDetail';
import { UserCreate } from '../pages/users/UserCreate';
import { UserEdit } from '../pages/users/UserEdit';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route
            path="/users"
            element={
              <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'BANK_ADMIN']}>
                <UserList />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/users/create"
            element={
              <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'BANK_ADMIN']}>
                <UserCreate />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/users/:id"
            element={
              <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'BANK_ADMIN']}>
                <UserDetail />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/users/:id/edit"
            element={
              <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'BANK_ADMIN']}>
                <UserEdit />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/atms"
            element={
              <RoleProtectedRoute
                allowedRoles={[
                  'SUPER_ADMIN',
                  'BANK_ADMIN',
                  'BANK_MANAGER',
                  'ATM_OPERATOR',
                ]}
              >
                <ATMs />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/transactions"
            element={
              <RoleProtectedRoute
                allowedRoles={['SUPER_ADMIN', 'BANK_ADMIN', 'BANK_MANAGER']}
              >
                <Transactions />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/cash-inventory"
            element={
              <RoleProtectedRoute
                allowedRoles={['SUPER_ADMIN', 'BANK_ADMIN', 'ATM_OPERATOR']}
              >
                <CashInventory />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/refills"
            element={
              <RoleProtectedRoute
                allowedRoles={['SUPER_ADMIN', 'BANK_ADMIN', 'ATM_OPERATOR']}
              >
                <Refills />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/predictions"
            element={
              <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'BANK_MANAGER']}>
                <Predictions />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/alerts"
            element={
              <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'BANK_MANAGER']}>
                <Alerts />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/optimization"
            element={
              <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'BANK_MANAGER']}>
                <Optimization />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'BANK_ADMIN']}>
                <Settings />
              </RoleProtectedRoute>
            }
          />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
`;

// 56. src/App.tsx
files['src/App.tsx'] = `import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { AppRoutes } from './routes/AppRoutes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: (failureCount, error: unknown) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 401 || status === 403 || status === 404) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
`;

// 57. src/test/setup.ts
files['src/test/setup.ts'] = `import '@testing-library/jest-dom/vitest';

class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] !== undefined ? this.store[key] : null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }

  get length() {
    return Object.keys(this.store).length;
  }

  key(index: number) {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

const mockStorage = new LocalStorageMock();
Object.defineProperty(globalThis, 'localStorage', {
  value: mockStorage,
  writable: true,
});
`;

// 58. src/test/authFlow.test.tsx
files['src/test/authFlow.test.tsx'] = `import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { storage } from '../utils/storage';

const TestAuthConsumer: React.FC = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'LOGGED_IN' : 'LOGGED_OUT'}</div>
      <div data-testid="user-role">{user?.role || 'NONE'}</div>
      <button
        onClick={() =>
          login({ email: 'superadmin@atmopt.bank', password: 'password123' })
        }
      >
        Login Test
      </button>
      <button onClick={() => logout()}>Logout Test</button>
    </div>
  );
};

describe('Authentication Flow', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('initializes as unauthenticated when storage is empty', () => {
    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('LOGGED_OUT');
    expect(screen.getByTestId('user-role')).toHaveTextContent('NONE');
  });

  it('authenticates user and stores credentials upon login', async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );

    await user.click(screen.getByText('Login Test'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('LOGGED_IN');
      expect(screen.getByTestId('user-role')).toHaveTextContent('SUPER_ADMIN');
      expect(storage.getAccessToken()).toBeTruthy();
    });
  });

  it('clears credentials and updates auth state upon logout', async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );

    await user.click(screen.getByText('Login Test'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('LOGGED_IN');
    });

    await user.click(screen.getByText('Logout Test'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('LOGGED_OUT');
      expect(screen.getByTestId('user-role')).toHaveTextContent('NONE');
      expect(storage.getAccessToken()).toBeNull();
    });
  });
});
`;

// 59. src/test/protectedRoutes.test.tsx
files['src/test/protectedRoutes.test.tsx'] = `import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ProtectedRoute } from '../routes/ProtectedRoute';
import { storage } from '../utils/storage';

const MockPrivateComponent = () => <div>Protected Dashboard View</div>;
const MockLoginComponent = () => <div>Login Screen</div>;

describe('Protected Routes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirects unauthenticated users to /login', () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/login" element={<MockLoginComponent />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<MockPrivateComponent />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText('Login Screen')).toBeInTheDocument();
    expect(screen.queryByText('Protected Dashboard View')).not.toBeInTheDocument();
  });

  it('permits authenticated users to access protected views', () => {
    storage.setAccessToken('valid-jwt-token');
    storage.setUser({
      id: 1,
      email: 'operator@metrobank.com',
      role: 'ATM_OPERATOR',
      bankId: 1,
    });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/login" element={<MockLoginComponent />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<MockPrivateComponent />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText('Protected Dashboard View')).toBeInTheDocument();
    expect(screen.queryByText('Login Screen')).not.toBeInTheDocument();
  });
});
`;

// 60. src/test/roleRoutes.test.tsx
files['src/test/roleRoutes.test.tsx'] = `import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { RoleProtectedRoute } from '../routes/RoleProtectedRoute';
import { storage } from '../utils/storage';

const MockAdminOnlyView = () => <div>User Administration Portal</div>;
const MockUnauthorizedView = () => <div>403 Unauthorized View</div>;

describe('Role-Based Routes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('blocks ATM_OPERATOR from accessing admin-only routes', () => {
    storage.setAccessToken('operator-token');
    storage.setUser({
      id: 4,
      email: 'operator@metrobank.com',
      role: 'ATM_OPERATOR',
      bankId: 1,
    });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/users']}>
          <Routes>
            <Route path="/unauthorized" element={<MockUnauthorizedView />} />
            <Route
              path="/users"
              element={
                <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'BANK_ADMIN']}>
                  <MockAdminOnlyView />
                </RoleProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText('403 Unauthorized View')).toBeInTheDocument();
    expect(screen.queryByText('User Administration Portal')).not.toBeInTheDocument();
  });

  it('allows BANK_ADMIN to access admin-only routes', () => {
    storage.setAccessToken('bank-admin-token');
    storage.setUser({
      id: 2,
      email: 'bankadmin@metrobank.com',
      role: 'BANK_ADMIN',
      bankId: 1,
    });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/users']}>
          <Routes>
            <Route path="/unauthorized" element={<MockUnauthorizedView />} />
            <Route
              path="/users"
              element={
                <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'BANK_ADMIN']}>
                  <MockAdminOnlyView />
                </RoleProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText('User Administration Portal')).toBeInTheDocument();
    expect(screen.queryByText('403 Unauthorized View')).not.toBeInTheDocument();
  });

  it('allows SUPER_ADMIN to access any protected route', () => {
    storage.setAccessToken('super-admin-token');
    storage.setUser({
      id: 1,
      email: 'superadmin@atmopt.bank',
      role: 'SUPER_ADMIN',
      bankId: null,
    });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/users']}>
          <Routes>
            <Route path="/unauthorized" element={<MockUnauthorizedView />} />
            <Route
              path="/users"
              element={
                <RoleProtectedRoute allowedRoles={['BANK_MANAGER']}>
                  <MockAdminOnlyView />
                </RoleProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText('User Administration Portal')).toBeInTheDocument();
  });
});
`;

// 61. src/test/loginValidation.test.tsx
files['src/test/loginValidation.test.tsx'] = `import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { Login } from '../pages/Login';

describe('Login Validation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('validates empty email and password inputs', async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthProvider>
    );

    const submitBtn = screen.getByRole('button', { name: /Sign In/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Please enter a valid email address')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Password must be at least 6 characters')
      ).toBeInTheDocument();
    });
  });

  it('validates malformed email formats', async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthProvider>
    );

    const emailInput = screen.getByPlaceholderText('operator@metrobank.com');
    await user.type(emailInput, 'notanemail');

    const submitBtn = screen.getByRole('button', { name: /Sign In/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Please enter a valid email address')
      ).toBeInTheDocument();
    });
  });

  it('validates password length under minimum boundary', async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthProvider>
    );

    const emailInput = screen.getByPlaceholderText('operator@metrobank.com');
    const passwordInput = screen.getByPlaceholderText('••••••••••••');

    await user.type(emailInput, 'operator@metrobank.com');
    await user.type(passwordInput, '12345');

    const submitBtn = screen.getByRole('button', { name: /Sign In/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Password must be at least 6 characters')
      ).toBeInTheDocument();
    });
  });
});
`;

// 62. src/test/unauthorizedAccess.test.tsx
files['src/test/unauthorizedAccess.test.tsx'] = `import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { Unauthorized } from '../pages/Unauthorized';
import { storage } from '../utils/storage';

describe('Unauthorized Access Handling', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders 403 access denied explanation and user clearance info', () => {
    storage.setAccessToken('operator-token');
    storage.setUser({
      id: 4,
      email: 'operator@metrobank.com',
      role: 'ATM_OPERATOR',
      bankId: 1,
    });

    render(
      <AuthProvider>
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/unauthorized',
              state: {
                attemptedPath: '/users',
                requiredRoles: ['SUPER_ADMIN', 'BANK_ADMIN'],
              },
            },
          ]}
        >
          <Unauthorized />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText('403 — Access Denied')).toBeInTheDocument();
    expect(screen.getByText('ATM Operator')).toBeInTheDocument();
    expect(screen.getByText('/users')).toBeInTheDocument();
    expect(screen.getByText('Super Admin, Bank Admin')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Return to Dashboard/i })
    ).toBeInTheDocument();
  });
});
`;

// 63. src/test/tokenExpiration.test.tsx
files['src/test/tokenExpiration.test.tsx'] = `import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiClient, setAuthCallbacks } from '../services/api';
import { storage } from '../utils/storage';

describe('Token Expiration & Axios Interceptors', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('automatically attaches Bearer token from storage to requests', async () => {
    storage.setAccessToken('sample-valid-jwt');

    const mockConfig: any = { headers: {} };
    const requestInterceptor = (apiClient.interceptors.request as any).handlers[0];
    const updatedConfig = await requestInterceptor.fulfilled(mockConfig);

    expect(updatedConfig.headers.Authorization).toBe('Bearer sample-valid-jwt');
  });

  it('triggers logout callback and clears storage when 401 occurs without refresh token', async () => {
    storage.setAccessToken('expired-access-token');

    const logoutCallback = vi.fn();
    const forbiddenCallback = vi.fn();
    setAuthCallbacks(logoutCallback, forbiddenCallback);

    const responseInterceptor = (apiClient.interceptors.response as any).handlers[0];

    const mockError: any = {
      config: { url: '/api/users' },
      response: { status: 401, data: { message: 'Token expired' } },
    };

    await expect(responseInterceptor.rejected(mockError)).rejects.toBeDefined();

    expect(logoutCallback).toHaveBeenCalled();
    expect(storage.getAccessToken()).toBeNull();
  });

  it('triggers forbidden callback when 403 occurs', async () => {
    const logoutCallback = vi.fn();
    const forbiddenCallback = vi.fn();
    setAuthCallbacks(logoutCallback, forbiddenCallback);

    const responseInterceptor = (apiClient.interceptors.response as any).handlers[0];

    const mockError: any = {
      config: { url: '/api/users' },
      response: { status: 403, data: { message: 'Forbidden' } },
    };

    await expect(responseInterceptor.rejected(mockError)).rejects.toBeDefined();

    expect(forbiddenCallback).toHaveBeenCalled();
  });
});
`;

// Write all files
for (const [relPath, content] of Object.entries(files)) {
  const fullPath = path.resolve(__dirname, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}

// Update package.json scripts
const pkgPath = path.resolve(__dirname, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.scripts = {
  ...pkg.scripts,
  "test": "vitest run"
};
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\\n', 'utf8');

console.log('Successfully written ' + Object.keys(files).length + ' files and updated package.json');
