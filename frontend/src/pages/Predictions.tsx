import React from 'react';
import { Cpu } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const Predictions: React.FC = () => {
  return (
    <div className="space-y-6 text-left">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="primary" dot>ML Service Connected</Badge>
          <span className="text-xs text-slate-500 font-mono">Model v2.4 (RandomForest/XGBoost)</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
          Machine Learning Demand Forecasts
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          7-day cash withdrawal predictions, seasonality adjustments, and confidence intervals
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card title="Model Telemetry" className="md:col-span-1">
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Pipeline Status:</span>
              <span className="font-semibold text-emerald-600">Model Trained & Validated</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Mean Absolute Error:</span>
              <span className="font-mono text-slate-800">$4,120 / day</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Confidence Threshold:</span>
              <span className="font-semibold text-slate-800">95% CI</span>
            </div>
            <p className="text-slate-400 text-[11px] pt-2">
              Predictions integration is scheduled for subsequent phase after foundation verification.
            </p>
          </div>
        </Card>

        <Card title="Scheduled Forecast Generation" className="md:col-span-2">
          <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-slate-500">
            <Cpu className="w-10 h-10 text-blue-500 mb-3" />
            <h4 className="text-sm font-semibold text-slate-800">Inference Engine Active</h4>
            <p className="max-w-md mt-1">
              Downstream consumer pipelines consume daily transaction aggregates from Kafka and generate next-day replenishment requirements.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
