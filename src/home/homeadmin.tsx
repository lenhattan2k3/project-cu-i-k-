import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import AdminMenu from "./menu/AdminMenu";

// Import các trang chức năng
import AdminUserManagement from "./Admin/AdminUserManagement";
import AdminPartnerApproval from "./Admin/AdminPartnerApproval";
import AdminComplaint from "./Admin/AdminComplaint";
import AdminServiceFee from "./Admin/AdminServiceFee";
import AdminDebtReport from "./Admin/AdminDebtReport";
import AdminSystemMonitor from "./Admin/AdminSystemMonitor";

export default function HomeAdmin() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState("dashboard");

  const doSignOut = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const renderContent = () => {
    switch (activePage) {
      case "user":
        return <AdminUserManagement />;
      case "partner":
        return <AdminPartnerApproval />;
      case "complaint":
        return <AdminComplaint />;
      case "fee":
        return <AdminServiceFee />;
      case "debt":
        return <AdminDebtReport />;
      case "system":
        return <AdminSystemMonitor />;
      default:
        return (
          <div>
            <h2 style={{ marginBottom: "15px" }}>📋 Chức năng quản trị</h2>
            <p>Chọn một mục bên menu để bắt đầu quản lý hệ thống.</p>
          </div>
        );
    }
  };

  return (
    <div style={{ display: "flex", background: "#f8f9fa", minHeight: "100vh" }}>
      {/* Menu bên trái */}
      <AdminMenu activePage={activePage} setActivePage={setActivePage} />

      {/* Khu vực nội dung chính */}
      <div
        style={{
          flex: 1,
          marginLeft: "260px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <header
          style={{
            background: "white",
            padding: "20px 40px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div>
            <h1
              style={{
                color: "#007bff",
                margin: 0,
                fontSize: "26px",
                fontWeight: "600",
              }}
            >
              Bảng điều khiển Quản lý sàn
            </h1>
            <p
              style={{
                color: "#6c757d",
                margin: "5px 0 0 0",
                fontSize: "15px",
              }}
            >
              Quản lý người dùng, nhà xe và hệ thống
            </p>
          </div>

          <button
            onClick={doSignOut}
            style={{
              background: "linear-gradient(135deg, #dc3545, #c82333)",
              color: "white",
              border: "none",
              padding: "10px 22px",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: "500",
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(220, 53, 69, 0.3)",
            }}
          >
            Đăng xuất
          </button>
        </header>

        {/* Nội dung chính */}
        <main style={{ padding: "40px", flex: 1, overflowY: "auto" }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
