import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Bell, Pencil, RefreshCw, ShieldAlert } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Loading } from "../components/ui/Loading";
import { RiskBadge } from "../components/ui/RiskBadge";
import { StatusBadge } from "../components/ui/StatusBadge";
import { getAtm } from "../services/atmService";
import { getDashboardAtmRisk } from "../services/dashboardService";
import { getCashInventory } from "../services/cashService";
import { getAtmAlerts } from "../services/alertService";
import { getLatestPrediction } from "../services/predictionService";
import { getTransactions } from "../services/transactionService";
import { apiErrorMessage } from "../services/api";
import { inrFormatter } from "../utils/formatters";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

const dateTime = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });

export function AtmDetails() {
  const { id = "" } = useParams();
  const atm = useQuery({ queryKey: ["atm", id], queryFn: () => getAtm(id), enabled: Boolean(id) });
  const risk = useQuery({ queryKey: ["dashboard", "atm-risk", id], queryFn: () => getDashboardAtmRisk(Number(id)), enabled: Boolean(id) });
  const cash = useQuery({ queryKey: ["cash-inventory", Number(id)], queryFn: () => getCashInventory(Number(id)), enabled: Boolean(id) });
  const transactions = useQuery({ queryKey: ["transactions", "atm-recent", id], queryFn: () => getTransactions({ page: 0, size: 5, sort: "timestamp,desc", atmId: Number(id) }), enabled: Boolean(id) });
  const latestPrediction = useQuery({ queryKey: ["prediction", Number(id), "latest"], queryFn: () => getLatestPrediction(Number(id)), enabled: Boolean(id) });
  const alerts = useQuery({ queryKey: ["atm-alerts", Number(id)], queryFn: () => getAtmAlerts(Number(id)), enabled: Boolean(id) });
  useDocumentTitle(atm.data ? `${atm.data.atmCode} details` : "ATM details");

  if (atm.isPending) return <Loading label="Loading ATM details" />;
  if (atm.isError || !atm.data) return <ErrorState title="ATM details unavailable" message={apiErrorMessage(atm.error, "This ATM could not be loaded.")} onRetry={() => void atm.refetch()} />;
  const record = atm.data;
  const openAlerts = (alerts.data ?? []).filter((alert) => alert.status !== "RESOLVED");
  const stockoutAlert = openAlerts.find((alert) => alert.alertType === "STOCKOUT_RISK");
  const refresh = () => Promise.all([atm.refetch(), risk.refetch(), cash.refetch(), transactions.refetch(), latestPrediction.refetch(), alerts.refetch()]);

  return (
    <div className="page-enter space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><Link to="/atms" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink"><ArrowLeft aria-hidden="true" className="size-3.5" />ATM directory</Link><div className="mt-3 flex flex-wrap items-center gap-3"><h1 className="text-2xl font-bold text-ink sm:text-[28px]">{record.atmCode}</h1><StatusBadge status={record.status} />{risk.data && <RiskBadge level={risk.data.riskLevel} />}{risk.isError && <Badge tone="neutral">Risk unavailable</Badge>}</div><p className="mt-1 text-sm text-muted">{record.location}, {record.city}, {record.state}</p></div>
        <div className="flex gap-2"><Button variant="secondary" onClick={() => void refresh()} aria-label="Refresh ATM details"><RefreshCw aria-hidden="true" className="size-4" />Refresh</Button><Link to={`/atms/${id}/edit`} className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-canvas"><Pencil aria-hidden="true" className="size-4" />Edit ATM</Link></div>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[["Current cash", inrFormatter.format(record.currentCash)], ["Cash capacity", inrFormatter.format(record.cashCapacity)], ["Minimum threshold", inrFormatter.format(record.minimumCashThreshold)], ["Maximum threshold", inrFormatter.format(record.maximumCashThreshold)]].map(([label, value]) => <Card key={label} className="p-5"><p className="text-xs font-semibold text-muted">{label}</p><p className="mt-2 text-xl font-bold text-ink">{value}</p></Card>)}
      </section>
      <section aria-label="Prediction and alert status" className="grid gap-3 md:grid-cols-3">
        <Card className="p-5"><div className="flex items-start justify-between gap-3"><p className="text-xs font-semibold text-muted">Predicted demand</p><span className="grid size-8 place-items-center rounded-md bg-canvas text-moss"><ShieldAlert aria-hidden="true" className="size-4" /></span></div>{latestPrediction.isPending ? <p className="mt-3 text-sm text-muted">Loading prediction…</p> : latestPrediction.isError ? <p className="mt-3 text-sm text-coral">Prediction unavailable</p> : latestPrediction.data ? <><p className="mt-2 text-xl font-bold text-ink">{inrFormatter.format(latestPrediction.data.predictedDemand)}</p><p className="mt-1 text-xs text-muted">{latestPrediction.data.predictionDate} · {latestPrediction.data.modelVersion}</p></> : <p className="mt-2 text-sm text-muted">No prediction recorded</p>}</Card>
        <Card className="p-5"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold text-muted">Stockout risk</p>{stockoutAlert && <Badge tone={stockoutAlert.severity === "CRITICAL" ? "danger" : "warning"}>{stockoutAlert.severity}</Badge>}</div>{alerts.isPending ? <p className="mt-3 text-sm text-muted">Checking alerts…</p> : alerts.isError ? <p className="mt-3 text-sm text-coral">Risk status unavailable</p> : stockoutAlert ? <p className="mt-2 text-sm font-semibold text-coral">{stockoutAlert.message}</p> : <p className="mt-2 text-sm font-semibold text-moss">No open stockout alert</p>}</Card>
        <Card className="p-5"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold text-muted">Open alerts</p><span className="inline-flex items-center gap-1.5 text-sm font-bold text-ink"><Bell aria-hidden="true" className="size-4 text-muted" />{alerts.isError || alerts.isPending ? "—" : openAlerts.length}</span></div>{alerts.isPending ? <p className="mt-3 text-sm text-muted">Loading alerts…</p> : alerts.isError ? <p className="mt-2 text-sm text-coral">Alert list unavailable</p> : openAlerts.length === 0 ? <p className="mt-2 text-sm text-muted">No open alerts for this ATM.</p> : <div className="mt-3 space-y-2">{openAlerts.slice(0, 2).map((alert) => <Link key={alert.id} to="/alerts" className="block border-t border-line pt-2 text-xs font-semibold text-ink hover:text-moss">{alert.alertType.replaceAll("_", " ")} · {alert.severity}</Link>)}{openAlerts.length > 2 && <Link to="/alerts" className="block text-xs font-semibold text-moss hover:underline">View all {openAlerts.length} alerts</Link>}</div>}</Card>
      </section>
      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader title="Location and service" description={`${record.atmType.replaceAll("_", " ")} · Bank ${record.bankId}`} />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-5 px-5 py-5 sm:px-6"><div><dt className="text-xs text-muted">Address</dt><dd className="mt-1 text-sm font-semibold text-ink">{record.location}</dd></div><div><dt className="text-xs text-muted">Coordinates</dt><dd className="mt-1 text-sm font-semibold text-ink">{record.latitude}, {record.longitude}</dd></div><div className="col-span-2"><dt className="text-xs text-muted">Last refill</dt><dd className="mt-1 text-sm font-semibold text-ink">{record.lastRefillAt ? dateTime.format(new Date(record.lastRefillAt)) : "No refill recorded"}</dd></div></dl>
        </Card>
        <Card>
          <CardHeader title="Cash denominations" description="Current notes by denomination" />
          {cash.isPending ? <Loading label="Loading cash breakdown" /> : cash.isError ? <ErrorState title="Cash breakdown unavailable" message="Inventory details could not be loaded." onRetry={() => void cash.refetch()} /> : cash.data.denominations.length === 0 ? <EmptyState title="No denomination records" message="Cash inventory has not been recorded for this ATM." /> : <div className="divide-y divide-line">{[2000, 500, 200, 100, 50].map((denomination) => { const row = cash.data.denominations.find((item) => item.denomination === denomination); return <div key={denomination} className="flex items-center justify-between px-5 py-3.5 sm:px-6"><span className="text-sm font-semibold text-ink">₹{denomination.toLocaleString("en-IN")}</span><span className="text-xs text-muted">{row?.noteCount ?? 0} notes</span><span className="text-sm font-semibold text-ink">{inrFormatter.format(row?.totalAmount ?? 0)}</span></div>; })}<div className="flex justify-between bg-canvas px-5 py-3.5 text-sm font-bold text-ink sm:px-6"><span>Total cash</span><span>{inrFormatter.format(cash.data.totalCash)}</span></div></div>}
        </Card>
      </div>
      <Card>
        <CardHeader title="Recent transactions" description="Latest activity recorded at this ATM" />
        {transactions.isPending ? <Loading label="Loading recent transactions" /> : transactions.isError ? <ErrorState title="Transactions unavailable" message="Recent ATM activity could not be loaded." onRetry={() => void transactions.refetch()} /> : transactions.data.items.length === 0 ? <EmptyState title="No recent transactions" /> : <div className="divide-y divide-line">{transactions.data.items.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 sm:px-6"><div><p className="text-sm font-semibold text-ink">{item.transactionType.replaceAll("_", " ")} <span className="font-normal text-muted">· {item.transactionId}</span></p><p className="mt-1 text-xs text-muted">{dateTime.format(new Date(item.timestamp))}</p></div><div className="flex items-center gap-3"><span className="text-sm font-semibold text-ink">{inrFormatter.format(item.amount)}</span><StatusBadge status={item.success ? "SUCCESS" : "FAILED"} /></div></div>)}</div>}
      </Card>
    </div>
  );
}