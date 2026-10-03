import { api, assertOptionalResourceId, assertResourceId, unwrapApiResponse } from "./api";
import type { ApiEnvelope } from "../types/api";
import type { DemandPeriod, TransactionSummary } from "../types/prediction";
import type { TransactionListParams, TransactionPage, TransactionRecord } from "../types/transaction";

interface SpringPage<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export async function getTransactions(params: TransactionListParams): Promise<TransactionPage> {
  assertOptionalResourceId(params.atmId, "ATM");
  const { data } = await api.get<ApiEnvelope<SpringPage<TransactionRecord>> | SpringPage<TransactionRecord>>("/transactions", { params });
  const page = unwrapApiResponse(data);
  return { items: page.content, page: page.number, pageSize: page.size, total: page.totalElements, totalPages: page.totalPages };
}

export async function getTransaction(id: string | number): Promise<TransactionRecord> {
  const { data } = await api.get<ApiEnvelope<TransactionRecord> | TransactionRecord>(`/transactions/${assertResourceId(id, "Transaction")}`);
  return unwrapApiResponse(data);
}

export async function findTransaction(transactionId: string): Promise<TransactionRecord> {
  const value = typeof transactionId === "string" ? transactionId.trim() : "";
  if (!value) throw new Error("Transaction ID is required.");
  const { data } = await api.get<ApiEnvelope<TransactionRecord> | TransactionRecord>(`/transactions/transaction/${encodeURIComponent(value)}`);
  return unwrapApiResponse(data);
}

export async function getDailyDemandSummary(atmId: number, from: string, to: string): Promise<DemandPeriod[]> {
  const { data } = await api.get<ApiEnvelope<DemandPeriod[]> | DemandPeriod[]>(`/transactions/atm/${assertResourceId(atmId, "ATM")}/daily-summary`, { params: { from, to } });
  return unwrapApiResponse(data);
}

export async function getTransactionSummary(atmId: number, from: string, to: string): Promise<TransactionSummary> {
  const { data } = await api.get<ApiEnvelope<TransactionSummary> | TransactionSummary>(`/transactions/atm/${assertResourceId(atmId, "ATM")}/summary`, { params: { from, to } });
  return unwrapApiResponse(data);
}