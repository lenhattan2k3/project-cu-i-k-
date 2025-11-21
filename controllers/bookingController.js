import Booking from "../models/Booking.js";
import Trip from "../models/tripModel.js";
import Review from "../models/Review.js";
import mongoose from "mongoose";

/**
 * ===================================================
 * 🧩 1. Đặt vé
 * ===================================================
 */
export const bookTicket = async (req, res) => {
  try {
    const { userId, tripId, hoTen, sdt, soGhe, totalPrice, paymentMethod } = req.body;

    if (!userId || !tripId) {
      return res.status(400).json({ message: "❌ Thiếu thông tin người dùng hoặc chuyến!" });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: "Không tìm thấy chuyến đi" });

    // 🛑 Kiểm tra trùng ghế
    const existingBookings = await Booking.find({ tripId });
    const bookedSeats = existingBookings.flatMap((b) => b.soGhe);
    const conflict = soGhe.some((seat) => bookedSeats.includes(seat));

    if (conflict) return res.status(400).json({ message: "Ghế đã được đặt" });

    // ✔ Tạo booking mới
    const newBooking = new Booking({
      userId: String(userId),
      tripId,
      hoTen,
      sdt,
      soGhe,
      partnerId: trip.partnerId,  // 🔥 THÊM DÒNG NÀY
      totalPrice,
      paymentMethod: paymentMethod || "cash",
      status: paymentMethod === "cash" ? "paid" : "pending",
    });

    await newBooking.save();
    return res.status(201).json({ message: "✅ Đặt vé thành công!", booking: newBooking });
  } catch (err) {
    console.error("❌ Lỗi khi đặt vé:", err);
    return res.status(500).json({ message: "Lỗi server khi đặt vé", error: err.message });
  }
};

/**
 * ===================================================
 * 🧩 2. Lấy tất cả vé (admin)
 * ===================================================
 */
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("tripId")
      .populate("userId");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách vé", error: err.message });
  }
};

/**
 * ===================================================
 * 🧩 3. Lấy vé theo userId
 * ===================================================
 */
export const getBookingsByUser = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: String(req.params.userId) })
      .populate("tripId")
      .populate("userId");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy vé theo user", error: err.message });
  }
};

/**
 * ===================================================
 * 🧩 4. Lấy ghế đã đặt của 1 chuyến đi
 * ===================================================
 */
export const getBookedSeats = async (req, res) => {
  try {
    const bookings = await Booking.find({ tripId: req.params.tripId });
    const bookedSeats = bookings.flatMap((b) => b.soGhe);
    res.json({ bookedSeats });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách ghế đã đặt", error: err.message });
  }
};

/**
 * ===================================================
 * 🧩 5. Lấy vé theo số điện thoại
 * ===================================================
 */
export const getBookingsByPhone = async (req, res) => {
  try {
    const bookings = await Booking.find({ sdt: req.params.sdt })
      .populate("tripId")
      .populate("userId");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy vé theo số điện thoại", error: err.message });
  }
};

/**
 * ===================================================
 * 🧩 6. Cập nhật trạng thái vé + payment method
 * ===================================================
 */
export const updateBookingStatus = async (req, res) => {
  try {
    const { 
      status, 
      paymentMethod, 
      voucherCode, 
      discountAmount, 
      finalTotal,
      diemDonChiTiet
    } = req.body;

    const updateData = { status };

    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    updateData.voucherCode = voucherCode ?? null;
    updateData.discountAmount = discountAmount ?? 0;
    updateData.finalTotal = finalTotal ?? 0;
    updateData.diemDonChiTiet = diemDonChiTiet?.trim() || null;

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate("tripId").populate("userId");

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy vé" });
    }

    res.json({ message: "Cập nhật trạng thái thành công", booking });
  } catch (err) {
    console.error("Lỗi khi cập nhật trạng thái vé:", err);
    res.status(500).json({ message: "Lỗi khi cập nhật trạng thái vé", error: err.message });
  }
};

/**
 * ===================================================
 * 🧩 7. Hủy vé
 * ===================================================
 */
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy vé để hủy!" });
    }

    // Trả ghế lại cho chuyến đi
    const trip = await Trip.findById(booking.tripId);
    if (trip && Array.isArray(trip.bookedSeats)) {
      trip.bookedSeats = trip.bookedSeats.filter(
        (seat) => !booking.soGhe.includes(seat)
      );
      await trip.save();
    }

    await Booking.findByIdAndDelete(req.params.id);

    res.json({
      message: "✅ Vé đã bị xóa và ghế được nhả lại!",
      bookingId: req.params.id,
    });
  } catch (error) {
    console.error("❌ Lỗi khi xóa vé:", error);
    res.status(500).json({
      message: "Lỗi khi xóa vé",
      error: error.message,
    });
  }
};

/**
 * ===================================================
 * 🧩 8. Cập nhật thông tin vé
 * ===================================================
 */
export const updateBooking = async (req, res) => {
  try {
    const { hoTen, sdt, soGhe, totalPrice } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy vé cần cập nhật" });
    }

    // Kiểm tra trùng ghế nếu thay đổi ghế
    if (soGhe && soGhe.length > 0) {
      const existingBookings = await Booking.find({
        tripId: booking.tripId,
        _id: { $ne: booking._id },
      });

      const bookedSeats = existingBookings.flatMap((b) => b.soGhe);
      const conflict = soGhe.some((seat) => bookedSeats.includes(seat));

      if (conflict) {
        return res.status(400).json({ message: "Ghế đã được đặt, vui lòng chọn ghế khác!" });
      }

      booking.soGhe = soGhe;
    }

    if (hoTen) booking.hoTen = hoTen;
    if (sdt) booking.sdt = sdt;
    if (totalPrice) booking.totalPrice = totalPrice;

    await booking.save();

    res.json({ message: "✅ Cập nhật vé thành công!", booking });
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật vé:", err);
    res.status(500).json({ message: "Lỗi server khi cập nhật vé", error: err.message });
  }
};

/**
 * ===================================================
 * 🧩 9. Lấy vé theo role (admin / partner / user)
 * ===================================================
 */
export const getBookingsByRole = async (req, res) => {
  try {
    const { role, userId } = req.params;

    if (role === "admin") {
      const bookings = await Booking.find()
        .populate("tripId")
        .populate("userId");
      return res.json(bookings);
    }

    if (role === "partner") {
      const trips = await Trip.find({ createdByRole: "partner" });
      const tripIds = trips.map((t) => t._id);

      const bookings = await Booking.find({ tripId: { $in: tripIds } })
        .populate("tripId")
        .populate("userId");

      return res.json(bookings);
    }

    if (role === "user") {
      if (!userId)
        return res.status(400).json({ message: "Thiếu userId" });

      const bookings = await Booking.find({ userId: String(userId) })
        .populate("tripId")
        .populate("userId");

      return res.json(bookings);
    }

    return res.status(400).json({ message: "Role không hợp lệ" });
  } catch (err) {
    console.error("❌ Lỗi khi lấy vé theo role:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

/**
 * ===================================================
 * 🧩 10. Cập nhật trạng thái thanh toán
 * ===================================================
 */
export const updatePaymentStatus = async (req, res) => {
  try {
    const { method } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking)
      return res.status(404).json({ message: "Không tìm thấy vé để cập nhật thanh toán" });

    if (method === "bank") {
      booking.status = "paid";
      booking.paymentMethod = "bank";
    } 
    else if (method === "cash") {
      booking.status = "completed";
      booking.paymentMethod = "cash";
    } 
    else {
      return res.status(400).json({ message: "Phương thức thanh toán không hợp lệ" });
    }

    await booking.save();

    res.json({ message: "✅ Thanh toán thành công!", booking });
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật thanh toán:", err);
    res.status(500).json({
      message: "Lỗi server khi cập nhật thanh toán",
      error: err.message,
    });
  }
};

/**
 * ===================================================
 * 🧩 11. Lấy vé theo ID
 * ===================================================
 */
export const getBookingById = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "ID không hợp lệ" });
  }

  try {
    const booking = await Booking.findById(req.params.id)
      .populate("tripId")
      .populate("userId");

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy vé." });
    }

    res.status(200).json(booking);
  } catch (error) {
    console.error("❌ Lỗi getBookingById:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
// ============================================================
// 🆕 LẤY DANH SÁCH VÉ THEO partnerId (DÙNG CHO DOANH THU PARTNER)
// ============================================================
// ============================================================
// 🆕 LẤY DANH SÁCH VÉ THEO partnerId (DÙNG CHO DOANH THU PARTNER)
// ============================================================
export const getBookingsByPartner = async (req, res) => {
  try {
    const { partnerId } = req.params;

    if (!partnerId) {
      return res.status(400).json({ message: "partnerId is required" });
    }

    // Lấy booking + thông tin chuyến
    const bookings = await Booking.find({
      partnerId,
      status: { $in: ["paid", "completed", "done"] },
    })
      .populate("tripId") // Lấy full thông tin chuyến
      .sort({ createdAt: -1 });

    // ⭐ Map lại dữ liệu để FE có đủ field
    const formatted = bookings.map((b) => ({
      _id: b._id,
      userId: b.userId,
      partnerId: b.partnerId,
      tripId: b.tripId?._id || null,

      hoTen: b.hoTen,
      sdt: b.sdt,
      soGhe: b.soGhe,
      totalPrice: b.totalPrice,
      discountAmount: b.discountAmount,
      finalTotal: b.finalTotal,

      diemDonChiTiet: b.diemDonChiTiet,
      status: b.status,
      paymentMethod: b.paymentMethod,
      voucherCode: b.voucherCode,

      // ⭐ Gán thông tin chuyến từ tripId vào booking
      tenChuyen: b.tenChuyen || b.tripId?.tenChuyen || "",
      ngayKhoiHanh: b.ngayKhoiHanh || b.tripId?.ngayKhoiHanh || "",
      gioKhoiHanh: b.gioKhoiHanh || b.tripId?.gioKhoiHanh || "",

      createdAt: b.createdAt,
    }));

    return res.status(200).json({
      success: true,
      bookings: formatted,
    });
  } catch (error) {
    console.error("❌ Lỗi getBookingsByPartner:", error);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
