import React, { useState } from "react";
import {
  ShoppingCart,
  Users,
  Star,
  Ticket,
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

export default function BusTicketDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  const stats = {
    totalOrders: 1247,
    totalCustomers: 856,
    totalTickets: 3421,
    avgRating: 4.7,
    totalRevenue: 245680000,
  };

  const revenueData = [
    { month: "T1", revenue: 18500000, tickets: 245 },
    { month: "T2", revenue: 21200000, tickets: 298 },
    { month: "T3", revenue: 19800000, tickets: 267 },
    { month: "T4", revenue: 23400000, tickets: 312 },
    { month: "T5", revenue: 25100000, tickets: 334 },
    { month: "T6", revenue: 22900000, tickets: 289 },
    { month: "T7", revenue: 26800000, tickets: 356 },
    { month: "T8", revenue: 24300000, tickets: 318 },
    { month: "T9", revenue: 21700000, tickets: 285 },
    { month: "T10", revenue: 23900000, tickets: 301 },
    { month: "T11", revenue: 20180000, tickets: 273 },
    { month: "T12", revenue: 18000000, tickets: 243 },
  ];

  const orderStatusData = [
    { name: "Hoàn tất", value: 856, color: "#4ade80" },
    { name: "Đang vận chuyển", value: 142, color: "#1e293b" },
    { name: "Huỷ bỏ", value: 89, color: "#fb923c" },
    { name: "Hoàn tất", value: 160, color: "#60a5fa" },
  ];

  const recentOrders = [
    { id: "VX001", customer: "LÊ NHẬT TÂN", route: "Hà Nội - Hải Phòng", amount: 250000, status: "Đã thanh toán" },
    { id: "VX002", customer: "THÁI VĂN TIÊN ", route: "TP.HCM - Vũng Tàu", amount: 180000, status: "Đã thanh toán" },
    { id: "VX003", customer: "MAI VĂN QUỐC ", route: "Đà Nẵng - Huế", amount: 150000, status: "Chờ xác nhận" },
    { id: "VX004", customer: "CAPTAIN TIÊN", route: "Hà Nội - Thanh Hóa", amount: 200000, status: "Đã thanh toán" },
    { id: "VX005", customer: "MENTOR Quốc", route: "TP.HCM - Đà Lạt", amount: 320000, status: "Đã huỷ" },
  ];

  const topRoutes = [
    { route: "TP.HCM - Vũng Tàu", tickets: 456, revenue: 82080000 },
    { route: "Hà Nội - Hải Phòng", tickets: 398, revenue: 99500000 },
    { route: "TP.HCM - Đà Lạt", tickets: 367, revenue: 117440000 },
    { route: "Đà Nẵng - Huế", tickets: 312, revenue: 46800000 },
    { route: "Hà Nội - Ninh Bình", tickets: 289, revenue: 52020000 },
  ];

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
        .grid-4 {
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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
      `}</style>

      <h1>Trang quản trị hệ thống vé xe online</h1>
      <p className="subtitle">Thống kê và báo cáo tổng quan</p>

      {/* Thống kê tổng */}
      <div className="grid grid-4">
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
          <h2>Biểu đồ doanh thu và vé bán theo tháng</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
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
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
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
                  <td>{o.id}</td>
                  <td>{o.customer}</td>
                  <td>{o.route}</td>
                  <td>{o.amount.toLocaleString()}₫</td>
                  <td>
                    <span className={`badge ${
                      o.status === "Đã thanh toán"
                        ? "success"
                        : o.status === "Chờ xác nhận"
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
            <p><strong>{Math.round(stats.totalRevenue / stats.totalTickets).toLocaleString()}₫</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
}
