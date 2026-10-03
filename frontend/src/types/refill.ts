export type RefillStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "COMPLETED" | "CANCELLED";

export interface RefillRecord {
  id: number;
  atmId: number;
  requestedBy: number | null;
  approvedBy: number | null;
  refillAmount: number;
  refillDate: string;
  status: RefillStatus;
  notes: string | null;
  recommendationId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface RefillInput {
  atmId: number;
  refillAmount: number;
  notes?: string;
}