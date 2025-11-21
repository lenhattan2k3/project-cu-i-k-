// File: src/home/partner/PartnerPayment.tsx
import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, RefreshCw, Clock } from "lucide-react";
import { auth } from "../../firebase/config";
import { getBookingsByPartnerId } from "../../api/bookingApi";
import { linkBank, getBankByUser, unlinkBank } from "../../api/bankApi";

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
};

type StatsType = {
  totalRevenue: number;
  pendingAmount: number;
  withdrawnAmount: number;
  refundAmount: number;
  serviceFee: number;
};

// ======= Chart =======
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

const COLORS = ["#16a34a", "#ca8a04", "#7c3aed"];

// Booking detail UI
const BookingDetail = ({ booking }: { booking: BookingType }) => {
  const formatMoney = (n: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(n);

  return (
    <div
      style={{
        padding: "16px",
        marginBottom: "12px",
        background: "#fff",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "6px",
        }}
      >
        <h4 style={{ margin: 0, color: "#111827", fontSize: "18px" }}>
          {booking.hoTen || booking.name || "Không rõ tên"}
        </h4>

        <span
          style={{
            padding: "4px 10px",
            background:
              booking.status === "paid"
                ? "#dcfce7"
                : booking.status === "pending"
                ? "#fef9c3"
                : "#fee2e2",
            color:
              booking.status === "paid"
                ? "#16a34a"
                : booking.status === "pending"
                ? "#ca8a04"
                : "#dc2626",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          {booking.status.toUpperCase()}
        </span>
      </div>

      <p style={{ margin: "4px 0", color: "#6b7280" }}>
        Mã vé: <b>{booking._id}</b>
      </p>

      <p style={{ margin: "4px 0", color: "#6b7280" }}>
        SĐT: <b>{booking.sdt}</b>
      </p>

      <p style={{ margin: "4px 0", color: "#6b7280" }}>
        Ghế: <b>{booking.soGhe?.join(", ")}</b>
      </p>

      <p style={{ margin: "4px 0", color: "#6b7280" }}>
        Chuyến đi: <b>{booking.tenChuyen}</b>
      </p>

      <p style={{ margin: "4px 0", color: "#6b7280" }}>
        Khởi hành:{" "}
        <b>
          {booking.ngayKhoiHanh} - {booking.gioKhoiHanh}
        </b>
      </p>

      {booking.voucherCode && (
        <p style={{ margin: "4px 0", color: "#6b7280" }}>
          Voucher: <b>{booking.voucherCode}</b> — giảm{" "}
          {formatMoney(booking.discountAmount || 0)}
        </p>
      )}

      <p style={{ margin: "4px 0", color: "#6b7280" }}>
        Thanh toán: <b>{booking.paymentMethod}</b>
      </p>

      <p style={{ margin: "4px 0", color: "#6b7280" }}>
        Ngày đặt:{" "}
        <b>
          {booking.createdAt
            ? new Date(booking.createdAt).toLocaleString("vi-VN")
            : "Không có"}
        </b>
      </p>

      <p style={{ marginTop: "10px", fontWeight: 600, color: "#111827" }}>
        Tổng tiền:{" "}
        {formatMoney(booking.finalTotal || booking.totalPrice || 0)}
      </p>
    </div>
  );
};

// =============== MAIN COMPONENT =====================
export default function PartnerPayment() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "transactions" | "withdraw"
  >("overview");

  const [stats, setStats] = useState<StatsType>({
    totalRevenue: 0,
    pendingAmount: 0,
    withdrawnAmount: 0,
    refundAmount: 0,
    serviceFee: 0,
  });

  const [bookings, setBookings] = useState<BookingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bank
  const [bankInfo, setBankInfo] = useState<any>(null);
  const [bankLoading, setBankLoading] = useState(true);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const partnerId = auth.currentUser?.uid ?? "";

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  // Fetch bookings + stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!partnerId) {
        setError("Bạn chưa đăng nhập.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const data = await getBookingsByPartnerId(partnerId);
        const bookingsData: BookingType[] = Array.isArray(data)
          ? data
          : data.bookings || [];

        setBookings(bookingsData);

        const statsCalc = bookingsData.reduce<StatsType>(
          (acc, b) => ({
            totalRevenue: acc.totalRevenue + (b.finalTotal || b.totalPrice || 0),

            pendingAmount:
              acc.pendingAmount +
              (b.status === "pending"
                ? (b.finalTotal || b.totalPrice || 0)
                : 0),

            withdrawnAmount:
              acc.withdrawnAmount +
              (b.status === "paid"
                ? (b.finalTotal || b.totalPrice || 0)
                : 0),

            refundAmount:
              acc.refundAmount +
              (b.status === "refunded"
                ? (b.finalTotal || b.totalPrice || 0)
                : 0),

            serviceFee: 0,
          }),
          {
            totalRevenue: 0,
            pendingAmount: 0,
            withdrawnAmount: 0,
            refundAmount: 0,
            serviceFee: 0,
          }
        );

        setStats({
          ...statsCalc,
          serviceFee: statsCalc.totalRevenue * 0.05, // phí dịch vụ 5%
        });
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Lỗi khi lấy dữ liệu.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [partnerId]);

  // Fetch bank info
  useEffect(() => {
    const loadBank = async () => {
      if (!partnerId) return;

      try {
        setBankLoading(true);
        const res = await getBankByUser(partnerId);
        setBankInfo(res || null);
      } catch (e) {
        setBankInfo(null);
      } finally {
        setBankLoading(false);
      }
    };

    loadBank();
  }, [partnerId]);

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
    card: {
      background: "#fff",
      padding: "20px",
      borderRadius: "16px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      display: "flex",
      alignItems: "center",
      gap: "16px",
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
      background: "none",
      border: "none",
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
    btnDanger: {
      width: "100%",
      padding: "12px",
      background: "#dc2626",
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

  const paidBookings = bookings.filter((b) => b.status === "paid");

  const chartData = [
    { name: "Đã thanh toán", value: stats.withdrawnAmount },
    { name: "Chờ xử lý", value: stats.pendingAmount },
    { name: "Hoàn tiền", value: stats.refundAmount },
  ];

  // ========== Handle Bank Link ==========
  const handleLinkBank = async () => {
    if (!bankName || !accountNumber || !accountHolder)
      return alert("Vui lòng nhập đầy đủ thông tin!");

    try {
      const res = await linkBank({
        userId: partnerId,
        bankName,
        accountNumber,
        accountHolder,
      });

      alert("Liên kết ngân hàng thành công!");

      setBankInfo(res);
    } catch (e) {
      alert("Lỗi khi liên kết ngân hàng!");
    }
  };

  const handleUnlinkBank = async () => {
    if (!confirm("Bạn chắc chắn muốn hủy liên kết?")) return;

    try {
      await unlinkBank(partnerId);
      setBankInfo(null);
      alert("Đã hủy liên kết ngân hàng!");
    } catch (e) {
      alert("Không thể hủy liên kết!");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>💳 Quản lý thanh toán</h1>
        <p style={styles.subtitle}>Theo dõi doanh thu, giao dịch và rút tiền</p>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.card}>
          <DollarSign size={24} />
          <div>
            <p style={{ color: "#6b7280" }}>Tổng doanh thu</p>
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>
              {formatCurrency(stats.totalRevenue)}
            </h2>
          </div>
        </div>

        <div style={styles.card}>
          <Clock size={24} />
          <div>
            <p style={{ color: "#6b7280" }}>Phí dịch vụ (5%)</p>
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>
              {formatCurrency(stats.serviceFee)}
            </h2>
          </div>
        </div>

        <div style={styles.card}>
          <TrendingUp size={24} />
          <div>
            <p style={{ color: "#6b7280" }}>Số tiền có thể rút</p>
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>
              {formatCurrency(stats.withdrawnAmount - stats.serviceFee)}
            </h2>
          </div>
        </div>

        <div style={styles.card}>
          <RefreshCw size={24} />
          <div>
            <p style={{ color: "#6b7280" }}>Hoàn tiền</p>
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>
              {formatCurrency(stats.refundAmount)}
            </h2>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {["overview", "transactions", "withdraw"].map((tab) => (
          <button
            key={tab}
            style={styles.tabBtn(activeTab === tab)}
            onClick={() =>
              setActiveTab(
                tab as "overview" | "transactions" | "withdraw"
              )
            }
          >
            {tab === "overview"
              ? "Tổng quan"
              : tab === "transactions"
              ? "Giao dịch"
              : "Rút tiền"}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === "overview" && (
        <div style={styles.overview}>
          <h3>📊 Thống kê doanh thu</h3>

          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <h3 style={{ marginTop: 24 }}>💸 Vé đã thanh toán</h3>
          <div style={styles.bookingsList}>
            {paidBookings.length === 0 ? (
              <p>Chưa có vé nào.</p>
            ) : (
              paidBookings.map((b) => (
                <BookingDetail key={b._id} booking={b} />
              ))
            )}
          </div>
        </div>
      )}

      {/* TRANSACTIONS */}
      {activeTab === "transactions" && (
        <div style={styles.overview}>
          <h3>Danh sách giao dịch</h3>

          <div style={styles.bookingsList}>
            {bookings.length === 0 ? (
              <p>Chưa có giao dịch nào.</p>
            ) : (
              bookings.map((b) => (
                <BookingDetail key={b._id} booking={b} />
              ))
            )}
          </div>
        </div>
      )}

      {/* WITHDRAW */}
      {activeTab === "withdraw" && (
        <div style={styles.overview}>
          <h3>🏦 Liên kết ngân hàng</h3>

          {bankLoading ? (
            <p>Đang tải...</p>
          ) : bankInfo ? (
            <div>
              <p>
                <b>Ngân hàng:</b> {bankInfo.bankName}
              </p>
              <p>
                <b>Số tài khoản:</b> {bankInfo.accountNumber}
              </p>
              <p>
                <b>Chủ tài khoản:</b> {bankInfo.accountHolder}
              </p>

              <button style={styles.btnDanger} onClick={handleUnlinkBank}>
                Hủy liên kết
              </button>

              <hr style={{ margin: "20px 0" }} />

              <h3>💸 Rút tiền</h3>
              <p>
                Số tiền có thể rút:{" "}
                <b>{formatCurrency(stats.withdrawnAmount - stats.serviceFee)}</b>
              </p>

              <input
                type="number"
                placeholder="Nhập số tiền muốn rút"
                style={styles.input}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />

              <button style={styles.btnPrimary}>Yêu cầu rút tiền</button>
            </div>
          ) : (
            <>
              <input
                style={styles.input}
                placeholder="Tên ngân hàng (VD: Vietcombank)"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />

              <input
                style={styles.input}
                placeholder="Số tài khoản"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />

              <input
                style={styles.input}
                placeholder="Chủ tài khoản"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
              />

              <button style={styles.btnPrimary} onClick={handleLinkBank}>
                Liên kết ngân hàng
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
