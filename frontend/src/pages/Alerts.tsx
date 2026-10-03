import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Loading } from "../components/ui/Loading";
import { Modal } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";
import { useToast } from "../context/ToastContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { apiErrorMessage } from "../services/api";
import { getAllAtms } from "../services/atmService";
import { acknowledgeAlert, getAlert, getAlerts, resolveAlert } from "../services/alertService";
import type { AlertRecord, AlertStatus } from "../types/alert";

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });
const statuses: AlertStatus[] = ["ACTIVE", "ACKNOWLEDGED", "RESOLVED"];
const severityTone: Record<AlertRecord["severity"], string> = {
	LOW: "border-[#d8e8e1] bg-[#eff7f2] text-[#28644d]",
	MEDIUM: "border-[#d5e2eb] bg-[#eff5f9] text-[#38677e]",
	HIGH: "border-[#efdfbf] bg-[#fff8e9] text-[#805415]",
	CRITICAL: "border-[#f0d3ce] bg-[#fff0ed] text-[#a8443b]",
};

export function Alerts() {
	useDocumentTitle("Alerts");
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const [status, setStatus] = useState<AlertStatus | "">("");
	const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);
	const filters = status ? { status } : {};
	const alerts = useQuery({ queryKey: ["alerts", filters], queryFn: () => getAlerts(filters) });
	const atms = useQuery({ queryKey: ["atms", "alert-labels"], queryFn: getAllAtms });
	const details = useQuery({ queryKey: ["alert", selectedAlertId], queryFn: () => getAlert(selectedAlertId!), enabled: selectedAlertId !== null });
	const changeStatus = useMutation({
		mutationFn: ({ id, action }: { id: number; action: "acknowledge" | "resolve" }) => action === "acknowledge" ? acknowledgeAlert(id) : resolveAlert(id),
		onSuccess: async (updated) => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["alerts"] }),
				queryClient.invalidateQueries({ queryKey: ["alert", updated.id] }),
				queryClient.invalidateQueries({ queryKey: ["atm-alerts", updated.atmId] }),
			]);
			showToast(`Alert ${updated.status.toLowerCase()}.`);
		},
		onError: async (error, variables) => {
			let current: AlertRecord | undefined;
			try { current = await getAlert(variables.id); } catch {}
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["alerts"] }),
				queryClient.invalidateQueries({ queryKey: ["alert", variables.id] }),
				...(current ? [queryClient.invalidateQueries({ queryKey: ["atm-alerts", current.atmId] })] : []),
			]);
			const expected = variables.action === "acknowledge" ? "ACKNOWLEDGED" : "RESOLVED";
			if (current?.status === expected) showToast(`Alert is already ${current.status.toLowerCase()}.`);
			else showToast(current && current.status !== "ACTIVE" ? `Alert state refreshed: ${current.status.toLowerCase()}.` : apiErrorMessage(error, "Alert status could not be confirmed."), "error");
		},
	});
	const atmNames = new Map((atms.data ?? []).map((atm) => [atm.id, `${atm.atmCode} · ${atm.city}`]));

	return (
		<div className="page-enter space-y-6">
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-moss">Network operations</p><h1 className="mt-2 text-2xl font-bold text-ink sm:text-[28px]">Alerts</h1><p className="mt-1 text-sm text-muted">Review cash, demand, service, and activity alerts.</p></div>
				<Button variant="secondary" onClick={() => void alerts.refetch()} disabled={alerts.isFetching} aria-label="Refresh alerts"><RefreshCw aria-hidden="true" className={`size-4 ${alerts.isFetching ? "animate-spin" : ""}`} />Refresh</Button>
			</header>
			<Card>
				<CardHeader title="Alert queue" description={alerts.data ? `${alerts.data.length} alert${alerts.data.length === 1 ? "" : "s"}` : "Current network alerts"} />
				<div className="max-w-xs px-5 py-5 sm:px-6"><Select label="Status" value={status} placeholder="All statuses" options={statuses.map((value) => ({ label: value.replaceAll("_", " "), value }))} onChange={(event) => setStatus(event.target.value as AlertStatus | "")} /></div>
				{alerts.isPending ? <Loading label="Loading alerts" /> : alerts.isError ? <ErrorState title="Alerts unavailable" message="The alert service could not be reached." onRetry={() => void alerts.refetch()} /> : alerts.data.length === 0 ? <EmptyState title="No alerts found" message="There are no alerts for this status." /> : <div className="overflow-x-auto border-t border-line"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-canvas text-[10px] uppercase text-muted"><tr><th className="px-6 py-3 font-bold">Type / message</th><th className="px-4 py-3 font-bold">Severity</th><th className="px-4 py-3 font-bold">ATM</th><th className="px-4 py-3 font-bold">Created</th><th className="px-4 py-3 font-bold">Status</th><th className="px-6 py-3 text-right font-bold">Actions</th></tr></thead><tbody className="divide-y divide-line">{alerts.data.map((alert) => <tr key={alert.id} className="align-top hover:bg-canvas/70"><td className="px-6 py-4"><button className="text-left" onClick={() => setSelectedAlertId(alert.id)}><span className="font-semibold text-ink hover:text-moss">{alert.alertType.replaceAll("_", " ")}</span><span className="mt-1 block max-w-md text-xs leading-5 text-muted">{alert.message}</span></button></td><td className="px-4 py-4"><span className={`inline-flex min-h-6 items-center rounded border px-2 text-[10px] font-bold uppercase ${severityTone[alert.severity]}`}>{alert.severity}</span></td><td className="px-4 py-4 font-semibold text-ink">{atmNames.get(alert.atmId) ?? `ATM ${alert.atmId}`}</td><td className="whitespace-nowrap px-4 py-4 text-xs text-muted">{dateTimeFormatter.format(new Date(alert.createdAt))}</td><td className="px-4 py-4"><Badge tone={alert.status === "RESOLVED" ? "success" : alert.status === "ACKNOWLEDGED" ? "info" : "warning"}>{alert.status.replaceAll("_", " ")}</Badge></td><td className="px-6 py-4"><div className="flex justify-end gap-3">{alert.status === "ACTIVE" && <button disabled={changeStatus.isPending} className="text-xs font-semibold text-moss hover:underline disabled:opacity-50" onClick={() => changeStatus.mutate({ id: alert.id, action: "acknowledge" })}>Acknowledge</button>}{alert.status !== "RESOLVED" && <button disabled={changeStatus.isPending} className="text-xs font-semibold text-coral hover:underline disabled:opacity-50" onClick={() => changeStatus.mutate({ id: alert.id, action: "resolve" })}>Resolve</button>}</div></td></tr>)}</tbody></table></div>}
			</Card>

			<Modal open={selectedAlertId !== null} onClose={() => setSelectedAlertId(null)} title="Alert details">
				{details.isPending ? <Loading label="Loading alert details" /> : details.isError || !details.data ? <ErrorState title="Alert details unavailable" message="This alert could not be loaded." onRetry={() => void details.refetch()} /> : <div className="space-y-5"><div className="flex flex-wrap items-center gap-2"><span className={`inline-flex min-h-6 items-center rounded border px-2 text-[10px] font-bold uppercase ${severityTone[details.data.severity]}`}>{details.data.severity}</span><Badge tone={details.data.status === "RESOLVED" ? "success" : "warning"}>{details.data.status}</Badge></div><h3 className="text-base font-bold text-ink">{details.data.alertType.replaceAll("_", " ")}</h3><p className="text-sm leading-6 text-muted">{details.data.message}</p><dl className="grid grid-cols-2 gap-x-4 gap-y-4 border-t border-line pt-4 text-sm"><div><dt className="text-xs text-muted">ATM</dt><dd className="mt-1 font-semibold text-ink">{atmNames.get(details.data.atmId) ?? `ATM ${details.data.atmId}`}</dd></div><div><dt className="text-xs text-muted">Created</dt><dd className="mt-1 font-semibold text-ink">{dateTimeFormatter.format(new Date(details.data.createdAt))}</dd></div><div><dt className="text-xs text-muted">Resolved</dt><dd className="mt-1 font-semibold text-ink">{details.data.resolvedAt ? dateTimeFormatter.format(new Date(details.data.resolvedAt)) : "Not resolved"}</dd></div></dl><div className="flex justify-end gap-2 border-t border-line pt-4">{details.data.status === "ACTIVE" && <Button variant="secondary" disabled={changeStatus.isPending} onClick={() => changeStatus.mutate({ id: details.data!.id, action: "acknowledge" })}><Check aria-hidden="true" className="size-4" />Acknowledge</Button>}{details.data.status !== "RESOLVED" && <Button variant="danger" disabled={changeStatus.isPending} onClick={() => changeStatus.mutate({ id: details.data!.id, action: "resolve" })}><Bell aria-hidden="true" className="size-4" />Resolve</Button>}</div></div>}
			</Modal>
		</div>
	);
}