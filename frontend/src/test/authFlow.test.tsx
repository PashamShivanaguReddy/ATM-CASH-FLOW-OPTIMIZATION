import React from 'react';
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
