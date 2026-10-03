export interface DenominationRecord {
  denomination: number;
  noteCount: number;
  totalAmount: number;
}

export interface CashInventoryRecord {
  atmId: number;
  denominations: DenominationRecord[];
  totalCash: number;
}