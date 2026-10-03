import { CircleAlert } from "lucide-react";
import { Button } from "./Button";

export function ErrorState({ title = "Something went wrong", message = "We couldn't load this view.", onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex min-h-52 flex-col items-center justify-center px-5 text-center">
      <CircleAlert aria-hidden="true" className="size-8 text-coral" />
      <h2 className="mt-3 text-sm font-bold text-ink">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
      {onRetry && <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>Try again</Button>}
    </div>
  );
}