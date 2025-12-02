import React, { useState, useEffect } from "react";
import { getNotificationsByRole } from "../../api/notificationsApi";
import { Trash2, Send, Image as ImageIcon } from "lucide-react";

interface Notification {
  _id: string;
  title: string;
  content: string;
  image?: string;
  createdAt: string;
  senderRole?: string;
}

type ReceiverScope = "all" | "partners" | "partner";

const PARTNER_DIRECTORY: Array<{ id: string; name: string }> = [
  { id: "yft1Ag1eaRf3uCigXyCJLpmu9R42", name: "Phúc Yên" },
  { id: "SFbbzut0USTG5F6ZM3COrLXKGS93", name: "Cúc Tư" },
  { id: "BuPwvEMgfCNEDbz2VNKx5hnpBT52", name: "Hồng Sơn" },
  { id: "U5XWQ12kL8VnyQ0ovZTvUZLdJov1", name: "Nhật Tân" },
];

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [receiverScope, setReceiverScope] = useState<ReceiverScope>("all");
  const [targetPartnerId, setTargetPartnerId] = useState("");

  // 🟢 Lấy danh sách thông báo
  const fetchNotifications = async () => {
    try {
      const data = await getNotificationsByRole("admin");
      setNotifications(data);
    } catch (error) {
      console.error("Lỗi tải thông báo:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (receiverScope !== "partner") {
      setTargetPartnerId("");
    }
  }, [receiverScope]);

  // 🟢 Gửi thông báo
  const handleSendNotification = async () => {
    if (!title || !content) {
      alert("⚠️ Vui lòng nhập tiêu đề và nội dung!");
      return;
    }

    if (receiverScope === "partner" && !targetPartnerId.trim()) {
      alert("⚠️ Vui lòng nhập Partner ID cụ thể!");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("sender", "admin");
      formData.append("receiverScope", receiverScope);

      if (receiverScope === "partner") {
        const partnerId = targetPartnerId.trim();
        formData.append("partnerId", partnerId);
        formData.append("receivers", `partner:${partnerId}`);
      } else if (receiverScope === "partners") {
        formData.append("receivers", "partners");
      } else {
        formData.append("receivers", "all");
      }
      if (image) formData.append("image", image);

      const res = await fetch("http://localhost:5000/api/notifications", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Gửi thông báo thất bại");
      alert("✅ Gửi thông báo thành công!");

      setTitle("");
      setContent("");
      setImage(null);
      setImagePreview("");
      setReceiverScope("all");
      fetchNotifications();
    } catch (error) {
      console.error("❌ Lỗi gửi thông báo:", error);
      alert("❌ Không thể gửi thông báo!");
    }
  };

  // 🟢 Xử lý chọn ảnh
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  // 🟠 Xóa thông báo
  const handleDeleteNotification = async (id: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa thông báo này không?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/notifications/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Xóa thất bại");
      alert("🗑️ Đã xóa thông báo!");

      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (error) {
      console.error("❌ Lỗi khi xóa:", error);
      alert("❌ Không thể xóa thông báo!");
    }
  };

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
        }}
      >
        📢 Quản lý thông báo
      </h2>

      {/* Form gửi thông báo */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 4px 20px rgba(30, 64, 175, 0.08)",
          marginBottom: "24px",
          border: "1px solid #e0e7ff",
        }}
      >
        <h3
          style={{
            marginBottom: "20px",
            color: "#1e3a8a",
            fontSize: "20px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "24px" }}>📝</span> Gửi thông báo mới
        </h3>

        <input
          type="text"
          placeholder="Nhập tiêu đề thông báo..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px",
            marginBottom: "12px",
            borderRadius: "10px",
            border: "1.5px solid #dbeafe",
            fontSize: "14px",
            color: "#1e293b",
            backgroundColor: "#f8fafc",
            transition: "all 0.2s ease",
            outline: "none",
            boxSizing: "border-box",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#3b82f6";
            e.target.style.backgroundColor = "#ffffff";
            e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#dbeafe";
            e.target.style.backgroundColor = "#f8fafc";
            e.target.style.boxShadow = "none";
          }}
        />

        <textarea
          placeholder="Nhập nội dung thông báo..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            width: "100%",
            height: "100px",
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1.5px solid #dbeafe",
            fontSize: "14px",
            color: "#1e293b",
            backgroundColor: "#f8fafc",
            resize: "none",
            marginBottom: "12px",
            transition: "all 0.2s ease",
            outline: "none",
            boxSizing: "border-box",
            fontFamily: "inherit",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#3b82f6";
            e.target.style.backgroundColor = "#ffffff";
            e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#dbeafe";
            e.target.style.backgroundColor = "#f8fafc";
            e.target.style.boxShadow = "none";
          }}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: receiverScope === "partner" ? "1fr 1.5fr" : "1fr",
            gap: "12px",
            marginBottom: "12px",
            alignItems: "stretch",
          }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", color: "#1e3a8a" }}>
            Đối tượng nhận
            <select
              value={receiverScope}
              onChange={(e) => setReceiverScope(e.target.value as ReceiverScope)}
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1.5px solid #dbeafe",
                fontSize: "14px",
                backgroundColor: "#f8fafc",
                color: "#1e293b",
              }}
            >
              <option value="all">Toàn bộ hệ thống</option>
              <option value="partners">Toàn bộ partner</option>
              <option value="partner">Partner cụ thể</option>
            </select>
          </label>

          {receiverScope === "partner" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", color: "#1e3a8a" }}>
                Chọn partner trong hệ thống
                <select
                  value={PARTNER_DIRECTORY.some((p) => p.id === targetPartnerId) ? targetPartnerId : ""}
                  onChange={(e) => setTargetPartnerId(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1.5px solid #dbeafe",
                    fontSize: "14px",
                    backgroundColor: "#f8fafc",
                    color: "#1e293b",
                  }}
                >
                  <option value="">-- Chọn một partner --</option>
                  {PARTNER_DIRECTORY.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name} — {partner.id}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", color: "#1e3a8a" }}>
                Hoặc nhập Partner ID thủ công
                <input
                  type="text"
                  placeholder="Nhập partnerId..."
                  value={targetPartnerId}
                  onChange={(e) => setTargetPartnerId(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1.5px solid #dbeafe",
                    fontSize: "14px",
                    backgroundColor: "#f8fafc",
                    color: "#1e293b",
                  }}
                />
                <span style={{ fontSize: "12px", color: "#475569" }}>
                  Danh sách đang có {PARTNER_DIRECTORY.length} partner được khai báo.
                </span>
              </label>
            </div>
          )}
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label
            htmlFor="imageUpload"
            style={{
              display: "inline-flex",
              alignItems: "center",
              cursor: "pointer",
              color: "#2563eb",
              gap: "6px",
              fontSize: "14px",
              fontWeight: "500",
              padding: "8px 14px",
              borderRadius: "8px",
              backgroundColor: "#eff6ff",
              border: "1.5px solid #dbeafe",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#dbeafe";
              e.currentTarget.style.borderColor = "#3b82f6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#eff6ff";
              e.currentTarget.style.borderColor = "#dbeafe";
            }}
          >
            <ImageIcon size={16} />
            Chọn ảnh
          </label>
          <input
            id="imageUpload"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImageChange}
          />
        </div>

        {imagePreview && (
          <div
            style={{
              marginBottom: "16px",
              borderRadius: "12px",
              overflow: "hidden",
              border: "2px solid #dbeafe",
              display: "inline-block",
            }}
          >
            <img
              src={imagePreview}
              alt="Xem trước ảnh"
              style={{
                width: "180px",
                height: "auto",
                display: "block",
                maxHeight: "200px",
                objectFit: "cover",
              }}
            />
          </div>
        )}

        <button
          onClick={handleSendNotification}
          style={{
            padding: "10px 20px",
            background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: "600",
            transition: "all 0.2s ease",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(37, 99, 235, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.3)";
          }}
        >
          <Send size={16} /> Gửi thông báo
        </button>
      </div>

      {/* 🟢 Lịch sử thông báo */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 4px 20px rgba(30, 64, 175, 0.08)",
          border: "1px solid #e0e7ff",
        }}
      >
        <h3
          style={{
            marginBottom: "20px",
            color: "#1e3a8a",
            fontSize: "20px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "24px" }}>📜</span> Lịch sử thông báo
        </h3>

        {notifications.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "#94a3b8",
              fontSize: "14px",
            }}
          >
            Chưa có thông báo nào!
          </div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {notifications.map((n) => (
              <li
                key={n._id}
                style={{
                  marginBottom: "12px",
                  padding: "16px",
                  border: "1.5px solid #e0e7ff",
                  borderRadius: "12px",
                  background: "linear-gradient(to right, #ffffff 0%, #f8fafc 100%)",
                  position: "relative",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#bfdbfe";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(30, 64, 175, 0.1)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e0e7ff";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <button
                  onClick={() => handleDeleteNotification(n._id)}
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    background: "transparent",
                    border: "none",
                    color: "#ef4444",
                    cursor: "pointer",
                    padding: "6px",
                    borderRadius: "6px",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Xóa thông báo"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#fee2e2";
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <Trash2 size={16} />
                </button>

                <b
                  style={{
                    color: "#1e3a8a",
                    fontSize: "15px",
                    fontWeight: "600",
                    display: "block",
                    marginBottom: "6px",
                    paddingRight: "32px",
                  }}
                >
                  {n.title}
                </b>
                <p
                  style={{
                    marginTop: "4px",
                    marginBottom: "10px",
                    color: "#475569",
                    fontSize: "14px",
                    lineHeight: "1.5",
                  }}
                >
                  {n.content}
                </p>

                {n.image && (
                  <div
                    style={{
                      marginTop: "10px",
                      marginBottom: "10px",
                      borderRadius: "10px",
                      overflow: "hidden",
                      border: "1.5px solid #e0e7ff",
                      display: "inline-block",
                    }}
                  >
                    <img
                      src={n.image}
                      alt="Thông báo"
                      style={{
                        width: "150px",
                        height: "auto",
                        display: "block",
                        maxHeight: "150px",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                )}

                <p
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    marginTop: "8px",
                    marginBottom: 0,
                    fontWeight: "500",
                  }}
                >
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
