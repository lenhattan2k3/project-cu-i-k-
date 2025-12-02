// File: src/home/partner/PartnerPayment.tsx
import { useEffect, useState } from "react";
import { DollarSign, RefreshCw } from "lucide-react";
import { auth } from "../../firebase/config";
import { getBookingsByPartnerId } from "../../api/bookingApi";
import { getFeeConfig } from "../../api/feeApi";
import { socket } from "../../utils/socket";
import { createPaymentLink } from "../../api/payosApi";
import type { PartnerLedger } from "../../api/ledgerApi";
import { fetchPartnerLedger, rebuildPartnerLedger } from "../../api/ledgerApi";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

// Inline replacement for removed ../../api/withdrawalApi
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
const PARTNER_PAYMENTS_URL =
  import.meta.env.VITE_PARTNER_PAYMENTS_URL ?? "http://localhost:5173/homepartner/payments";

const SERVICE_FEE_OVERRIDE_KEY = "partnerServiceFeeOverrides";
const PENDING_PAYOS_STORAGE_KEY = "partnerPayosPendingPayments";
const PENDING_PAYOS_EXPIRY_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

type ServiceFeeOverrideStore = Record<string, { balance: number; updatedAt: number }>;
type PendingPayosEntry = {
  partnerId: string;
  payosOrderCode: string; // numeric string from PayOS
  withdrawalOrderCode?: string; // WD-... from withdrawal doc
  withdrawalId?: string;
  amount: number;
  createdAt: number;
};

type PendingPayosStore = Record<string, PendingPayosEntry>;

const readStore = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined" || !window.localStorage) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (err) {
    console.warn("Failed to parse store", key, err);
    return fallback;
  }
};

const writeStore = <T,>(key: string, value: T) => {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn("Failed to persist store", key, err);
  }
};

const getServiceFeeOverrideRecord = (partnerId: string) => {
  if (!partnerId) return null;
  const store = readStore<ServiceFeeOverrideStore>(SERVICE_FEE_OVERRIDE_KEY, {});
  return store[partnerId] ?? null;
};

const persistServiceFeeOverrideRecord = (partnerId: string, balance: number) => {
  if (!partnerId) return;
  const store = readStore<ServiceFeeOverrideStore>(SERVICE_FEE_OVERRIDE_KEY, {});
  store[partnerId] = {
    balance: Math.max(0, Math.round(balance)),
    updatedAt: Date.now(),
  };
  writeStore(SERVICE_FEE_OVERRIDE_KEY, store);
};

const clearServiceFeeOverrideRecord = (partnerId: string) => {
  if (!partnerId) return;
  const store = readStore<ServiceFeeOverrideStore>(SERVICE_FEE_OVERRIDE_KEY, {});
  if (store[partnerId]) {
    delete store[partnerId];
    writeStore(SERVICE_FEE_OVERRIDE_KEY, store);
  }
};

const resolveServiceFeeBalance = (partnerId: string, backendBalance: number) => {
  const override = getServiceFeeOverrideRecord(partnerId);
  if (!override) return backendBalance;
  if (backendBalance <= override.balance) {
    clearServiceFeeOverrideRecord(partnerId);
    return backendBalance;
  }
  return override.balance;
};

const readPendingPayosStore = (): PendingPayosStore => {
  const store = readStore<PendingPayosStore>(PENDING_PAYOS_STORAGE_KEY, {});
  const now = Date.now();
  let mutated = false;
  Object.keys(store).forEach((code) => {
    if (now - store[code].createdAt > PENDING_PAYOS_EXPIRY_MS) {
      delete store[code];
      mutated = true;
    }
  });
  if (mutated) {
    writeStore(PENDING_PAYOS_STORAGE_KEY, store);
  }
  return store;
};

const writePendingPayosStore = (store: PendingPayosStore) => {
  writeStore(PENDING_PAYOS_STORAGE_KEY, store);
};

const rememberPendingPayosPayment = (entry: PendingPayosEntry) => {
  if (!entry?.partnerId || !entry.payosOrderCode) return;
  const store = readPendingPayosStore();
  store[entry.payosOrderCode] = {
    partnerId: entry.partnerId,
    payosOrderCode: entry.payosOrderCode,
    withdrawalOrderCode: entry.withdrawalOrderCode ?? undefined,
    withdrawalId: entry.withdrawalId ?? undefined,
    amount: entry.amount,
    createdAt: Date.now(),
  };
  writePendingPayosStore(store);
};

const getPendingPayosPayment = (payosOrderCode: string) => {
  if (!payosOrderCode) return null;
  const store = readPendingPayosStore();
  return store[payosOrderCode] ?? null;
};

const consumePendingPayosPayment = (payosOrderCode: string) => {
  if (!payosOrderCode) return null;
  const store = readPendingPayosStore();
  const pending = store[payosOrderCode] ?? null;
  if (pending) {
    delete store[payosOrderCode];
    writePendingPayosStore(store);
  }
  return pending;
};

const consumePendingPayosPaymentByWithdrawal = (opts: {
  withdrawalOrderCode?: string | null;
  withdrawalId?: string | null;
}) => {
  const { withdrawalOrderCode, withdrawalId } = opts ?? {};
  if (!withdrawalOrderCode && !withdrawalId) return null;
  const store = readPendingPayosStore();
  const key = Object.keys(store).find((k) => {
    const entry = store[k];
    if (!entry) return false;
    return (
      (withdrawalOrderCode && entry.withdrawalOrderCode === withdrawalOrderCode) ||
      (withdrawalId && entry.withdrawalId === withdrawalId)
    );
  });
  if (!key) return null;
  const entry = store[key];
  delete store[key];
  writePendingPayosStore(store);
  return entry;
};

async function getWithdrawalHistory(partnerId: string) {
  try {
    const res = await fetch(`${API_BASE}/api/withdrawals?partnerId=${encodeURIComponent(partnerId)}`);
    if (!res.ok) {
      if (res.status === 404) return { success: false, notFound: true, withdrawals: [] as any[] };
      return { success: false, withdrawals: [] as any[] };
    }
    const j = await res.json();
    return { success: true, withdrawals: j.withdrawals ?? j.data ?? j };
  } catch (err) {
    return { success: false, message: (err as Error).message ?? "Error", withdrawals: [] as any[] };
  }
}

async function createWithdrawalRequest(
  partnerId: string,
  amount: number,
  paymentMethod: string,
  details: any = null,
  extra: any = {}
) {
  try {
    // merge extra top-level fields (e.g., status, deductFrom) so frontend
    // can request immediate persistence of a success withdrawal.
    const payload = { partnerId, amount, paymentMethod, details, ...extra };
    const res = await fetch(`${API_BASE}/api/withdrawals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // If backend doesn't have /api/withdrawals -> 404, create a synthetic response so UI can continue
    if (!res.ok) {
      if (res.status === 404) {
        const synthetic = {
          success: true,
          withdrawal: {
            _id: `local-${Date.now()}`,
            amount,
            paymentMethod,
            createdAt: new Date().toISOString(),
            orderCode: `WD-${partnerId}-${Date.now()}`,
            note: "synthetic - backend /api/withdrawals not implemented",
          },
          data: null,
        };
        return synthetic;
      }
      const jErr = await res.json().catch(() => ({}));
      return { success: false, message: jErr?.message ?? "Failed to create withdrawal", data: jErr };
    }

    const j = await res.json();
    return {
      success: res.ok,
      withdrawal: j.withdrawal ?? j.data ?? j,
      data: j,
    };
  } catch (err) {
    return { success: false, message: (err as Error).message ?? "Error", error: err };
  }
}

// --- Local persistence helpers disabled to rely purely on backend ---
const loadLocalWithdrawals = (): WithdrawalType[] => [];
const addLocalWithdrawal = (_item: WithdrawalType) => {};
const removeLocalWithdrawal = (_id: string) => {};

// ---------- Types ----------
type BookingType = {
  _id: string;
  userId: string;
  partnerId: string;
  hoTen?: string;
  sdt?: string;
  soGhe?: string[];
  totalPrice?: number;
  finalTotal?: number;
  discountAmount?: number;
  voucherCode?: string;
  diemDonChiTiet?: string;
  name?: string;
  tenChuyen?: string;
  ngayKhoiHanh?: string;
  gioKhoiHanh?: string;
  paymentMethod?: string;
  tripId?: string;
  createdAt?: string;
  status: "pending" | "paid" | "refunded" | "cancelled" | string;
  feePercent?: number;
  feeApplied?: number;
  serviceFeeAmount?: number;
  feeAppliedAt?: string;
};

type StatsType = {
  totalRevenue: number;
  pendingAmount: number;
  withdrawnAmount: number;
  refundAmount: number;
  serviceFee: number;
  amountAfterFee: number;
};

const PAID_STATUSES = new Set(["paid", "completed", "done"]);

const isPaidStatus = (status?: string | null) =>
  typeof status === "string" && PAID_STATUSES.has(status.toLowerCase());

type WithdrawalType = {
  _id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  paymentMethod: string;
  createdAt: string;
  rejectionReason?: string;
};

// ======= Chart =======
const COLORS = ["#16a34a", "#ca8a04", "#7c3aed"];

// Booking detail UI (full transaction view)
const BookingDetail = ({ booking, feePercent }: { booking: BookingType; feePercent: number }) => {
  const formatMoney = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

  const rawPrice = booking.totalPrice ?? 0;
  const price = booking.finalTotal ?? rawPrice;
  const appliedFee = booking.feePercent ?? feePercent ?? 0;
  const serviceFeeAmount = booking.serviceFeeAmount ?? Math.round((price * appliedFee) / 100);
  const discount = booking.discountAmount ?? Math.max(0, rawPrice - price);
  const received = price - serviceFeeAmount;

  return (
    <div
      style={{
        backgroundImage: "linear-gradient(#fff,#fff),linear-gradient(130deg,#c7d2fe,#f5d0fe,#fef9c3)",
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
        border: "1px solid transparent",
        color: "#0f172a",
        borderRadius: 22,
        padding: 22,
        marginBottom: 18,
        boxShadow: "0 20px 45px rgba(15,23,42,0.12)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 17 }}>{booking.hoTen || booking.name || "Khách hàng"}</div>
            <span style={{ fontSize: 13, color: "#64748b" }}>{booking.sdt}</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 13, color: "#475569" }}>
            <div>Mã vé: <strong>{booking._id}</strong></div>
            <div>Ghế: <strong>{booking.soGhe?.join(", ") || "-"}</strong></div>
            <div>Chuyến: <strong>{booking.tenChuyen || "-"}</strong></div>
          </div>
          <div style={{ marginTop: 6, fontSize: 13, color: "#475569" }}>
            Khởi hành: <strong>{booking.ngayKhoiHanh || "-"}{booking.gioKhoiHanh ? ` • ${booking.gioKhoiHanh}` : ""}</strong>
          </div>
          <div style={{ marginTop: 4, fontSize: 13, color: "#475569" }}>
            Thanh toán: <strong>{booking.paymentMethod || "-"}</strong>
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
            Ngày đặt: {booking.createdAt ? new Date(booking.createdAt).toLocaleString("vi-VN") : "-"}
          </div>
        </div>

        <div style={{ minWidth: 240, background: "linear-gradient(145deg,#f1f5f9,#fff)", borderRadius: 18, padding: 18, border: "1px solid #e2e8f0", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)" }}>
          <div style={{ fontSize: 13, color: "#475569" }}>Tổng</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#2563eb" }}>{formatMoney(price)}</div>

          <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: 13, color: "#475569" }}>
            <span>Phí dịch vụ ({appliedFee}%)</span>
            <strong style={{ color: "#dc2626" }}>-{formatMoney(serviceFeeAmount)}</strong>
          </div>

          {discount > 0 && (
            <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 13, color: "#475569" }}>
              <span>Giảm giá</span>
              <strong>-{formatMoney(discount)}</strong>
            </div>
          )}

          <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px dashed rgba(148,163,184,0.5)" }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>Nhận được</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#059669" }}>{formatMoney(received)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============== MAIN COMPONENT =====================
export default function PartnerPayment() {
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "withdraw">(() => {
    const saved = localStorage.getItem("partnerActiveTab");
    return (saved === "overview" || saved === "transactions" || saved === "withdraw") ? saved : "overview";
  });

  const changeTab = (tab: "overview" | "transactions" | "withdraw") => {
    setActiveTab(tab);
    localStorage.setItem("partnerActiveTab", tab);
  };

  const [stats, setStats] = useState<StatsType>({
    totalRevenue: 0,
    pendingAmount: 0,
    withdrawnAmount: 0,
    refundAmount: 0,
    serviceFee: 0,
    amountAfterFee: 0,
  });

  const [bookings, setBookings] = useState<BookingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feePercent, setFeePercent] = useState<number>(0);

  // ✅ Withdrawal states
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalType[]>([]);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [payosSuccessInfo, setPayosSuccessInfo] = useState<{
    amount: number;
    orderCode?: string;
    createdAt?: string;
  } | null>(null);

  // --- PayOS QR/modal states ---
  const [showPayosQr, setShowPayosQr] = useState(false);
  const [payosCheckoutUrl, setPayosCheckoutUrl] = useState("");
  const [payosQrUrl, setPayosQrUrl] = useState("");
  const [payosQrLoadError, setPayosQrLoadError] = useState(false);
  const [payosOrderCode, setPayosOrderCode] = useState("");
  const [withdrawalOrderCodeState, setWithdrawalOrderCodeState] = useState("");
  const [activeWithdrawalId, setActiveWithdrawalId] = useState<string | null>(null);
  const [payosAmount, setPayosAmount] = useState<number | null>(null);
  const [ledgerSnapshot, setLedgerSnapshot] = useState<PartnerLedger | null>(null);
  const [preferLedgerBalances, setPreferLedgerBalances] = useState(false);

  // ✅ Add state cho bank info
  // (Removed bank states as requested)

  const [partnerId, setPartnerId] = useState<string>(auth.currentUser?.uid ?? "");

  const persistServiceFeeBalanceLocally = (nextBalance: number) => {
    if (!partnerId || Number.isNaN(nextBalance)) return;
    const normalized = Math.max(0, Math.round(nextBalance));
    persistServiceFeeOverrideRecord(partnerId, normalized);
    setStats((prev) => ({
      ...prev,
      serviceFee: normalized,
    }));
    setLedgerSnapshot((prev) =>
      prev ? { ...prev, serviceFeeBalance: normalized } : prev
    );
  };

  const applyLocalServiceFeeDeduction = (amount: number) => {
    if (!partnerId || !Number.isFinite(amount) || amount <= 0) return;
    const currentBalance = ledgerSnapshot?.serviceFeeBalance ?? stats.serviceFee ?? 0;
    const nextBalance = Math.max(0, currentBalance - amount);
    persistServiceFeeBalanceLocally(nextBalance);
  };

  // Keep partnerId in sync with Firebase auth state so all effects re-run when user changes
  useEffect(() => {
    const unsub = (auth as any).onAuthStateChanged?.((user: any) => {
      setPartnerId(user?.uid ?? "");
    });
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  const applyLedgerSnapshot = (snapshot: PartnerLedger | null) => {
    if (!snapshot) return;
    const totalRevenue = Number(snapshot.totalRevenue || 0);
    const totalServiceFee = Number(snapshot.totalServiceFee || 0);
    const rawServiceFeeBalance = snapshot.serviceFeeBalance != null
      ? Number(snapshot.serviceFeeBalance)
      : totalServiceFee;
    const serviceFeeBalance = resolveServiceFeeBalance(partnerId, rawServiceFeeBalance);
    const receivableBalance = Math.max(0, Number(snapshot.receivableBalance || 0));

    setLedgerSnapshot({ ...snapshot, serviceFeeBalance });
    setStats((prev) => ({
      ...prev,
      totalRevenue,
      withdrawnAmount: totalRevenue,
      serviceFee: serviceFeeBalance,
      amountAfterFee: receivableBalance,
    }));
  };

  const loadLedger = async (id: string) => {
    if (!id) return;
    try {
      const res = await fetchPartnerLedger(id);
      if (res?.ledger) {
        setPreferLedgerBalances(true);
        applyLedgerSnapshot(res.ledger);
      }
    } catch (err) {
      console.error("Không thể lấy ledger:", err);
      setPreferLedgerBalances(false);
    }
  };

  const rebuildLedgerSnapshot = async (id: string) => {
    if (!id) return;
    try {
      await rebuildPartnerLedger(id);
      await loadLedger(id);
    } catch (err) {
      console.error("Không thể rebuild ledger:", err);
    }
  };

  const fetchWithdrawalHistory = async (id: string) => {
    if (!id) return;

    try {
      const historyRes = await getWithdrawalHistory(id);
      if (historyRes.success) {
        const local = loadLocalWithdrawals();
        const server = historyRes.withdrawals ?? [];
        const merged = [
          ...local.filter((l) => !server.some((s: any) => s._id === l._id)),
          ...server,
        ];
        setWithdrawalHistory(merged);
      } else if (historyRes.notFound) {
        setWithdrawalHistory(loadLocalWithdrawals());
        console.warn("Fallback: backend withdrawal history endpoint not found");
      }
    } catch (err) {
      console.error("❌ Error loading withdrawal history:", err);
    }
  };

  // Fetch phí dịch vụ động
  useEffect(() => {
    const fetchFee = async () => {
      try {
        const res = await getFeeConfig();
        setFeePercent(res.fee?.percent || 0);
      } catch (err) {
        console.error("Lỗi lấy phí:", err);
        setFeePercent(0);
      }
    };
    fetchFee();
  }, []);

  useEffect(() => {
    if (!partnerId) return;
    loadLedger(partnerId);
  }, [partnerId]);

  // Fetch bookings + stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!partnerId) {
        setError("Bạn chưa đăng nhập.");
        setLoading(false);
        return;
      }

      setError(null);
      try {
        setLoading(true);

        const data = await getBookingsByPartnerId(partnerId);
        const bookingsData: BookingType[] = Array.isArray(data)
          ? data
          : data.bookings || [];

        setBookings(bookingsData);

        let totalRevenue = 0;
        let pendingAmount = 0;
        let withdrawnAmount = 0;
        let refundAmount = 0;
        let totalServiceFee = 0;

        bookingsData.forEach((b) => {
          const grossPrice = b.totalPrice ?? 0;
          const netPrice = b.finalTotal ?? grossPrice;
          const appliedFeePercent = b.feePercent !== undefined ? b.feePercent : feePercent;
          const serviceFee = b.serviceFeeAmount ?? Math.round((netPrice * appliedFeePercent) / 100);

          totalRevenue += netPrice;

          if (b.status === "pending") {
            pendingAmount += netPrice;
          } else if (isPaidStatus(b.status)) {
            withdrawnAmount += netPrice;
            totalServiceFee += serviceFee;
          } else if (b.status === "refunded") {
            refundAmount += netPrice;
          }
        });

        const amountAfterFee = Math.max(0, withdrawnAmount - totalServiceFee);

        setStats((prev) => ({
          ...prev,
          totalRevenue: preferLedgerBalances ? prev.totalRevenue : totalRevenue,
          pendingAmount,
          withdrawnAmount: preferLedgerBalances ? prev.withdrawnAmount : withdrawnAmount,
          refundAmount,
          serviceFee: preferLedgerBalances ? prev.serviceFee : totalServiceFee,
          amountAfterFee: preferLedgerBalances ? prev.amountAfterFee : amountAfterFee,
        }));

        // Keep ledger snapshot fresh when backend snapshot unavailable
        if (!preferLedgerBalances) {
          await rebuildLedgerSnapshot(partnerId);
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Lỗi khi lấy dữ liệu.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [partnerId, feePercent, preferLedgerBalances]);

  // (Pending bookings UI has been removed)

  // ✅ Load withdrawal history
  useEffect(() => {
    if (!partnerId) return;
    fetchWithdrawalHistory(partnerId);
  }, [partnerId]);

  // ✅ Listen socket events
  useEffect(() => {
    const onFeeUpdated = (data: any) => {
      console.log("📡 Received feeUpdated:", data);
      const newPercent = data?.newPercent ?? data?.fee?.percent ?? 0;
      setFeePercent(newPercent);

      alert(`📣 Phí dịch vụ đã được cập nhật: ${newPercent}%`);
    };

    const onWithdrawalSuccess = (data: any) => {
      console.log("📡 Withdrawal success:", data);
      const withdrawal = data?.withdrawal;
      const amount = Number(data?.amount ?? withdrawal?.amount ?? 0);

      if (withdrawal?.paymentMethod === "payos") {
        if (withdrawal?._id || withdrawal?.orderCode) {
          consumePendingPayosPaymentByWithdrawal({
            withdrawalOrderCode: withdrawal.orderCode,
            withdrawalId: withdrawal._id,
          });
        }
        if (amount > 0) {
          applyLocalServiceFeeDeduction(amount);
        }
        setPayosSuccessInfo({
          amount,
          orderCode: withdrawal.orderCode,
          createdAt: withdrawal.createdAt ?? new Date().toISOString(),
        });

        // Auto-close PayOS modal / QR and bring user back to Withdraw tab
        setShowPayosQr(false);
        setPayosCheckoutUrl("");
        setPayosQrUrl("");
        setActiveTab("withdraw");
      }

      // Optimistically mark withdrawal in current history list as success
      if (withdrawal?._id) {
        setWithdrawalHistory((prev) =>
          prev.map((w) =>
            w._id === withdrawal._id
              ? { ...w, status: "success", amount: withdrawal.amount ?? w.amount }
              : w
          )
        );
      }

      alert(`✅ Rút tiền thành công: ${amount.toLocaleString()}đ`);

      // Refresh data so history + service fee/withdrawable amount reflect deduction
      loadWithdrawalHistory();
      loadLedger(partnerId);
      setWithdrawAmount("");
    };

    socket.on("feeUpdated", onFeeUpdated);
    socket.on("withdrawalSuccess", onWithdrawalSuccess);

    return () => {
      socket.off("feeUpdated", onFeeUpdated);
      socket.off("withdrawalSuccess", onWithdrawalSuccess);
    };
  }, [partnerId]); // Added partnerId dependency to ensure loadLedger works correctly

  // Check URL params for PayOS return
  useEffect(() => {
    if (!partnerId) return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const orderCode = params.get("orderCode");

    if (!status && !orderCode) return;

    changeTab("withdraw");

    try {
      const target = new URL(PARTNER_PAYMENTS_URL);
      if (window.location.origin === target.origin) {
        window.history.replaceState({}, "", `${target.pathname}${target.search}`);
      } else {
        window.history.replaceState({}, "", window.location.pathname);
      }
    } catch {
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (status === "CANCELLED" && orderCode) {
      consumePendingPayosPayment(orderCode);
      setPayosOrderCode("");
      setWithdrawalOrderCodeState("");
      setActiveWithdrawalId(null);
      setPayosAmount(null);
      setShowPayosQr(false);
      setPayosCheckoutUrl("");
      setPayosQrUrl("");
      return;
    }

    const shouldVerifySuccess = Boolean(orderCode && (status === "PAID" || !status));
    if (shouldVerifySuccess && orderCode) {
      const pendingBefore = getPendingPayosPayment(orderCode);
      const verifyPayment = async () => {
        try {
          const res = await fetch(`${API_BASE}/api/payos/confirm-return`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderCode, status: "PAID" }),
          });
          const payload = await res.json().catch(() => ({}));
          if (payload?.success) {
            const consumed = consumePendingPayosPayment(orderCode) ?? pendingBefore;
            if (
              consumed &&
              consumed.partnerId === partnerId &&
              Number.isFinite(consumed.amount) &&
              consumed.amount > 0
            ) {
              applyLocalServiceFeeDeduction(consumed.amount);
            }
            setPayosOrderCode("");
            setWithdrawalOrderCodeState("");
            setActiveWithdrawalId(null);
            setPayosAmount(null);
            setShowPayosQr(false);
            setPayosCheckoutUrl("");
            setPayosQrUrl("");
          }
        } catch (e) {
          console.error("Verification failed", e);
        } finally {
          if (partnerId) {
            loadLedger(partnerId);
            loadWithdrawalHistory();
          }
        }
      };
      verifyPayment();
    }
  }, [partnerId]);

  const loadWithdrawalHistory = async () => fetchWithdrawalHistory(partnerId);

  // Delete a withdrawal (backend if available, otherwise remove local/synthetic entry)
  const handleDeleteWithdrawal = async (id: string) => {
    if (!confirm("Bạn chắc chắn muốn xóa lịch sử thanh toán này?")) return;

    try {
      setDeletingId(id);

      // Find the withdrawal in local state to know amount/status
      const found = withdrawalHistory.find(w => w._id === id);

      // If it's a local synthetic entry, just remove it locally
      if (id.startsWith("local-") || !found) {
        setWithdrawalHistory(prev => prev.filter(w => w._id !== id));
        removeLocalWithdrawal(id);

        // Do not revert deductions here — remove the entry permanently
        alert("Đã xóa mục lịch sử (cục bộ).");
        return;
      }

      // Try deleting on backend
      const res = await fetch(`${API_BASE}/api/withdrawals/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setWithdrawalHistory(prev => prev.filter(w => w._id !== id));
        removeLocalWithdrawal(id);

        // Remove permanently; do not revert deductions here
        alert("Đã xóa mục lịch sử.");
        return;
      }

      // If endpoint not found (404) or failed, remove locally as fallback
      if (res.status === 404) {
        setWithdrawalHistory(prev => prev.filter(w => w._id !== id));
        removeLocalWithdrawal(id);
        alert("Backend không hỗ trợ xóa; mục đã bị xóa cục bộ.");
      } else {
        const j = await res.json().catch(() => ({}));
        alert("Xóa thất bại: " + (j.message || res.statusText));
      }
    } catch (err) {
      console.error("Lỗi xóa withdrawal:", err);
      alert("Lỗi khi xóa lịch sử thanh toán.");
    } finally {
      setDeletingId(null);
    }
  };

  // Pending approval UI removed

  // Manual refresh feature removed per request

  // ✅ Handle withdraw
  const handleWithdraw = async () => {
    const method = "payos"; // Force PayOS
    const amount = parseFloat(withdrawAmount);

    if (amount <= 0) {
      alert("❌ Nhập số tiền hợp lệ!");
      return;
    }

    const methodLimit = stats.serviceFee;
    if (amount > methodLimit) {
      alert(`❌ Số tiền vượt quá phí dịch vụ còn lại! Giới hạn: ${formatCurrency(methodLimit)}`);
      return;
    }

    try {
      setWithdrawLoading(true);

      // decide which bucket to deduct from: payos => fee
      const deductFrom = "fee";

      // generate an orderCode so both FE and payment provider can reference it
      const orderCode = `WD-${partnerId}-${Date.now()}`;
      const details = { orderCode, bankName: null, accountNumber: null, accountHolder: null };

      const withdrawRes = await createWithdrawalRequest(
        partnerId,
        amount,
        method,
        details,
        // pending: will be confirmed by webhook
        { status: "pending", deductFrom }
      );

      if (!withdrawRes.success) {
        alert("❌ Tạo yêu cầu thất bại!");
        return;
      }

      // attach orderCode returned from backend if present
      const withdrawalOrder = withdrawRes.withdrawal?.orderCode ?? orderCode;
      const withdrawalId = withdrawRes.withdrawal?._id ? String(withdrawRes.withdrawal._id) : null;

      // create PayOS payment link for this withdrawal
      // Ensure amount is integer
      const intAmount = Math.round(amount);
      const payosOrderCodeNumber = Date.now();
      const payosOrderCodeStr = String(payosOrderCodeNumber);
      const encodedPayosOrder = encodeURIComponent(payosOrderCodeStr);
      const returnUrl = `${PARTNER_PAYMENTS_URL}?status=PAID&orderCode=${encodedPayosOrder}`;
      const cancelUrl = `${PARTNER_PAYMENTS_URL}?status=CANCELLED&orderCode=${encodedPayosOrder}`;

      const payosRes = await createPaymentLink(
        partnerId,
        withdrawalId ?? withdrawalOrder,
        intAmount,
        `Thanh toan phi dich vu`, // Remove special chars to be safe
        payosOrderCodeNumber,
        returnUrl,
        cancelUrl
      );

      const checkout =
        payosRes?.paymentLink ||
        payosRes?.checkoutUrl ||
        payosRes?.url ||
        payosRes?.data?.checkoutUrl ||
        payosRes?.payment?.payosData?.checkoutUrl ||
        payosRes?.payment?.payosData?.data?.checkoutUrl ||
        payosRes?.payment?.payosData?.paymentLink ||
        "";

      setPayosCheckoutUrl(checkout || JSON.stringify(payosRes, null, 2));
      setPayosOrderCode(payosOrderCodeStr);
      setWithdrawalOrderCodeState(withdrawalOrder);
      setActiveWithdrawalId(withdrawalId);
      setPayosAmount(amount);
      rememberPendingPayosPayment({
        partnerId,
        payosOrderCode: payosOrderCodeStr,
        withdrawalOrderCode: withdrawalOrder,
        withdrawalId: withdrawalId ?? undefined,
        amount,
        createdAt: Date.now(),
      });

      const payload = encodeURIComponent(checkout || payosCheckoutUrl || JSON.stringify(payosRes));
      const qr = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${payload}`;
      setPayosQrUrl(qr);
      setShowPayosQr(true);

      alert('✅ Đã tạo yêu cầu PayOS. Vui lòng hoàn tất thanh toán PayOS để hệ thống trừ phí.');

      // Track pending entry locally so user can follow status while waiting for webhook
      const localId = withdrawRes.withdrawal?._id ?? `local-${Date.now()}`;
      const localWithdrawal: WithdrawalType = {
        _id: String(localId),
        amount,
        paymentMethod: method,
        createdAt: new Date().toISOString(),
        status: "pending",
      };
      setWithdrawalHistory((prev) => [localWithdrawal, ...prev]);
      addLocalWithdrawal(localWithdrawal);

      setWithdrawAmount("");
      return;

    } catch (err) {
      console.error("❌ Error:", err);
      alert("❌ Lỗi thanh toán!");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!payosOrderCode && !withdrawalOrderCodeState && !activeWithdrawalId) return;
    try {
      // Attempt to confirm PayOS payment so backend updates booking/payment records
      if (payosOrderCode) {
        try {
          await fetch(`${API_BASE}/api/payos/confirm-return`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderCode: payosOrderCode, status: "PAID" }),
          });
        } catch (confirmErr) {
          console.warn("PayOS confirm-return failed", confirmErr);
        }
      }

      // Ensure withdrawal document is marked success
      if (withdrawalOrderCodeState || activeWithdrawalId) {
        const payload = withdrawalOrderCodeState
          ? { orderCode: withdrawalOrderCodeState }
          : { id: activeWithdrawalId };
        const res = await fetch(`${API_BASE}/api/withdrawals/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const d = await res.json();
        if (!d.success) {
          alert("❌ Lỗi: " + (d.error || "Không thể xác nhận"));
          return;
        }
      }

      const consumedByPayos = payosOrderCode
        ? consumePendingPayosPayment(payosOrderCode)
        : null;
      const consumedByWithdrawal =
        (!consumedByPayos && (withdrawalOrderCodeState || activeWithdrawalId))
          ? consumePendingPayosPaymentByWithdrawal({
              withdrawalOrderCode: withdrawalOrderCodeState,
              withdrawalId: activeWithdrawalId,
            })
          : null;
      const deductionAmount =
        payosAmount ?? consumedByPayos?.amount ?? consumedByWithdrawal?.amount ?? 0;
      if (deductionAmount > 0) {
        applyLocalServiceFeeDeduction(deductionAmount);
      }

      alert("✅ Đã xác nhận thanh toán thành công!");
      setShowPayosQr(false);
      setPayosCheckoutUrl("");
      setPayosQrUrl("");
      setActiveTab("withdraw");
      setPayosOrderCode("");
      setWithdrawalOrderCodeState("");
      setActiveWithdrawalId(null);
      setPayosAmount(null);

      await loadLedger(partnerId);
      await loadWithdrawalHistory();
    } catch (err) {
      console.error(err);
      alert("❌ Lỗi kết nối server");
    }
  };

  // ========== UI Styles ==========
  const styles = {
    page: {
      background: "#f9fafb",
      minHeight: "100vh",
      padding: "2rem",
      fontFamily: "Inter, sans-serif",
    },
    header: { marginBottom: "1.5rem" },
    title: { fontSize: "28px", color: "#111827", marginBottom: "4px" },
    subtitle: { color: "#6b7280", fontSize: "15px" },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
      gap: "20px",
      margin: "30px 0",
    },
    tabs: {
      display: "flex",
      background: "#fff",
      borderRadius: "12px",
      overflow: "hidden",
      border: "1px solid #e5e7eb",
    },
    tabBtn: (active: boolean) => ({
      flex: 1,
      padding: "12px 16px",
      fontWeight: 500,
      color: active ? "#2563eb" : "#6b7280",
      borderBottom: `3px solid ${active ? "#2563eb" : "transparent"}`,
      backgroundColor: "transparent", // ✅ Thay background thành backgroundColor
      borderLeft: "none", // ✅ Loại bỏ border xung đột
      borderRight: "none",
      borderTop: "none",
      cursor: "pointer",
    }),
    overview: {
      background: "#fff",
      padding: "24px",
      borderRadius: "12px",
      marginTop: "16px",
    },
    bookingsList: {
      maxHeight: 450,
      overflowY: "auto" as const,
      marginTop: "16px",
    },
    input: {
      width: "100%",
      padding: "10px",
      marginBottom: "12px",
      borderRadius: "8px",
      border: "1px solid #d1d5db",
    },
    btnPrimary: {
      width: "100%",
      padding: "12px",
      background: "#2563eb",
      color: "#fff",
      border: "none",
      borderRadius: "10px",
      cursor: "pointer",
      marginTop: "8px",
      fontWeight: 600,
    },
  };

  if (loading) return <div style={styles.page}>⏳ Đang tải dữ liệu...</div>;
  if (error) return <div style={styles.page}>❌ {error}</div>;

  const paidBookings = bookings.filter((b) => isPaidStatus(b.status));

  const chartData = [
    { name: "Đã thanh toán", value: stats.withdrawnAmount },
    { name: "Chờ xử lý", value: stats.pendingAmount },
    { name: "Hoàn tiền", value: stats.refundAmount },
  ];
  const chartTotal = chartData.reduce((sum, item) => sum + (item.value || 0), 0) || 1;

  const metricCards = [
    {
      label: "Tổng doanh thu",
      value: stats.totalRevenue,
      icon: <DollarSign size={22} />,
      accent: "linear-gradient(135deg,#4ade80,#22c55e)",
      desc: ledgerSnapshot?.lastBookingAt
        ? `Đồng bộ đến ${new Date(ledgerSnapshot.lastBookingAt).toLocaleString("vi-VN")}`
        : "Tất cả giao dịch đã ghi nhận",
    },
    {
      label: `Phí dịch vụ (${feePercent}%)`,
      value: stats.serviceFee,
      icon: <RefreshCw size={22} />,
      accent: "linear-gradient(135deg,#fca5a5,#f87171)",
      desc: ledgerSnapshot
        ? `Còn phải thanh toán • Tổng phát sinh: ${formatCurrency(ledgerSnapshot.totalServiceFee || 0)}`
        : "Đã khấu trừ vào hệ thống",
      prefix: "-",
    },
    {
      label: "Nhận được (sau phí)",
      value: stats.amountAfterFee,
      icon: <DollarSign size={22} />, // reuse icon for emphasis
      accent: "linear-gradient(135deg,#34d399,#10b981)",
      desc: preferLedgerBalances ? "Theo số dư receivable trong ledger" : "Số tiền có thể rút",
    },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={styles.title}>💳 Quản lý thanh toán</h1>
            <p style={styles.subtitle}>Theo dõi doanh thu, giao dịch và rút tiền</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 18, margin: "30px 0" }}>
        {metricCards.map((card) => (
          <div
            key={card.label}
            style={{
              borderRadius: 18,
              padding: 20,
              color: "#fff",
              background: card.accent,
              boxShadow: "0 18px 35px rgba(31,41,55,0.25)",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 14, opacity: 0.85, fontWeight: 600 }}>{card.label}</div>
              <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 12, padding: 6 }}>{card.icon}</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>
              {card.prefix || ""}{formatCurrency(card.value)}
            </div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>{card.desc}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {["overview", "transactions", "withdraw"].map((tab) => (
          <button
            key={tab}
            style={styles.tabBtn(activeTab === tab) as any}
            onClick={() =>
              changeTab(
                tab as "overview" | "transactions" | "withdraw"
              )
            }
          >
            {tab === "overview"
              ? "📊 Tổng quan"
              : tab === "transactions"
              ? "📄 Giao dịch"
              : "💰 Thanh toán phí"}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === "overview" && (
        <div style={styles.overview}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: 20,
            marginBottom: 24,
          }}>
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 15px 30px rgba(15,23,42,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0 }}>📊 Thống kê doanh thu</h3>
                  <p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>Phân bổ trạng thái vé</p>
                </div>
                <span style={{ background: "#e0e7ff", color: "#4338ca", fontSize: 12, padding: "4px 10px", borderRadius: 999 }}>Realtime</span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    stroke="#fff"
                    strokeWidth={3}
                  >
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: "linear-gradient(180deg,#0f172a,#1e293b)", color: "#f8fafc", borderRadius: 16, padding: 24, boxShadow: "0 20px 35px rgba(15,23,42,0.4)", display: "flex", flexDirection: "column", gap: 12 }}>
              <h3 style={{ margin: 0 }}>Tóm tắt nhanh</h3>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(248,250,252,0.8)" }}>Cập nhật theo thời gian thực cho các trạng thái vé</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {chartData.map((item, idx) => (
                  <div key={item.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 12, height: 12, borderRadius: 999, background: COLORS[idx % COLORS.length] }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: "rgba(248,250,252,0.7)" }}>{((item.value / chartTotal) * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 700 }}>{formatCurrency(item.value)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <h3 style={{ marginTop: 24 }}>💸 Vé đã thanh toán</h3>
          <div style={styles.bookingsList}>
            {paidBookings.length === 0 ? (
              <p>Chưa có vé nào.</p>
            ) : (
              paidBookings.map((b) => (
                <BookingDetail key={b._id} booking={b} feePercent={feePercent} />
              ))
            )
            }
          </div>
        </div>
      )}

      {/* TRANSACTIONS */}
      {activeTab === "transactions" && (
        <div style={styles.overview}>
          <h3>📄 Danh sách giao dịch</h3>

          <div style={styles.bookingsList}>
            {bookings.length === 0 ? (
              <p>Chưa có giao dịch nào.</p>
            ) : (
              bookings.map((b) => (
                <BookingDetail key={b._id} booking={b} feePercent={feePercent} />
              ))
            )}
          </div>
        </div>
      )}

      {/* WITHDRAW */}
      {activeTab === "withdraw" && (
        <div style={styles.overview}>
          <h3>💰 Thanh toán phí dịch vụ</h3>

          <div style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "25px",
          }}>
            {/* Display a consistent revenue number: prefer backend withdrawableAmount when available,
                otherwise fall back to locally computed stats.amountAfterFee so both UI places match. */}
            <p style={{ margin: "8px 0", fontSize: "14px" }}>
             
            </p>
            <p style={{ margin: "0", fontSize: "13px", opacity: 0.95 }}>
              📈 Tổng doanh thu : <b style={{ fontSize: "16px" }}>{formatCurrency(stats.totalRevenue)}</b>
            </p>
          </div>

         

          {/* Withdrawal Form */}
          <div style={{
            background: "#f8f9fa",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "30px",
            border: "1px solid #e5e7eb",
          }}>
            <h4 style={{ marginTop: 0 }}>📋 Thanh toán phí dịch vụ</h4>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "#374151", fontWeight: 600 }}>Nhập số tiền thanh toán</label>
              <input
                type="number"
                placeholder="Nhập số tiền"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                style={styles.input}
              />
              <button
                type="button"
                onClick={() => setWithdrawAmount(String(stats.serviceFee || 0))}
                disabled={!stats.serviceFee}
                style={{
                  marginTop: 8,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: stats.serviceFee ? "#0ea5e9" : "#cbd5f5",
                  color: stats.serviceFee ? "#fff" : "#6b7280",
                  cursor: stats.serviceFee ? "pointer" : "not-allowed",
                  fontWeight: 600,
                }}
              >
                Thanh toán toàn bộ phí còn lại
              </button>
              <button
                type="button"
                onClick={() => setWithdrawAmount("0")}
                style={{
                  marginTop: 8,
                  marginLeft: 8,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  color: "#374151",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Đặt lại 0
              </button>
            </div>

            {/* Hiển thị phí */}
            {(() => {
              const fee = stats.serviceFee || 0;
              return (
                <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center" }}>
                  <div style={{ flex: 1, background: "#fff", padding: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}>
                    <div style={{ color: "#6b7280", fontSize: 13 }}>Phí dịch vụ cần thanh toán</div>
                    <div style={{ fontWeight: 700, marginTop: 6, color: "#b91c1c" }}>
                      {formatCurrency(fee)}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button
                onClick={() => handleWithdraw()}
                disabled={withdrawLoading || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: withdrawLoading || !withdrawAmount || parseFloat(withdrawAmount) <= 0 
                    ? "#ccc" 
                    : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  cursor: withdrawLoading || !withdrawAmount || parseFloat(withdrawAmount) <= 0 ? "not-allowed" : "pointer",
                  fontWeight: "600",
                  fontSize: "15px",
                  transition: "all 0.3s",
                }}
              >
                {!withdrawLoading ? "Thanh Toán Phí dịch vụ" : "Đang xử lý..."}
              </button>
            </div>
          </div>

          {/* Withdrawal History */}
          <h3>📋 Lịch sử thanh toán phí</h3>
          {payosSuccessInfo && (
            <div style={{
              background: "#ecfdf5",
              border: "1px solid #10b981",
              color: "#065f46",
              padding: "16px",
              borderRadius: "10px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  ✅ PayOS thanh toán thành công!
                </div>
                <div style={{ fontSize: 13 }}>
                  Đơn {payosSuccessInfo.orderCode || "(không rõ mã)"} — nhận {formatCurrency(payosSuccessInfo.amount)}.
                  Đã trừ trực tiếp vào phí dịch vụ.
                  <br />
                  {payosSuccessInfo.createdAt ? `Thời gian: ${new Date(payosSuccessInfo.createdAt).toLocaleString("vi-VN")}` : null}
                </div>
              </div>
              <button
                onClick={() => setPayosSuccessInfo(null)}
                style={{
                  border: "none",
                  background: "#10b981",
                  color: "white",
                  padding: "8px 14px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Đã hiểu
              </button>
            </div>
          )}
          {withdrawalHistory.length === 0 ? (
            <p style={{ color: "#999", fontStyle: "italic", textAlign: "center", padding: "20px" }}>
              Chưa có lịch sử thanh toán
            </p>
          ) : (
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "white",
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}>
              <thead style={{ background: "#f8f9fa", borderBottom: "2px solid #ddd" }}>
                <tr>
                  <th style={{ padding: "15px", textAlign: "left", fontWeight: "600", color: "#666", fontSize: "13px" }}>Số tiền</th>
                  <th style={{ padding: "15px", textAlign: "left", fontWeight: "600", color: "#666", fontSize: "13px" }}>Phương thức</th>
                  <th style={{ padding: "15px", textAlign: "left", fontWeight: "600", color: "#666", fontSize: "13px" }}>Trạng thái</th>
                  <th style={{ padding: "15px", textAlign: "left", fontWeight: "600", color: "#666", fontSize: "13px" }}>Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {withdrawalHistory.map((w) => (
                  <tr key={w._id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "15px", fontWeight: "600", color: "#667eea" }}>
                        {formatCurrency(w.amount)}
                      </td>
                      <td style={{ padding: "15px", fontSize: "13px" }}>
                        {w.paymentMethod === "payos" ? "💳 PayOS" : "🏦 Ngân hàng"}
                      </td>
                      <td style={{ padding: "15px" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "600",
                          background: 
                            w.status === "success" ? "#d4edda" :
                            w.status === "pending" ? "#fff3cd" :
                            w.status === "processing" ? "#cfe2ff" :
                            "#f8d7da",
                          color: 
                            w.status === "success" ? "#155724" :
                            w.status === "pending" ? "#856404" :
                            w.status === "processing" ? "#084298" :
                            "#721c24",
                        }}>
                          {w.status === "success" && "✅ Thành công"}
                          {w.status === "pending" && (w.paymentMethod === "payos" ? "⏳ Chờ thanh toán" : "⏳ Chờ duyệt")}
                          {w.status === "processing" && "🔄 Đang xử lý"}
                          {w.status === "failed" && "❌ Thất bại"}
                        </span>
                      </td>
                      <td style={{ padding: "15px", fontSize: "13px", display: "flex", gap: 8, alignItems: "center" }}>
                        <div style={{ flex: 1 }}>{new Date(w.createdAt).toLocaleDateString("vi-VN")}</div>
                        <button
                          onClick={() => handleDeleteWithdrawal(w._id)}
                          disabled={deletingId === w._id}
                          style={{
                            padding: "6px 10px",
                            background: deletingId === w._id ? "#f3f4f6" : "#ef4444",
                            color: deletingId === w._id ? "#9ca3af" : "#fff",
                            border: "none",
                            borderRadius: 8,
                            cursor: deletingId === w._id ? "not-allowed" : "pointer",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {deletingId === w._id ? "Đang xóa..." : "Xóa"}
                        </button>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* PayOS QR Modal (global) */}
      {showPayosQr && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ width: 520, maxWidth: "95%", background: "#fff", borderRadius: 12, padding: 20 }}>
            <h3 style={{ marginTop: 0 }}>🔗 Thanh toán qua PayOS</h3>
            <p style={{ margin: "6px 0 12px", color: "#374151" }}>
              Quét QR để thanh toán cho đơn rút tiền <b>{withdrawalOrderCodeState || payosOrderCode}</b> — <b>{payosAmount ? formatCurrency(payosAmount) : ""}</b>
            </p>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ flex: "0 0 200px", textAlign: "center", background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                {!payosQrLoadError ? (
                  <img
                    src={payosQrUrl}
                    alt="PayOS QR"
                    style={{ width: 180, height: 180 }}
                    onError={() => setPayosQrLoadError(true)}
                  />
                ) : (
                  <div style={{ width: 180, height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 12 }}>
                    QR không tải được
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ color: "#6b7280", fontSize: 13 }}>Link thanh toán</div>
                  <div style={{ wordBreak: "break-all", marginTop: 6 }}>
                    <code style={{ fontSize: 13, color: "#111827" }}>{payosCheckoutUrl}</code>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button onClick={() => { navigator.clipboard?.writeText(payosCheckoutUrl); alert("Đã sao chép link"); }} style={{ padding: "8px 12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
                    Sao chép link
                  </button>
                  <button onClick={() => window.open(payosCheckoutUrl, "_blank")} style={{ padding: "8px 12px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
                    Mở link
                  </button>
                  <button onClick={handleConfirmPayment} style={{ padding: "8px 12px", background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
                    Xác nhận đã TT
                  </button>
                  <button onClick={() => { setShowPayosQr(false); setPayosCheckoutUrl(""); }} style={{ padding: "8px 12px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// CSS animation
const style = document.createElement("style");
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);