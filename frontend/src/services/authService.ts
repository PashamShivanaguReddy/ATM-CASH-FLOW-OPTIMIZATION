import { api } from "./api";
import { clearAuthSession, getAuthSession, setAuthSession } from "./authStorage";
import type { AuthSession, LoginResponse } from "../types/auth";

interface ApiEnvelope<T> {
  data: T;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  tokenType: string;
}

function createSession(response: LoginResponse): AuthSession {
  return {
    user: {
      id: String(response.userId),
      name: response.email.split("@")[0],
      email: response.email,
      role: response.role,
      bankId: response.bankId,
    },
    tokens: { accessToken: response.accessToken, refreshToken: response.refreshToken },
    expiresAt: Date.now() + response.expiresInSeconds * 1000,
  };
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const { data } = await api.post<ApiEnvelope<LoginResponse>>("/auth/login", { email, password });
  const session = createSession(data.data);
  setAuthSession(session);
  return session;
}

export async function refreshSession(): Promise<AuthSession | null> {
  const session = getAuthSession();
  if (!session?.tokens.refreshToken) return null;

  try {
    const { data } = await api.post<ApiEnvelope<RefreshResponse>>("/auth/refresh", { refreshToken: session.tokens.refreshToken });
    const refreshed: AuthSession = {
      ...session,
      tokens: { accessToken: data.data.accessToken, refreshToken: data.data.refreshToken },
      expiresAt: Date.now() + data.data.expiresInSeconds * 1000,
    };
    setAuthSession(refreshed);
    return refreshed;
  } catch {
    clearAuthSession();
    return null;
  }
}

export async function logout(): Promise<void> {
  const session = getAuthSession();
  clearAuthSession();
  if (!session?.tokens.refreshToken) return;
  await api.post("/auth/logout", { refreshToken: session.tokens.refreshToken }).catch(() => undefined);
}