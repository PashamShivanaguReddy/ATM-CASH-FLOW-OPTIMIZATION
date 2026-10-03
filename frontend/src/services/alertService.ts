import { api, assertOptionalResourceId, assertResourceId, unwrapApiResponse } from "./api";
import type { ApiEnvelope } from "../types/api";
import type { AlertFilters, AlertRecord } from "../types/alert";

export async function getAlerts(filters: AlertFilters = {}): Promise<AlertRecord[]> {
  assertOptionalResourceId(filters.atmId, "ATM");
  const { data } = await api.get<ApiEnvelope<AlertRecord[]> | AlertRecord[]>("/alerts", { params: filters });
  return unwrapApiResponse(data);
}

export async function getAlert(id: number): Promise<AlertRecord> {
  const { data } = await api.get<ApiEnvelope<AlertRecord> | AlertRecord>(`/alerts/${assertResourceId(id, "Alert")}`);
  return unwrapApiResponse(data);
}

export async function getAtmAlerts(atmId: number): Promise<AlertRecord[]> {
  const { data } = await api.get<ApiEnvelope<AlertRecord[]> | AlertRecord[]>(`/alerts/atm/${assertResourceId(atmId, "ATM")}`);
  return unwrapApiResponse(data);
}

export async function acknowledgeAlert(id: number): Promise<AlertRecord> {
  const { data } = await api.post<ApiEnvelope<AlertRecord> | AlertRecord>(`/alerts/${assertResourceId(id, "Alert")}/acknowledge`);
  return unwrapApiResponse(data);
}

export async function resolveAlert(id: number): Promise<AlertRecord> {
  const { data } = await api.post<ApiEnvelope<AlertRecord> | AlertRecord>(`/alerts/${assertResourceId(id, "Alert")}/resolve`);
  return unwrapApiResponse(data);
}