import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export interface DebtReportResponse {
  success: boolean;
  summary: {
    totalPartners: number;
    totalRevenue: number;
    totalServiceFee: number;
    feePaid: number;
    feeOutstanding: number;
    receivableOutstanding: number;
    fullySettled: number;
    partial: number;
    overdue: number;
  };
  partners: Array<{
    partnerId: string;
    partnerName: string;
    totalRevenue: number;
    totalServiceFee: number;
    feePaid: number;
    feeOutstanding: number;
    serviceFeeBalance: number;
    receivableBalance: number;
    netReceivable: number;
    totalBookings: number;
    totalSeats: number;
    latestBooking: string | null;
    lastWithdrawalAt: string | null;
    totalWithdrawnFee: number;
    totalWithdrawnReceivable: number;
    feeStatus: "settled" | "partial" | "due";
  }>;
  charts: {
    revenueTop: Array<{ name: string; revenue: number }>;
    feeStatus: Array<{ status: string; value: number; color: string }>;
  };
  generatedAt: string;
}

export const fetchAdminDebtReport = async (): Promise<DebtReportResponse> => {
  const res = await axios.get(`${API_BASE}/api/withdrawals/report/debts`);
  return res.data;
};
