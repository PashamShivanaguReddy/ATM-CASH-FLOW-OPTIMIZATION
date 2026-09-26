import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ProtectedRoute } from '../routes/ProtectedRoute';
import { storage } from '../utils/storage';

const MockPrivateComponent = () => <div>Protected Dashboard View</div>;
const MockLoginComponent = () => <div>Login Screen</div>;

describe('Protected Routes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirects unauthenticated users to /login', () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/login" element={<MockLoginComponent />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<MockPrivateComponent />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText('Login Screen')).toBeInTheDocument();
    expect(screen.queryByText('Protected Dashboard View')).not.toBeInTheDocument();
  });

  it('permits authenticated users to access protected views', () => {
    storage.setAccessToken('valid-jwt-token');
    storage.setUser({
      id: 1,
      email: 'operator@metrobank.com',
      role: 'ATM_OPERATOR',
      bankId: 1,
    });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/login" element={<MockLoginComponent />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<MockPrivateComponent />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText('Protected Dashboard View')).toBeInTheDocument();
    expect(screen.queryByText('Login Screen')).not.toBeInTheDocument();
  });
});
