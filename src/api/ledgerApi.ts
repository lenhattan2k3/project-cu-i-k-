import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export interface PartnerLedger {
  partnerId: string;
  serviceFeeBalance: number;
  receivableBalance: number;
  totalRevenue: number;
  totalServiceFee: number;
  totalDiscounts: number;
  totalWithdrawnFee: number;
  totalWithdrawnReceivable: number;
  lastBookingAt?: string | null;
  lastWithdrawalAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  meta?: Record<string, unknown> | null;
}

export interface PartnerLedgerResponse {
  success: boolean;
  ledger: PartnerLedger;
}

export const fetchPartnerLedger = async (partnerId: string): Promise<PartnerLedgerResponse> => {
  if (!partnerId) {
    throw new Error("partnerId is required");
  }
  const res = await axios.get(`${API_BASE}/api/finance/ledger/${partnerId}`);
  return res.data;
};

export const rebuildPartnerLedger = async (partnerId: string) => {
  if (!partnerId) {
    throw new Error("partnerId is required");
  }
  const res = await axios.post(`${API_BASE}/api/finance/ledger/${partnerId}/rebuild`);
  return res.data;
};
