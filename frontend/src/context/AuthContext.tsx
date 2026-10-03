import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { login as loginRequest, logout as logoutRequest, refreshSession } from "../services/authService";
import { clearAuthSession, getAuthSession } from "../services/authStorage";
import type { AuthUser } from "../types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getAuthSession()?.user ?? null);
  const [loading, setLoading] = useState(Boolean(getAuthSession()));

  useEffect(() => {
    let active = true;
    const session = getAuthSession();
    if (session && session.expiresAt <= Date.now()) {
      void refreshSession().then((refreshed) => {
        if (active) setUser(refreshed?.user ?? null);
      }).finally(() => { if (active) setLoading(false); });
    } else {
      setLoading(false);
    }

    const onExpired = () => {
      clearAuthSession();
      setUser(null);
      setLoading(false);
    };
    window.addEventListener("auth:session-expired", onExpired);
    return () => {
      active = false;
      window.removeEventListener("auth:session-expired", onExpired);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const session = await loginRequest(email, password);
    setUser(session.user);
  };

  const signOut = async () => {
    setUser(null);
    await logoutRequest();
  };

  const value = useMemo(() => ({ user, loading, signIn, signOut }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuthContext must be used inside AuthProvider");
  return context;
}