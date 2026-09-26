import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, type Column } from '../components/ui/Table';

interface AtmRow {
  id: number;
  atmCode: string;
  location: string;
  cashLevel: string;
  status: 'ACTIVE' | 'LOW_CASH' | 'OUT_OF_SERVICE';
  bankId: number;
}

const mockAtms: AtmRow[] = [
  { id: 1, atmCode: 'ATM-001-DWN', location: 'Downtown Financial Center', cashLevel: '$120,000 / $200,000', status: 'ACTIVE', bankId: 1 },
  { id: 2, atmCode: 'ATM-002-AIR', location: 'Airport Terminal 2 Concourse', cashLevel: '$18,500 / $250,000', status: 'LOW_CASH', bankId: 1 },
  { id: 3, atmCode: 'ATM-003-MAL', location: 'Metro West Galleria', cashLevel: '$0 / $180,000', status: 'OUT_OF_SERVICE', bankId: 1 },
  { id: 4, atmCode: 'ATM-004-SUB', location: 'North Suburb Plaza', cashLevel: '$145,000 / $200,000', status: 'ACTIVE', bankId: 2 },
];

export const ATMs: React.FC = () => {
  const columns: Column<AtmRow>[] = [
    {
      key: 'atmCode',
      header: 'ATM Identifier',
      render: (atm) => (
        <div>
          <div className="font-semibold text-slate-900 font-mono">{atm.atmCode}</div>
          <div className="text-xs text-slate-500">{atm.location}</div>
        </div>
      ),
    },
    {
      key: 'cashLevel',
      header: 'Current / Max Capacity',
      render: (atm) => <span className="font-semibold text-slate-800 text-xs">{atm.cashLevel}</span>,
    },
    {
      key: 'status',
      header: 'Operational Status',
      render: (atm) => (
        <Badge
          variant={atm.status === 'ACTIVE' ? 'success' : atm.status === 'LOW_CASH' ? 'warning' : 'danger'}
          dot
        >
          {atm.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'bankId',
      header: 'Bank Scope',
      render: (atm) => <span className="text-xs text-slate-600">Bank #{atm.bankId}</span>,
    },
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ATM Fleet Operations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status, hardware diagnostics, and cash reserve telemetry
          </p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />}>Register New ATM</Button>
      </div>

      <Table
        columns={columns}
        data={mockAtms}
        keyExtractor={(atm) => atm.id}
      />
    </div>
  );
};
