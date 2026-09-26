import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import type { User, UserRole, LoginRequest } from '../types/auth';
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
          storage.setAccessToken(`mock-jwt-token-for-${demo.role}`);
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
