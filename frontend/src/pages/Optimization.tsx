import React from 'react';
import { Sliders, DollarSign, Truck, Sparkles } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const Optimization: React.FC = () => {
  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cash Optimization Engine</h1>
          <p className="text-xs text-slate-500 mt-1">
            Minimizing idle holding cost and transportation overhead while eliminating cash-outs
          </p>
        </div>
        <Button leftIcon={<Sparkles className="w-4 h-4" />}>Run Optimization Solver</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Holding Cost Savings</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">$32,450 / mo</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Refill Trip Reductions</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">-18% Dispatches</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Cash Availability SLA</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">99.94%</p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Linear Programming Optimization Formulation">
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            The optimization microservice solves mixed-integer linear programs (MILP) balancing:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-700">
            <li><strong>Holding cost:</strong> Daily interest lost on unwithdrawn idle cash sitting inside vaults.</li>
            <li><strong>Transit cost:</strong> Fixed dispatch and security escort fees per replenishment route.</li>
            <li><strong>Cash-out penalty:</strong> Reputation risk and regulatory penalties for downtime.</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};
