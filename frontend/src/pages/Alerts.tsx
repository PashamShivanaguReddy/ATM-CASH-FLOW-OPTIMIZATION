import React from 'react';
import { Badge } from '../components/ui/Badge';
import { Table, type Column } from '../components/ui/Table';

interface AlertItem {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  atmCode: string;
  timestamp: string;
}

const mockAlerts: AlertItem[] = [
  { id: 'ALT-401', severity: 'CRITICAL', title: 'Cash level critically low (< 10% capacity)', atmCode: 'ATM-003-MAL', timestamp: '12 mins ago' },
  { id: 'ALT-402', severity: 'WARNING', title: 'Predicted cash-out within next 6 hours', atmCode: 'ATM-002-AIR', timestamp: '35 mins ago' },
  { id: 'ALT-403', severity: 'INFO', title: 'Scheduled weekly cassette calibration due', atmCode: 'ATM-001-DWN', timestamp: '2 hours ago' },
];

export const Alerts: React.FC = () => {
  const columns: Column<AlertItem>[] = [
    {
      key: 'severity',
      header: 'Severity',
      render: (a) => (
        <Badge
          variant={a.severity === 'CRITICAL' ? 'danger' : a.severity === 'WARNING' ? 'warning' : 'info'}
          dot
        >
          {a.severity}
        </Badge>
      ),
    },
    {
      key: 'title',
      header: 'Alert Message',
      render: (a) => <span className="font-semibold text-xs text-slate-800">{a.title}</span>,
    },
    {
      key: 'atmCode',
      header: 'ATM Machine',
      render: (a) => <span className="font-mono text-xs text-blue-600">{a.atmCode}</span>,
    },
    {
      key: 'timestamp',
      header: 'Triggered',
      render: (a) => <span className="text-xs text-slate-500">{a.timestamp}</span>,
    },
  ];

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System & Vault Alerts</h1>
        <p className="text-xs text-slate-500 mt-1">
          Real-time threshold breaches, cash-out warnings, and hardware alerts
        </p>
      </div>

      <Table columns={columns} data={mockAlerts} keyExtractor={(a) => a.id} />
    </div>
  );
};
