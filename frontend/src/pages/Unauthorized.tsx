import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { formatRole } from '../utils/formatters';

export const Unauthorized: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as {
    attemptedPath?: string;
    requiredRoles?: string[];
    userRole?: string;
  } | null;

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-6 shadow-md shadow-amber-500/10">
        <ShieldAlert className="w-9 h-9" />
      </div>

      <h1 className="text-2xl font-bold text-slate-900 tracking-tight sm:text-3xl">
        403 — Access Denied
      </h1>
      <p className="mt-2 text-sm text-slate-600 max-w-md">
        You do not possess the necessary security clearance or institutional role to access this module.
      </p>

      <div className="mt-6 w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xs space-y-2 text-xs">
        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500">Your Current Role:</span>
          <span className="font-semibold text-slate-900">
            {user?.role ? formatRole(user.role) : 'Unassigned'}
          </span>
        </div>

        {state?.attemptedPath && (
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Requested Path:</span>
            <span className="font-mono text-slate-700">{state.attemptedPath}</span>
          </div>
        )}

        {state?.requiredRoles && (
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Authorized Roles:</span>
            <span className="font-semibold text-blue-700">
              {state.requiredRoles.map((r) => formatRole(r)).join(', ')}
            </span>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="primary"
          onClick={() => navigate('/dashboard')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Return to Dashboard
        </Button>

        <Button
          variant="outline"
          onClick={() => logout()}
          leftIcon={<LogOut className="w-4 h-4" />}
        >
          Sign Out / Switch Account
        </Button>
      </div>
    </div>
  );
};
