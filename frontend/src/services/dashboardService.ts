import { api, assertOptionalResourceId, unwrapApiResponse } from "./api";
import type { ApiEnvelope } from "../types/api";
import type { DashboardAtmStatus, DashboardFilters, DashboardPage, DashboardSummary } from "../types/dashboard";

async function getPage<T>(path: string, params: DashboardFilters): Promise<DashboardPage<T>> {
  assertOptionalResourceId(params.bankId, "Bank");
  assertOptionalResourceId(params.atmId, "ATM");
  const { data } = await api.get<ApiEnvelope<DashboardPage<T>> | DashboardPage<T>>(path, { params });
  return unwrapApiResponse(data);
}

export async function getDashboardSummary(params: Pick<DashboardFilters, "bankId" | "from" | "to"> = {}): Promise<DashboardSummary> {
  assertOptionalResourceId(params.bankId, "Bank");
  const { data } = await api.get<ApiEnvelope<DashboardSummary> | DashboardSummary>("/dashboard/summary", { params });
  return unwrapApiResponse(data);
}

export function getDashboardAtms(params: Pick<DashboardFilters, "bankId" | "atmId" | "page" | "size"> = {}) {
  return getPage<DashboardAtmStatus>("/dashboard/atm-status", params);
}

export async function getAllDashboardAtms(): Promise<DashboardAtmStatus[]> {
  const first = await getDashboardAtms({ page: 0, size: 100 });
  const rest = await Promise.all(Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, index) =>
    getDashboardAtms({ page: index + 1, size: 100 }),
  ));
  return [first, ...rest].flatMap((page) => page.content);
}

export async function getDashboardAtmRisk(atmId: number): Promise<DashboardAtmStatus | null> {
  const result = await getDashboardAtms({ atmId, page: 0, size: 1 });
  return result.content[0] ?? null;
}