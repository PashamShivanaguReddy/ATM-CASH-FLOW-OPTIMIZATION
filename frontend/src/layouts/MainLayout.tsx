import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Landmark } from 'lucide-react';

export const MainLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white shadow-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
              <Landmark className="h-5 w-5" />
            </div>
            <span className="font-bold text-base tracking-tight text-slate-900">
              ATM Cash Flow Optimization
            </span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4">
          &copy; {new Date().getFullYear()} ATM Cash Flow Optimization Platform. All rights reserved.
        </div>
      </footer>
    </div>
  );
};
