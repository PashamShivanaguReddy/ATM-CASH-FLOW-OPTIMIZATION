import { api, assertResourceId, unwrapApiResponse } from "./api";
import type { ApiEnvelope } from "../types/api";
import type { CashInventoryRecord } from "../types/cash";

export async function getCashInventory(atmId: number): Promise<CashInventoryRecord> {
  const { data } = await api.get<ApiEnvelope<CashInventoryRecord> | CashInventoryRecord>(`/atms/${assertResourceId(atmId, "ATM")}/cash`);
  return unwrapApiResponse(data);
}