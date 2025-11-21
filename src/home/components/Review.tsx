// File: src/home/components/Review.tsx
import React, { useEffect, useRef, useState, type ChangeEvent } from "react";
import { auth } from "../../firebase/config";
import {
  getReviewByUserId,
  deleteReview,
  userReply,
  type Review,
  type Message,
} from "../../api/reviewApi";
import { uploadToCloudinary } from "../../api/uploadToCloudinary";
import { socket } from "../../utils/socket";
import type { AxiosError } from "axios";

// ---------- Types ----------
// (Không thay đổi)
interface Trip {
  tenChuyen: string;
  tuTinh?: string;
  denTinh?: string;
  nhaXe?: string;
  ngayKhoiHanh?: string;
  gioKhoiHanh?: string;
}
interface Booking {
  _id: string;
  tripId?: Trip;
  hoTen?: string;
  sdt?: string;
  email?: string;
  soGhe: number[];
  diemDonChiTiet?: string;
  diemTraChiTiet?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  qrCode?: string;
  seatPrice?: number;
  totalPrice: number;
  finalTotal?: number;
  createdAt?: string;
}
interface ReviewType extends Omit<Review, "createdAt"> {
  booking?: Booking;
  messages?: Message[];
  reply?: string;
  tenChuyen?: string;
  hoTen?: string;
  sdt?: string;
  ngayKhoiHanh?: string;
  gioKhoiHanh?: string;
  soGhe?: number[];
  totalPrice?: number;
  createdAt?: string;
}

// ---------- Utils ----------
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleString("vi-VN", { timeStyle: "short", dateStyle: "short" }) : "");

// ---------- Component ----------
export default function Review(): React.ReactElement {
  const [uid, setUid] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [userAvatar, setUserAvatar] = useState<string>("");
  const [avatarError, setAvatarError] = useState(false);
  const [reviews, setReviews] = useState<ReviewType[]>([]);
  const [loading, setLoading] = useState(true);

  // per-review state maps
  const [inputMap, setInputMap] = useState<Record<string, string>>({});
  const [fileMap, setFileMap] = useState<Record<string, File | null>>({});
  const [previewMap, setPreviewMap] = useState<Record<string, string>>({});
  const [sendingMap, setSendingMap] = useState<Record<string, boolean>>({});

  const mountedRef = useRef(true);

  // ----------------------------------------------------------------
  // ----- TOÀN BỘ LOGIC STATE VÀ API ĐƯỢC GIỮ NGUYÊN HOÀN TOÀN -----
  // ----------------------------------------------------------------

  // register auth user & socket
  useEffect(() => {
    mountedRef.current = true;
    const unsub = auth.onAuthStateChanged((user) => {
      setUid(user ? user.uid : null);
      setDisplayName(user?.displayName || user?.email || "Người dùng");
      setUserAvatar(user?.photoURL || "");
      setAvatarError(false);

      if (user && socket && socket.connected) {
        socket.emit("registerUser", user.uid);
      }
    });

    const onReviewUpdated = (review: ReviewType) => {
      if (!mountedRef.current || !review?._id) {
        console.warn("Socket 'onReviewUpdated' received invalid review:", review);
        return;
      }
      setReviews((prev) =>
        prev.map((r) =>
          r._id === review._id ? { ...r, ...review } : r
        )
      );
    };

    if (socket) {
      socket.on("review:updated", onReviewUpdated);
      socket.on("review:newMessage", onReviewUpdated);
    }

    return () => {
      mountedRef.current = false;
      unsub();
      if (socket) {
        socket.off("review:updated", onReviewUpdated);
        socket.off("review:newMessage", onReviewUpdated);
      }
      Object.values(previewMap).forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fetch reviews when uid changes
  useEffect(() => {
    if (!uid) return;
    (async () => {
      setLoading(true);
      try {
        const data = await getReviewByUserId(uid);
        if (!mountedRef.current) return;
        setReviews(data || []);
      } catch (err) {
        console.error("Lỗi tải review:", err);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
  }, [uid]);

  // ---------- Helpers ----------
  const handleDelete = async (id?: string, reviewUserId?: string) => {
    if (!id) return alert("ID không hợp lệ");
    if (uid !== reviewUserId) return alert("Bạn không có quyền xóa review này.");
    if (!window.confirm("Bạn chắc chắn muốn xóa review này?")) return;
    try {
      await deleteReview(id);
      setReviews((prev) => prev.filter((r) => r._id !== id));
      alert("Đã xóa.");
    } catch (err) {
      console.error(err);
      alert("Lỗi khi xóa.");
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, reviewId: string) => {
    const f = e.target.files ? e.target.files[0] : null;
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      alert("Chỉ cho phép ảnh dưới 10MB.");
      e.currentTarget.value = "";
      return;
    }
    const old = previewMap[reviewId];
    if (old) URL.revokeObjectURL(old);
    const preview = URL.createObjectURL(f);
    setFileMap((p) => ({ ...p, [reviewId]: f }));
    setPreviewMap((p) => ({ ...p, [reviewId]: preview }));
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

  const handleRemoveFile = (reviewId: string) => {
    if (sendingMap[reviewId]) return;
    const prev = previewMap[reviewId];
    if (prev) URL.revokeObjectURL(prev);
    clearFileState(reviewId);
  };

  const handleSend = async (reviewId?: string) => {
    if (!reviewId) return;
    if (sendingMap[reviewId]) return;
    const text = (inputMap[reviewId] || "").trim();
    const file = fileMap[reviewId] || null;
    if (!text && !file) {
      return alert("Nhập nội dung hoặc chọn ảnh trước khi gửi.");
    }

    const tempMessage: Message = {
      sender: "user",
      senderName: displayName || "Bạn",
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
    clearFileState(reviewId as string);

    setSendingMap((p) => ({ ...p, [reviewId]: true }));
    try {
      let imageUrl: string | undefined = undefined;
      if (fileToUpload) {
        const uploaded = await uploadToCloudinary(fileToUpload);
        if (!uploaded) {
          throw new Error("Upload ảnh thất bại");
        }
        imageUrl = uploaded;
      }
      const updatedReview = await userReply(
        reviewId,
        text,
        imageUrl,
        uid || undefined,
        displayName || undefined
      );
      if (!updatedReview) throw new Error("Update failed");
      setReviews((prev) =>
        prev.map((r) =>
          r._id === reviewId ? { ...r, ...updatedReview } : r
        )
      );
      socket?.emit("review:newMessage", updatedReview);
    } catch (err) {
      console.error("Lỗi khi gửi phản hồi:", err);
      alert("Lỗi khi gửi phản hồi.");
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

  if (!uid) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#555" }}>
        ⚠️ Vui lòng đăng nhập để xem lịch sử đánh giá.
      </div>
    );
  }

  return (
    <div style={{ background: "#F9FAFB", padding: "24px", minHeight: "100vh" }}>
      
      {/* Header */}
      <div style={{ maxWidth: "1100px", margin: "0 auto 32px auto" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#111827", margin: 0 }}>
          Đánh giá chuyến đi của bạn
        </h1>
        <p style={{ fontSize: "16px", color: "#6B7280", marginTop: "8px" }}>
          Chia sẻ trải nghiệm của bạn để giúp chúng tôi và nhà xe cải thiện dịch vụ.
        </p>
      </div>

      {/* Loading / Empty States */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>Đang tải...</div>
      ) : reviews.length === 0 ? (
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "48px", maxWidth: 720, margin: "30px auto", textAlign: "center" }}>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#374151" }}>Bạn chưa có đánh giá</h3>
          <p style={{ marginTop: 8, color: "#6b7280" }}>Khi bạn đánh giá chuyến đi, nó sẽ hiển thị ở đây.</p>
        </div>
      ) : (
        
        // List of Reviews
        <div style={{ display: "flex", flexDirection: "column", gap: "32px", maxWidth: "1100px", margin: "0 auto" }}>
          {reviews.map((r) => {
            const id = r._id!;
            if (!id) return null;
            
            const b = r.booking;
            const tenChuyen = b?.tripId?.tenChuyen || r.tenChuyen || "Chuyến đi";
            const hoTen = b?.hoTen || r.hoTen || "";
            const sdt = b?.sdt || r.sdt || "";
            const ngayKhoiHanh = b?.tripId?.ngayKhoiHanh || r.ngayKhoiHanh || "";
            const gioKhoiHanh = b?.tripId?.gioKhoiHanh || r.gioKhoiHanh || "";
            
            const isSending = sendingMap[id] || false;
            const messages = r.messages || [];

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
                  <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginTop: 0, marginBottom: "20px" }}>
                    Chi tiết chuyến đi
                  </h3>
                  
                  {/* Map Placeholder */}
                  <div style={{ 
                    height: "150px", 
                    background: "#E5E7EB", 
                    borderRadius: "8px", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    color: "#9CA3AF",
                    fontSize: "14px",
                    marginBottom: "20px",
                    backgroundImage: "url('https://i.imgur.com/3Z0A1hG.png')", // Ảnh map placeholder
                    backgroundSize: "cover"
                  }}>
                    {/* (Map) */}
                  </div>
                  
                  {/* Thông tin chi tiết */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <SmallInfo label="Nhà xe" value={tenChuyen} />
                    <SmallInfo label="Hành khách" value={hoTen} />
                    <SmallInfo label="SĐT" value={sdt} />
                    <SmallInfo label="Lộ trình" value={`${b?.tripId?.tuTinh || "..."} -- ${b?.tripId?.denTinh || "..."}`} />
                    <SmallInfo label="Khởi hành" value={`${gioKhoiHanh} - ${ngayKhoiHanh}`} />
                    <SmallInfo label="Mã vé" value={r.bookingId} />
                    {/* Bạn có thể thêm "Trạng thái" nếu có data */}
                  </div>
                </div>

                {/* --------------------- */}
                {/* CỘT BÊN PHẢI (CHAT) */}
                {/* --------------------- */}
                <div style={{ display: "flex", flexDirection: "column", maxHeight: "700px" }}>
                  
                  {/* Khu vực scroll tin nhắn */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                    
                    {/* Review gốc của user */}
                    <ChatBubble
                      key={`${id}-original`}
                      avatar={userAvatar}
                      avatarError={avatarError}
                      setAvatarError={setAvatarError}
                      name={displayName}
                      date={fmtDate(r.createdAt)}
                      text={r.comment}
                      rating={r.rating}
                      isUser={true}
                    />
                    
                    {/* Trả lời (legacy) của nhà xe */}
                    {r.reply && (
                       <ChatBubble
                        key={`${id}-legacy-reply`}
                        name={"Nhà xe"}
                        date={""} // không có data ngày
                        text={r.reply}
                        isUser={false}
                      />
                    )}
                    
                    {/* Cuộc trò chuyện (messages) */}
                    {messages.map((m, idx) => {
                      const isUser = m.sender === "user";
                      return (
                        <ChatBubble
                          key={(m as any)._id || `${id}-msg-${idx}`}
                          avatar={isUser ? userAvatar : undefined} // Chỉ user mới có avatar
                          avatarError={avatarError}
                          setAvatarError={setAvatarError}
                          name={m.senderName || (isUser ? displayName : "Nhà xe")}
                          date={fmtDate(m.createdAt)}
                          text={m.text}
                          imageUrl={m.imageUrl}
                          isUser={isUser}
                        />
                      );
                    })}
                  </div>

                  {/* Khu vực Input */}
                  <div style={{ borderTop: "1px solid #E5E7EB", padding: "16px", background: "#F9FAFB" }}>
                    {/* Textarea */}
                    <textarea 
                      value={inputMap[id] ?? ""} 
                      onChange={(e) => setInputMap((p) => ({ ...p, [id]: e.target.value }))} 
                      placeholder="Viết phản hồi của bạn..." 
                      disabled={isSending} 
                      style={{ 
                        width: "100%", 
                        minHeight: "80px", 
                        padding: "12px 16px", 
                        borderRadius: "8px", 
                        border: "1px solid #D1D5DB", 
                        boxSizing: "border-box", 
                        resize: "vertical", 
                        fontSize: "14px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                      }} 
                    />
                    
                    {/* Preview ảnh */}
                    {previewMap[id] && (
                       <div style={{ marginTop: "12px", position: "relative", display: "inline-block" }}>
                         <img src={previewMap[id]} alt="preview" style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px", border: "1px solid #E5E7EB" }} />
                         <button 
                           onClick={() => handleRemoveFile(id)} 
                           disabled={isSending}
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
                        htmlFor={`file-${id}`} 
                        style={{ 
                          cursor: isSending ? "not-allowed" : "pointer",
                          padding: "8px",
                          borderRadius: "6px"
                        }}
                        title="Đính kèm ảnh"
                      >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.5 10.625V13.125C17.5 15.334 15.834 17.0833 13.75 17.0833C11.666 17.0833 10 15.334 10 13.125V6.875C10 5.54167 8.95833 4.5 7.70833 4.5C6.45833 4.5 5.41667 5.54167 5.41667 6.875V12.5C5.41667 13.125 5.875 13.75 6.45833 13.75C7.04167 13.75 7.5 13.125 7.5 12.5V7.5H8.75V12.5C8.75 13.875 7.75 15 6.45833 15C5.16667 15 4.16667 13.875 4.16667 12.5V6.875C4.16667 4.875 5.75 3.20833 7.70833 3.20833C9.66667 3.20833 11.25 4.875 11.25 6.875V13.125C11.25 16.0417 13.9583 18.3333 16.25 18.3333C18.5417 18.3333 20 16.0417 20 13.125V10.625H17.5Z" fill={isSending ? "#9CA3AF" : "#6B7280"}/>
                        </svg>
                      </label>
                      <input id={`file-${id}`} type="file" accept="image/*" onChange={(e) => handleFileChange(e, id)} disabled={isSending} style={{ display: "none" }} />
                      
                      {/* Nút gửi */}
                      <button 
                        onClick={() => handleSend(id)} 
                        disabled={isSending || (!(inputMap[id] || "").trim() && !fileMap[id])}
                        style={{
                          padding: "10px 16px",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "white",
                          background: isSending ? "#9CA3AF" : "#2563EB",
                          border: "none",
                          borderRadius: "8px",
                          cursor: (isSending || (!inputMap[id]?.trim() && !fileMap[id])) ? "not-allowed" : "pointer",
                          opacity: (isSending || (!inputMap[id]?.trim() && !fileMap[id])) ? 0.7 : 1
                        }}
                      >
                        {isSending ? "Đang gửi..." : "Gửi Phản hồi"}
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

// Component render chi tiết (Nhà xe, Lộ trình...)
function SmallInfo({ label, value }: { label: string; value: any }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontWeight: 600, color: "#1F2937", fontSize: "14px" }}>{value}</div>
    </div>
  );
}

// Component render 1 bong bóng chat
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
  
  const align = isUser ? "flex-end" : "flex-start";
  const avatarBg = isUser ? "#DBEAFE" : "#E0E7FF"; // Xanh nhạt (User) / Tím nhạt (Partner)
  const avatarColor = isUser ? "#1E40AF" : "#4338CA";
  const bubbleBg = isUser ? "white" : "#F3F4F6"; // Trắng (User) / Xám nhạt (Partner)
  
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", alignSelf: align, flexDirection: isUser ? "row-reverse" : "row" }}>
      {/* Avatar */}
      <div style={{
        width: "36px", height: "36px", borderRadius: "50%",
        background: avatarBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "16px", fontWeight: 600, color: avatarColor,
        overflow: "hidden", flexShrink: 0
      }}>
        {isUser ? (
          (avatar && !avatarError) ? (
            <img src={avatar} alt="Bạn" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setAvatarError && setAvatarError(true)} />
          ) : (
            (name.charAt(0) || "B").toUpperCase()
          )
        ) : (
          (name.charAt(0) || "N").toUpperCase()
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