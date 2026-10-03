import type { AuthSession } from "../types/auth";

const SESSION_KEY = "flowline.auth.session";

export function getAuthSession(): AuthSession | null {
  try {
    const value = localStorage.getItem(SESSION_KEY);
    return value ? JSON.parse(value) as AuthSession : null;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function setAuthSession(session: AuthSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearAuthSession(): void {
  localStorage.removeItem(SESSION_KEY);
}