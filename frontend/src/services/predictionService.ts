import axios from "axios";
import { api, assertResourceId, unwrapApiResponse } from "./api";
import type { ApiEnvelope } from "../types/api";
import type { PredictionInput, PredictionRecord } from "../types/prediction";

export async function generatePrediction(atmId: number, input: PredictionInput): Promise<PredictionRecord> {
  const validAtmId = assertResourceId(atmId, "ATM");
  const { data } = await api.post<ApiEnvelope<PredictionRecord> | PredictionRecord>(`/predictions/${validAtmId}`, {
    atmId: validAtmId,
    predictionDate: input.predictionDate,
  });
  return unwrapApiResponse(data);
}

export async function getAtmPredictions(atmId: number): Promise<PredictionRecord[]> {
  const { data } = await api.get<ApiEnvelope<PredictionRecord[]> | PredictionRecord[]>(`/predictions/${assertResourceId(atmId, "ATM")}`);
  return unwrapApiResponse(data);
}

export async function getLatestPrediction(atmId: number): Promise<PredictionRecord | null> {
  try {
    const { data } = await api.get<ApiEnvelope<PredictionRecord> | PredictionRecord>(`/predictions/${assertResourceId(atmId, "ATM")}/latest`);
    return unwrapApiResponse(data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
}

export async function getForecast(atmId: number): Promise<PredictionRecord[]> {
  const { data } = await api.get<ApiEnvelope<PredictionRecord[]> | PredictionRecord[]>(`/predictions/${assertResourceId(atmId, "ATM")}/forecast`);
  return unwrapApiResponse(data);
}