import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

type BadgeTone = "success" | "warning" | "danger" | "neutral" | "info";

const tones: Record<BadgeTone, string> = {
  success: "bg-[#e4f3eb] text-[#1c7354]",
  warning: "bg-[#fff1d9] text-[#9a5d14]",
  danger: "bg-[#fbe8e5] text-[#a4433c]",
  neutral: "bg-[#edf0ed] text-[#596660]",
  info: "bg-[#e5eef5] text-[#42677f]",
};

export function Badge({ tone = "neutral", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return <span className={cn("inline-flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-bold leading-none", tones[tone], className)} {...props} />;
}