export type AtmRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface DashboardSummary {
  totalAtms: number;
  activeAtms: number;
  lowCashAtms: number;
  criticalAtms: number;
  totalCash: number;
  todaysWithdrawals: number;
  todaysTransactions: number;
  predictedDemand: number;
  pendingRefills: number;
  openAlerts: number;
  highRiskAtms: number;
}

export interface DashboardPage<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface DashboardAtmStatus {
  id: number;
  atmCode: string;
  bankId: number;
  location: string;
  status: string;
  currentCash: number;
  minimumCashThreshold: number;
  lowCash: boolean;
  critical: boolean;
  riskLevel?: AtmRiskLevel | null;
}

export interface DashboardDemand {
  atmId: number;
  date: string;
  predictedDemand: number;
  confidenceScore: number | null;
  modelVersion: string;
}

export interface DashboardTransaction {
  id: number;
  atmId: number;
  transactionId: string;
  transactionType: string;
  amount: number;
  timestamp: string;
  success: boolean;
}

export interface DashboardPrediction {
  id: number;
  atmId: number;
  predictionDate: string;
  predictedDemand: number;
  confidenceScore: number | null;
  modelVersion: string;
  generatedAt: string;
}

export interface DashboardAlert {
  id: number;
  atmId: number;
  alertType: string;
  severity: AtmRiskLevel;
  status: string;
  message: string;
  createdAt: string;
  resolvedAt: string | null;
}

export interface DashboardRefill {
  id: number;
  atmId: number;
  refillAmount: number;
  refillDate: string;
  status: string;
}

export interface DashboardRecommendation {
  id: number;
  atmId: number;
  currentCash: number;
  predictedDemand: number;
  recommendedRefillAmount: number;
  recommendedRefillDate: string;
  priority: AtmRiskLevel;
  status: string;
  reason: string;
}

export interface DashboardFilters {
  bankId?: number;
  atmId?: number;
  from?: string;
  to?: string;
  status?: string;
  page?: number;
  size?: number;
}