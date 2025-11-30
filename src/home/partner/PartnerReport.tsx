import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  ShoppingCart,
  Users,
  Star,
  Ticket,
  Armchair,
  BadgeDollarSign,
} from "lucide-react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Stats {
  totalOrders: number;
  totalCustomers: number;
  totalTickets: number;
  avgRating: number;
  totalRevenue: number;
  totalEmptySeats: number;
  totalPoints: number;
}

interface RevenueData {
  label: string;
  revenue: number;
  tickets: number;
}

interface OrderStatusData {
  name: string;
  value: number;
  color: string;
  [key: string]: any;
}

interface RecentOrder {
  id: string;
  customer: string;
  route: string;
  amount: number;
  status: string;
}

interface TopRoute {
  route: string;
  tickets: number;
  revenue: number;
}

interface AppliedFilter {
  period: string;
  start: string | null;
  end: string | null;
}

type PeriodFilter = "all" | "day" | "month" | "year";

const defaultStats: Stats = {
  totalOrders: 0,
  totalCustomers: 0,
  totalTickets: 0,
  avgRating: 0,
  totalRevenue: 0,
  totalEmptySeats: 0,
  totalPoints: 0,
};

interface LoyaltyLeader {
  userId: string;
  name: string;
  points: number;
}

export default function BusTicketDashboard() {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [stats, setStats] = useState<Stats>(defaultStats);

  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<OrderStatusData[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topRoutes, setTopRoutes] = useState<TopRoute[]>([]);
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [selectedDay, setSelectedDay] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear().toString());
  const [appliedFilter, setAppliedFilter] = useState<AppliedFilter | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const initialLoadRef = useRef(true);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loyaltyLeaders, setLoyaltyLeaders] = useState<LoyaltyLeader[]>([]);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setPartnerId(user?.uid ?? null);
      initialLoadRef.current = true;
      setLoading(true);

      if (!user) {
        setStats(defaultStats);
        setRevenueData([]);
        setOrderStatusData([]);
        setRecentOrders([]);
        setTopRoutes([]);
        setLoyaltyLeaders([]);
      }

      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authChecked) return;

    if (!partnerId) {
      setLoading(false);
      setErrorMessage("Vui lòng đăng nhập bằng tài khoản nhà xe để xem thống kê.");
      return;
    }

    const fetchReport = async () => {
      const isInitialLoad = initialLoadRef.current;
      try {
        if (!isInitialLoad) {
          setRefreshing(true);
        }
        setErrorMessage(null);
        const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
        const endpoint = `${apiBase}/api/stats/report/${partnerId}`;

        const params = new URLSearchParams();
        if (period !== "all") {
          params.append("period", period);
          const dateValue =
            period === "day"
              ? selectedDay
              : period === "month"
              ? selectedMonth
              : selectedYear;
          if (dateValue) {
            params.append("date", dateValue);
          }
        }
        const url = params.toString() ? `${endpoint}?${params.toString()}` : endpoint;

        const res = await axios.get(url);
        if (res.data.success) {
          setStats(res.data.stats);
          setRevenueData(res.data.revenueData || []);
          setOrderStatusData(res.data.orderStatusData || []);
          setRecentOrders(res.data.recentOrders || []);
          setTopRoutes(res.data.topRoutes || []);
          setAppliedFilter(res.data.appliedFilter ?? null);
          setLoyaltyLeaders(res.data.loyaltyLeaders || []);
        } else {
          setErrorMessage(res.data.message || "Không thể tải dữ liệu thống kê");
        }
      } catch (error) {
        console.error("Error fetching report:", error);
        setErrorMessage("Không thể tải báo cáo. Vui lòng kiểm tra lại server.");
      } finally {
        if (isInitialLoad) {
          setLoading(false);
          initialLoadRef.current = false;
        }
        setRefreshing(false);
      }
    };

    fetchReport();
  }, [authChecked, partnerId, period, selectedDay, selectedMonth, selectedYear]);

  const filterDescription = (() => {
    if (period === "all" && !appliedFilter?.start && !appliedFilter?.end) {
      return "Toàn bộ thời gian";
    }
    if (!appliedFilter?.start || !appliedFilter?.end) {
      return "";
    }
    const start = new Date(appliedFilter.start).toLocaleDateString("vi-VN");
    const end = new Date(appliedFilter.end).toLocaleDateString("vi-VN");
    return start === end ? start : `${start} - ${end}`;
  })();

  if (loading) {
    return <div className="p-10 text-center">Đang tải dữ liệu thống kê...</div>;
  }

  if (authChecked && !partnerId) {
    return (
      <div className="p-10 text-center">
        Bạn cần đăng nhập bằng tài khoản nhà xe để xem thống kê riêng của mình.
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <style>{`
        .dashboard-container {
          font-family: Arial, sans-serif;
          background: linear-gradient(to bottom right, #f9fafb, #eef4ff);
          min-height: 100vh;
          padding: 30px;
        }
        h1 {
          font-size: 26px;
          color: #1e293b;
          margin-bottom: 4px;
        }
        p.subtitle {
          color: #64748b;
          margin-bottom: 24px;
        }
        .grid {
          display: grid;
          gap: 20px;
        }
        .grid-6 {
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        }
        .grid-2 {
          grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
        }
        .card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .stat-card {
          color: white;
          padding: 20px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .cyan { background: linear-gradient(135deg, #06b6d4, #0891b2); }
        .red { background: linear-gradient(135deg, #ef4444, #dc2626); }
        .green { background: linear-gradient(135deg, #10b981, #059669); }
        .amber { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
        .purple { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .stat-value {
          font-size: 28px;
          font-weight: bold;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #eee;
          font-size: 14px;
        }
        th {
          color: #475569;
          font-weight: 600;
        }
        td {
          color: #1e293b;
        }
        .badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }
        .success { background: #dcfce7; color: #166534; }
        .warning { background: #fef9c3; color: #92400e; }
        .error { background: #fee2e2; color: #991b1b; }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
        }
        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 3px;
        }
        .summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        .summary-item {
          border-left: 4px solid #3b82f6;
          padding-left: 10px;
        }
        .summary-item.green { border-color: #10b981; }
        .summary-item.amber { border-color: #f59e0b; }
        .summary-item p { margin: 0; }
        .filter-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: flex-end;
        }
        .filter-grid label {
          display: block;
          font-size: 13px;
          color: #475569;
          margin-bottom: 4px;
        }
        .filter-grid input,
        .filter-grid select {
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #cbd5f5;
          min-width: 180px;
          background: #fff;
          color: #0f172a;
        }
        .filter-info {
          margin-top: 12px;
          font-size: 13px;
          color: #475569;
        }
        .refresh-tag {
          font-size: 13px;
          color: #2563eb;
          font-weight: 600;
        }
        .loyalty-card {
          background: linear-gradient(135deg, #f8fbff, #e0edff);
          border: 1px solid #cfdfff;
        }
        .loyalty-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .loyalty-header h2 {
          margin: 0;
          color: #1d4ed8;
        }
        .loyalty-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .loyalty-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: white;
          border-radius: 12px;
          padding: 12px 16px;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08);
          border-left: 4px solid #3b82f6;
        }
        .loyalty-rank {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #eff6ff;
          color: #1d4ed8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          margin-right: 12px;
        }
        .loyalty-info {
          flex: 1;
          color: #0f172a;
        }
        .loyalty-info p {
          margin: 0;
          font-weight: 600;
        }
        .loyalty-info span {
          font-size: 13px;
          color: #64748b;
        }
        .loyalty-points {
          font-weight: 700;
          color: #0f172a;
          font-size: 16px;
        }
      `}</style>

      <h1>Trang quản trị hệ thống vé xe online</h1>
      <p className="subtitle">Thống kê và báo cáo tổng quan</p>

      {/* Thống kê tổng */}
      {errorMessage && (
        <div className="card" style={{ marginBottom: "16px" }}>
          <strong>{errorMessage}</strong>
        </div>
      )}

      <div className="card filter-card">
        <div className="filter-grid">
          <div>
            <label>Chu kỳ thống kê</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value as PeriodFilter)}>
              <option value="all">Tất cả</option>
              <option value="day">Theo ngày</option>
              <option value="month">Theo tháng</option>
              <option value="year">Theo năm</option>
            </select>
          </div>

          {period === "day" && (
            <div>
              <label>Chọn ngày</label>
              <input type="date" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} />
            </div>
          )}

          {period === "month" && (
            <div>
              <label>Chọn tháng</label>
              <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
            </div>
          )}

          {period === "year" && (
            <div>
              <label>Chọn năm</label>
              <input
                type="number"
                min="2000"
                max="2100"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              />
            </div>
          )}

          <div style={{ marginLeft: "auto" }}>
            {refreshing && <span className="refresh-tag">Đang cập nhật...</span>}
          </div>
        </div>
        {filterDescription && (
          <p className="filter-info">
            Đang xem dữ liệu: <strong>{filterDescription}</strong>
          </p>
        )}
      </div>

      <div className="grid grid-6">
        <div className="stat-card cyan">
          <div className="stat-header">
            <ShoppingCart size={36} />
            <span>Chi tiết</span>
          </div>
          <div>
            <h3>TỔNG SỐ ĐƠN HÀNG</h3>
            <p className="stat-value">{stats.totalOrders}</p>
          </div>
        </div>

        <div className="stat-card red">
          <div className="stat-header">
            <Users size={36} />
            <span>Chi tiết</span>
          </div>
          <div>
            <h3>KHÁCH HÀNG</h3>
            <p className="stat-value">{stats.totalCustomers}</p>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-header">
            <Ticket size={36} />
            <span>Chi tiết</span>
          </div>
          <div>
            <h3>TỔNG SỐ VÉ</h3>
            <p className="stat-value">{stats.totalTickets}</p>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-header">
            <Armchair size={36} />
            <span>Chi tiết</span>
          </div>
          <div>
            <h3>SỐ GHẾ TRỐNG</h3>
            <p className="stat-value">{stats.totalEmptySeats}</p>
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-header">
            <BadgeDollarSign size={36} />
            <span>Chi tiết</span>
          </div>
          <div>
            <h3>ĐIỂM TÍCH LŨY</h3>
            <p className="stat-value">{stats.totalPoints}</p>
          </div>
        </div>

        <div className="stat-card amber">
          <div className="stat-header">
            <Star size={36} />
            <span>Chi tiết</span>
          </div>
          <div>
            <h3>ĐÁNH GIÁ TB</h3>
            <p className="stat-value">{stats.avgRating} ⭐</p>
          </div>
        </div>
      </div>

      {/* Biểu đồ */}
      <div className="grid grid-2" style={{ marginTop: "24px" }}>
        <div className="card">
          <h2>Biểu đồ doanh thu và vé bán</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip formatter={(value) => Number(value).toLocaleString()} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Doanh thu (VNĐ)" />
              <Line yAxisId="right" type="monotone" dataKey="tickets" stroke="#10b981" strokeWidth={2} name="Số vé bán" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2>Thống kê trạng thái đơn hàng</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {orderStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number | string) => `${Number(value).toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap" }}>
            {orderStatusData.map((item, idx) => (
              <div key={idx} className="legend-item">
                <div className="legend-color" style={{ backgroundColor: item.color }}></div>
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="grid grid-2" style={{ marginTop: "24px" }}>
        <div className="card">
          <h2>Đơn hàng mới</h2>
          <table>
            <thead>
              <tr>
                <th>Mã vé</th>
                <th>Khách hàng</th>
                <th>Tuyến</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o, i) => (
                <tr key={i}>
                  <td>{String(o.id).substring(0, 8)}...</td>
                  <td>{o.customer}</td>
                  <td>{o.route}</td>
                  <td>{o.amount.toLocaleString()}₫</td>
                  <td>
                    <span className={`badge ${
                      o.status === "paid" || o.status === "completed" || o.status === "done"
                        ? "success"
                        : o.status === "pending" || o.status === "processing"
                        ? "warning"
                        : "error"
                    }`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2>Top tuyến bán chạy</h2>
          <table>
            <thead>
              <tr>
                <th>Tuyến đường</th>
                <th>Số vé</th>
                <th>Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {topRoutes.map((r, i) => (
                <tr key={i}>
                  <td>{r.route}</td>
                  <td>{r.tickets}</td>
                  <td>{r.revenue.toLocaleString()}₫</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tổng quan */}
      <div className="card" style={{ marginTop: "24px" }}>
        <h2>Tổng quan tháng này</h2>
        <div className="summary">
          <div className="summary-item">
            <p>Tổng doanh thu</p>
            <p><strong>{stats.totalRevenue.toLocaleString()}₫</strong></p>
          </div>
          <div className="summary-item green">
            <p>Vé đã bán</p>
            <p><strong>{stats.totalTickets} vé</strong></p>
          </div>
          <div className="summary-item amber">
            <p>Giá trung bình/vé</p>
            <p><strong>{stats.totalTickets > 0 ? Math.round(stats.totalRevenue / stats.totalTickets).toLocaleString() : 0}₫</strong></p>
          </div>
        </div>
      </div>

      <div className="card loyalty-card" style={{ marginTop: "24px" }}>
        <div className="loyalty-header">
          <h2>Bảng xếp hạng điểm tích lũy</h2>
          <span style={{ color: "#1d4ed8", fontWeight: 600 }}>
            Top {loyaltyLeaders.length || 0} tài khoản
          </span>
        </div>
        {loyaltyLeaders.length > 0 ? (
          <div className="loyalty-list">
            {loyaltyLeaders.map((leader, index) => (
              <div className="loyalty-item" key={`${leader.userId}-${index}`}>
                <div className="loyalty-rank">{index + 1}</div>
                <div className="loyalty-info">
                  <p>{leader.name || "Khách hàng"}</p>
                  <span>ID: {leader.userId}</span>
                </div>
                <div className="loyalty-points">{leader.points.toLocaleString()} điểm</div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#475569" }}>Chưa có dữ liệu tích lũy cho giai đoạn này.</p>
        )}
      </div>
    </div>
  );
}
