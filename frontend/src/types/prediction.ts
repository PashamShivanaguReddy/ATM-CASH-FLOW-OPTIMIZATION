export interface PredictionRecord {
  id: number;
  atmId: number;
  predictionDate: string;
  predictedDemand: number;
  confidenceScore: number | null;
  modelVersion: string;
  generatedAt: string;
}

export interface PredictionInput {
  predictionDate: string;
}

export interface DemandPeriod {
  period: string;
  amount: number;
  transactionCount: number;
}

export interface TransactionSummary {
  numberOfTransactions: number;
  totalWithdrawals: number;
  totalDeposits: number;
  averageWithdrawal: number | null;
  maximumWithdrawal: number | null;
  peakTransactionHour: number | null;
}