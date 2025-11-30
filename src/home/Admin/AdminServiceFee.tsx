import { useEffect, useState } from "react";
import {
  getFeeConfig,
  getFeeHistory,
  getBookingsByPercent,
  updateFeeConfig,
} from "../../api/feeApi";
import {
  DollarSign,
  Calendar,
  History,
  Save,
  ArrowRight,
  Clock,
  Zap,
  Ticket
} from "lucide-react";

export default function AdminServiceFee() {
  const [fee, setFee] = useState<number>(0);
  const [newFee, setNewFee] = useState<string>("");
  const [appliedDate, setAppliedDate] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedPercent, setSelectedPercent] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  const adminId = localStorage.getItem("adminId") || "ADMIN123";

  // --- LOGIC ---
  const fetchFee = async () => {
    try {
      const res = await getFeeConfig();
      const feePercent = res?.fee?.percent ?? res?.percent ?? 0;
      setFee(feePercent);
      setNewFee(feePercent.toString());
      setAppliedDate(new Date().toISOString().split("T")[0]);
    } catch (err) { setFee(0); setNewFee("0"); }
  };

  const fetchHistory = async () => {
    try {
      const res = await getFeeHistory();
      setHistory(res?.history || []);
    } catch (err) { setHistory([]); }
  };

  const updateFee = async () => {
    const feeValue = Number(newFee);
    if (!newFee || feeValue < 0 || feeValue > 100) return alert("Phí không hợp lệ (0-100%)!");
    if (!appliedDate) return alert("Chọn ngày áp dụng!");
    try {
      setUpdating(true);
      const res = await updateFeeConfig(feeValue, adminId, appliedDate);
      if (res?.success) {
        alert("✅ Cập nhật thành công!");
        await fetchFee();
        await fetchHistory();
        setNewFee("");
      } else { alert(`❌ Thất bại: ${res?.message}`); }
    } catch (err: any) { alert(`❌ Lỗi: ${err.message}`); } 
    finally { setUpdating(false); }
  };

  const fetchTransactionByFee = async (percent: number) => {
    try {
      const res = await getBookingsByPercent(percent);
      if (!res?.bookings || res.bookings.length === 0) {
        alert(`⚠️ Không có booking nào áp dụng phí ${percent}%`);
        setSelectedPercent(null);
        setTransactions([]);
        return;
      }
      setSelectedPercent(percent);
      setTransactions(res.bookings || []);
      setTimeout(() => document.getElementById("transaction-section")?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err: any) { alert(`❌ Lỗi: ${err.message}`); }
  };

  useEffect(() => {
    const load = async () => {
      await fetchFee();
      await fetchHistory();
      setTimeout(() => setLoading(false), 1000);
    };
    load();
  }, []);

  // --- STYLES ---
  const styles = {
    wrapper: {
      minHeight: "100vh",
      background: "#0f172a",
      position: "relative" as const,
      overflowX: "hidden" as const,
      fontFamily: "'Outfit', 'Inter', sans-serif",
      padding: "40px 20px",
      color: "#f8fafc",
    },
    container: {
      maxWidth: "1280px",
      margin: "0 auto",
      position: "relative" as const,
      zIndex: 2,
    },
    headerTitle: {
      fontSize: "48px",
      fontWeight: "900",
      background: "linear-gradient(to right, #60a5fa, #c084fc, #f472b6)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      marginBottom: "8px",
      letterSpacing: "-1px",
      textShadow: "0 10px 30px rgba(192, 132, 252, 0.3)",
    },
    
    // Glassmorphism Card
    glassCard: {
      background: "rgba(30, 41, 59, 0.6)",
      backdropFilter: "blur(40px)",
      borderRadius: "32px",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      padding: "32px",
      boxShadow: "0 20px 50px -10px rgba(0, 0, 0, 0.5)",
      position: "relative" as const,
      overflow: "hidden",
    },

    // Fee Display Circle
    feeCircle: {
      width: "200px", height: "200px",
      borderRadius: "50%",
      background: "conic-gradient(from 180deg at 50% 50%, #2563eb 0deg, #9333ea 180deg, #2563eb 360deg)",
      position: "relative" as const,
      display: "flex", alignItems: "center", justifyContent: "center",
      margin: "0 auto 30px auto",
      padding: "4px",
      boxShadow: "0 0 50px rgba(37, 99, 235, 0.4)",
    },
    feeInner: {
      width: "100%", height: "100%", borderRadius: "50%",
      background: "#0f172a",
      display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center",
    },

    // Inputs
    inputWrapper: {
      background: "rgba(255,255,255,0.05)",
      borderRadius: "16px",
      padding: "8px 16px",
      border: "1px solid rgba(255,255,255,0.1)",
      display: "flex", alignItems: "center", gap: "12px",
      marginBottom: "16px",
      transition: "border 0.3s",
    },
    input: {
      background: "transparent", border: "none", color: "white",
      fontSize: "16px", width: "100%", outline: "none", padding: "8px 0",
      fontWeight: "500",
    },
    
    // Button
    glowBtn: (disabled: boolean) => ({
      width: "100%", padding: "16px", borderRadius: "16px", border: "none",
      background: disabled ? "#334155" : "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
      color: "white", fontSize: "16px", fontWeight: "700", cursor: disabled ? "not-allowed" : "pointer",
      boxShadow: disabled ? "none" : "0 0 20px rgba(139, 92, 246, 0.5)",
      transition: "transform 0.2s, box-shadow 0.2s",
      display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
      opacity: disabled ? 0.6 : 1,
    }),

    // Timeline History
    timelineItem: {
      position: "relative" as const,
      paddingLeft: "30px",
      marginBottom: "24px",
      borderLeft: "2px solid rgba(255,255,255,0.1)",
    },
    timelineDot: {
      position: "absolute" as const, left: "-6px", top: "0",
      width: "10px", height: "10px", borderRadius: "50%",
      background: "#3b82f6", boxShadow: "0 0 10px #3b82f6",
    },

    // Ticket (Physical Look)
    ticket: {
      background: "white",
      color: "#1e293b",
      borderRadius: "16px",
      position: "relative" as const,
      maskImage: "radial-gradient(circle at 0 65px, transparent 10px, black 11px), radial-gradient(circle at 100% 65px, transparent 10px, black 11px)",
      WebkitMaskImage: "radial-gradient(circle at 0 65px, transparent 10px, black 11px), radial-gradient(circle at 100% 65px, transparent 10px, black 11px)",
      maskComposite: "intersect",
      padding: "20px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
      transition: "transform 0.3s",
      cursor: "default",
    },
    dashedLine: {
      borderBottom: "2px dashed #cbd5e1",
      margin: "15px -20px",
      position: "relative" as const,
      top: "0px",
    }
  };

  if (loading) return (
    <div style={{height: "100vh", background: "#0f172a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"}}>
      <div style={{width: 60, height: 60, border: "4px solid rgba(255,255,255,0.1)", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite"}} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={styles.wrapper}>
      {/* GLOBAL CSS & ANIMATIONS */}
      <style>{`
        /* Aurora Animation */
        @keyframes aurora {
          0% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(20px, -20px) rotate(10deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        .blob { animation: aurora 10s infinite ease-in-out; }
        
        /* Interactive Classes */
        .hover-glow:hover { box-shadow: 0 0 30px rgba(59, 130, 246, 0.4) !important; border-color: #3b82f6 !important; }
        .hover-float:hover { transform: translateY(-5px) scale(1.02); }
        
        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); borderRadius: 10px; }
        
        /* Animations */
        .fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; transform: translateY(20px); }
        @keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* BACKGROUND ELEMENTS */}
      <div className="blob" style={{position: "fixed", top: "-10%", left: "10%", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(0,0,0,0) 70%)", zIndex: 0}} />
      <div className="blob" style={{position: "fixed", bottom: "-10%", right: "0%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(236,72,153,0.2) 0%, rgba(0,0,0,0) 70%)", zIndex: 0, animationDelay: "2s"}} />
      
      <div style={styles.container}>
        
        {/* HEADER */}
        <div style={{textAlign: "center", marginBottom: "60px"}} className="fade-in-up">
          <h1 style={styles.headerTitle}>Quản Lý Phí Dịch Vụ</h1>
          <p style={{color: "#94a3b8", fontSize: "18px"}}>Hệ thống cấu hình doanh thu tự động</p>
        </div>

        <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "40px"}}>
          
          {/* LEFT: CONFIG PANEL */}
          <div className="fade-in-up" style={{...styles.glassCard, animationDelay: "0.1s"} as any}>
             <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
               <h3 style={{fontSize:'20px', fontWeight:700, margin:0, display:'flex', alignItems:'center', gap:'10px'}}><Zap color="#facc15" fill="#facc15"/> Cấu hình</h3>
               <div style={{padding:'4px 12px', background:'rgba(34, 197, 94, 0.2)', color:'#4ade80', borderRadius:'20px', fontSize:'12px', fontWeight:700}}>Live</div>
             </div>

             {/* Speedometer Style Fee */}
             <div style={styles.feeCircle}>
               <div style={styles.feeInner}>
                 <span style={{fontSize:'56px', fontWeight:900, background:'linear-gradient(to bottom, #fff, #94a3b8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>{fee}%</span>
                 <span style={{fontSize:'12px', color:'#64748b', textTransform:'uppercase', letterSpacing:'2px'}}>Current Fee</span>
               </div>
             </div>

             {/* Inputs */}
             <div style={styles.inputWrapper} className="hover-glow">
               <DollarSign size={20} color="#94a3b8" />
               <input type="number" placeholder="Mức phí mới (0-100)" value={newFee} onChange={e=>setNewFee(e.target.value)} style={styles.input} />
             </div>
             
             <div style={styles.inputWrapper} className="hover-glow">
               <Calendar size={20} color="#94a3b8" />
               <input type="date" value={appliedDate} onChange={e=>setAppliedDate(e.target.value)} style={styles.input} />
             </div>

             <button style={styles.glowBtn(updating)} onClick={updateFee} className="hover-float">
               {updating ? <Clock className="animate-spin" /> : <Save />} {updating ? "Đang xử lý..." : "Lưu Thay Đổi"}
             </button>
          </div>

          {/* RIGHT: HISTORY TIMELINE */}
          <div className="fade-in-up" style={{...styles.glassCard, animationDelay: "0.2s"} as any}>
            <h3 style={{fontSize:'20px', fontWeight:700, margin:'0 0 30px 0', display:'flex', alignItems:'center', gap:'10px'}}>
              <History color="#c084fc"/> Lịch sử thay đổi
            </h3>

            <div style={{maxHeight:'400px', overflowY:'auto', paddingRight:'10px'}}>
              {history.length === 0 ? <p style={{color:'#64748b', textAlign:'center'}}>Chưa có dữ liệu.</p> : history.map((h, i) => (
                <div key={i} style={styles.timelineItem}>
                  <div style={styles.timelineDot} />
                  <div style={{background:'rgba(255,255,255,0.03)', padding:'15px', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.05)'}} className="hover-glow">
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                       <div style={{display:'flex', alignItems:'center', gap:'8px', fontSize:'18px', fontWeight:700}}>
                         <span style={{color:'#64748b', textDecoration:'line-through'}}>{h.oldPercent}%</span>
                         <ArrowRight size={14} color="#94a3b8"/>
                         <span style={{color:'#60a5fa'}}>{h.newPercent}%</span>
                       </div>
                       <button onClick={()=>fetchTransactionByFee(h.newPercent)} style={{background:'rgba(255,255,255,0.1)', border:'none', color:'white', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', fontSize:'12px'}}>Check</button>
                    </div>
                    <div style={{fontSize:'12px', color:'#94a3b8', display:'flex', gap:'10px'}}>
                      <span>📅 {new Date(h.appliedAt).toLocaleDateString("vi-VN")}</span>
                      <span>👤 {h.updatedBy || "Admin"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TRANSACTIONS SECTION - TICKET STYLE */}
        {selectedPercent !== null && (
          <div id="transaction-section" style={{marginTop:'60px'}} className="fade-in-up">
            <div style={{display:'flex', alignItems:'center', gap:'15px', marginBottom:'30px'}}>
              <Ticket size={32} color="#f472b6" />
              <h2 style={{fontSize:'28px', fontWeight:800, margin:0}}>
                Danh sách Booking <span style={{color:'#f472b6'}}>{selectedPercent}%</span>
              </h2>
              <span style={{background:'#334155', padding:'4px 12px', borderRadius:'20px', fontSize:'12px'}}>{transactions.length} Vé</span>
            </div>

            {transactions.length === 0 ? (
               <div style={{padding:'60px', textAlign:'center', border:'2px dashed rgba(255,255,255,0.1)', borderRadius:'20px'}}>
                 <p style={{color:'#64748b'}}>Không có dữ liệu booking.</p>
               </div>
            ) : (
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'24px'}}>
                {transactions.map((bk, idx) => (
                  <div key={bk._id} style={{...styles.ticket, animationDelay: `${idx * 0.1}s`} as any} className="fade-in-up hover-float">
                    {/* Ticket Top */}
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'start'}}>
                      <div>
                        <div style={{fontSize:'12px', color:'#64748b', fontWeight:600, textTransform:'uppercase'}}>Hành khách</div>
                        <div style={{fontSize:'16px', fontWeight:800, color:'#0f172a'}}>{bk.hoTen || bk.name || "Khách vãng lai"}</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:'12px', color:'#64748b', fontWeight:600}}>Trạng thái</div>
                        <div style={{color: bk.status === 'paid' ? '#16a34a' : '#ea580c', fontWeight:800, fontSize:'14px', textTransform:'uppercase'}}>{bk.status}</div>
                      </div>
                    </div>

                    <div style={styles.dashedLine} />

                    {/* Ticket Bottom */}
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'10px'}}>
                      <div style={{display:'flex', flexDirection:'column', gap:'2px'}}>
                        <span style={{fontSize:'12px', color:'#64748b'}}>Tổng tiền</span>
                        <span style={{fontSize:'14px', fontWeight:700}}>{(bk.finalTotal || bk.totalPrice || 0).toLocaleString()}₫</span>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:'10px', color:'#64748b', marginBottom:'2px'}}>PHÍ DỊCH VỤ ({selectedPercent}%)</div>
                        <div style={{fontSize:'20px', fontWeight:900, color:'#2563eb'}}>
                          {(bk.serviceFeeAmount || (((bk.finalTotal || bk.totalPrice || 0) * selectedPercent) / 100)).toLocaleString()}₫
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}