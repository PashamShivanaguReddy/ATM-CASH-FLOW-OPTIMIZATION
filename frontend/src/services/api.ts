import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
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
      config.headers.Authorization = `Bearer ${token}`;
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
              originalRequest.headers.Authorization = `Bearer ${token}`;
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
          `${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`,
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
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
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
