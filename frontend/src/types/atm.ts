export type AtmStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "OUT_OF_SERVICE" | "LOW_CASH";
export type AtmType = "STANDARD" | "DRIVE_THROUGH" | "KIOSK";

export interface AtmRecord {
  id: number;
  atmCode: string;
  bankId: number;
  location: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  atmType: AtmType;
  status: AtmStatus;
  cashCapacity: number;
  minimumCashThreshold: number;
  maximumCashThreshold: number;
  currentCash: number;
  lastRefillAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AtmInput {
  atmCode: string;
  bankId: number;
  location: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  atmType: AtmType;
  status: AtmStatus;
  cashCapacity: number;
  minimumCashThreshold: number;
  maximumCashThreshold: number;
  currentCash: number;
}

export interface AtmListParams {
  page: number;
  size: number;
  bankId?: number;
  status?: AtmStatus | "";
  sort: string;
}

export interface AtmPage {
  items: AtmRecord[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}