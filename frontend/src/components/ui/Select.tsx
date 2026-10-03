import { useId, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
}

export function Select({ label, options, placeholder, error, id, className, ...props }: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className="grid gap-1.5">
      <label htmlFor={selectId} className="text-sm font-semibold text-ink">{label}</label>
      <div className="relative">
        <select id={selectId} aria-invalid={Boolean(error)} className={cn("h-11 w-full appearance-none rounded-md border border-line bg-white px-3.5 pr-10 text-sm text-ink focus:border-moss focus:outline-none focus:ring-3 focus:ring-mint", error && "border-coral", className)} {...props}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      </div>
      {error && <span className="text-xs text-coral">{error}</span>}
    </div>
  );
}