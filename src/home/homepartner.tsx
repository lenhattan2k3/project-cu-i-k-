import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import {
  FaBus,
  FaTicketAlt,
  FaChartLine,
  FaStar,
  FaUserCircle,
  FaBell,
  FaMoneyBillWave,
  FaTags,
  FaSignOutAlt,
} from "react-icons/fa";

// 🔹 Import các file giao diện riêng
import PartnerTrip from "./partner/PartnerTrip";
import PartnerTicket from "./partner/PartnerTicket";
import PartnerReport from "./partner/PartnerReport";
import PartnerReview from "./partner/PartnerReview";
import PartnerProfile from "./partner/PartnerProfile";
import PartnerNotification from "./partner/PartnerNotification";
import PartnerPayment from "./partner/PartnerPayment";
import PartnerPromotion from "./partner/PartnerPromotion";

// 🔹 Dashboard tổng quan
function Dashboard() {
  return (
    <div>
      <h1 style={{ fontSize: "26px", color: "#1976d2" }}>📊 Tổng quan</h1>
      <p>Chào mừng Nhà Xe LÊ NHẬT TÂN 👋</p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {[
          { label: "Chuyến xe hôm nay", value: 12 },
          { label: "Vé đã bán", value: 324 },
          { label: "Doanh thu hôm nay", value: "8.200.000₫" },
          { label: "Đánh giá trung bình", value: "4.7 ⭐" },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              background: "#f1f8ff",
              borderRadius: "12px",
              padding: "24px",
              textAlign: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            }}
          >
            <h3 style={{ color: "#1976d2", fontSize: "22px", margin: 0 }}>
              {item.value}
            </h3>
            <p style={{ color: "#6c757d", marginTop: "8px" }}>{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePartner() {
  const navigate = useNavigate();
  const [active, setActive] = useState("Dashboard");

  // 🔹 Đăng xuất
  const doSignOut = async () => {
    await signOut(auth);
    navigate("/login");
  };

  // 🔹 Menu bên trái
  const menu = [
    { name: "Dashboard", icon: <FaChartLine /> },
    { name: "Quản lý chuyến xe", icon: <FaBus /> },
    { name: "Quản lý vé", icon: <FaTicketAlt /> },
    { name: "Thống kê báo cáo", icon: <FaChartLine /> },
    { name: "Đánh giá", icon: <FaStar /> },
    { name: "Hồ sơ", icon: <FaUserCircle /> },
    { name: "Thông báo", icon: <FaBell /> },
    { name: "Thanh toán", icon: <FaMoneyBillWave /> },
    { name: "Khuyến mãi", icon: <FaTags /> },
  ];

  // 🔹 Hiển thị nội dung từng trang
  const renderContent = () => {
    switch (active) {
      case "Dashboard":
        return <Dashboard />;
      case "Quản lý chuyến xe":
        return <PartnerTrip />;
      case "Quản lý vé":
        return <PartnerTicket />;
      case "Thống kê báo cáo":
        return <PartnerReport />;
      case "Đánh giá":
        return <PartnerReview />;
      case "Hồ sơ":
        return <PartnerProfile />;
      case "Thông báo":
        return <PartnerNotification />;
      case "Thanh toán":
        return <PartnerPayment />;
      case "Khuyến mãi":
        return <PartnerPromotion />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f4f6f8",
      }}
    >
      {/* 🌙 SIDEBAR */}
      <div
        style={{
          width: "260px",
          background: "#1976d2",
          color: "white",
          display: "flex",
          flexDirection: "column",
          padding: "24px 16px",
          boxShadow: "4px 0 20px rgba(0,0,0,0.1)",
        }}
      >
        <h2
          style={{
            fontSize: "22px",
            fontWeight: "bold",
            marginBottom: "32px",
            textAlign: "center",
          }}
        >
          🚍 Partner Dashboard
        </h2>

        {menu.map((item, i) => (
          <div
            key={i}
            onClick={() => setActive(item.name)}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "10px",
              cursor: "pointer",
              background:
                active === item.name ? "rgba(255,255,255,0.2)" : "transparent",
              transition: "all 0.3s ease",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.background =
                active === item.name ? "rgba(255,255,255,0.2)" : "transparent")
            }
          >
            <div style={{ marginRight: "12px", fontSize: "18px" }}>
              {item.icon}
            </div>
            <span style={{ fontSize: "15px" }}>{item.name}</span>
          </div>
        ))}

        <button
          onClick={doSignOut}
          style={{
            marginTop: "auto",
            background: "#e53935",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "12px 16px",
            fontSize: "16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <FaSignOutAlt />
          Đăng xuất
        </button>
      </div>

      {/* 🌤️ MAIN CONTENT */}
      <div style={{ flex: 1, padding: "40px" }}>{renderContent()}</div>
    </div>
  );
}
