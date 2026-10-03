import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Loading } from "../components/ui/Loading";
import { ATMs } from "../pages/ATMs";
import { AtmDetails } from "../pages/AtmDetails";
import { AtmForm } from "../pages/AtmForm";
import { CashInventory } from "../pages/CashInventory";
import { Login } from "../pages/Login";
import { ForgotPassword } from "../pages/ForgotPassword";
import { Optimization } from "../pages/Optimization";
import { Refills } from "../pages/Refills";
import { Reports } from "../pages/Reports";
import { Settings } from "../pages/Settings";
import { Transactions } from "../pages/Transactions";
import { Users } from "../pages/Users";
import { UserDetails } from "../pages/UserDetails";
import { UserForm } from "../pages/UserForm";
import { Unauthorized } from "../pages/Unauthorized";
import { ProtectedRoute } from "../components/routing/ProtectedRoute";
import { RoleProtectedRoute } from "../components/routing/RoleProtectedRoute";
import type { UserRole } from "../types/auth";
import { AuthLayout } from "../layouts/AuthLayout";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { MainLayout } from "../layouts/MainLayout";

const Dashboard = lazy(() => import("../pages/Dashboard").then((module) => ({ default: module.Dashboard })));
const Alerts = lazy(() => import("../pages/Alerts").then((module) => ({ default: module.Alerts })));
const Predictions = lazy(() => import("../pages/Predictions").then((module) => ({ default: module.Predictions })));

const allRoles: UserRole[] = ["SUPER_ADMIN", "BANK_ADMIN", "BANK_MANAGER", "ATM_OPERATOR"];
const bankAdmins: UserRole[] = ["SUPER_ADMIN", "BANK_ADMIN"];
const managers: UserRole[] = ["SUPER_ADMIN", "BANK_MANAGER"];
const operations: UserRole[] = ["SUPER_ADMIN", "BANK_ADMIN", "BANK_MANAGER"];
const cashOperations: UserRole[] = ["SUPER_ADMIN", "BANK_ADMIN", "ATM_OPERATOR"];
const refillOperations: UserRole[] = ["SUPER_ADMIN", "BANK_ADMIN", "BANK_MANAGER", "ATM_OPERATOR"];

export function AppRoutes() {
  return (
    <Suspense fallback={<Loading label="Preparing workspace" />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="login" element={<AuthLayout />}><Route index element={<Login />} /></Route>
          <Route path="forgot-password" element={<AuthLayout />}><Route index element={<ForgotPassword />} /></Route>
          <Route path="unauthorized" element={<Unauthorized />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route element={<RoleProtectedRoute allowedRoles={allRoles} />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="atms" element={<ATMs />} />
                <Route path="atms/create" element={<AtmForm />} />
                <Route path="atms/:id/edit" element={<AtmForm />} />
                <Route path="atms/:id" element={<AtmDetails />} />
              </Route>
              <Route element={<RoleProtectedRoute allowedRoles={operations} />}><Route path="transactions" element={<Transactions />} /></Route>
              <Route element={<RoleProtectedRoute allowedRoles={cashOperations} />}>
                <Route path="cash-inventory" element={<CashInventory />} />
              </Route>
              <Route element={<RoleProtectedRoute allowedRoles={refillOperations} />}>
                <Route path="refills" element={<Refills />} />
              </Route>
              <Route element={<RoleProtectedRoute allowedRoles={managers} />}>
                <Route path="predictions" element={<Predictions />} />
                <Route path="alerts" element={<Alerts />} />
                <Route path="optimization" element={<Optimization />} />
              </Route>
              <Route element={<RoleProtectedRoute allowedRoles={bankAdmins} />}>
                <Route path="users" element={<Users />} />
                <Route path="users/create" element={<UserForm />} />
                <Route path="users/:id" element={<UserDetails />} />
                <Route path="users/:id/edit" element={<UserForm />} />
                <Route path="reports" element={<Reports />} />
              </Route>
              <Route element={<RoleProtectedRoute allowedRoles={["SUPER_ADMIN"]} />}><Route path="settings" element={<Settings />} /></Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}