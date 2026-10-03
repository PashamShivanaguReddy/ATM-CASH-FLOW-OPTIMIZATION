import { api, assertOptionalResourceId, unwrapApiResponse } from "./api";
import type { ApiEnvelope } from "../types/api";
import type {
  DashboardAlert,
  DashboardDemand,
  DashboardFilters,
  DashboardPage,
  DashboardPrediction,
  DashboardRecommendation,
  DashboardRefill,
  DashboardTransaction,
} from "../types/dashboard";

async function getPage<T>(path: string, params: DashboardFilters): Promise<DashboardPage<T>> {
  assertOptionalResourceId(params.bankId, "Bank");
  assertOptionalResourceId(params.atmId, "ATM");
  const { data } = await api.get<ApiEnvelope<DashboardPage<T>> | DashboardPage<T>>(path, { params });
  return unwrapApiResponse(data);
}

type DatedFilters = Required<Pick<DashboardFilters, "from" | "to">> & Pick<DashboardFilters, "bankId" | "atmId" | "page" | "size">;
type DatedRange = Required<Pick<DashboardFilters, "from" | "to">> & Pick<DashboardFilters, "bankId" | "atmId">;

async function getAllPages<T>(fetchPage: (page: number) => Promise<DashboardPage<T>>): Promise<T[]> {
  const first = await fetchPage(0);
  const rest = await Promise.all(Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, index) => fetchPage(index + 1)));
  return [first, ...rest].flatMap((page) => page.content);
}

export function getCashDemand(params: DatedFilters) {
  return getPage<DashboardDemand>("/dashboard/cash-demand", params);
}

export function getDashboardTransactions(params: DatedFilters) {
  return getPage<DashboardTransaction>("/dashboard/transactions", params);
}

export function getAllDashboardTransactions(params: DatedRange) {
  return getAllPages((page) => getDashboardTransactions({ ...params, page, size: 100 }));
}

export function getDashboardPredictions(params: DatedFilters) {
  return getPage<DashboardPrediction>("/dashboard/predictions", params);
}

export function getAllDashboardPredictions(params: DatedRange) {
  return getAllPages((page) => getDashboardPredictions({ ...params, page, size: 100 }));
}

export function getAllCashDemand(params: DatedRange) {
  return getAllPages((page) => getCashDemand({ ...params, page, size: 100 }));
}

export function getDashboardAlerts(params: DashboardFilters = {}) {
  return getPage<DashboardAlert>("/dashboard/alerts", params);
}

export function getDashboardRefills(params: DashboardFilters = {}) {
  return getPage<DashboardRefill>("/dashboard/refills", params);
}

export function getDashboardRecommendations(params: DashboardFilters = {}) {
  return getPage<DashboardRecommendation>("/dashboard/recommendations", params);
}