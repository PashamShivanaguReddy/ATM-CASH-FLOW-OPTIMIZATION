import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { ConfirmationModal } from "../components/ui/ConfirmationModal";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";
import { Loading } from "../components/ui/Loading";
import { Modal } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useAuthContext } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { apiErrorMessage } from "../services/api";
import { getAllAtms } from "../services/atmService";
import { approveRefill, completeRefill, getRefill, getRefills, rejectRefill, requestRefill } from "../services/refillService";
import type { RefillRecord, RefillStatus } from "../types/refill";
import { inrFormatter } from "../utils/formatters";

const statuses: RefillStatus[] = ["REQUESTED", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"];
const requestSchema = z.object({ atmId: z.string().min(1, "Select an ATM."), refillAmount: z.coerce.number().positive("Enter a refill amount greater than zero."), notes: z.string().max(1000) });
type RequestValues = z.infer<typeof requestSchema>;
type RefillAction = "approve" | "reject" | "complete";
const dateTime = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });

export function Refills() {
	useDocumentTitle("Refills");
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { user } = useAuthContext();
	const [status, setStatus] = useState<RefillStatus | "">("");
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState("createdAt,desc");
	const [requestOpen, setRequestOpen] = useState(false);
	const [details, setDetails] = useState<RefillRecord | null>(null);
	const [pendingAction, setPendingAction] = useState<{ refill: RefillRecord; action: RefillAction } | null>(null);
	const refills = useQuery({ queryKey: ["refills"], queryFn: getRefills });
	const atms = useQuery({ queryKey: ["atms", "refill-options"], queryFn: getAllAtms, enabled: requestOpen });
	const { register, handleSubmit, reset, formState: { errors } } = useForm<RequestValues>({ resolver: zodResolver(requestSchema), defaultValues: { atmId: "", refillAmount: 0, notes: "" } });
	const visibleRefills = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();
		return (refills.data ?? []).filter((refill) => (!status || refill.status === status) && (!normalizedSearch || String(refill.id).includes(normalizedSearch) || String(refill.atmId).includes(normalizedSearch))).sort((left, right) => {
			const amountSort = left.refillAmount - right.refillAmount;
			return sort === "amount,asc" ? amountSort : sort === "amount,desc" ? -amountSort : new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
		});
	}, [refills.data, search, status, sort]);
	const refreshRefillData = async (atmId?: number) => Promise.all([
		queryClient.invalidateQueries({ queryKey: ["refills"] }),
		queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
		queryClient.invalidateQueries({ queryKey: ["analytics"] }),
		...(atmId == null ? [] : [
			queryClient.invalidateQueries({ queryKey: ["atm", String(atmId)] }),
			queryClient.invalidateQueries({ queryKey: ["cash-inventory", atmId] }),
			queryClient.invalidateQueries({ queryKey: ["dashboard", "atm-risk"] }),
			queryClient.invalidateQueries({ queryKey: ["optimization", "recommendations"] }),
		]),
	]);

	const create = useMutation({
		mutationFn: requestRefill,
		onSuccess: async (created) => { await refreshRefillData(created.atmId); setRequestOpen(false); reset(); showToast("Refill requested."); },
		onError: async (error) => { await refills.refetch(); showToast(apiErrorMessage(error, "Could not request this refill."), "error"); },
	});
	const transition = useMutation({
		mutationFn: ({ id, action }: { id: number; action: RefillAction }) => action === "approve" ? approveRefill(id) : action === "reject" ? rejectRefill(id) : completeRefill(id),
		onSuccess: async (updated) => { await refreshRefillData(updated.atmId); setPendingAction(null); showToast(`Refill ${updated.status.toLowerCase()}.`); },
		onError: async (error, variables) => {
			let current: RefillRecord | undefined;
			try { current = await getRefill(variables.id); } catch {}
			await refreshRefillData(current?.atmId ?? pendingAction?.refill.atmId);
			setPendingAction(null);
			const expected: Record<RefillAction, RefillStatus> = { approve: "APPROVED", reject: "REJECTED", complete: "COMPLETED" };
			if (current?.status === expected[variables.action]) showToast(`Refill is already ${current.status.toLowerCase()}.`);
			else if (current) showToast(`Refill state refreshed: ${current.status.toLowerCase()}.`, "error");
			else showToast(apiErrorMessage(error, "The refill status could not be confirmed."), "error");
		},
	});

	const canRequest = user?.role === "SUPER_ADMIN" || user?.role === "BANK_ADMIN";
	const canReview = user?.role === "SUPER_ADMIN" || user?.role === "BANK_MANAGER";
	const canComplete = user?.role === "SUPER_ADMIN" || user?.role === "ATM_OPERATOR";
	const actionMessage = (action: RefillAction) => action === "approve" ? "Approve this refill request?" : action === "reject" ? "Reject this refill request? This decision cannot be undone." : "Mark this approved refill as completed and add its amount to ATM cash?";
	const actionLabel = (action: RefillAction) => action === "approve" ? "Approve refill" : action === "reject" ? "Reject refill" : "Complete refill";

	return (
		<div className="page-enter space-y-6">
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-moss">Cash operations</p><h1 className="mt-2 text-2xl font-bold text-ink sm:text-[28px]">Refills</h1><p className="mt-1 text-sm text-muted">Request, review, and record ATM replenishment.</p></div>
				{canRequest && <Button onClick={() => setRequestOpen(true)}><Plus aria-hidden="true" className="size-4" />Request refill</Button>}
			</header>
			<Card>
				<CardHeader title="Refill requests" description={`${visibleRefills.length} request${visibleRefills.length === 1 ? "" : "s"}`} />
				<div className="grid gap-3 px-5 py-5 sm:grid-cols-3 sm:px-6"><Input label="Search" type="search" placeholder="Refill ID or ATM ID" value={search} onChange={(event) => setSearch(event.target.value)} /><Select label="Status" value={status} placeholder="All statuses" options={statuses.map((value) => ({ label: value.replaceAll("_", " "), value }))} onChange={(event) => setStatus(event.target.value as RefillStatus | "")} /><Select label="Sort by" value={sort} options={[{ label: "Newest first", value: "createdAt,desc" }, { label: "Amount: high to low", value: "amount,desc" }, { label: "Amount: low to high", value: "amount,asc" }]} onChange={(event) => setSort(event.target.value)} /></div>
				{refills.isPending ? <Loading label="Loading refill requests" /> : refills.isError ? <ErrorState title="Refill requests unavailable" message="The cash inventory service could not be reached." onRetry={() => void refills.refetch()} /> : visibleRefills.length === 0 ? <EmptyState title="No refill requests found" message="Change the status or search filters, or request a refill when permitted." /> : (
					<div className="overflow-x-auto border-t border-line"><table className="w-full min-w-[780px] text-left text-sm"><thead className="bg-canvas text-[10px] uppercase text-muted"><tr><th className="px-6 py-3 font-bold">Request</th><th className="px-4 py-3 font-bold">ATM</th><th className="px-4 py-3 font-bold">Amount</th><th className="px-4 py-3 font-bold">Status</th><th className="px-4 py-3 font-bold">Refill date</th><th className="px-6 py-3 text-right font-bold">Actions</th></tr></thead><tbody className="divide-y divide-line">{visibleRefills.map((refill) => <tr key={refill.id} className="hover:bg-canvas/70"><td className="px-6 py-4 font-semibold text-ink">REF-{refill.id}<span className="mt-1 block text-xs font-normal text-muted">Requested {dateTime.format(new Date(refill.createdAt))}</span></td><td className="px-4 py-4 text-ink">ATM {refill.atmId}</td><td className="px-4 py-4 font-semibold text-ink">{inrFormatter.format(refill.refillAmount)}</td><td className="px-4 py-4"><StatusBadge status={refill.status} /></td><td className="px-4 py-4 text-ink">{dateTime.format(new Date(refill.refillDate))}</td><td className="px-6 py-4"><div className="flex flex-wrap justify-end gap-3"><button className="text-xs font-semibold text-moss hover:underline" onClick={() => setDetails(refill)}>Details</button>{refill.status === "REQUESTED" && canReview && <button className="text-xs font-semibold text-moss hover:underline" onClick={() => setPendingAction({ refill, action: "approve" })}>Approve</button>}{refill.status === "REQUESTED" && canReview && <button className="text-xs font-semibold text-coral hover:underline" onClick={() => setPendingAction({ refill, action: "reject" })}>Reject</button>}{refill.status === "APPROVED" && canComplete && <button className="text-xs font-semibold text-moss hover:underline" onClick={() => setPendingAction({ refill, action: "complete" })}>Complete</button>}</div></td></tr>)}</tbody></table></div>
				)}
			</Card>

			<Modal open={requestOpen} onClose={() => { setRequestOpen(false); reset(); }} title="Request refill">
				<form className="space-y-4" onSubmit={handleSubmit((values) => create.mutate({ atmId: Number(values.atmId), refillAmount: values.refillAmount, notes: values.notes || undefined }))} noValidate>
					{atms.isPending ? <Loading label="Loading ATM choices" /> : atms.isError ? <ErrorState title="ATM choices unavailable" message="Could not load locations for a refill request." onRetry={() => void atms.refetch()} /> : <Select label="ATM" placeholder="Select ATM" options={(atms.data ?? []).map((atm) => ({ label: `${atm.atmCode} · ${atm.city} · ${inrFormatter.format(atm.currentCash)} cash`, value: String(atm.id) }))} {...register("atmId")} error={errors.atmId?.message} />}
					<Input label="Refill amount (₹)" type="number" min="0.01" step="0.01" {...register("refillAmount")} error={errors.refillAmount?.message} />
					<div className="grid gap-1.5"><label htmlFor="refill-notes" className="text-sm font-semibold text-ink">Notes</label><textarea id="refill-notes" maxLength={1000} rows={3} className="w-full rounded-md border border-line bg-white px-3.5 py-2.5 text-sm text-ink focus:border-moss focus:outline-none focus:ring-3 focus:ring-mint" {...register("notes")} /><span className="text-xs text-muted">Optional, up to 1,000 characters.</span></div>
					<div className="flex justify-end gap-2 border-t border-line pt-4"><Button variant="secondary" onClick={() => setRequestOpen(false)} disabled={create.isPending}>Cancel</Button><Button type="submit" disabled={create.isPending || atms.isPending || atms.isError}>{create.isPending ? "Submitting…" : "Submit request"}</Button></div>
				</form>
			</Modal>

			<Modal open={Boolean(details)} onClose={() => setDetails(null)} title="Refill details">
				{details && <dl className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm"><div><dt className="text-xs text-muted">Request</dt><dd className="mt-1 font-semibold text-ink">REF-{details.id}</dd></div><div><dt className="text-xs text-muted">Status</dt><dd className="mt-1"><StatusBadge status={details.status} /></dd></div><div><dt className="text-xs text-muted">ATM</dt><dd className="mt-1 font-semibold text-ink">ATM {details.atmId}</dd></div><div><dt className="text-xs text-muted">Amount</dt><dd className="mt-1 font-semibold text-ink">{inrFormatter.format(details.refillAmount)}</dd></div><div><dt className="text-xs text-muted">Requested</dt><dd className="mt-1 font-semibold text-ink">{dateTime.format(new Date(details.createdAt))}</dd></div><div><dt className="text-xs text-muted">Scheduled / completed</dt><dd className="mt-1 font-semibold text-ink">{dateTime.format(new Date(details.refillDate))}</dd></div><div><dt className="text-xs text-muted">Requested by</dt><dd className="mt-1 font-semibold text-ink">{details.requestedBy ?? "Not recorded"}</dd></div><div><dt className="text-xs text-muted">Approved by</dt><dd className="mt-1 font-semibold text-ink">{details.approvedBy ?? "Not recorded"}</dd></div>{details.recommendationId != null && <div><dt className="text-xs text-muted">Recommendation</dt><dd className="mt-1 font-semibold text-ink">REC-{details.recommendationId}</dd></div>}<div className="col-span-2"><dt className="text-xs text-muted">Notes</dt><dd className="mt-1 whitespace-pre-wrap font-semibold text-ink">{details.notes || "No notes"}</dd></div></dl>}
			</Modal>

			<ConfirmationModal open={Boolean(pendingAction)} onClose={() => setPendingAction(null)} title={pendingAction ? actionLabel(pendingAction.action) : "Confirm refill action"} message={pendingAction ? `${actionMessage(pendingAction.action)} REF-${pendingAction.refill.id} for ${inrFormatter.format(pendingAction.refill.refillAmount)}?` : "Confirm this refill operation?"} confirmLabel={pendingAction ? actionLabel(pendingAction.action) : "Confirm"} destructive={pendingAction?.action === "reject"} pending={transition.isPending} onConfirm={() => { if (pendingAction) transition.mutate({ id: pendingAction.refill.id, action: pendingAction.action }); }} />
		</div>
	);
}