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
  pickupNote?: string;
  image?: string;
  tripCode?: string;
  licensePlate?: string;
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

const statusChips = [
  { value: "all", label: "Tất cả" },
  { value: "paid", label: "Thành công" },
  { value: "pending", label: "Chờ xử lý" },
  { value: "cancelled", label: "Đã hủy" },
];

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

const formatDateTime = (value?: string) => {
  if (!value) return "--";
  try {
    return new Date(value).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
  const [statusFilter, setStatusFilter] = useState<string>("all");
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
    const keyword = search.trim().toLowerCase();
    return invoices.filter((inv) => {
      const matchesStatus =
        statusFilter === "all" || (inv.status || "paid") === statusFilter;
      if (!matchesStatus) return false;

      if (!keyword) return true;

      return [
        inv.invoiceCode,
        inv.checkInCode,
        inv.tripInfo?.from,
        inv.tripInfo?.to,
        inv.passengerName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [invoices, search, statusFilter]);

  const totalSpent = useMemo(
    () =>
      invoices
        .filter((i) => i.status === "paid")
        .reduce((sum, i) => sum + (i.amount ?? 0), 0),
    [invoices]
  );

  const paidTrips = useMemo(
    () => invoices.filter((i) => i.status === "paid").length,
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
          --primary-dark: #1d4ed8;
          --primary-light: #eff6ff;
          --text-main: #0f172a;
          --text-secondary: #64748b;
          --bg-page: #f8fafc;
          --surface: #ffffff;
          --border: #e2e8f0;
          --success: #10b981;
          --success-bg: #dcfce7;
          --danger: #ef4444;
          --danger-bg: #fee2e2;
          --warning: #f59e0b;
          --warning-bg: #fef3c7;
          --radius: 16px;
        }

        .invoice-container {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          
          min-height: 100vh;
          padding: 32px 20px;
          color: var(--text-main);
        }

        .invoice-wrapper {
          max-width: 1900px;
          margin: 0 auto;
        }

        /* Header */
        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
        }
        
        .back-btn {
          width: 40px; height: 40px;
          display: flex; align-items: center; justify-content: center;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 5px rgba(0,0,0,0.03);
        }
        .back-btn:hover {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
          transform: translateX(-2px);
        }

        .title-group h1 { font-size: 1.75rem; font-weight: 800; letter-spacing: -0.5px; margin: 0;color: white; }
        .title-group p { color: white; margin-top: 4px; }

        /* Hero Card */
        .summary-hero {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          border-radius: 24px;
          padding: 40px;
          color: white;
          margin-bottom: 40px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 20px 40px -10px rgba(37, 99, 235, 0.3);
        }
        .summary-hero::after {
          content: "";
          position: absolute;
          top: 0; right: 0; bottom: 0; left: 0;
          background: radial-gradient(circle at top right, rgba(255,255,255,0.1), transparent 40%);
        }
        
        .hero-content h2 { font-size: 1.8rem; margin: 0 0 8px; font-weight: 700; }
        .hero-content p { opacity: 0.9; font-size: 1rem; max-width: 600px; line-height: 1.5; }
        
        .hero-stats {
          display: flex; gap: 24px; margin-top: 32px; flex-wrap: wrap; position: relative; z-index: 2;
        }
        .hero-stat {
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          padding: 16px 24px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.1);
          min-width: 140px;
        }
        .hero-stat span { font-size: 0.85rem; opacity: 0.8; display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
        .hero-stat strong { font-size: 1.5rem; font-weight: 700; }

        /* Controls */
        .controls-bar {
          display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap;
        }
        .search-box {
          flex: 1; position: relative; min-width: 280px;
        }
        .search-box input {
          width: 100%;
          padding: 14px 20px 14px 48px;
          border-radius: 14px;
          border: 1px solid var(--border);
          background: var(--surface);
          font-size: 1rem;
          transition: all 0.2s;
          box-shadow: 0 2px 10px rgba(0,0,0,0.02);
        }
        .search-box input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 4px var(--primary-light);
          outline: none;
        }
        .search-box svg {
          position: absolute; left: 18px; top: 50%; transform: translateY(-50%);
          color: var(--text-secondary); font-size: 1.1rem;
        }

        .refresh-btn {
          padding: 0 24px;
          border-radius: 14px;
          background: var(--surface);
          border: 1px solid var(--border);
          font-weight: 600;
          color: var(--text-main);
          cursor: pointer;
          display: flex; align-items: center; gap: 8px;
          transition: all 0.2s;
          box-shadow: 0 2px 10px rgba(0,0,0,0.02);
        }
        .refresh-btn:hover { background: #f8fafc; border-color: #cbd5e1; }

        .status-chips {
          display: flex; gap: 10px; margin-bottom: 32px; overflow-x: auto; padding-bottom: 4px;
        }
        .status-chip {
          padding: 10px 20px;
          border-radius: 100px;
          background: var(--surface);
          border: 1px solid var(--border);
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .status-chip:hover { background: #f1f5f9; }
        .status-chip.active {
          background: var(--text-main);
          color: white;
          border-color: var(--text-main);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        /* Ticket Card */
        .ticket-card {
          background: var(--surface);
          border-radius: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          border: 1px solid var(--border);
          margin-bottom: 24px;
          overflow: hidden;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          position: relative;
        }
        .ticket-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .ticket-card.highlight {
          border: 2px solid var(--primary);
          background: #f8fafc;
        }

        .ticket-header {
          padding: 20px 32px;
          background: #f8fafc;
          border-bottom: 1px dashed var(--border);
          display: flex; justify-content: space-between; align-items: center;
        }
        .trip-date { font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 8px; font-size: 1.05rem; }
        .partner-pill {
          background: white; border: 1px solid var(--border); padding: 6px 12px; border-radius: 8px;
          font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;
        }
        
        .status-badge {
          padding: 6px 16px; border-radius: 100px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .status-paid { background: var(--success-bg); color: #15803d; }
        .status-pending { background: var(--warning-bg); color: #b45309; }
        .status-cancelled { background: var(--danger-bg); color: #b91c1c; }

        .ticket-body {
          padding: 32px;
          display: grid; grid-template-columns: 1fr 300px; gap: 40px;
        }

        /* Route Timeline */
        .route-timeline {
          position: relative; padding-left: 30px; margin-bottom: 32px;
        }
        .route-timeline::before {
          content: ''; position: absolute; left: 9px; top: 8px; bottom: 24px; width: 2px; background: #cbd5e1; border-left: 2px dashed #cbd5e1;
        }
        .route-point { position: relative; margin-bottom: 32px; }
        .route-point:last-child { margin-bottom: 0; }
        
        .dot {
          position: absolute; left: -30px; top: 0; width: 20px; height: 20px; border-radius: 50%;
          background: white; border: 4px solid var(--primary); box-shadow: 0 0 0 4px var(--primary-light);
        }
        .dot.to { border-color: var(--danger); box-shadow: 0 0 0 4px var(--danger-bg); }
        
        .time { font-size: 1.25rem; font-weight: 800; color: var(--text-main); line-height: 1; margin-bottom: 4px; }
        .location { font-size: 1rem; color: var(--text-secondary); font-weight: 500; }

        /* Details Grid */
        .detail-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;
        }
        .detail-box {
          background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid var(--border);
        }
        .detail-label { font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary); font-weight: 600; margin-bottom: 6px; }
        .detail-value { font-size: 0.95rem; font-weight: 600; color: var(--text-main); }

        /* Right Side: Code */
        .ticket-code-section {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 20px;
          padding: 24px;
          text-align: center;
          border: 1px solid var(--border);
          display: flex; flex-direction: column; justify-content: center;
        }
        .checkin-label { font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); letter-spacing: 1px; margin-bottom: 12px; }
        .checkin-value {
          font-size: 2rem; font-weight: 800; color: var(--primary); letter-spacing: 2px; margin-bottom: 16px;
          background: white; padding: 16px; border-radius: 12px; border: 2px dashed var(--primary-light);
        }
        
        .invoice-actions { display: flex; flex-direction: column; gap: 10px; }
        .action-btn {
          padding: 12px; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;
          border: 1px solid var(--border); background: white; color: var(--text-main);
        }
        .action-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
        .action-btn.primary {
          background: var(--primary); color: white; border: none; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }
        .action-btn.primary:hover { background: var(--primary-dark); transform: translateY(-1px); }

        /* Footer */
        .ticket-footer {
          background: #f8fafc; padding: 20px 32px; border-top: 1px solid var(--border);
          display: flex; justify-content: space-between; align-items: center;
        }
        .footer-meta { display: flex; gap: 32px; }
        .footer-pair span:first-child { font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 2px; }
        .footer-pair span:last-child { font-weight: 600; color: var(--text-main); }
        
        .price-tag { font-size: 1.5rem; font-weight: 800; color: var(--primary); }

        /* Responsive */
        @media (max-width: 768px) {
          .ticket-body { grid-template-columns: 1fr; gap: 24px; padding: 24px; }
          .ticket-code-section { flex-direction: row; justify-content: space-between; align-items: center; text-align: left; }
          .checkin-value { margin: 0; font-size: 1.5rem; padding: 8px 16px; }
          .invoice-actions { display: none; } /* Hide actions on mobile inside card, maybe show elsewhere? Or keep them */
          .ticket-code-section { display: block; text-align: center; } /* Revert for mobile simplicity */
          .checkin-value { margin-bottom: 16px; }
          .invoice-actions { display: flex; }
          .footer-meta { flex-direction: column; gap: 12px; }
          .ticket-footer { flex-direction: column; align-items: flex-start; gap: 16px; }
          .price-tag { align-self: flex-end; }
        }

        /* Restored & Enhanced Inner Layout */
        .info-row {
          display: flex; flex-wrap: wrap; gap: 24px; margin-bottom: 24px;
          padding-bottom: 24px; border-bottom: 1px dashed var(--border);
        }
        .info-item { display: flex; align-items: center; gap: 8px; color: var(--text-secondary); font-size: 0.95rem; }
        .info-item svg { color: var(--primary); }
        .info-item strong { color: var(--text-main); font-weight: 600; }

        .journey-extra {
          margin-top: 24px; display: flex; gap: 12px; flex-wrap: wrap;
        }
        .journey-pill {
          background: #f1f5f9; padding: 8px 16px; border-radius: 100px;
          font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;
        }
        
        .invoice-id {
          font-family: 'Monaco', 'Consolas', monospace;
          background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 0.85rem; color: var(--text-main);
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

        <div className="summary-hero">
          <div className="hero-content">
            <h2>Xin chào {user?.name || user?.displayName || "bạn"} 👋</h2>
            <p>
              Theo dõi lịch sử thanh toán, mã check-in và thông tin nhà xe của từng chuyến
              đi ngay tại đây.
            </p>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span>Tổng chi tiêu</span>
              <strong>{formatCurrency(totalSpent)}</strong>
            </div>
            <div className="hero-stat">
              <span>Vé đã đặt</span>
              <strong>{invoices.length}</strong>
            </div>
            <div className="hero-stat">
              <span>Đã thanh toán</span>
              <strong>{paidTrips}</strong>
            </div>
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

        <div className="status-chips">
          {statusChips.map((chip) => (
            <button
              key={chip.value}
              className={`status-chip ${statusFilter === chip.value ? "active" : ""}`}
              onClick={() => setStatusFilter(chip.value)}
            >
              {chip.label}
            </button>
          ))}
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
                  <div className="header-meta">
                    <div className="trip-date">
                      <FaCalendarDay color="#64748b" />
                      {inv.tripInfo?.departDate
                        ? formatDate(inv.tripInfo.departDate)
                        : "Ngày chưa xác định"}
                    </div>
                    <div className="partner-pill">
                      <FaBus size={14} />
                      {inv.tripInfo?.partnerName || "Đang cập nhật nhà xe"}
                    </div>
                  </div>
                  <span className={`status-badge ${statusStyle.className}`}>
                    {statusStyle.label}
                  </span>
                </div>

                {/* Body: Route & Info */}
                <div className="ticket-body">
                  <div className="ticket-main-info">
                    
                    {/* Trip Image */}
                    {inv.tripInfo?.image && (
                      <div className="trip-image-container" style={{ marginBottom: '24px', borderRadius: '16px', overflow: 'hidden', height: '220px', border: '1px solid var(--border)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <img 
                          src={inv.tripInfo.image} 
                          alt="Hình ảnh xe" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Route Timeline */}
                    <div className="route-timeline">
                      <div className="route-point">
                        <div className="dot from">
                          <FaMapMarkerAlt size={12} />
                        </div>
                        <div className="time">{inv.tripInfo?.departTime || "--:--"}</div>
                        <div className="location">{inv.tripInfo?.from || "Điểm đi"}</div>
                      </div>
                      <div className="route-point">
                        <div className="dot to">
                          <FaMapMarkerAlt size={12} />
                        </div>
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

                    <div className="detail-grid">
                      <div className="detail-box">
                        <div className="detail-label">Điểm đón (Tuyến)</div>
                        <div className="detail-value">
                          {inv.tripInfo?.from || "Chưa cập nhật"}
                        </div>
                      </div>
                      
                      {/* Hiển thị địa chỉ đón chi tiết nếu có */}
                      {inv.tripInfo?.pickupNote && (
                        <div className="detail-box" style={{ background: "#f0f9ff", borderColor: "#bae6fd" }}>
                          <div className="detail-label" style={{ color: "#0284c7", fontWeight: 700 }}>📍 Địa chỉ đón chi tiết</div>
                          <div className="detail-value" style={{ color: "#0369a1" }}>
                            {inv.tripInfo.pickupNote}
                          </div>
                        </div>
                      )}

                      <div className="detail-box">
                        <div className="detail-label">Điểm trả (Đến)</div>
                        <div className="detail-value">
                          {inv.tripInfo?.to || "Chưa cập nhật"}
                        </div>
                      </div>
                      <div className="detail-box">
                        <div className="detail-label">Loại xe</div>
                        <div className="detail-value">
                          {inv.tripInfo?.vehicleType || "Đang cập nhật"}
                        </div>
                      </div>
                      <div className="detail-box">
                        <div className="detail-label">Ghế</div>
                        <div className="detail-value">
                          {inv.seats?.length ? inv.seats.join(", ") : "Chưa chọn ghế"}
                        </div>
                      </div>
                      <div className="detail-box">
                        <div className="detail-label">Hành khách</div>
                        <div className="detail-value">
                          {inv.passengerName || "Khách hàng"}
                          {inv.passengerPhone ? ` - ${inv.passengerPhone}` : ""}
                        </div>
                      </div>
                      <div className="detail-box">
                        <div className="detail-label">Mã đặt chỗ</div>
                        <div className="detail-value">{inv.bookingId || "--"}</div>
                      </div>
                      <div className="detail-box">
                        <div className="detail-label">Biển số xe</div>
                        <div className="detail-value" style={{ fontWeight: 'bold', color: '#1e40af', textTransform: 'uppercase' }}>
                          {inv.tripInfo?.licensePlate || "Đang cập nhật"}
                        </div>
                      </div>
                      <div className="detail-box">
                        <div className="detail-label">Mã tài</div>
                        <div className="detail-value" style={{ fontWeight: 'bold', color: '#4b5563' }}>
                          {inv.tripInfo?.tripCode || "Đang cập nhật"}
                        </div>
                      </div>
                      <div className="detail-box">
                        <div className="detail-label">Phương thức</div>
                        <div className="detail-value">
                          {inv.paymentMethod || "Đang cập nhật"}
                        </div>
                      </div>
                      <div className="detail-box">
                        <div className="detail-label">Mã thanh toán</div>
                        <div className="detail-value">
                          {inv.orderCode || inv.invoiceCode}
                        </div>
                      </div>
                      {/* Đã chuyển phần hiển thị pickupNote lên trên */}
                    </div>

                    <div className="journey-extra">
                      <div className="journey-pill">
                        <FaClock size={14} />
                        {inv.tripInfo?.departDate
                          ? `${formatDate(inv.tripInfo.departDate)} · ${inv.tripInfo?.departTime || "--:--"}`
                          : "Chưa có lịch"}
                      </div>
                      {inv.tripInfo?.pickupNote && (
                        <div className="journey-pill">
                          <FaMapMarkerAlt size={14} />
                          {inv.tripInfo.pickupNote}
                        </div>
                      )}
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
                    <div className="invoice-actions">
                      {inv.invoiceUrl && (
                        <button
                          className="action-btn primary"
                          onClick={() => window.open(inv.invoiceUrl!, "_blank", "noopener")}
                        >
                          Xem hóa đơn
                        </button>
                      )}
                      <button
                        className="action-btn"
                        onClick={() => handleCopy(inv.orderCode || inv.invoiceCode)}
                      >
                        Sao chép mã thanh toán
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer: Price & ID */}
                <div className="ticket-footer">
                  <div className="footer-meta">
                    <div className="footer-pair">
                      <span>Mã hóa đơn</span>
                      <span className="invoice-id">#{inv.invoiceCode}</span>
                    </div>
                    <div className="footer-pair">
                      <span>Mã thanh toán</span>
                      <span>{inv.orderCode || "--"}</span>
                    </div>
                    <div className="footer-pair">
                      <span>Ngày xuất</span>
                      <span>{formatDateTime(inv.issuedAt || inv.createdAt)}</span>
                    </div>
                  </div>
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