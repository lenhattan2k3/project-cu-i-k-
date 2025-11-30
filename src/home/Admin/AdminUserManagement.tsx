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
import {
  Check,
  X,
  Trash2,
  Shield,
  User,
  Search,
  Briefcase,
  Mail,
  Users,
  Clock,
  UserCheck,
  Filter,
  AlertCircle
} from "lucide-react";

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
  
  // --- STATE BỘ LỌC ---
  const [filterRole, setFilterRole] = useState<"all" | "admin" | "partner" | "user">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [searchTerm, setSearchTerm] = useState("");

  // 🧩 Lấy danh sách người dùng
  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("email"));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: UserData[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setUsers(list);
      setTimeout(() => setLoading(false), 800);
    });
    return () => unsub();
  }, []);

  // --- LOGIC HANDLERS ---
  const sendEmailNotification = async (email: string, status: string) => {
    try {
      await fetch("http://localhost:5002/api/send-approval-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, status }),
      });
    } catch (error) {
      console.error("Lỗi gửi email backend");
    }
  };

  const handleAction = async (action: 'approve' | 'reject' | 'delete', id: string, email?: string) => {
    if (action === 'delete' && !window.confirm("⚠️ Hành động này không thể hoàn tác. Xóa user?")) return;
    
    try {
      if (action === 'delete') {
        await deleteDoc(doc(db, "users", id));
      } else {
        const status = action === 'approve' ? 'approved' : 'rejected';
        await updateDoc(doc(db, "users", id), { status });
        if (email) sendEmailNotification(email, status);
      }
    } catch (error) {
      alert(`Thao tác ${action} thất bại.`);
    }
  };

  // 🧮 LOGIC LỌC KÉP (ROLE + STATUS + SEARCH)
  const filteredUsers = users.filter((u) => {
    // 1. Lọc theo vai trò
    const matchRole = filterRole === "all" || u.role === filterRole;
    
    // 2. Lọc theo trạng thái (QUAN TRỌNG)
    // Nếu user không có status (ví dụ role user/admin thường ko có), ta coi như status họ là 'approved' hoặc bỏ qua tùy logic. 
    // Ở đây ta lọc chính xác giá trị status.
    const matchStatus = filterStatus === "all" || u.status === filterStatus;

    // 3. Tìm kiếm
    const matchSearch =
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchRole && matchStatus && matchSearch;
  });

  // --- STYLES ---
  const styles = {
    wrapper: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      padding: "40px",
      fontFamily: "'Inter', sans-serif",
      position: "relative" as const,
      overflow: "hidden",
    },
    glassCard: {
      background: "rgba(255, 255, 255, 0.85)",
      backdropFilter: "blur(20px)",
      borderRadius: "24px",
      border: "1px solid rgba(255, 255, 255, 0.6)",
      boxShadow: "0 8px 32px rgba(31, 38, 135, 0.07)",
      overflow: "hidden",
    },
    headerTitle: {
      fontSize: "32px",
      fontWeight: "800",
      background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      marginBottom: "8px",
    },
    statCard: (color: string) => ({
      background: "white",
      borderRadius: "20px",
      padding: "24px",
      boxShadow: "0 10px 20px rgba(0,0,0,0.03)",
      display: "flex",
      alignItems: "center",
      gap: "16px",
      borderBottom: `4px solid ${color}`,
      transition: "transform 0.3s",
      cursor: "default",
    }),
    iconBox: (bg: string, color: string) => ({
      width: "50px", height: "50px", borderRadius: "14px", background: bg, color: color, display: "flex", alignItems: "center", justifyContent: "center"
    }),
    tableHeader: {
      background: "rgba(241, 245, 249, 0.8)",
      textTransform: "uppercase" as const,
      fontSize: "12px",
      fontWeight: "700",
      color: "#64748b",
      padding: "18px 24px",
      textAlign: "left" as const,
      letterSpacing: "0.5px",
    },
    tableRow: {
      borderBottom: "1px solid #f1f5f9",
      transition: "all 0.2s ease",
      cursor: "default",
    },
    filterBtn: (active: boolean, type: 'role' | 'status') => ({
      padding: "8px 16px", borderRadius: "10px", border: active ? "1px solid transparent" : "1px solid #e2e8f0", 
      fontSize: "13px", fontWeight: 600, cursor: "pointer", textTransform: "capitalize" as const,
      background: active ? (type === 'role' ? "#1e293b" : "#fff") : "transparent",
      color: active ? (type === 'role' ? "#fff" : "#1e293b") : "#64748b",
      boxShadow: active ? "0 4px 6px rgba(0,0,0,0.05)" : "none",
      transition: "all 0.3s",
      display: 'flex', alignItems: 'center', gap: '6px'
    }),
    actionBtn: (type: 'approve' | 'reject' | 'delete') => {
      const colors = {
        approve: { bg: "#22c55e", shadow: "rgba(34, 197, 94, 0.3)" },
        reject: { bg: "#ef4444", shadow: "rgba(239, 68, 68, 0.3)" },
        delete: { bg: "#cbd5e1", shadow: "rgba(148, 163, 184, 0.3)" },
      };
      return {
        background: colors[type].bg, color: "white", border: "none", width: "32px", height: "32px", borderRadius: "10px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 4px 10px ${colors[type].shadow}`,
        transition: "transform 0.2s",
      };
    }
  };

  return (
    <div style={styles.wrapper}>
      <style>{`
        .hover-lift:hover { transform: translateY(-5px); }
        .row-hover:hover { background: rgba(248, 250, 252, 0.8) !important; transform: scale(1.005); box-shadow: 0 4px 15px rgba(0,0,0,0.03); z-index: 10; position: relative; border-radius: 12px; border-bottom: none; }
        .btn-scale:hover { transform: scale(1.15) !important; }
        .skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 6px; height: 20px; width: 100%; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeIn 0.4s ease-out forwards; }
        input:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
      `}</style>

      <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "40vw", height: "40vw", background: "#bfdbfe", filter: "blur(120px)", opacity: 0.6, borderRadius: "50%", zIndex: 0 }} />
      <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "35vw", height: "35vw", background: "#ddd6fe", filter: "blur(120px)", opacity: 0.6, borderRadius: "50%", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1400px", margin: "0 auto" }}>
        
        {/* HEADER & STATS */}
        <div style={{ marginBottom: "30px" }}>
          <h1 style={styles.headerTitle}>Trung Tâm Quản Trị</h1>
          <p style={{ color: "#64748b", fontSize: "16px" }}>Tổng quan hệ thống và quản lý thành viên</p>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px", marginTop: "30px" }}>
            <div style={styles.statCard("#3b82f6")} className="hover-lift">
              <div style={styles.iconBox("#eff6ff", "#3b82f6")}><Users size={24}/></div>
              <div><p style={{margin:0, color:"#64748b", fontSize:"13px"}}>Tổng người dùng</p><h3 style={{margin:"4px 0 0", fontSize:"24px", color:"#1e293b"}}>{users.length}</h3></div>
            </div>
            {/* Thẻ thống kê CHỜ DUYỆT nổi bật */}
            <div style={styles.statCard("#eab308")} className="hover-lift" onClick={() => { setFilterStatus('pending'); setFilterRole('partner'); }}>
              <div style={styles.iconBox("#fefce8", "#ca8a04")}><Clock size={24}/></div>
              <div><p style={{margin:0, color:"#64748b", fontSize:"13px"}}>Yêu cầu chờ duyệt</p><h3 style={{margin:"4px 0 0", fontSize:"24px", color:"#1e293b"}}>{users.filter(u=>u.role==='partner' && u.status==='pending').length}</h3></div>
            </div>
            <div style={styles.statCard("#22c55e")} className="hover-lift">
              <div style={styles.iconBox("#f0fdf4", "#16a34a")}><UserCheck size={24}/></div>
              <div><p style={{margin:0, color:"#64748b", fontSize:"13px"}}>Đối tác hoạt động</p><h3 style={{margin:"4px 0 0", fontSize:"24px", color:"#1e293b"}}>{users.filter(u=>u.role==='partner' && u.status==='approved').length}</h3></div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={styles.glassCard}>
          
          {/* TOOLBAR NÂNG CAO */}
          <div style={{ padding: "24px", borderBottom: "1px solid rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Hàng 1: Search & Main Filter */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
               {/* Search */}
               <div style={{ position: "relative", width: "350px", maxWidth: "100%" }}>
                <Search size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input
                  placeholder="Tìm kiếm theo tên, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%", padding: "12px 12px 12px 48px", borderRadius: "12px", border: "2px solid #f1f5f9", outline: "none", fontSize: "14px", color: "#334155", background: "white", transition: "all 0.2s"
                  }}
                />
              </div>

              {/* Role Filter */}
              <div style={{ display: "flex", gap: "8px", background: "#f1f5f9", padding: "5px", borderRadius: "12px" }}>
                {["all", "admin", "partner", "user"].map(role => (
                  <button
                    key={role}
                    onClick={() => setFilterRole(role as any)}
                    style={styles.filterBtn(filterRole === role, 'role')}
                  >
                    {role === 'all' ? 'Tất cả' : role}
                  </button>
                ))}
              </div>
            </div>

            {/* Hàng 2: STATUS FILTER (Mới thêm) */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0 0 0", borderTop: "1px dashed #e2e8f0" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                <Filter size={14}/> Trạng thái:
              </span>
              {/* Status Buttons */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setFilterStatus('all')} style={{...styles.filterBtn(filterStatus === 'all', 'status'), border: filterStatus === 'all' ? "1px solid #94a3b8" : "1px solid #f1f5f9"}}>Tất cả</button>
                
                <button onClick={() => setFilterStatus('pending')} style={{...styles.filterBtn(filterStatus === 'pending', 'status'), background: filterStatus === 'pending' ? "#fef9c3" : "transparent", color: filterStatus === 'pending' ? "#854d0e" : "#64748b", borderColor: filterStatus === 'pending' ? "#fde047" : "#f1f5f9"}}>
                  ⏳ Chờ duyệt
                </button>
                
                <button onClick={() => setFilterStatus('approved')} style={{...styles.filterBtn(filterStatus === 'approved', 'status'), background: filterStatus === 'approved' ? "#dcfce7" : "transparent", color: filterStatus === 'approved' ? "#166534" : "#64748b", borderColor: filterStatus === 'approved' ? "#86efac" : "#f1f5f9"}}>
                  ✅ Đã duyệt
                </button>
                
                <button onClick={() => setFilterStatus('rejected')} style={{...styles.filterBtn(filterStatus === 'rejected', 'status'), background: filterStatus === 'rejected' ? "#fee2e2" : "transparent", color: filterStatus === 'rejected' ? "#991b1b" : "#64748b", borderColor: filterStatus === 'rejected' ? "#fca5a5" : "#f1f5f9"}}>
                  ❌ Từ chối
                </button>
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0" }}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Thông tin thành viên</th>
                  <th style={styles.tableHeader}>Vai trò</th>
                  <th style={styles.tableHeader}>Trạng thái</th>
                  <th style={{ ...styles.tableHeader, textAlign: "right" }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td style={{ padding: "20px" }} colSpan={4}><div className="skeleton" /></td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
                      <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }}>🔍</div>
                      Không tìm thấy kết quả phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, index) => (
                    <tr key={u.id} style={{...styles.tableRow, animationDelay: `${index * 0.05}s`}} className="row-hover animate-in">
                      {/* Info */}
                      <td style={{ padding: "20px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <div style={{ position: "relative" }}>
                            <img
                              src={u.photoURL || `https://ui-avatars.com/api/?name=${u.name || u.email}&background=random&color=fff`}
                              alt="avatar"
                              style={{ width: "48px", height: "48px", borderRadius: "14px", objectFit: "cover", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}
                            />
                            {/* Chấm tròn trạng thái nhỏ ở avatar */}
                            {u.role === 'partner' && (
                              <div style={{
                                position:'absolute', bottom:-2, right:-2, 
                                width:'14px', height:'14px', border:'2px solid white', borderRadius:'50%',
                                background: u.status === 'approved' ? '#22c55e' : u.status === 'rejected' ? '#ef4444' : '#eab308'
                              }}/>
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", marginBottom: "2px" }}>{u.name || "Chưa cập nhật tên"}</div>
                            <div style={{ fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                              <Mail size={12} /> {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: "20px 24px" }}>
                        {(() => {
                          const config: any = {
                            admin: { bg: "#fee2e2", color: "#991b1b", icon: <Shield size={14}/>, label: "Admin" },
                            partner: { bg: "#dbeafe", color: "#1e40af", icon: <Briefcase size={14}/>, label: "Đối tác" },
                            user: { bg: "#f3f4f6", color: "#374151", icon: <User size={14}/>, label: "Khách" },
                          };
                          const s = config[u.role] || config.user;
                          return (
                            <span style={{
                              background: s.bg, color: s.color, padding: "8px 14px", borderRadius: "12px", fontSize: "13px", fontWeight: 700,
                              display: "inline-flex", alignItems: "center", gap: "8px"
                            }}>
                              {s.icon} {s.label}
                            </span>
                          );
                        })()}
                      </td>

                      {/* Status (Hiển thị luôn) */}
                      <td style={{ padding: "20px 24px" }}>
                        {u.role === 'partner' ? (
                          (() => {
                             const config: any = {
                                approved: { color: "#166534", bg: "#dcfce7", label: "Đã duyệt", icon: <Check size={14}/> },
                                pending: { color: "#854d0e", bg: "#fef9c3", label: "Chờ duyệt", icon: <Clock size={14}/> },
                                rejected: { color: "#991b1b", bg: "#fee2e2", label: "Từ chối", icon: <AlertCircle size={14}/> },
                             };
                             const s = config[u.status || 'pending'];
                             return (
                               <div style={{ 
                                 display:'inline-flex', alignItems:'center', gap:'8px', 
                                 padding: '8px 12px', borderRadius:'10px',
                                 background: s.bg, color: s.color, fontWeight: 600, fontSize:'13px'
                               }}>
                                 {s.icon} {s.label}
                               </div>
                             )
                          })()
                        ) : (
                          <span style={{ fontSize: "13px", color: "#94a3b8", opacity: 0.7 }}>Hoạt động</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "20px 24px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "10px", justifyContent: "flex-end" }}>
                          {u.role === "partner" && u.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleAction('approve', u.id, u.email)}
                                style={styles.actionBtn('approve')} className="btn-scale" title="Duyệt"
                              >
                                <Check size={18} />
                              </button>
                              <button
                                onClick={() => handleAction('reject', u.id, u.email)}
                                style={styles.actionBtn('reject')} className="btn-scale" title="Từ chối"
                              >
                                <X size={18} />
                              </button>
                            </>
                          )}
                          
                          {u.role !== "admin" && (
                            <button
                              onClick={() => handleAction('delete', u.id)}
                              style={{...styles.actionBtn('delete'), background: "white", color:"#ef4444", border:"1px solid #f1f5f9"}}
                              className="btn-scale" title="Xóa"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div style={{ padding: "20px 24px", background: "#f8fafc", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", color: "#64748b", fontSize: "13px", fontWeight: 500 }}>
            Hiển thị {filteredUsers.length} kết quả
          </div>
        </div>
      </div>
    </div>
  );
}