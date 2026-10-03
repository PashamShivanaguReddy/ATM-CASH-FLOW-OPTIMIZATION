import { Inbox } from "lucide-react";

export function EmptyState({ title = "Nothing to show yet", message = "When information is available, it will appear here." }: { title?: string; message?: string }) {
  return <div className="flex min-h-52 flex-col items-center justify-center px-5 text-center"><Inbox aria-hidden="true" className="size-8 text-muted/70" /><h2 className="mt-3 text-sm font-bold text-ink">{title}</h2><p className="mt-1 max-w-sm text-sm text-muted">{message}</p></div>;
}