import React, { useState, useEffect, useMemo } from "react";
import {
  getPromotions,
  createPromotion,
  deletePromotion,
  generatePromotionPreview as requestPromotionPreview,
} from "../../api/promotionsApi";
import { auth } from "../../firebase/config";
import { 
  Ticket, 
  Calendar, 
  // Percent, // 1. Đã xóa import thừa
  Image as ImageIcon, 
  Sparkles, 
  Trash2, 
  Save, 
  Loader2, 
  Type, 
  Hash, 
  RefreshCw 
} from "lucide-react";

// --- TYPES ---
interface Promotion {
  _id: string;
  code: string;
  discountType: "percentage" | "amount";
  discountValue: number;
  maxUsage: number;
  startDate: string;
  endDate: string;
  description?: string;
  image?: string;
}

// --- HELPER FUNCTIONS ---
const formatDateVi = (value: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const buildAutoDescriptionPreview = (
  partnerName: string,
  code: string,
  discountType: "percentage" | "amount",
  discountValue: number,
  startDate: string,
  endDate: string,
  maxUsage: number,
  descriptionHint: string
) => {
  if (!code) return "Nhập mã giảm giá để xem mô tả gợi ý.";
  const readableName = partnerName || "nhà xe";
  const numericValue = Number(discountValue) || 0;
  const discountText =
    discountType === "percentage"
      ? `${numericValue}%`
      : `${numericValue.toLocaleString("vi-VN")}₫`;
  
  return `🔥 HOT: ${readableName} tung mã ${code} giảm ngay ${discountText}. Áp dụng ${startDate ? `từ ${formatDateVi(startDate)}` : ""} ${endDate ? `đến ${formatDateVi(endDate)}` : ""}. Số lượng có hạn (${maxUsage} lượt). ${descriptionHint || "Đặt vé ngay!"}`;
};

const dataUrlToFile = (dataUrl: string, filename: string) => {
  const arr = dataUrl.split(",");
  if (arr.length < 2) return null;
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) return null;
  const mime = mimeMatch[1];
  const binary = atob(arr[1]);
  const len = binary.length;
  const array = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    array[i] = binary.charCodeAt(i);
  }
  return new File([array], filename, { type: mime });
};

export default function PartnerPromotion() {
  // --- STATE ---
  const [partnerId, setPartnerId] = useState<string>("");
  const [partnerName, setPartnerName] = useState<string>("");
  const [authReady, setAuthReady] = useState(false);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  
  // Form State
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "amount">("percentage");
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [maxUsage, setMaxUsage] = useState<number>(100);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Image & Description State
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [autoGenerateImage, setAutoGenerateImage] = useState(true);
  const [description, setDescription] = useState("");
  const [autoDescription, setAutoDescription] = useState(true);
  const [descriptionHint, setDescriptionHint] = useState("");
  const [generatedImageDataUrl, setGeneratedImageDataUrl] = useState("");
  const [generatedDescription, setGeneratedDescription] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  // --- EFFECTS ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setPartnerId(user.uid);
        setPartnerName(user.displayName || "Nhà xe");
      } else {
        setPartnerId(""); setPartnerName(""); setPromotions([]);
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => { if (partnerId) fetchPromotions(partnerId); }, [partnerId]);

  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else { setPreviewUrl(""); }
  }, [file]);

  useEffect(() => {
    if (autoGenerateImage) { setFile(null); setPreviewUrl(""); }
  }, [autoGenerateImage]);

  useEffect(() => {
    setGeneratedImageDataUrl("");
    setGeneratedDescription("");
  }, [code, discountType, discountValue, maxUsage, startDate, endDate, descriptionHint, autoGenerateImage]);

  // --- LOGIC ---
  const descriptionPreview = useMemo(() => {
    if (generatedDescription && autoDescription) return generatedDescription;
    if (!autoDescription) return description || "Chưa có mô tả";
    return buildAutoDescriptionPreview(partnerName, code, discountType, discountValue, startDate, endDate, maxUsage, descriptionHint);
  }, [partnerName, code, discountType, discountValue, startDate, endDate, maxUsage, descriptionHint, description, autoDescription, generatedDescription]);

  const previewImageUrl = autoGenerateImage ? generatedImageDataUrl : previewUrl;

  const fetchPromotions = async (pid: string) => {
    try {
      const data = await getPromotions(pid);
      setPromotions(Array.isArray(data) ? data : data.promotions || []);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return alert("⚠️ Nhập mã giảm giá!");
    if (!startDate || !endDate) return alert("⚠️ Chọn thời gian!");
    
    const formData = new FormData();
    formData.append("code", code.trim());
    formData.append("discountType", discountType);
    formData.append("discountValue", discountValue.toString());
    formData.append("maxUsage", maxUsage.toString());
    formData.append("startDate", startDate);
    formData.append("endDate", endDate);
    formData.append("partnerId", partnerId);
    formData.append("partnerName", partnerName || "");
    formData.append("autoImage", autoGenerateImage ? "true" : "false");
    formData.append("autoDescription", autoDescription ? "true" : "false");
    
    if (!autoDescription) {
       formData.append("description", description);
    } else if (generatedDescription) {
       formData.append("description", generatedDescription);
    } else {
       formData.append("descriptionHint", descriptionHint);
    }

    if (file) formData.append("image", file);
    if (autoGenerateImage && generatedImageDataUrl) {
      const aiFile = dataUrlToFile(generatedImageDataUrl, `${code}-ai.png`);
      if (aiFile) {
        formData.set("autoImage", "false");
        formData.append("image", aiFile);
      }
    }

    try {
      setLoading(true);
      await createPromotion(formData);
      alert("✅ Tạo thành công!");
      await fetchPromotions(partnerId);
      setCode(""); setDiscountValue(10); setDescription(""); setGeneratedImageDataUrl(""); setGeneratedDescription("");
    } catch (err: any) { alert("❌ Lỗi: " + (err.response?.data?.message || err.message)); } 
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("🗑️ Xóa khuyến mãi này?")) return;
    try {
      await deletePromotion(id, partnerId);
      fetchPromotions(partnerId);
    } catch (err) { alert("❌ Không thể xóa"); }
  };

  const handleGeneratePreview = async () => {
    if (!code.trim()) return alert("⚠️ Nhập mã giảm giá trước!");
    try {
      setPreviewError(""); setPreviewLoading(true);
      const result = await requestPromotionPreview({
        code: code.trim(),
        discountType,
        discountValue,
        maxUsage,
        startDate,
        endDate,
        description: !autoDescription ? description : "",
        partnerName,
        autoImage: autoGenerateImage,
        autoDescription: autoDescription,
        descriptionHint: descriptionHint.trim(),
      });
      if (result?.description) setGeneratedDescription(result.description);
      if (result?.imageDataUrl) setGeneratedImageDataUrl(result.imageDataUrl);
    } catch (err: any) { 
      setPreviewError("Lỗi tạo preview AI"); 
    } finally { setPreviewLoading(false); }
  };

  // --- STYLES (White/Light Clean Theme) ---
  const styles = {
    wrapper: {
      minHeight: "100vh",
      background: "#f8fafc",
      padding: "40px 20px",
      fontFamily: "'Inter', sans-serif",
      color: "#1e293b",
    },
    container: {
      maxWidth: "1200px",
      margin: "0 auto",
    },
    header: {
      marginBottom: "30px",
    },
    title: {
      fontSize: "32px",
      fontWeight: "800",
      background: "linear-gradient(to right, #2563eb, #4f46e5)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      display: "flex", alignItems: "center", gap: "12px"
    },
    subtitle: { color: "#64748b", fontSize: "16px", marginTop: "8px" },

    // Grid Layout
    grid: {
      display: "grid",
      gridTemplateColumns: "1.2fr 0.8fr",
      gap: "30px",
      alignItems: "start",
    },
    
    // Cards
    card: {
      background: "white",
      borderRadius: "20px",
      padding: "30px",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
      border: "1px solid #e2e8f0",
    },
    
    // Form Elements
    sectionTitle: { fontSize: "18px", fontWeight: "700", color: "#0f172a", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" },
    inputGroup: { marginBottom: "20px" },
    label: { display: "block", fontSize: "14px", fontWeight: "600", color: "#475569", marginBottom: "8px" },
    inputWrapper: { position: "relative" as const },
    
    // 2. Sửa lỗi pointerEvents bằng "as const"
    iconInput: { 
      position: "absolute" as const, 
      left: "14px", 
      top: "50%", 
      transform: "translateY(-50%)", 
      color: "#94a3b8", 
      pointerEvents: "none" as const // <-- SỬA LỖI TẠI ĐÂY
    },
    
    input: {
      width: "100%", padding: "12px 12px 12px 44px",
      borderRadius: "10px", border: "1px solid #cbd5e1",
      fontSize: "15px", color: "#1e293b", outline: "none",
      transition: "border-color 0.2s, box-shadow 0.2s",
      background: "#fff", boxSizing: "border-box" as const
    },
    row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
    
    // Toggle Switch
    toggleContainer: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px", background: "#f1f5f9", borderRadius: "12px", marginBottom: "16px"
    },
    toggleLabel: { fontSize: "14px", fontWeight: "600", color: "#334155" },
    
    // Preview Card
    previewContainer: {
      position: "sticky" as const, top: "20px"
    },
    previewBox: {
      background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)",
      border: "2px dashed #bae6fd",
      borderRadius: "16px",
      overflow: "hidden",
      textAlign: "center" as const,
      minHeight: "250px",
      display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center",
      position: "relative" as const,
    },
    previewImage: { width: "100%", height: "100%", objectFit: "cover" as const, display: "block" },
    previewPlaceholder: { padding: "40px 20px", color: "#64748b" },
    previewText: { padding: "20px", background: "white", borderTop: "1px solid #f1f5f9", textAlign: "left" as const },
    
    // Buttons
    btnPrimary: (disabled: boolean) => ({
      width: "100%", padding: "14px", borderRadius: "10px", border: "none",
      background: disabled ? "#94a3b8" : "linear-gradient(to right, #2563eb, #4f46e5)",
      color: "white", fontWeight: "600", fontSize: "16px",
      cursor: disabled ? "not-allowed" : "pointer",
      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
      boxShadow: disabled ? "none" : "0 4px 12px rgba(37, 99, 235, 0.3)",
      transition: "transform 0.2s",
    }),
    btnAi: {
      width: "100%", padding: "12px", borderRadius: "10px", border: "none",
      background: "linear-gradient(to right, #8b5cf6, #d946ef)",
      color: "white", fontWeight: "600", cursor: "pointer",
      marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
      boxShadow: "0 4px 12px rgba(217, 70, 239, 0.3)",
    },

    // Promotions List
    listSection: { marginTop: "50px" },
    promoGrid: {
      display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px", marginTop: "24px"
    },
    promoCard: {
      background: "white", borderRadius: "16px", overflow: "hidden",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
      border: "1px solid #e2e8f0",
      position: "relative" as const,
      transition: "transform 0.2s",
    },
    promoHeader: {
      height: "140px", background: "#f1f5f9", position: "relative" as const
    },
    promoImg: { width: "100%", height: "100%", objectFit: "cover" as const },
    promoBody: { padding: "20px" },
    badge: {
      background: "#dbeafe", color: "#1e40af", padding: "4px 10px", borderRadius: "20px",
      fontSize: "12px", fontWeight: "700", display: "inline-block", marginBottom: "8px"
    },
    delBtn: {
      position: "absolute" as const, top: "10px", right: "10px",
      background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "8px",
      width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center",
      color: "#ef4444", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
    }
  };

  if (!authReady) return <div style={{display:'flex', justifyContent:'center', paddingTop: 100}}>Loading...</div>;

  return (
    <div style={styles.wrapper}>
      <style>{`
        .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.08) !important; }
        .input-focus:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important; }
        .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .4s; border-radius: 34px; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: #3b82f6; }
        input:checked + .slider:before { transform: translateX(20px); }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; borderRadius: 10px; }
      `}</style>

      {/* Decoration */}
      <div style={{position: "fixed", top: "-20%", right: "-10%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, rgba(0,0,0,0) 70%)", zIndex: 0, pointerEvents: "none"}} />

      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}><Ticket size={36} /> Quản Lý Khuyến Mãi</h1>
          <p style={styles.subtitle}>Tạo và quản lý mã giảm giá cho khách hàng của bạn.</p>
        </div>

        <div style={styles.grid}>
          {/* LEFT COLUMN: FORM */}
          <div>
            <form onSubmit={handleSubmit} style={styles.card}>
              <h2 style={styles.sectionTitle}><Type size={20} color="#334155"/> Thông tin cơ bản</h2>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>Mã giảm giá (Code)</label>
                <div style={styles.inputWrapper}>
                  <Hash size={18} style={styles.iconInput} />
                  <input 
                    style={{...styles.input, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700'}} 
                    className="input-focus"
                    placeholder="VD: TET2024"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <div style={styles.row}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Giá trị giảm</label>
                  <div style={styles.inputWrapper}>
                    <div style={{...styles.iconInput, fontSize: '14px', fontWeight: '800'}}>{discountType === 'percentage' ? '%' : '₫'}</div>
                    <input 
                      type="number" style={styles.input} className="input-focus"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Loại giảm</label>
                  <select 
                    style={styles.input} className="input-focus"
                    value={discountType}
                    onChange={(e: any) => setDiscountType(e.target.value)}
                  >
                    <option value="percentage">Theo phần trăm (%)</option>
                    <option value="amount">Số tiền cố định (VNĐ)</option>
                  </select>
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Số lượng sử dụng tối đa</label>
                <input type="number" style={styles.input} className="input-focus" value={maxUsage} onChange={(e) => setMaxUsage(Number(e.target.value))} />
              </div>

              <div style={styles.row}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Ngày bắt đầu</label>
                  <input type="date" style={styles.input} className="input-focus" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Ngày kết thúc</label>
                  <input type="date" style={styles.input} className="input-focus" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>

              <div style={{borderTop: '1px dashed #e2e8f0', margin: '20px 0'}}></div>

              <h2 style={styles.sectionTitle}><Sparkles size={20} color="#8b5cf6"/> Nội dung & Hình ảnh</h2>

              {/* AI Toggles */}
              <div style={styles.toggleContainer}>
                <div>
                  <div style={styles.toggleLabel}>AI Tự viết mô tả</div>
                  <div style={{fontSize: '12px', color: '#64748b'}}>Tạo nội dung hấp dẫn tự động</div>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={autoDescription} onChange={e => setAutoDescription(e.target.checked)} />
                  <span className="slider"></span>
                </label>
              </div>

              {!autoDescription ? (
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Mô tả thủ công</label>
                  <textarea 
                    style={{...styles.input, minHeight: '100px', paddingTop: '12px', paddingLeft: '12px'}} 
                    className="input-focus"
                    placeholder="Nhập chi tiết khuyến mãi..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              ) : (
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Gợi ý cho AI (Tuỳ chọn)</label>
                  <input 
                    style={styles.input} className="input-focus"
                    placeholder="VD: Nhấn mạnh vào dịp lễ, khách hàng mới..."
                    value={descriptionHint}
                    onChange={(e) => setDescriptionHint(e.target.value)}
                  />
                </div>
              )}

              <div style={styles.toggleContainer}>
                <div>
                  <div style={styles.toggleLabel}>AI Thiết kế Banner</div>
                  <div style={{fontSize: '12px', color: '#64748b'}}>Tự động tạo ảnh theo mã</div>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={autoGenerateImage} onChange={e => setAutoGenerateImage(e.target.checked)} />
                  <span className="slider"></span>
                </label>
              </div>

              {!autoGenerateImage && (
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Tải ảnh lên</label>
                  <div style={{position:'relative'}}>
                    <ImageIcon size={18} style={styles.iconInput} />
                    <input 
                      type="file" style={{...styles.input, padding: '8px 12px 8px 44px'}} 
                      accept="image/*"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>
              )}

              <button type="submit" style={styles.btnPrimary(loading)} className="hover-lift">
                {loading ? <Loader2 className="animate-spin"/> : <Save size={20}/>}
                {loading ? "Đang tạo..." : "Lưu Khuyến Mãi"}
              </button>
            </form>
          </div>

          {/* RIGHT COLUMN: PREVIEW */}
          <div style={styles.previewContainer}>
            <div style={styles.card}>
              <h3 style={{fontSize: '16px', fontWeight: '700', color: '#64748b', marginBottom: '16px', textTransform: 'uppercase'}}>Live Preview</h3>
              
              <button 
                onClick={handleGeneratePreview} 
                style={{...styles.btnAi, opacity: previewLoading ? 0.7 : 1}} 
                disabled={previewLoading}
                className="hover-lift"
              >
                {previewLoading ? <RefreshCw className="animate-spin" /> : <Sparkles size={18} />}
                {previewLoading ? "AI đang vẽ..." : "Tạo thử bản xem trước"}
              </button>
              {previewError && <p style={{color: '#ef4444', fontSize: '13px', marginBottom: '10px'}}>{previewError}</p>}

              <div style={styles.previewBox}>
                {previewImageUrl ? (
                  <img src={previewImageUrl} style={styles.previewImage} alt="Preview"/>
                ) : (
                  <div style={styles.previewPlaceholder}>
                    <ImageIcon size={48} color="#cbd5e1" />
                    <p style={{fontSize: '14px', marginTop: '10px'}}>Ảnh banner sẽ hiển thị ở đây</p>
                  </div>
                )}
              </div>

              <div style={styles.previewText}>
                <h4 style={{margin: '0 0 8px 0', fontSize: '18px', color: '#1e293b'}}>{code || "MÃ CODE"}</h4>
                <p style={{margin: 0, fontSize: '14px', color: '#475569', lineHeight: '1.5'}}>
                  {descriptionPreview}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* LIST SECTION */}
        <div style={styles.listSection}>
          <h2 style={styles.title}><Ticket size={28} color="#0ea5e9"/> Danh sách hiện có</h2>
          
          {promotions.length === 0 ? (
            <div style={{textAlign: 'center', padding: '60px', color: '#94a3b8', background: 'white', borderRadius: '20px', marginTop: '20px', border: '1px dashed #cbd5e1'}}>
              <Ticket size={48} style={{marginBottom: '10px', opacity: 0.5}} />
              <p>Chưa có chương trình khuyến mãi nào.</p>
            </div>
          ) : (
            <div style={styles.promoGrid}>
              {promotions.map((p) => (
                <div key={p._id} style={styles.promoCard} className="hover-lift">
                  <button style={styles.delBtn} onClick={() => handleDelete(p._id)} title="Xóa">
                    <Trash2 size={16} />
                  </button>
                  <div style={styles.promoHeader}>
                    {(p.image || (p as any).imageUrl) ? (
                      <img src={p.image || (p as any).imageUrl} style={styles.promoImg} alt="Promo" />
                    ) : (
                      <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8'}}>
                        <ImageIcon size={40}/>
                      </div>
                    )}
                  </div>
                  <div style={styles.promoBody}>
                    <div style={styles.badge}>
                      {p.discountType === 'percentage' ? `-${p.discountValue}%` : `-${p.discountValue.toLocaleString()}₫`}
                    </div>
                    <h3 style={{margin: '0 0 8px 0', fontSize: '18px', color: '#1e293b'}}>{p.code}</h3>
                    <div style={{fontSize: '13px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px'}}>
                      <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                        <Calendar size={14}/> {formatDateVi(p.startDate)} - {formatDateVi(p.endDate)}
                      </span>
                      <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                        <Ticket size={14}/> Còn lại: {p.maxUsage}
                      </span>
                    </div>
                  </div>
                  {/* Decorative Circles mimicking ticket cuts */}
                  <div style={{position: 'absolute', top: '130px', left: '-10px', width: '20px', height: '20px', background: '#f8fafc', borderRadius: '50%'}}></div>
                  <div style={{position: 'absolute', top: '130px', right: '-10px', width: '20px', height: '20px', background: '#f8fafc', borderRadius: '50%'}}></div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}