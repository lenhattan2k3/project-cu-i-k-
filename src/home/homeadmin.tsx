import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import AdminMenu from "./menu/AdminMenu";
import { LogOut, LayoutDashboard, UserCircle } from "lucide-react";

// Import các trang chức năng
import AdminUserManagement from "./Admin/AdminUserManagement";
import AdminComplaint from "./Admin/AdminComplaint";
import AdminServiceFee from "./Admin/AdminServiceFee";
import AdminDebtReport from "./Admin/AdminDebtReport";
import AdminSystemMonitor from "./Admin/AdminSystemMonitor";

export default function HomeAdmin() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState("dashboard");
  const [user, setUser] = useState<any>(null);

  React.useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const doSignOut = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const renderContent = () => {
    switch (activePage) {
      case "user": return <AdminUserManagement />;
      case "complaint": return <AdminComplaint />;
      case "fee": return <AdminServiceFee />;
      case "debt": return <AdminDebtReport />;
      case "system": return <AdminSystemMonitor />;
      default:
        return (
          <div style={styles.dashboardWelcome}>
            <div style={{marginBottom: '20px'}}>
              <LayoutDashboard size={60} color="#60a5fa" />
            </div>
            <h2 style={styles.welcomeTitle}>Chào mừng trở lại, Admin!</h2>
            <p style={styles.welcomeDesc}>
              Hệ thống đã sẵn sàng. Chọn một chức năng từ menu bên trái để bắt đầu quản lý.
            </p>
          </div>
        );
    }
  };

  // --- STYLES (Premium Dark Glassmorphism) ---
  const styles = {
    wrapper: {
      display: "flex",
      minHeight: "100vh",
      background: "#0f172a", // Nền tối chủ đạo
      color: "#f8fafc", // Text sáng
      fontFamily: "'Outfit', 'Inter', sans-serif",
      position: "relative" as const,
      overflow: "hidden",
    },
    // Background Blobs (Tạo hiệu ứng cực quang nền)
    blob1: { position: "fixed", top: "-20%", left: "-10%", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, rgba(0,0,0,0) 70%)", zIndex: 0, filter: "blur(80px)" },
    blob2: { position: "fixed", bottom: "-20%", right: "-10%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(236,72,153,0.15) 0%, rgba(0,0,0,0) 70%)", zIndex: 0, filter: "blur(80px)" },

    mainContent: {
      flex: 1,
      marginLeft: "260px", // Chiều rộng của Menu (Cần đảm bảo AdminMenu có width này)
      display: "flex",
      flexDirection: "column" as const,
      position: "relative" as const,
      zIndex: 2, // Nằm trên blobs
      height: "100vh", // Quan trọng để scroll nội dung bên trong
      overflow: "hidden",
    },
    
    // Glass Header
    header: {
      background: "rgba(15, 23, 42, 0.7)", // Kính mờ nền tối
      backdropFilter: "blur(20px)",
      padding: "20px 32px",
      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      position: "sticky" as const,
      top: 0,
      zIndex: 10,
    },
    headerTitle: {
      margin: 0,
      fontSize: "24px",
      fontWeight: "800",
      background: "linear-gradient(to right, #60a5fa, #c084fc)", // Gradient text
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      letterSpacing: "-0.5px",
    },
    headerDesc: {
      color: "#94a3b8",
      margin: "4px 0 0 0",
      fontSize: "14px",
      fontWeight: "500",
    },
    
    // Logout Button (Glow effect)
    logoutBtn: {
      background: "rgba(239, 68, 68, 0.15)",
      color: "#fca5a5",
      border: "1px solid rgba(239, 68, 68, 0.3)",
      padding: "10px 20px",
      borderRadius: "12px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      display: "flex", alignItems: "center", gap: "8px",
      transition: "all 0.2s",
    },

    // Main Scrollable Area
    contentArea: {
      padding: "0", // Các trang con đã có padding riêng
      flex: 1,
      overflowY: "auto" as const,
      scrollBehavior: "smooth" as const,
    },

    // Dashboard Welcome Screen Styles
    dashboardWelcome: {
      height: "100%",
      display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center",
      padding: "40px",
      textAlign: "center" as const,
    },
    welcomeTitle: {
      fontSize: "36px", fontWeight: "900", marginBottom: "16px",
      background: "linear-gradient(to right, #fff, #94a3b8)",
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    },
    welcomeDesc: {
      color: "#94a3b8", fontSize: "18px", maxWidth: "500px", lineHeight: "1.6"
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* Global CSS cho scrollbar và hover */}
      <style>{`
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.5); }
        ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); borderRadius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.25); }
        .hover-logout:hover { background: rgba(239, 68, 68, 0.25) !important; border-color: rgba(239, 68, 68, 0.5) !important; color: white !important; box-shadow: 0 0 20px rgba(239, 68, 68, 0.3); }
      `}</style>

      {/* Background Ambience */}
      <div style={styles.blob1 as any}></div>
      <div style={styles.blob2 as any}></div>

      {/* Menu bên trái (Giả định AdminMenu cũng có style tối/kính) */}
      <AdminMenu activePage={activePage} setActivePage={setActivePage} />

      {/* Khu vực nội dung chính */}
      <div style={styles.mainContent}>
        {/* Header Kính mờ */}
        <header style={styles.header}>
          <div>
            <h1 style={styles.headerTitle}>
              Hệ Thống Quản Trị VexeTott
            </h1>
            <p style={styles.headerDesc}>
              Tổng quan và điều hành hoạt động sàn vé xe
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#f8fafc', fontWeight: '600', fontSize: '14px' }}>{user.ten || "Admin"}</div>
                  <div style={{ color: '#94a3b8', fontSize: '12px' }}>{user.email}</div>
                </div>
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="Avatar" 
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      objectFit: 'cover',
                      border: '2px solid rgba(96, 165, 250, 0.5)'
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.removeAttribute('style');
                    }}
                  />
                ) : null}
                <div style={{ display: user.photoURL ? 'none' : 'block' }}>
                  <UserCircle size={40} color="#60a5fa" />
                </div>
              </div>
            )}
            <button
              onClick={doSignOut}
              style={styles.logoutBtn}
              className="hover-logout"
            >
              <LogOut size={18} /> Đăng xuất
            </button>
          </div>
        </header>

        {/* Nội dung chính (Render các trang con) */}
        <main style={styles.contentArea}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}