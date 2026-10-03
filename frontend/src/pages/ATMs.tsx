import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";
import { Loading } from "../components/ui/Loading";
import { Pagination } from "../components/ui/Pagination";
import { RiskBadge } from "../components/ui/RiskBadge";
import { Select } from "../components/ui/Select";
import { StatusBadge } from "../components/ui/StatusBadge";
import { getAtms } from "../services/atmService";
import { getAllDashboardAtms } from "../services/dashboardService";
import type { AtmListParams, AtmStatus } from "../types/atm";
import { inrFormatter } from "../utils/formatters";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

const statusOptions = ["ACTIVE", "LOW_CASH", "MAINTENANCE", "OUT_OF_SERVICE", "INACTIVE"].map((value) => ({ label: value.replaceAll("_", " "), value }));

export function ATMs() {
	useDocumentTitle("ATMs");
	const [page, setPage] = useState(1);
	const [status, setStatus] = useState<AtmStatus | "">("");
	const [sort, setSort] = useState("createdAt,desc");
	const [search, setSearch] = useState("");
	const params: AtmListParams = { page: page - 1, size: 10, status, sort };
	const atms = useQuery({ queryKey: ["atms", params], queryFn: () => getAtms(params) });
	const riskAtms = useQuery({ queryKey: ["dashboard", "atm-status", "all"], queryFn: getAllDashboardAtms });
	const riskByAtmId = new Map((riskAtms.data ?? []).map((item) => [item.id, item.riskLevel]));
	const filtered = useMemo(() => (atms.data?.items ?? []).filter((atm) => `${atm.atmCode} ${atm.location} ${atm.city} ${atm.state}`.toLowerCase().includes(search.toLowerCase())), [atms.data, search]);

	return (
		<div className="page-enter space-y-6">
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-moss">Operations</p><h1 className="mt-2 text-2xl font-bold text-ink sm:text-[28px]">ATM network</h1><p className="mt-1 text-sm text-muted">Locations, availability, and cash health.</p></div>
				<Link to="/atms/create" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-moss px-4 text-sm font-semibold text-white hover:bg-[#0e5949]"><Plus aria-hidden="true" className="size-4" />Add ATM</Link>
			</header>
			<Card>
				<CardHeader title="ATM directory" description={`${atms.data?.total ?? "—"} locations in the network`} />
				<div className="grid gap-3 px-5 py-5 sm:grid-cols-3 sm:px-6">
					<Input label="Search this page" type="search" placeholder="Code, location, or city" value={search} onChange={(event) => setSearch(event.target.value)} />
					<Select label="Status" value={status} placeholder="All statuses" options={statusOptions} onChange={(event) => { setStatus(event.target.value as AtmStatus | ""); setPage(1); }} />
					<Select label="Sort by" value={sort} options={[{ label: "Recently added", value: "createdAt,desc" }, { label: "ATM code A to Z", value: "atmCode,asc" }, { label: "Cash: highest first", value: "currentCash,desc" }, { label: "Cash: lowest first", value: "currentCash,asc" }]} onChange={(event) => { setSort(event.target.value); setPage(1); }} />
				</div>
				{atms.isPending ? <Loading label="Loading ATM network" /> : atms.isError ? <ErrorState title="ATM network unavailable" message="The ATM service could not be reached." onRetry={() => void atms.refetch()} /> : filtered.length === 0 ? <EmptyState title="No ATMs found" message={search ? "No locations on this page match your search." : "Create an ATM to start managing cash operations."} /> : (
					<div className="overflow-x-auto border-t border-line">
						<table className="w-full min-w-[780px] text-left text-sm">
							<thead className="bg-canvas text-[10px] uppercase text-muted"><tr><th className="px-6 py-3 font-bold">ATM</th><th className="px-4 py-3 font-bold">Location</th><th className="px-4 py-3 font-bold">Status</th><th className="px-4 py-3 font-bold">Risk</th><th className="px-4 py-3 font-bold">Cash position</th><th className="px-6 py-3 text-right font-bold">Actions</th></tr></thead>
							<tbody className="divide-y divide-line">{filtered.map((atm) => (
								<tr key={atm.id} className="hover:bg-canvas/70">
									<td className="px-6 py-4"><span className="font-semibold text-ink">{atm.atmCode}</span><span className="mt-1 block text-xs text-muted">{atm.atmType.replaceAll("_", " ")}</span></td>
									<td className="px-4 py-4 text-ink">{atm.location}<span className="mt-1 block text-xs text-muted">{atm.city}, {atm.state}</span></td>
									<td className="px-4 py-4"><StatusBadge status={atm.status} /></td>
									<td className="px-4 py-4">{riskAtms.isPending ? <span className="text-xs text-muted">Loading</span> : riskByAtmId.has(atm.id) ? <RiskBadge level={riskByAtmId.get(atm.id)!} /> : <span className="text-xs text-muted">Unavailable</span>}</td>
									<td className="px-4 py-4"><span className="font-semibold text-ink">{inrFormatter.format(atm.currentCash)}</span><span className="mt-1 block text-xs text-muted">of {inrFormatter.format(atm.cashCapacity)}</span></td>
									<td className="px-6 py-4"><div className="flex justify-end gap-3"><Link className="text-xs font-semibold text-moss hover:underline" to={`/atms/${atm.id}`}>Details</Link><Link className="text-xs font-semibold text-moss hover:underline" to={`/atms/${atm.id}/edit`}>Edit</Link></div></td>
								</tr>
							))}</tbody>
						</table>
					</div>
				)}
				{!atms.isPending && !atms.isError && atms.data && <Pagination page={page} pageCount={Math.max(1, atms.data.totalPages)} onPageChange={setPage} />}
			</Card>
		</div>
	);
}