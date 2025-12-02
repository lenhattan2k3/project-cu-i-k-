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
import { 
  MessageSquare, 
  Star, 
  User, 
  Phone, 
  Armchair, 
  DollarSign, 
  Send, 
  Image as ImageIcon, 
  Trash2, 
  X, 
  AlertCircle,
  Lock
} from "lucide-react";

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
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md border border-slate-100">
          <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Yêu cầu đăng nhập</h2>
          <p className="text-slate-600">Vui lòng đăng nhập tài khoản đối tác để xem đánh giá.</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <MessageSquare className="text-blue-600" />
          Đánh giá & Phản hồi
        </h1>
        <p className="text-slate-500 mt-1">
          Xem và trả lời các đánh giá từ khách hàng của bạn.
        </p>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 font-medium">Đang tải dữ liệu...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 max-w-2xl mx-auto text-center shadow-sm border border-slate-200">
          <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Chưa có đánh giá nào</h3>
          <p className="text-slate-500">Hiện tại chưa có khách hàng nào để lại đánh giá cho dịch vụ của bạn.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
          {reviews.map((r: ReviewEx) => {
            if (!r || !r._id) return null;
            const id = r._id;
            const messages = r.messages || [];
            const sending = sendingMap[id] || false;

            return (
              <div key={id} className="relative flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                
                {/* TOP SECTION: REVIEW DETAILS */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chuyến xe</span>
                      <h3 className="text-lg font-bold text-slate-900 mt-1 leading-snug">
                        {r.tenChuyen || "Chuyến đi không tên"}
                      </h3>
                      <div className="mt-2">
                        <StarRating rating={r.rating ?? 0} />
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteReview(id)}
                      disabled={deletingMap[id]}
                      className={`p-2 rounded-lg transition-colors ${deletingMap[id] ? "bg-red-100 text-red-400 cursor-not-allowed" : "bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200"}`}
                      title="Xóa đánh giá"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <DetailItem label="Khách hàng" value={r.hoTen || "Ẩn danh"} icon={<User size={16} className="text-blue-600" />} />
                    <DetailItem label="Số điện thoại" value={r.sdt || "---"} icon={<Phone size={16} className="text-emerald-600" />} />
                    <DetailItem label="Số ghế" value={(r.soGhe || []).join(", ") || "---"} icon={<Armchair size={16} className="text-amber-600" />} />
                    <DetailItem label="Tổng tiền" value={r.totalPrice ? `${r.totalPrice.toLocaleString("vi-VN")}đ` : "---"} icon={<DollarSign size={16} className="text-violet-600" />} />
                  </div>
                </div>
                
                {/* BOTTOM SECTION: CONVERSATION */}
                <div className="flex flex-col h-[500px]">
                  
                  {/* Chat History */}
                  <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-white">
                    {messages.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                        <MessageSquare size={48} className="mb-3 opacity-20" />
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
                  <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <div className="relative">
                      {previewMap[id] && (
                        <div className="absolute bottom-full left-0 mb-3 bg-white p-2 rounded-xl shadow-lg border border-slate-200 animate-in fade-in slide-in-from-bottom-2">
                          <img src={previewMap[id]} alt="preview" className="w-20 h-20 object-cover rounded-lg" />
                          <button 
                            onClick={() => removeFile(id)} 
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-sm hover:bg-red-600 transition-colors"
                          >
                            <X size={12} strokeWidth={3} />
                          </button>
                        </div>
                      )}
                      
                      <div className="flex gap-3 items-end">
                        <label 
                          htmlFor={`file-partner-${id}`} 
                          className={`
                            p-3 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all cursor-pointer shadow-sm
                            ${sending ? "opacity-50 cursor-not-allowed" : ""}
                          `}
                          title="Đính kèm ảnh"
                        >
                          <ImageIcon size={20} />
                        </label>
                        <input id={`file-partner-${id}`} type="file" accept="image/*" onChange={(e) => handleFile(e, id)} disabled={sending} className="hidden" />
                        
                        <div className="flex-1 relative">
                          <textarea
                            value={inputMap[id] || ""}
                            onChange={(e) => setInputMap((p) => ({ ...p, [id]: e.target.value }))}
                            placeholder="Nhập nội dung phản hồi..."
                            disabled={sending}
                            className="w-full min-h-[48px] max-h-[120px] py-3 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none bg-white shadow-sm text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMsg(id);
                              }
                            }}
                          />
                        </div>
                        
                        <button
                          onClick={() => sendMsg(id)}
                          disabled={sending || (!(inputMap[id] || "").trim() && !fileMap[id])}
                          className={`
                            h-[48px] px-6 rounded-xl font-semibold text-white shadow-sm flex items-center gap-2 transition-all
                            ${sending || (!inputMap[id]?.trim() && !fileMap[id]) 
                              ? "bg-slate-300 cursor-not-allowed" 
                              : "bg-blue-600 hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5"}
                          `}
                        >
                          {sending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={18} />}
                          <span className="hidden sm:inline">{sending ? "Gửi..." : "Gửi"}</span>
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

const DetailItem = ({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 p-1.5 bg-white rounded-lg border border-slate-100 shadow-sm text-slate-500">
      {icon}
    </div>
    <div>
      <div className="text-xs text-slate-500 mb-0.5">{label}</div>
      <div className="text-sm font-semibold text-slate-800">{value}</div>
    </div>
  </div>
);

const StarRating = ({ rating }: { rating: number }) => (
  <div className="inline-flex items-center bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
    <div className="flex gap-0.5 mr-2">
      {Array.from({ length: 5 }, (_, idx) => (
        <Star 
          key={idx} 
          size={16} 
          className={idx < rating ? "fill-amber-400 text-amber-400" : "text-slate-200"} 
        />
      ))}
    </div>
    <span className="text-sm font-bold text-amber-700">{rating}.0</span>
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
  
  return (
    <div className={`flex flex-col w-full ${isUser ? "items-start" : "items-end"}`}>
      <div className={`flex gap-3 max-w-[85%] ${isUser ? "flex-row" : "flex-row-reverse"}`}>
        {/* Avatar */}
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border border-white shadow-sm overflow-hidden
          ${isUser ? "bg-slate-200 text-slate-600" : "bg-blue-100 text-blue-600"}
        `}>
          {isUser ? (
            (name.charAt(0) || "K").toUpperCase()
          ) : (
            (avatar && !avatarError) ? (
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" onError={() => setAvatarError && setAvatarError(true)} />
            ) : (
              (name.charAt(0) || "N").toUpperCase()
            )
          )}
        </div>

        <div className={`flex flex-col ${isUser ? "items-start" : "items-end"}`}>
          <div className="flex items-center gap-2 mb-1 text-xs">
            <span className="font-semibold text-slate-700">{name}</span>
            <span className="text-slate-400">{date}</span>
          </div>

          <div className={`
            p-4 shadow-sm relative
            ${isUser 
              ? "bg-white border border-slate-100 rounded-r-2xl rounded-bl-2xl text-slate-800" 
              : "bg-blue-50 border border-blue-100 rounded-l-2xl rounded-br-2xl text-slate-800"}
          `}>
            {rating && rating > 0 && (
              <div className="flex gap-0.5 mb-2">
                {Array.from({ length: 5 }, (_, idx) => (
                  <Star key={idx} size={12} className={idx < rating ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
                ))}
              </div>
            )}
            
            {text && (
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {text}
              </p>
            )}
            
            {imageUrl && (
              <div className={text ? "mt-3" : ""}>
                <img 
                  src={imageUrl} 
                  alt="Gửi kèm" 
                  className="rounded-lg max-w-full max-h-[200px] object-cover border border-black/5"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}