import { useEffect, useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaBus,
  FaCalendarDay,
  FaCheckCircle,
  FaClock,
  FaCopy,
  FaMapMarkerAlt,
  FaSearch,
  FaSyncAlt,
  FaTicketAlt,
  FaUser,
} from "react-icons/fa";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

// --- Types ---
interface TripInfo {
  name?: string;
  from?: string;
  to?: string;
  departDate?: string;
  departTime?: string;
  vehicleType?: string;
  partnerName?: string;
}

interface Invoice {
  _id?: string;
  invoiceCode: string;
  bookingId: string;
  userId: string;
  amount: number;
  paymentMethod?: string;
  status?: string;
  seats?: string[];
  passengerName?: string;
  passengerPhone?: string;
  checkInCode: string;
  tripInfo?: TripInfo;
  issuedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  invoiceUrl?: string;
  orderCode?: string;
}

interface InvoiceHistoryProps {
  highlightOrderCode?: string;
  bannerMessage?: string;
  onBack?: () => void;
}

// --- Helpers ---
const statusConfig: Record<string, { label: string; className: string }> = {
  paid: { label: "Thành công", className: "status-paid" },
  pending: { label: "Chờ xử lý", className: "status-pending" },
  cancelled: { label: "Đã hủy", className: "status-cancelled" },
};

const formatCurrency = (value?: number) =>
  (value ?? 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const formatDate = (value?: string) => {
  if (!value) return "--";
  try {
    return new Date(value).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return value;
  }
};

// --- Component ---
export default function InvoiceHistory({
  highlightOrderCode,
  bannerMessage,
  onBack,
}: InvoiceHistoryProps = {}) {
  // State initialization
  const [user] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [highlightCode, setHighlightCode] = useState<string | null>(
    highlightOrderCode || null
  );

  const userId = user?._id;

  // Data Fetching
  const fetchInvoices = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/invoices/user/${userId}`);
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Không thể tải dữ liệu");
      }
      setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
    } catch (err: any) {
      setError(err?.message || "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    setHighlightCode(highlightOrderCode || null);
  }, [highlightOrderCode]);

  // Filtering & Stats
  const filteredInvoices = useMemo(() => {
    if (!search.trim()) return invoices;
    const k = search.trim().toLowerCase();
    return invoices.filter((inv) =>
      [
        inv.invoiceCode,
        inv.checkInCode,
        inv.tripInfo?.from,
        inv.tripInfo?.to,
        inv.passengerName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(k)
    );
  }, [invoices, search]);

  const totalSpent = useMemo(
    () =>
      invoices
        .filter((i) => i.status === "paid")
        .reduce((sum, i) => sum + (i.amount ?? 0), 0),
    [invoices]
  );

  // Actions
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => alert("Đã sao chép: " + text),
      () => alert("Lỗi khi sao chép")
    );
  };

  // --- Render ---
  if (!userId) {
    return (
      <div className="center-msg">
        Vui lòng đăng nhập để xem lịch sử mua vé.
      </div>
    );
  }

  return (
    <div className="invoice-container">
      {/* --- STYLES --- */}
      <style>{`
        :root {
          --primary: #2563eb;
          --primary-bg: #eff6ff;
          --text-main: #1e293b;
          --text-muted: #64748b;
          --bg-page: #f8fafc;
          --bg-card: #ffffff;
          --border: #e2e8f0;
          --success: #10b981;
          --success-bg: #d1fae5;
          --danger: #ef4444;
          --danger-bg: #fee2e2;
          --warning: #f59e0b;
          --warning-bg: #fef3c7;
        }

        .invoice-container {
          font-family: 'Inter', system-ui, sans-serif;
          background-color: var(--bg-page);
          min-height: 100vh;
          padding: 24px 16px;
          color: var(--text-main);
        }

        .invoice-wrapper {
          max-width: 900px;
          margin: 0 auto;
        }

        /* Header Section */
        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .back-btn {
          background: white;
          border: 1px solid var(--border);
          padding: 10px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--text-muted);
        }
        .back-btn:hover { background: var(--primary-bg); color: var(--primary); border-color: var(--primary); }

        .title-group h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
          line-height: 1.2;
        }
        .title-group p {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin: 4px 0 0 0;
        }

        /* Search & Filter Bar */
        .controls-bar {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          margin-bottom: 24px;
        }
        
        .search-box {
          position: relative;
          width: 100%;
        }
        .search-box svg {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }
        .search-box input {
          width: 100%;
          padding: 12px 16px 12px 44px;
          border-radius: 12px;
          border: 1px solid var(--border);
          outline: none;
          font-size: 0.95rem;
          transition: border-color 0.2s;
        }
        .search-box input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-bg); }

        .refresh-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 20px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: white;
          color: var(--text-main);
          font-weight: 500;
          cursor: pointer;
          transition: 0.2s;
        }
        .refresh-btn:hover { background: var(--bg-page); }

        /* Banner & Alert */
        .banner {
          background: linear-gradient(to right, #eff6ff, #ffffff);
          border: 1px solid #bfdbfe;
          color: #1e40af;
          padding: 12px 16px;
          border-radius: 12px;
          margin-bottom: 20px;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Stats Row */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: white;
          padding: 16px;
          border-radius: 16px;
          border: 1px solid var(--border);
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .stat-label { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 4px; }
        .stat-value { font-size: 1.25rem; font-weight: 700; color: var(--text-main); }
        .stat-value.money { color: var(--primary); }

        /* Invoice List */
        .invoice-list {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }

        /* Ticket Card Design */
        .ticket-card {
          background: white;
          border-radius: 20px;
          border: 1px solid var(--border);
          overflow: hidden;
          position: relative;
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex;
          flex-direction: column;
        }
        .ticket-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
        }
        .ticket-card.highlight {
          border: 2px solid var(--primary);
          background: #f8fafc;
        }

        .ticket-header {
          padding: 16px 20px;
          border-bottom: 1px dashed var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fafafa;
        }
        .trip-date {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: var(--text-main);
        }
        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        .status-paid { background: var(--success-bg); color: var(--success); }
        .status-pending { background: var(--warning-bg); color: var(--warning); }
        .status-cancelled { background: var(--danger-bg); color: var(--danger); }

        .ticket-body {
          padding: 20px;
          display: grid;
          grid-template-columns: 1fr auto; /* Route | QR/Code */
          gap: 20px;
        }

        /* Timeline Route */
        .route-timeline {
          position: relative;
          padding-left: 24px;
        }
        .route-timeline::before {
          content: '';
          position: absolute;
          left: 7px;
          top: 8px;
          bottom: 8px;
          width: 2px;
          background: #e2e8f0;
        }
        .route-point {
          position: relative;
          margin-bottom: 24px;
        }
        .route-point:last-child { margin-bottom: 0; }
        .dot {
          position: absolute;
          left: -24px;
          top: 6px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 0 1px #cbd5e1;
          background: white;
        }
        .dot.from { background: var(--primary); box-shadow: none; }
        .dot.to { border-color: var(--primary); }
        
        .time { font-size: 0.85rem; font-weight: 600; color: var(--text-main); }
        .location { font-size: 1rem; font-weight: 500; color: var(--text-main); }
        
        /* Seat & Passenger Info */
        .info-row {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
        }
        .info-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9rem;
          color: var(--text-muted);
        }
        .info-item strong { color: var(--text-main); font-weight: 600; }

        /* Ticket Right Side (Code) */
        .ticket-code-section {
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 120px;
          background: var(--primary-bg);
          border-radius: 12px;
          padding: 12px;
          border: 1px solid #dbeafe;
        }
        .checkin-label { font-size: 0.75rem; color: var(--primary); font-weight: 600; margin-bottom: 4px; }
        .checkin-value { font-size: 1.4rem; font-weight: 800; color: var(--primary); letter-spacing: 1px; }
        .copy-icon { 
          margin-top: 8px; 
          font-size: 0.8rem; 
          cursor: pointer; 
          color: var(--primary); 
          opacity: 0.7;
          display: flex; 
          align-items: center; 
          justify-content: center; 
          gap: 4px;
        }
        .copy-icon:hover { opacity: 1; }

        /* Footer */
        .ticket-footer {
          padding: 14px 20px;
          background: #f8fafc;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .price-tag {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--primary);
        }
        .invoice-id {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-family: monospace;
          background: #e2e8f0;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: var(--text-muted);
        }

        /* Mobile Responsive */
        @media (max-width: 640px) {
          .controls-bar { grid-template-columns: 1fr; }
          .ticket-body { grid-template-columns: 1fr; gap: 16px; }
          .ticket-code-section { flex-direction: row; justify-content: space-between; align-items: center; padding: 12px 16px; }
          .checkin-value { margin-bottom: 0; font-size: 1.2rem; }
          .copy-icon { margin-top: 0; }
          .stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="invoice-wrapper">
        {/* HEADER */}
        <div className="page-header">
          <div className="header-left">
            {onBack && (
              <button className="back-btn" onClick={onBack}>
                <FaArrowLeft />
              </button>
            )}
            <div className="title-group">
              <h1>Vé của bạn</h1>
              <p>Quản lý lịch sử đặt vé và hóa đơn</p>
            </div>
          </div>
        </div>

        {bannerMessage && (
          <div className="banner">
            <FaCheckCircle /> {bannerMessage}
          </div>
        )}

        {/* SUMMARY STATS */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Tổng chi tiêu</div>
            <div className="stat-value money">{formatCurrency(totalSpent)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Vé đã đặt</div>
            <div className="stat-value">{invoices.length} chuyến</div>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="controls-bar">
          <div className="search-box">
            <FaSearch />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã vé, điểm đến, tên khách..."
            />
          </div>
          <button
            className="refresh-btn"
            onClick={fetchInvoices}
            disabled={loading}
          >
            <FaSyncAlt className={loading ? "fa-spin" : ""} />
            {loading ? "Đang tải" : "Làm mới"}
          </button>
        </div>

        {error && (
          <div
            className="banner"
            style={{ background: "#fee2e2", color: "#b91c1c", borderColor: "#fecaca" }}
          >
            {error}
          </div>
        )}

        {/* INVOICE LIST */}
        <div className="invoice-list">
          {!loading && filteredInvoices.length === 0 && (
            <div className="empty-state">
              <FaTicketAlt size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
              <p>Chưa tìm thấy hóa đơn nào.</p>
            </div>
          )}

          {filteredInvoices.map((inv) => {
            const statusStyle =
              statusConfig[inv.status || "paid"] || statusConfig.paid;
            const isHighlighted = inv.invoiceCode === highlightCode;

            return (
              <div
                key={inv._id || inv.invoiceCode}
                className={`ticket-card ${isHighlighted ? "highlight" : ""}`}
              >
                {/* Header: Date & Status */}
                <div className="ticket-header">
                  <div className="trip-date">
                    <FaCalendarDay color="#64748b" />
                    {inv.tripInfo?.departDate
                      ? formatDate(inv.tripInfo.departDate)
                      : "Ngày chưa xác định"}
                  </div>
                  <span className={`status-badge ${statusStyle.className}`}>
                    {statusStyle.label}
                  </span>
                </div>

                {/* Body: Route & Info */}
                <div className="ticket-body">
                  <div className="ticket-main-info">
                    {/* Route Timeline */}
                    <div className="route-timeline">
                      <div className="route-point">
                        <div className="dot from" />
                        <div className="time">{inv.tripInfo?.departTime || "--:--"}</div>
                        <div className="location">{inv.tripInfo?.from || "Điểm đi"}</div>
                      </div>
                      <div className="route-point">
                        <div className="dot to" />
                        <div className="time" style={{ opacity: 0.5 }}>Dự kiến</div>
                        <div className="location">{inv.tripInfo?.to || "Điểm đến"}</div>
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="info-row">
                      <div className="info-item">
                        <FaBus />
                        <span>{inv.tripInfo?.name || "Xe khách"}</span>
                      </div>
                      <div className="info-item">
                        <FaUser />
                        <strong>{inv.passengerName || "Khách hàng"}</strong>
                      </div>
                      <div className="info-item">
                        <FaTicketAlt />
                        <strong>
                          {inv.seats?.join(", ") || "Chưa chọn ghế"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Checkin Code Box */}
                  <div className="ticket-code-section">
                    <div className="checkin-label">MÃ CHECK-IN</div>
                    <div className="checkin-value">{inv.checkInCode}</div>
                    <div
                      className="copy-icon"
                      onClick={() => handleCopy(inv.checkInCode)}
                    >
                      <FaCopy /> Sao chép
                    </div>
                  </div>
                </div>

                {/* Footer: Price & ID */}
                <div className="ticket-footer">
                  <span className="invoice-id">#{inv.invoiceCode}</span>
                  <div className="price-tag">{formatCurrency(inv.amount)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}