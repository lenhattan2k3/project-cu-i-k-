import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import {
  FaBus,
  FaTicketAlt,
  FaChartBar,
  FaStar,
  FaBell,
  FaTags,
  FaMoneyBillWave,
  FaUserCircle,
  FaSignOutAlt,
  FaPlayCircle,
  FaBullhorn,
  FaGift,
  FaRoute,
} from "react-icons/fa";

// Import components (assuming these exist and are imported correctly in your project structure)
import PartnerTrip from "./partner/PartnerTrip";
import PartnerTicket from "./partner/PartnerTicket";
import PartnerReport from "./partner/PartnerReport";
import PartnerReview from "./partner/PartnerReview";
import PartnerProfile from "./partner/PartnerProfile";
import PartnerNotification from "./partner/PartnerNotification";
import PartnerPayment from "./partner/PartnerPayment";
import PartnerPromotion from "./partner/PartnerPromotion";

// --- GLOBAL CONSTANTS AND STYLES ---

const COLORS = {
  primary: "#4f46e5", // Indigo 600
  primaryDark: "#4338ca", // Indigo 700
  secondary: "#10b981", // Emerald 500
  backgroundLight: "#f9fafb", // Gray 50
  backgroundDark: "#fff",
  textBase: "#1f2937", // Gray 800
  textMuted: "#6b7280", // Gray 500
  border: "#e5e7eb", // Gray 200
  blue: "#2563eb",
  purple: "#9333ea",
  cyan: "#0ea5e9",
  orange: "#f97316",
  danger: "#ef4444", // Red 500
  dangerHover: "#dc2626", // Red 600
};

const dashboardStyles: Record<string, CSSProperties> = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 32,
  },
  hero: {
    background: COLORS.primary,
    borderRadius: 16,
    padding: "32px",
    color: "#fff",
    display: "flex",
    flexWrap: "wrap",
    gap: 24,
    alignItems: "center",
    boxShadow: `0 10px 20px rgba(79, 70, 229, 0.3), 0 3px 6px rgba(0,0,0,0.1)`,
  },
  heroText: {
    flex: 1,
    minWidth: 280,
  },
  heroMedia: {
    flexBasis: 280,
    flexGrow: 0,
    background: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 10,
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    overflow: "hidden",
  },
  heroButtons: {
    display: "flex",
    gap: 16,
    marginTop: 24,
    flexWrap: "wrap",
  },
  primaryBtn: {
    border: "none",
    borderRadius: 8,
    padding: "12px 24px",
    background: COLORS.secondary,
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    transition: "background 0.3s, transform 0.1s",
    boxShadow: `0 4px 6px rgba(16, 185, 129, 0.2)`,
  },
  ghostBtn: {
    border: `1px solid rgba(255,255,255,0.5)`,
    borderRadius: 8,
    padding: "12px 24px",
    background: "transparent",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.3s",
  },
  mediaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
    gap: 32,
  },
  mediaCard: {
    borderRadius: 16,
    padding: 24,
    background: COLORS.backgroundDark,
    boxShadow: `0 8px 15px rgba(0,0,0,0.05)`,
    border: `1px solid ${COLORS.border}`,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    transition: "box-shadow 0.2s",
  },
  video: {
    width: "100%",
    borderRadius: 12,
    border: `1px solid ${COLORS.border}`,
    objectFit: "cover",
    aspectRatio: "16 / 9",
  },
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
    gap: 32,
  },
  actionCard: {
    borderRadius: 16,
    background: COLORS.backgroundDark,
    border: `1px solid ${COLORS.border}`,
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    boxShadow: `0 8px 15px rgba(0,0,0,0.05)`,
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  formInputs: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  input: {
    borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
    padding: "12px 14px",
    fontFamily: "inherit",
    fontSize: 15,
    backgroundColor: COLORS.backgroundLight,
    color: COLORS.textBase,
    transition: "border-color 0.2s",
  },
  actionLink: {
    border: "none",
    borderRadius: 8,
    padding: "12px 14px",
    background: COLORS.primary,
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.3s",
    marginTop: 8,
  },
};

// --- DASHBOARD COMPONENT ---

interface DashboardProps {
  onNavigate: (target: string) => void;
}

function Dashboard({ onNavigate }: DashboardProps) {
  const formCards = [
    {
      title: "Tạo chuyến nhanh",
      description: "Nhập thông tin sơ bộ để chuyển sang trình quản lý chuyến",
      fields: ["Tên chuyến", "Ngày khởi hành"],
      target: "Manage Trips",
      icon: <FaRoute color={COLORS.blue} />,
    },
    {
      title: "Khuyến mãi mới",
      description: "Cài đặt mã giảm, thời gian áp dụng và điều hướng sang trang ưu đãi",
      fields: ["Tên chiến dịch", "Phần trăm giảm"],
      target: "Promotions",
      icon: <FaGift color={COLORS.purple} />,
    },
    {
      title: "Gửi thông báo",
      description: "Soạn nội dung nhanh cho hành khách rồi hoàn tất trong mục thông báo",
      fields: ["Tiêu đề", "Thời gian gửi"],
      target: "Notifications",
      icon: <FaBullhorn color={COLORS.cyan} />,
    },
  ];

  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Function to apply hover effect on actionCard
  const getActionCardStyle = (title: string): CSSProperties => ({
    ...dashboardStyles.actionCard,
    transform: hoveredCard === title ? "translateY(-4px)" : "translateY(0)",
    boxShadow: hoveredCard === title ? `0 12px 20px rgba(0,0,0,0.08)` : `0 8px 15px rgba(0,0,0,0.05)`,
    cursor: "pointer",
  });

  return (
    <div style={dashboardStyles.wrapper}>
      {/* 1. Hero Section */}
      <section style={dashboardStyles.hero}>
        <div style={dashboardStyles.heroText}>
          <p style={{ textTransform: "uppercase", letterSpacing: 1.5, margin: 0, fontWeight: 500, opacity: 0.8 }}>
            Partner Dashboard
          </p>
          <h1 style={{ margin: "8px 0", fontSize: 32 }}>Khu vực điều hành BusPartner</h1>
          <p style={{ margin: 0, opacity: 0.9 }}>
            Kiểm soát toàn bộ chuyến xe, doanh thu và chiến dịch quảng bá từ một bảng điều khiển duy nhất.
          </p>
          <div style={dashboardStyles.heroButtons}>
            <button
              style={dashboardStyles.primaryBtn as CSSProperties}
              onClick={() => onNavigate("Manage Trips")}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#059669")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.secondary)}
            >
              Quản lý chuyến <FaBus style={{ marginLeft: 6 }} />
            </button>
            <button
              style={dashboardStyles.ghostBtn as CSSProperties}
              onClick={() => onNavigate("Manage Tickets")}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              Quản lý vé <FaTicketAlt style={{ marginLeft: 6 }} />
            </button>
          </div>
        </div>
        <div style={dashboardStyles.heroMedia}>
          <img
            src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=60"
            alt="Luxury bus"
            style={{ width: "100%", borderRadius: 8, display: "block" }}
          />
        </div>
      </section>

      {/* 2. Media Grid */}
      <div style={dashboardStyles.mediaGrid}>
        {/* Card 1 */}
        <div style={dashboardStyles.mediaCard}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FaPlayCircle color={COLORS.blue} size={24} />
            <strong>Video quảng cáo</strong>
          </div>
          <video
            style={dashboardStyles.video}
            autoPlay
            loop
            muted
            playsInline
            poster="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=60"
          >
            <source src="https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4" type="video/mp4" />
          </video>
          <p style={{ margin: 0, color: COLORS.textMuted, fontSize: 14 }}>
            Cập nhật banner clip mới để tăng độ nhận diện và giữ chân khách hàng.
          </p>
        </div>
        {/* Card 2 */}
        <div style={dashboardStyles.mediaCard}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FaBullhorn color={COLORS.orange} size={24} />
            <strong>Banner khuyến mãi</strong>
          </div>
          <img
            src="https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=900&q=60"
            alt="Promo"
            style={{ width: "100%", borderRadius: 12, aspectRatio: "16 / 9", objectFit: "cover" }}
          />
          <p style={{ margin: 0, color: COLORS.textMuted, fontSize: 14 }}>
            Thiết kế banner và đẩy về trang Khuyến mãi để hoàn tất thông tin chi tiết.
          </p>
        </div>
      </div>

      {/* 3. Quick Action Grid */}
      <div style={dashboardStyles.actionGrid}>
        {formCards.map((card) => (
          <div
            key={card.title}
            style={getActionCardStyle(card.title)}
            onMouseEnter={() => setHoveredCard(card.title)}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => onNavigate(card.target)}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ fontSize: 22, paddingTop: 4 }}>{card.icon}</div>
              <div>
                <strong style={{ fontSize: 18, color: COLORS.textBase }}>{card.title}</strong>
                <p style={{ margin: "4px 0 0", color: COLORS.textMuted, fontSize: 14 }}>{card.description}</p>
              </div>
            </div>
            <div style={dashboardStyles.formInputs}>
              {card.fields.map((field) => (
                <input
                  key={field}
                  style={dashboardStyles.input}
                  placeholder={field}
                  disabled
                  title="Chức năng nhập liệu đang được tắt trong Dashboard"
                />
              ))}
            </div>
            {/* Action Button */}
            <button
              style={dashboardStyles.actionLink as CSSProperties}
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(card.target);
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.primaryDark)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.primary)}
            >
              Đi tới {card.target}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- HOME PARTNER COMPONENT (Main Layout) ---

export default function HomePartner() {
  const navigate = useNavigate();
  const [active, setActive] = useState("Dashboard");
  const [hoveredMenuItem, setHoveredMenuItem] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const doSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
      alert("Không thể đăng xuất. Vui lòng thử lại.");
    }
  };

  const menu = [
    { name: "Dashboard", label: "Tổng quan", icon: <FaChartBar /> },
    { name: "Manage Trips", label: "Quản lý chuyến", icon: <FaBus /> },
    { name: "Manage Tickets", label: "Quản lý vé", icon: <FaTicketAlt /> },
    { name: "Reports", label: "Báo cáo", icon: <FaChartBar /> },
    { name: "Reviews", label: "Đánh giá", icon: <FaStar /> },
    { name: "Promotions", label: "Khuyến mãi", icon: <FaTags /> },
  ];

  const bottomMenu = [
    { name: "Payments", label: "Thanh toán", icon: <FaMoneyBillWave /> },
    { name: "Notifications", label: "Thông báo", icon: <FaBell /> },
    { name: "Profile", label: "Hồ sơ", icon: <FaUserCircle /> },
  ];

  const renderContent = () => {
    switch (active) {
      case "Dashboard":
        return <Dashboard onNavigate={setActive} />;
      case "Manage Trips":
        return <PartnerTrip />;
      case "Manage Tickets":
        return <PartnerTicket />;
      case "Reports":
        return <PartnerReport />;
      case "Reviews":
        return <PartnerReview />;
      case "Promotions":
        return <PartnerPromotion />;
      case "Payments":
        return <PartnerPayment />;
      case "Notifications":
        return <PartnerNotification />;
      case "Profile":
        return <PartnerProfile />;
      default:
        return <Dashboard onNavigate={setActive} />;
    }
  };

  // Hàm tạo kiểu dáng cho Sidebar Item (Đã xử lý hover bằng state)
  const sidebarItemStyle = (name: string, isActive: boolean): CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 16px",
    borderRadius: 8,
    marginBottom: 4,
    cursor: "pointer",
    fontSize: 15,
    transition: "all 0.2s ease",
    backgroundColor: isActive
      ? "#eef2ff"
      : hoveredMenuItem === name
      ? COLORS.border
      : "transparent",
    color: isActive
      ? COLORS.primaryDark
      : hoveredMenuItem === name
      ? COLORS.textBase
      : COLORS.textMuted,
    fontWeight: isActive ? 600 : 500,
  });

  // Kiểu dáng cho nút Logout (Đã sửa lỗi trùng lặp thuộc tính color)
  const logoutButtonStyle: CSSProperties = {
    ...sidebarItemStyle("", false),
    justifyContent: "flex-start",
    marginTop: 10,
    border: "none",
    cursor: "pointer",
    padding: "10px 16px",
    transition: "all 0.2s",
    // Định nghĩa màu sắc dựa trên trạng thái hover
    backgroundColor: hoveredMenuItem === "Logout" ? "#fecaca" : "transparent",
    color: hoveredMenuItem === "Logout" ? COLORS.dangerHover : COLORS.textMuted,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Inter, Arial, sans-serif" }}>
      {/* Sidebar - Cố định vị trí bằng position: fixed */}
      <aside
        style={{
          width: 240,
          borderRight: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.backgroundDark,
          padding: "24px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          boxShadow: "2px 0 5px rgba(0,0,0,0.02)",
          position: "fixed", // Cố định thanh sidebar
          top: 0,
          bottom: 0,
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: COLORS.primary,
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            <FaBus />
          </div>
          <div>
            <strong style={{ color: COLORS.textBase, fontSize: 17 }}>BusPartner</strong>
            <p style={{ margin: 0, color: COLORS.textMuted, fontSize: 12 }}>Quản lý chuyến đi</p>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 10, 
            marginBottom: 24, 
            padding: "12px", 
            background: "#f3f4f6", 
            borderRadius: "12px",
            border: `1px solid ${COLORS.border}`
          }}>
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Avatar" 
                style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "2px solid white", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }} 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.removeAttribute('style');
                }}
              />
            ) : null}
            <div style={{ display: user.photoURL ? 'none' : 'block' }}>
              <FaUserCircle size={36} color={COLORS.textMuted} />
            </div>
            
            <div style={{ overflow: "hidden", flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textBase, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.ten || "Partner"}</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
            </div>
          </div>
        )}

        {/* Menu (Có thể cuộn nếu quá dài) */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {menu.map((item) => (
            <div
              key={item.name}
              style={sidebarItemStyle(item.name, active === item.name)}
              onClick={() => setActive(item.name)}
              onMouseEnter={() => setHoveredMenuItem(item.name)}
              onMouseLeave={() => setHoveredMenuItem(null)}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}

          <div style={{ borderTop: `1px solid ${COLORS.border}`, margin: "16px 0 12px" }} />

          {bottomMenu.map((item) => (
            <div
              key={item.name}
              style={sidebarItemStyle(item.name, active === item.name)}
              onClick={() => setActive(item.name)}
              onMouseEnter={() => setHoveredMenuItem(item.name)}
              onMouseLeave={() => setHoveredMenuItem(null)}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Logout Button */}
        <button
          onClick={doSignOut}
          style={logoutButtonStyle}
          onMouseEnter={() => setHoveredMenuItem("Logout")}
          onMouseLeave={() => setHoveredMenuItem(null)}
        >
          {/* Icon luôn có màu đỏ đậm */}
          <FaSignOutAlt style={{ color: COLORS.danger }} />
          Logout
        </button>
      </aside>

      {/* Main Content - Thêm margin-left để tạo khoảng trống cho sidebar cố định */}
      <main
        style={{
          flex: 1,
          background: COLORS.backgroundLight,
          padding: "36px 40px",
          marginLeft: 240, // Đẩy nội dung sang phải bằng chiều rộng sidebar
        }}
      >
        {renderContent()}
      </main>
    </div>
  );
}