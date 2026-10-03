import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, Banknote, CircleDollarSign, Clock3, MapPin, ShieldAlert, TrendingDown, Users } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link } from "react-router-dom";
import { Card, CardHeader } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Loading } from "../components/ui/Loading";
import { RiskBadge } from "../components/ui/RiskBadge";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Table, type TableColumn } from "../components/ui/Table";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { getAllCashDemand, getAllDashboardPredictions, getAllDashboardTransactions, getDashboardAlerts, getDashboardRecommendations } from "../services/analyticsService";
import { getAllDashboardAtms, getDashboardSummary } from "../services/dashboardService";
import type { DashboardAlert, DashboardAtmStatus, DashboardRecommendation, DashboardTransaction } from "../types/dashboard";
import { inrFormatter } from "../utils/formatters";

const dateLabel = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });
const chartColors = ["#126b58", "#d3a156", "#648da3", "#bd6257", "#89958e"];

function dateRange() {
  const today = new Date();
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - 6);
  const forecastEnd = new Date(today);
  forecastEnd.setUTCDate(forecastEnd.getUTCDate() + 7);
  return {
    from: start.toISOString().slice(0, 10),
    today: today.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
    forecastTo: forecastEnd.toISOString().slice(0, 10),
  };
}

function currencyTick(value: number) {
  return `₹${Math.round(value / 1000)}k`;
}

function ChartPanel({ title, description, loading, error, empty, onRetry, children }: {
  title: string;
  description: string;
  loading: boolean;
  error: boolean;
  empty: boolean;
  onRetry: () => void;
  children: ReactNode;
}) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader title={title} description={description} />
      {loading ? <Loading label={`Loading ${title.toLowerCase()}`} /> : error ? <ErrorState title={`${title} unavailable`} message="Analytics data could not be loaded." onRetry={onRetry} /> : empty ? <EmptyState title="No data available" message="This chart will appear when the backend has records for this period." /> : <div className="h-[260px] px-2 pb-4 pt-5 sm:px-4">{children}</div>}
    </Card>
  );
}

function groupTransactions(transactions: DashboardTransaction[]) {
  const grouped = new Map<string, { date: string; withdrawals: number; volume: number }>();
  for (const transaction of transactions) {
    const date = transaction.timestamp.slice(0, 10);
    const row = grouped.get(date) ?? { date, withdrawals: 0, volume: 0 };
    row.volume += 1;
    if (transaction.success && transaction.transactionType === "WITHDRAWAL") row.withdrawals += transaction.amount;
    grouped.set(date, row);
  }
  return [...grouped.values()].sort((left, right) => left.date.localeCompare(right.date));
}

export function Dashboard() {
  useDocumentTitle("Overview");
  const [range] = useState(dateRange);
  const summary = useQuery({ queryKey: ["dashboard", "summary"], queryFn: () => getDashboardSummary() });
  const atms = useQuery({ queryKey: ["dashboard", "atm-status", "all"], queryFn: getAllDashboardAtms });
  const transactions = useQuery({ queryKey: ["analytics", "transactions", range.from, range.to], queryFn: () => getAllDashboardTransactions({ from: range.from, to: range.to }) });
  const demand = useQuery({ queryKey: ["analytics", "cash-demand", range.today, range.forecastTo], queryFn: () => getAllCashDemand({ from: range.today, to: range.forecastTo }) });
  const predictions = useQuery({ queryKey: ["analytics", "predictions", range.from, range.forecastTo], queryFn: () => getAllDashboardPredictions({ from: range.from, to: range.forecastTo }) });
  const alerts = useQuery({ queryKey: ["analytics", "alerts", "latest"], queryFn: () => getDashboardAlerts({ page: 0, size: 5 }) });
  const recommendations = useQuery({ queryKey: ["analytics", "recommendations", "pending"], queryFn: () => getDashboardRecommendations({ status: "PENDING", page: 0, size: 5 }) });

  const atmRows = atms.data ?? [];
  const atmById = new Map(atmRows.map((atm) => [atm.id, atm]));
  const transactionRows = transactions.data ?? [];
  const dailyTransactions = groupTransactions(transactionRows);
  const dailyDemand = new Map<string, number>();
  for (const row of demand.data ?? []) dailyDemand.set(row.date, (dailyDemand.get(row.date) ?? 0) + row.predictedDemand);
  const demandSeries = [...dailyDemand.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([date, predicted]) => ({ date, predicted }));
  const predictedByDate = new Map<string, number>();
  for (const row of predictions.data ?? []) predictedByDate.set(row.predictionDate, (predictedByDate.get(row.predictionDate) ?? 0) + row.predictedDemand);
  const actualByDate = new Map(dailyTransactions.map((row) => [row.date, row.withdrawals]));
  const comparisonSeries = [...new Set([...predictedByDate.keys(), ...actualByDate.keys()])].sort().map((date) => ({ date, predicted: predictedByDate.get(date), actual: actualByDate.get(date) }));
  const cashLevels = [...atmRows].sort((left, right) => left.currentCash - right.currentCash).slice(0, 10);
  const statusCounts = [...atmRows.reduce((counts, atm) => counts.set(atm.status, (counts.get(atm.status) ?? 0) + 1), new Map<string, number>())]
    .map(([status, count]) => ({ status: status.replaceAll("_", " "), count }));
  const riskAtms = atmRows.filter((atm) => atm.riskLevel === "HIGH" || atm.riskLevel === "CRITICAL").slice(0, 5);
  const summaryData = summary.data;
  const formatAtm = (atmId: number) => atmById.get(atmId)?.atmCode ?? `ATM ${atmId}`;
  const metrics = summaryData ? [
    { label: "Total ATMs", value: summaryData.totalAtms.toLocaleString("en-IN"), icon: MapPin },
    { label: "Active ATMs", value: summaryData.activeAtms.toLocaleString("en-IN"), icon: Activity },
    { label: "Low cash ATMs", value: summaryData.lowCashAtms.toLocaleString("en-IN"), icon: TrendingDown },
    { label: "Critical ATMs", value: summaryData.criticalAtms.toLocaleString("en-IN"), icon: ShieldAlert },
    { label: "Total cash", value: inrFormatter.format(summaryData.totalCash), icon: Banknote },
    { label: "Today's withdrawals", value: inrFormatter.format(summaryData.todaysWithdrawals), icon: CircleDollarSign },
    { label: "Predicted demand", value: inrFormatter.format(summaryData.predictedDemand), icon: TrendingDown },
    { label: "Open alerts", value: summaryData.openAlerts.toLocaleString("en-IN"), icon: AlertTriangle },
    { label: "Pending refills", value: summaryData.pendingRefills.toLocaleString("en-IN"), icon: Clock3 },
    { label: "High-risk ATMs", value: summaryData.highRiskAtms.toLocaleString("en-IN"), icon: Users },
  ] : [];

  const highRiskColumns: TableColumn<DashboardAtmStatus>[] = [
    { key: "atm", header: "ATM", render: (row) => <Link className="font-semibold text-moss hover:underline" to={`/atms/${row.id}`}>{row.atmCode}</Link> },
    { key: "location", header: "Location", render: (row) => <span className="text-xs text-muted">{row.location}</span> },
    { key: "cash", header: "Current cash", render: (row) => <span className="font-semibold">{inrFormatter.format(row.currentCash)}</span> },
    { key: "risk", header: "Risk", render: (row) => <RiskBadge level={row.riskLevel} /> },
  ];
  const alertColumns: TableColumn<DashboardAlert>[] = [
    { key: "type", header: "Alert", render: (row) => <div><p className="font-semibold text-ink">{row.alertType.replaceAll("_", " ")}</p><p className="mt-1 max-w-[260px] truncate text-xs text-muted">{row.message}</p></div> },
    { key: "atm", header: "ATM", render: (row) => <Link className="text-xs font-semibold text-moss hover:underline" to={`/atms/${row.atmId}`}>{formatAtm(row.atmId)}</Link> },
    { key: "severity", header: "Risk", render: (row) => <RiskBadge level={row.severity} /> },
  ];
  const recommendationColumns: TableColumn<DashboardRecommendation>[] = [
    { key: "atm", header: "ATM", render: (row) => <Link className="font-semibold text-moss hover:underline" to={`/atms/${row.atmId}`}>{formatAtm(row.atmId)}</Link> },
    { key: "amount", header: "Recommended refill", render: (row) => <span className="font-semibold">{inrFormatter.format(row.recommendedRefillAmount)}</span> },
    { key: "date", header: "Recommended date", render: (row) => <span className="text-xs text-muted">{row.recommendedRefillDate}</span> },
    { key: "priority", header: "Priority", render: (row) => <RiskBadge level={row.priority} /> },
  ];
  const transactionColumns: TableColumn<DashboardTransaction>[] = [
    { key: "id", header: "Transaction", render: (row) => <span className="font-mono text-xs">{row.transactionId}</span> },
    { key: "atm", header: "ATM", render: (row) => <Link className="text-xs font-semibold text-moss hover:underline" to={`/atms/${row.atmId}`}>{formatAtm(row.atmId)}</Link> },
    { key: "type", header: "Type", render: (row) => <span className="text-xs">{row.transactionType.replaceAll("_", " ")}</span> },
    { key: "amount", header: "Amount", render: (row) => <span className="font-semibold">{inrFormatter.format(row.amount)}</span> },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.success ? "SUCCESS" : "FAILED"} /> },
  ];

  return (
    <div className="page-enter space-y-6 sm:space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-moss">Bank operations</p><h1 className="mt-2 text-2xl font-bold text-ink sm:text-[28px]">Network dashboard</h1><p className="mt-1 text-sm text-muted">Cash position, service health, demand, and refill decisions.</p></div>
        <span className="text-xs text-muted">Updated {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date())}</span>
      </header>

      <section aria-label="Network metrics" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {summary.isPending ? Array.from({ length: 10 }, (_, index) => <Card key={index} className="h-[112px] animate-pulse bg-white p-4"><div className="h-3 w-24 rounded bg-canvas" /><div className="mt-5 h-6 w-32 rounded bg-canvas" /></Card>) : summary.isError ? <div className="sm:col-span-2 lg:col-span-3 2xl:col-span-5"><ErrorState title="Dashboard summary unavailable" message="Network metrics could not be loaded." onRetry={() => void summary.refetch()} /></div> : metrics.map(({ label, value, icon: Icon }) => <Card key={label} className="p-4 sm:p-5"><div className="flex items-start justify-between gap-2"><p className="text-xs font-semibold text-muted">{label}</p><span className="grid size-8 shrink-0 place-items-center rounded-md bg-canvas text-moss"><Icon aria-hidden="true" className="size-4" /></span></div><p className="mt-4 break-words font-mono text-xl font-semibold leading-tight text-ink">{value}</p></Card>)}
      </section>

      <section aria-label="Cash and demand analytics" className="grid gap-4 xl:grid-cols-2">
        <ChartPanel title="Cash demand forecast" description="Model-generated demand by date · next 7 days" loading={demand.isPending} error={demand.isError} empty={!demand.data?.length} onRetry={() => void demand.refetch()}>
          <ResponsiveContainer width="100%" height="100%"><AreaChart data={demandSeries} margin={{ top: 6, right: 10, bottom: 0, left: -12 }}><defs><linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#126b58" stopOpacity={0.2} /><stop offset="100%" stopColor="#126b58" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#e8ece8" strokeDasharray="3 4" /><XAxis dataKey="date" tickFormatter={(value: string) => dateLabel.format(new Date(`${value}T00:00:00Z`))} axisLine={false} tickLine={false} tick={{ fill: "#79857f", fontSize: 10 }} /><YAxis tickFormatter={currencyTick} axisLine={false} tickLine={false} tick={{ fill: "#79857f", fontSize: 10 }} /><Tooltip labelFormatter={(value) => dateLabel.format(new Date(`${String(value)}T00:00:00Z`))} formatter={(value) => inrFormatter.format(Number(value))} /><Area type="monotone" dataKey="predicted" name="Predicted demand" stroke="#126b58" strokeWidth={2.4} fill="url(#forecastFill)" /></AreaChart></ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Daily withdrawal trend" description="Successful withdrawal amount · last 7 days" loading={transactions.isPending} error={transactions.isError} empty={!dailyTransactions.length} onRetry={() => void transactions.refetch()}>
          <ResponsiveContainer width="100%" height="100%"><LineChart data={dailyTransactions} margin={{ top: 6, right: 10, bottom: 0, left: -12 }}><CartesianGrid vertical={false} stroke="#e8ece8" strokeDasharray="3 4" /><XAxis dataKey="date" tickFormatter={(value: string) => dateLabel.format(new Date(`${value}T00:00:00Z`))} axisLine={false} tickLine={false} tick={{ fill: "#79857f", fontSize: 10 }} /><YAxis tickFormatter={currencyTick} axisLine={false} tickLine={false} tick={{ fill: "#79857f", fontSize: 10 }} /><Tooltip labelFormatter={(value) => dateLabel.format(new Date(`${String(value)}T00:00:00Z`))} formatter={(value) => inrFormatter.format(Number(value))} /><Line type="monotone" dataKey="withdrawals" name="Withdrawals" stroke="#d3a156" strokeWidth={2.4} dot={{ r: 3 }} /></LineChart></ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="ATM cash levels" description="Lowest cash balances across the network" loading={atms.isPending} error={atms.isError} empty={!cashLevels.length} onRetry={() => void atms.refetch()}>
          <ResponsiveContainer width="100%" height="100%"><BarChart data={cashLevels} layout="vertical" margin={{ top: 0, right: 14, bottom: 0, left: 8 }}><CartesianGrid horizontal={false} stroke="#e8ece8" strokeDasharray="3 4" /><XAxis type="number" tickFormatter={currencyTick} axisLine={false} tickLine={false} tick={{ fill: "#79857f", fontSize: 10 }} /><YAxis type="category" dataKey="atmCode" width={74} axisLine={false} tickLine={false} tick={{ fill: "#56635d", fontSize: 10 }} /><Tooltip formatter={(value) => inrFormatter.format(Number(value))} /><Bar dataKey="currentCash" name="Current cash" fill="#648da3" radius={[0, 3, 3, 0]} barSize={13} /></BarChart></ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="ATM status distribution" description="Current backend-reported ATM status" loading={atms.isPending} error={atms.isError} empty={!statusCounts.length} onRetry={() => void atms.refetch()}>
          <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusCounts} dataKey="count" nameKey="status" innerRadius={58} outerRadius={92} paddingAngle={3}>{statusCounts.map((row, index) => <Cell key={row.status} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip /><Legend verticalAlign="bottom" height={28} formatter={(value) => <span className="text-xs text-muted">{value}</span>} /></PieChart></ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Transaction volume" description="Recorded transactions by day · last 7 days" loading={transactions.isPending} error={transactions.isError} empty={!dailyTransactions.length} onRetry={() => void transactions.refetch()}>
          <ResponsiveContainer width="100%" height="100%"><BarChart data={dailyTransactions} margin={{ top: 6, right: 10, bottom: 0, left: -12 }}><CartesianGrid vertical={false} stroke="#e8ece8" strokeDasharray="3 4" /><XAxis dataKey="date" tickFormatter={(value: string) => dateLabel.format(new Date(`${value}T00:00:00Z`))} axisLine={false} tickLine={false} tick={{ fill: "#79857f", fontSize: 10 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#79857f", fontSize: 10 }} allowDecimals={false} /><Tooltip /><Bar dataKey="volume" name="Transactions" fill="#126b58" radius={[3, 3, 0, 0]} barSize={24} /></BarChart></ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Prediction vs actual demand" description="Backend forecasts compared with successful withdrawals" loading={predictions.isPending || transactions.isPending} error={predictions.isError || transactions.isError} empty={!comparisonSeries.length} onRetry={() => void Promise.all([predictions.refetch(), transactions.refetch()])}>
          <ResponsiveContainer width="100%" height="100%"><LineChart data={comparisonSeries} margin={{ top: 6, right: 10, bottom: 0, left: -12 }}><CartesianGrid vertical={false} stroke="#e8ece8" strokeDasharray="3 4" /><XAxis dataKey="date" tickFormatter={(value: string) => dateLabel.format(new Date(`${value}T00:00:00Z`))} axisLine={false} tickLine={false} tick={{ fill: "#79857f", fontSize: 10 }} /><YAxis tickFormatter={currencyTick} axisLine={false} tickLine={false} tick={{ fill: "#79857f", fontSize: 10 }} /><Tooltip labelFormatter={(value) => dateLabel.format(new Date(`${String(value)}T00:00:00Z`))} formatter={(value) => inrFormatter.format(Number(value))} /><Legend /><Line type="monotone" dataKey="predicted" name="Predicted" stroke="#126b58" strokeWidth={2.2} connectNulls dot={false} /><Line type="monotone" dataKey="actual" name="Actual withdrawals" stroke="#bd6257" strokeWidth={2.2} connectNulls dot={false} /></LineChart></ResponsiveContainer>
        </ChartPanel>
      </section>

      <section aria-label="Operations queues" className="grid gap-4 xl:grid-cols-2">
        <Card className="min-w-0 overflow-hidden"><CardHeader title="High-risk ATMs" description="Backend-rated high and critical locations" action={<Link to="/atms" className="text-xs font-bold text-moss hover:underline">ATM directory</Link>} />{atms.isPending ? <Loading label="Loading ATM risk" /> : atms.isError ? <ErrorState title="Risk list unavailable" message="ATM risk data could not be loaded." onRetry={() => void atms.refetch()} /> : riskAtms.length ? <Table columns={highRiskColumns} rows={riskAtms} rowKey={(row) => row.id} /> : <EmptyState title="No high-risk ATMs" message="No ATM is currently rated high or critical." />}</Card>
        <Card className="min-w-0 overflow-hidden"><CardHeader title="Latest alerts" description="Most recently recorded network alerts" action={<Link to="/alerts" className="text-xs font-bold text-moss hover:underline">Alert center</Link>} />{alerts.isPending ? <Loading label="Loading latest alerts" /> : alerts.isError ? <ErrorState title="Alerts unavailable" message="Recent alert data could not be loaded." onRetry={() => void alerts.refetch()} /> : alerts.data.content.length ? <Table columns={alertColumns} rows={alerts.data.content} rowKey={(row) => row.id} /> : <EmptyState title="No alerts" message="There are no alerts to display." />}</Card>
        <Card className="min-w-0 overflow-hidden"><CardHeader title="Pending refill recommendations" description="Backend-generated decisions awaiting review" action={<Link to="/optimization" className="text-xs font-bold text-moss hover:underline">Review all</Link>} />{recommendations.isPending ? <Loading label="Loading recommendations" /> : recommendations.isError ? <ErrorState title="Recommendations unavailable" message="Pending refill recommendations could not be loaded." onRetry={() => void recommendations.refetch()} /> : recommendations.data.content.length ? <Table columns={recommendationColumns} rows={recommendations.data.content} rowKey={(row) => row.id} /> : <EmptyState title="No pending recommendations" message="New refill decisions will appear here." />}</Card>
        <Card className="min-w-0 overflow-hidden"><CardHeader title="Recent transactions" description="Latest activity recorded across the network" />{transactions.isPending ? <Loading label="Loading recent transactions" /> : transactions.isError ? <ErrorState title="Transactions unavailable" message="Recent transaction data could not be loaded." onRetry={() => void transactions.refetch()} /> : transactionRows.length ? <Table columns={transactionColumns} rows={transactionRows.slice(0, 5)} rowKey={(row) => row.id} /> : <EmptyState title="No transactions" message="No activity is available for this period." />}</Card>
      </section>
      <p className="text-[11px] text-muted">Dashboard figures, risk levels, and recommendations are supplied by backend services.</p>
    </div>
  );
}