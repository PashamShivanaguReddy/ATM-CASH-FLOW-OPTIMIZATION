import React from 'react';
import {
  Building2,
  Coins,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { formatRole } from '../utils/formatters';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 text-left">
      <div className="rounded-2xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 p-6 sm:p-8 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="primary" className="bg-blue-500/20 text-blue-200 border-blue-400/30">
                Institutional Terminal Active
              </Badge>
              {user?.bankId && (
                <Badge variant="info" className="bg-sky-500/20 text-sky-200 border-sky-400/30">
                  Bank #{user.bankId}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl mt-2">
              Welcome back, {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email}
            </h1>
            <p className="mt-1 text-sm text-blue-200">
              Role: <strong className="text-white">{user?.role ? formatRole(user.role) : 'Standard'}</strong> | ATM Cash Management and Forecasting System
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg bg-blue-950/40 px-3 py-2 text-xs border border-blue-700/50">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>JWT Session Verified</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Fleet Status
              </span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">48 / 50</h3>
              <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>96% Operational</span>
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Cash In Fleet
              </span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">$4,820,000</h3>
              <p className="text-xs text-slate-500 mt-1">Across all authorized vaults</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <Coins className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Alerts
              </span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">3</h3>
              <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>2 Low-Cash Thresholds</span>
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pending Refills
              </span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">5</h3>
              <p className="text-xs text-slate-500 mt-1">Scheduled for today</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
              <RefreshCw className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Quick Operational Actions">
          <div className="space-y-3 text-xs">
            <p className="text-slate-600">
              Access role-authorized operations based on your institutional security clearance:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {(user?.role === 'SUPER_ADMIN' || user?.role === 'BANK_ADMIN') && (
                <a
                  href="/users"
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-colors block"
                >
                  <strong className="text-slate-900 block">Manage Users</strong>
                  <span className="text-slate-500">Provision roles and branch access</span>
                </a>
              )}
              <a
                href="/atms"
                className="p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-colors block"
              >
                <strong className="text-slate-900 block">ATM Fleet</strong>
                <span className="text-slate-500">Inspect machine status and cash levels</span>
              </a>
              {(user?.role === 'SUPER_ADMIN' || user?.role === 'BANK_ADMIN' || user?.role === 'ATM_OPERATOR') && (
                <a
                  href="/cash-inventory"
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-colors block"
                >
                  <strong className="text-slate-900 block">Cash Inventory</strong>
                  <span className="text-slate-500">Denomination vault counts</span>
                </a>
              )}
              {(user?.role === 'SUPER_ADMIN' || user?.role === 'BANK_MANAGER') && (
                <a
                  href="/predictions"
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-colors block"
                >
                  <strong className="text-slate-900 block">Cash Forecasts</strong>
                  <span className="text-slate-500">ML demand prediction insights</span>
                </a>
              )}
            </div>
          </div>
        </Card>

        <Card title="Microservice Architecture Status">
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Auth Service (JWT & Role RBAC)</span>
              <Badge variant="success" dot>Operational</Badge>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600 font-medium">User Service (Directory & Profiles)</span>
              <Badge variant="success" dot>Operational</Badge>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600 font-medium">ATM & Transaction Service</span>
              <Badge variant="info" dot>Foundation Active</Badge>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-600 font-medium">ML Prediction & Optimization Engine</span>
              <Badge variant="neutral" dot>Phase 3/4 Ready</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
