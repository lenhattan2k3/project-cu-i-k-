import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db, functions } from "../../firebase/config";
import { httpsCallable } from "firebase/functions";

export default function AdminUserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // 🧩 1. Lấy danh sách người dùng
  useEffect(() => {
    const fetchUsers = async () => {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setUsers(list);
    };
    fetchUsers();
  }, []);

  // 🧩 2. Theo dõi thông báo admin realtime
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "adminNotifications"), orderBy("createdAt", "desc")),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setNotifications(list);
      }
    );
    return () => unsub();
  }, []);

  // 🧩 3. Hàm gửi email thông báo duyệt / hủy
  const sendMailToPartner = async (email: string, status: "approved" | "rejected") => {
    try {
      const sendEmail = httpsCallable(functions, "sendApprovalEmail");
      await sendEmail({ email, status });
      console.log("✅ Đã gửi mail đến:", email);
    } catch (error) {
      console.error("❌ Lỗi gửi mail:", error);
    }
  };

  // 🧩 4. Duyệt tài khoản partner
  const handleApprove = async (userId: string, email: string) => {
    await updateDoc(doc(db, "users", userId), { approved: true, status: "approved" });
    alert("✅ Đã duyệt tài khoản nhà xe thành công!");
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, approved: true, status: "approved" } : u
      )
    );
    sendMailToPartner(email, "approved");
  };

  // 🧩 5. Hủy tài khoản partner
  const handleReject = async (userId: string, email: string) => {
    await updateDoc(doc(db, "users", userId), { approved: false, status: "rejected" });
    alert("❌ Đã từ chối tài khoản nhà xe!");
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, approved: false, status: "rejected" } : u
      )
    );
    sendMailToPartner(email, "rejected");
  };

  // 🧩 6. Lọc danh sách theo từ khóa
  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: "30px", fontFamily: "Inter, sans-serif" }}>
      <h2 style={{ fontSize: "26px", fontWeight: "700", marginBottom: "20px" }}>
        👩‍💼 Quản lý người dùng
      </h2>

      {/* 🔍 Thanh tìm kiếm */}
      <input
        type="text"
        placeholder="Tìm kiếm theo email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: "10px",
          border: "1px solid #ccc",
          marginBottom: "20px",
          fontSize: "15px",
        }}
      />

      {/* 🔔 Thông báo */}
      <div
        style={{
          background: "#f1f5f9",
          borderRadius: "10px",
          padding: "15px 20px",
          marginBottom: "25px",
        }}
      >
        <h3 style={{ fontSize: "18px", marginBottom: "10px" }}>🔔 Thông báo mới</h3>
        {notifications.length === 0 ? (
          <p>Không có thông báo mới.</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              style={{
                background: "#fff",
                padding: "10px 14px",
                borderRadius: "8px",
                marginBottom: "10px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
              }}
            >
              <p style={{ margin: 0 }}>{n.message}</p>
              <small style={{ color: "#666" }}>
                {n.email} • {new Date(n.createdAt?.seconds * 1000).toLocaleString()}
              </small>
            </div>
          ))
        )}
      </div>

      {/* 📋 Danh sách người dùng */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "white",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
        }}
      >
        <thead style={{ background: "#3b82f6", color: "white" }}>
          <tr>
            <th style={{ padding: "14px" }}>Email</th>
            <th style={{ padding: "14px" }}>Loại tài khoản</th>
            <th style={{ padding: "14px" }}>Trạng thái</th>
            <th style={{ padding: "14px" }}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((u) => (
            <tr key={u.id} style={{ textAlign: "center" }}>
              <td style={{ padding: "12px" }}>{u.email}</td>
              <td style={{ padding: "12px" }}>
                {u.role === "partner" ? "Đối tác" : "Khách hàng"}
              </td>
              <td style={{ padding: "12px" }}>
                {u.role === "partner" ? (
                  u.status === "approved" ? (
                    <span style={{ color: "green", fontWeight: 600 }}>✅ Đã duyệt</span>
                  ) : u.status === "rejected" ? (
                    <span style={{ color: "red", fontWeight: 600 }}>❌ Đã từ chối</span>
                  ) : (
                    <span style={{ color: "orange", fontWeight: 600 }}>⏳ Chờ duyệt</span>
                  )
                ) : (
                  <span style={{ color: "gray" }}>✔ Tài khoản thường</span>
                )}
              </td>
              <td style={{ padding: "12px" }}>
                {u.role === "partner" && u.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleApprove(u.id, u.email)}
                      style={{
                        background: "#3b82f6",
                        color: "white",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: "none",
                        cursor: "pointer",
                        marginRight: "8px",
                      }}
                    >
                      Duyệt
                    </button>
                    <button
                      onClick={() => handleReject(u.id, u.email)}
                      style={{
                        background: "#ef4444",
                        color: "white",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Hủy
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
