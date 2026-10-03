import { api, assertResourceId } from "./api";
import type { UserInput, UserListParams, UserListResult, UserRecord } from "../types/user";

interface ApiEnvelope<T> {
  data: T;
}

interface SpringPage<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
}

type UserPage = UserListResult | SpringPage<UserRecord>;

function normalizePage(page: UserPage): UserListResult {
  if ("content" in page) {
    return { items: page.content, page: page.number, pageSize: page.size, total: page.totalElements };
  }
  return page;
}

export async function getUsers(params: UserListParams): Promise<UserListResult> {
  const { data } = await api.get<ApiEnvelope<UserPage>>("/users", { params });
  return normalizePage(data.data);
}

export async function getUser(id: string): Promise<UserRecord> {
  const { data } = await api.get<ApiEnvelope<UserRecord>>(`/users/${assertResourceId(id, "User")}`);
  return data.data;
}

export async function createUser(input: UserInput): Promise<UserRecord> {
  const { data } = await api.post<ApiEnvelope<UserRecord>>("/users", input);
  return data.data;
}

export async function updateUser(id: string, input: UserInput): Promise<UserRecord> {
  const { data } = await api.put<ApiEnvelope<UserRecord>>(`/users/${assertResourceId(id, "User")}`, input);
  return data.data;
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${assertResourceId(id, "User")}`);
}