import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";
import { Loading } from "../components/ui/Loading";
import { Modal } from "../components/ui/Modal";
import { Pagination } from "../components/ui/Pagination";
import { Select } from "../components/ui/Select";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { apiErrorMessage, normalizeApiError } from "../services/api";
import { findTransaction, getTransactions } from "../services/transactionService";
import type { TransactionListParams, TransactionRecord, TransactionType } from "../types/transaction";
import { inrFormatter } from "../utils/formatters";

const dateTime = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });
const typeOptions = ["WITHDRAWAL", "DEPOSIT", "BALANCE_INQUIRY", "OTHER"].map((value) => ({ label: value.replaceAll("_", " "), value }));

export function Transactions() {
	useDocumentTitle("Transactions");
	const [page, setPage] = useState(1);
	const [atmId, setAtmId] = useState("");
	const [type, setType] = useState<TransactionType | "">("");
	const [result, setResult] = useState("");
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [sort, setSort] = useState("timestamp,desc");
	const [searchText, setSearchText] = useState("");
	const [searchedId, setSearchedId] = useState("");
	const [selected, setSelected] = useState<TransactionRecord | null>(null);
	const params: TransactionListParams = {
		page: page - 1,
		size: 20,
		sort,
		atmId: atmId ? Number(atmId) : undefined,
		type,
		status: result === "success" ? true : result === "failed" ? false : undefined,
		from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
		to: to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined,
	};
	const list = useQuery({ queryKey: ["transactions", params], queryFn: () => getTransactions(params), enabled: !searchedId });
	const search = useQuery({ queryKey: ["transaction-search", searchedId], queryFn: () => findTransaction(searchedId), enabled: Boolean(searchedId), retry: false });
	const searchStatus = search.isError ? normalizeApiError(search.error).status : undefined;
	const rows = searchedId ? (search.data ? [search.data] : []) : list.data?.items ?? [];

	const clearSearch = () => { setSearchText(""); setSearchedId(""); setPage(1); };
	const submitSearch = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); setPage(1); setSearchedId(searchText.trim()); };
	const clearFilters = () => { setAtmId(""); setType(""); setResult(""); setFrom(""); setTo(""); setSort("timestamp,desc"); setPage(1); };

	return (
		<div className="page-enter space-y-6">
			<header><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-moss">Operations</p><h1 className="mt-2 text-2xl font-bold text-ink sm:text-[28px]">Transactions</h1><p className="mt-1 text-sm text-muted">Search transaction IDs or narrow activity by location, result, and date.</p></header>
			<Card>
				<CardHeader title="Transaction activity" description={searchedId ? "Exact transaction ID match" : `${list.data?.total ?? "—"} matching records`} />
				<div className="space-y-4 px-5 py-5 sm:px-6">
					<form className="flex flex-col gap-2 sm:flex-row" onSubmit={submitSearch}>
						<div className="min-w-0 flex-1"><Input label="Search transaction ID" type="search" placeholder="Enter an exact transaction ID" value={searchText} onChange={(event) => setSearchText(event.target.value)} /></div>
						<div className="flex items-end gap-2"><Button type="submit"><Search aria-hidden="true" className="size-4" />Search</Button>{searchedId && <Button type="button" variant="secondary" aria-label="Clear transaction search" onClick={clearSearch}><X aria-hidden="true" className="size-4" /></Button>}</div>
					</form>
					<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
						<Input label="ATM ID" type="number" min="1" placeholder="Any ATM" value={atmId} onChange={(event) => { setAtmId(event.target.value); setPage(1); }} />
						<Select label="Type" value={type} placeholder="All types" options={typeOptions} onChange={(event) => { setType(event.target.value as TransactionType | ""); setPage(1); }} />
						<Select label="Result" value={result} placeholder="All results" options={[{ label: "Successful", value: "success" }, { label: "Failed", value: "failed" }]} onChange={(event) => { setResult(event.target.value); setPage(1); }} />
						<Input label="From" type="date" value={from} max={to || undefined} onChange={(event) => { setFrom(event.target.value); setPage(1); }} />
						<Input label="To" type="date" value={to} min={from || undefined} onChange={(event) => { setTo(event.target.value); setPage(1); }} />
						<Select label="Sort by" value={sort} options={[{ label: "Newest first", value: "timestamp,desc" }, { label: "Oldest first", value: "timestamp,asc" }, { label: "Amount: high to low", value: "amount,desc" }, { label: "Amount: low to high", value: "amount,asc" }]} onChange={(event) => { setSort(event.target.value); setPage(1); }} />
					</div>
					<div className="flex justify-end"><Button variant="ghost" size="sm" onClick={clearFilters}>Clear filters</Button></div>
				</div>
				{searchedId && search.isPending ? <Loading label="Searching transaction ID" /> : !searchedId && list.isPending ? <Loading label="Loading transactions" /> : searchedId && search.isError && searchStatus === 404 ? <EmptyState title="Transaction not found" message="Check the transaction ID and try again." /> : searchedId && search.isError ? <ErrorState title="Transaction search failed" message={apiErrorMessage(search.error, "The transaction service could not complete the search.")} onRetry={() => void search.refetch()} /> : !searchedId && list.isError ? <ErrorState title="Transactions unavailable" message={apiErrorMessage(list.error, "The transaction service could not be reached.")} onRetry={() => void list.refetch()} /> : rows.length === 0 ? <EmptyState title="No transactions found" message="Try changing the filters or date range." /> : (
					<div className="overflow-x-auto border-t border-line">
						<table className="w-full min-w-[760px] text-left text-sm">
							<thead className="bg-canvas text-[10px] uppercase text-muted"><tr><th className="px-6 py-3 font-bold">Transaction</th><th className="px-4 py-3 font-bold">ATM</th><th className="px-4 py-3 font-bold">Type</th><th className="px-4 py-3 font-bold">Amount</th><th className="px-4 py-3 font-bold">Result</th><th className="px-6 py-3 text-right font-bold">Details</th></tr></thead>
							<tbody className="divide-y divide-line">{rows.map((transaction) => <tr key={transaction.id} className="hover:bg-canvas/70"><td className="px-6 py-4"><span className="font-semibold text-ink">{transaction.transactionId}</span><span className="mt-1 block text-xs text-muted">{dateTime.format(new Date(transaction.timestamp))}</span></td><td className="px-4 py-4 text-ink">ATM {transaction.atmId}</td><td className="px-4 py-4 text-ink">{transaction.transactionType.replaceAll("_", " ")}</td><td className="px-4 py-4 font-semibold text-ink">{inrFormatter.format(transaction.amount)}</td><td className="px-4 py-4"><StatusBadge status={transaction.success ? "SUCCESS" : "FAILED"} /></td><td className="px-6 py-4 text-right"><Button variant="ghost" size="sm" onClick={() => setSelected(transaction)}>View</Button></td></tr>)}</tbody>
						</table>
					</div>
				)}
				{!searchedId && !list.isPending && !list.isError && list.data && <Pagination page={page} pageCount={Math.max(1, list.data.totalPages)} onPageChange={setPage} />}
			</Card>
			<Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="Transaction details">
				{selected && <dl className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm"><div className="col-span-2"><dt className="text-xs text-muted">Transaction ID</dt><dd className="mt-1 break-all font-semibold text-ink">{selected.transactionId}</dd></div><div><dt className="text-xs text-muted">ATM</dt><dd className="mt-1 font-semibold text-ink">{selected.atmId}</dd></div><div><dt className="text-xs text-muted">Type</dt><dd className="mt-1 font-semibold text-ink">{selected.transactionType.replaceAll("_", " ")}</dd></div><div><dt className="text-xs text-muted">Amount</dt><dd className="mt-1 font-semibold text-ink">{inrFormatter.format(selected.amount)}</dd></div><div><dt className="text-xs text-muted">Result</dt><dd className="mt-1"><StatusBadge status={selected.success ? "SUCCESS" : "FAILED"} /></dd></div><div><dt className="text-xs text-muted">Card type</dt><dd className="mt-1 font-semibold text-ink">{selected.cardType || "Not recorded"}</dd></div><div><dt className="text-xs text-muted">Timestamp</dt><dd className="mt-1 font-semibold text-ink">{dateTime.format(new Date(selected.timestamp))}</dd></div></dl>}
			</Modal>
		</div>
	);
}