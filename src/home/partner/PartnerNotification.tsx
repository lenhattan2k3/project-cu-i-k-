import { useEffect, useState } from "react";
import { socket } from "../../utils/socket";
import { getNotificationsByRole } from "../../api/notificationsApi";

interface Notification {
  _id: string;
  title: string;
  content: string;
  sender: string;
  receivers?: string[];
  image?: string; // 🖼️ Thêm ảnh
  createdAt: string;
}

export default function PartnerNotification() {
  const [noti, setNoti] = useState<Notification[]>([]);

  useEffect(() => {
    // 🟢 Lấy thông báo khởi tạo
    const fetchNotifications = async () => {
      try {
        const data = await getNotificationsByRole("partner");
        setNoti(data.reverse()); // Mới nhất trước
      } catch (error) {
        console.error("Lỗi lấy thông báo:", error);
      }
    };
    fetchNotifications();

    // 🟢 Nhận thông báo realtime
    socket.on("receive_notification", (data: Notification) => {
      console.log("📩 New notification for partner:", data);
      if (
        data.receivers &&
        (data.receivers.includes("partner") || data.receivers.includes("all"))
      ) {
        setNoti((prev) => [data, ...prev]);
      }
    });

    return () => {
      socket.off("receive_notification");
    };
  }, []);

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <h2
        style={{
          color: "#1e40af",
          marginBottom: "24px",
          fontSize: "28px",
          fontWeight: "700",
          letterSpacing: "-0.5px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span style={{ fontSize: "32px" }}>🔔</span> Thông báo
      </h2>

      {noti.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "60px 20px",
            textAlign: "center",
            border: "1px solid #e0e7ff",
            boxShadow: "0 4px 20px rgba(30, 64, 175, 0.08)",
          }}
        >
          <p
            style={{
              color: "#94a3b8",
              fontSize: "15px",
              fontWeight: "500",
            }}
          >
            Không có thông báo nào
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {noti.map((n) => (
            <div
              key={n._id}
              style={{
                background: "linear-gradient(to right, #ffffff 0%, #f8fafc 100%)",
                borderRadius: "16px",
                padding: "20px",
                border: "1.5px solid #e0e7ff",
                borderLeft: "4px solid #2563eb",
                boxShadow: "0 2px 8px rgba(30, 64, 175, 0.06)",
                transition: "all 0.3s ease",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#bfdbfe";
                e.currentTarget.style.borderLeftColor = "#1e40af";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(30, 64, 175, 0.12)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e0e7ff";
                e.currentTarget.style.borderLeftColor = "#2563eb";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(30, 64, 175, 0.06)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>📢</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong
                    style={{
                      color: "#1e3a8a",
                      fontSize: "16px",
                      fontWeight: "600",
                      display: "block",
                      marginBottom: "6px",
                      lineHeight: "1.4",
                    }}
                  >
                    {n.title}
                  </strong>
                  <p
                    style={{
                      color: "#475569",
                      fontSize: "14px",
                      lineHeight: "1.6",
                      marginBottom: "12px",
                    }}
                  >
                    {n.content}
                  </p>
                </div>
              </div>

              {/* 🖼️ Hiển thị ảnh nếu có */}
              {n.image && (
                <div
                  style={{
                    marginTop: "12px",
                    marginBottom: "12px",
                    borderRadius: "12px",
                    overflow: "hidden",
                    border: "1.5px solid #e0e7ff",
                    display: "inline-block",
                    maxWidth: "100%",
                  }}
                >
                  <img
                    src={n.image}
                    alt="notification"
                    style={{
                      maxWidth: "300px",
                      width: "auto",
                      height: "auto",
                      display: "block",
                      maxHeight: "250px",
                      objectFit: "cover",
                    }}
                  />
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "12px",
                  paddingTop: "12px",
                  borderTop: "1px solid #e0e7ff",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span style={{ fontSize: "14px" }}>👤</span>
                  {n.sender}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    fontWeight: "400",
                  }}
                >
                  •
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    fontWeight: "500",
                  }}
                >
                  {new Date(n.createdAt).toLocaleString("vi-VN", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
