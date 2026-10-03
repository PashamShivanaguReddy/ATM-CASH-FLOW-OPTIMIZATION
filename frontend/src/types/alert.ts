export type AlertType = "LOW_CASH" | "STOCKOUT_RISK" | "HIGH_DEMAND" | "ATM_OUT_OF_SERVICE" | "UNUSUAL_ACTIVITY";
export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AlertStatus = "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";

export interface AlertRecord {
  id: number;
  atmId: number;
  alertType: AlertType;
  severity: AlertSeverity;
  message: string;
  status: AlertStatus;
  createdAt: string;
  resolvedAt: string | null;
}

export interface AlertFilters {
  atmId?: number;
  status?: AlertStatus;
}