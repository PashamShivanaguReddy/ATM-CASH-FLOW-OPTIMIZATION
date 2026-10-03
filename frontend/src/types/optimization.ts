import type { AtmRiskLevel } from "./dashboard";

export type RecommendationStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

export interface OptimizationRecommendation {
  id: number;
  atmId: number;
  predictionId: number | null;
  currentCash: number;
  predictedDemand: number;
  safetyReserve: number;
  recommendedRefillAmount: number;
  recommendedRefillDate: string;
  priority: AtmRiskLevel;
  reason: string;
  status: RecommendationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateRecommendationInput {
  predictionId?: number;
  predictedDemand?: number;
  safetyReserve?: number;
  recommendedRefillDate?: string;
}

export type GeneratedRecommendation = Omit<OptimizationRecommendation, "id"> & { id: number | null };