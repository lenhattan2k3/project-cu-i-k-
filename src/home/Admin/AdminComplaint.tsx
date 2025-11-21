import React, { useState } from "react";
import AdminNotifications from "./AdminNotifications";
import AdminMessages from "./AdminMessages";

export default function AdminComplaint() {
  const [activeTab, setActiveTab] = useState<"complaints" | "notifications" | "messages">("complaints");

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "20px" }}>🧭 Quản lý Admin</h2>

      {/* Thanh điều hướng tab */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        {["complaints", "notifications", "messages"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{
              padding: "10px 15px",
              background: activeTab === tab ? "#2196F3" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            {tab === "complaints"
              ? "Khiếu nại"
              : tab === "notifications"
              ? "Thông báo"
              : "Tin nhắn"}
          </button>
        ))}
      </div>

      {/* Render nội dung theo tab */}
      {activeTab === "complaints" && (
        <div
          style={{
            background: "#fff",
            borderRadius: "10px",
            padding: "20px",
            textAlign: "center",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          }}
        >
          <h2>📨 Quản lý Khiếu nại</h2>
          <p>Trang này dùng để xem và phản hồi khiếu nại người dùng.</p>
        </div>
      )}

      {activeTab === "notifications" && <AdminNotifications />}
      {activeTab === "messages" && <AdminMessages />}
    </div>
  );
}
