export type TransactionType = "WITHDRAWAL" | "DEPOSIT" | "BALANCE_INQUIRY" | "OTHER";

export interface TransactionRecord {
  id: number;
  transactionId: string;
  atmId: number;
  transactionType: TransactionType;
  amount: number;
  timestamp: string;
  success: boolean;
  cardType: string | null;
  createdAt: string;
}

export interface TransactionListParams {
  page: number;
  size: number;
  sort: string;
  atmId?: number;
  from?: string;
  to?: string;
  type?: TransactionType | "";
  status?: boolean;
}

export interface TransactionPage {
  items: TransactionRecord[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}