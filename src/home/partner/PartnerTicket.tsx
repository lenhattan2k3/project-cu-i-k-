  // PartnerTicket.tsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getAllTrips } from "../../api/tripApi";
import { bookTicket, cancelBooking, getBookedSeats, getBookingsByPartnerId, getMarkedSeats, saveMarkedSeats, updateBooking, updateBookingStatus } from "../../api/bookingApi";
import { getPaymentStatus } from "../../api/payment-methodApi";
import { 
  LayoutDashboard, 
  Ticket, 
  DollarSign, 
  CheckCircle2, 
  Users, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Armchair, 
  Edit3, 
  Trash2, 
  Eye, 
  CreditCard, 
  Calendar, 
  MapPin, 
  Phone, 
  User,
  Save,
  X,
  AlertCircle,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";  interface Trip {
    _id: string;
    tenChuyen: string;
    tu: string;
    den: string;
    ngayKhoiHanh?: string;
    gioKhoiHanh?: string;
    giaVe: number;
    soGhe: number;
    hinhAnh?: string;
    bookedSeats?: string[]; // có thể lưu ở trip luôn
    partnerId?: string;
  }

  interface Booking {
    _id: string;
    hoTen: string;
    sdt: string;
    soGhe: string[];
    totalPrice: number;
    status: string;
    tripId: Trip | { _id: string; tenChuyen?: string; soGhe?: number; giaVe?: number };
    userId?: string; // userId có thể không có trong response nhưng cần khi update
    partnerId?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    paymentUpdatedAt?: string;
    paymentReason?: string;
    createdAt?: string;
    updatedAt?: string;
  }

  type PaymentMethodKey = "card" | "bank" | "cash" | "payos" | "unknown";
  type PaymentStatusKey = "pending" | "paid" | "completed" | "cancelled" | "refunded" | "failed" | "unknown";

  const paymentMethodMeta: Record<PaymentMethodKey, { label: string; bg: string; color: string; icon: React.ReactNode }> = {
    card: { label: "Thẻ / Ví", bg: "bg-sky-100", color: "text-sky-700", icon: <CreditCard size={14} /> },
    bank: { label: "Chuyển khoản", bg: "bg-violet-100", color: "text-violet-700", icon: <DollarSign size={14} /> },
    cash: { label: "Tiền mặt", bg: "bg-amber-100", color: "text-amber-700", icon: <DollarSign size={14} /> },
    payos: { label: "PayOS", bg: "bg-lime-100", color: "text-lime-700", icon: <CreditCard size={14} /> },
    unknown: { label: "Chưa xác định", bg: "bg-gray-100", color: "text-gray-600", icon: <AlertCircle size={14} /> },
  };

  const paymentStatusMeta: Record<PaymentStatusKey, { label: string; bg: string; color: string; icon: React.ReactNode }> = {
    pending: { label: "Đang chờ", bg: "bg-orange-50", color: "text-orange-600", icon: <Clock size={14} /> },
    paid: { label: "Đã thanh toán", bg: "bg-emerald-50", color: "text-emerald-600", icon: <CheckCircle2 size={14} /> },
    completed: { label: "Hoàn tất", bg: "bg-blue-50", color: "text-blue-600", icon: <CheckCircle2 size={14} /> },
    cancelled: { label: "Đã hủy", bg: "bg-red-50", color: "text-red-600", icon: <X size={14} /> },
    refunded: { label: "Đã hoàn tiền", bg: "bg-yellow-50", color: "text-yellow-600", icon: <RefreshCw size={14} /> },
    failed: { label: "Thất bại", bg: "bg-red-50", color: "text-red-600", icon: <AlertCircle size={14} /> },
    unknown: { label: "Không rõ", bg: "bg-gray-50", color: "text-gray-600", icon: <AlertCircle size={14} /> },
  };

  const normalizePaymentMethod = (method?: string): PaymentMethodKey => {
    const key = (method || "").toLowerCase();
    if (key === "card" || key === "bank" || key === "cash" || key === "payos") return key;
    return "unknown";
  };

  const normalizePaymentStatus = (status?: string): PaymentStatusKey => {
    const key = (status || "pending").toLowerCase();
    if (key === "done") return "completed";
    if (key === "success") return "paid";
    if (key === "unpaid") return "pending";
    if (key === "failed") return "failed";
    if (key === "paid" || key === "completed" || key === "pending" || key === "cancelled" || key === "refunded") {
      return key as PaymentStatusKey;
    }
    return "unknown";
  };

  const getPaymentMethodDisplay = (method?: string) => paymentMethodMeta[normalizePaymentMethod(method)];
  const getPaymentStatusDisplay = (status?: string) => paymentStatusMeta[normalizePaymentStatus(status)];

  const formatDateTime = (value?: string | number | Date) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("vi-VN", { hour12: false });
  };

  const formatRelativeTime = (value?: string | number | Date) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return "vừa xong";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
    return date.toLocaleDateString("vi-VN", { hour12: false });
  };

  export default function PartnerTicket() {
    // dữ liệu chính
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [partnerId, setPartnerId] = useState<string>("");
    const [authChecked, setAuthChecked] = useState(false);

    // state cho seat manager (mới)
    const [tripForManage, setTripForManage] = useState<Trip | null>(null);
    const [tripBookedSeats, setTripBookedSeats] = useState<string[]>([]); // ghế đã đặt của chuyến (từ booking)
    const [tripSelectedSeats, setTripSelectedSeats] = useState<string[]>([]); // ghế partner muốn set/add
    const [tripBookingsOfSelected, setTripBookingsOfSelected] = useState<Booking[]>([]); // bookings thuộc trip selected (dùng để hiển thị thông tin)
    const [seatActionLoading, setSeatActionLoading] = useState(false);
    const [tripFilter, setTripFilter] = useState<string>("all");

    // modal chỉnh booking (như cart example)
    const [editBooking, setEditBooking] = useState<Booking | null>(null);
    const [editBookingSelectedSeats, setEditBookingSelectedSeats] = useState<string[]>([]);
    const [editBookingLockedSeats, setEditBookingLockedSeats] = useState<string[]>([]); // ghế đã đặt của trip (không thể chọn)

    // state cho modal xem chi tiết booking - lưu ghế đã đặt của trip
    const [selectedBookingTripBookedSeats, setSelectedBookingTripBookedSeats] = useState<string[]>([]);

    // state cho modal đặt vé nhanh từ sơ đồ ghế
    const [quickBookModal, setQuickBookModal] = useState(false);
    const [quickBookSeat, setQuickBookSeat] = useState<string | null>(null);
    const [quickBookHoTen, setQuickBookHoTen] = useState("");
    const [quickBookSdt, setQuickBookSdt] = useState("");
    const [quickBookLoading, setQuickBookLoading] = useState(false);

    // Firebase auth guard để biết partner đang đăng nhập
    useEffect(() => {
      const auth = getAuth();
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setPartnerId(user?.uid || "");
        setAuthChecked(true);

        if (!user) {
          setTrips([]);
          setBookings([]);
          setTripForManage(null);
          setTripSelectedSeats([]);
          setTripBookedSeats([]);
          setTripBookingsOfSelected([]);
          setSelectedBooking(null);
        }
      });

      return () => unsubscribe();
    }, []);

    // ---------- Helpers: parse responses safely ----------
    const parseBookingsArrayFromRes = (resData: any): Booking[] => {
      if (!resData) return [];
      // Nếu backend trả về mảng booking => dùng luôn
      if (Array.isArray(resData)) return resData as Booking[];
      // Nếu backend trả về object { bookedSeats: [...] } -> không phải booking list
      // Nếu backend trả về { bookings: [...] } thì lấy đó
      if (Array.isArray(resData.bookings)) return resData.bookings as Booking[];
      // nếu backend trả về object booking (1 booking) -> wrap
      if (resData && typeof resData === "object" && resData._id) return [resData as Booking];
      return [];
    };

    const getTripFromBooking = (booking: Booking): Trip | null => {
      if (!booking || !booking.tripId) return null;
      if (typeof booking.tripId === "object" && "_id" in booking.tripId) {
        return booking.tripId as Trip;
      }
      const tripId = typeof booking.tripId === "string" ? booking.tripId : (booking.tripId as any)?._id;
      if (!tripId) return null;
      return trips.find((t) => t._id === tripId) || null;
    };


    // reload data mỗi khi partner đăng nhập/log out
    useEffect(() => {
      if (!authChecked) return;

      if (!partnerId) {
        setLoading(false);
        return;
      }

      reloadAllData(partnerId);
    }, [authChecked, partnerId]);

    useEffect(() => {
      if (!partnerId) return;
      setTripForManage(null);
      setTripSelectedSeats([]);
      setTripBookedSeats([]);
      setTripBookingsOfSelected([]);
    }, [partnerId]);

    const visibleBookings = useMemo(
      () => bookings.filter((b) => !(b.hoTen === "_MARKED_SEATS_" && b.sdt === "_PARTNER_MARKED_")),
      [bookings]
    );

    const filteredBookings = useMemo(() => {
      if (tripFilter === "all") return visibleBookings;
      return visibleBookings.filter((b) => {
        const id = typeof b.tripId === "object" ? (b.tripId as Trip)?._id : (b.tripId as any);
        return String(id) === tripFilter;
      });
    }, [visibleBookings, tripFilter]);

    const selectedTripForFilter = useMemo(() => {
      if (tripFilter === "all") return null;
      return trips.find((t) => t._id === tripFilter) || null;
    }, [tripFilter, trips]);



    const currentTimestamp = useMemo(() => new Date().toLocaleString("vi-VN", { hour12: false }), []);

    // ---------------------------
    // --- Seat Manager (top) ---
    // ---------------------------

    // Chú ý: backend có thể có nhiều endpoint khác nhau:
    // - GET /api/bookings/trip/:tripId  => trả về array booking
    // - GET /api/bookings/trip/:tripId/seats => trả về { bookedSeats: [...] } hoặc array seats
    // - GET /api/bookings/bookedSeats/:tripId => legacy
    // Vì vậy ta sẽ gọi, kiểm tra và fallback các dạng trả về.

    const fetchBookingsOfTripRaw = async (tripId: string) => {
      if (!partnerId) {
        return { ok: false, data: [] };
      }

      try {
        // Lấy tất cả bookings từ state hoặc API theo partner
        const allBookings = bookings.length > 0 
          ? bookings 
          : parseBookingsArrayFromRes(await getBookingsByPartnerId(partnerId));
        
        // Lọc bookings theo tripId
        const bookingsOfTrip = allBookings.filter((b: Booking) => {
          const bTripId = (b.tripId as any)?._id || (b.tripId as any);
          return bTripId === tripId;
        });
        
        return { ok: true, data: bookingsOfTrip };
      } catch (err) {
        console.error("Lỗi lấy bookings của trip:", err);
        // Fallback: thử filter từ bookings state hiện tại
        const bookingsOfTrip = bookings.filter((b: Booking) => {
          const bTripId = (b.tripId as any)?._id || (b.tripId as any);
          return bTripId === tripId;
        });
        return { ok: true, data: bookingsOfTrip };
      }
    };

  // khi chọn trip ở phần quản lý ghế trên đầu
  const handleSelectTripForManage = async (tripId?: string) => {
    if (!tripId) {
      setTripForManage(null);
      setTripBookedSeats([]);
      setTripBookingsOfSelected([]);
      setTripSelectedSeats([]);
      return;
    }

    if (!partnerId) {
      alert("⚠️ Vui lòng đăng nhập bằng tài khoản nhà xe để thao tác.");
      return;
    }

    try {
      setSeatActionLoading(true);

      // Reload trips và bookings để có dữ liệu mới nhất
      await reloadAllData(partnerId);
      
      // Fetch lại trip trực tiếp từ API để có bookedSeats mới nhất
      let currentTrip: Trip | null = null;
      try {
        const allTrips = await getAllTrips(partnerId);
        currentTrip = allTrips.find((t: Trip) => t._id === tripId) || null;
        if (!currentTrip) {
          alert("⚠️ Không tìm thấy chuyến xe!");
          return;
        }
        setTripForManage(currentTrip);
      } catch (err) {
        console.error("Lỗi fetch trip:", err);
        // Fallback: tìm trong trips state
        currentTrip = trips.find((t) => t._id === tripId) || null;
        if (!currentTrip) {
          alert("⚠️ Không tìm thấy chuyến xe!");
          return;
        }
        setTripForManage(currentTrip);
      }

      // Lấy ghế đã đặt từ bookings (thực tế) - luôn fetch mới nhất
      const bookedSeatsFromBookings = await getBookedSeats(tripId);
      
      // Lấy ghế đã đánh dấu từ bookingApi (ưu tiên) hoặc từ trip.bookedSeats (fallback)
      let markedSeatsFromApi: string[] = [];
      try {
        markedSeatsFromApi = await getMarkedSeats(tripId);
        console.log("✅ Lấy ghế đánh dấu từ bookingApi:", markedSeatsFromApi);
      } catch (err) {
        console.warn("⚠️ Không lấy được ghế đánh dấu từ bookingApi, thử từ trip.bookedSeats:", err);
        // Fallback: lấy từ trip.bookedSeats
        if (currentTrip?.bookedSeats && Array.isArray(currentTrip.bookedSeats)) {
          markedSeatsFromApi = currentTrip.bookedSeats
            .map(seat => String(seat))
            .filter(seat => seat && seat.trim() !== '');
        }
      }

      console.log("📊 Dữ liệu từ bookingApi và trip:", {
        tripId,
        bookedSeatsFromBookings,
        markedSeatsFromApi,
        tripObject: currentTrip,
      });
      
      // Loại trừ ghế đánh dấu khỏi bookedSeatsFromBookings để tránh trùng lặp
      // (vì bookedSeatsFromBookings có thể bao gồm cả ghế từ booking đánh dấu nếu getBookedSeats chưa filter đúng)
      const markedSeatsStrings = markedSeatsFromApi.map(String);
      const realBookedSeats = bookedSeatsFromBookings
        .map(String)
        .filter(seat => !markedSeatsStrings.includes(seat));
      
      // Hợp nhất để hiển thị: ghế từ bookings thật + ghế đánh dấu
      const allBookedSeats = Array.from(new Set([
        ...realBookedSeats,
        ...markedSeatsStrings
      ]));
      setTripBookedSeats(allBookedSeats);

      // Lấy danh sách bookings của trip để hiển thị thông tin
      const raw = await fetchBookingsOfTripRaw(tripId);
      if (raw.ok) {
        const bookingsOfTrip: Booking[] = parseBookingsArrayFromRes(raw.data);
        setTripBookingsOfSelected(bookingsOfTrip);
      } else {
        setTripBookingsOfSelected([]);
      }

      // Khởi tạo tripSelectedSeats với ghế đã đánh dấu từ bookingApi
      // markedSeatsFromApi đã là ghế đánh dấu rồi (từ booking đặc biệt)
      // Không cần filter vì đã được lấy trực tiếp từ booking đánh dấu
      const markedSeats = markedSeatsFromApi.map(String);
      
      // Set ghế đánh dấu để hiển thị (màu vàng)
      setTripSelectedSeats(markedSeats);
      
      console.log("📋 Đã load ghế đánh dấu từ bookingApi:", markedSeats);
      
      console.log("✅ Ghế từ bookings:", bookedSeatsFromBookings);
      console.log("✅ Ghế đánh dấu từ bookingApi:", markedSeatsFromApi);
      console.log("✅ Ghế đang chọn để đánh dấu:", markedSeats);
      console.log("✅ Tổng ghế đã đặt:", allBookedSeats.length);
      console.log("✅ Tổng số ghế của trip:", currentTrip?.soGhe || 20);
      console.log("✅ Số ghế còn trống:", (currentTrip?.soGhe || 20) - allBookedSeats.length);
    } catch (err) {
      console.error("Lỗi lấy booking/chỗ đã đặt cho trip:", err);
      setTripBookedSeats([]);
      setTripBookingsOfSelected([]);
    } finally {
      setSeatActionLoading(false);
    }
  };

    const enrichBookingsWithPaymentData = async (source: Booking[]): Promise<Booking[]> => {
      if (!source.length) {
        return source;
      }

      const results = await Promise.allSettled(
        source.map(async (booking) => {
          try {
            const payment = await getPaymentStatus(booking._id);
            return {
              ...booking,
              paymentMethod: payment?.paymentMethod || booking.paymentMethod || "unknown",
              paymentStatus: payment?.status || normalizePaymentStatus(booking.status),
              paymentUpdatedAt: payment?.updatedAt || booking.updatedAt,
              paymentReason: payment?.reason || booking.paymentReason,
            };
          } catch (error) {
            console.warn("⚠️ Không lấy được payment status cho booking", booking._id, error);
            return {
              ...booking,
              paymentMethod: booking.paymentMethod || "unknown",
              paymentStatus: booking.paymentStatus || normalizePaymentStatus(booking.status),
            };
          }
        })
      );

      return results.map((result, index) => (result.status === "fulfilled" ? result.value : source[index]));
    };

    const handleExportTripData = () => {
      if (!filteredBookings.length) {
        alert("⚠️ Không có vé nào để xuất theo bộ lọc hiện tại.");
        return;
      }

      const csvEscape = (value: unknown) => {
        const str = value === null || value === undefined ? "" : String(value);
        return `"${str.replace(/"/g, '""')}"`;
      };

      const header = [
        "Mã vé",
        "Tên khách",
        "Số điện thoại",
        "Trạng thái",
        "Ghế",
        "Giá trị vé",
        "Tên chuyến",
        "Tuyến",
        "Ngày khởi hành",
        "Giờ khởi hành",
        "Phương thức thanh toán",
        "Trạng thái thanh toán",
        "Thanh toán cập nhật lúc",
      ];

      const rows = filteredBookings.map((booking) => {
        const trip = getTripFromBooking(booking);
        const route = trip ? `${trip.tu} → ${trip.den}` : "";
        const methodDisplay = getPaymentMethodDisplay(booking.paymentMethod);
        const statusDisplay = getPaymentStatusDisplay(booking.paymentStatus);
        return [
          booking._id,
          booking.hoTen,
          booking.sdt,
          booking.status,
          (booking.soGhe || []).join(", "),
          (booking.totalPrice || 0).toLocaleString("vi-VN"),
          trip?.tenChuyen || "N/A",
          route,
          trip?.ngayKhoiHanh || "",
          trip?.gioKhoiHanh || "",
          methodDisplay.label,
          statusDisplay.label,
          formatDateTime(booking.paymentUpdatedAt),
        ]
          .map(csvEscape)
          .join(",");
      });

      const csvContent = [header.map(csvEscape).join(","), ...rows].join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const tripName = selectedTripForFilter
        ? `${selectedTripForFilter.tenChuyen}-${selectedTripForFilter.tu}-${selectedTripForFilter.den}`
        : "tat-ca-chuyen";
      link.href = url;
      link.download = `ve-${tripName.replace(/\s+/g, "-")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    };

    // Mở modal đặt vé nhanh khi click vào ghế trống
    const openQuickBookModal = (seat: string) => {
      if (!tripForManage) return;
      
      // Kiểm tra ghế có trống không
      const bookedSeatsFromBookings = tripBookingsOfSelected
        .filter((b) => !(b.hoTen === "_MARKED_SEATS_" && b.sdt === "_PARTNER_MARKED_"))
        .flatMap((b) => (Array.isArray(b.soGhe) ? b.soGhe.map(String) : []));
      
      const markedSeatsBooked = tripBookingsOfSelected
        .filter((b) => b.hoTen === "_MARKED_SEATS_" && b.sdt === "_PARTNER_MARKED_")
        .flatMap((b) => (Array.isArray(b.soGhe) ? b.soGhe.map(String) : []));
      
      const isBooked = bookedSeatsFromBookings.includes(seat) || markedSeatsBooked.includes(seat);
      
      if (isBooked) {
        return; // Không mở modal nếu ghế đã được đặt
      }
      
      setQuickBookSeat(seat);
      setQuickBookHoTen("");
      setQuickBookSdt("");
      setQuickBookModal(true);
    };

    // Đặt vé nhanh
    const handleQuickBook = async () => {
      if (!tripForManage || !quickBookSeat) return;
      if (!partnerId) {
        alert("⚠️ Vui lòng đăng nhập bằng tài khoản nhà xe để đặt vé.");
        return;
      }
      
      if (!quickBookHoTen.trim()) {
        alert("⚠️ Vui lòng nhập tên khách hàng!");
        return;
      }
      
      if (!quickBookSdt.trim()) {
        alert("⚠️ Vui lòng nhập số điện thoại!");
        return;
      }
      
      // Validate số điện thoại (10-11 số)
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(quickBookSdt.trim().replace(/\s/g, ""))) {
        alert("⚠️ Số điện thoại không hợp lệ! Vui lòng nhập 10-11 chữ số.");
        return;
      }
      
      setQuickBookLoading(true);
      try {
        // Convert soGhe sang number[] (backend yêu cầu)
        const soGheNumbers = [Number(quickBookSeat)].filter(n => Number.isFinite(n) && n > 0);
        
        if (soGheNumbers.length === 0) {
          alert("⚠️ Ghế không hợp lệ!");
          return;
        }
        
        // Tính tổng tiền
        const totalPrice = soGheNumbers.length * (tripForManage.giaVe || 0);
        
        // Gọi API đặt vé
        const bookingData: any = {
          tripId: tripForManage._id,
          hoTen: quickBookHoTen.trim(),
          sdt: quickBookSdt.trim().replace(/\s/g, ""),
          soGhe: soGheNumbers, // number[] - backend yêu cầu
          totalPrice: totalPrice, // Thêm totalPrice
        };
        
        // Có thể cần userId nếu backend yêu cầu (thử lấy từ localStorage hoặc để undefined)
        try {
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          const userId = user?._id || user?.id;
          if (userId) {
            bookingData.userId = userId;
          }
        } catch (userErr) {
          console.warn("⚠️ Không lấy được userId từ localStorage:", userErr);
        }

        if (!bookingData.userId) {
          bookingData.userId = partnerId;
        }
        
        console.log("📤 Đặt vé nhanh:", bookingData);
        
        const result = await bookTicket(bookingData);
        
        console.log("✅ Đặt vé thành công:", result);
        
        alert("✅ Đặt vé thành công!");
        
        // Đóng modal và reset form
        setQuickBookModal(false);
        setQuickBookSeat(null);
        setQuickBookHoTen("");
        setQuickBookSdt("");
        
        // Reload danh sách booking để hiển thị vé mới
        await reloadAllData();
        
        // Refresh trip manager để cập nhật sơ đồ ghế
        if (tripForManage) {
          await handleSelectTripForManage(tripForManage._id);
        }
      } catch (err: any) {
        console.error("❌ Lỗi đặt vé:", err);
        const errorMsg = err?.response?.data?.message || err?.message || "Có lỗi xảy ra";
        alert(`❌ Đặt vé thất bại: ${errorMsg}`);
      } finally {
        setQuickBookLoading(false);
      }
    };

    // toggle chọn ghế để cập nhật vào trip (thêm/loại bỏ)
    // Logic: 
    // - Ghế đã có booking thật -> không thể bỏ/chọn (khóa)
    // - Ghế đã đánh dấu (đã lưu) -> có thể bỏ đánh dấu
    // - Ghế đang được chọn (chưa lưu) -> có thể bỏ
    // - Ghế trống -> có thể chọn để đánh dấu hoặc đặt vé nhanh (double click)
    const toggleTripSeat = (seat: string, isDoubleClick = false) => {
      if (!tripForManage) return;
      
      // Lấy ghế từ bookings thực tế (không bao gồm ghế đánh dấu)
      const bookedSeatsFromBookings = tripBookingsOfSelected
        .filter((b) => !(b.hoTen === "_MARKED_SEATS_" && b.sdt === "_PARTNER_MARKED_"))
        .flatMap((b) => (Array.isArray(b.soGhe) ? b.soGhe.map(String) : []));
      
      // Lấy ghế đã được đánh dấu và lưu (từ booking đặc biệt)
      const markedSeatsBooked = tripBookingsOfSelected
        .filter((b) => b.hoTen === "_MARKED_SEATS_" && b.sdt === "_PARTNER_MARKED_")
        .flatMap((b) => (Array.isArray(b.soGhe) ? b.soGhe.map(String) : []));
      
      // Nếu ghế đã được đặt bởi booking thật -> khóa
      const isBookedByRealBooking = bookedSeatsFromBookings.includes(seat);
      if (isBookedByRealBooking) {
        return; // Không cho phép thay đổi ghế đã có booking thật
      }
      
      // Nếu double click vào ghế trống -> mở modal đặt vé nhanh
      const isMarkedSeatSaved = markedSeatsBooked.includes(seat);
      const isSelected = tripSelectedSeats.includes(seat);
      const isEmpty = !isMarkedSeatSaved && !isSelected;
      
      if (isDoubleClick && isEmpty) {
        openQuickBookModal(seat);
        return;
      }
      
      // Ghế đã đánh dấu (đã lưu) hoặc đang chọn -> có thể toggle
      // Nếu ghế đã đánh dấu (đã lưu) nhưng chưa trong tripSelectedSeats -> thêm vào để có thể bỏ
      // Nếu ghế đang chọn -> bỏ khỏi tripSelectedSeats
      if (isMarkedSeatSaved && !isSelected) {
        // Thêm vào để có thể bỏ đánh dấu
        setTripSelectedSeats((prev) => [...prev, seat]);
      } else if (isSelected) {
        // Bỏ khỏi danh sách chọn (cả ghế đã lưu và chưa lưu đều có thể bỏ)
        setTripSelectedSeats((prev) => prev.filter((s) => s !== seat));
      } else {
        // Thêm vào danh sách chọn
        setTripSelectedSeats((prev) => [...prev, seat]);
      }
    };

  // Lưu thay đổi ghế vào trip (PUT /api/trips/:id { bookedSeats: [...] })
  // Logic: 
  // - Lấy ghế từ bookings (thực tế) - để loại trừ khỏi ghế đánh dấu
  // - Lưu CHỈ ghế đánh dấu vào trip.bookedSeats (KHÔNG lưu ghế từ bookings)
  // - Khi load lại, ghế từ bookings sẽ được tính từ API, ghế đánh dấu từ trip.bookedSeats
  const handleSaveTripSeats = async () => {
    if (!tripForManage) {
      alert("⚠️ Chọn chuyến trước khi cập nhật ghế.");
      return;
    }

    setSeatActionLoading(true);
    try {
      // Lấy ghế đã đặt từ bookings thực tế (luôn fetch mới nhất)
      const bookedSeatsFromBookings = await getBookedSeats(tripForManage._id);
      
      console.log("💾 Bắt đầu lưu ghế:", {
        tripId: tripForManage._id,
        ghếĐangChọn: tripSelectedSeats,
        ghếTừBookings: bookedSeatsFromBookings,
      });
      
      // Cập nhật: 
      // - Chỉ lưu ghế đánh dấu (tripSelectedSeats) vào trip.bookedSeats
      // - Loại trừ ghế từ bookings (vì ghế từ bookings sẽ được tính từ API khi load)
      // - Convert tất cả sang string để so sánh
      const bookedSeatsStrings = bookedSeatsFromBookings.map(String);
      
      // CHỈ lưu ghế đánh dấu (không bao gồm ghế từ bookings)
      const markedSeatsToSave = tripSelectedSeats
        .map(String)
        .filter(seat => !bookedSeatsStrings.includes(seat));

      console.log("💾 Dữ liệu sẽ lưu vào bookingApi (CHỈ ghế đánh dấu):", {
        ghếĐánhDấu: markedSeatsToSave,
        lưuÝ: "Không lưu ghế từ bookings, vì sẽ tính từ API khi load",
      });

      // ⚠️ QUAN TRỌNG: Lưu ghế đánh dấu thông qua bookingApi
      // Ghế từ bookings sẽ được tính từ API getBookedSeats() khi load
      const saveResult = await saveMarkedSeats(tripForManage._id, markedSeatsToSave);

      console.log("✅ Đã lưu ghế đánh dấu vào bookingApi thành công");
      console.log("📦 Response từ backend:", saveResult);

      // Đợi một chút để đảm bảo backend đã xử lý xong
      await new Promise(resolve => setTimeout(resolve, 300));

      // Reload local data để lấy dữ liệu mới nhất (bao gồm trip.bookedSeats vừa lưu)
      await reloadAllData(partnerId);
      
      // Đợi thêm một chút để state được update
      await new Promise(resolve => setTimeout(resolve, 200));
      
      alert("✅ Đã lưu ghế đánh dấu thành công!");
      
      // Fetch lại trip trực tiếp từ API để có bookedSeats mới nhất
      // Đợi một chút để backend xử lý xong
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let updatedTrip: Trip | null = null;
      try {
        // Fetch lại trực tiếp từ API (không dùng cache)
        const allTrips = await getAllTrips(partnerId);
        updatedTrip = allTrips.find((t: Trip) => t._id === tripForManage._id) || null;
        if (updatedTrip) {
          console.log("📥 Trip sau khi lưu (chi tiết):", {
            _id: updatedTrip._id,
            bookedSeats: updatedTrip.bookedSeats,
            bookedSeatsType: typeof updatedTrip.bookedSeats,
            bookedSeatsIsArray: Array.isArray(updatedTrip.bookedSeats),
            bookedSeatsLength: updatedTrip.bookedSeats?.length || 0,
          });
          setTripForManage(updatedTrip);
          
          // Nếu bookedSeats vẫn rỗng, thử fetch trực tiếp trip
          if (!updatedTrip.bookedSeats || updatedTrip.bookedSeats.length === 0) {
            console.warn("⚠️ bookedSeats vẫn rỗng sau khi lưu, thử fetch trực tiếp...");
            try {
              const directRes = await axios.get(`http://localhost:5000/api/trips/${tripForManage._id}`);
              console.log("📥 Response trực tiếp từ API:", directRes.data);
              if (directRes.data?.bookedSeats) {
                updatedTrip.bookedSeats = directRes.data.bookedSeats;
                setTripForManage({ ...updatedTrip });
                console.log("✅ Đã update bookedSeats từ response trực tiếp");
              }
            } catch (directErr) {
              console.error("❌ Lỗi fetch trực tiếp trip:", directErr);
            }
          }
        } else {
          console.error("❌ Không tìm thấy trip sau khi lưu!");
        }
      } catch (err) {
        console.error("Lỗi fetch trip sau khi lưu:", err);
      }
      
      // Refresh state của manager với dữ liệu mới (từ trip vừa lưu)
      // Sau khi refresh, ghế đánh dấu sẽ được load từ trip.bookedSeats
      await handleSelectTripForManage(tripForManage._id);
      
      console.log("✅ Đã refresh state với dữ liệu mới - ghế đánh dấu sẽ hiển thị");
    } catch (err: any) {
      console.error("Lỗi cập nhật ghế cho trip:", err);
      const errorMsg = err?.response?.data?.message || err?.message || "Có lỗi xảy ra";
      alert(`❌ Cập nhật ghế thất bại: ${errorMsg}`);
    } finally {
      setSeatActionLoading(false);
      // KHÔNG clear tripSelectedSeats ngay, để user thấy ghế vừa lưu
      // Ghế sẽ được load lại từ bookingApi sau khi refresh
    }
  };

    // ---------------------------
    // --- Edit single booking ---
    // ---------------------------

    // mở modal edit booking
    const openEditBooking = async (b: Booking) => {
      setEditBooking(b);
      setEditBookingSelectedSeats([...b.soGhe.map(String)]);
      // lấy bookedSeats (tất cả booking trip) để khoá ghế
      try {
        const tripId = (b.tripId as any)?._id || (b.tripId as any);
        // Sử dụng getBookedSeats từ bookingApi để lấy tất cả ghế đã đặt
        const allBookedSeats = await getBookedSeats(tripId);
        setEditBookingLockedSeats(allBookedSeats);
      } catch (err) {
        console.error("Lỗi lấy ghế đã đặt cho modal edit:", err);
        // Fallback: dùng ghế của booking hiện tại
        setEditBookingLockedSeats(Array.isArray(b.soGhe) ? b.soGhe.map(String) : []);
      }
    };

    const toggleEditBookingSeat = (seat: string) => {
      if (!editBooking) return;
      // nếu seat đã bị đặt bởi booking khác (locked) và không phải ghế của booking hiện tại -> không cho
      const lockedByOthers = editBookingLockedSeats.includes(seat) && !(editBooking.soGhe || []).includes(seat);
      if (lockedByOthers) return;
      setEditBookingSelectedSeats((prev) => (prev.includes(seat) ? prev.filter((s) => s !== seat) : [...prev, seat]));
    };

    // lưu cập nhật booking
    const saveEditBooking = async () => {
      if (!editBooking) return;
      
      // Validate: kiểm tra có chọn ghế không
      if (editBookingSelectedSeats.length === 0) {
        alert("⚠️ Vui lòng chọn ít nhất 1 ghế!");
        return;
      }

      try {
        // Validate: đảm bảo có ghế hợp lệ
        if (!Array.isArray(editBookingSelectedSeats) || editBookingSelectedSeats.length === 0) {
          alert("⚠️ Vui lòng chọn ít nhất 1 ghế!");
          return;
        }

        // Lấy booking hiện tại từ server để có đầy đủ thông tin (bao gồm userId)
        let currentBooking: any = editBooking;
        try {
          const bookingRes = await axios.get(`http://localhost:5000/api/bookings/${editBooking._id}`);
          currentBooking = bookingRes.data;
          console.log("✅ Lấy booking từ server:", currentBooking);
        } catch (fetchErr) {
          console.warn("⚠️ Không lấy được booking từ server, dùng dữ liệu local:", fetchErr);
        }

        // Tính tổng tiền
        const giaVe = (editBooking.tripId as any)?.giaVe || 0;
        const newTotal = editBookingSelectedSeats.length * giaVe;

        // Lấy userId từ booking hiện tại (hoặc từ editBooking)
        const userId = (currentBooking as any)?.userId || (editBooking as any)?.userId;

        // Log dữ liệu trước khi gửi
        console.log("📤 Chuẩn bị cập nhật booking:", {
          bookingId: editBooking._id,
          userId: userId,
          soGhe: editBookingSelectedSeats,
          totalPrice: newTotal,
          giaVe: giaVe,
        });

        // Cập nhật booking sử dụng API function - GỬI KÈM userId
        await updateBooking(editBooking._id, {
          soGhe: editBookingSelectedSeats,
          totalPrice: newTotal,
          userId: userId, // Backend yêu cầu userId khi update
        });

        alert("✅ Cập nhật booking thành công!");
        setEditBooking(null);
        await reloadAllData();
        
        // Refresh trip manager nếu đang quản lý trip này
        if (tripForManage) {
          const tripId = (editBooking.tripId as any)?._id || (editBooking.tripId as any);
          if (tripId === tripForManage._id) {
            await handleSelectTripForManage(tripId);
          }
        }
      } catch (err: any) {
        console.error("Lỗi cập nhật booking:", err);
        console.error("Chi tiết lỗi:", {
          message: err?.message,
          status: err?.response?.status,
          statusText: err?.response?.statusText,
          data: err?.response?.data,
        });
        
        // Hiển thị thông báo lỗi chi tiết hơn
        let errorMsg = "Có lỗi xảy ra";
        if (err?.response?.data?.message) {
          errorMsg = err.response.data.message;
        } else if (err?.response?.data?.error) {
          errorMsg = err.response.data.error;
        } else if (err?.message) {
          errorMsg = err.message;
        }
        
        alert(`❌ Cập nhật booking thất bại: ${errorMsg}\n\nVui lòng kiểm tra console để xem chi tiết.`);
      }
    };

    // Xóa booking
    const handleDeleteBooking = async (bookingId: string) => {
      if (!window.confirm("⚠️ Bạn có chắc muốn xóa vé này không? Hành động này không thể hoàn tác.")) {
        return;
      }

      try {
        await cancelBooking(bookingId);
        alert("✅ Xóa vé thành công!");
        await reloadAllData();
        
        // Refresh trip manager nếu cần
        if (tripForManage) {
          await handleSelectTripForManage(tripForManage._id);
        }
      } catch (err: any) {
        console.error("Lỗi xóa booking:", err);
        const errorMsg = err?.response?.data?.message || err?.message || "Có lỗi xảy ra";
        alert(`❌ Xóa vé thất bại: ${errorMsg}`);
      }
    };

    // Cập nhật trạng thái thanh toán
    const handleTogglePaymentStatus = async (booking: Booking) => {
      const newStatus = booking.status === "paid" ? "unpaid" : "paid";
      const confirmMsg = newStatus === "paid" 
        ? "Xác nhận đã thanh toán cho vé này?" 
        : "Hủy xác nhận thanh toán cho vé này?";

      if (!window.confirm(confirmMsg)) {
        return;
      }

      try {
        await updateBookingStatus(booking._id, newStatus);
        alert(`✅ Cập nhật trạng thái thành công!`);
        await reloadAllData();
      } catch (err: any) {
        console.error("Lỗi cập nhật trạng thái:", err);
        const errorMsg = err?.response?.data?.message || err?.message || "Có lỗi xảy ra";
        alert(`❌ Cập nhật trạng thái thất bại: ${errorMsg}`);
      }
    };

    // reload cả trips + bookings (đồng bộ) theo partner
    const reloadAllData = async (scopedPartnerId?: string) => {
      const targetPartnerId = scopedPartnerId || partnerId;

      if (!targetPartnerId) {
        setTrips([]);
        setBookings([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [tripData, bookingRaw] = await Promise.all([
          (async () => {
            try {
              return await getAllTrips(targetPartnerId);
            } catch {
              const res = await axios.get("http://localhost:5000/api/trips", {
                params: { partnerId: targetPartnerId },
              });
              return res.data;
            }
          })(),
          (async () => {
            try {
              return await getBookingsByPartnerId(targetPartnerId);
            } catch {
              const res = await axios.get(`http://localhost:5000/api/bookings/partner/${targetPartnerId}`);
              return res.data;
            }
          })(),
        ]);

        const scopedTrips = Array.isArray(tripData) ? tripData : [];
        const allowedTripIds = new Set(scopedTrips.map((trip) => String(trip._id)));
        const normalizedPartnerId = String(targetPartnerId);

        const scopedBookings = parseBookingsArrayFromRes(bookingRaw).filter((booking) => {
          const bookingPartner = booking.partnerId || (typeof booking.tripId === "object" && (booking.tripId as any)?.partnerId);
          if (bookingPartner) {
            return String(bookingPartner) === normalizedPartnerId;
          }

          const tripRef = typeof booking.tripId === "object"
            ? (booking.tripId as Trip)?._id
            : (booking.tripId as any);

          return tripRef ? allowedTripIds.has(String(tripRef)) : false;
        });

        const bookingsWithPayment = await enrichBookingsWithPaymentData(scopedBookings);

        setTrips(scopedTrips);
        setBookings(bookingsWithPayment);
      } catch (err) {
        console.error("Lỗi reload data:", err);
        alert("⚠️ Có lỗi khi tải lại dữ liệu. Vui lòng refresh trang.");
      } finally {
        setLoading(false);
      }
    };

    // ---------------------------
    // --- Existing partner table + view modal (giữ nguyên) ---
    // ---------------------------

    // Khi bấm "Xem" ở bảng chính, mở modal chi tiết booking
    const handleViewBooking = async (b: Booking) => {
      setSelectedBooking(b);
      // Lấy danh sách ghế đã đặt của trip để hiển thị trên sơ đồ
      try {
        const tripId = (b.tripId as any)?._id || (b.tripId as any);
        const bookedSeats = await getBookedSeats(tripId);
        setSelectedBookingTripBookedSeats(bookedSeats);
      } catch (err) {
        console.error("Lỗi lấy ghế đã đặt cho modal xem chi tiết:", err);
        setSelectedBookingTripBookedSeats([]);
      }
    };

    // seat map helper for display: uses selected trip if present, else uses selectedBooking.tripId
    const getSeatCount = (trip?: Trip | null) => {
      // trả về số ghế (number) hoặc default 20
      const s = trip?.soGhe || (selectedBooking?.tripId as any)?.soGhe;
      return typeof s === "number" ? s : 20;
    };

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-blue-600 font-medium">Đang tải dữ liệu...</p>
        </div>
      );
    }

    if (authChecked && !partnerId) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
          <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Chưa đăng nhập</h2>
            <p className="text-gray-600">
              Vui lòng đăng nhập bằng tài khoản nhà xe để xem và quản lý vé của bạn.
            </p>
          </div>
        </div>
      );
    }

    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800"
      >
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <LayoutDashboard className="text-blue-600" />
                Quản lý vé đối tác
              </h1>
              <p className="text-slate-500 mt-1">Theo dõi tình trạng đặt vé & chuyến xe của bạn</p>
            </div>
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-sm font-medium text-slate-600">Cập nhật: {currentTimestamp}</span>
            </div>
          </div>



          {/* Seat Manager Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Armchair size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Quản lý sơ đồ ghế</h2>
                  <p className="text-sm text-slate-500">Chọn chuyến để xem và quản lý trạng thái ghế</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <select
                  value={tripForManage?._id || ""}
                  onChange={(e) => handleSelectTripForManage(e.target.value || undefined)}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-w-[250px]"
                >
                  <option value="">— Chọn chuyến xe —</option>
                  {trips.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.tenChuyen} ({t.tu} → {t.den})
                    </option>
                  ))}
                </select>
                
                <button
                  onClick={() => tripForManage && handleSelectTripForManage(tripForManage._id)}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Làm mới dữ liệu"
                >
                  <RefreshCw size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {tripForManage ? (
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Seat Map */}
                  <div className="flex-1">
                    <div className="bg-slate-100 p-6 rounded-xl border border-slate-200">
                      <div className="mb-6 flex justify-center">
                        <div className="w-3/4 h-2 bg-slate-300 rounded-full opacity-50"></div>
                      </div>
                      
                      <div className="grid grid-cols-5 gap-3 max-w-md mx-auto">
                        {Array.from({ length: tripForManage.soGhe || 20 }, (_, i) => (i + 1).toString()).map((seat) => {
                          const bookedSeatsFromBookings = tripBookingsOfSelected
                            .filter((b) => !(b.hoTen === "_MARKED_SEATS_" && b.sdt === "_PARTNER_MARKED_"))
                            .flatMap((b) => (Array.isArray(b.soGhe) ? b.soGhe.map(String) : []));
                          
                          const markedSeatsBooked = tripBookingsOfSelected
                            .filter((b) => b.hoTen === "_MARKED_SEATS_" && b.sdt === "_PARTNER_MARKED_")
                            .flatMap((b) => (Array.isArray(b.soGhe) ? b.soGhe.map(String) : []));
                          
                          const isBookedByRealBooking = bookedSeatsFromBookings.includes(seat);
                          const isMarkedSeatSaved = markedSeatsBooked.includes(seat);
                          const isSelectedButNotSaved = tripSelectedSeats.includes(seat) && !isMarkedSeatSaved;
                          const isBooked = isBookedByRealBooking || isMarkedSeatSaved;
                          
                          let seatColorClass = "bg-emerald-500 hover:bg-emerald-600 text-white"; // Trống
                          if (isBookedByRealBooking) seatColorClass = "bg-slate-400 cursor-not-allowed text-white"; // Đã đặt thật
                          else if (isMarkedSeatSaved) seatColorClass = "bg-slate-500 hover:bg-slate-600 text-white"; // Đã đánh dấu
                          else if (isSelectedButNotSaved) seatColorClass = "bg-amber-500 hover:bg-amber-600 text-white"; // Đang chọn

                          return (
                            <motion.button
                              whileHover={!isBookedByRealBooking ? { scale: 1.05 } : {}}
                              whileTap={!isBookedByRealBooking ? { scale: 0.95 } : {}}
                              key={seat}
                              onClick={() => toggleTripSeat(seat)}
                              onDoubleClick={() => toggleTripSeat(seat, true)}
                              disabled={isBookedByRealBooking && !isSelectedButNotSaved}
                              className={`
                                relative h-12 rounded-lg font-bold text-sm shadow-sm transition-colors flex flex-col items-center justify-center
                                ${seatColorClass}
                              `}
                              title={
                                isBookedByRealBooking ? "Đã đặt (Khóa)" : 
                                isMarkedSeatSaved ? "Đã đánh dấu (Click để bỏ)" : 
                                isSelectedButNotSaved ? "Đang chọn (Click để bỏ)" : 
                                "Trống (Click chọn, Double-click đặt nhanh)"
                              }
                            >
                              <span>{seat}</span>
                              {isBookedByRealBooking && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-slate-400"></span> Đã đặt</div>
                      <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Còn trống</div>
                      <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Đang chọn</div>
                      <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-slate-500"></span> Đã đánh dấu</div>
                    </div>
                  </div>

                  {/* Actions Panel */}
                  <div className="w-full lg:w-80 space-y-6">
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Ticket size={18} className="text-blue-600" />
                        Thông tin chuyến
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Chuyến:</span>
                          <span className="font-medium">{tripForManage.tenChuyen}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Tổng ghế:</span>
                          <span className="font-medium">{tripForManage.soGhe || 20}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Đã đặt:</span>
                          <span className="font-medium text-red-600">{tripBookedSeats.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Còn trống:</span>
                          <span className="font-medium text-emerald-600">{(tripForManage.soGhe || 20) - tripBookedSeats.length}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          if (tripForManage && tripSelectedSeats.length > 0 && tripSelectedSeats.length === 1) {
                            const bookedSeatsFromBookings = tripBookingsOfSelected
                              .filter((b) => !(b.hoTen === "_MARKED_SEATS_" && b.sdt === "_PARTNER_MARKED_"))
                              .flatMap((b) => (Array.isArray(b.soGhe) ? b.soGhe.map(String) : []));
                            const markedSeatsBooked = tripBookingsOfSelected
                              .filter((b) => b.hoTen === "_MARKED_SEATS_" && b.sdt === "_PARTNER_MARKED_")
                              .flatMap((b) => (Array.isArray(b.soGhe) ? b.soGhe.map(String) : []));
                            const selectedSeat = tripSelectedSeats[0];
                            const isBooked = bookedSeatsFromBookings.includes(selectedSeat) || markedSeatsBooked.includes(selectedSeat);
                            
                            if (isBooked) {
                              alert("⚠️ Ghế này đã được đặt! Vui lòng chọn ghế trống khác.");
                              return;
                            }
                            openQuickBookModal(selectedSeat);
                          } else if (tripSelectedSeats.length === 0) {
                            alert("⚠️ Vui lòng chọn ghế trước khi đặt vé nhanh!");
                          } else {
                            alert("⚠️ Chỉ có thể đặt vé nhanh cho 1 ghế tại một thời điểm!");
                          }
                        }}
                        disabled={!tripForManage || seatActionLoading || tripSelectedSeats.length === 0}
                        className={`w-full py-3 px-4 rounded-xl font-semibold shadow-sm flex items-center justify-center gap-2 transition-all
                          ${!tripForManage || tripSelectedSeats.length === 0 
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                            : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md"}`}
                      >
                        <Ticket size={18} />
                        Đặt vé nhanh
                      </button>

                      <button
                        onClick={handleSaveTripSeats}
                        disabled={!tripForManage || seatActionLoading}
                        className={`w-full py-3 px-4 rounded-xl font-semibold shadow-sm flex items-center justify-center gap-2 transition-all
                          ${!tripForManage 
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                            : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"}`}
                      >
                        {seatActionLoading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                        {seatActionLoading ? "Đang lưu..." : "Lưu đánh dấu ghế"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Armchair size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Vui lòng chọn chuyến xe để xem sơ đồ ghế</p>
                </div>
              )}
            </div>
          </div>

          {/* Main Table Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Filter Bar */}
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select
                    value={tripFilter}
                    onChange={(e) => setTripFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none"
                  >
                    <option value="all">Tất cả chuyến xe</option>
                    {trips.map((trip) => (
                      <option key={trip._id} value={trip._id}>
                        {trip.tenChuyen} ({trip.tu} → {trip.den})
                      </option>
                    ))}
                  </select>
                </div>
                {tripFilter !== "all" && (
                  <button 
                    onClick={() => setTripFilter("all")}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Xóa lọc
                  </button>
                )}
              </div>

              <button
                onClick={handleExportTripData}
                disabled={!filteredBookings.length}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors
                  ${!filteredBookings.length 
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                    : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}
              >
                <Download size={18} />
                Xuất Excel
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left">
                    <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Khách hàng</th>
                    <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Liên hệ</th>
                    <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Ghế</th>
                    <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Tổng tiền</th>
                    <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Thanh toán</th>
                    <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Trạng thái</th>
                    <th className="py-4 px-6 font-semibold text-slate-600 text-sm text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.length > 0 ? (
                    filteredBookings.map((b) => {
                      const method = getPaymentMethodDisplay(b.paymentMethod);
                      const status = getPaymentStatusDisplay(b.paymentStatus);
                      return (
                        <tr key={b._id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="py-4 px-6">
                            <div className="font-medium text-slate-900">{b.hoTen}</div>
                            <div className="text-xs text-slate-400 mt-0.5">ID: {b._id.slice(-6)}</div>
                          </td>
                          <td className="py-4 px-6 text-slate-600">{b.sdt}</td>
                          <td className="py-4 px-6">
                            <div className="flex flex-wrap gap-1">
                              {(b.soGhe || []).map(seat => (
                                <span key={seat} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-medium">
                                  {seat}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 px-6 font-medium text-slate-900">
                            {(b.totalPrice || 0).toLocaleString()}₫
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-col gap-1.5">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium w-fit ${method.bg} ${method.color}`}>
                                {method.icon} {method.label}
                              </span>
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium w-fit ${status.bg} ${status.color}`}>
                                {status.icon} {status.label}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <button
                              onClick={() => handleTogglePaymentStatus(b)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                                ${b.status === "paid" 
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" 
                                  : "bg-orange-100 text-orange-700 hover:bg-orange-200"}`}
                            >
                              {b.status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
                            </button>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleViewBooking(b)}
                                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Xem chi tiết"
                              >
                                <Eye size={18} />
                              </button>
                              <button 
                                onClick={() => openEditBooking(b)}
                                className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Chỉnh sửa"
                              >
                                <Edit3 size={18} />
                              </button>
                              <button 
                                onClick={() => handleDeleteBooking(b._id)}
                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Xóa vé"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                        <div className="flex flex-col items-center gap-3">
                          <Search size={40} className="opacity-20" />
                          <p>Không tìm thấy vé nào phù hợp</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modals */}
        <AnimatePresence>
          {/* View Booking Modal */}
          {selectedBooking && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedBooking(null)}>
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Ticket className="text-blue-600" /> Chi tiết vé xe
                  </h2>
                  <button onClick={() => setSelectedBooking(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={20} className="text-slate-500" />
                  </button>
                </div>
                
                <div className="p-6 space-y-6">
                  {selectedBooking.tripId && (selectedBooking.tripId as any).hinhAnh && (
                    <img
                      src={`http://localhost:5000${(selectedBooking.tripId as any).hinhAnh}`}
                      alt="Trip"
                      className="w-full h-48 object-cover rounded-xl shadow-sm"
                    />
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                          <User size={16} className="text-blue-600" /> Thông tin khách hàng
                        </h3>
                        <div className="space-y-2 text-sm">
                          <p className="flex justify-between"><span className="text-slate-500">Họ tên:</span> <span className="font-medium">{selectedBooking.hoTen}</span></p>
                          <p className="flex justify-between"><span className="text-slate-500">SĐT:</span> <span className="font-medium">{selectedBooking.sdt}</span></p>
                          <p className="flex justify-between"><span className="text-slate-500">Ghế:</span> <span className="font-medium text-blue-600">{(selectedBooking.soGhe || []).join(", ")}</span></p>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                          <CreditCard size={16} className="text-emerald-600" /> Thanh toán
                        </h3>
                        <div className="space-y-2 text-sm">
                          <p className="flex justify-between"><span className="text-slate-500">Tổng tiền:</span> <span className="font-bold text-lg text-emerald-600">{(selectedBooking.totalPrice || 0).toLocaleString()}₫</span></p>
                          <p className="flex justify-between items-center"><span className="text-slate-500">Phương thức:</span> <span className="px-2 py-1 bg-white rounded border border-slate-200 text-xs">{getPaymentMethodDisplay(selectedBooking.paymentMethod).label}</span></p>
                          <p className="flex justify-between items-center"><span className="text-slate-500">Trạng thái:</span> <span className="px-2 py-1 bg-white rounded border border-slate-200 text-xs">{getPaymentStatusDisplay(selectedBooking.paymentStatus).label}</span></p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                          <MapPin size={16} className="text-amber-600" /> Chuyến xe
                        </h3>
                        <div className="space-y-2 text-sm">
                          <p className="font-medium text-slate-900">{(selectedBooking.tripId as any)?.tenChuyen}</p>
                          <p className="text-slate-500">{(selectedBooking.tripId as any)?.tu} → {(selectedBooking.tripId as any)?.den}</p>
                          <p className="text-slate-500 flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date((selectedBooking.tripId as any)?.ngayKhoiHanh || Date.now()).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <h3 className="font-semibold text-slate-800 mb-3 text-sm">Sơ đồ ghế chuyến này</h3>
                        <div className="grid grid-cols-5 gap-2">
                          {Array.from({ length: getSeatCount((selectedBooking.tripId as any) || null) }, (_, i) =>
                            (i + 1).toString()
                          ).map((seat) => {
                            const booked = selectedBookingTripBookedSeats.includes(seat);
                            const isMySeat = (selectedBooking.soGhe || []).includes(seat);
                            return (
                              <div
                                key={seat}
                                className={`
                                  h-8 rounded flex items-center justify-center text-xs font-bold
                                  ${isMySeat ? "bg-blue-600 text-white ring-2 ring-blue-200" : 
                                    booked ? "bg-slate-300 text-slate-500" : "bg-emerald-100 text-emerald-600"}
                                `}
                              >
                                {seat}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Edit Booking Modal */}
          {editBooking && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setEditBooking(null)}>
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-800">Chỉnh sửa ghế</h2>
                  <button onClick={() => setEditBooking(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={20} className="text-slate-500" />
                  </button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <p className="font-semibold text-slate-700 mb-4">Chọn ghế mới</p>
                    <div className="grid grid-cols-5 gap-3">
                      {Array.from({ length: (editBooking.tripId as any)?.soGhe || 20 }, (_, i) => (i + 1).toString()).map(
                        (seat) => {
                          const lockedByOthers = editBookingLockedSeats.includes(seat) && !(editBooking.soGhe || []).includes(seat);
                          const isSelected = editBookingSelectedSeats.includes(seat);
                          return (
                            <button
                              key={seat}
                              disabled={lockedByOthers}
                              onClick={() => toggleEditBookingSeat(seat)}
                              className={`
                                h-10 rounded-lg font-bold text-sm transition-all
                                ${lockedByOthers ? "bg-slate-100 text-slate-300 cursor-not-allowed" : 
                                  isSelected ? "bg-blue-600 text-white shadow-md scale-105" : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600"}
                              `}
                            >
                              {seat}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                      <h3 className="font-semibold text-slate-800 mb-4">Thông tin cập nhật</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Khách hàng:</span>
                          <span className="font-medium">{editBooking.hoTen}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Ghế hiện tại:</span>
                          <span className="font-medium">{(editBooking.soGhe || []).join(", ")}</span>
                        </div>
                        <div className="flex justify-between pt-3 border-t border-slate-200">
                          <span className="text-slate-500">Ghế mới:</span>
                          <span className="font-bold text-blue-600">{editBookingSelectedSeats.join(", ") || "Chưa chọn"}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Tổng tiền mới:</span>
                          <span className="font-bold text-xl text-emerald-600">
                            {((editBookingSelectedSeats.length * ((editBooking.tripId as any)?.giaVe || 0)) || 0).toLocaleString()}₫
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setEditBooking(null)}
                        className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                      >
                        Hủy bỏ
                      </button>
                      <button
                        onClick={saveEditBooking}
                        className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-sm hover:shadow transition-all"
                      >
                        Lưu thay đổi
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Quick Book Modal */}
          {quickBookModal && quickBookSeat && tripForManage && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => !quickBookLoading && setQuickBookModal(false)}>
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="bg-blue-600 p-6 text-white">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Ticket /> Đặt vé nhanh
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">Nhập thông tin khách hàng cho ghế {quickBookSeat}</p>
                </div>

                <div className="p-6 space-y-5">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tên khách hàng <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="text"
                          value={quickBookHoTen}
                          onChange={(e) => setQuickBookHoTen(e.target.value)}
                          placeholder="Nhập họ tên"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          disabled={quickBookLoading}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="tel"
                          value={quickBookSdt}
                          onChange={(e) => setQuickBookSdt(e.target.value)}
                          placeholder="Nhập số điện thoại"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          disabled={quickBookLoading}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Chuyến:</span>
                      <span className="font-medium">{tripForManage.tenChuyen}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ghế:</span>
                      <span className="font-bold text-blue-600 text-lg">{quickBookSeat}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200 mt-2">
                      <span className="text-slate-500 font-medium">Thành tiền:</span>
                      <span className="font-bold text-red-600 text-lg">{tripForManage.giaVe?.toLocaleString()}₫</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setQuickBookModal(false)}
                      disabled={quickBookLoading}
                      className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleQuickBook}
                      disabled={quickBookLoading || !quickBookHoTen.trim() || !quickBookSdt.trim()}
                      className={`flex-1 py-3 rounded-xl font-medium text-white shadow-sm transition-all flex justify-center items-center gap-2
                        ${quickBookLoading || !quickBookHoTen.trim() || !quickBookSdt.trim() 
                          ? "bg-slate-300 cursor-not-allowed" 
                          : "bg-blue-600 hover:bg-blue-700 hover:shadow-md"}`}
                    >
                      {quickBookLoading ? <RefreshCw className="animate-spin" size={18} /> : "Xác nhận đặt"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }


