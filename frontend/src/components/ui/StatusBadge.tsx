import { Badge } from "./Badge";

const tones: Record<string, "success" | "warning" | "danger" | "neutral" | "info"> = {
  ACTIVE: "success",
  COMPLETED: "success",
  APPROVED: "success",
  SUCCESS: "success",
  LOW_CASH: "warning",
  REQUESTED: "warning",
  MAINTENANCE: "warning",
  REJECTED: "danger",
  FAILED: "danger",
  OUT_OF_SERVICE: "danger",
  CANCELLED: "neutral",
  INACTIVE: "neutral",
  STANDARD: "neutral",
  DRIVE_THROUGH: "info",
  KIOSK: "info",
};

export function StatusBadge({ status }: { status: string }) {
  const label = status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());
  return <Badge tone={tones[status] ?? "neutral"}>{label}</Badge>;
}