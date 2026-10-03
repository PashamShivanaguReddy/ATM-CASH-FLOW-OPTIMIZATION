import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { ErrorState } from "../components/ui/ErrorState";
import { Loading } from "../components/ui/Loading";
import { apiErrorMessage } from "../services/api";
import { getUser } from "../services/userService";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function UserDetails() {
  useDocumentTitle("User details");
  const { id = "" } = useParams();
  const user = useQuery({ queryKey: ["user", id], queryFn: () => getUser(id), enabled: Boolean(id) });

  if (user.isPending) return <Loading label="Loading user details" />;
  if (user.isError) return <ErrorState title="User details unavailable" message={apiErrorMessage(user.error, "Could not load this user.")} onRetry={() => void user.refetch()} />;

  return (
    <div className="page-enter space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-moss">User directory</p><h1 className="mt-2 text-2xl font-bold text-ink">{user.data.firstName} {user.data.lastName}</h1><p className="mt-1 text-sm text-muted">Account details and assigned access.</p></div>
        <div className="flex gap-2"><Link to="/users" className="inline-flex h-10 items-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-canvas">Back</Link><Link to={`/users/${id}/edit`} className="inline-flex h-10 items-center rounded-md bg-moss px-4 text-sm font-semibold text-white hover:bg-[#0e5949]">Edit user</Link></div>
      </header>
      <Card className="divide-y divide-line">
        {[
          ["Email", user.data.email],
          ["Role", user.data.role.replaceAll("_", " ")],
          ["Status", user.data.status],
          ["Phone", user.data.phone || "Not provided"],
          ["Bank ID", user.data.bankId == null ? "Not assigned" : String(user.data.bankId)],
        ].map(([label, value]) => <div key={label} className="grid gap-1 px-5 py-4 sm:grid-cols-[180px_1fr] sm:px-6"><span className="text-xs font-semibold text-muted">{label}</span><span className="text-sm text-ink">{value}</span></div>)}
      </Card>
    </div>
  );
}
