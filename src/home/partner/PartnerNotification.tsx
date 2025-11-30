import { useCallback, useEffect, useState, useRef } from "react";
import { socket } from "../../utils/socket";
import { getNotificationsByRole } from "../../api/notificationsApi";
import { getComplaintsByRole } from "../../api/complaintsApi";
import { auth } from "../../firebase/config";

const API_URL = "http://localhost:5000/api/notifications";
const API_COMPLAINT_URL = "http://localhost:5000/api/complaints";

// --- TYPES ---
interface Notification {
  _id: string;
  title: string;
  content: string;
  sender: string;
  receivers?: string[];
  image?: string;
  createdAt: string;
}

interface Complaint {
  _id: string;
  senderId: string;
  senderRole: string;
  receiverId?: string;
  receiverRole: string;
  message: string;
  image?: string;
  createdAt: string;
  responses?: Array<{
    senderId: string;
    senderRole: string;
    message: string;
    createdAt: string;
  }>;
}

export default function PartnerNotification() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<"notification" | "complaint">("notification");
  const [noti, setNoti] = useState<Notification[]>([]);
  const [partnerId, setPartnerId] = useState<string>("");
  const [partnerName, setPartnerName] = useState<string>("Đối tác");
  
  // Ref để auto scroll xuống cuối chat
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- STATE NOTIFICATION ---
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [notiImageFile, setNotiImageFile] = useState<File | null>(null);
  const [notiImagePreview, setNotiImagePreview] = useState<string>("");
  const [sending, setSending] = useState(false);

  // --- STATE COMPLAINT ---
  const [complaintMessage, setComplaintMessage] = useState("");
  const [complaintImageFile, setComplaintImageFile] = useState<File | null>(null);
  const [complaintImagePreview, setComplaintImagePreview] = useState<string>("");
  const [complaintLoading, setComplaintLoading] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [complaintsError, setComplaintsError] = useState("");

  // --- EFFECTS ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setPartnerId(user?.uid || "");
      setPartnerName(user?.displayName || "Đối tác");
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (notiImageFile) {
      const url = URL.createObjectURL(notiImageFile);
      setNotiImagePreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setNotiImagePreview("");
  }, [notiImageFile]);

  useEffect(() => {
    if (complaintImageFile) {
      const url = URL.createObjectURL(complaintImageFile);
      setComplaintImagePreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setComplaintImagePreview("");
  }, [complaintImageFile]);

  // Auto scroll khi có tin nhắn mới
  useEffect(() => {
    if (activeTab === "complaint" && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [complaints, activeTab]);

  const fetchNotifications = async () => {
    try {
      const data = await getNotificationsByRole("partner");
      setNoti(data.reverse());
    } catch (error) {
      console.error("Lỗi:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    socket.on("receive_notification", (data: Notification) => {
      if (data.receivers && (data.receivers.includes("partner") || data.receivers.includes("all"))) {
        setNoti((prev) => [data, ...prev]);
      }
    });
    return () => {
      socket.off("receive_notification");
    };
  }, []);

  const fetchPartnerComplaints = useCallback(async () => {
    if (!partnerId) return;
    setComplaintsLoading(true);
    setComplaintsError("");
    try {
      const data = await getComplaintsByRole("admin", { senderId: partnerId });
      setComplaints(Array.isArray(data) ? data : []);
    } catch (error) {
      setComplaintsError("Không thể tải lịch sử khiếu nại.");
    } finally {
      setComplaintsLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    fetchPartnerComplaints();
  }, [fetchPartnerComplaints]);

  useEffect(() => {
    if (!partnerId) return;
    const handleNewComplaint = (incoming: Complaint) => {
      if (incoming.senderId !== partnerId) return;
      setComplaints((prev) => (prev.some((item) => item._id === incoming._id) ? prev : [...prev, incoming])); // Append to end for chat feel
    };
    const handleUpdatedComplaint = (updated: Complaint) => {
      if (updated.senderId !== partnerId && updated.receiverId !== partnerId) return;
      setComplaints((prev) => {
        const exists = prev.some((item) => item._id === updated._id);
        if (!exists && updated.senderId === partnerId) return [...prev, updated];
        return prev.map((item) => (item._id === updated._id ? updated : item));
      });
    };
    socket.on("complaint:new", handleNewComplaint);
    socket.on("complaint:updated", handleUpdatedComplaint);
    return () => {
      socket.off("complaint:new", handleNewComplaint);
      socket.off("complaint:updated", handleUpdatedComplaint);
    };
  }, [partnerId]);

  // --- HANDLERS ---
  const handleSendNotification = async () => {
    if (!partnerId) return alert("⚠️ Vui lòng đăng nhập!");
    if (!title.trim() || !content.trim()) return alert("⚠️ Nhập thiếu thông tin!");
    setSending(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("content", content.trim());
      formData.append("sender", partnerName);
      formData.append("partnerId", partnerId);
      formData.append("targetScope", "partner-customers");
      if (notiImageFile) formData.append("image", notiImageFile);

      const response = await fetch(API_URL, { method: "POST", body: formData });
      if (!response.ok) throw new Error("Thất bại");
      
      alert("✨ Đã gửi thông báo thành công!");
      setTitle(""); setContent(""); setNotiImageFile(null);
      fetchNotifications();
    } catch (error) {
      alert("❌ Có lỗi xảy ra khi gửi.");
    } finally {
      setSending(false);
    }
  };

  const handleSendComplaint = async () => {
    if (!partnerId) return alert("⚠️ Vui lòng đăng nhập!");
    if (!complaintMessage.trim()) return alert("⚠️ Nhập nội dung!");
    
    setComplaintLoading(true);
    try {
      const formData = new FormData();
      formData.append("senderId", partnerId);
      formData.append("senderRole", "partner");
      formData.append("receiverRole", "admin");
      formData.append("receiverId", "admin");
      formData.append("message", complaintMessage.trim());
      if (complaintImageFile) formData.append("image", complaintImageFile);

      const response = await fetch(API_COMPLAINT_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Gửi thất bại");

      setComplaintMessage("");
      setComplaintImageFile(null);
      fetchPartnerComplaints();
    } catch (error) {
      console.error(error);
      alert("❌ Gửi khiếu nại thất bại.");
    } finally {
      setComplaintLoading(false);
    }
  };

  // --- STYLES ---
  const styles = {
    wrapper: {
      minHeight: "100vh",
      width: "100%",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)", // Nền sáng sạch hơn
      padding: "30px",
      boxSizing: "border-box" as const,
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    },
    glassContainer: {
      maxWidth: "1400px",
      margin: "0 auto",
      background: "rgba(255, 255, 255, 0.8)",
      backdropFilter: "blur(25px)",
      borderRadius: "24px",
      padding: "30px",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.05)",
      border: "1px solid rgba(255, 255, 255, 0.6)",
      display: "flex",
      flexDirection: "column" as const,
      gap: "24px",
      height: "calc(100vh - 60px)",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: "20px",
      borderBottom: "1px solid rgba(0,0,0,0.06)",
    },
    title: {
      fontSize: "28px",
      fontWeight: "800",
      background: "linear-gradient(to right, #1e3a8a, #3b82f6)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      margin: 0,
      letterSpacing: "-0.5px",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "35% 65%",
      gap: "24px",
      height: "100%",
      overflow: "hidden",
    },
    card: {
      background: "#ffffff",
      borderRadius: "20px",
      padding: "24px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
      border: "1px solid rgba(0,0,0,0.03)",
      display: "flex",
      flexDirection: "column" as const,
      overflow: "hidden",
      position: "relative" as const,
    },
    switcher: {
      display: "flex",
      background: "#f1f5f9",
      padding: "5px",
      borderRadius: "14px",
      gap: "0",
    },
    switchBtn: (isActive: boolean) => ({
      padding: "10px 24px",
      borderRadius: "10px",
      border: "none",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "14px",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      background: isActive ? "#ffffff" : "transparent",
      color: isActive ? "#2563eb" : "#64748b",
      boxShadow: isActive ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
      transform: isActive ? "scale(1.02)" : "scale(1)",
    }),
    inputLabel: {
      fontSize: "13px",
      fontWeight: "700",
      color: "#64748b",
      marginBottom: "8px",
      display: "block",
      textTransform: "uppercase" as const,
      letterSpacing: "0.5px",
    },
    input: {
      width: "100%",
      padding: "16px",
      borderRadius: "12px",
      border: "2px solid #f1f5f9",
      background: "#f8fafc",
      fontSize: "15px",
      transition: "all 0.2s",
      outline: "none",
      boxSizing: "border-box" as const,
      color: "#334155",
    },
    primaryBtn: (loading: boolean) => ({
      width: "100%",
      padding: "16px",
      marginTop: "20px",
      borderRadius: "12px",
      border: "none",
      background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
      color: "#fff",
      fontWeight: "700",
      fontSize: "16px",
      cursor: loading ? "wait" : "pointer",
      boxShadow: "0 8px 20px rgba(37, 99, 235, 0.25)",
      transition: "transform 0.2s, box-shadow 0.2s",
      opacity: loading ? 0.8 : 1,
    }),
    scrollArea: {
      overflowY: "auto" as const,
      padding: "20px",
      flex: 1,
      display: "flex",
      flexDirection: "column" as const,
      gap: "16px",
    },
    // --- CHAT SPECIFIC STYLES ---
    avatar: {
      width: "36px",
      height: "36px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "18px",
      flexShrink: 0,
      boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    },
    chatRowUser: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "10px",
      alignItems: "flex-end",
      animation: "messagePopIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
    },
    chatRowAdmin: {
      display: "flex",
      justifyContent: "flex-start",
      gap: "10px",
      alignItems: "flex-end",
      animation: "messagePopIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
    },
    bubbleUser: {
      background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
      color: "white",
      padding: "12px 18px",
      borderRadius: "18px 18px 4px 18px", // Đuôi nhọn góc dưới phải
      maxWidth: "75%",
      boxShadow: "0 4px 15px rgba(37, 99, 235, 0.2)",
      fontSize: "15px",
      position: "relative" as const,
      lineHeight: "1.5",
    },
    bubbleAdmin: {
      background: "#ffffff",
      color: "#1e293b",
      padding: "12px 18px",
      borderRadius: "18px 18px 18px 4px", // Đuôi nhọn góc dưới trái
      maxWidth: "75%",
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      border: "1px solid #f1f5f9",
      fontSize: "15px",
      position: "relative" as const,
      lineHeight: "1.5",
    },
    time: {
      fontSize: "11px",
      marginTop: "6px",
      opacity: 0.7,
      display: "flex",
      alignItems: "center",
      gap: "4px",
    },
    uploadArea: {
      border: "2px dashed #cbd5e1",
      borderRadius: "12px",
      padding: "10px",
      marginTop: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      transition: "all 0.2s",
      background: "#f8fafc",
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* CSS Styles nâng cao cho Animation & Scrollbar */}
      <style>{`
        /* Smooth Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        /* Input Focus */
        input:focus, textarea:focus { 
          border-color: #3b82f6 !important; 
          background: #fff !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }
        
        /* Animations */
        @keyframes messagePopIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        .hover-scale { transition: transform 0.2s; }
        .hover-scale:hover { transform: scale(1.02); }
        .hover-zoom { transition: transform 0.3s; cursor: zoom-in; }
        .hover-zoom:hover { transform: scale(1.05); }

        /* Bubble Tails Pseudo-elements (Optional enhancement via CSS) */
        /* Giữ code JS clean, xử lý tail bằng border-radius là đủ đẹp rồi */
      `}</style>

      <div style={styles.glassContainer}>
        {/* Header Section */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>
              {activeTab === "notification" ? "📢 Trung Tâm Thông Báo" : "💬 Hỗ Trợ Trực Tuyến"}
            </h2>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px", fontWeight: "500" }}>
              Xin chào, <span style={{color: "#2563eb"}}>{partnerName}</span>
            </p>
          </div>
          
          <div style={styles.switcher}>
            <button onClick={() => setActiveTab("notification")} style={styles.switchBtn(activeTab === "notification")}>
              Thông báo
            </button>
            <button onClick={() => setActiveTab("complaint")} style={styles.switchBtn(activeTab === "complaint")}>
              Khiếu nại
            </button>
          </div>
        </div>

        {/* Main Grid Content */}
        <div style={styles.grid}>
          
          {/* LEFT COLUMN: Input Form */}
          <div style={styles.card}>
            <h3 style={{ margin: "0 0 20px", fontSize: "18px", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
              {activeTab === "notification" ? "📝 Soạn tin mới" : "🚀 Gửi yêu cầu"}
            </h3>
            
            {activeTab === "notification" ? (
              // --- FORM THÔNG BÁO ---
              <>
                <div style={{ marginBottom: "16px" }}>
                  <label style={styles.inputLabel}>Tiêu đề</label>
                  <input
                    style={styles.input}
                    placeholder="Nhập tiêu đề hấp dẫn..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label style={styles.inputLabel}>Nội dung</label>
                  <textarea
                    style={{ ...styles.input, minHeight: "140px", resize: "none" }}
                    placeholder="Chi tiết thông báo..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
                <div>
                  <label style={styles.inputLabel}>Ảnh đính kèm</label>
                  <label style={styles.uploadArea} className="hover-scale">
                    <input type="file" hidden accept="image/*" onChange={(e) => setNotiImageFile(e.target.files?.[0] || null)} />
                    {notiImagePreview ? (
                      <img src={notiImagePreview} style={{height: '60px', borderRadius:'8px'}} alt="preview"/>
                    ) : (
                      <span style={{color: "#64748b", fontSize: "14px", display:'flex', alignItems:'center', gap:'6px'}}>
                        📷 Nhấn để tải ảnh lên
                      </span>
                    )}
                  </label>
                </div>
                <button 
                  onClick={handleSendNotification} 
                  disabled={sending} 
                  style={styles.primaryBtn(sending)}
                  className="hover-scale"
                >
                  {sending ? "Đang gửi..." : "Phát thông báo ngay"}
                </button>
              </>
            ) : (
              // --- FORM KHIẾU NẠI ---
              <>
                <div style={{ marginBottom: "16px", flex: 1, display:'flex', flexDirection:'column' }}>
                  <label style={styles.inputLabel}>Nội dung cần hỗ trợ</label>
                  <textarea
                    style={{ ...styles.input, flex: 1, resize: "none", background:"#fff" }}
                    placeholder="Hãy mô tả chi tiết vấn đề bạn đang gặp phải..."
                    value={complaintMessage}
                    onChange={(e) => setComplaintMessage(e.target.value)}
                  />
                  
                  <label style={{...styles.uploadArea, marginTop: "16px"}} className="hover-scale">
                    <input type="file" hidden accept="image/*" onChange={(e) => setComplaintImageFile(e.target.files?.[0] || null)} />
                    {complaintImagePreview ? (
                      <div style={{position:'relative'}}>
                         <img src={complaintImagePreview} style={{height: '80px', borderRadius:'8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'}} alt="preview"/>
                         <span style={{position:'absolute', top:-5, right:-5, background:'red', color:'white', borderRadius:'50%', width:'20px', height:'20px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px'}}>✕</span>
                      </div>
                    ) : (
                      <span style={{color: "#64748b", fontSize: "14px", display:'flex', alignItems:'center', gap:'6px'}}>
                        🖼️ Thêm ảnh minh họa (nếu có)
                      </span>
                    )}
                  </label>
                </div>

                <button 
                  onClick={handleSendComplaint} 
                  disabled={complaintLoading} 
                  style={{...styles.primaryBtn(complaintLoading), background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", boxShadow: "0 8px 20px rgba(220, 38, 38, 0.25)"}}
                  className="hover-scale"
                >
                  {complaintLoading ? "Đang xử lý..." : "Gửi tin nhắn"}
                </button>
              </>
            )}
          </div>

          {/* RIGHT COLUMN: Display List */}
          <div style={{...styles.card, padding: "0", background: activeTab === "complaint" ? "#f8fafc" : "#fff" }}>
            {/* Header nhỏ cho cột phải */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", background: "rgba(255,255,255,0.8)", backdropFilter:"blur(10px)", position:"sticky", top:0, zIndex:10 }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#475569", display:'flex', alignItems:'center', gap:'8px' }}>
                {activeTab === "notification" ? "📜 Lịch sử thông báo" : "💬 Hội thoại với Admin"}
              </h3>
            </div>
            
            <div style={styles.scrollArea}>
              {activeTab === "notification" ? (
                // --- DANH SÁCH THÔNG BÁO ---
                noti.length === 0 ? (
                  <div style={{textAlign:'center', marginTop:'50px', color:'#94a3b8', display:'flex', flexDirection:'column', alignItems:'center'}}>
                    <div style={{fontSize:'60px', marginBottom:'10px', opacity: 0.5}}>📭</div>
                    <p>Chưa có thông báo nào được gửi.</p>
                  </div>
                ) : (
                  noti.map((n) => (
                    <div key={n._id} style={{background: "#fff", borderRadius: "16px", padding: "20px", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"}} className="hover-scale">
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", alignItems:'center' }}>
                        <strong style={{ fontSize: "16px", color: "#1e293b" }}>{n.title}</strong>
                        <span style={{ fontSize: "11px", color: "#64748b", background:'#f1f5f9', padding:'4px 10px', borderRadius:'20px', fontWeight:'600' }}>
                          {new Date(n.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.6", margin: "0" }}>{n.content}</p>
                      {n.image && (
                        <div style={{marginTop:'12px', borderRadius:'12px', overflow:'hidden'}}>
                          <img src={n.image} style={{width:'100%', maxHeight:'200px', objectFit:'cover'}} className="hover-zoom" alt="attachment" />
                        </div>
                      )}
                    </div>
                  ))
                )
              ) : (
                // --- DANH SÁCH KHIẾU NẠI (CHAT UI) ---
                <>
                  {complaintsError && <p style={{textAlign:'center', color:'#ef4444'}}>{complaintsError}</p>}
                  {complaints.length === 0 && !complaintsLoading && (
                    <div style={{textAlign:'center', marginTop:'50px', color:'#94a3b8'}}>
                      <div style={{fontSize:'50px', marginBottom:'10px'}}>👋</div>
                      <p>Xin chào! Chúng tôi có thể giúp gì cho bạn?</p>
                    </div>
                  )}
                  
                  {complaints.map((c) => (
                    <div key={c._id} style={{display:'flex', flexDirection:'column', gap:'16px'}}>
                      {/* User Message */}
                      <div style={styles.chatRowUser}>
                         <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', maxWidth:'100%'}}>
                            <div style={styles.bubbleUser}>
                              {c.message}
                              {c.image && (
                                <div style={{marginTop: '10px', borderRadius: '8px', overflow: 'hidden'}}>
                                  <img src={c.image} alt="attachment" style={{maxWidth: '100%', maxHeight: '200px', display:'block'}} className="hover-zoom" />
                                </div>
                              )}
                            </div>
                            <div style={styles.time}>
                              {new Date(c.createdAt).toLocaleTimeString("vi-VN", {hour:'2-digit', minute:'2-digit'})}
                              <span>• Đã gửi</span>
                            </div>
                         </div>
                         <div style={{...styles.avatar, background: "linear-gradient(135deg, #3b82f6, #2563eb)", color:"white"}}>
                           👤
                         </div>
                      </div>

                      {/* Admin Responses */}
                      {c.responses?.map((res, idx) => (
                        <div key={idx} style={styles.chatRowAdmin}>
                          <div style={{...styles.avatar, background: "#fff", border:"1px solid #e2e8f0", color:"#ef4444"}}>
                            🛡️
                          </div>
                          <div style={{display:'flex', flexDirection:'column', alignItems:'flex-start', maxWidth:'100%'}}>
                            <div style={styles.bubbleAdmin}>
                              {res.message}
                            </div>
                            <div style={styles.time}>
                              {new Date(res.createdAt).toLocaleTimeString("vi-VN", {hour:'2-digit', minute:'2-digit'})}
                              <span>• Admin</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>
          </div>
        
        </div>
      </div>
    </div>
  );
}