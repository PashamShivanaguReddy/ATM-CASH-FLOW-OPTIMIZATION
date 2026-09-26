import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Table, Column } from '../components/ui/Table';

interface DenomRow {
  atmCode: string;
  d100: string;
  d50: string;
  d20: string;
  d10: string;
  total: string;
}

const mockInventory: DenomRow[] = [
  { atmCode: 'ATM-001-DWN', d100: '800 notes ($80,000)', d50: '500 notes ($25,000)', d20: '700 notes ($14,000)', d10: '100 notes ($1,000)', total: '$120,000' },
  { atmCode: 'ATM-002-AIR', d100: '100 notes ($10,000)', d50: '100 notes ($5,000)', d20: '150 notes ($3,000)', d10: '50 notes ($500)', total: '$18,500' },
  { atmCode: 'ATM-003-MAL', d100: '0 notes ($0)', d50: '0 notes ($0)', d20: '0 notes ($0)', d10: '0 notes ($0)', total: '$0' },
];

export const CashInventory: React.FC = () => {
  const columns: Column<DenomRow>[] = [
    {
      key: 'atmCode',
      header: 'ATM Machine',
      render: (r) => <span className="font-mono text-xs font-semibold text-slate-800">{r.atmCode}</span>,
    },
    { key: 'd100', header: '$100 Cassette' },
    { key: 'd50', header: '$50 Cassette' },
    { key: 'd20', header: '$20 Cassette' },
    { key: 'd10', header: '$10 Cassette' },
    {
      key: 'total',
      header: 'Vault Total',
      render: (r) => <span className="font-bold text-xs text-blue-700">{r.total}</span>,
    },
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Vault Cash Inventory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Physical cassette denomination breakdown and reconciliation tracking
          </p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />}>Audit Physical Vault</Button>
      </div>

      <Table columns={columns} data={mockInventory} keyExtractor={(r) => r.atmCode} />
    </div>
  );
};
