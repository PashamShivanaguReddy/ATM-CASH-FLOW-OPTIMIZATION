import { apiClient } from './api';
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
