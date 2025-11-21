import React, { useEffect, useState } from "react";
import {
  collection,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { Check, X, Trash2, Shield, User, Search } from "lucide-react";

interface UserData {
  id: string;
  email: string;
  name?: string;
  role: "admin" | "partner" | "user";
  status?: "approved" | "pending" | "rejected";
  photoURL?: string;
  createdAt?: any;
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<"all" | "admin" | "partner" | "user">("all");
  const [searchTerm, setSearchTerm] = useState("");

  // 🧩 Lấy danh sách người dùng từ Firestore
  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("email"));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: UserData[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setUsers(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ✅ Gửi email thông báo (gọi backend Node.js)
  const sendEmailNotification = async (email: string, status: string) => {
    try {
      const res = await fetch("http://localhost:5002/api/send-approval-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, status }),
      });

      if (!res.ok) throw new Error(await res.text());
      console.log(`📧 Email ${status} đã gửi đến ${email}`);
    } catch (error) {
      console.error("❌ Lỗi gửi email:", error);
      alert("⚠️ Gửi email thất bại. Vui lòng kiểm tra server backend.");
    }
  };

  // ✅ Duyệt đối tác
  const approveUser = async (id: string, email: string) => {
    try {
      await updateDoc(doc(db, "users", id), { status: "approved" });
      await sendEmailNotification(email, "approved");
      alert("✅ Đã duyệt đối tác và gửi email thông báo!");
    } catch (error) {
      console.error("❌ Lỗi duyệt đối tác:", error);
      alert("Có lỗi xảy ra khi duyệt đối tác.");
    }
  };

  // ❌ Từ chối đối tác
  const rejectUser = async (id: string, email: string) => {
    try {
      await updateDoc(doc(db, "users", id), { status: "rejected" });
      await sendEmailNotification(email, "rejected");
      alert("❌ Đã từ chối đối tác và gửi email thông báo!");
    } catch (error) {
      console.error("❌ Lỗi từ chối đối tác:", error);
      alert("Có lỗi xảy ra khi từ chối đối tác.");
    }
  };

  // 🗑️ Xóa tài khoản
  const deleteUser = async (id: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa tài khoản này?")) return;
    try {
      await deleteDoc(doc(db, "users", id));
      alert("🗑️ Đã xóa tài khoản thành công!");
    } catch (error) {
      console.error("❌ Lỗi xóa tài khoản:", error);
      alert("Không thể xóa tài khoản. Vui lòng thử lại.");
    }
  };

  // 🧮 Lọc và tìm kiếm người dùng
  const filteredUsers = users.filter((u) => {
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchSearch =
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchRole && matchSearch;
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f9fafb",
        padding: "40px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <h2
        style={{
          fontSize: "28px",
          fontWeight: 700,
          color: "#1e3a8a",
          marginBottom: "20px",
        }}
      >
        👥 Quản lý người dùng & đối tác
      </h2>

      {/* Bộ lọc và tìm kiếm */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "24px",
          alignItems: "center",
        }}
      >
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as any)}
          style={{
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            background: "white",
            fontWeight: 500,
          }}
        >
          <option value="all">Tất cả</option>
          <option value="admin">Admin</option>
          <option value="partner">Đối tác</option>
          <option value="user">Người dùng</option>
        </select>

        <div style={{ position: "relative", flex: 1 }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9ca3af",
            }}
          />
          <input
            type="text"
            placeholder="Tìm kiếm theo email hoặc tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 10px 10px 34px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
            }}
          />
        </div>
      </div>

      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : (
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            padding: "24px",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            }}
          >
            <thead>
              <tr style={{ background: "#f1f5f9", color: "#1e293b" }}>
                <th style={{ padding: "12px" }}>Ảnh</th>
                <th>Email</th>
                <th>Tên</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "10px" }}>
                    <img
                      src={
                        u.photoURL ||
                        "https://cdn-icons-png.flaticon.com/512/847/847969.png"
                      }
                      alt="avatar"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  </td>
                  <td style={{ padding: "10px" }}>{u.email}</td>
                  <td style={{ padding: "10px" }}>{u.name || "(Chưa có)"}</td>
                  <td style={{ padding: "10px" }}>
                    {u.role === "admin" && (
                      <span style={{ color: "#dc2626", fontWeight: 600 }}>
                        <Shield size={16} style={{ marginRight: 6 }} />
                        Admin
                      </span>
                    )}
                    {u.role === "partner" && (
                      <span style={{ color: "#2563eb", fontWeight: 600 }}>
                        <User size={16} style={{ marginRight: 6 }} />
                        Đối tác
                      </span>
                    )}
                    {u.role === "user" && (
                      <span style={{ color: "#16a34a", fontWeight: 600 }}>
                        Người dùng
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "10px" }}>
                    {u.role === "partner" ? (
                      <span
                        style={{
                          padding: "6px 10px",
                          borderRadius: "8px",
                          fontWeight: 600,
                          background:
                            u.status === "approved"
                              ? "#dcfce7"
                              : u.status === "rejected"
                              ? "#fee2e2"
                              : "#fef9c3",
                          color:
                            u.status === "approved"
                              ? "#166534"
                              : u.status === "rejected"
                              ? "#991b1b"
                              : "#854d0e",
                        }}
                      >
                        {u.status === "approved"
                          ? "Đã duyệt"
                          : u.status === "rejected"
                          ? "Bị từ chối"
                          : "Đang chờ duyệt"}
                      </span>
                    ) : (
                      <span
                        style={{
                          padding: "6px 10px",
                          borderRadius: "8px",
                          background: "#e0f2fe",
                          color: "#075985",
                          fontWeight: 600,
                        }}
                      >
                        Hợp lệ
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "10px" }}>
                    {u.role === "partner" && u.status === "pending" && (
                      <>
                        <button
                          onClick={() => approveUser(u.id, u.email)}
                          style={{
                            background: "#22c55e",
                            border: "none",
                            color: "white",
                            padding: "6px 10px",
                            borderRadius: "8px",
                            marginRight: "8px",
                            cursor: "pointer",
                          }}
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => rejectUser(u.id, u.email)}
                          style={{
                            background: "#ef4444",
                            border: "none",
                            color: "white",
                            padding: "6px 10px",
                            borderRadius: "8px",
                            cursor: "pointer",
                          }}
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}

                    {u.role !== "admin" && (
                      <button
                        onClick={() => deleteUser(u.id)}
                        style={{
                          background: "#f87171",
                          border: "none",
                          color: "white",
                          padding: "6px 10px",
                          borderRadius: "8px",
                          marginLeft: "8px",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <p style={{ textAlign: "center", marginTop: 20 }}>
              Không có người dùng nào phù hợp.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
