import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  labelAction?: ReactNode;
  error?: string;
  hint?: string;
}

export function Input({ label, labelAction, error, hint, id, className, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;

  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-3"><label htmlFor={inputId} className="text-sm font-semibold text-ink">{label}</label>{labelAction}</div>
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? messageId : undefined}
        className={cn("h-11 w-full rounded-md border border-line bg-white px-3.5 text-sm text-ink placeholder:text-[#9aa6a1] focus:border-moss focus:outline-none focus:ring-3 focus:ring-mint", error && "border-coral", className)}
        {...props}
      />
      {(error || hint) && <span id={messageId} className={cn("text-xs", error ? "text-coral" : "text-muted")}>{error ?? hint}</span>}
    </div>
  );
}