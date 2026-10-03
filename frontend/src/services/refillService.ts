import { api, assertResourceId, unwrapApiResponse } from "./api";
import type { ApiEnvelope } from "../types/api";
import type { RefillInput, RefillRecord } from "../types/refill";

export async function getRefills(): Promise<RefillRecord[]> {
  const { data } = await api.get<ApiEnvelope<RefillRecord[]> | RefillRecord[]>("/refills");
  return unwrapApiResponse(data);
}

export async function getRefill(id: number): Promise<RefillRecord> {
  const { data } = await api.get<ApiEnvelope<RefillRecord> | RefillRecord>(`/refills/${assertResourceId(id, "Refill")}`);
  return unwrapApiResponse(data);
}

export async function requestRefill(input: RefillInput): Promise<RefillRecord> {
  assertResourceId(input.atmId, "ATM");
  const { data } = await api.post<ApiEnvelope<RefillRecord> | RefillRecord>("/refills", input);
  return unwrapApiResponse(data);
}

export async function approveRefill(id: number): Promise<RefillRecord> {
  const { data } = await api.post<ApiEnvelope<RefillRecord> | RefillRecord>(`/refills/${assertResourceId(id, "Refill")}/approve`);
  return unwrapApiResponse(data);
}

export async function rejectRefill(id: number): Promise<RefillRecord> {
  const { data } = await api.post<ApiEnvelope<RefillRecord> | RefillRecord>(`/refills/${assertResourceId(id, "Refill")}/reject`);
  return unwrapApiResponse(data);
}

export async function completeRefill(id: number): Promise<RefillRecord> {
  const { data } = await api.post<ApiEnvelope<RefillRecord> | RefillRecord>(`/refills/${assertResourceId(id, "Refill")}/complete`);
  return unwrapApiResponse(data);
}