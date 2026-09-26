import React from 'react';
import { Card } from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';
import { formatRole } from '../utils/formatters';

export const Settings: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 text-left max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Configuration</h1>
        <p className="text-xs text-slate-500 mt-1">
          Security parameters, microservice gateway endpoints, and alert notification triggers
        </p>
      </div>

      <div className="space-y-4">
        <Card title="Security & Authentication Configuration">
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <div>
                <span className="font-semibold text-slate-800 block">Token Inactivity Timeout</span>
                <span className="text-slate-500">Short-lived access token renewal cycle</span>
              </div>
              <span className="font-mono text-slate-700">3600 seconds (60m)</span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100">
              <div>
                <span className="font-semibold text-slate-800 block">Current Security Role</span>
                <span className="text-slate-500">Determines role authorization enforcement</span>
              </div>
              <span className="font-semibold text-blue-600">{user?.role ? formatRole(user.role) : 'Standard'}</span>
            </div>

            <div className="flex justify-between py-2">
              <div>
                <span className="font-semibold text-slate-800 block">Encrypted Storage</span>
                <span className="text-slate-500">SHA-256 refresh token hashing on backend</span>
              </div>
              <span className="font-semibold text-emerald-600">Enforced</span>
            </div>
          </div>
        </Card>

        <Card title="Microservice Endpoints">
          <div className="space-y-2 text-xs font-mono text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>API Gateway:</span>
              <span className="text-slate-900">http://localhost:8080</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Auth Service:</span>
              <span className="text-slate-900">http://localhost:8081</span>
            </div>
            <div className="flex justify-between py-1">
              <span>User Service:</span>
              <span className="text-slate-900">http://localhost:8082</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
