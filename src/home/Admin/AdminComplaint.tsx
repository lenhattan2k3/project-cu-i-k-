import React, { useEffect, useState } from "react";
import AdminNotifications from "./AdminNotifications";
import AdminMessages from "./AdminMessages";
import {
  getComplaintsByRole,
  sendComplaint,
  replyComplaint,
} from "../../api/complaintsApi";
import { socket } from "../../utils/socket";

type ComplaintTab = "complaints" | "notifications" | "messages";

interface Complaint {
  _id: string;
  senderId: string;
  senderRole: "admin" | "partner" | "user";
  receiverRole: "admin" | "partner" | "user";
  message: string;
  createdAt: string;
  responses?: Array<{
    senderId: string;
    senderRole: string;
    message: string;
    createdAt: string;
  }>;
}

export default function AdminComplaint() {
  const [activeTab, setActiveTab] = useState<ComplaintTab>("complaints");
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sendMessage, setSendMessage] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const [replyMap, setReplyMap] = useState<Record<string, string>>({});
  const [replyLoadingMap, setReplyLoadingMap] = useState<Record<string, boolean>>({});

  const fetchComplaints = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getComplaintsByRole("admin");
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Không thể tải khiếu nại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    const handleNewComplaint = (incoming: Complaint) => {
      setComplaints((prev) => {
        if (prev.some((item) => item._id === incoming._id)) return prev;
        return [incoming, ...prev];
      });
    };

    const handleUpdatedComplaint = (updated: Complaint) => {
      setComplaints((prev) =>
        prev.map((item) => (item._id === updated._id ? updated : item))
      );
    };

    socket.on("complaint:new", handleNewComplaint);
    socket.on("complaint:updated", handleUpdatedComplaint);

    return () => {
      socket.off("complaint:new", handleNewComplaint);
      socket.off("complaint:updated", handleUpdatedComplaint);
    };
  }, []);

  const handleSendComplaint = async () => {
    if (!sendMessage.trim()) {
      alert("Vui lòng nhập nội dung khiếu nại!");
      return;
    }
    setSendLoading(true);
    try {
      await sendComplaint({
        senderId: "admin",
        senderRole: "admin",
        receiverRole: "partner",
        message: sendMessage,
      });
      setSendMessage("");
      fetchComplaints();
    } catch (err) {
      console.error(err);
      alert("Không thể gửi khiếu nại!");
    } finally {
      setSendLoading(false);
    }
  };

  const handleReply = async (complaintId: string) => {
    const text = (replyMap[complaintId] || "").trim();
    if (!text) {
      alert("Vui lòng nhập nội dung phản hồi!");
      return;
    }
    setReplyLoadingMap((prev) => ({ ...prev, [complaintId]: true }));
    try {
      await replyComplaint(complaintId, {
        senderId: "admin",
        senderRole: "admin",
        message: text,
      });
      setReplyMap((prev) => ({ ...prev, [complaintId]: "" }));
      fetchComplaints();
    } catch (err) {
      console.error(err);
      alert("Không thể gửi phản hồi!");
    } finally {
      setReplyLoadingMap((prev) => ({ ...prev, [complaintId]: false }));
    }
  };

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
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div>
            <h3 style={{ marginBottom: "12px" }}>📨 Gửi thông báo khiếu nại</h3>
            <textarea
              value={sendMessage}
              onChange={(e) => setSendMessage(e.target.value)}
              placeholder="Nhập nội dung khiếu nại..."
              rows={3}
              style={{
                width: "100%",
                minWidth: "280px",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #cbd5f5",
                resize: "vertical",
              }}
            />
            <button
              onClick={handleSendComplaint}
              disabled={sendLoading}
              style={{
                marginTop: "12px",
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                background: sendLoading ? "#9ca3af" : "#2563eb",
                color: "white",
                fontWeight: 600,
                cursor: sendLoading ? "not-allowed" : "pointer",
              }}
            >
              {sendLoading ? "Đang gửi..." : "Gửi khiếu nại"}
            </button>
          </div>

          <div>
            <h3 style={{ marginBottom: "12px" }}>📋 Danh sách khiếu nại gửi đến Admin</h3>
            {error && (
              <p style={{ color: "#dc2626", marginBottom: "12px" }}>{error}</p>
            )}
            {loading ? (
              <p>Đang tải...</p>
            ) : complaints.length === 0 ? (
              <p style={{ color: "#6b7280" }}>Chưa có khiếu nại nào.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {complaints.map((complaint) => (
                  <div
                    key={complaint._id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      padding: "16px",
                      background: "#f9fafb",
                    }}
                  >
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Người gửi:</strong> {complaint.senderRole} ({complaint.senderId || "N/A"})
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Nội dung:</strong> {complaint.message}
                    </div>
                    <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "12px" }}>
                      {new Date(complaint.createdAt).toLocaleString("vi-VN")}
                    </div>

                    {!!complaint.responses?.length && (
                      <div
                        style={{
                          background: "#fff",
                          borderRadius: "8px",
                          padding: "10px",
                          border: "1px solid #e5e7eb",
                          marginBottom: "12px",
                        }}
                      >
                        <strong>Phản hồi:</strong>
                        <ul style={{ margin: "8px 0 0", paddingLeft: "18px" }}>
                          {complaint.responses?.map((res, idx) => (
                            <li key={`${complaint._id}-res-${idx}`} style={{ marginBottom: "4px" }}>
                              <span style={{ fontWeight: 600 }}>{res.senderRole}:</span> {res.message}
                              <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                                {new Date(res.createdAt).toLocaleString("vi-VN")}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <textarea
                      rows={3}
                      placeholder="Nhập phản hồi..."
                      value={replyMap[complaint._id] || ""}
                      onChange={(e) =>
                        setReplyMap((prev) => ({ ...prev, [complaint._id]: e.target.value }))
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5f5",
                        resize: "vertical",
                        marginBottom: "8px",
                      }}
                    />
                    <button
                      onClick={() => handleReply(complaint._id)}
                      disabled={replyLoadingMap[complaint._id]}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: "none",
                        background: replyLoadingMap[complaint._id] ? "#9ca3af" : "#16a34a",
                        color: "white",
                        cursor: replyLoadingMap[complaint._id] ? "not-allowed" : "pointer",
                        fontWeight: 600,
                      }}
                    >
                      {replyLoadingMap[complaint._id] ? "Đang gửi..." : "Phản hồi"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "notifications" && <AdminNotifications />}
      {activeTab === "messages" && <AdminMessages />}
    </div>
  );
}
