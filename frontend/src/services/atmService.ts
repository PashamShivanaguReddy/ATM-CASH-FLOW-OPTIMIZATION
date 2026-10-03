import { api, assertOptionalResourceId, assertResourceId, unwrapApiResponse } from "./api";
import type { ApiEnvelope, PaginatedResponse } from "../types/api";
import type { AtmInput, AtmListParams, AtmPage, AtmRecord } from "../types/atm";

interface SpringPage<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export async function getAtms(params: AtmListParams): Promise<AtmPage> {
  assertOptionalResourceId(params.bankId, "Bank");
  const { data } = await api.get<ApiEnvelope<SpringPage<AtmRecord> | PaginatedResponse<AtmRecord>> | SpringPage<AtmRecord> | PaginatedResponse<AtmRecord>>("/atms", { params });
  const page = unwrapApiResponse(data);
  if ("content" in page) return { items: page.content, page: page.number, pageSize: page.size, total: page.totalElements, totalPages: page.totalPages };
  return { ...page, totalPages: Math.ceil(page.total / page.pageSize) };
}

export async function getAtm(id: string | number): Promise<AtmRecord> {
  const { data } = await api.get<ApiEnvelope<AtmRecord> | AtmRecord>(`/atms/${assertResourceId(id, "ATM")}`);
  return unwrapApiResponse(data);
}

export async function createAtm(input: AtmInput): Promise<AtmRecord> {
  const { data } = await api.post<ApiEnvelope<AtmRecord> | AtmRecord>("/atms", input);
  return unwrapApiResponse(data);
}

export async function updateAtm(id: string | number, input: AtmInput): Promise<AtmRecord> {
  const { data } = await api.put<ApiEnvelope<AtmRecord> | AtmRecord>(`/atms/${assertResourceId(id, "ATM")}`, input);
  return unwrapApiResponse(data);
}

export async function getAllAtms(): Promise<AtmRecord[]> {
  const first = await getAtms({ page: 0, size: 100, sort: "atmCode,asc" });
  const remaining = await Promise.all(Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, index) =>
    getAtms({ page: index + 1, size: 100, sort: "atmCode,asc" }),
  ));
  return [first, ...remaining].flatMap((page) => page.items);
}