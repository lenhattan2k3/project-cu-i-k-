import React, { useEffect, useState } from "react";
import { auth } from "../../firebase/config";
import { getBankByUser } from "../../api/bankApi";
import { useNavigate } from "react-router-dom";
import { bookTicket } from "../../api/bookingApi";
import { getPaymentStatus } from "../../api/payment-methodApi";
import airplane from "../../assets/unnamed.jpg";
import heroBus from "../../assets/hero-bus.jpg";
import trainStation from "../../assets/train-station.jpg";



import { getPromotions, applyPromotion } from "../../api/promotionsApi"; // Import thêm
const CLOUDINARY_BASE_URL = "https://res.cloudinary.com/<your-cloud-name>/image/upload/";

// ✅ MAPPING TÊN NHÀ XE
const NHA_XE_MAPPING: Record<string, string> = {
  "yft1Ag1eaRf3uCigXyCJLpmu9R42": "Phúc Yên",
  "SFbbzut0USTG5F6ZM3COrLXKGS93": "Cúc Tư",
  "BuPwvEMgfCNEDbz2VNKx5hnpBT52": "Hồng Sơn",
  "U5XWQ12kL8VnyQ0ovZTvUZLdJov1": "Nhật Tân"
};
const getNhaXeName = (id: string) => NHA_XE_MAPPING[id] || id;

type PayosSession = {
  orderCode: number;
  amount: number;
  description?: string;
  checkoutUrl?: string | null;
  qrCode?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  bankBin?: string | null;
  shortLink?: string | null;
  expiredAt?: string | null;
};

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
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank" | "cash" | "payos">("card");
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [cardNumber, setCardNumber] = useState<string>("");
  const [cardName, setCardName] = useState<string>("");
  const [cardExpiry, setCardExpiry] = useState<string>("");
  const [cardCvv, setCardCvv] = useState<string>("");
  const [payLoading, setPayLoading] = useState(false);
  const [payosSession, setPayosSession] = useState<PayosSession | null>(null);
  const [payosGenerating, setPayosGenerating] = useState(false);
  const [payosError, setPayosError] = useState<string>("");

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
  const [selectedBookingPartnerId, setSelectedBookingPartnerId] = useState<string>("");
  const [isFoodService, setIsFoodService] = useState(false);

  const banks = [
    { id: "vcb", name: "Vietcombank" },
    { id: "acb", name: "ACB" },
    { id: "tech", name: "Techcombank" },
    { id: "mb", name: "MB Bank" },
    { id: "tpb", name: "TPBank" },
  ];

  const resetPayosSession = () => {
    setPayosSession(null);
    setPayosError("");
  };

  const copyToClipboard = (value: string, label?: string) => {
    if (!value) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(value)
        .then(() => alert(label ? `${label} đã được sao chép` : "Đã sao chép"))
        .catch(() => alert("Không thể sao chép nội dung này"));
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      alert(label ? `${label} đã được sao chép` : "Đã sao chép");
    } catch {
      alert("Không thể sao chép nội dung này");
    } finally {
      document.body.removeChild(textarea);
    }
  };

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
  
      setSelectedTab("cancelled");
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
    } else if (selectedTab === "paid") {
      return b.status === "paid";
    } else {
      return b.status === "cancelled";
    }
  });

  // 🆕 --- Voucher handlers ---
  const fetchVouchers = async (partnerId?: string) => {
    const normalized = partnerId?.trim();
    if (!normalized) {
      setVouchers([]);
      return;
    }
    try {
      const data = await getPromotions(normalized);
      setVouchers(Array.isArray(data) ? data : data.promotions || []);
    } catch (error) {
      console.error("Lỗi khi tải voucher:", error);
      setVouchers([]);
    }
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      alert("Vui lòng nhập mã voucher!");
      return;
    }

    if (!selectedBooking) return;
    const bookingPartnerId =
      selectedBookingPartnerId ||
      selectedBooking.partnerId ||
      selectedBooking.tripId?.partnerId;
    if (!bookingPartnerId) {
      alert("Không xác định được nhà xe của vé, vui lòng thử lại sau!");
      return;
    }

    try {
      const result = await applyPromotion(
        voucherCode,
        selectedBooking.totalPrice,
        bookingPartnerId
      );
      
      setAppliedVoucher({
        code: result.code,
        discount: result.discount
      });
      setDiscountAmount(result.discount);
      setFinalTotal(result.newTotal + (isFoodService ? 50000 : 0));
      resetPayosSession();
      
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
    setFinalTotal((selectedBooking?.totalPrice || 0) + (isFoodService ? 50000 : 0));
    setVoucherCode("");
    resetPayosSession();
  };

  const handleSelectVoucher = (code: string) => {
    setVoucherCode(code);
    setShowVoucherList(false);
  };

  // --- Payment handlers ---
  const openPaymentModal = async (booking: any) => {
    setSelectedBooking(booking);
    const bookingPartnerId = booking?.partnerId || booking?.tripId?.partnerId || "";
    setSelectedBookingPartnerId(bookingPartnerId);
    setShowPaymentForm(true);

    // Reset voucher states
    setAppliedVoucher(null);
    setDiscountAmount(0);
    setFinalTotal(booking.totalPrice);
    setVoucherCode("");
    setIsFoodService(false);
    resetPayosSession();

    setPaymentMethod("card");
    setSelectedBank("");
    setCardNumber("");
    setCardName("");
    setCardExpiry("");
    setCardCvv("");

    setIsCheckingBank(true);
    setLinkedBank(null);

    // Load vouchers của đúng nhà xe
    await fetchVouchers(bookingPartnerId);

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

  const handleGeneratePayosSession = async () => {
    if (!selectedBooking || !firebaseUid) {
      alert("Vui lòng đăng nhập và chọn vé cần thanh toán.");
      return;
    }

    if (!diemDonChiTiet.trim()) {
      alert("Vui lòng nhập địa chỉ đón chi tiết trước khi tạo mã PayOS!");
      return;
    }

    setPayosGenerating(true);
    setPayosError("");
    setPayosSession(null);

    try {
      const orderCode = Number(String(Date.now()).slice(-6));
      const amount = finalTotal > 0 ? finalTotal : selectedBooking.totalPrice;
      const description = `Thanh toan ve ${selectedBooking.tripId?.tenChuyen?.slice(0, 20) || "xe"}`;
      const returnQuery = new URLSearchParams({
        orderCode: String(orderCode),
        amount: String(amount),
      }).toString();
      const returnUrl = `${window.location.origin}/payment-success?${returnQuery}`;
      const cancelUrl = `${window.location.origin}/homeuser`;

      // Lưu địa chỉ đón trước để nhà xe nhận được thông tin
      await fetch(`http://localhost:5000/api/bookings/${selectedBooking._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diemDonChiTiet: diemDonChiTiet.trim() }),
      });

      const res = await fetch("http://localhost:5000/api/payos/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: firebaseUid,
          bookingId: selectedBooking._id,
          amount,
          description,
          orderCode,
          returnUrl,
          cancelUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể tạo mã thanh toán PayOS");
      }

      const info = data.paymentInfo || {};
      const normalizedOrderCode = Number(info.orderCode || orderCode);
      const normalizedAmount = Number(info.amount || amount);
      setPayosSession({
        orderCode: isNaN(normalizedOrderCode) ? orderCode : normalizedOrderCode,
        amount: isNaN(normalizedAmount) ? amount : normalizedAmount,
        description: info.description || description,
        checkoutUrl: info.checkoutUrl || data.paymentLink || null,
        qrCode: info.qrCode || null,
        accountNumber: info.accountNumber || null,
        accountName: info.accountName || null,
        bankBin: info.bankBin || null,
        shortLink: info.shortLink || null,
        expiredAt: info.expiredAt || null,
      });
    } catch (err: any) {
      console.error("PayOS Error:", err);
      setPayosError(err?.message || "Lỗi kết nối PayOS");
    } finally {
      setPayosGenerating(false);
    }
  };

  const handleConfirmPayment = async (methodOverride?: "card" | "bank" | "cash" | "payos") => {
    const method = methodOverride || paymentMethod;
  
    if (!selectedBooking) return;

    // === VALIDATE ĐỊA CHỈ ĐÓN (BẮT BUỘC) ===
    if (!diemDonChiTiet.trim()) {
      alert("Vui lòng nhập địa chỉ đón chi tiết!");
      return;
    }

    // === PAYOS HANDLING ===
    if (method === "payos") {
      if (!payosSession?.checkoutUrl) {
        alert("Vui lòng tạo mã thanh toán PayOS trước khi xác nhận!");
        return;
      }
      window.location.href = payosSession.checkoutUrl;
      return;
    }
  
    // === VALIDATE CARD / BANK ===
    if (method !== "cash" && !linkedBank) {
      if (method === "card") {
        if (!validateCard()) return;
      } else if (method === "bank") {
        if (!validateBank()) return;
      }
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
      if (appliedVoucher || isFoodService) {
        if (appliedVoucher) {
          updatePayload.voucherCode = appliedVoucher.code;
          updatePayload.discountAmount = discountAmount;
        }
        updatePayload.isFoodService = isFoodService;
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
                ...((appliedVoucher || isFoodService) && {
                  ...(appliedVoucher && {
                    voucherCode: appliedVoucher.code,
                    discountAmount: discountAmount,
                  }),
                  isFoodService: isFoodService,
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
      setSelectedTab("paid");
      setSelectedBooking(null);
      setLinkedBank(null);
      setAppliedVoucher(null);
      setDiscountAmount(0);
      setFinalTotal(0);
      setIsFoodService(false);
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
    <div style={{ position: "relative", minHeight: "100vh", paddingBottom: "40px" }}>
      
  {/* --- TOÀN BỘ STYLES ĐƯỢC CHUYỂN VÀO ĐÂY --- */}
  <style>{`
    /* --- Animations --- */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
      100% { transform: translateY(0px); }
    }
    @keyframes spin { 
      to { transform: rotate(360deg); } 
    }

    /* --- Tabs (Premium Floating Pill Style) --- */
    .tabs-container {
      display: flex;
      justify-content: center;
      background: rgba(125, 193, 238, 0.9);
      backdrop-filter: blur(10px);
      border-radius: 44px;
      box-shadow: 0 8px 32px rgba(91, 94, 2, 0.08);
      padding: 8px;
      max-width: 1700px;
      width: 95%;
      margin: 0px auto 40px;
      border: 1px solid rgba(255, 255, 255, 0.6);
      position: sticky;
      top: 10px;
      z-index: 100;
    }
    .tab-btn {
      flex: 1;
      padding: 16px 0;
      border: none;
      background: transparent;
      color: #64748b;
      font-weight: 700;
      font-size: 1.1rem;
      cursor: pointer;
      position: relative;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 18px;
      z-index: 1;
    }
    .tab-btn:hover {
      color: #3b82f6;
      background: rgba(59, 130, 246, 0.05);
    }
    .tab-btn.active {
      color: #2563eb;
      background: #ffffff;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
      transform: scale(1.02);
    }
    /* Remove old underline */
    .tab-btn.active::after {
      display: none;
    }

    /* --- Empty State --- */
    .empty-state {
      text-align: center;
      padding: 100px 20px;
      animation: fadeIn 0.6s ease;
    }
    .empty-bus-icon {
      width: 350px;
      height: auto;
      margin-bottom: 30px;
      opacity: 0.9;
      animation: float 6s ease-in-out infinite; /* Floating animation */
      filter: drop-shadow(0 20px 30px rgba(59, 130, 246, 0.15));
    }
    .empty-text {
      color: #94a3b8;
      font-size: 1.5rem;
      font-weight: 600;
      letter-spacing: -0.5px;
    }

    /* --- Booking Card Grid --- */
    .cards-grid {
      display: flex;
      flex-direction: column;
      gap: 20px;
      max-width: 1600px;
      width: 95%;
      margin: 0 auto;
      padding: 0 16px 60px;
    }

    /* --- Ticket Card (Compact & Clean Style like reference) --- */
    .booking-card {
      display: flex;
      flex-direction: row;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      cursor: pointer;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      border: 1px solid #e5e7eb;
      transition: all 0.3s ease;
      position: relative;
      animation: fadeIn 0.4s ease;
    }
    .booking-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
      border-color: #d1d5db;
    }

    /* Image Area (Left) */
    .card-image-wrapper {
      width: 200px;
      min-width: 200px;
      height: 180px;
      position: relative;
      overflow: hidden;
      flex-shrink: 0;
    }
    .card-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }
    .booking-card:hover .card-image {
      transform: scale(1.08);
    }

    /* Status Badge (Top Left Corner) */
    .card-status-badge {
      position: absolute;
      top: 12px;
      left: 0;
      padding: 6px 12px 6px 10px;
      border-radius: 0 20px 20px 0;
      font-size: 0.7rem;
      font-weight: 700;
      z-index: 2;
      display: flex;
      align-items: center;
      gap: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .card-status-badge.paid { 
      background: linear-gradient(135deg, #10b981, #059669); 
      color: white; 
    }
    .card-status-badge.pending { 
      background: linear-gradient(135deg, #f59e0b, #d97706); 
      color: white; 
    }
    .card-status-badge.cancelled { 
      background: linear-gradient(135deg, #ef4444, #dc2626); 
      color: white; 
    }
    .card-status-badge::before {
      content: "→";
      font-size: 0.8rem;
    }

    /* Content Area (Right) */
    .card-content {
      flex: 1;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-width: 0;
    }
    
    /* Header: NhaXe Name + Rating */
    .card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .card-nhaxe-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .card-nhaxe-type {
      font-size: 0.7rem;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .card-nhaxe-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1f2937;
      margin: 0;
    }
    .card-rating {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #fef3c7;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #d97706;
    }
    .card-rating::before {
      content: "★";
      color: #f59e0b;
    }

    /* Info Tags Row */
    .card-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
    }
    .card-tag {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      background: #f3f4f6;
      border-radius: 6px;
      font-size: 0.75rem;
      color: #4b5563;
      font-weight: 500;
    }
    .card-tag.date {
      background: #dbeafe;
      color: #2563eb;
    }
    .card-tag.seat {
      background: #fce7f3;
      color: #db2777;
    }
    .card-tag.price {
      background: #d1fae5;
      color: #059669;
      font-weight: 700;
    }

    /* Route Timeline */
    .card-route {
      display: flex;
      align-items: stretch;
      gap: 12px;
      margin-bottom: 12px;
      padding: 14px 16px;
      background: #f8fafc;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }
    .route-time {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: flex-start;
      min-width: 55px;
    }
    .time-depart {
      font-size: 1.3rem;
      font-weight: 800;
      color: #1f2937;
      line-height: 1;
    }
    .time-arrive {
      font-size: 1.1rem;
      font-weight: 700;
      color: #6b7280;
      line-height: 1;
    }
    .route-line {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2px 0;
    }
    .route-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #3b82f6;
      border: 3px solid #dbeafe;
      box-shadow: 0 0 0 2px #3b82f6;
    }
    .route-dot.end {
      background: #ef4444;
      border-color: #fee2e2;
      box-shadow: 0 0 0 2px #ef4444;
    }
    .route-connector {
      width: 2px;
      flex: 1;
      background: linear-gradient(to bottom, #3b82f6, #ef4444);
      margin: 6px 0;
      min-height: 28px;
    }
    .route-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .route-point {
      display: flex;
      flex-direction: column;
    }
    .route-city {
      font-size: 1rem;
      font-weight: 700;
      color: #1f2937;
    }
    .route-duration {
      font-size: 0.8rem;
      color: #6b7280;
      background: #e5e7eb;
      padding: 4px 10px;
      border-radius: 20px;
      display: inline-block;
      margin: 6px 0;
      width: fit-content;
    }

    /* Amenities */
    .card-amenities {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .amenity-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      color: #10b981;
      font-weight: 500;
    }
    .amenity-item::before {
      content: "✓";
      font-weight: 700;
    }

    /* Voucher Badge */
    .card-voucher {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      color: #b45309;
      font-weight: 600;
      margin-top: 8px;
    }

    /* Actions */
    .card-actions-wrapper {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px dashed #e5e7eb;
      flex-wrap: wrap;
    }

    .action-btn {
      padding: 8px 16px;
      border-radius: 8px;
      border: none;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .action-btn:active {
      transform: scale(0.96);
    }
    .btn-primary {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }
    .btn-primary:hover {
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: #f3f4f6;
      color: #4b5563;
      border: 1px solid #e5e7eb;
    }
    .btn-secondary:hover {
      background: #e5e7eb;
      color: #1f2937;
    }
    .btn-danger {
      background: #fee2e2;
      color: #dc2626;
    }
    .btn-danger:hover {
      background: #fecaca;
    }
    .btn-success {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
    .btn-success:hover {
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
      transform: translateY(-1px);
    }

    /* Responsive */
    @media (max-width: 640px) {
      .booking-card {
        flex-direction: column;
      }
      .card-image-wrapper {
        width: 100%;
        height: 140px;
        min-width: unset;
      }
      .card-content {
        padding: 14px;
      }
      .card-tags {
        gap: 6px;
      }
      .card-route {
        gap: 12px;
      }
      .time-depart {
        font-size: 1.2rem;
      }
      .card-actions-wrapper {
        flex-direction: column;
      }
      .action-btn {
        justify-content: center;
        width: 100%;
      }
    }

    /* Legacy info styles (keeping for compatibility) */
    .card-title {
      display: none;
    }
    .card-info-grid {
      display: none;
    }
    .info-box {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      border-radius: 16px;
      transition: background 0.2s;
    }
    .info-label {
      font-size: 0.8rem;
      color: #94a3b8;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-value {
      font-size: 1.1rem;
      color: #334155;
      font-weight: 700;
    }
    .info-value.price {
      color: #0ea5e9;
      font-size: 1.5rem;
      font-weight: 800;
    }

    /* Actions Area */
    .card-actions-wrapper {
      margin-top: auto;
      padding-top: 24px;
      border-top: 1px dashed #e2e8f0;
      display: flex;
      gap: 16px;
      justify-content: flex-end;
    }

    .action-btn {
      padding: 12px 24px;
      border-radius: 14px;
      border: none;
      font-weight: 700;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .action-btn:active {
      transform: scale(0.95);
    }
    .btn-primary {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.4);
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 30px -5px rgba(37, 99, 235, 0.5);
    }
    .btn-secondary {
      background: #ffffff;
      color: #475569;
      border: 1px solid #e2e8f0;
    }
    .btn-secondary:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
      color: #1e293b;
    }
    .btn-danger {
      background: #fee2e2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }
    .btn-danger:hover {
      background: #fecaca;
      color: #b91c1c;
      box-shadow: 0 10px 20px -5px rgba(220, 38, 38, 0.2);
    }

    /* --- Modal Styles (Keep existing but clean up) --- */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.4);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 200;
      backdrop-filter: blur(8px);
    }
    .modal-content {
      background: #ffffff;
      border-radius: 24px;
      width: 90%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255,255,255,0.5);
    }
    /* ... (Other modal styles can remain similar or be simplified) ... */
    .modal-close-btn {
      margin-top: 20px;
      width: 100%;
      padding: 12px;
      border-radius: 8px;
      background: #f1f5f9;
      color: #64748b;
      border: none;
      font-weight: 600;
      cursor: pointer;
    }
    
    /* --- Update Seat Modal --- */
    .modal-content-update {
      padding: 24px;
      max-width: 480px;
    }
    .modal-title-update {
      margin: 0 0 20px;
      font-size: 1.4rem;
      font-weight: 700;
      color: #0f172a;
    }
    .seat-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
      margin-bottom: 20px;
    }
    .seat-btn {
      aspect-ratio: 1;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      color: #475569;
      font-weight: 600;
      font-size: 0.85rem;
    }
    .seat-btn:hover:not(.booked) {
      border-color: #3b82f6;
      color: #3b82f6;
    }
    .seat-btn.booked {
      background: #e2e8f0;
      border-color: #e2e8f0;
      cursor: not-allowed;
      color: #94a3b8;
    }
    .seat-btn.selected {
      background: #3b82f6;
      border-color: #3b82f6;
      color: #fff;
    }

    .update-total-price {
      padding: 16px;
      background: #f8fafc;
      border-radius: 12px;
      margin-bottom: 20px;
      text-align: center;
      border: 1px solid #e2e8f0;
    }
    .update-total-price p {
      margin: 0;
      color: #0ea5e9;
      font-weight: 700;
      font-size: 1.1rem;
    }
    .modal-actions {
      display: flex;
      gap: 12px;
    }
    .btn-update-confirm {
      flex: 1;
      padding: 12px;
      border-radius: 8px;
      background: #3b82f6;
      color: #fff;
      font-weight: 600;
      border: none;
      cursor: pointer;
    }
    .btn-update-cancel {
      flex: 1;
      padding: 12px;
      border-radius: 8px;
      background: #f1f5f9;
      color: #64748b;
      border: 1px solid #e2e8f0;
      font-weight: 600;
      cursor: pointer;
    }

    /* --- Detail Ticket Modal --- */
    .modal-content-detail {
      max-width: 400px;
      padding: 0; 
      overflow: hidden; 
    }
    .ticket-header {
      padding: 20px 20px 16px;
    }
    .ticket-title {
      margin: 0 0 12px;
      font-size: 1.4rem;
      font-weight: 700;
      color: #1e293b;
    }
    .ticket-image {
      width: 100%;
      height: 180px;
      object-fit: cover;
      border-radius: 12px;
    }
    .ticket-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      color: #64748b;
      font-size: 0.9rem;
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
      background: #f8fafc;
      border-radius: 8px;
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
        radial-gradient(circle at 0 10px, transparent 0, transparent 5px, #f8fafc 5px) 0 0 / 15px 20px repeat-x,
        radial-gradient(circle at 100% 10px, #f8fafc 0, #f8fafc 5px, transparent 5px) 100% 0 / 15px 20px repeat-x;
      position: relative;
    }
    .ticket-rip::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 10px;
      right: 10px;
      height: 1px;
      border-top: 2px dashed #cbd5e1;
      transform: translateY(-50%);
    }

    /* Cuống vé với QR */
    .ticket-stub {
      background: #f8fafc;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .ticket-qr-placeholder {
      width: 60px;
      height: 60px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      color: #cbd5e1;
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
      padding: 20px;
      background: #f8fafc;
    }

  `}</style>
  
   {/* 💡 Toàn bộ nội dung nổi lên trên */}
   <div style={{ position: "relative", zIndex: 2 }}>
      
      {/* --- Tabs --- */}
      <div className="tabs-container">
        <button
          onClick={() => setSelectedTab("pending")}
          className={`tab-btn ${selectedTab === "pending" ? "active" : ""}`}
        >
          Hiện tại
        </button>
        <button
          onClick={() => setSelectedTab("paid")}
          className={`tab-btn ${selectedTab === "paid" ? "active" : ""}`}
        >
          Đã đi
        </button>
        <button
          onClick={() => setSelectedTab("cancelled")}
          className={`tab-btn ${selectedTab === "cancelled" ? "active" : ""}`}
        >
          Đã hủy
        </button>
      </div>


      {/* --- Loader --- */}
      {loading && (
        <div className="loader-container">
          <div className="loader-spinner"></div>
        </div>
      )}

      {/* --- Message --- */}
      {message && !loading && <p className="message">{message}</p>}

      {/* --- Empty State (Bus Illustration) --- */}
      {!loading && filteredBookings.length === 0 && (
        <div className="empty-state">
          {/* Simple SVG Bus Illustration */}
          <svg className="empty-bus-icon" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M40 110H160V60C160 48.9543 151.046 40 140 40H60C48.9543 40 40 48.9543 40 60V110Z" fill="#3b82f6"/>
            <rect x="50" y="55" width="30" height="25" rx="2" fill="#93c5fd"/>
            <rect x="85" y="55" width="30" height="25" rx="2" fill="#93c5fd"/>
            <rect x="120" y="55" width="30" height="25" rx="2" fill="#93c5fd"/>
            <circle cx="60" cy="110" r="12" fill="#334155"/>
            <circle cx="140" cy="110" r="12" fill="#334155"/>
            <circle cx="60" cy="110" r="5" fill="#94a3b8"/>
            <circle cx="140" cy="110" r="5" fill="#94a3b8"/>
            <path d="M160 110H165C167.761 110 170 107.761 170 105V90" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round"/>
            <path d="M30 110H170" stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round"/>
            {/* City Background Hint */}
            <path d="M10 110V80H30V110" fill="#e2e8f0"/>
            <path d="M170 110V70H190V110" fill="#e2e8f0"/>
            <path d="M130 40V20H150V40" fill="#f1f5f9"/>
          </svg>
          <p className="empty-text">Chưa có vé nào trong mục này</p>
        </div>
      )}

      {/* --- Booking Cards --- */}
      <div className="cards-grid">
        {filteredBookings.map((b, idx) => (
          <div
            key={b._id}
            className="booking-card"
            style={{ animationDelay: `${idx * 0.1}s` }}
            onClick={() => toggleTicket(b._id)}
          >
            {/* Image Section */}
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
                  ? "Đã thanh toán"
                  : b.status === "cancelled"
                  ? "Đã hủy"
                  : timers[b._id] || "Chờ thanh toán"}
              </div>
            </div>

            {/* Content Section */}
            <div className="card-content">
              {/* Header: NhaXe + Rating */}
              <div className="card-header">
                <div className="card-nhaxe-info">
                  <span className="card-nhaxe-type">{b.tripId?.loaiXe || "Xe khách"}</span>
                  <h3 className="card-nhaxe-name">{b.tripId?.nhaXe || "Nhà xe"}</h3>
                </div>
                <div className="card-rating">
                  {b.tripId?.rating || "4.5"}
                </div>
              </div>

              {/* Info Tags */}
              <div className="card-tags">
                <span className="card-tag">{b.tripId?.loaiXe || "Giường nằm"}</span>
                <span className="card-tag date">📅 {b.tripId?.ngayKhoiHanh || "N/A"}</span>
                <span className="card-tag seat">🪑 Ghế: {b.soGhe.join(", ")}</span>
                <span className="card-tag price">💰 {b.totalPrice?.toLocaleString()}₫</span>
              </div>

              {/* Route Timeline */}
              <div className="card-route">
                <div className="route-time">
                  <span className="time-depart">{b.tripId?.gioKhoiHanh || "--:--"}</span>
                  <span className="time-arrive">{b.tripId?.gioDuKienDen || "--:--"}</span>
                </div>
                <div className="route-line">
                  <div className="route-dot"></div>
                  <div className="route-connector"></div>
                  <div className="route-dot end"></div>
                </div>
                <div className="route-info">
                  <div className="route-point">
                    <span className="route-city">{b.tripId?.tu || "Điểm đi"}</span>
                  </div>
                  <span className="route-duration">
                    {b.tripId?.thoiGianDiChuyen ? `~ ${b.tripId.thoiGianDiChuyen}` : ""} 
                    {b.tripId?.loaiDuong ? ` • ${b.tripId.loaiDuong}` : ""}
                  </span>
                  <div className="route-point">
                    <span className="route-city">{b.tripId?.den || "Điểm đến"}</span>
                  </div>
                </div>
              </div>

              {/* Pickup Point Display */}
              {b.diemDonChiTiet && (
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: '#4b5563', 
                  marginBottom: '12px', 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '6px',
                  background: '#f0f9ff',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px dashed #bae6fd'
                }}>
                   <span style={{ flexShrink: 0 }}>📍</span> 
                   <span><strong>Điểm đón:</strong> {b.diemDonChiTiet}</span>
                </div>
              )}

              {/* Amenities */}
              <div className="card-amenities">
                {(Array.isArray(b.tripId?.tienIch) 
                  ? b.tripId.tienIch 
                  : (typeof b.tripId?.tienIch === 'string' 
                      ? b.tripId.tienIch.split(',').map((s: string) => s.trim()) 
                      : ["Wifi", "Nước uống", "Điều hòa"])
                ).slice(0, 4).map((item: string, i: number) => (
                  <span key={i} className="amenity-item">{item}</span>
                ))}
              </div>

              {/* Voucher if applied */}
              {b.voucherCode && (
                <div className="card-voucher">
                  🎫 {b.voucherCode} (-{b.discountAmount?.toLocaleString()}₫)
                </div>
              )}

              {/* Actions (expanded) */}
              {selectedTicketId === b._id && (
                <div className="card-actions-wrapper">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBooking(b);
                      setShowDetail(true);
                    }}
                    className="action-btn btn-primary"
                  >
                    🔍 Chi tiết
                  </button>

                  {selectedTab === "pending" && b.status !== "cancelled" && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openPaymentModal(b);
                        }}
                        className="action-btn btn-success"
                      >
                        💳 Thanh toán
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenUpdateForm(b);
                        }}
                        className="action-btn btn-secondary"
                      >
                        ✏️ Đổi ghế
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancel(b._id);
                        }}
                        className="action-btn btn-danger"
                      >
                        ❌ Hủy vé
                      </button>
                    </>
                  )}

                  {selectedTab === "paid" && b.status === "paid" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm("Hủy vé ĐÃ THANH TOÁN?")) {
                          handleCancel(b._id);
                        }
                      }}
                      className="action-btn btn-danger"
                    >
                      ❌ Yêu cầu hoàn vé
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
          {selectedBooking.diemDonChiTiet && (
            <div className="ticket-info-row">
              <span>📍</span>
              <span>
                <strong>Điểm đón:</strong> {selectedBooking.diemDonChiTiet}
              </span>
            </div>
          )}
          <div className="ticket-info-row">
            <span>🚌</span>
            <span>
              <strong>Nhà xe:</strong> {getNhaXeName(selectedBooking.tripId?.nhaXe || "") || 'Không rõ'}
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
            resetPayosSession();
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
                <p style={{ margin: "4px 0", color: "#10b981", fontWeight: "600" }}>
                  🎟️ Voucher: {appliedVoucher.code} (-{discountAmount.toLocaleString()}₫)
                </p>
              )}

              {isFoodService && (
                 <p style={{ margin: "4px 0", color: "#f97316", fontWeight: "600" }}>
                    🍱 Dịch vụ ăn uống (+50.000₫)
                 </p>
              )}
              
              <p style={{ margin: "8px 0 0", color: "#0ea5e9", fontWeight: "700", fontSize: "1.15rem" }}>
                Tổng thanh toán: {finalTotal.toLocaleString()}₫
              </p>
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
                                  {v.discountType === "percentage"
                                    ? `Giảm ${v.discountValue}%`
                                    : `Giảm ${Number(v.discountValue).toLocaleString()}₫`}
                                </p>
                                <p style={{ margin: 0, fontSize: "0.78rem", color: "#94a3b8" }}>
                                  Số lượt tối đa: {v.maxUsage}
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
              {/* === DỊCH VỤ ĂN UỐNG === */}
              <div style={{
                background: "#fff7ed",
                padding: "16px",
                borderRadius: "12px",
                margin: "20px 0",
                border: "1px solid #fdba74",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="checkbox"
                    id="foodService"
                    checked={isFoodService}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsFoodService(checked);
                      setFinalTotal(prev => checked ? prev + 50000 : prev - 50000);
                        resetPayosSession();
                    }}
                    style={{ width: "20px", height: "20px", cursor: "pointer", accentColor: "#f97316" }}
                  />
                  <label htmlFor="foodService" style={{ cursor: "pointer", fontWeight: "600", color: "#9a3412" }}>
                    Dịch vụ ăn uống (+50.000₫)
                  </label>
                </div>
                <span style={{ fontSize: "1.2rem" }}>🍱</span>
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
                    onClick={() => setPaymentMethod("payos")}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      borderRadius: 10,
                      border:
                        paymentMethod === "payos" ? "none" : "1px solid #e6eef9",
                      background:
                        paymentMethod === "payos"
                          ? "linear-gradient(135deg,#0ea5e9,#3b82f6)"
                          : "#fff",
                      color: paymentMethod === "payos" ? "#fff" : "#0f172a",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    PayOS
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

                {paymentMethod === "payos" && (
                  <div
                    style={{
                      background: "#f0f9ff",
                      padding: 20,
                      borderRadius: 12,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: 0,
                          color: "#0f172a",
                          fontWeight: 600,
                          fontSize: "1rem",
                        }}
                      >
                        Thanh toán qua PayOS
                      </p>
                      <p
                        style={{
                          margin: "6px 0 0",
                          color: "#334155",
                          fontSize: "0.9rem",
                        }}
                      >
                        Nhập địa chỉ đón, sau đó tạo mã PayOS để nhận QR/chuyển khoản theo đúng mã giao dịch.
                      </p>
                    </div>

                    <button
                      onClick={handleGeneratePayosSession}
                      disabled={payosGenerating}
                      style={{
                        padding: "10px 16px",
                        borderRadius: 10,
                        border: "none",
                        background: "linear-gradient(135deg,#0ea5e9,#3b82f6)",
                        color: "#fff",
                        fontWeight: 700,
                        cursor: payosGenerating ? "not-allowed" : "pointer",
                      }}
                    >
                      {payosGenerating
                        ? "Đang tạo mã PayOS..."
                        : payosSession
                        ? "Tạo lại mã PayOS"
                        : "Lấy mã thanh toán PayOS"}
                    </button>

                    {payosError && (
                      <p style={{ margin: 0, color: "#dc2626", fontSize: "0.85rem" }}>
                        {payosError}
                      </p>
                    )}

                    {payosSession && (
                      <div
                        style={{
                          background: "#fff",
                          borderRadius: 12,
                          padding: 16,
                          border: "1px solid #bae6fd",
                          boxShadow: "0 6px 20px rgba(14,165,233,0.15)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 12,
                          }}
                        >
                          <div>
                            <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.8rem" }}>
                              Mã thanh toán
                            </p>
                            <p
                              style={{
                                margin: "4px 0 0",
                                fontWeight: 700,
                                fontSize: "1.35rem",
                                color: "#0f172a",
                              }}
                            >
                              {payosSession.orderCode}
                            </p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(String(payosSession.orderCode), "Mã thanh toán")}
                            style={{
                              padding: "8px 12px",
                              borderRadius: 8,
                              border: "1px solid #e2e8f0",
                              background: "#fff",
                              fontWeight: 600,
                              color: "#0ea5e9",
                              cursor: "pointer",
                            }}
                          >
                            Sao chép
                          </button>
                        </div>

                        <p style={{ margin: "0 0 8px", color: "#0f172a" }}>
                          Số tiền cần thanh toán: {payosSession.amount.toLocaleString()}₫
                        </p>

                        {payosSession.accountNumber && (
                          <div
                            style={{
                              padding: "12px",
                              borderRadius: 10,
                              background: "#f8fafc",
                              border: "1px dashed #cbd5f5",
                              marginBottom: 12,
                            }}
                          >
                            <p style={{ margin: "0 0 6px", color: "#475569", fontSize: "0.9rem" }}>
                              Chuyển khoản tới:
                            </p>
                            <p style={{ margin: 0, fontWeight: 600, color: "#0f172a" }}>
                              {payosSession.accountName || "PayOS"}
                            </p>
                            <p style={{ margin: "4px 0", color: "#0ea5e9", fontWeight: 700 }}>
                              {payosSession.accountNumber}
                              {payosSession.bankBin ? ` • Ngân hàng ${payosSession.bankBin}` : ""}
                            </p>
                            <button
                              onClick={() => copyToClipboard(payosSession.accountNumber || "", "Số tài khoản")}
                              style={{
                                padding: "6px 10px",
                                borderRadius: 8,
                                border: "1px solid #e2e8f0",
                                background: "#fff",
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                color: "#0ea5e9",
                              }}
                            >
                              Sao chép số tài khoản
                            </button>
                          </div>
                        )}

                        {payosSession.qrCode && (
                          <div
                            style={{
                              border: "1px dashed #dbeafe",
                              borderRadius: 12,
                              padding: 12,
                              textAlign: "center",
                              marginBottom: 12,
                            }}
                          >
                            <img
                              src={payosSession.qrCode}
                              alt="PayOS QR"
                              style={{ width: "140px", height: "140px" }}
                            />
                            <p style={{ margin: "8px 0 0", fontSize: "0.85rem", color: "#475569" }}>
                              Quét QR để thanh toán nhanh
                            </p>
                          </div>
                        )}

                        <p style={{ margin: 0, color: "#475569", fontSize: "0.85rem" }}>
                          PayOS sẽ tự động xác nhận giao dịch và chuyển bạn về trang "Thanh toán thành công". Vé sẽ được cập nhật trong mục Đặt vé.
                        </p>

                        {(payosSession.checkoutUrl || payosSession.shortLink) && (
                          <button
                            onClick={() => {
                              const targetUrl = payosSession.checkoutUrl || payosSession.shortLink;
                              if (targetUrl) window.open(targetUrl, "_blank");
                            }}
                            style={{
                              marginTop: 12,
                              width: "100%",
                              padding: "10px",
                              borderRadius: 10,
                              border: "none",
                              background: "linear-gradient(135deg,#10b981,#059669)",
                              color: "#fff",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Mở cổng PayOS
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

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
                  linkedBank ? (
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
                      <button
                        onClick={() => setLinkedBank(null)}
                        style={{
                          marginTop: "12px",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          background: "#fff",
                          color: "#64748b",
                          fontSize: "0.85rem",
                          cursor: "pointer",
                        }}
                      >
                        Sử dụng ngân hàng khác
                      </button>
                    </div>
                  ) : (
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
                  )
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
                  : paymentMethod === "payos"
                  ? "Thanh toán PayOS"
                  : "Xác Nhận Thanh Toán"}
              </button>

              <button
                onClick={() => {
                  setPaymentMethod("payos");
                  handleConfirmPayment("payos");
                }}
                disabled={payLoading || isCheckingBank}
                className="btn-hover"
                style={{
                  flex: 1,
                  minWidth: "150px",
                  padding: "14px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  color: "#fff",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "1rem",
                  cursor:
                    payLoading || isCheckingBank ? "not-allowed" : "pointer",
                  opacity: payLoading || isCheckingBank ? 0.7 : 1,
                }}
              >
                Thanh toán PayOS
              </button>

              <button
                onClick={() => {
                  setShowPaymentForm(false);
                  setLinkedBank(null);
                  setAppliedVoucher(null);
                    resetPayosSession();
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}