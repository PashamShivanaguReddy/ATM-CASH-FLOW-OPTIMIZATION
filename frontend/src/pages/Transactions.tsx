import React from 'react';
import { Badge } from '../components/ui/Badge';
import { Table, type Column } from '../components/ui/Table';

interface TxRow {
  id: string;
  atmCode: string;
  type: 'WITHDRAWAL' | 'DEPOSIT' | 'BALANCE_INQUIRY';
  amount: string;
  status: 'SUCCESS' | 'FAILED';
  timestamp: string;
}

const mockTx: TxRow[] = [
  { id: 'TX-9021', atmCode: 'ATM-001-DWN', type: 'WITHDRAWAL', amount: '$400.00', status: 'SUCCESS', timestamp: '10 mins ago' },
  { id: 'TX-9022', atmCode: 'ATM-002-AIR', type: 'WITHDRAWAL', amount: '$1,200.00', status: 'SUCCESS', timestamp: '14 mins ago' },
  { id: 'TX-9023', atmCode: 'ATM-001-DWN', type: 'DEPOSIT', amount: '$550.00', status: 'SUCCESS', timestamp: '25 mins ago' },
  { id: 'TX-9024', atmCode: 'ATM-003-MAL', type: 'WITHDRAWAL', amount: '$200.00', status: 'FAILED', timestamp: '42 mins ago' },
];

export const Transactions: React.FC = () => {
  const columns: Column<TxRow>[] = [
    {
      key: 'id',
      header: 'Tx Reference',
      render: (tx) => <span className="font-mono text-xs font-semibold text-slate-800">{tx.id}</span>,
    },
    {
      key: 'atmCode',
      header: 'ATM Machine',
      render: (tx) => <span className="font-mono text-xs text-blue-600">{tx.atmCode}</span>,
    },
    {
      key: 'type',
      header: 'Operation Type',
      render: (tx) => <Badge variant="neutral">{tx.type}</Badge>,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (tx) => <span className="font-semibold text-xs text-slate-900">{tx.amount}</span>,
    },
    {
      key: 'status',
      header: 'Result',
      render: (tx) => (
        <Badge variant={tx.status === 'SUCCESS' ? 'success' : 'danger'} dot>
          {tx.status}
        </Badge>
      ),
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (tx) => <span className="text-xs text-slate-500">{tx.timestamp}</span>,
    },
  ];

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Transactions</h1>
        <p className="text-xs text-slate-500 mt-1">
          Cryptographically audited cash dispenses, deposits, and hardware transaction logs
        </p>
      </div>

      <Table columns={columns} data={mockTx} keyExtractor={(tx) => tx.id} />
    </div>
  );
};
