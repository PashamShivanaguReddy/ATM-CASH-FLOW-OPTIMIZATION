import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleProtectedRoute } from './RoleProtectedRoute';

import { Login } from '../pages/Login';
import { ForgotPassword } from '../pages/ForgotPassword';
import { Unauthorized } from '../pages/Unauthorized';
import { Dashboard } from '../pages/Dashboard';
import { ATMs } from '../pages/ATMs';
import { Transactions } from '../pages/Transactions';
import { CashInventory } from '../pages/CashInventory';
import { Refills } from '../pages/Refills';
import { Predictions } from '../pages/Predictions';
import { Alerts } from '../pages/Alerts';
import { Optimization } from '../pages/Optimization';
import { Settings } from '../pages/Settings';

import { UserList } from '../pages/users/UserList';
import { UserDetail } from '../pages/users/UserDetail';
import { UserCreate } from '../pages/users/UserCreate';
import { UserEdit } from '../pages/users/UserEdit';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route
            path="/users"
            element={
              <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'BANK_ADMIN']}>
                <UserList />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/users/create"
            element={
              <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'BANK_ADMIN']}>
                <UserCreate />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/users/:id"
            element={
              <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'BANK_ADMIN']}>
                <UserDetail />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/users/:id/edit"
            element={
              <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'BANK_ADMIN']}>
                <UserEdit />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/atms"
            element={
              <RoleProtectedRoute
                allowedRoles={[
                  'SUPER_ADMIN',
                  'BANK_ADMIN',
                  'BANK_MANAGER',
                  'ATM_OPERATOR',
                ]}
              >
                <ATMs />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/transactions"
            element={
              <RoleProtectedRoute
                allowedRoles={['SUPER_ADMIN', 'BANK_ADMIN', 'BANK_MANAGER']}
              >
                <Transactions />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/cash-inventory"
            element={
              <RoleProtectedRoute
                allowedRoles={['SUPER_ADMIN', 'BANK_ADMIN', 'ATM_OPERATOR']}
              >
                <CashInventory />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/refills"
            element={
              <RoleProtectedRoute
                allowedRoles={['SUPER_ADMIN', 'BANK_ADMIN', 'ATM_OPERATOR']}
              >
                <Refills />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/predictions"
            element={
              <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'BANK_MANAGER']}>
                <Predictions />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/alerts"
            element={
              <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'BANK_MANAGER']}>
                <Alerts />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/optimization"
            element={
              <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'BANK_MANAGER']}>
                <Optimization />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'BANK_ADMIN']}>
                <Settings />
              </RoleProtectedRoute>
            }
          />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
