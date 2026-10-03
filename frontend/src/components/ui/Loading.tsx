import { LoaderCircle } from "lucide-react";

export function Loading({ label = "Loading" }: { label?: string }) {
  return <div role="status" className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted"><LoaderCircle aria-hidden="true" className="size-4 animate-spin" />{label}</div>;
}