import React from "react";

interface MenuProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

export default function AdminMenu({ activePage, setActivePage }: MenuProps) {
  const menuItems = [
    { id: "dashboard", label: "🏠 Trang chính" },
    { id: "user", label: "👤 Quản lý người dùng" },
    { id: "partner", label: "🚌 Duyệt nhà xe" },
    { id: "complaint", label: "📨 Khiếu nại" },
    { id: "fee", label: "💰 Phí dịch vụ" },
    { id: "debt", label: "📊 Báo cáo công nợ" },
    { id: "system", label: "⚙️ Giám sát hệ thống" },
  ];

  return (
    <div
      style={{
        width: "260px",
        background: "linear-gradient(135deg, #007bff, #00bfff)",
        color: "white",
        paddingTop: "30px",
        position: "fixed",
        left: 0,
        top: 0,
        height: "100vh",
        boxShadow: "2px 0 10px rgba(0,0,0,0.2)",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "30px" }}>Admin Panel</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {menuItems.map((item) => (
          <li
            key={item.id}
            onClick={() => setActivePage(item.id)}
            style={{
              padding: "15px 25px",
              background:
                activePage === item.id ? "rgba(255,255,255,0.2)" : "transparent",
              cursor: "pointer",
              transition: "0.3s",
            }}
          >
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
