import { describe, it, expect, beforeEach, vi } from 'vitest';
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
