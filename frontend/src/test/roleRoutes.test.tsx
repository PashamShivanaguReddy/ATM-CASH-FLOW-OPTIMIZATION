import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { RoleProtectedRoute } from '../routes/RoleProtectedRoute';
import { storage } from '../utils/storage';

const MockAdminOnlyView = () => <div>User Administration Portal</div>;
const MockUnauthorizedView = () => <div>403 Unauthorized View</div>;

describe('Role-Based Routes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('blocks ATM_OPERATOR from accessing admin-only routes', () => {
    storage.setAccessToken('operator-token');
    storage.setUser({
      id: 4,
      email: 'operator@metrobank.com',
      role: 'ATM_OPERATOR',
      bankId: 1,
    });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/users']}>
          <Routes>
            <Route path="/unauthorized" element={<MockUnauthorizedView />} />
            <Route
              path="/users"
              element={
                <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'BANK_ADMIN']}>
                  <MockAdminOnlyView />
                </RoleProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText('403 Unauthorized View')).toBeInTheDocument();
    expect(screen.queryByText('User Administration Portal')).not.toBeInTheDocument();
  });

  it('allows BANK_ADMIN to access admin-only routes', () => {
    storage.setAccessToken('bank-admin-token');
    storage.setUser({
      id: 2,
      email: 'bankadmin@metrobank.com',
      role: 'BANK_ADMIN',
      bankId: 1,
    });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/users']}>
          <Routes>
            <Route path="/unauthorized" element={<MockUnauthorizedView />} />
            <Route
              path="/users"
              element={
                <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'BANK_ADMIN']}>
                  <MockAdminOnlyView />
                </RoleProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText('User Administration Portal')).toBeInTheDocument();
    expect(screen.queryByText('403 Unauthorized View')).not.toBeInTheDocument();
  });

  it('allows SUPER_ADMIN to access any protected route', () => {
    storage.setAccessToken('super-admin-token');
    storage.setUser({
      id: 1,
      email: 'superadmin@atmopt.bank',
      role: 'SUPER_ADMIN',
      bankId: null,
    });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/users']}>
          <Routes>
            <Route path="/unauthorized" element={<MockUnauthorizedView />} />
            <Route
              path="/users"
              element={
                <RoleProtectedRoute allowedRoles={['BANK_MANAGER']}>
                  <MockAdminOnlyView />
                </RoleProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText('User Administration Portal')).toBeInTheDocument();
  });
});
