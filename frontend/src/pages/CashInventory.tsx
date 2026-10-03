import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Card, CardHeader } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Loading } from "../components/ui/Loading";
import { Select } from "../components/ui/Select";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { getAllAtms } from "../services/atmService";
import { getCashInventory } from "../services/cashService";
import { inrFormatter } from "../utils/formatters";

const denominations = [2000, 500, 200, 100, 50];

export function CashInventory() {
	useDocumentTitle("Cash inventory");
	const [selectedAtm, setSelectedAtm] = useState("");
	const atms = useQuery({ queryKey: ["atms", "all-inventory"], queryFn: getAllAtms });
	const scopedAtms = (atms.data ?? []).filter((atm) => !selectedAtm || String(atm.id) === selectedAtm);
	const inventories = useQueries({ queries: scopedAtms.map((atm) => ({ queryKey: ["cash-inventory", atm.id], queryFn: () => getCashInventory(atm.id) })) });
	const loadingInventory = inventories.some((query) => query.isPending);
	const inventoryError = inventories.some((query) => query.isError);
	const totals = useMemo(() => {
		const counts = new Map(denominations.map((denomination) => [denomination, 0]));
		const amounts = new Map(denominations.map((denomination) => [denomination, 0]));
		inventories.forEach((query) => query.data?.denominations.forEach((row) => {
			counts.set(row.denomination, (counts.get(row.denomination) ?? 0) + row.noteCount);
			amounts.set(row.denomination, (amounts.get(row.denomination) ?? 0) + row.totalAmount);
		}));
		return { counts, amounts, totalCash: scopedAtms.reduce((sum, atm) => sum + atm.currentCash, 0) };
	}, [inventories, scopedAtms]);

	if (atms.isPending) return <Loading label="Loading cash network" />;
	if (atms.isError) return <ErrorState title="ATM network unavailable" message="Cash inventory cannot be aggregated until the ATM list is available." onRetry={() => void atms.refetch()} />;

	return (
		<div className="page-enter space-y-6">
			<header><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-moss">Cash operations</p><h1 className="mt-2 text-2xl font-bold text-ink sm:text-[28px]">Cash inventory</h1><p className="mt-1 text-sm text-muted">Note counts and cash value across the selected network.</p></header>
			<Card>
				<CardHeader title="Inventory position" description={`${scopedAtms.length} ATM${scopedAtms.length === 1 ? "" : "s"} included`} />
				<div className="grid gap-4 border-b border-line px-5 py-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:items-end sm:px-6"><Select label="ATM scope" value={selectedAtm} placeholder="All ATMs" options={(atms.data ?? []).map((atm) => ({ label: `${atm.atmCode} · ${atm.city}`, value: String(atm.id) }))} onChange={(event) => setSelectedAtm(event.target.value)} /><div className="rounded-md bg-[#e7f3ec] px-4 py-3"><p className="text-xs font-semibold text-[#286c4a]">Total ATM cash</p><p className="mt-1 text-2xl font-bold text-ink">{inrFormatter.format(totals.totalCash)}</p></div></div>
				{loadingInventory ? <Loading label="Loading denomination balances" /> : inventoryError ? <ErrorState title="Some inventory records are unavailable" message="Refresh to retry the cash inventory requests." onRetry={() => inventories.forEach((query) => void query.refetch())} /> : scopedAtms.length === 0 ? <EmptyState title="No ATMs available" message="No ATM records are available for this account." /> : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[540px] text-left text-sm"><thead className="bg-canvas text-[10px] uppercase text-muted"><tr><th className="px-6 py-3 font-bold">Denomination</th><th className="px-4 py-3 text-right font-bold">Note count</th><th className="px-6 py-3 text-right font-bold">Total amount</th></tr></thead><tbody className="divide-y divide-line">{denominations.map((denomination) => <tr key={denomination}><td className="px-6 py-4 font-semibold text-ink">₹{denomination.toLocaleString("en-IN")}</td><td className="px-4 py-4 text-right text-ink">{(totals.counts.get(denomination) ?? 0).toLocaleString("en-IN")}</td><td className="px-6 py-4 text-right font-semibold text-ink">{inrFormatter.format(totals.amounts.get(denomination) ?? 0)}</td></tr>)}</tbody><tfoot className="border-t-2 border-line bg-canvas"><tr><th className="px-6 py-4 text-left font-bold text-ink">Total ATM cash</th><td className="px-4 py-4 text-right font-semibold text-ink">{Array.from(totals.counts.values()).reduce((sum, count) => sum + count, 0).toLocaleString("en-IN")}</td><td className="px-6 py-4 text-right font-bold text-ink">{inrFormatter.format(totals.totalCash)}</td></tr></tfoot></table>
					</div>
				)}
			</Card>
			<Card className="p-5"><CardHeader title="Cash coverage" description="Cash total from ATM records, cross-checked against denomination inventory." /><p className="text-sm text-muted">{inventories.length} inventory record{inventories.length === 1 ? "" : "s"} loaded for {scopedAtms.length} ATM{scopedAtms.length === 1 ? "" : "s"}.</p></Card>
		</div>
	);
}