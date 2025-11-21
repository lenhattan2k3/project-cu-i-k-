import React, { useEffect, useState } from "react";
import { auth } from "../../firebase/config";
import { getBankByUser } from "../../api/bankApi";
import { useNavigate } from "react-router-dom";
import { bookTicket } from "../../api/bookingApi";
import { getPaymentStatus } from "../../api/payment-methodApi";
import airplane from "../../assets/airplane.jpg";
import heroBus from "../../assets/hero-bus.jpg";
import trainStation from "../../assets/train-station.jpg";



import { getPromotions, applyPromotion } from "../../api/promotionsApi"; // Import thêm
const CLOUDINARY_BASE_URL = "https://res.cloudinary.com/<your-cloud-name>/image/upload/";

export default function Cart() {
  const [diemDonChiTiet, setDiemDonChiTiet] = useState<string>("");
  const [bgIndex, setBgIndex] = useState(0);
useEffect(() => {
  const interval = setInterval(() => {
    setBgIndex((prev) => (prev + 1) % 3);
  }, 4000);
  return () => clearInterval(interval);
}, []);

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
const [selectedTab, setSelectedTab] = useState<"pending" | "paid" | "cancelled">("pending");

  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [availableSeats, setAvailableSeats] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [tripSeats] = useState(Array.from({ length: 20 }, (_, i) => (i + 1).toString()));
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [timers, setTimers] = useState<Record<string, string>>({});

  // --- Payment modal states ---
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank" | "cash">("card");
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [cardNumber, setCardNumber] = useState<string>("");
  const [cardName, setCardName] = useState<string>("");
  const [cardExpiry, setCardExpiry] = useState<string>("");
  const [cardCvv, setCardCvv] = useState<string>("");
  const [payLoading, setPayLoading] = useState(false);

  // --- Bank link states ---
  const [linkedBank, setLinkedBank] = useState<any | null>(null);
  const [isCheckingBank, setIsCheckingBank] = useState(false);

  // 🆕 --- Voucher states ---
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [showVoucherList, setShowVoucherList] = useState(false);
  const [voucherCode, setVoucherCode] = useState<string>("");
  const [appliedVoucher, setAppliedVoucher] = useState<any | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [finalTotal, setFinalTotal] = useState<number>(0);

  const banks = [
    { id: "vcb", name: "Vietcombank" },
    { id: "acb", name: "ACB" },
    { id: "tech", name: "Techcombank" },
    { id: "mb", name: "MB Bank" },
    { id: "tpb", name: "TPBank" },
  ];

  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setFirebaseUid(user.uid);
      } else {
        setFirebaseUid(null);
        setMessage("⚠️ Vui lòng đăng nhập!");
        setBookings([]);
      }
    });
    return () => unsubscribe();
  }, []);

  function getCountdown(createdAt: string) {
    const created = new Date(createdAt).getTime();
    const expire = created + 2 * 60 * 60 * 1000;
    const now = Date.now();
    const diff = expire - now;

    if (diff <= 0) return "⏰ Hết hạn";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  useEffect(() => {
    if (firebaseUid) {
      fetchUserBookings(firebaseUid);
    } else if (!auth.currentUser) {
      setMessage("⚠️ Vui lòng đăng nhập!");
    }
  }, [firebaseUid]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const updated: Record<string, string> = {};
        bookings.forEach((b) => {
          if (b.status !== "paid" && b.createdAt) {
            updated[b._id] = getCountdown(b.createdAt);
          }
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [bookings]);

  const fetchUserBookings = async (uid: string) => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/user/${uid}`);
      const data = await res.json();
      if (!data || data.length === 0) {
        setMessage("📭 Bạn chưa đặt vé nào!");
        setBookings([]);
      } else {
        setBookings(data);
      }
    } catch (err) {
      console.error(err);
      setMessage("⚠️ Lỗi khi tải vé!");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    const confirmMsg =
      selectedTab === "pending"
        ? "Bạn có chắc muốn hủy vé chưa thanh toán?"
        : "Bạn có chắc muốn hủy vé ĐÃ THANH TOÁN?";
  
    if (!window.confirm(confirmMsg)) return;
  
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/status/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
  
      if (!res.ok) throw new Error("Cập nhật thất bại");
  
      // Cập nhật UI ngay
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status: "cancelled" } : b))
      );
  
      setSelectedTab("paid");
      setSelectedTicketId(null);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi hủy vé. Vui lòng thử lại!");
    }
  };
  

  const handleOpenUpdateForm = async (booking: any) => {
    setSelectedBooking(booking);
    setSelectedSeats(booking.soGhe);
    setShowUpdateForm(true);

    try {
      const res = await fetch(`http://localhost:5000/api/bookings/trip/${booking.tripId._id}/seats`);
      const data = await res.json();
      if (Array.isArray(data)) setAvailableSeats(data.map(String));
      else if (Array.isArray(data.bookedSeats)) setAvailableSeats(data.bookedSeats.map(String));
      else setAvailableSeats([]);
    } catch {
      setAvailableSeats([]);
    }
  };

  const handleSeatClick = (seat: string) => {
    if (availableSeats.includes(seat)) return;
    setSelectedSeats((prev) =>
      prev.includes(seat) ? prev.filter((s) => s !== seat) : [...prev, seat]
    );
  };

  const handleUpdateBooking = async () => {
    if (!selectedBooking) return;
    try {
      const updatedTotal = selectedSeats.length * 100000;
      await fetch(`http://localhost:5000/api/bookings/${selectedBooking._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soGhe: selectedSeats, totalPrice: updatedTotal }),
      });
      alert("✅ Cập nhật vé thành công!");
      setShowUpdateForm(false);
      if (firebaseUid) fetchUserBookings(firebaseUid);
    } catch (err) {
      alert("⚠️ Lỗi khi cập nhật vé!");
      console.error(err);
    }
  };

  const toggleTicket = (id: string) =>
    setSelectedTicketId((prev) => (prev === id ? null : id));

  const getImageUrl = (img?: string) => {
    if (!img) return "/images/no-image.png";
    if (img.startsWith("http")) return img;
    return `${CLOUDINARY_BASE_URL}${img}`;
  };

  const filteredBookings = bookings.filter((b) => {
    if (selectedTab === "pending") {
      return b.status === "pending" || (!b.status || b.status === "pending");
    } else {
      // Tab "paid" → HIỂN THỊ: paid + cancelled
      return b.status === "paid" || b.status === "cancelled";
    }
  });

  // 🆕 --- Voucher handlers ---
  const fetchVouchers = async () => {
    try {
      const data = await getPromotions();
      setVouchers(data);
    } catch (error) {
      console.error("Lỗi khi tải voucher:", error);
    }
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      alert("Vui lòng nhập mã voucher!");
      return;
    }

    if (!selectedBooking) return;

    try {
      const result = await applyPromotion(voucherCode, selectedBooking.totalPrice);
      
      setAppliedVoucher({
        code: result.code,
        discount: result.discount
      });
      setDiscountAmount(result.discount);
      setFinalTotal(result.newTotal);
      
      alert(`✅ Áp dụng voucher thành công! Giảm ${result.discount.toLocaleString()}₫`);
      setShowVoucherList(false);
    } catch (error: any) {
      alert(error.response?.data?.message || "Mã voucher không hợp lệ!");
      console.error(error);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setDiscountAmount(0);
    setFinalTotal(selectedBooking?.totalPrice || 0);
    setVoucherCode("");
  };

  const handleSelectVoucher = (code: string) => {
    setVoucherCode(code);
    setShowVoucherList(false);
  };

  // --- Payment handlers ---
  const openPaymentModal = async (booking: any) => {
    setSelectedBooking(booking);
    setShowPaymentForm(true);

    // Reset voucher states
    setAppliedVoucher(null);
    setDiscountAmount(0);
    setFinalTotal(booking.totalPrice);
    setVoucherCode("");

    setPaymentMethod("card");
    setSelectedBank("");
    setCardNumber("");
    setCardName("");
    setCardExpiry("");
    setCardCvv("");

    setIsCheckingBank(true);
    setLinkedBank(null);

    // Load vouchers
    await fetchVouchers();

    try {
      if (firebaseUid) {
        const bankData = await getBankByUser(firebaseUid);
        if (bankData && bankData.linked && bankData.bank) {
          setLinkedBank(bankData.bank);
        } else {
          setLinkedBank(null);
        }
      } else {
        setLinkedBank(null);
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra ngân hàng liên kết:", error);
      setLinkedBank(null);
    } finally {
      setIsCheckingBank(false);
    }
  };

  const validateCard = () => {
    if (!cardNumber || cardNumber.replace(/\s/g, "").length < 12) {
      alert("Vui lòng nhập số thẻ hợp lệ.");
      return false;
    }
    if (!cardName) {
      alert("Vui lòng nhập tên chủ thẻ.");
      return false;
    }
    if (!cardExpiry) {
      alert("Vui lòng nhập ngày hết hạn.");
      return false;
    }
    if (!cardCvv || cardCvv.length < 3) {
      alert("Vui lòng nhập CVV.");
      return false;
    }
    return true;
  };

  const validateBank = () => {
    if (!selectedBank) {
      alert("Vui lòng chọn ngân hàng để liên kết.");
      return false;
    }
    return true;
  };

  const handleConfirmPayment = async (methodOverride?: "card" | "bank" | "cash") => {
    const method = methodOverride || paymentMethod;
  
    if (!selectedBooking) return;
  
    // === VALIDATE CARD / BANK ===
    if (method !== "cash" && !linkedBank) {
      if (method === "card") {
        if (!validateCard()) return;
      } else if (method === "bank") {
        if (!validateBank()) return;
      }
    }
  
    // === VALIDATE ĐỊA CHỈ ĐÓN (BẮT BUỘC) ===
    if (!diemDonChiTiet.trim()) {
      alert("Vui lòng nhập địa chỉ đón chi tiết!");
      return;
    }
  
    setPayLoading(true);
    try {
      await new Promise((res) => setTimeout(res, 900)); // Fake delay
  
      let finalPaymentMethod = method;
      if (linkedBank && method !== "cash") {
        finalPaymentMethod = "bank";
      }
  
      // === PAYLOAD GỬI VỀ BACKEND ===
      const updatePayload: any = {
        status: "paid",
        paymentMethod: finalPaymentMethod,
        diemDonChiTiet: diemDonChiTiet.trim(), // LƯU ĐỊA CHỈ ĐÓN
      };
  
      // Thêm voucher nếu có
      if (appliedVoucher) {
        updatePayload.voucherCode = appliedVoucher.code;
        updatePayload.discountAmount = discountAmount;
        updatePayload.finalTotal = finalTotal;
      }
  
      // === GỌI API ===
      await fetch(`http://localhost:5000/api/bookings/status/${selectedBooking._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });
  
      // === CẬP NHẬT UI (state bookings) ===
      setBookings((prev) =>
        prev.map((b) =>
          b._id === selectedBooking._id
            ? {
                ...b,
                status: "paid",
                paymentMethod: finalPaymentMethod,
                diemDonChiTiet: diemDonChiTiet.trim(),
                ...(appliedVoucher && {
                  voucherCode: appliedVoucher.code,
                  discountAmount: discountAmount,
                  finalTotal: finalTotal,
                }),
              }
            : b
        )
      );
  
      // === THÔNG BÁO THÀNH CÔNG ===
      let successMessage = "Thanh toán thành công!";
      if (appliedVoucher) {
        successMessage += ` Đã giảm ${discountAmount.toLocaleString()}₫`;
      }
      if (finalPaymentMethod === "cash") {
        successMessage = "Xác nhận thanh toán tiền mặt thành công!";
      } else if (finalPaymentMethod === "bank") {
        successMessage = "Thanh toán qua ngân hàng thành công!";
      } else if (finalPaymentMethod === "card") {
        successMessage = "Thanh toán qua thẻ thành công!";
      }
      alert(successMessage);
  
      // === ĐÓNG MODAL & RESET ===
      setShowPaymentForm(false);
      setSelectedBooking(null);
      setLinkedBank(null);
      setAppliedVoucher(null);
      setDiscountAmount(0);
      setFinalTotal(0);
      setDiemDonChiTiet(""); // RESET ĐỊA CHỈ
  
      // === TẢI LẠI DANH SÁCH VÉ ===
      if (firebaseUid) fetchUserBookings(firebaseUid);
    } catch (err) {
      console.error("Lỗi thanh toán:", err);
      alert("Xử lý thất bại. Vui lòng thử lại.");
    } finally {
      setPayLoading(false);
    }
  };
  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
      {/* 🌌 Ảnh nền mờ động ở lớp dưới cùng */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0, // lớp nền thấp nhất
          overflow: "hidden",
        }}
      >
        {[airplane, heroBus, trainStation].map((img, i) => (
          <div
            key={i}
            className={`bg-slide ${i === bgIndex ? "active" : ""}`}
            style={{
              backgroundImage: `url(${img})`,
            }}
          />
        ))}
      </div>
  
  
  
     {/* 🎨 CSS hiệu ứng nền */}

  {/* --- TOÀN BỘ STYLES ĐƯỢC CHUYỂN VÀO ĐÂY --- */}
  <style>{`
    /* --- Animations (Giữ nguyên) --- */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes spin { 
      to { transform: rotate(360deg); } 
    }
.card-status-badge.cancelled {
  background: #fee2e2;
  color: #dc2626;
  font-weight: 700;
  border: 1px solid #fca5a5;
}
    /* --- Base Button --- */
    .btn {
      padding: 10px 16px;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
    }
    .btn:hover {
      opacity: 0.9;
      transform: translateY(-2px);
    }
    
    /* --- Header --- */
    .header-main {
      text-align: center;
      margin-bottom: 50px;
      animation: fadeIn 0.6s ease;
    }
    .header-title {
      font-size: 2.5rem;
      font-weight: 800;
      background: linear-gradient(135deg,rgb(134, 108, 221), #3b82f6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 10px;
    }
    .header-subtitle {
      color: #64748b;
      font-size: 1rem;
    }
.card-status-badge.cancelled {
  background: #fee2e2;
  color: #dc2626;
  font-weight: 700;
  border: 1px solid #fca5a5;
}
    /* --- Tabs --- */
    .tabs-container {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-bottom: 40px;
      animation: fadeIn 0.8s ease;
    }
    .tab-btn {
      padding: 12px 28px;
      border-radius: 12px;
      border: none;
      background: #ffffff;
      color: #64748b;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      font-size: 0.95rem;
      transition: all 0.15s ease;
    }
    .tab-btn.active {
      background: linear-gradient(135deg, #0ea5e9, #3b82f6);
      color: #fff;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    /* --- Loader & Message --- */
    .loader-container {
      text-align: center;
      font-size: 1.1rem;
      color: #64748b;
      animation: fadeIn 0.5s ease;
    }
    .loader-spinner {
      display: inline-block;
      width: 40px;
      height: 40px;
      border: 4px solid #e0f2fe;
      border-top: 4px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    .message {
      text-align: center;
      font-size: 1.1rem;
      color: #64748b;
      animation: fadeIn 0.5s ease;
    }
   /* --- Booking Card Grid --- */
    .cards-grid {
      display: grid;
      gap: 32px;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 20px;
    }

    /* --- Booking Card --- */
    .booking-card {
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      cursor: pointer;
      /* Box-shadow xanh đẹp hơn */
      box-shadow: 0 8px 25px -10px rgba(59, 130, 246, 0.2);
      animation: fadeIn 0.5s ease both;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .booking-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 30px -10px rgba(59, 130, 246, 0.3);
    }

    .card-image-wrapper {
      height: 180px;
      overflow: hidden;
      position: relative;
    }
    .card-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    .booking-card:hover .card-image {
      transform: scale(1.05);
    }
    .card-status-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      background: rgba(255, 255, 255, 0.95);
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 700; /* Đậm hơn */
      min-width: 80px;
      text-align: center;
      backdrop-filter: blur(4px); /* Thêm blur nhẹ */
      border: 1px solid rgba(255, 255, 255, 0.5);
    }
    .card-status-badge.paid {
      color: #10b981;
    }
    .card-status-badge.pending {
      color: #f59e0b;
    }

    .card-content {
      padding: 20px;
    }
    .card-title {
      margin: 0 0 16px; /* Thêm space */
      font-size: 1.2rem; /* To hơn 1 chút */
      font-weight: 700;
      color: #1e293b;
      line-height: 1.4;
    }
    .card-info-list {
      display: flex;
      flex-direction: column;
      gap: 10px; /* Tăng gap */
      color: #64748b;
      font-size: 0.9rem;
    }
    .card-info-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .card-price {
      color: #0ea5e9;
      font-weight: 700;
      font-size: 1.1rem; /* To hơn */
    }
    .card-voucher {
      color: #10b981;
      font-weight: 600;
    }

    .card-actions {
      margin-top: 20px; /* Tăng space */
      display: grid; /* Dùng grid cho đều */
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
    }
    /* Style riêng cho nút Chi Tiết */
    .btn-detail {
      grid-column: 1 / -1; /* Nút Chi Tiết rộng full */
      background: linear-gradient(135deg, #0ea5e9, #3b82f6);
      color: #fff;
    }
    .btn-pay {
      background: linear-gradient(135deg, #10b981, #059669);
      color: #fff;
    }
    .btn-edit {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #fff;
    }
    .btn-cancel {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: #fff;
    }

    /* --- Modal --- */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.55);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 50;
      backdrop-filter: blur(8px); /* HIỆU ỨNG WOW */
      animation: fadeIn 0.2s ease;
    }
    .modal-content {
      animation: scaleIn 0.2s ease;
      background: #ffffff;
      border-radius: 24px;
      width: 90%;
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.22);
      border: 1px solid rgba(226, 232, 240, 0.5);
    }
    .modal-close-btn {
      margin-top: 24px;
      width: 100%;
      padding: 14px;
      border-radius: 12px;
      background: #f1f5f9;
      color: #64748b;
      border: none;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    .modal-close-btn:hover {
      background: #e2e8f0;
    }

    /* --- Update Seat Modal --- */
    .modal-content-update {
      padding: 32px;
      max-width: 460px;
    }
    .modal-title-update {
      margin: 0 0 24px;
      font-size: 1.55rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.3px;
    }
    .seat-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
      margin-bottom: 24px;
    }
    .seat-btn {
      aspect-ratio: 1;
      background: #ffffff;
      border: 2px solid #e2e8f0;
      border-radius: 14px;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      color: #475569;
      font-weight: 700;
      font-size: 0.82rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      transition: all 0.2s ease;
    }
    .seat-btn:hover:not(.booked) {
      border-color: #3b82f6;
    }
    .seat-btn.booked {
      background: #e2e8f0;
      cursor: not-allowed;
      color: #94a3b8;
    }
    .seat-btn.selected {
      background: linear-gradient(135deg, #0ea5e9, #3b82f6);
      border: none;
      color: #fff;
      box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.3);
    }

    .update-total-price {
      padding: 18px;
      background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
      border-radius: 16px;
      margin-bottom: 24px;
      text-align: center;
      border: 1px dashed #0ea5e9;
    }
    .update-total-price p {
      margin: 0;
      color: #0ea5e9;
      font-weight: 800;
      font-size: 1.2rem;
      letter-spacing: -0.3px;
    }
    .modal-actions {
      display: flex;
      gap: 12px;
    }
    .btn-update-confirm {
      flex: 1;
      padding: 15px;
      border-radius: 14px;
      background: linear-gradient(135deg, #0ea5e9, #3b82f6);
      color: #fff;
      font-weight: 700;
      font-size: 1rem;
      box-shadow: 0 8px 20px rgba(14, 165, 233, 0.3);
    }
    .btn-update-cancel {
      flex: 1;
      padding: 15px;
      border-radius: 14px;
      background: #f8fafc;
      color: #64748b;
      border: 1px solid #e2e8f0;
      font-weight: 600;
      font-size: 1rem;
    }

    /* --- WOW: Detail Ticket Modal --- */
    .modal-content-detail {
      max-width: 420px;
      padding: 0; /* Xóa padding để ảnh tràn viền */
      overflow: hidden; /* Ẩn phần thừa */
    }
    .ticket-header {
      padding: 24px 24px 20px;
    }
    .ticket-title {
      margin: 0 0 16px;
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
    }
    .ticket-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-radius: 16px;
    }
    .ticket-body {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      color: #64748b;
      font-size: 0.95rem;
    }
    .ticket-info-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .ticket-total {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px;
      background: #f0f9ff;
      border-radius: 10px;
      margin-top: 8px;
    }
    .ticket-total-price {
      color: #0ea5e9;
      font-weight: 700;
      font-size: 1.1rem;
    }
    /* Đường xé vé */
    .ticket-rip {
      height: 20px;
      background: 
        radial-gradient(circle at 0 10px, transparent 0, transparent 5px, #f0f9ff 5px) 0 0 / 15px 20px repeat-x,
        radial-gradient(circle at 100% 10px, #f0f9ff 0, #f0f9ff 5px, transparent 5px) 100% 0 / 15px 20px repeat-x;
      position: relative;
    }
    .ticket-rip::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 10px;
      right: 10px;
      height: 1px;
      border-top: 2px dashed #d1e9fa;
      transform: translateY(-50%);
    }

    /* Cuống vé với QR */
    .ticket-stub {
      background: #f0f9ff;
      padding: 20px 24px;
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .ticket-qr-placeholder {
      width: 80px;
      height: 80px;
      background: #fff;
      border: 2px solid #e0f2fe;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      color: #e0f2fe;
      flex-shrink: 0;
    }
    .ticket-stub-info p {
      margin: 0;
      color: #3b82f6;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .ticket-stub-info span {
      font-size: 0.8rem;
      color: #64748b;
    }
    .ticket-close-btn-wrapper {
      padding: 24px;
      background: #f0f9ff;
    }

  `}</style>
  
   {/* 💡 Toàn bộ nội dung nổi lên trên */}
   <div style={{ position: "relative", zIndex: 2 }}>
      {/* --- Header --- */}
      <div className="header-main">
        <h1 className="header-title">🎫 Vé Của Bạn</h1>
        <p className="header-subtitle">Quản lý đặt vé của bạn</p>
      </div>

      {/* --- Tabs --- */}
      <div className="tabs-container">
  {["pending", "paid", "cancelled"].map((tab) => (
    <button
      key={tab}
      onClick={() => setSelectedTab(tab as "pending" | "paid" | "cancelled")}
      className={`tab-btn ${selectedTab === tab ? "active" : ""}`}
    >
      {tab === "pending"
        ? "⏳ Chờ Thanh Toán"
        : tab === "paid"
        ? "✅ Đã Thanh Toán / Hủy"
        : " ☄️"}
    </button>
  ))}
</div>


      {/* --- Loader --- */}
      {loading && (
        <div className="loader-container">
          <div className="loader-spinner"></div>
        </div>
      )}

      {/* --- Message --- */}
      {message && !loading && <p className="message">{message}</p>}

      {/* --- Booking Cards --- */}
      <div className="cards-grid">
        {filteredBookings.map((b, idx) => (
          <div
            key={b._id}
            className="booking-card"
            style={{ animationDelay: `${idx * 0.1}s` }}
            onClick={() => toggleTicket(b._id)}
          >
            <div className="card-image-wrapper">
              <img
                src={getImageUrl(b.tripId?.hinhAnh)}
                alt={b.tripId?.tenChuyen}
                className="card-image"
              />
              <div
                className={`card-status-badge ${
                  b.status === "paid"
                    ? "paid"
                    : b.status === "cancelled"
                    ? "cancelled"
                    : "pending"
                }`}
              >
                {b.status === "paid"
                  ? "Đã TT"
                  : b.status === "cancelled"
                  ? "Đã hủy"
                  : timers[b._id] || "02:00:00"}
              </div>
            </div>

            <div className="card-content">
              <h3 className="card-title">{b.tripId?.tenChuyen}</h3>

              <div className="card-info-list">
                <div className="card-info-item">
                  <span>💺</span>
                  <span>
                    Ghế: <strong>{b.soGhe.join(", ")}</strong>
                  </span>
                </div>
                <div className="card-info-item">
                  <span>💰</span>
                  <span className="card-price">
                    {b.totalPrice.toLocaleString()}₫
                  </span>
                </div>
                {b.voucherCode && (
                  <div className="card-info-item">
                    <span>🎟️</span>
                    <span className="card-voucher">
                      Voucher: {b.voucherCode} (-{b.discountAmount?.toLocaleString()}₫)
                    </span>
                  </div>
                )}
              </div>

              {selectedTicketId === b._id && (
                <div className="card-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBooking(b);
                      setShowDetail(true);
                    }}
                    className="btn btn-detail"
                  >
                    🔍 Chi Tiết
                  </button>

                  {selectedTab === "pending" && b.status !== "cancelled" && (
  <>
    <button
      onClick={(e) => {
        e.stopPropagation();
        openPaymentModal(b);
      }}
      className="btn btn-pay"
    >
      💳 TT
    </button>
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleOpenUpdateForm(b);
      }}
      className="btn btn-edit"
    >
      ✏️ Sửa
    </button>
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleCancel(b._id);
      }}
      className="btn btn-cancel"
    >
      ❌ Hủy vé
    </button>
  </>
)}

{/* Hiển thị riêng nút Hủy cho tab Đã thanh toán */}
{selectedTab === "paid" && b.status === "paid" && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      if (window.confirm("Hủy vé ĐÃ THANH TOÁN?")) {
        handleCancel(b._id);
      }
    }}
    className="btn btn-cancel"
  >
    ❌ Hủy vé
  </button>
)}

                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
 {/* 🎨 CSS hiệu ứng nền mờ động */}
 <style>{`
      .bg-slide {
        position: absolute;
        inset: 0;
        background-size: cover;
        background-position: center;
        opacity: 0;
        transform: scale(1.1);
        transition: opacity 2.5s ease, transform 12s ease;
        filter: blur(12px) brightness(0.6); /* Làm mờ và tối nhẹ */
      }
      .bg-slide.active {
        opacity: 1;
        transform: scale(1.03);
      }
    `}</style>
 {/* --- Update Form Modal (Thiết kế WOW với Ghi Chú & Chi Tiết) --- */}
{showUpdateForm && selectedBooking && (
  <div className="modal-overlay" onClick={() => setShowUpdateForm(false)}>
    {/* --- Thêm style cho các phần tử mới --- */}
    <style>{`
      .modal-content-update {
        max-width: 500px; /* Rộng hơn một chút để chứa chi tiết */
        padding: 28px;
      }
      .modal-subtitle {
        font-size: 0.95rem;
        font-weight: 500;
        color: #64748b;
        margin-top: -20px;
        margin-bottom: 24px;
      }
      
      /* --- 1. Chú thích (Legend) --- */
      .seat-legend {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
        padding: 14px;
        background: #f8fafc;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
      }
      .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.85rem;
        font-weight: 500;
        color: #475569;
      }
      .legend-box {
        width: 20px;
        height: 20px;
        border-radius: 6px;
        border: 2px solid #e2e8f0;
      }
      .legend-box-available { background: #ffffff; }
      .legend-box-booked { background: #e2e8f0; }
      .legend-box-selected {
        background: linear-gradient(135deg, #0ea5e9, #3b82f6);
        border: none;
      }

      /* --- 2. Mô phỏng xe --- */
      .seat-grid-container {
        padding: 16px;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        background: #ffffff;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
      }
      .driver-box {
        grid-column: 1 / -1; /* Trải dài hết 5 cột */
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px;
        margin-bottom: 10px;
        border-radius: 8px;
        background: #f1f5f9;
        color: #64748b;
        font-weight: 600;
        font-size: 0.9rem;
      }
      /* Ghi chú lối đi */
      .aisle-label {
        grid-column: 3 / 4; /* Nằm ở cột 3 */
        text-align: center;
        font-size: 0.75rem;
        color: #94a3b8;
        font-weight: 600;
        writing-mode: vertical-rl; /* Xoay chữ */
        transform: rotate(180deg);
        grid-row: 2 / span 5; /* Chạy dọc 5 hàng (ví dụ) */
        justify-self: center;
        letter-spacing: 1px;
        background: #f8fafc;
        border-radius: 4px;
        padding: 8px 2px;
      }
      /* Căn chỉnh lại grid để có lối đi */
      .seat-grid-detailed {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 10px;
      }
      .seat-btn.aisle {
        visibility: hidden; /* Ẩn các ghế ở lối đi */
      }
      
      /* --- 3. Chi tiết giá --- */
      .update-summary {
        margin-top: 24px;
        margin-bottom: 24px;
        padding: 20px;
        background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
        border-radius: 16px;
        border: 1px solid #bde3fa;
      }
      .summary-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.95rem;
        color: #475569;
        margin-bottom: 12px;
      }
      .summary-row strong {
        color: #0f172a;
        font-weight: 600;
      }
      .summary-row-total {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px dashed #0ea5e9;
        font-size: 1.1rem;
        font-weight: 700;
        color: #0ea5e9;
      }
      .summary-row-total strong {
        font-size: 1.3rem;
        color: #3b82f6;
      }
      
      /* --- 4. Ghi chú quan trọng --- */
      .modal-note {
        font-size: 0.85rem;
        font-style: italic;
        color: #64748b;
        text-align: center;
        margin-bottom: 24px;
      }
        
    `}
    </style>
     {/* 🎨 CSS hiệu ứng nền */}
  
    
    <div
      className="modal-content modal-content-update"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="modal-title-update">✏️ Cập nhật vé</h2>
      <p className="modal-subtitle">
        Chuyến: {selectedBooking.tripId?.tenChuyen}
      </p>

      {/* --- 1. GHI CHÚ: Chú thích --- */}
      <div className="seat-legend">
        <div className="legend-item">
          <div className="legend-box legend-box-available"></div>
          <span>Trống</span>
        </div>
        <div className="legend-item">
          <div className="legend-box legend-box-booked"></div>
          <span>Đã đặt</span>
        </div>
        <div className="legend-item">
          <div className="legend-box legend-box-selected"></div>
          <span>Đang chọn</span>
        </div>
      </div>
      
      {/* --- 2. CHI TIẾT: Mô phỏng xe --- */}
      <div className="seat-grid-container">
        <div className="seat-grid-detailed">
          {/* Box tài xế */}
          <div className="driver-box">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="1.05" y1="12" x2="7" y2="12"/><line x1="17.01" y1="12" x2="22.96" y2="12"/></svg>
            Tài xế
          </div>
          
          {/* Ghi chú lối đi */}
          <div className="aisle-label">LỐI ĐI</div>

          {/* Render ghế */}
          {tripSeats.map((seat) => {
            const isBooked = availableSeats.includes(seat);
            const isSelected = selectedSeats.includes(seat);
            // Ghi chú: Ẩn ghế 'C' để tạo lối đi
            const isAisle = ['A3', 'B3', 'C3', 'D3', 'E3', 'F3'].includes(seat); 
            // ^^^ LƯU Ý: Bạn cần điều chỉnh logic này
            // (ví dụ: `seat.includes('3')` nếu cột 3 là lối đi)
            // Hoặc đơn giản là không render ghế đó ra.
            
            return (
              <div
                key={seat}
                onClick={() => !isBooked && handleSeatClick(seat)}
                className={`seat-btn 
                  ${isBooked ? 'booked' : ''} 
                  ${isSelected ? 'selected' : ''}
                  ${isAisle ? 'aisle' : ''} 
                `}
              >
                {seat}
              </div>
            );
          })}
        </div>
      </div>

      {/* --- 3. CHI TIẾT: Chi tiết giá --- */}
      <div className="update-summary">
        <div className="summary-row">
          <span>Số lượng ghế chọn:</span>
          <strong>{selectedSeats.length} ghế</strong>
        </div>
        <div className="summary-row">
          <span>Ghế:</span>
          <strong style={{maxWidth: '250px', textAlign: 'right', lineHeight: 1.4}}>
            {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Chưa chọn'}
          </strong>
        </div>
        <div className="summary-row">
          {/* Ghi chú đơn giá */}
          <span>Đơn giá:</span>
          <strong>{selectedBooking.tripId?.giaVe.toLocaleString()}₫ / ghế</strong>
        </div>
        <div className="summary-row summary-row-total">
          <span>Tổng tiền mới:</span>
          <strong>
            {(selectedSeats.length * selectedBooking.tripId?.giaVe).toLocaleString()}₫
          </strong>
        </div>
      </div>

      {/* --- 4. GHI CHÚ: Cảnh báo --- */}
      <p className="modal-note">
        Việc đổi vé có thể làm thay đổi tổng tiền và mã giảm giá (nếu có).
      </p>

      <div className="modal-actions">
        <button
          onClick={handleUpdateBooking}
          className="btn btn-update-confirm"
        >
          Xác Nhận Cập Nhật
        </button>
        <button
          onClick={() => setShowUpdateForm(false)}
          className="btn btn-update-cancel"
        >
          Hủy
        </button>
      </div>  
    </div>
  </div>
)}

  {/* --- Detail Modal (WOW DESIGN) --- */}
  {showDetail && selectedBooking && (
    <div className="modal-overlay" onClick={() => setShowDetail(false)}>
      <div
        className="modal-content modal-content-detail"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Phần đầu vé */}
        <div className="ticket-header">
          <h2 className="ticket-title">{selectedBooking.tripId?.tenChuyen}</h2>
          <img
            src={getImageUrl(selectedBooking.tripId?.hinhAnh)}
            alt={selectedBooking.tripId?.tenChuyen}
            className="ticket-image"
          />
        </div>

        {/* Phần thân vé */}
        <div className="ticket-body">
          <div className="ticket-info-row">
            <span>📍</span>
            <span>
              <strong>Đi từ:</strong> {selectedBooking.tripId?.tu}
            </span>
          </div>
          <div className="ticket-info-row">
            <span>🎯</span>
            <span>
              <strong>Đến:</strong> {selectedBooking.tripId?.den}
            </span>
          </div>
          <div className="ticket-info-row">
            <span>📅</span>
            <span>
              <strong>Ngày:</strong> {selectedBooking.tripId?.ngayKhoiHanh}
            </span>
          </div>
          <div className="ticket-info-row">
            <span>🕐</span>
            <span>
              <strong>Giờ:</strong> {selectedBooking.tripId?.gioKhoiHanh}
            </span>
          </div>
          <div className="ticket-info-row">
            <span>💺</span>
            <span>
              <strong>Ghế:</strong> {selectedBooking.soGhe.join(', ')}
            </span>
          </div>
          <div className="ticket-info-row">
            <span>🚌</span>
            <span>
              <strong>Nhà xe:</strong> {selectedBooking.tripId?.nhaXe || 'Không rõ'}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span>🚗</span>
                <span>
                  <strong>Hãng xe:</strong>{" "}
                  {selectedBooking.tripId?.hangXe || "Không rõ"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span>🔢</span>
                <span>
                  <strong>Mã tài:</strong>{" "}
                  {selectedBooking.tripId?.maTai || "Chưa có"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span>🎨</span>
                <span>
                  <strong>Màu xe:</strong>{" "}
                  {selectedBooking.tripId?.mauSac || "Không rõ"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span>✨</span>
                <span>
                  <strong>Tiện ích:</strong>{" "}
                  {selectedBooking.tripId?.tienIch || "Không có"}
                </span>
              </div>
          {/* ... Thêm các thông tin khác nếu cần ... */}
          
          <div className="ticket-total">
            <span>💰</span>
            <span className="ticket-total-price">
              Tổng tiền: {selectedBooking.totalPrice.toLocaleString()}₫
            </span>
          </div>
        </div>

        {/* Đường xé vé */}
        <div className="ticket-rip"></div>

        {/* Cuống vé */}
        <div className="ticket-stub">
          <div className="ticket-qr-placeholder">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#bde3fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h4v4H4zM10 4h4v4h-4zM16 4h4v4h-4zM4 10h4v4H4zM16 10h4v4h-4zM4 16h4v4H4zM10 16h4v4h-4zM16 16h4v4h-4zM10 10h4v4h-4z"/></svg>
          </div>
          <div className="ticket-stub-info">
            <p>Mã đặt vé: {selectedBooking._id.slice(-6).toUpperCase()}</p>
            <span>Vui lòng đưa mã này cho nhân viên soát vé</span>
          </div>
        </div>
        
        {/* Nút đóng */}
        <div className="ticket-close-btn-wrapper">
           <button
            onClick={() => setShowDetail(false)}
            className="modal-close-btn"
          >
            ❌ Đóng
          </button>
        </div>
      </div>
    </div>
  )}

      {/* Payment Modal */}
      {showPaymentForm && selectedBooking && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 60,
            backdropFilter: "blur(4px)",
          }}
          onClick={() => {
            setShowPaymentForm(false);
            setLinkedBank(null);
            setAppliedVoucher(null);
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "20px",
              width: "92%",
              maxWidth: "520px",
              boxShadow: "0 30px 80px rgba(2,6,23,0.35)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h2
              style={{
                marginBottom: "12px",
                fontSize: "1.4rem",
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              💳 Thanh toán - {selectedBooking.tripId?.tenChuyen}
            </h2>
            
            {/* Hiển thị tổng tiền và giảm giá */}
            <div style={{ marginBottom: 18 }}>
              <p style={{ margin: "0 0 8px", color: "#64748b" }}>
                Tổng gốc:{" "}
                <strong style={{ color: "#0f172a", fontSize: "1.05rem" }}>
                  {selectedBooking.totalPrice.toLocaleString()}₫
                </strong>
              </p>
              
              {appliedVoucher && (
                <>
                  <p style={{ margin: "4px 0", color: "#10b981", fontWeight: "600" }}>
                    🎟️ Voucher: {appliedVoucher.code} (-{discountAmount.toLocaleString()}₫)
                  </p>
                  <p style={{ margin: "8px 0 0", color: "#0ea5e9", fontWeight: "700", fontSize: "1.15rem" }}>
                    Tổng thanh toán: {finalTotal.toLocaleString()}₫
                  </p>
                </>
              )}
              
              {!appliedVoucher && (
                <p style={{ margin: "8px 0 0", color: "#0ea5e9", fontWeight: "700", fontSize: "1.15rem" }}>
                  Tổng thanh toán: {selectedBooking.totalPrice.toLocaleString()}₫
                </p>
              )}
            </div>

            {/* 🆕 Voucher Section */}
            <div
              style={{
                background: "#f8fafc",
                padding: "16px",
                borderRadius: "12px",
                marginBottom: "20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ fontSize: "1.2rem" }}>🎟️</span>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: "600", color: "#0f172a" }}>
                  Mã giảm giá
                </h3>
              </div>

              {appliedVoucher ? (
                <div
                  style={{
                    background: "#dcfce7",
                    padding: "12px",
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontWeight: "700", color: "#166534" }}>
                      {appliedVoucher.code}
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#15803d" }}>
                      Giảm {discountAmount.toLocaleString()}₫
                    </p>
                  </div>
                  <button
                    onClick={handleRemoveVoucher}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      background: "#ef4444",
                      color: "#fff",
                      border: "none",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Xóa
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                    <input
                      type="text"
                      placeholder="Nhập mã voucher"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        outline: "none",
                        fontSize: "0.9rem",
                      }}
                    />
                    <button
                      onClick={handleApplyVoucher}
                      className="btn-hover"
                      style={{
                        padding: "10px 16px",
                        borderRadius: "8px",
                        background: "linear-gradient(135deg, #0ea5e9, #3b82f6)",
                        color: "#fff",
                        border: "none",
                        fontWeight: "600",
                        fontSize: "0.9rem",
                        cursor: "pointer",
                      }}
                    >
                      Áp dụng
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setShowVoucherList(!showVoucherList)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "6px",
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      color: "#0ea5e9",
                      fontWeight: "600",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    {showVoucherList ? "Ẩn danh sách ▲" : "Xem voucher có sẵn ▼"}
                  </button>

                  {showVoucherList && (
                    <div
                      style={{
                        marginTop: "12px",
                        maxHeight: "200px",
                        overflowY: "auto",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                      }}
                    >
                      {vouchers.length === 0 ? (
                        <p style={{ padding: "16px", textAlign: "center", color: "#64748b", margin: 0 }}>
                          Không có voucher nào
                        </p>
                      ) : (
                        vouchers.map((v) => (
                          <div
                            key={v._id}
                            className="voucher-item"
                            onClick={() => handleSelectVoucher(v.code)}
                            style={{
                              padding: "12px",
                              borderBottom: "1px solid #f1f5f9",
                              background: "#fff",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <p style={{ margin: 0, fontWeight: "700", color: "#0f172a", fontSize: "0.95rem" }}>
                                  {v.code}
                                </p>
                                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#64748b" }}>
                                  {v.discount}% OFF - Tối đa {v.maxDiscount?.toLocaleString()}₫
                                </p>
                              </div>
                              <span style={{ fontSize: "1.2rem" }}>🎁</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
{/* === FORM NHẬP ĐỊA CHỈ ĐÓN TẬN NƠI === */}
<div style={{
  background: "#f0fdf4",
  padding: "16px",
  borderRadius: "12px",
  margin: "20px 0",
  border: "1px solid #bbf7d0"
}}>
  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
    <span style={{ fontSize: "1.2rem" }}></span>
    <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#0f172a" }}>
      Địa chỉ đón (đến tận nơi)
    </h3>
  </div>

  <textarea
    rows={2}
    placeholder="VD: Cầu nguyễn Thế Bảo, Phú Hòa 1, Phú Yên"
    value={diemDonChiTiet}
    onChange={(e) => setDiemDonChiTiet(e.target.value)}
    style={{
      width: "100%",
      padding: "10px",
      borderRadius: "8px",
      border: "1px solid #86efac",
      outline: "none",
      fontSize: "0.9rem",
      resize: "vertical",
      background: "#fff"
    }}
  />

  <p style={{
    margin: "6px 0 0",
    fontSize: "0.8rem",
    color: "#166534",
    fontStyle: "italic"
  }}>
    Bắt buộc: Nhà xe sẽ đến đúng địa chỉ này
  </p>
</div>
            {/* PHẦN HIỂN THỊ LOGIC */}
            {isCheckingBank ? (
              
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <div
                  style={{
                    display: "inline-block",
                    width: "30px",
                    height: "30px",
                    border: "4px solid #e0f2fe",
                    borderTop: "4px solid #3b82f6",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                ></div>
                <p style={{ color: "#64748b", marginTop: 10, fontSize: "0.9rem" }}>
                  Đang kiểm tra liên kết...
                </p>
              </div>
            ) : linkedBank ? (
              <div
                style={{
                  background: "#f0f9ff",
                  padding: 20,
                  borderRadius: 12,
                  marginBottom: 16,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: "#0f172a",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                  }}
                >
                  Thanh toán với tài khoản đã liên kết:
                </p>
                <p
                  style={{
                    margin: "8px 0 0",
                    color: "#0ea5e9",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                  }}
                >
                  🏦 {linkedBank.bankName}
                </p>
                <p
                  style={{ margin: "4px 0 0", color: "#334155", fontSize: "0.9rem" }}
                >
                  Chủ TK: {linkedBank.accountHolder}
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  <button
                    onClick={() => setPaymentMethod("card")}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      borderRadius: 10,
                      border:
                        paymentMethod === "card" ? "none" : "1px solid #e6eef9",
                      background:
                        paymentMethod === "card"
                          ? "linear-gradient(135deg,#0ea5e9,#3b82f6)"
                          : "#fff",
                      color: paymentMethod === "card" ? "#fff" : "#0f172a",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Thẻ
                  </button>
                  <button
                    onClick={() => setPaymentMethod("bank")}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      borderRadius: 10,
                      border:
                        paymentMethod === "bank" ? "none" : "1px solid #e6eef9",
                      background:
                        paymentMethod === "bank"
                          ? "linear-gradient(135deg,#0ea5e9,#3b82f6)"
                          : "#fff",
                      color: paymentMethod === "bank" ? "#fff" : "#0f172a",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Ngân hàng
                  </button>
                  <button
                    onClick={() => setPaymentMethod("cash")}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      borderRadius: 10,
                      border:
                        paymentMethod === "cash" ? "none" : "1px solid #e6eef9",
                      background:
                        paymentMethod === "cash"
                          ? "linear-gradient(135deg,#0ea5e9,#3b82f6)"
                          : "#fff",
                      color: paymentMethod === "cash" ? "#fff" : "#0f172a",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Tiền mặt
                  </button>
                </div>

                {paymentMethod === "card" && (
                  <div style={{ display: "grid", gap: 10 }}>
                    <input
                      placeholder="Số thẻ (ví dụ: 4111 1111 1111 1111)"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      style={{
                        padding: "12px",
                        borderRadius: 10,
                        border: "1px solid #e6eef9",
                        outline: "none",
                        fontSize: "0.95rem",
                      }}
                    />
                    <input
                      placeholder="Tên in trên thẻ"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      style={{
                        padding: "12px",
                        borderRadius: 10,
                        border: "1px solid #e6eef9",
                        outline: "none",
                        fontSize: "0.95rem",
                      }}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        style={{
                          padding: "12px",
                          borderRadius: 10,
                          border: "1px solid #e6eef9",
                          outline: "none",
                          fontSize: "0.95rem",
                          flex: 1,
                        }}
                      />
                      <input
                        placeholder="CVV"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        style={{
                          padding: "12px",
                          borderRadius: 10,
                          border: "1px solid #e6eef9",
                          outline: "none",
                          fontSize: "0.95rem",
                          flex: 1,
                        }}
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === "bank" && (
                  <div style={{ display: "grid", gap: 10 }}>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b" }}>
                      Chọn ngân hàng để liên kết và thanh toán:
                    </p>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      style={{
                        padding: "12px",
                        borderRadius: 10,
                        border: "1px solid #e6eef9",
                        outline: "none",
                        fontSize: "0.95rem",
                        background: "#fff",
                      }}
                    >
                      <option value="">-- Chọn ngân hàng --</option>
                      {banks.map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {paymentMethod === "cash" && (
                  <div
                    style={{
                      background: "#f0f9ff",
                      padding: 20,
                      borderRadius: 12,
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        color: "#0f172a",
                        fontWeight: 600,
                        fontSize: "1rem",
                      }}
                    >
                      Xác nhận thanh toán
                    </p>
                    <p
                      style={{
                        margin: "8px 0 0",
                        color: "#334155",
                        fontSize: "0.9rem",
                      }}
                    >
                      Bạn xác nhận vé này đã được thanh toán bằng tiền mặt?
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Nút xác nhận và hủy */}
            <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
              {(isCheckingBank || !linkedBank) && (
                <button
                  onClick={() => handleConfirmPayment()}
                  disabled={payLoading || isCheckingBank}
                  className="btn-hover"
                  style={{
                    flex: 1,
                    minWidth: "150px",
                    padding: "14px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    color: "#fff",
                    border: "none",
                    fontWeight: 600,
                    fontSize: "1rem",
                    cursor:
                      payLoading || isCheckingBank ? "not-allowed" : "pointer",
                    opacity: payLoading || isCheckingBank ? 0.7 : 1,
                  }}
                >
                  {payLoading
                    ? "Đang xử lý..."
                    : paymentMethod === "cash"
                    ? "Xác Nhận (Tiền mặt)"
                    : "Xác Nhận Thanh Toán"}
                </button>
              )}

              {!isCheckingBank && linkedBank && (
                <button
                  onClick={() => handleConfirmPayment()}
                  disabled={payLoading}
                  className="btn-hover"
                  style={{
                    flex: 1,
                    minWidth: "150px",
                    padding: "14px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    color: "#fff",
                    border: "none",
                    fontWeight: 600,
                    fontSize: "1rem",
                    cursor: payLoading ? "not-allowed" : "pointer",
                    opacity: payLoading ? 0.7 : 1,
                  }}
                >
                  {payLoading ? "Đang xử lý..." : `Xác nhận (Bank)`}
                </button>
              )}

              {!isCheckingBank && linkedBank && (
                <button
                  onClick={() => handleConfirmPayment("cash")}
                  disabled={payLoading}
                  className="btn-hover"
                  style={{
                    flex: 1,
                    minWidth: "150px",
                    padding: "14px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #0ea5e9, #3b82f6)",
                    color: "#fff",
                    border: "none",
                    fontWeight: 600,
                    fontSize: "1rem",
                    cursor: payLoading ? "not-allowed" : "pointer",
                    opacity: payLoading ? 0.7 : 1,
                  }}
                >
                  Xác nhận (Tiền mặt)
                </button>
              )}

              {(isCheckingBank || !linkedBank) && (
                <button
                  onClick={() => {
                    setShowPaymentForm(false);
                    setLinkedBank(null);
                    setAppliedVoucher(null);
                  }}
                  disabled={payLoading}
                  className="btn-hover"
                  style={{
                    flex: 1,
                    minWidth: "150px",
                    padding: "14px",
                    borderRadius: "12px",
                    background: "#f1f5f9",
                    color: "#64748b",
                    border: "none",
                    fontWeight: 600,
                    fontSize: "1rem",
                    cursor: payLoading ? "not-allowed" : "pointer",
                    opacity: payLoading ? 0.7 : 1,
                  }}
                >
                  Hủy
                </button>
              )}
            </div>

            {!isCheckingBank && linkedBank && (
              <button
                onClick={() => {
                  setShowPaymentForm(false);
                  setLinkedBank(null);
                  setAppliedVoucher(null);
                }}
                disabled={payLoading}
                className="btn-hover"
                style={{
                  width: "100%",
                  marginTop: "10px",
                  padding: "14px",
                  borderRadius: "12px",
                  background: "#f1f5f9",
                  color: "#64748b",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "1rem",
                  cursor: payLoading ? "not-allowed" : "pointer",
                  opacity: payLoading ? 0.7 : 1,
                }}
              >
                Hủy
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}