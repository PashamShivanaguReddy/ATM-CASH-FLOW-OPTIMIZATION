export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
    DETAIL: (id: number | string) => `/users/${id}`,
    CREATE: '/users',
    UPDATE: (id: number | string) => `/users/${id}`,
    DELETE: (id: number | string) => `/users/${id}`,
    ASSIGN_BANK: (id: number | string) => `/auth/users/${id}/bank`,
  },
  ATMS: {
    LIST: '/atms',
    DETAIL: (id: number | string) => `/atms/${id}`,
  },
  TRANSACTIONS: {
    LIST: '/transactions',
    DETAIL: (id: number | string) => `/transactions/${id}`,
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
