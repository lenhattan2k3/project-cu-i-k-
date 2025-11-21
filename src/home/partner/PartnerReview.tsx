// File: src/home/components/PartnerReview.tsx
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { auth } from "../../firebase/config";
import {
  getReviewByPartnerId,
  partnerReply,
  type Review,
  type Message,
} from "../../api/reviewApi";
import { uploadToCloudinary } from "../../api/uploadToCloudinary";
import { socket } from "../../utils/socket";

// ---------- Types & Utils ----------
interface ReviewEx extends Review {
  messages?: Message[];
}

const fmtDate = (d?: string | Date) =>
  d ? new Date(d).toLocaleString("vi-VN", { timeStyle: "short", dateStyle: "short" }) : "";

// ---------- Component ----------
export default function PartnerReview(): React.ReactElement {
  const [partnerId, setPartnerId] = useState<string>("");
  const [partnerName, setPartnerName] = useState<string>("Nhà xe"); // Thêm state cho tên nhà xe
  const [partnerAvatar, setPartnerAvatar] = useState<string>(""); // Thêm state cho avatar nhà xe
  const [avatarError, setAvatarError] = useState(false);
  
  const [reviews, setReviews] = useState<ReviewEx[]>([]);
  const [loading, setLoading] = useState(true);

  const [inputMap, setInputMap] = useState<Record<string, string>>({});
  const [fileMap, setFileMap] = useState<Record<string, File | null>>({});
  const [previewMap, setPreviewMap] = useState<Record<string, string>>({});
  const [sendingMap, setSendingMap] = useState<Record<string, boolean>>({});

  const mountedRef = useRef(true);
  const chatEndRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // ----------------------------------------------------------------
  // ----- TOÀN BỘ LOGIC STATE VÀ API ĐƯỢC GIỮ NGUYÊN HOÀN TOÀN -----
  // ----------------------------------------------------------------

  const scrollToBottom = (reviewId: string) => {
    setTimeout(() => {
      chatEndRefs.current[reviewId]?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const fetchReviews = async (pid: string) => {
    try {
      setLoading(true);
      const res = await getReviewByPartnerId(pid);
      if (!Array.isArray(res)) {
        if (mountedRef.current) setReviews([]);
        return;
      }
      if (mountedRef.current) setReviews(res);
    } catch (err) {
      console.error(err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    const unsub = auth.onAuthStateChanged((u) => {
      const uid = u?.uid ?? "";
      setPartnerId(uid);
      setPartnerName(u?.displayName || "Nhà xe"); // Lấy tên nhà xe
      setPartnerAvatar(u?.photoURL || ""); // Lấy avatar nhà xe
      setAvatarError(false);

      if (uid) {
        fetchReviews(uid);
        socket?.emit("registerPartner", uid);
      }
    });

    const onReviewUpdated = (review: ReviewEx) => {
      if (!review._id) {
        console.error("Socket update is missing _id", review);
        return;
      }
      setReviews((prev) => {
        const idx = prev.findIndex((r) => r._id === review._id);
        if (idx !== -1) {
          const cp = [...prev];
          cp[idx] = { ...prev[idx], ...review };
          return cp;
        } else {
          return [review, ...prev];
        }
      });
    };

    socket?.on("review:updated", onReviewUpdated);
    socket?.on("review:newMessage", onReviewUpdated);
    socket?.on("review:new", onReviewUpdated);

    return () => {
      mountedRef.current = false;
      unsub();
      socket?.off("review:updated", onReviewUpdated);
      socket?.off("review:newMessage", onReviewUpdated);
      socket?.off("review:new", onReviewUpdated);
    };
  }, []);

  const handleFile = (e: ChangeEvent<HTMLInputElement>, id: string) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) return alert("Ảnh > 10MB!");
    if (previewMap[id]) URL.revokeObjectURL(previewMap[id]);
    setPreviewMap((p) => ({ ...p, [id]: URL.createObjectURL(f) }));
    setFileMap((p) => ({ ...p, [id]: f }));
    e.currentTarget.value = "";
  };
  
  const clearFileState = (id: string) => {
    setPreviewMap((p) => {
      const cp = { ...p };
      delete cp[id];
      return cp;
    });
    setFileMap((p) => ({ ...p, [id]: null }));
  };

  const removeFile = (id: string) => {
    if (previewMap[id]) URL.revokeObjectURL(previewMap[id]);
    clearFileState(id);
  };

  const sendMsg = async (reviewId: string) => {
    const text = (inputMap[reviewId] || "").trim();
    const file = fileMap[reviewId];
    if (!text && !file) return alert("Nhập nội dung hoặc chọn ảnh!");

    const tempMessage: Message = {
      sender: "partner",
      senderName: partnerName, // Dùng tên thật
      text,
      imageUrl: previewMap[reviewId] || undefined,
      createdAt: new Date().toISOString(),
    };

    setReviews((prev) =>
      prev.map((r) =>
        r._id === reviewId ? { ...r, messages: [...(r.messages || []), tempMessage] } : r
      )
    );

    setInputMap((p) => ({ ...p, [reviewId]: "" }));
    const fileToUpload = file;
    clearFileState(reviewId);

    scrollToBottom(reviewId);
    setSendingMap((p) => ({ ...p, [reviewId]: true }));

    try {
      let imageUrl: string | undefined;
      if (fileToUpload) {
        const uploaded = await uploadToCloudinary(fileToUpload);
        if (!uploaded) throw new Error("Upload lỗi");
        imageUrl = uploaded;
      }

      const updatedReview = await partnerReply(reviewId, text, imageUrl, partnerId, partnerName);

      setReviews((prev) =>
        prev.map((r) =>
          r._id === reviewId ? { ...r, ...updatedReview } : r
        )
      );

      socket?.emit("review:newMessage", updatedReview);
      scrollToBottom(reviewId);
    } catch (err) {
      console.error(err);
      alert("Gửi tin nhắn thất bại");
      setReviews((prev) =>
        prev.map((r) =>
          r._id === reviewId
            ? { ...r, messages: (r.messages || []).slice(0, -1) }
            : r
        )
      );
    } finally {
      setSendingMap((p) => ({ ...p, [reviewId]: false }));
    }
  };
  
  // ----------------------------------------------------------------
  // ----- BẮT ĐẦU PHẦN GIAO DIỆN (JSX) ĐÃ ĐƯỢC THIẾT KẾ LẠI -----
  // ----------------------------------------------------------------

  if (!partnerId)
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#F9FAFB" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "60px", marginBottom: "16px" }}>🔒</div>
          <p style={{ color: "#6B7280", fontSize: "18px" }}>Vui lòng đăng nhập</p>
        </div>
      </div>
    );

  return (
    <div style={{ background: "#F9FAFB", padding: "24px", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ maxWidth: "1100px", margin: "0 auto 32px auto" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#111827", margin: 0 }}>
          Đánh giá từ Khách hàng
        </h1>
        <p style={{ fontSize: "16px", color: "#6B7280", marginTop: "8px" }}>
          Quản lý và phản hồi các đánh giá của khách.
        </p>
      </div>

      {/* Loading / Empty States */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>Đang tải dữ liệu...</div>
      ) : reviews.length === 0 ? (
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "48px", maxWidth: 720, margin: "30px auto", textAlign: "center" }}>
          <div style={{ fontSize: "60px", marginBottom: "16px" }}>📭</div>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#374151" }}>Chưa có đánh giá nào</h3>
          <p style={{ marginTop: 8, color: "#6b7280" }}>Khi khách hàng đánh giá, chúng sẽ hiển thị ở đây.</p>
        </div>
      ) : (
        
        // List of Reviews
        <div style={{ display: "flex", flexDirection: "column", gap: "32px", maxWidth: "1100px", margin: "0 auto" }}>
          {reviews.map((r: ReviewEx) => {
            if (!r) return null;
            const id = r._id!;
            if (!id) return null;

            const messages = r.messages || [];
            const sending = sendingMap[id] || false;

            return (
              // Card 2 cột
              <div
                key={id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "320px 1fr",
                  background: "white",
                  borderRadius: "16px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  border: "1px solid #E5E7EB",
                  overflow: "hidden"
                }}
              >
                {/* -------------------- */}
                {/* CỘT BÊN TRÁI (INFO) */}
                {/* -------------------- */}
                <div style={{ padding: "24px", borderRight: "1px solid #E5E7EB", background: "#F9FAFB" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginTop: 0, marginBottom: "12px" }}>
                    {r.tenChuyen || "Chuyến xe"}
                  </h3>
                  
                  {/* Rating */}
                  <StarRating rating={r.rating ?? 0} />
                  
                  <hr style={{ border: "none", borderTop: "1px solid #E5E7EB", margin: "20px 0" }} />
                  
                  {/* Thông tin chi tiết */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <DetailRow label="Khách hàng" value={r.hoTen} />
                    <DetailRow label="Số điện thoại" value={r.sdt} />
                    <DetailRow label="Số ghế" value={(r.soGhe || []).join(", ") || "—"} />
                    <DetailRow label="Tổng tiền" value={`${r.totalPrice?.toLocaleString("vi-VN") || 0}đ`} />
                  </div>
                </div>
                
                {/* --------------------- */}
                {/* CỘT BÊN PHẢI (CHAT) */}
                {/* --------------------- */}
                <div style={{ display: "flex", flexDirection: "column", maxHeight: "700px" }}>
                  
                  {/* Khu vực scroll tin nhắn */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                    {messages.length === 0 ? (
                       <div style={{ color: "#9CA3AF", textAlign: "center", paddingTop: "40px" }}>Chưa có tin nhắn nào.</div>
                    ) : (
                      messages.map((m: Message, i: number) => {
                        const isPartner = m.sender === "partner";
                        const key = (m as any)._id || (m as any).tempId || `${id}-msg-${i}-${m.createdAt}`;

                        return (
                          <ChatBubble
                            key={key}
                            isUser={!isPartner} // "User" ở đây là khách hàng
                            avatar={isPartner ? partnerAvatar : undefined} // Chỉ nhà xe mới có avatar
                            avatarError={avatarError}
                            setAvatarError={setAvatarError}
                            name={m.senderName || (isPartner ? partnerName : "Khách hàng")}
                            date={fmtDate(m.createdAt)}
                            text={m.text}
                            imageUrl={m.imageUrl}
                            // Thêm rating cho tin nhắn đầu tiên của khách
                            rating={i === 0 && !isPartner ? r.rating : undefined} 
                          />
                        );
                      })
                    )}
                    <div ref={(el: HTMLDivElement | null) => { chatEndRefs.current[id] = el; }} />
                  </div>

                  {/* Khu vực Input */}
                  <div style={{ borderTop: "1px solid #E5E7EB", padding: "16px", background: "#F9FAFB" }}>
                    <textarea
                      value={inputMap[id] || ""}
                      onChange={(e) => setInputMap((p) => ({ ...p, [id]: e.target.value }))}
                      placeholder="Nhập phản hồi của bạn..."
                      disabled={sending}
                      style={{
                        width: "100%", minHeight: "80px", padding: "12px 16px", borderRadius: "8px",
                        border: "1px solid #D1D5DB", boxSizing: "border-box", resize: "vertical",
                        fontSize: "14px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                      }}
                    />
                    
                    {/* Preview ảnh */}
                    {previewMap[id] && (
                       <div style={{ marginTop: "12px", position: "relative", display: "inline-block" }}>
                         <img src={previewMap[id]} alt="preview" style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px", border: "1px solid #E5E7EB" }} />
                         <button 
                           onClick={() => removeFile(id)} 
                           disabled={sending}
                           style={{
                              position: "absolute", top: "-8px", right: "-8px", background: "#EF4444", color: "white",
                              borderRadius: "50%", width: "24px", height: "24px", border: "none", cursor: "pointer",
                              fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center"
                           }}>
                           ×
                         </button>
                       </div>
                    )}
                    
                    {/* Dòng button */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                      {/* Nút đính kèm file */}
                      <label 
                        htmlFor={`file-partner-${id}`} 
                        style={{ 
                          cursor: sending ? "not-allowed" : "pointer",
                          padding: "8px",
                          borderRadius: "6px"
                        }}
                        title="Đính kèm ảnh"
                      >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.5 10.625V13.125C17.5 15.334 15.834 17.0833 13.75 17.0833C11.666 17.0833 10 15.334 10 13.125V6.875C10 5.54167 8.95833 4.5 7.70833 4.5C6.45833 4.5 5.41667 5.54167 5.41667 6.875V12.5C5.41667 13.125 5.875 13.75 6.45833 13.75C7.04167 13.75 7.5 13.125 7.5 12.5V7.5H8.75V12.5C8.75 13.875 7.75 15 6.45833 15C5.16667 15 4.16667 13.875 4.16667 12.5V6.875C4.16667 4.875 5.75 3.20833 7.70833 3.20833C9.66667 3.20833 11.25 4.875 11.25 6.875V13.125C11.25 16.0417 13.9583 18.3333 16.25 18.3333C18.5417 18.3333 20 16.0417 20 13.125V10.625H17.5Z" fill={sending ? "#9CA3AF" : "#6B7280"}/>
                        </svg>
                      </label>
                      <input id={`file-partner-${id}`} type="file" accept="image/*" onChange={(e) => handleFile(e, id)} disabled={sending} style={{ display: "none" }} />
                      
                      {/* Nút gửi */}
                      <button
                        onClick={() => sendMsg(id)}
                        disabled={sending || (!(inputMap[id] || "").trim() && !fileMap[id])}
                        style={{
                          padding: "10px 16px",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "white",
                          background: sending ? "#9CA3AF" : "#2563EB",
                          border: "none",
                          borderRadius: "8px",
                          cursor: (sending || (!inputMap[id]?.trim() && !fileMap[id])) ? "not-allowed" : "pointer",
                          opacity: (sending || (!inputMap[id]?.trim() && !fileMap[id])) ? 0.7 : 1
                        }}
                      >
                        {sending ? "Đang gửi..." : "Gửi Phản hồi"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- Component con ----------

// Component render chi tiết (Khách hàng, SĐT...)
const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "4px" }}>{label}</div>
    <div style={{ fontWeight: 600, color: "#1F2937", fontSize: "14px" }}>{value}</div>
  </div>
);

// Component render sao
const StarRating = ({ rating }: { rating: number }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
    {Array.from({ length: 5 }, (_, idx) => (
      <span key={idx} style={{ fontSize: "20px", color: idx < rating ? "#FBBF24" : "#D1D5DB" }}>
        ★
      </span>
    ))}
    <span style={{ marginLeft: "8px", fontSize: "14px", fontWeight: 600, color: "#374151" }}>
      {rating}/5
    </span>
  </div>
);

// Component render 1 bong bóng chat (Giống hệt file Review.tsx)
function ChatBubble({ isUser, avatar, avatarError, setAvatarError, name, date, text, rating, imageUrl }: 
  { 
    isUser: boolean;
    avatar?: string;
    avatarError?: boolean;
    setAvatarError?: (err: boolean) => void;
    name: string; 
    date: string; 
    text?: string; 
    rating?: number;
    imageUrl?: string;
  }) {
  
  const align = isUser ? "flex-start" : "flex-end"; // Đảo ngược: user (khách) bên trái, partner (nhà xe) bên phải
  const avatarBg = isUser ? "#E0E7FF" : "#DBEAFE"; // Tím nhạt (User) / Xanh nhạt (Partner)
  const avatarColor = isUser ? "#4338CA" : "#1E40AF";
  const bubbleBg = isUser ? "#F3F4F6" : "white"; // Xám nhạt (User) / Trắng (Partner)
  
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", alignSelf: align, flexDirection: isUser ? "row" : "row-reverse" }}>
      {/* Avatar */}
      <div style={{
        width: "36px", height: "36px", borderRadius: "50%",
        background: avatarBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "16px", fontWeight: 600, color: avatarColor,
        overflow: "hidden", flexShrink: 0
      }}>
        {isUser ? (
          // Khách hàng (User) - không có avatar, chỉ có chữ cái đầu
          (name.charAt(0) || "K").toUpperCase()
        ) : (
          // Nhà xe (Partner) - có avatar
          (avatar && !avatarError) ? (
            <img src={avatar} alt="Nhà xe" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setAvatarError && setAvatarError(true)} />
          ) : (
            (name.charAt(0) || "N").toUpperCase()
          )
        )}
      </div>
      
      {/* Nội dung tin nhắn */}
      <div style={{ 
        background: bubbleBg,
        border: "1px solid #E5E7EB",
        borderRadius: "12px",
        padding: "12px 16px",
        maxWidth: "450px"
      }}>
        {/* Header (Tên + Ngày) */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <span style={{ fontWeight: 600, fontSize: "14px", color: "#1F2937" }}>{name}</span>
          <span style={{ fontSize: "12px", color: "#9CA3AF" }}>{date}</span>
        </div>
        
        {/* Rating (nếu có) */}
        {rating && rating > 0 && (
          <div style={{ display: "flex", gap: "2px", marginBottom: "8px" }}>
            {Array.from({ length: 5 }, (_, idx) => (
              <span key={idx} style={{ fontSize: "16px", color: idx < rating ? "#FBBF24" : "#D1D5DB" }}>★</span>
            ))}
          </div>
        )}
        
        {/* Text (nếu có) */}
        {text && (
          <p style={{ fontSize: "14px", color: "#374151", margin: 0, whiteSpace: "pre-wrap" }}>
            {text}
          </p>
        )}
        
        {/* Ảnh (nếu có) */}
        {imageUrl && (
          <img 
            src={imageUrl} 
            alt="Attachment" 
            style={{
              marginTop: text ? "12px" : 0,
              borderRadius: "8px",
              maxWidth: "100%",
              maxHeight: "250px",
              objectFit: "cover",
              border: "1px solid #E5E7EB"
            }} 
          />
        )}
      </div>
    </div>
  );
}