// File: src/home/ReviewStory.tsx
import { useEffect, useState } from "react";
import { auth, db } from "../../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import {
  getReviewByUserId,
  getReviewByPartnerId,
  deleteReview,
  partnerReply,
  userReply,
  addReview,
} from "../../api/reviewApi";
import { getBookingById } from "../../api/bookingApi";
import type { Review } from "../../api/reviewApi";

// --- Message interface
interface Message {
  sender: "user" | "partner";
  senderName?: string;
  text: string;
  createdAt?: string;
}

// --- Review type frontend
interface ReviewType extends Omit<Review, "createdAt"> {
  messages?: Message[];
  tenChuyen?: string;
  hoTen?: string;
  sdt?: string;
  createdAt?: string;
}

// --- Form state
interface ReviewForm {
  bookingId: string;
  rating: number;
  comment: string;
}

// --- Format date safe
const fmtDate = (d?: string | Date) =>
  d ? new Date(d).toLocaleString("vi-VN") : "";

export default function ReviewStory() {
  const [uid, setUid] = useState<string | null>(null);
  const [role, setRole] = useState<"user" | "partner" | "admin" | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [reviews, setReviews] = useState<ReviewType[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputMap, setInputMap] = useState<Record<string, string>>({});

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ReviewForm>({
    bookingId: "",
    rating: 5,
    comment: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // --- Firebase auth listener
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        setUid(null);
        setRole(null);
        setDisplayName("");
        return;
      }
      setUid(u.uid);
      try {
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setRole((data.role as any) || "user");
          setDisplayName(data.name || data.displayName || u.email || "Người dùng");
        } else {
          setRole("user");
          setDisplayName(u.displayName || u.email || "Người dùng");
        }
      } catch (err) {
        console.error("Lỗi lấy profile:", err);
        setRole("user");
        setDisplayName(u.displayName || u.email || "Người dùng");
      }
    });
    return () => unsub();
  }, []);

  // --- Load reviews theo role
  useEffect(() => {
    if (!uid || !role) return;

    const fetch = async () => {
      setLoading(true);
      try {
        let res: ReviewType[] | undefined;
        if (role === "partner") {
          res = await getReviewByPartnerId(uid);
        } else {
          res = await getReviewByUserId(uid);
        }
        setReviews(res || []);
      } catch (err) {
        console.error("Lỗi tải reviews:", err);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [uid, role]);

  // --- Form open/close
  const handleOpenForm = (bookingId: string = "") => {
    setForm({ bookingId, rating: 5, comment: "" });
    setShowForm(true);
  };
  const handleCloseForm = () => setShowForm(false);

  // --- Submit new review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bookingId.trim()) return alert("Vui lòng nhập mã vé");
    if (!form.comment.trim()) return alert("Vui lòng nhập nhận xét");
    if (form.rating < 1 || form.rating > 5) return alert("Đánh giá phải từ 1 đến 5 sao");

    setSubmitting(true);
    try {
      const booking = await getBookingById(form.bookingId);
      if (!booking) {
        alert("Mã vé không hợp lệ hoặc không tìm thấy booking.");
        setSubmitting(false);
        return;
      }
console.log("FE (React) đang gửi bookingId:", form.bookingId);
      const newReview = await addReview({
        bookingId: form.bookingId,
        userId: uid || "",
        tripId: booking.tripId || "",
        partnerId: booking.partnerId || "",
        rating: form.rating,
        comment: form.comment,
        hoTen: displayName,
        sdt: booking.sdtUser || "",
        tenChuyen: booking.tenChuyen || "",
        ngayKhoiHanh: booking.ngayKhoiHanh || "",
        gioKhoiHanh: booking.gioKhoiHanh || "",
        soGhe: booking.soGhe || [],
        totalPrice: booking.totalPrice || 0,
        tu: booking.tu || "",
        den: booking.den || "",
      });

      if (newReview) {
        setReviews([newReview, ...reviews]);
        handleCloseForm();
        alert("✅ Đánh giá thành công!");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Lỗi khi gửi đánh giá");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Delete review
  const handleDelete = async (id?: string, reviewUserId?: string) => {
    if (!id) return alert("ID không hợp lệ");
    if (!(uid === reviewUserId || role === "admin")) return alert("Bạn không có quyền xóa review này.");
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

  // --- Send reply
  const handleSend = async (reviewId?: string) => {
    if (!reviewId) return;
    const text = (inputMap[reviewId] || "").trim();
    if (!text) return alert("Nhập nội dung trước khi gửi.");

    try {
      let updated: ReviewType | undefined;
      if (role === "partner") {
        updated = await partnerReply(reviewId, text, undefined, uid || undefined, displayName || undefined);
      } else {
        updated = await userReply(reviewId, text, undefined, uid || undefined, displayName || undefined);
      }

      if (!updated) throw new Error("Update failed");
      setReviews((prev) => prev.map((r) => (r._id === reviewId ? updated : r)));
      setInputMap((p) => ({ ...p, [reviewId]: "" }));
    } catch (err) {
      console.error(err);
      alert("Lỗi khi gửi.");
    }
  };

  if (!uid) return <div style={{ padding: 20 }}>⚠️ Vui lòng đăng nhập để xem/ trả lời phản hồi.</div>;

  return (
    <div style={{ padding: 20, background: "#f9fafb", minHeight: "100vh" }}>
      <h2>🗨️ Hộp thoại đánh giá — {role === "partner" ? "Partner view" : "User view"}</h2>

      {/* Button add review */}
      {role !== "partner" && (
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => handleOpenForm()}
            style={{
              background: "#f59e0b",
              color: "#fff",
              border: "none",
              padding: "12px 20px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 15,
            }}
          >
            ⭐ Thêm đánh giá mới (Tự nhập mã)
          </button>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div style={{
          position: "fixed",
          top:0,left:0,right:0,bottom:0,
          background:"rgba(0,0,0,0.5)",
          display:"flex",alignItems:"center",justifyContent:"center",
          zIndex:1000
        }}>
          <div style={{
            background:"#fff",
            border:"1px solid #e5e7eb",
            borderRadius:12,
            padding:24,
            width:"100%",maxWidth:500,
          }}>
            <h3 style={{marginTop:0,marginBottom:20}}>Submit a New Review</h3>
            <form onSubmit={handleSubmitReview}>
              <div style={{marginBottom:16}}>
                <label>Booking ID</label>
                <input
                  type="text"
                  value={form.bookingId}
                  onChange={(e) => setForm({...form, bookingId:e.target.value})}
                  readOnly={!!form.bookingId}
                  placeholder="Enter booking ID"
                  style={{width:"100%",padding:10,borderRadius:6,border:"1px solid #d1d5db"}}
                />
              </div>
              <div style={{marginBottom:16}}>
                <label>Rating ({form.rating}/5)</label>
                <div style={{display:"flex",gap:8}}>
                  {[1,2,3,4,5].map(star => (
                    <span key={star} onClick={()=>setForm({...form,rating:star})} style={{cursor:"pointer",fontSize:28,color:star<=form.rating?"#f59e0b":"#d1d5db"}}>★</span>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:16}}>
                <label>Comment</label>
                <textarea
                  value={form.comment}
                  onChange={(e)=>setForm({...form,comment:e.target.value})}
                  style={{width:"100%",minHeight:80,padding:8,borderRadius:6,border:"1px solid #d1d5db"}}
                />
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                <button type="button" onClick={handleCloseForm} style={{padding:"8px 12px"}}>Cancel</button>
                <button type="submit" disabled={submitting} style={{padding:"8px 12px"}}>{submitting?"Submitting...":"Submit"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {loading ? <p>Đang tải...</p> : reviews.length===0 ? <p>Chưa có đánh giá nào.</p> :
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        {reviews.map(r => {
          if (!r._id) return null;
          const id = r._id;
          return (
            <div key={id} style={{border:"1px solid #eee",padding:12,borderRadius:8,background:"#fff"}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <div>
                  <strong>{r.tenChuyen||"Chuyến đi"}</strong>
                  <div style={{fontSize:12,color:"#666"}}>{fmtDate(r.createdAt)}</div>
                  <div>⭐ {r.rating}/5</div>
                  <div>{r.comment}</div>
                  <div style={{fontSize:13,color:"#444"}}>Hành khách: {r.hoTen||"—"} — {r.sdt||"—"}</div>
                </div>
                <div>
                  {(uid===r.userId || role==="admin") && <button onClick={()=>handleDelete(id,r.userId)} style={{background:"#ef4444",color:"#fff",border:"none",padding:"6px 10px",borderRadius:6}}>Xóa</button>}
                </div>
              </div>

              {/* Messages */}
              <div style={{marginTop:12}}>
                <div style={{fontSize:13,color:"#666",marginBottom:6}}>Cuộc trò chuyện</div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {(r.messages||[]).map((m,idx)=>(
                    <div key={idx} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                      <div style={{minWidth:80,fontSize:13,color:"#333"}}>
                        <strong>{m.senderName || (m.sender==="partner"?"Partner":"User")}</strong>
                        <div style={{fontSize:11,color:"#888"}}>{m.sender}</div>
                      </div>
                      <div style={{background:m.sender==="partner"?"#eef6ff":"#f3f4f6",padding:8,borderRadius:6,flex:1}}>
                        <div style={{fontSize:14}}>{m.text}</div>
                        <div style={{fontSize:11,color:"#999"}}>{fmtDate(m.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Input reply */}
              <div style={{marginTop:8}}>
                <textarea
                  value={inputMap[id] ?? ""}
                  onChange={(e)=>setInputMap(p=>({...p,[id]:e.target.value}))}
                  placeholder={role==="partner"?"Partner: nhập phản hồi...":"Bạn: nhập phản hồi..."}
                  style={{width:"100%",minHeight:60,padding:8,borderRadius:6,border:"1px solid #ddd"}}
                />
                <div style={{display:"flex",gap:6,marginTop:4}}>
                  <button onClick={()=>handleSend(id)} style={{padding:"6px 12px",background:"#2563eb",color:"#fff",border:"none",borderRadius:6}}>Gửi</button>
                  <button onClick={()=>setInputMap(p=>({...p,[id]:""}))} style={{padding:"6px 12px",borderRadius:6}}>Clear</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>}
    </div>
  )
}
