import { api, assertOptionalResourceId, assertResourceId, unwrapApiResponse } from "./api";
import type { ApiEnvelope } from "../types/api";
import type { GenerateRecommendationInput, GeneratedRecommendation, OptimizationRecommendation } from "../types/optimization";

export async function getRecommendations(): Promise<OptimizationRecommendation[]> {
  const { data } = await api.get<ApiEnvelope<OptimizationRecommendation[]> | OptimizationRecommendation[]>("/optimization/recommendations");
  return unwrapApiResponse(data);
}

export async function getAtmRecommendation(atmId: number): Promise<OptimizationRecommendation[]> {
  const { data } = await api.get<ApiEnvelope<OptimizationRecommendation[]> | OptimizationRecommendation[]>(`/optimization/atms/${assertResourceId(atmId, "ATM")}`);
  return unwrapApiResponse(data);
}

export async function generateRecommendation(atmId: number, input: GenerateRecommendationInput = {}): Promise<GeneratedRecommendation> {
  assertOptionalResourceId(input.predictionId, "Prediction");
  const { data } = await api.post<ApiEnvelope<GeneratedRecommendation> | GeneratedRecommendation>(`/optimization/atms/${assertResourceId(atmId, "ATM")}/recommend`, input);
  return unwrapApiResponse(data);
}

export async function approveRecommendation(id: number): Promise<OptimizationRecommendation> {
  const { data } = await api.post<ApiEnvelope<OptimizationRecommendation> | OptimizationRecommendation>(`/optimization/recommendations/${assertResourceId(id, "Recommendation")}/approve`);
  return unwrapApiResponse(data);
}

export async function rejectRecommendation(id: number): Promise<OptimizationRecommendation> {
  const { data } = await api.post<ApiEnvelope<OptimizationRecommendation> | OptimizationRecommendation>(`/optimization/recommendations/${assertResourceId(id, "Recommendation")}/reject`);
  return unwrapApiResponse(data);
}