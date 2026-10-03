import type { AtmRiskLevel } from "../../types/dashboard";
import { Badge } from "./Badge";

const tones: Record<AtmRiskLevel, "success" | "info" | "warning" | "danger"> = {
  LOW: "success",
  MEDIUM: "info",
  HIGH: "warning",
  CRITICAL: "danger",
};

export function RiskBadge({ level }: { level?: AtmRiskLevel | null }) {
  if (!level || !Object.prototype.hasOwnProperty.call(tones, level)) {
    return <Badge tone="neutral" aria-label="Risk level unavailable">Risk unavailable</Badge>;
  }
  return <Badge tone={tones[level]} aria-label={`Risk level: ${level.toLowerCase()}`}>{level}</Badge>;
}