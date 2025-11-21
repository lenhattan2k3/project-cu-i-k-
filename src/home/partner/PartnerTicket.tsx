  // PartnerTicket.tsx
  import React, { useEffect, useState } from "react";
  import axios from "axios";
  import { getAllTrips } from "../../api/tripApi";
  import { getAllBookings, getBookedSeats, cancelBooking, updateBookingStatus, updateBooking, saveMarkedSeats, getMarkedSeats, bookTicket } from "../../api/bookingApi";

  interface Trip {
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
  }

  export default function PartnerTicket() {
    // dữ liệu chính
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);

    // state cho seat manager (mới)
    const [tripForManage, setTripForManage] = useState<Trip | null>(null);
    const [tripBookedSeats, setTripBookedSeats] = useState<string[]>([]); // ghế đã đặt của chuyến (từ booking)
    const [tripSelectedSeats, setTripSelectedSeats] = useState<string[]>([]); // ghế partner muốn set/add
    const [tripBookingsOfSelected, setTripBookingsOfSelected] = useState<Booking[]>([]); // bookings thuộc trip selected (dùng để hiển thị thông tin)
    const [seatActionLoading, setSeatActionLoading] = useState(false);

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

    // ---------- Helpers: parse responses safely ----------
    const parseBookingsArrayFromRes = (resData: any): Booking[] => {
      // Nếu backend trả về mảng booking => dùng luôn
      if (Array.isArray(resData)) return resData as Booking[];
      // Nếu backend trả về object { bookedSeats: [...] } -> không phải booking list
      // Nếu backend trả về { bookings: [...] } thì lấy đó
      if (Array.isArray(resData.bookings)) return resData.bookings as Booking[];
      // nếu backend trả về object booking (1 booking) -> wrap
      if (resData && typeof resData === "object" && resData._id) return [resData as Booking];
      return [];
    };


    // ban đầu fetch cả trips + bookings (giữ nguyên logic)
    useEffect(() => {
      const fetchAll = async () => {
        try {
          setLoading(true);
          const [tripData, bookingData] = await Promise.all([
            (async () => {
              try {
                return await getAllTrips();
              } catch {
                const res = await axios.get("http://localhost:5000/api/trips");
                return res.data;
              }
            })(),
            (async () => {
              try {
                return await getAllBookings();
              } catch {
                const res = await axios.get("http://localhost:5000/api/bookings");
                return res.data;
              }
            })(),
          ]);

          setTrips(tripData || []);
          setBookings(bookingData || []);
        } catch (err) {
          console.error("Lỗi khi tải dữ liệu:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchAll();
    }, []);

    // ---------------------------
    // --- Seat Manager (top) ---
    // ---------------------------

    // Chú ý: backend có thể có nhiều endpoint khác nhau:
    // - GET /api/bookings/trip/:tripId  => trả về array booking
    // - GET /api/bookings/trip/:tripId/seats => trả về { bookedSeats: [...] } hoặc array seats
    // - GET /api/bookings/bookedSeats/:tripId => legacy
    // Vì vậy ta sẽ gọi, kiểm tra và fallback các dạng trả về.

    const fetchBookingsOfTripRaw = async (tripId: string) => {
      try {
        // Lấy tất cả bookings từ state hoặc API
        const allBookings = bookings.length > 0 
          ? bookings 
          : await getAllBookings();
        
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

    try {
      setSeatActionLoading(true);

      // Reload trips và bookings để có dữ liệu mới nhất
      await reloadAllData();
      
      // Fetch lại trip trực tiếp từ API để có bookedSeats mới nhất
      let currentTrip: Trip | null = null;
      try {
        const allTrips = await getAllTrips();
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
          // Không có userId, có thể backend không bắt buộc cho partner đặt vé
          console.warn("⚠️ Không lấy được userId từ localStorage:", userErr);
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
      await reloadAllData();
      
      // Đợi thêm một chút để state được update
      await new Promise(resolve => setTimeout(resolve, 200));
      
      alert("✅ Đã lưu ghế đánh dấu thành công!");
      
      // Fetch lại trip trực tiếp từ API để có bookedSeats mới nhất
      // Đợi một chút để backend xử lý xong
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let updatedTrip: Trip | null = null;
      try {
        // Fetch lại trực tiếp từ API (không dùng cache)
        const allTrips = await getAllTrips();
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

    // reload cả trips + bookings (đồng bộ)
    const reloadAllData = async () => {
      try {
        setLoading(true);
        const [tripData, bookingData] = await Promise.all([
          (async () => {
            try {
              return await getAllTrips();
            } catch {
              const res = await axios.get("http://localhost:5000/api/trips");
              return res.data;
            }
          })(),
          (async () => {
            try {
              return await getAllBookings();
            } catch {
              const res = await axios.get("http://localhost:5000/api/bookings");
              return res.data;
            }
          })(),
        ]);

        setTrips(tripData || []);
        setBookings(bookingData || []);
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
        <div style={styles.loadingScreen}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Đang tải dữ liệu...</p>
        </div>
      );
    }

    return (
      <div style={styles.container}>
        {/* ======================
              TOP: Seat Manager
          ====================== */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              background: "#fff",
              padding: 16,
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: 220 }}>
              <label style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>🔧 Quản lý ghế (nhanh)</label>
              <select
                value={tripForManage?._id || ""}
                onChange={(e) => handleSelectTripForManage(e.target.value || undefined)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ccc" }}
              >
                <option value="">— Chọn chuyến để quản lý ghế —</option>
                {trips.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.tenChuyen} ({t.tu} → {t.den})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: "#555" }}>
                {tripForManage ? (
                  <>
                    <strong>{tripForManage.tenChuyen}</strong> — Tổng ghế: <strong>{tripForManage.soGhe || 20}</strong> — 
                    Đã đặt: <strong style={{ color: "#ef4444" }}>{tripBookedSeats.length}</strong> — 
                    Còn trống: <strong style={{ color: "#10b981" }}>{(tripForManage.soGhe || 20) - tripBookedSeats.length}</strong> — 
                    Số vé: {tripBookingsOfSelected.length}
                  </>
                ) : (
                  <>Chọn chuyến phía trái để xem sơ đồ ghế (dữ liệu lấy từ các booking của chuyến).</>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  if (tripForManage) handleSelectTripForManage(tripForManage._id);
                }}
                style={{ padding: "8px 12px", borderRadius: 8, background: "#f3f4f6", border: "1px solid #e5e7eb" }}
              >
                🔄 Làm mới
              </button>

              <button
                onClick={() => {
                  if (tripForManage && tripSelectedSeats.length > 0 && tripSelectedSeats.length === 1) {
                    // Kiểm tra ghế có trống không (chưa được đặt)
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
                    
                    // Mở modal đặt vé nhanh cho ghế đó
                    openQuickBookModal(selectedSeat);
                  } else if (tripSelectedSeats.length === 0) {
                    alert("⚠️ Vui lòng chọn ghế trước khi đặt vé nhanh!");
                  } else {
                    alert("⚠️ Chỉ có thể đặt vé nhanh cho 1 ghế tại một thời điểm!");
                  }
                }}
                disabled={!tripForManage || seatActionLoading || tripSelectedSeats.length === 0}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  background: !tripForManage || tripSelectedSeats.length === 0 ? "#c7d2fe" : "#10b981",
                  color: "#fff",
                  border: "none",
                  cursor: !tripForManage || tripSelectedSeats.length === 0 ? "not-allowed" : "pointer",
                }}
                title={tripSelectedSeats.length > 0 ? `Đặt vé nhanh cho ghế ${tripSelectedSeats.join(", ")}` : "Chọn ghế trước"}
              >
                🎫 Đặt vé nhanh
              </button>

              <button
                onClick={handleSaveTripSeats}
                disabled={!tripForManage || seatActionLoading}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  background: !tripForManage ? "#c7d2fe" : "#4f46e5",
                  color: "#fff",
                  border: "none",
                  cursor: !tripForManage ? "not-allowed" : "pointer",
                }}
              >
                {seatActionLoading ? "Đang lưu..." : "💾 Lưu đánh dấu ghế"}
              </button>
            </div>
          </div>

          {/* Seat map small preview */}
          {tripForManage && (
            <div style={{ marginTop: 12, background: "#fff", padding: 12, borderRadius: 10 }}>
              <div style={{ marginBottom: 8, fontSize: 13, color: "#666", fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <span>Sơ đồ ghế:</span>
                <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>
                  Click để đánh dấu • Double-click để đặt vé nhanh
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(5, 1fr)`, gap: 8 }}>
                {Array.from({ length: tripForManage.soGhe || 20 }, (_, i) => (i + 1).toString()).map((seat) => {
                  // Lấy ghế từ bookings thực tế (không bao gồm ghế đánh dấu và booking đánh dấu)
                  const bookedSeatsFromBookings = tripBookingsOfSelected
                    .filter((b) => !(b.hoTen === "_MARKED_SEATS_" && b.sdt === "_PARTNER_MARKED_")) // Loại trừ booking đánh dấu
                    .flatMap((b) => (Array.isArray(b.soGhe) ? b.soGhe.map(String) : []));
                  
                  // Lấy ghế đã được đánh dấu và lưu (từ booking đặc biệt)
                  const markedSeatsBooked = tripBookingsOfSelected
                    .filter((b) => b.hoTen === "_MARKED_SEATS_" && b.sdt === "_PARTNER_MARKED_")
                    .flatMap((b) => (Array.isArray(b.soGhe) ? b.soGhe.map(String) : []));
                  
                  // Ghế đã đặt bởi booking thật (khóa, không thể thay đổi)
                  const isBookedByRealBooking = bookedSeatsFromBookings.includes(seat);
                  
                  // Ghế đã được đánh dấu và lưu (hiển thị như "đã đặt")
                  const isMarkedSeatSaved = markedSeatsBooked.includes(seat);
                  
                  // Ghế đang được chọn để đánh dấu nhưng chưa lưu
                  const isSelectedButNotSaved = tripSelectedSeats.includes(seat) && !isMarkedSeatSaved;
                  
                  // Ưu tiên hiển thị:
                  // 1. Ghế đã đặt bởi booking thật hoặc đã được đánh dấu (đã lưu): màu xám + "Đã đặt"
                  // 2. Ghế đang chọn nhưng chưa lưu: màu vàng + "Đang chọn"
                  // 3. Ghế trống: màu xanh + "Trống"
                  const isBooked = isBookedByRealBooking || isMarkedSeatSaved;
                  
                  return (
                    <button
                      key={seat}
                      onClick={() => toggleTripSeat(seat)}
                      onDoubleClick={() => toggleTripSeat(seat, true)}
                      disabled={isBookedByRealBooking && !isSelectedButNotSaved}
                      style={{
                        padding: "8px 4px",
                        borderRadius: 8,
                        border: "none",
                        color: "#fff",
                        background: isBooked ? "#6b7280" : isSelectedButNotSaved ? "#f59e0b" : "#10b981",
                        cursor: isBookedByRealBooking && !isSelectedButNotSaved ? "not-allowed" : "pointer",
                        opacity: isBooked ? 0.9 : 1,
                        fontWeight: 600,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 2,
                        fontSize: 11,
                      }}
                      title={
                        isBookedByRealBooking
                          ? `Ghế ${seat} - Đã đặt bởi booking (khóa)`
                          : isMarkedSeatSaved
                          ? `Ghế ${seat} - Đã đánh dấu (đã lưu) - Click để bỏ đánh dấu`
                          : isSelectedButNotSaved
                          ? `Ghế ${seat} - Đang chọn để đánh dấu - Click để bỏ`
                          : `Ghế ${seat} - Còn trống - Click để đánh dấu, Double-click để đặt vé nhanh`
                      }
                    >
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{seat}</span>
                      <span style={{ fontSize: 9 }}>
                        {isBooked ? "🔒 Đã đặt" : isSelectedButNotSaved ? "⭐ Đang chọn" : "✅ Trống"}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 12, padding: "10px", background: "#f9fafb", borderRadius: 8, fontSize: 13 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 15, flexWrap: "wrap", marginBottom: 8 }}>
                  <span style={{ color: "#6b7280", fontWeight: 700 }}>■</span> Đã đặt (booking thật hoặc đã đánh dấu)
                  <span style={{ color: "#10b981", fontWeight: 700 }}>■</span> Còn trống
                  <span style={{ color: "#f59e0b", fontWeight: 700 }}>■</span> Đang chọn để đánh dấu (chưa lưu)
                </div>
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #e5e7eb", color: "#666" }}>
                  {(() => {
                    // Tính số ghế đang chọn nhưng chưa lưu
                    const markedSeatsBooked = tripBookingsOfSelected
                      .filter((b) => b.hoTen === "_MARKED_SEATS_" && b.sdt === "_PARTNER_MARKED_")
                      .flatMap((b) => (Array.isArray(b.soGhe) ? b.soGhe.map(String) : []));
                    const selectedButNotSaved = tripSelectedSeats.filter(seat => !markedSeatsBooked.includes(seat));
                    
                    return (
                      <>
                        <strong>Tóm tắt:</strong> Tổng <strong>{tripForManage.soGhe || 20}</strong> ghế — 
                        Đã đặt <strong style={{ color: "#ef4444" }}>{tripBookedSeats.length}</strong> — 
                        Còn trống <strong style={{ color: "#10b981" }}>{(tripForManage.soGhe || 20) - tripBookedSeats.length}</strong> — 
                        {selectedButNotSaved.length > 0 && (
                          <>Đang chọn <strong style={{ color: "#f59e0b" }}>{selectedButNotSaved.length}</strong> để đánh dấu (chưa lưu)</>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ======================
              Existing UI (giữ nguyên)
          ====================== */}
        <div style={styles.header}>
          <h1 style={styles.title}>🚍 Quản lý vé đối tác</h1>
          <p style={styles.subtitle}>Theo dõi tình trạng đặt vé & chuyến xe</p>
        </div>

        <div style={styles.card}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>👤 Khách hàng</th>
                <th style={styles.th}>📞 Liên hệ</th>
                <th style={styles.th}>💺 Ghế</th>
                <th style={styles.th}>💰 Tổng tiền</th>
                    <th style={styles.th}>⚙️ Trạng thái</th>
                    <th style={styles.th}>🔧 Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length > 0 ? (
                bookings
                  .filter((b) => !(b.hoTen === "_MARKED_SEATS_" && b.sdt === "_PARTNER_MARKED_")) // Loại trừ booking đánh dấu
                  .map((b) => (
                  <tr key={b._id} style={styles.tr}>
                    <td style={styles.td}>{b.hoTen}</td>
                    <td style={styles.td}>{b.sdt}</td>
                    <td style={{ ...styles.td, color: "#1976d2" }}>{(b.soGhe || []).join(", ")}</td>
                    <td style={styles.td}>{(b.totalPrice || 0).toLocaleString()}₫</td>
                    <td style={styles.td}>
                      <button
                        onClick={() => handleTogglePaymentStatus(b)}
                        style={{
                          ...styles.status,
                          ...(b.status === "paid" ? styles.statusPaid : styles.statusUnpaid),
                          cursor: "pointer",
                          border: "none",
                        }}
                        title={`Click để ${b.status === "paid" ? "hủy" : "xác nhận"} thanh toán`}
                      >
                        {b.status === "paid" ? "✅ Đã thanh toán" : "⌛ Chưa thanh toán"}
                      </button>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button onClick={() => handleViewBooking(b)} style={styles.viewBtn}>
                          👁️ Xem
                        </button>
                        <button
                          onClick={() => openEditBooking(b)}
                          style={{ ...styles.viewBtn, background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteBooking(b._id)}
                          style={{ ...styles.viewBtn, background: "linear-gradient(135deg,#ef4444,#dc2626)" }}
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={styles.empty}>
                    🚫 Không có vé nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal xem chi tiết booking */}
        {selectedBooking && (
          <div
            style={styles.modalOverlay}
            onClick={() => {
              setSelectedBooking(null);
              setSelectedBookingTripBookedSeats([]);
            }}
          >
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <button
                style={styles.closeBtn}
                onClick={() => {
                  setSelectedBooking(null);
                  setSelectedBookingTripBookedSeats([]);
                }}
              >
                ✕
              </button>
              <h2 style={styles.modalTitle}>Chi tiết vé xe</h2>

              {selectedBooking.tripId && (selectedBooking.tripId as any).hinhAnh && (
                <img
                  src={`http://localhost:5000${(selectedBooking.tripId as any).hinhAnh}`}
                  alt="Trip"
                  style={styles.image}
                />
              )}

              <div style={styles.modalGrid}>
                <div style={styles.modalBox}>
                  <h3 style={styles.sectionTitle}>👤 Khách hàng</h3>
                  <p>
                    <strong>Tên:</strong> {selectedBooking.hoTen}
                  </p>
                  <p>
                    <strong>SĐT:</strong> {selectedBooking.sdt}
                  </p>
                  <p>
                    <strong>Ghế đã đặt:</strong>{" "}
                    <span style={styles.badge}>{(selectedBooking.soGhe || []).join(", ")}</span>
                  </p>
                  <p>
                    <strong>Tổng tiền:</strong> {(selectedBooking.totalPrice || 0).toLocaleString()}₫
                  </p>
                </div>

                <div style={styles.modalBox}>
                  <h3 style={styles.sectionTitle}>🚌 Chuyến xe</h3>
                  <p>
                    <strong>Tên chuyến:</strong> {(selectedBooking.tripId as any)?.tenChuyen}
                  </p>
                  <p>
                    <strong>Tuyến:</strong> {(selectedBooking.tripId as any)?.tu} → {(selectedBooking.tripId as any)?.den}
                  </p>
                  <p>
                    <strong>Ngày khởi hành:</strong>{" "}
                    {new Date((selectedBooking.tripId as any)?.ngayKhoiHanh || Date.now()).toLocaleDateString("vi-VN")}
                  </p>
                  <p>
                    <strong>Giá vé:</strong> {( (selectedBooking.tripId as any)?.giaVe || "-" )?.toString() }₫
                  </p>
                </div>

                <div style={styles.modalBox}>
                  <h3 style={styles.sectionTitle}>💺 Sơ đồ ghế (trip)</h3>
                  <div style={styles.seatContainer}>
                    {Array.from({ length: getSeatCount((selectedBooking.tripId as any) || null) }, (_, i) =>
                      (i + 1).toString()
                    ).map((seat) => {
                      // Ghế đã đặt (từ API getBookedSeats)
                      const booked = selectedBookingTripBookedSeats.includes(seat);
                      // Ghế của booking hiện tại
                      const isMySeat = (selectedBooking.soGhe || []).includes(seat);
                      return (
                        <div
                          key={seat}
                          style={{
                            ...styles.seat,
                            backgroundColor: booked ? (isMySeat ? "#1976d2" : "#ef5350") : "#81c784",
                            color: "white",
                          }}
                          title={booked ? (isMySeat ? `Ghế ${seat} - Vé của bạn` : `Ghế ${seat} - Đã được đặt`) : `Ghế ${seat} - Còn trống`}
                        >
                          {seat}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 12, fontSize: 12, color: "#555" }}>
                    <span style={{ color: "#1976d2", fontWeight: 700 }}>■</span> Ghế của vé này
                    <span style={{ marginLeft: 12, color: "#ef5350", fontWeight: 700 }}>■</span> Đã được đặt (khác)
                    <span style={{ marginLeft: 12, color: "#81c784", fontWeight: 700 }}>■</span> Còn trống
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal chỉnh ghế cho 1 booking */}
        {editBooking && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1100,
            }}
            onClick={() => setEditBooking(null)}
          >
            <div
              style={{ width: "720px", maxWidth: "95%", background: "#fff", borderRadius: 12, padding: 18 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ marginTop: 0 }}>✏️ Chỉnh ghế - {editBooking.hoTen}</h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ padding: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>Sơ đồ ghế (khóa: ghế đã đặt bởi khác)</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginTop: 10 }}>
                    {Array.from({ length: (editBooking.tripId as any)?.soGhe || 20 }, (_, i) => (i + 1).toString()).map(
                      (seat) => {
                        const lockedByOthers =
                          editBookingLockedSeats.includes(seat) && !(editBooking.soGhe || []).includes(seat);
                        const isSelected = editBookingSelectedSeats.includes(seat);
                        return (
                          <button
                            key={seat}
                            disabled={lockedByOthers}
                            onClick={() => toggleEditBookingSeat(seat)}
                            style={{
                              padding: "8px 0",
                              borderRadius: 8,
                              border: "none",
                              color: lockedByOthers ? "#9ca3af" : "#fff",
                              background: lockedByOthers ? "#e5e7eb" : isSelected ? "#2563eb" : "#10b981",
                              cursor: lockedByOthers ? "not-allowed" : "pointer",
                            }}
                          >
                            {seat}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                <div style={{ padding: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>Thông tin</p>
                  <div style={{ marginTop: 8 }}>
                    <p style={{ margin: "8px 0" }}>
                      <strong>Ghế hiện tại:</strong> {(editBooking.soGhe || []).join(", ")}
                    </p>
                    <p style={{ margin: "8px 0" }}>
                      <strong>Ghế đã chọn mới:</strong> {editBookingSelectedSeats.join(", ") || "Chưa chọn"}
                    </p>
                    <p style={{ margin: "8px 0" }}>
                      <strong>Tổng tiền mới:</strong>{" "}
                      {((editBookingSelectedSeats.length * ((editBooking.tripId as any)?.giaVe || 0)) || 0).toLocaleString()}
                      ₫
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button
                      onClick={() => setEditBooking(null)}
                      style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: "#9ca3af", color: "#fff" }}
                    >
                      Hủy
                    </button>
                    <button
                      onClick={saveEditBooking}
                      style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: "#10b981", color: "#fff" }}
                    >
                      💾 Lưu thay đổi
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal đặt vé nhanh từ sơ đồ ghế */}
        {quickBookModal && quickBookSeat && tripForManage && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1100,
            }}
            onClick={() => {
              if (!quickBookLoading) {
                setQuickBookModal(false);
                setQuickBookSeat(null);
                setQuickBookHoTen("");
                setQuickBookSdt("");
              }
            }}
          >
            <div
              style={{
                width: "480px",
                maxWidth: "95%",
                background: "#fff",
                borderRadius: 12,
                padding: 24,
                boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ marginTop: 0, marginBottom: 20, color: "#1976d2", fontSize: 20 }}>
                🎫 Đặt vé nhanh - Ghế {quickBookSeat}
              </h3>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, color: "#37474f" }}>
                  Tên khách hàng <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  value={quickBookHoTen}
                  onChange={(e) => setQuickBookHoTen(e.target.value)}
                  placeholder="Nhập tên khách hàng"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    fontSize: 14,
                    outline: "none",
                  }}
                  disabled={quickBookLoading}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, color: "#37474f" }}>
                  Số điện thoại <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="tel"
                  value={quickBookSdt}
                  onChange={(e) => setQuickBookSdt(e.target.value)}
                  placeholder="Nhập số điện thoại (10-11 số)"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    fontSize: 14,
                    outline: "none",
                  }}
                  disabled={quickBookLoading}
                />
              </div>

              <div style={{ marginBottom: 20, padding: 12, background: "#f9fafb", borderRadius: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "#6b7280" }}>Chuyến:</span>
                  <strong style={{ color: "#1976d2" }}>{tripForManage.tenChuyen}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "#6b7280" }}>Tuyến:</span>
                  <strong>{tripForManage.tu} → {tripForManage.den}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "#6b7280" }}>Ghế:</span>
                  <strong style={{ color: "#10b981", fontSize: 16 }}>{quickBookSeat}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e5e7eb", paddingTop: 8, marginTop: 8 }}>
                  <span style={{ color: "#6b7280", fontWeight: 600 }}>Tổng tiền:</span>
                  <strong style={{ color: "#ef4444", fontSize: 18 }}>
                    {tripForManage.giaVe?.toLocaleString() || "0"}₫
                  </strong>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => {
                    if (!quickBookLoading) {
                      setQuickBookModal(false);
                      setQuickBookSeat(null);
                      setQuickBookHoTen("");
                      setQuickBookSdt("");
                    }
                  }}
                  disabled={quickBookLoading}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 8,
                    border: "none",
                    background: quickBookLoading ? "#e5e7eb" : "#9ca3af",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: quickBookLoading ? "not-allowed" : "pointer",
                  }}
                >
                  Hủy
                </button>
                <button
                  onClick={handleQuickBook}
                  disabled={quickBookLoading || !quickBookHoTen.trim() || !quickBookSdt.trim()}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 8,
                    border: "none",
                    background: quickBookLoading || !quickBookHoTen.trim() || !quickBookSdt.trim() ? "#c7d2fe" : "#4f46e5",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: quickBookLoading || !quickBookHoTen.trim() || !quickBookSdt.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  {quickBookLoading ? "Đang đặt vé..." : "✅ Xác nhận đặt vé"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* Styles (giữ gần giống file gốc) */
  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #90caf9 0%, #e3f2fd 50%, #ffffff 100%)",
      padding: "2.5rem",
      fontFamily: "'Poppins', sans-serif",
    },
    header: { textAlign: "center", marginBottom: "1.5rem" },
    title: {
      fontSize: "2rem",
      fontWeight: 800,
      color: "#0d47a1",
    },
    subtitle: { color: "#607d8b", fontSize: "0.95rem", marginTop: "0.3rem" },
    card: {
      background: "#fff",
      borderRadius: 12,
      boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
      overflow: "hidden",
    },
    table: { width: "100%", borderCollapse: "collapse" },
    th: {
      background: "#e3f2fd",
      color: "#0d47a1",
      padding: "12px 14px",
      textAlign: "left",
      fontWeight: 700,
      fontSize: 14,
    },
    td: { padding: "10px 14px", fontSize: 13, color: "#37474f" },
    tr: { borderBottom: "1px solid #f1f1f1" },
    empty: {
      textAlign: "center",
      padding: "2rem",
      color: "#90a4ae",
      fontStyle: "italic",
    },
    viewBtn: {
      background: "linear-gradient(135deg, #42a5f5, #1976d2)",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      padding: "6px 12px",
      cursor: "pointer",
      fontWeight: 600,
    },
    status: { padding: "6px 10px", borderRadius: 12, fontSize: 12, fontWeight: 700 },
    statusPaid: { background: "#e8f5e9", color: "#2e7d32" },
    statusUnpaid: { background: "#ffebee", color: "#c62828" },
    modalOverlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.45)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 999,
    },
    modalContent: {
      background: "#fff",
      borderRadius: 12,
      padding: "1rem",
      width: "92%",
      maxWidth: 820,
      maxHeight: "85vh",
      overflowY: "auto",
      position: "relative",
    },
    modalTitle: {
      textAlign: "center",
      fontSize: "1.3rem",
      color: "#1565c0",
      marginBottom: "0.8rem",
      fontWeight: 700,
    },
    image: {
      width: "100%",
      borderRadius: 8,
      objectFit: "cover",
      height: 140,
      marginBottom: 12,
    },
    modalGrid: { display: "grid", gridTemplateColumns: "1fr", gap: "1rem" },
    modalBox: {
      background: "#f5faff",
      borderRadius: 10,
      padding: "0.8rem",
      border: "1px solid #bbdefb",
    },
    closeBtn: {
      position: "absolute",
      top: 8,
      right: 8,
      border: "none",
      background: "#ef5350",
      color: "white",
      borderRadius: "50%",
      width: 30,
      height: 30,
      cursor: "pointer",
    },
    sectionTitle: {
      color: "#1976d2",
      marginBottom: "0.5rem",
      fontSize: 14,
      fontWeight: 700,
    },
    badge: {
      background: "#bbdefb",
      color: "#0d47a1",
      padding: "3px 8px",
      borderRadius: 6,
      fontWeight: 600,
    },
    seatContainer: {
      display: "grid",
      gridTemplateColumns: "repeat(5, 1fr)",
      gap: 8,
      justifyItems: "center",
      paddingTop: 6,
    },
    seat: {
      width: 36,
      height: 36,
      borderRadius: 8,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontWeight: 700,
      fontSize: 13,
      color: "white",
      cursor: "default",
    },
    loadingScreen: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "60vh",
      background: "#e3f2fd",
      borderRadius: 12,
      padding: 20,
    },
    spinner: {
      width: 50,
      height: 50,
      border: "6px solid #bbdefb",
      borderTop: "6px solid #1e88e5",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
    },
    loadingText: { marginTop: 12, color: "#1565c0", fontWeight: 600 },
  };
