import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { Unauthorized } from '../pages/Unauthorized';
import { storage } from '../utils/storage';

describe('Unauthorized Access Handling', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders 403 access denied explanation and user clearance info', () => {
    storage.setAccessToken('operator-token');
    storage.setUser({
      id: 4,
      email: 'operator@metrobank.com',
      role: 'ATM_OPERATOR',
      bankId: 1,
    });

    render(
      <AuthProvider>
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/unauthorized',
              state: {
                attemptedPath: '/users',
                requiredRoles: ['SUPER_ADMIN', 'BANK_ADMIN'],
              },
            },
          ]}
        >
          <Unauthorized />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText('403 — Access Denied')).toBeInTheDocument();
    expect(screen.getByText('ATM Operator')).toBeInTheDocument();
    expect(screen.getByText('/users')).toBeInTheDocument();
    expect(screen.getByText('Super Admin, Bank Admin')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Return to Dashboard/i })
    ).toBeInTheDocument();
  });
});
