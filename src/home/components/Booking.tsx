// 📁 src/home/BookedTicketList.tsx

import { useState, useEffect } from "react";
import { auth } from "../../firebase/config";
import { cancelBooking } from "../../api/bookingApi";
import { addPoints, getPointsByUser } from "../../api/pointsApi";
import { getPaymentStatus } from "../../api/payment-methodApi";
import { addReview } from "../../api/reviewApi";

// --- TYPE ---
export type PaymentMethod = "card" | "bank" | "cash" | "unknown" | "completed";

export interface Trip {
  _id: string;
  tenChuyen: string;
  ngayKhoiHanh: string;
  gioKhoiHanh: string;
}

export interface UserInfo {
  hoTen?: string;
  sdt?: string;
  _id: string;
}

export interface Booking {
  _id: string;
  status: "paid" | "completed" | string;
  tripId?: Trip;
  partnerId?: string;
  hoTen?: string;
  sdt?: string;
  userId?: UserInfo;
  soGhe: number[];
  totalPrice: number;
  paymentMethod?: PaymentMethod;
  voucherCode?: string;
  discountAmount?: number;
  finalTotal?: number;
  diemDonChiTiet?: string;
}

// ✅ UPDATED: Interface cho form modal
interface ReviewForm {
  bookingId: string;
  rating: number;
  comment: string;
}

export default function BookedTicketList() {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [rewardPoints, setRewardPoints] = useState(0);

  // ✅ NEW: State cho form đánh giá dạng MODAL
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState<ReviewForm>({
    bookingId: "",
    rating: 5,
    comment: "",
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Lấy UID từ Firebase
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setFirebaseUid(user.uid);
      } else {
        setFirebaseUid(null);
        setMessage("⚠️ Vui lòng đăng nhập để xem vé!");
        setAllBookings([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch vé và điểm khi có UID
  useEffect(() => {
    if (firebaseUid) {
      fetchUserBookings(firebaseUid);
      fetchRewardPoints(firebaseUid);
    } else if (!auth.currentUser) {
      setMessage("⚠️ Vui lòng đăng nhập để xem vé!");
    }
  }, [firebaseUid]);

  // --- FETCH USER BOOKINGS ---
  const fetchUserBookings = async (uid: string) => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`http://localhost:5000/api/bookings/user/${uid}`);
      const data: Booking[] = await res.json();

      if (!data || data.length === 0) {
        setMessage("📭 Bạn chưa đặt vé nào!");
        setAllBookings([]);
      } else {
        const validMethods: PaymentMethod[] = ["card", "bank", "cash", "unknown", "completed"];

        const bookingsWithPayment: Booking[] = await Promise.all(
          data.map(async (booking) => {
            try {
              const payment = await getPaymentStatus(booking._id);
              let method: string = payment?.paymentMethod || "";

              let paymentMethod: PaymentMethod = validMethods.includes(method as PaymentMethod)
                ? (method as PaymentMethod)
                : "unknown";

              if (booking.status === "completed") paymentMethod = "completed";

              return { ...booking, paymentMethod };
            } catch (err) {
              console.error("⚠️ Lỗi lấy paymentMethod:", err);
              return { ...booking, paymentMethod: "unknown" };
            }
          })
        );

        setAllBookings(bookingsWithPayment);
      }
    } catch (err) {
      console.error(err);
      setMessage("⚠️ Lỗi khi tải vé!");
    } finally {
      setLoading(false);
    }
  };

  // --- FETCH REWARD POINTS ---
  const fetchRewardPoints = async (uid: string) => {
    try {
      const res = await getPointsByUser(uid);
      setRewardPoints(res.points || 0);
    } catch (err) {
      console.error("⚠️ Lỗi khi tải điểm thưởng:", err);
    }
  };

  // --- MARK COMPLETED + ADD POINTS ---
 const handleMarkCompleted = async (bookingId: string) => {
    if (!firebaseUid) return;

    try {
      setAllBookings((prev) =>
        prev.map((b) =>
          b._id === bookingId ? { ...b, status: "completed", paymentMethod: "completed" } : b
        )
      );

      const rewardRes = await addPoints(firebaseUid, 10);
      setRewardPoints(rewardRes.points);

      // await cancelBooking(bookingId); // <--- XÓA DÒNG NÀY ĐI

      // ✅ Tùy chọn: Bạn nên gọi một API để CẬP NHẬT status trong DB ở đây
      // Ví dụ: await updateBookingStatus(bookingId, "completed"); 
      // (Nhưng chỉ cần xóa dòng trên là đã hết lỗi 404)

      setSuccessMessage("🎉 Chuyến đi hoàn thành! Bạn được cộng 10 điểm.");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      console.error(err);
      setMessage("⚠️ Lỗi khi hoàn tất chuyến đi!");
    }
  };
  // ✅ NEW: Hàm mở/đóng form modal
  const handleOpenReviewForm = (bookingId: string = "") => {
    setReviewForm({
      bookingId: bookingId,
      rating: 5,
      comment: "",
    });
    setShowReviewForm(true);
  };

  const handleCloseReviewForm = () => {
    setShowReviewForm(false);
  };

  // ✅ UPDATED: Hàm gửi đánh giá (giờ là onSubmit của form modal)
const handleSubmitReview = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!firebaseUid) return alert("Vui lòng đăng nhập");

  const { bookingId, comment, rating } = reviewForm;

  if (!comment.trim()) return alert("Vui lòng nhập nhận xét");
  if (rating < 1 || rating > 5) return alert("Đánh giá phải từ 1 đến 5 sao");

  setReviewSubmitting(true);
  try {
    const ticket = allBookings.find((b) => b._id === bookingId);
    if (!ticket) return alert("Không tìm thấy vé");

    // 1️⃣ Gửi đánh giá
    const newReview = await addReview({
      bookingId,
      userId: firebaseUid,
      partnerId: ticket.partnerId || "",
      tripId: ticket.tripId?._id || "",
      rating,
      comment,
      hoTen: ticket.hoTen,
      sdt: ticket.sdt,
      tenChuyen: ticket.tripId?.tenChuyen,
      ngayKhoiHanh: ticket.tripId?.ngayKhoiHanh,
      gioKhoiHanh: ticket.tripId?.gioKhoiHanh,
      soGhe: ticket.soGhe,
      totalPrice: ticket.totalPrice,
    });

    if (newReview) {
      // 2️⃣ Trả ghế về trống
      await cancelBooking(bookingId); // <-- API trả ghế

      // 3️⃣ Cập nhật state để xóa vé khỏi danh sách
      setAllBookings(prev => prev.filter(b => b._id !== bookingId));

      alert("✅ Đánh giá thành công! Ghế đã được trả về trạng thái trống.");
      handleCloseReviewForm();
    }
  } catch (err) {
    console.error(err);
    alert("❌ Lỗi khi gửi đánh giá");
  } finally {
    setReviewSubmitting(false);
  }
};

  const paidTickets = allBookings.filter((b) => b.status === "paid" || b.status === "completed");

  return (
    <div
      style={{
        minHeight: "100vh",
    
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ maxWidth: "1500px", margin: "0 auto" }}>
        <h1
          style={{
            textAlign: "center",
            color: "white",
            fontSize: "42px",
            fontWeight: 700,
            marginBottom: "",
          }}
        >
          🚌 Vé Đã Thanh Toán
        </h1>

        <div
          style={{
            textAlign: "center",
            background: "white",
            color: "#2563eb",
            borderRadius: "12px",
            padding: "12px 20px",
            marginBottom: "20px",
            display: "inline-block",
            fontWeight: 700,
            boxShadow: "0 4px 12px rgba(203, 193, 193, 0.1)",
          }}
        >
          🌟 Điểm tích lũy của bạn: <span style={{ color: "#16a34a" }}>{rewardPoints}</span>
        </div>

        {successMessage && (
          <div
            style={{
              background: "#16a34a",
              color: "white",
              padding: "12px",
              borderRadius: "12px",
              marginBottom: "20px",
              textAlign: "center",
              fontWeight: 600,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            {successMessage}
          </div>
        )}

        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "24px",
            padding: "32px",
            boxShadow: "0 8px 32px rgba(31, 22, 164, 0.1)",
          }}
        >
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#0C2B4E",
              marginBottom: "24px",
            }}
          >
            Vé đã thanh toán ({paidTickets.length})
          </h2>

          {loading && <p style={{ textAlign: "center", color: "#6b7280" }}>Đang tải vé...</p>}

          {message && !loading && (
            <p style={{ textAlign: "center", color: "#6b7280" }}>{message}</p>
          )}

          {!loading && !message && paidTickets.length === 0 && (
            <p style={{ textAlign: "center", color: "#6b7280" }}>
              Bạn chưa có vé nào đã thanh toán.
            </p>
          )}

          {!loading && paidTickets.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {paidTickets.map((ticket) => {
                const isCompleted = ticket.status === "completed";
                const paymentMethod = ticket.paymentMethod;
                const hasVoucher = ticket.voucherCode && ticket.discountAmount;
                // ❌ REMOVED: const isReviewing = reviewingBookingId === ticket._id;

                let tagText = "Đã thanh toán";
                let tagColor = "#10b981";

                if (isCompleted) {
                  tagText = "✅ Đã hoàn thành";
                  tagColor = "#3b82f6";
                } else if (paymentMethod === "bank") {
                  tagText = "🏦 Bank";
                  tagColor = "#10b981";
                } else if (paymentMethod === "card") {
                  tagText = "💳 Thẻ";
                  tagColor = "#10b981";
                } else if (paymentMethod === "cash") {
                  tagText = "💵 Tiền mặt";
                  tagColor = "#f59e0b";
                }

                return (
                  <div key={ticket._id}>
                    <div
                      style={{
                        border: "2px solid #e5e7eb",
                        borderRadius: "16px",
                        padding: "20px",
                        background: "#f9fafb",
                        transition: "0.3s",
                        position: "relative",
                      }}
                    >
                      {/* TAG TRẠNG THÁI */}
                      <div
                        style={{
                          position: "absolute",
                          top: "12px",
                          right: "12px",
                          background: tagColor,
                          color: "white",
                          padding: "6px 14px",
                          borderRadius: "20px",
                          fontSize: "13px",
                          fontWeight: 700,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        }}
                      >
                        {tagText}
                      </div>

                      {/* NỘI DUNG VÉ */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "start",
                          marginBottom: "12px",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: "18px",
                              fontWeight: 700,
                              color: "#1f2937",
                              marginBottom: "4px",
                            }}
                          >
                            🚍 {ticket.tripId?.tenChuyen}
                          </div>
                          <div style={{ fontSize: "14px", color: "#6b7280" }}>
                            Mã vé: {ticket._id}
                          </div>
                        </div>
                      </div>

                      {/* THÔNG TIN CHI TIẾT */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(2, 1fr)",
                          gap: "12px",
                          marginBottom: "12px",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            Hành khách
                          </div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#1f2937",
                            }}
                          >
                            {ticket.hoTen || ticket.userId?.hoTen || "Không rõ"}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            Số điện thoại
                          </div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#1f2937",
                            }}
                          >
                            {ticket.sdt || ticket.userId?.sdt || "Không rõ"}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            Ngày khởi hành
                          </div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#1f2937",
                            }}
                          >
                            {ticket.tripId?.ngayKhoiHanh}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            Giờ khởi hành
                          </div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#1f2937",
                            }}
                          >
                            {ticket.tripId?.gioKhoiHanh}
                          </div>
                        </div>
                        {ticket.diemDonChiTiet && (
                          <div>
                            <div style={{ fontSize: "12px", color: "#6b7280" }}>
                              Đón tận nơi
                            </div>
                            <div
                              style={{
                                fontSize: "14px",
                                fontWeight: 600,
                                color: "#166534",
                                background: "#f0fdf4",
                                padding: "6px 10px",
                                borderRadius: "8px",
                                border: "1px solid #bbf7d0",
                                marginTop: "4px",
                              }}
                            >
                              {ticket.diemDonChiTiet}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* VOUCHER */}
                      {hasVoucher && (
                        <div
                          style={{
                            background: "#dcfce7",
                            border: "1px solid #86efac",
                            borderRadius: "10px",
                            padding: "12px",
                            marginBottom: "12px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginBottom: "6px",
                            }}
                          >
                            <span style={{ fontSize: "16px" }}>🎟️</span>
                            <span
                              style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "#166534",
                              }}
                            >
                              Đã áp dụng voucher: {ticket.voucherCode}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "13px",
                              color: "#15803d",
                            }}
                          >
                            <span>Giảm giá:</span>
                            <span style={{ fontWeight: 600 }}>
                              -{ticket.discountAmount?.toLocaleString("vi-VN")}đ
                            </span>
                          </div>
                        </div>
                      )}

                      {/* TỔNG TIỀN & SỐ GHẾ */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          paddingTop: "12px",
                          borderTop: "1px solid #e5e7eb",
                        }}
                      >
                        <div>
                          <span style={{ fontSize: "12px", color: "#6b7280" }}>
                            Số ghế:{" "}
                          </span>
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#667eea",
                            }}
                          >
                            {ticket.soGhe.join(", ")}
                          </span>
                        </div>
                        <div>
                          {hasVoucher ? (
                            <div style={{ textAlign: "right" }}>
                              <div
                                style={{
                                  fontSize: "13px",
                                  color: "#6b7280",
                                  textDecoration: "line-through",
                                  marginBottom: "2px",
                                }}
                              >
                                {ticket.totalPrice.toLocaleString("vi-VN")}đ
                              </div>
                              <div
                                style={{
                                  fontSize: "18px",
                                  fontWeight: 700,
                                  color: "#16a34a",
                                }}
                              >
                                {ticket.finalTotal?.toLocaleString("vi-VN")}đ
                              </div>
                            </div>
                          ) : (
                            <div
                              style={{
                                fontSize: "18px",
                                fontWeight: 700,
                                color: "#667eea",
                              }}
                            >
                              {ticket.totalPrice.toLocaleString("vi-VN")}đ
                            </div>
                          )}
                        </div>
                      </div>

                      {/* NÚT HOÀN THÀNH / ĐÁNH GIÁ */}
                      {ticket.status === "paid" && (
                        <button
                          onClick={() => handleMarkCompleted(ticket._id)}
                          style={{
                            marginTop: "16px",
                            background: "#2563eb",
                            color: "white",
                            padding: "10px 18px",
                            border: "none",
                            borderRadius: "10px",
                            cursor: "pointer",
                            fontWeight: 600,
                            fontSize: "14px",
                            boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)",
                            transition: "0.2s",
                          }}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.background = "#1d4ed8")
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.background = "#2563eb")
                          }
                        >
                          ✅ Đánh dấu hoàn thành
                        </button>
                      )}

                      {/* ✅ UPDATED: Nút đánh giá giờ mở modal */}
                      {ticket.status === "completed" && (
                        <button
                          onClick={() => handleOpenReviewForm(ticket._id)}
                          style={{
                            marginTop: "16px",
                            background: "#f59e0b",
                            color: "white",
                            padding: "10px 18px",
                            border: "none",
                            borderRadius: "10px",
                            cursor: "pointer",
                            fontWeight: 600,
                            fontSize: "14px",
                            boxShadow: "0 2px 8px rgba(245, 158, 11, 0.3)",
                            transition: "0.2s",
                          }}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.background = "#d97706")
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.background = "#f59e0b")
                          }
                        >
                          ⭐ Đánh giá chuyến đi
                        </button>
                      )}
                    </div>

                    {/* ❌ REMOVED: Form đánh giá inline đã bị xóa khỏi đây */}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ✅ ADDED: Form Đánh Giá Dạng Modal (Popup) */}
        {showReviewForm && (
          <div
            // Lớp phủ nền
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              // Nội dung modal
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: "24px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                width: "100%",
                maxWidth: "500px",
                boxSizing: "border-box",
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                  marginBottom: 20,
                  color: "#f59e0b",
                  fontWeight: 700,
                }}
              >
                📝 Đánh giá chuyến đi
              </h3>

              {/* Form trỏ tới handler đã được cập nhật */}
              <form onSubmit={handleSubmitReview}>
                {/* Input Mã vé (chỉ đọc) */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
                    Mã vé (Booking ID)
                  </label>
                  <input
                    type="text"
                    value={reviewForm.bookingId}
                    readOnly
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                      fontSize: 14,
                      boxSizing: "border-box",
                      background: "#f3f4f6",
                      color: "#6b7280",
                    }}
                  />
                </div>

                {/* RATING STARS (Style giống form inline gốc) */}
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontWeight: 600,
                    }}
                  >
                    Đánh giá * ({reviewForm.rating}/5)
                  </label>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button" // Quan trọng: để không submit form
                        onClick={() =>
                          setReviewForm({
                            ...reviewForm,
                            rating: star,
                          })
                        }
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: 32,
                          cursor: "pointer",
                          opacity: star <= reviewForm.rating ? 1 : 0.3,
                          transition: "0.2s",
                          padding: 0,
                        }}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>

                {/* COMMENT (Style giống form inline gốc) */}
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontWeight: 600,
                    }}
                  >
                    Nhận xét *
                  </label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) =>
                      setReviewForm({
                        ...reviewForm,
                        comment: e.target.value,
                      })
                    }
                    placeholder="Viết nhận xét của bạn về chuyến đi này..."
                    style={{
                      width: "100%",
                      minHeight: 100,
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* BUTTONS (Style giống form inline gốc) */}
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button
                    type="button" // Quan trọng: để không submit form
                    onClick={handleCloseReviewForm}
                    style={{
                      background: "#e5e7eb",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    ❌ Hủy
                  </button>
                  <button
                    type="submit" // Đây là nút submit
                    disabled={reviewSubmitting}
                    style={{
                      background: "#16a34a",
                      color: "#fff",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: 8,
                      cursor: reviewSubmitting ? "not-allowed" : "pointer",
                      fontWeight: 600,
                      opacity: reviewSubmitting ? 0.6 : 1,
                    }}
                  >
                    {reviewSubmitting ? "Đang gửi..." : "✅ Gửi đánh giá"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}