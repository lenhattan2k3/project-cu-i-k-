// File: src/home/components/PartnerReview.tsx
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { auth } from "../../firebase/config";
import {
  getReviewByPartnerId,
  partnerReply,
  deleteReview,
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
  const [partnerName, setPartnerName] = useState<string>("Nhà xe");
  const [partnerAvatar, setPartnerAvatar] = useState<string>("");
  const [avatarError, setAvatarError] = useState(false);
  
  const [reviews, setReviews] = useState<ReviewEx[]>([]);
  const [loading, setLoading] = useState(true);

  const [inputMap, setInputMap] = useState<Record<string, string>>({});
  const [fileMap, setFileMap] = useState<Record<string, File | null>>({});
  const [previewMap, setPreviewMap] = useState<Record<string, string>>({});
  const [sendingMap, setSendingMap] = useState<Record<string, boolean>>({});
  const [deletingMap, setDeletingMap] = useState<Record<string, boolean>>({});

  const mountedRef = useRef(true);
  const chatEndRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // ----------------------------------------------------------------
  // ----- LOGIC STATE VÀ API ĐƯỢC GIỮ NGUYÊN -----
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
      setPartnerName(u?.displayName || "Nhà xe");
      setPartnerAvatar(u?.photoURL || "");
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

  const handleDeleteReview = async (reviewId: string) => {
    const confirmed = window.confirm("Xoá hoàn toàn đánh giá này?");
    if (!confirmed) return;

    setDeletingMap((prev) => ({ ...prev, [reviewId]: true }));
    try {
      await deleteReview(reviewId);
      setReviews((prev) => prev.filter((review) => review._id !== reviewId));
    } catch (error) {
      console.error(error);
      alert("Không thể xoá đánh giá. Vui lòng thử lại.");
    } finally {
      setDeletingMap((prev) => {
        const next = { ...prev };
        delete next[reviewId];
        return next;
      });
    }
  };

  const sendMsg = async (reviewId: string) => {
    const text = (inputMap[reviewId] || "").trim();
    const file = fileMap[reviewId];
    if (!text && !file) return alert("Nhập nội dung hoặc chọn ảnh!");

    const tempMessage: Message = {
      sender: "partner",
      senderName: partnerName,
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
  // ----- GIAO DIỆN ĐƯỢC THIẾT KẾ LẠI -----
  // ----------------------------------------------------------------

  if (!partnerId)
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#F3F4F6" }}>
        <div style={{ textAlign: "center", padding: "40px", background: "white", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔐</div>
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#1F2937", marginBottom: "8px" }}>Yêu cầu đăng nhập</h2>
          <p style={{ color: "#6B7280", fontSize: "16px" }}>Vui lòng đăng nhập tài khoản đối tác để xem đánh giá.</p>
        </div>
      </div>
    );

  return (
    <div style={{ background: "#F3F4F6", padding: "32px", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      {/* Page Header */}
      <div style={{ maxWidth: "1200px", margin: "0 auto 24px auto" }}>
        <h1 style={{ fontSize: "30px", fontWeight: 800, color: "#111827", margin: 0, letterSpacing: "-0.025em" }}>
          Đánh giá & Phản hồi
        </h1>
        <p style={{ fontSize: "16px", color: "#6B7280", marginTop: "8px" }}>
          Xem và trả lời các đánh giá từ khách hàng của bạn.
        </p>
      </div>

      {/* Content Area */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px" }}>
          <div className="animate-spin" style={{ display: "inline-block", width: "32px", height: "32px", border: "3px solid #E5E7EB", borderTopColor: "#3B82F6", borderRadius: "50%" }}></div>
          <p style={{ marginTop: "16px", color: "#6B7280" }}>Đang tải dữ liệu...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div style={{ background: "white", borderRadius: "16px", padding: "60px", maxWidth: "600px", margin: "40px auto", textAlign: "center", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)" }}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>📝</div>
          <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>Chưa có đánh giá nào</h3>
          <p style={{ color: "#6B7280" }}>Hiện tại chưa có khách hàng nào để lại đánh giá cho dịch vụ của bạn.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1200px", margin: "0 auto" }}>
          {reviews.map((r: ReviewEx) => {
            if (!r || !r._id) return null;
            const id = r._id;
            const messages = r.messages || [];
            const sending = sendingMap[id] || false;

            return (
              <div key={id} style={{ 
                position: "relative",
                display: "grid", 
                gridTemplateColumns: "300px 1fr", 
                background: "white", 
                borderRadius: "16px", 
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                border: "1px solid #E5E7EB",
                overflow: "hidden",
                minHeight: "400px"
              }}>

                <button
                  onClick={() => handleDeleteReview(id)}
                  disabled={deletingMap[id]}
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    border: "none",
                    borderRadius: "999px",
                    padding: "6px 14px",
                    background: deletingMap[id] ? "#F87171" : "#DC2626",
                    color: "white",
                    fontWeight: 600,
                    fontSize: "12px",
                    letterSpacing: "0.02em",
                    cursor: deletingMap[id] ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 10px rgba(220,38,38,0.25)",
                  }}
                >
                  {deletingMap[id] ? "Đang xoá..." : "Xoá đánh giá"}
                </button>
                
                {/* LEFT COLUMN: REVIEW DETAILS */}
                <div style={{ padding: "24px", borderRight: "1px solid #F3F4F6", background: "#FAFAFA" }}>
                  <div style={{ marginBottom: "20px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Chuyến xe</span>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", margin: "4px 0 0 0", lineHeight: "1.4" }}>
                      {r.tenChuyen || "Chuyến đi không tên"}
                    </h3>
                  </div>
                  
                  <div style={{ marginBottom: "24px" }}>
                    <StarRating rating={r.rating ?? 0} />
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <DetailItem label="Khách hàng" value={r.hoTen || "Ẩn danh"} icon="👤" />
                    <DetailItem label="Số điện thoại" value={r.sdt || "---"} icon="📞" />
                    <DetailItem label="Số ghế" value={(r.soGhe || []).join(", ") || "---"} icon="💺" />
                    <DetailItem label="Tổng tiền" value={r.totalPrice ? `${r.totalPrice.toLocaleString("vi-VN")}đ` : "---"} icon="💰" />
                  </div>
                </div>
                
                {/* RIGHT COLUMN: CONVERSATION */}
                <div style={{ display: "flex", flexDirection: "column", height: "100%", maxHeight: "600px" }}>
                  
                  {/* Chat History */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px", background: "#FFFFFF" }}>
                    {messages.length === 0 ? (
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#9CA3AF", opacity: 0.8 }}>
                        <div style={{ fontSize: "40px", marginBottom: "12px" }}>💬</div>
                        <p>Chưa có nội dung phản hồi.</p>
                      </div>
                    ) : (
                      messages.map((m: Message, i: number) => {
                        const isPartner = m.sender === "partner";
                        const key = (m as any)._id || (m as any).tempId || `${id}-msg-${i}-${m.createdAt}`;

                        return (
                          <ChatBubble
                            key={key}
                            isUser={!isPartner}
                            avatar={isPartner ? partnerAvatar : undefined}
                            avatarError={avatarError}
                            setAvatarError={setAvatarError}
                            name={m.senderName || (isPartner ? partnerName : "Khách hàng")}
                            date={fmtDate(m.createdAt)}
                            text={m.text}
                            imageUrl={m.imageUrl}
                            rating={i === 0 && !isPartner ? r.rating : undefined} 
                          />
                        );
                      })
                    )}
                    <div ref={(el) => { chatEndRefs.current[id] = el; }} />
                  </div>

                  {/* Input Area */}
                  <div style={{ padding: "16px 24px", borderTop: "1px solid #F3F4F6", background: "#FAFAFA" }}>
                    <div style={{ position: "relative" }}>
                      {previewMap[id] && (
                        <div style={{ position: "absolute", bottom: "100%", left: 0, marginBottom: "12px", background: "white", padding: "8px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", border: "1px solid #E5E7EB" }}>
                          <img src={previewMap[id]} alt="preview" style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px" }} />
                          <button 
                            onClick={() => removeFile(id)} 
                            style={{ position: "absolute", top: "-8px", right: "-8px", background: "#EF4444", color: "white", borderRadius: "50%", width: "24px", height: "24px", border: "2px solid white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "bold" }}
                          >
                            ✕
                          </button>
                        </div>
                      )}
                      
                      <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                        <label 
                          htmlFor={`file-partner-${id}`} 
                          style={{ 
                            cursor: sending ? "not-allowed" : "pointer",
                            padding: "10px",
                            borderRadius: "10px",
                            background: "#F3F4F6",
                            color: "#6B7280",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.2s"
                          }}
                          title="Đính kèm ảnh"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                        </label>
                        <input id={`file-partner-${id}`} type="file" accept="image/*" onChange={(e) => handleFile(e, id)} disabled={sending} style={{ display: "none" }} />
                        
                        <textarea
                          value={inputMap[id] || ""}
                          onChange={(e) => setInputMap((p) => ({ ...p, [id]: e.target.value }))}
                          placeholder="Nhập nội dung phản hồi..."
                          disabled={sending}
                          style={{
                            flex: 1,
                            minHeight: "44px",
                            maxHeight: "120px",
                            padding: "12px 16px",
                            borderRadius: "12px",
                            border: "1px solid #E5E7EB",
                            fontSize: "14px",
                            lineHeight: "1.5",
                            resize: "none",
                            outline: "none",
                            background: "white",
                            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendMsg(id);
                            }
                          }}
                        />
                        
                        <button
                          onClick={() => sendMsg(id)}
                          disabled={sending || (!(inputMap[id] || "").trim() && !fileMap[id])}
                          style={{
                            padding: "10px 20px",
                            borderRadius: "10px",
                            border: "none",
                            background: sending ? "#9CA3AF" : "#2563EB",
                            color: "white",
                            fontWeight: 600,
                            fontSize: "14px",
                            cursor: (sending || (!inputMap[id]?.trim() && !fileMap[id])) ? "not-allowed" : "pointer",
                            transition: "background 0.2s",
                            height: "44px"
                          }}
                        >
                          {sending ? "..." : "Gửi"}
                        </button>
                      </div>
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

// ---------- Sub-components ----------

const DetailItem = ({ label, value, icon }: { label: string; value: React.ReactNode; icon: string }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
    <span style={{ fontSize: "16px", lineHeight: "1" }}>{icon}</span>
    <div>
      <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: "2px" }}>{label}</div>
      <div style={{ fontSize: "14px", fontWeight: 600, color: "#1F2937" }}>{value}</div>
    </div>
  </div>
);

const StarRating = ({ rating }: { rating: number }) => (
  <div style={{ display: "inline-flex", alignItems: "center", background: "#FFF7ED", padding: "6px 12px", borderRadius: "8px", border: "1px solid #FED7AA" }}>
    <div style={{ display: "flex", gap: "2px", marginRight: "8px" }}>
      {Array.from({ length: 5 }, (_, idx) => (
        <svg key={idx} width="16" height="16" viewBox="0 0 24 24" fill={idx < rating ? "#F59E0B" : "none"} stroke={idx < rating ? "#F59E0B" : "#D1D5DB"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      ))}
    </div>
    <span style={{ fontSize: "14px", fontWeight: 700, color: "#9A3412" }}>{rating}.0</span>
  </div>
);

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
  
  const bubbleStyle = isUser 
    ? { bg: "#F3F4F6", color: "#1F2937", border: "1px solid #E5E7EB", align: "flex-start" }
    : { bg: "#EFF6FF", color: "#1E3A8A", border: "1px solid #DBEAFE", align: "flex-end" };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: bubbleStyle.align, width: "100%" }}>
      <div style={{ display: "flex", gap: "12px", flexDirection: isUser ? "row" : "row-reverse", maxWidth: "85%" }}>
        {/* Avatar */}
        <div style={{
          width: "32px", height: "32px", borderRadius: "50%",
          background: isUser ? "#E5E7EB" : "#BFDBFE",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "14px", fontWeight: 700, color: isUser ? "#4B5563" : "#1D4ED8",
          overflow: "hidden", flexShrink: 0, border: "1px solid white", boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
        }}>
          {isUser ? (
            (name.charAt(0) || "K").toUpperCase()
          ) : (
            (avatar && !avatarError) ? (
              <img src={avatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setAvatarError && setAvatarError(true)} />
            ) : (
              (name.charAt(0) || "N").toUpperCase()
            )
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: bubbleStyle.align }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", fontSize: "12px" }}>
            <span style={{ fontWeight: 600, color: "#374151" }}>{name}</span>
            <span style={{ color: "#9CA3AF" }}>{date}</span>
          </div>

          <div style={{ 
            background: bubbleStyle.bg,
            border: bubbleStyle.border,
            borderRadius: isUser ? "0 12px 12px 12px" : "12px 0 12px 12px",
            padding: "12px 16px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            position: "relative"
          }}>
            {rating && rating > 0 && (
              <div style={{ display: "flex", gap: "2px", marginBottom: "8px" }}>
                {Array.from({ length: 5 }, (_, idx) => (
                  <span key={idx} style={{ fontSize: "14px", color: idx < rating ? "#F59E0B" : "#D1D5DB" }}>★</span>
                ))}
              </div>
            )}
            
            {text && (
              <p style={{ fontSize: "14px", color: "#1F2937", margin: 0, whiteSpace: "pre-wrap", lineHeight: "1.5" }}>
                {text}
              </p>
            )}
            
            {imageUrl && (
              <div style={{ marginTop: text ? "12px" : 0 }}>
                <img 
                  src={imageUrl} 
                  alt="Gửi kèm" 
                  style={{
                    borderRadius: "8px",
                    maxWidth: "100%",
                    maxHeight: "200px",
                    objectFit: "cover",
                    border: "1px solid rgba(0,0,0,0.1)",
                    display: "block"
                  }} 
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}