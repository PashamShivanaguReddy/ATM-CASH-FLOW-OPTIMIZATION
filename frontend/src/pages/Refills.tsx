import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, type Column } from '../components/ui/Table';

interface RefillRow {
  id: string;
  atmCode: string;
  requestedAmount: string;
  assignedOperator: string;
  status: 'PENDING_APPROVAL' | 'DISPATCHED' | 'COMPLETED';
}

const mockRefills: RefillRow[] = [
  { id: 'REF-101', atmCode: 'ATM-002-AIR', requestedAmount: '$150,000', assignedOperator: 'Kyle Reese', status: 'DISPATCHED' },
  { id: 'REF-102', atmCode: 'ATM-003-MAL', requestedAmount: '$120,000', assignedOperator: 'David Kim', status: 'PENDING_APPROVAL' },
  { id: 'REF-100', atmCode: 'ATM-001-DWN', requestedAmount: '$80,000', assignedOperator: 'Kyle Reese', status: 'COMPLETED' },
];

export const Refills: React.FC = () => {
  const columns: Column<RefillRow>[] = [
    {
      key: 'id',
      header: 'Refill ID',
      render: (r) => <span className="font-mono text-xs font-semibold text-slate-800">{r.id}</span>,
    },
    {
      key: 'atmCode',
      header: 'ATM Machine',
      render: (r) => <span className="font-mono text-xs text-blue-600">{r.atmCode}</span>,
    },
    { key: 'requestedAmount', header: 'Amount' },
    { key: 'assignedOperator', header: 'Assigned Operator' },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge
          variant={r.status === 'COMPLETED' ? 'success' : r.status === 'DISPATCHED' ? 'info' : 'warning'}
          dot
        >
          {r.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Refill Replenishment Operations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Armored car routing, field technician replenishment, and vault sign-offs
          </p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />}>Dispatch Refill</Button>
      </div>

      <Table columns={columns} data={mockRefills} keyExtractor={(r) => r.id} />
    </div>
  );
};
