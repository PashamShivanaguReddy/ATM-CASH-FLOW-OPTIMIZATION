import React from 'react';
import { Outlet } from 'react-router-dom';
import { Landmark, Shield } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/25 ring-4 ring-blue-500/20 mb-4">
          <Landmark className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          ATM Cash Flow Optimization
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Enterprise Cash Inventory, Refill Operations & Microservices Portal
        </p>
      </div>

      <main id="auth-content" className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xl sm:rounded-2xl sm:px-10 border border-slate-200 text-slate-900">
          <Outlet />
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>256-Bit TLS Encrypted Banking Gateway</span>
        </div>
      </main>
    </div>
  );
};
