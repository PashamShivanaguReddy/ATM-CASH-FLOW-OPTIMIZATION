import type { Key, ReactNode } from "react";
import { EmptyState } from "./EmptyState";

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => Key;
  emptyTitle?: string;
  emptyMessage?: string;
}

export function Table<T>({ columns, rows, rowKey, emptyTitle, emptyMessage }: TableProps<T>) {
  if (!rows.length) return <EmptyState title={emptyTitle} message={emptyMessage} />;

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[620px] border-collapse text-left">
        <thead><tr className="border-y border-line bg-[#fafbf9]">{columns.map((column) => <th key={column.key} scope="col" className={`px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-muted ${column.className ?? ""}`}>{column.header}</th>)}</tr></thead>
        <tbody>{rows.map((row) => <tr key={rowKey(row)} className="border-b border-line last:border-0">{columns.map((column) => <td key={column.key} className={`px-5 py-3.5 text-sm text-ink ${column.className ?? ""}`}>{column.render(row)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}