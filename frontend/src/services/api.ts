import axios, { type InternalAxiosRequestConfig } from "axios";
import { clearAuthSession, getAuthSession, setAuthSession } from "./authStorage";

interface ApiEnvelope<T> {
  data: T;
  success?: boolean;
}

export function unwrapApiResponse<T>(response: ApiEnvelope<T> | T): T {
  if (typeof response === "object" && response !== null && "success" in response && "data" in response) {
    return response.data as T;
  }
  return response as T;
}

export interface NormalizedApiError {
  message: string;
  status?: number;
  code?: string;
  backendMessage?: string;
}

export function assertResourceId(id: unknown, resource: string): string {
  const value = typeof id === "string" ? id.trim() : typeof id === "number" && Number.isSafeInteger(id) ? String(id) : "";
  if (!/^\d+$/.test(value) || !/[1-9]/.test(value)) {
    throw new Error(`${resource} ID must be a positive integer.`);
  }
  return value;
}

export function assertOptionalResourceId(id: unknown, resource: string): void {
  if (id !== undefined) assertResourceId(id, resource);
}

export function normalizeApiError(error: unknown, fallback = "The request could not be completed."): NormalizedApiError {
  if (!axios.isAxiosError(error)) {
    return { message: error instanceof Error ? error.message : fallback };
  }

  const status = error.response?.status;
  const body = error.response?.data as { message?: unknown; errorCode?: unknown; code?: unknown } | undefined;
  const backendMessage = typeof body?.message === "string" ? body.message : undefined;
  const code = typeof body?.errorCode === "string" ? body.errorCode : typeof body?.code === "string" ? body.code : undefined;
  let message = fallback;

  if (status === 400) message = backendMessage ?? "The request was rejected. Check the submitted values.";
  else if (status === 401) message = "Your session has expired. Sign in again.";
  else if (status === 403) message = "Your account is not permitted to perform this action.";
  else if (status === 404) message = backendMessage ?? "This record was not found. Refresh and verify the selected ID.";
  else if (status === 409) message = backendMessage ?? "This operation has already been processed. Refresh to see its current state.";
  else if (status === 422) message = backendMessage ?? "This operation is not valid for the current business state.";
  else if (status === 502 || status === 503 || status === 504) message = "A backend service is temporarily unavailable. Refresh before retrying.";
  else if (status !== undefined && status >= 500) message = "The server could not confirm the operation. It may have been committed; refresh the resource before retrying.";
  else if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") message = "The request timed out. Refresh the resource to confirm its state before retrying.";
  else if (!error.response) message = "The backend could not be reached. Check the connection and refresh before retrying.";
  else if (backendMessage) message = backendMessage;

  return { message, status, code, backendMessage };
}

export function apiErrorMessage(error: unknown, fallback?: string): string {
  const normalized = normalizeApiError(error, fallback);
  const details = normalized.backendMessage && normalized.backendMessage !== normalized.message
    ? ` (${normalized.backendMessage})`
    : "";
  const code = normalized.code ? ` [${normalized.code}]` : "";
  return `${normalized.message}${details}${code}`;
}

interface RefreshedTokens {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

interface RetriableRequest extends InternalAxiosRequestConfig {
  authRetry?: boolean;
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  timeout: 15_000,
  headers: { Accept: "application/json" },
});

let refreshInFlight: Promise<string> | null = null;

api.interceptors.request.use((config) => {
  const session = getAuthSession();
  if (session?.tokens.accessToken) config.headers.Authorization = `Bearer ${session.tokens.accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      window.dispatchEvent(new Event("auth:forbidden"));
      return Promise.reject(error);
    }
    if (!axios.isAxiosError(error) || error.response?.status !== 401 || !error.config) {
      return Promise.reject(error);
    }

    const request = error.config as RetriableRequest;
    if (request.authRetry || request.url?.startsWith("/auth/")) return Promise.reject(error);

    const session = getAuthSession();
    if (!session?.tokens.refreshToken) {
      clearAuthSession();
      window.dispatchEvent(new Event("auth:session-expired"));
      return Promise.reject(error);
    }

    try {
      refreshInFlight ??= axios
        .post<ApiEnvelope<RefreshedTokens>>(api.getUri({ url: "/auth/refresh" }), { refreshToken: session.tokens.refreshToken })
        .then(({ data }) => {
          const tokens = data.data;
          setAuthSession({
            ...session,
            tokens: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
            expiresAt: Date.now() + tokens.expiresInSeconds * 1000,
          });
          return tokens.accessToken;
        })
        .finally(() => { refreshInFlight = null; });

      const accessToken = await refreshInFlight;
      request.authRetry = true;
      request.headers.Authorization = `Bearer ${accessToken}`;
      return await api(request);
    } catch (refreshError) {
      clearAuthSession();
      window.dispatchEvent(new Event("auth:session-expired"));
      return Promise.reject(refreshError);
    }
  },
);