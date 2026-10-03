import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function PlaceholderPage({ title, description, icon: Icon }: { title: string; description: string; icon: LucideIcon }) {
  useDocumentTitle(title);
  return (
    <div className="page-enter space-y-6">
      <div><p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-moss">Operations workspace</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-[28px]">{title}</h1><p className="mt-1 text-sm text-muted">{description}</p></div>
      <Card className="overflow-hidden"><div className="flex items-center gap-3 border-b border-line px-5 py-4 sm:px-6"><span className="grid size-9 place-items-center rounded-md bg-mint text-moss"><Icon aria-hidden="true" className="size-[18px]" /></span><div><p className="text-xs font-bold text-ink">{title} workspace</p><p className="mt-0.5 text-[11px] text-muted">Service integration will be connected in a later phase.</p></div><ArrowUpRight aria-hidden="true" className="ml-auto size-4 text-muted" /></div><EmptyState title="No live data connected" message="This view is ready for its API-backed workflow. No operational records are being simulated here." /></Card>
    </div>
  );
}