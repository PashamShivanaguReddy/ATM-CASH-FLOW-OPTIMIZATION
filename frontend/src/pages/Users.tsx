import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";
import { Loading } from "../components/ui/Loading";
import { Select } from "../components/ui/Select";
import { deleteUser, getUsers } from "../services/userService";
import { apiErrorMessage } from "../services/api";
import type { UserListParams } from "../types/user";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useState } from "react";

const roleOptions = [
  { label: "Super admin", value: "SUPER_ADMIN" },
  { label: "Bank admin", value: "BANK_ADMIN" },
  { label: "Bank manager", value: "BANK_MANAGER" },
  { label: "ATM operator", value: "ATM_OPERATOR" },
];
const statusOptions = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Locked", value: "LOCKED" },
];

export function Users() {
  useDocumentTitle("Users");
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<UserListParams>({ page: 0, pageSize: 10, search: "", role: "", status: "" });
  const users = useQuery({ queryKey: ["users", filters], queryFn: () => getUsers(filters) });
  const removeUser = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
  const updateFilter = (key: "search" | "role" | "status", value: string) => {
    setFilters((current) => ({ ...current, [key]: value, page: 0 }));
  };
  const totalPages = Math.max(1, Math.ceil((users.data?.total ?? 0) / filters.pageSize));

  return (
    <div className="page-enter space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-moss">Administration</p><h1 className="mt-2 text-2xl font-bold text-ink sm:text-[28px]">Users</h1><p className="mt-1 text-sm text-muted">Manage organization access and role assignments.</p></div>
        <Link to="/users/create" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-moss px-4 text-sm font-semibold text-white hover:bg-[#0e5949]">Create user</Link>
      </header>

      <Card>
        <CardHeader title="User directory" description="Search and filter organization accounts." />
        <div className="grid gap-3 px-5 py-5 sm:grid-cols-3 sm:px-6">
          <Input label="Search" type="search" value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} placeholder="Name or email" />
          <Select label="Role" value={filters.role} placeholder="All roles" options={roleOptions} onChange={(event) => updateFilter("role", event.target.value)} />
          <Select label="Status" value={filters.status} placeholder="All statuses" options={statusOptions} onChange={(event) => updateFilter("status", event.target.value)} />
        </div>
        {users.isPending ? <Loading label="Loading users" /> : users.isError ? (
          <ErrorState title="User directory unavailable" message={apiErrorMessage(users.error, "Could not load users.")} onRetry={() => void users.refetch()} />
        ) : users.data.items.length === 0 ? <EmptyState title="No users found" message="Try changing the search or filters, or create a user when the service is available." /> : (
          <>
            <div className="overflow-x-auto border-t border-line">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-canvas text-[10px] uppercase tracking-[0.08em] text-muted"><tr><th className="px-6 py-3 font-bold">Name</th><th className="px-4 py-3 font-bold">Email</th><th className="px-4 py-3 font-bold">Role</th><th className="px-4 py-3 font-bold">Status</th><th className="px-6 py-3 text-right font-bold">Actions</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {users.data.items.map((user) => (
                    <tr key={user.id} className="hover:bg-canvas/70">
                      <td className="px-6 py-4 font-semibold text-ink">{user.firstName} {user.lastName}</td>
                      <td className="px-4 py-4 text-muted">{user.email}</td>
                      <td className="px-4 py-4 text-ink">{user.role.replaceAll("_", " ")}</td>
                      <td className="px-4 py-4"><span className={`inline-flex rounded px-2 py-1 text-[10px] font-bold uppercase ${user.status === "ACTIVE" ? "bg-[#e7f3ec] text-[#286c4a]" : user.status === "LOCKED" ? "bg-[#fae9e7] text-[#a8443b]" : "bg-[#f1f2f0] text-muted"}`}>{user.status}</span></td>
                      <td className="px-6 py-4"><div className="flex justify-end gap-3"><Link className="text-xs font-semibold text-moss hover:underline" to={`/users/${user.id}`}>Details</Link><Link className="text-xs font-semibold text-moss hover:underline" to={`/users/${user.id}/edit`}>Edit</Link><button type="button" className="text-xs font-semibold text-coral hover:underline" disabled={removeUser.isPending} onClick={() => { if (window.confirm(`Delete ${user.firstName} ${user.lastName}?`)) removeUser.mutate(String(user.id)); }}>Delete</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {removeUser.isError && <p role="alert" className="px-6 pt-3 text-xs text-coral">{apiErrorMessage(removeUser.error, "Could not delete this user.")}</p>}
            <div className="flex items-center justify-between gap-4 border-t border-line px-5 py-4 text-xs text-muted sm:px-6">
              <span>{users.data.total} users</span>
              <div className="flex items-center gap-3"><span>Page {filters.page + 1} of {totalPages}</span><Button variant="secondary" size="sm" disabled={filters.page === 0} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}>Previous</Button><Button variant="secondary" size="sm" disabled={filters.page + 1 >= totalPages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Next</Button></div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
