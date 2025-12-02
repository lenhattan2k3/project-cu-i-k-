import Booking from "../models/Booking.js";
import Trip from "../models/tripModel.js";
import Review from "../models/Review.js";
import mongoose from "mongoose";
import FeeConfig from "../models/FeeConfig.js";
import FeeHistory from "../models/FeeHistory.js";
import { recordBookingLedgerImpact } from "./ledgerController.js";
import { ensureInvoiceForBooking } from "./invoiceController.js";

/**
 * ===================================================
 * 📝 ĐẶT VÉ / BOOK TICKET
 * ===================================================
 */
// ✅ Tạo helper function để lấy phí hiện tại
const getCurrentFeePercent = async () => {
  const feeRecord = await FeeHistory.findOne()
    .sort({ createdAt: -1 })  // ⚠️ Mới nhất theo createdAt
    .lean();
  return feeRecord?.newPercent || 0;
};

const isPaidStatus = (value) => {
  if (!value) return false;
  const normalized = String(value).toLowerCase();
  return normalized === "paid" || normalized === "completed" || normalized === "done";
};

export const bookTicket = async (req, res) => {
  try {
    const { userId, tripId, hoTen, sdt, soGhe, totalPrice, paymentMethod } = req.body;

    if (!userId || !tripId) {
      return res.status(400).json({ message: "❌ Thiếu thông tin người dùng hoặc chuyến!" });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: "Không tìm thấy chuyến đi" });

    // 🛑 Kiểm tra ghế đã bị đặt chưa
    const existingBookings = await Booking.find({ tripId });
    const bookedSeats = existingBookings.flatMap((b) => b.soGhe);
    const conflict = soGhe.some((seat) => bookedSeats.includes(seat));

    if (conflict) return res.status(400).json({ message: "Ghế đã được đặt" });

    // ✅ FIX: Dùng helper function
    const feePercent = await getCurrentFeePercent();
    const serviceFeeAmount = Math.round(totalPrice * (feePercent / 100));

    console.log("✅ bookTicket - Phí áp dụng:", { feePercent, serviceFeeAmount });

    // Tạo booking
    const newBooking = new Booking({
      userId: String(userId),
      tripId,
      hoTen,
      sdt,
      soGhe,
      partnerId: trip.partnerId,
      totalPrice,
      finalTotal: totalPrice,
      feePercent,
      feeApplied: feePercent,
      serviceFeeAmount,
      feeAppliedAt: new Date(),
      paymentMethod: paymentMethod || "cash",
      status: paymentMethod === "cash" ? "paid" : "pending",
      // Snapshot trip info
      tenChuyen: trip.tenChuyen,
      ngayKhoiHanh: trip.ngayKhoiHanh,
      gioKhoiHanh: trip.gioKhoiHanh,
      maTai: trip.maTai || "",
      bienSo: trip.bienSo || "",
    });

    await newBooking.save();

    if (newBooking.status === "paid") {
      await recordBookingLedgerImpact({
        partnerId: newBooking.partnerId,
        bookingId: String(newBooking._id),
        grossAmount: newBooking.finalTotal ?? newBooking.totalPrice ?? 0,
        serviceFeeAmount: newBooking.serviceFeeAmount ?? 0,
        discountAmount: newBooking.discountAmount ?? 0,
        occurredAt: newBooking.createdAt ?? new Date(),
      });

      try {
        await ensureInvoiceForBooking(newBooking);
      } catch (invoiceErr) {
        console.error("Failed to create invoice after booking", invoiceErr);
      }
    }

    return res.status(201).json({
      success: true,
      message: "✅ Đặt vé thành công!",
      booking: newBooking
    });

  } catch (err) {
    console.error("❌ bookTicket error:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: err.message
    });
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
      diemDonChiTiet,
      isFoodService
    } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Không tìm thấy vé" });
    }

    const wasPreviouslyPaid = isPaidStatus(booking.status);

    const updateData = { status };

    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    updateData.voucherCode = voucherCode ?? null;
    updateData.discountAmount = discountAmount ?? 0;
    updateData.finalTotal = finalTotal ?? booking.totalPrice;
    updateData.diemDonChiTiet = diemDonChiTiet?.trim() || null;
    if (typeof isFoodService === 'boolean') updateData.isFoodService = isFoodService;

    // ✅ FIX: Khi duyệt (status = "paid"), tính & lưu phí nếu chưa có
    if (isPaidStatus(status) && !booking.feePercent) {
      const feePercent = await getCurrentFeePercent();  // ✅ Dùng helper
      const price = finalTotal || booking.totalPrice || 0;
      const serviceFeeAmount = Math.round(price * (feePercent / 100));

      updateData.feePercent = feePercent;
      updateData.feeApplied = feePercent;
      updateData.serviceFeeAmount = serviceFeeAmount;
      updateData.feeAppliedAt = new Date();

      console.log("✅ Approving booking with fee:", {
        bookingId: req.params.id,
        feePercent,
        serviceFeeAmount,
        totalPrice: price,
      });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate("tripId").populate("userId");

    if (isPaidStatus(status) && !wasPreviouslyPaid && updatedBooking) {
      await recordBookingLedgerImpact({
        partnerId: updatedBooking.partnerId,
        bookingId: String(updatedBooking._id),
        grossAmount: updatedBooking.finalTotal ?? updatedBooking.totalPrice ?? 0,
        serviceFeeAmount: updatedBooking.serviceFeeAmount ?? 0,
        discountAmount: updatedBooking.discountAmount ?? 0,
        occurredAt: updatedBooking.updatedAt ?? new Date(),
      });

      try {
        await ensureInvoiceForBooking(updatedBooking);
      } catch (invoiceErr) {
        console.error("Failed to ensure invoice for booking", invoiceErr);
      }
    }

    console.log("✅ Updated booking:", {
      _id: updatedBooking._id,
      status: updatedBooking.status,
      feePercent: updatedBooking.feePercent,
      serviceFeeAmount: updatedBooking.serviceFeeAmount,
    });

    res.json({ 
      success: true,
      message: "✅ Cập nhật trạng thái thành công", 
      booking: updatedBooking 
    });
  } catch (err) {
    console.error("❌ Lỗi updateBookingStatus:", err);
    res.status(500).json({ 
      success: false,
      message: "Lỗi khi cập nhật trạng thái vé", 
      error: err.message 
    });
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
    const { status, finalTotal } = req.body;
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    const wasPreviouslyPaid = isPaidStatus(booking.status);
    let becamePaid = false;

    if (typeof finalTotal === "number") {
      booking.finalTotal = finalTotal;
    }

    if (status) {
      if (isPaidStatus(status) && !wasPreviouslyPaid) {
        const feeRecord = await FeeHistory.findOne().sort({ createdAt: -1 }).lean();
        const feePercent = feeRecord?.newPercent || 0;
        const price = booking.finalTotal ?? booking.totalPrice ?? 0;
        const serviceFeeAmount = Math.round(price * (feePercent / 100));

        booking.feePercent = feePercent;
        booking.feeApplied = feePercent;
        booking.serviceFeeAmount = serviceFeeAmount;
        booking.feeAppliedAt = new Date();
        becamePaid = true;

        console.log("✅ [First time paid/completed] Fee calculated:", {
          bookingId,
          feePercent,
          serviceFeeAmount,
        });
      }

      booking.status = status;
    }

    await booking.save();

    if (becamePaid) {
      await recordBookingLedgerImpact({
        partnerId: booking.partnerId,
        bookingId: String(booking._id),
        grossAmount: booking.finalTotal ?? booking.totalPrice ?? 0,
        serviceFeeAmount: booking.serviceFeeAmount ?? 0,
        discountAmount: booking.discountAmount ?? 0,
        occurredAt: booking.updatedAt ?? new Date(),
      });

      try {
        await ensureInvoiceForBooking(booking);
      } catch (invoiceErr) {
        console.error("Failed to ensure invoice when booking updated", invoiceErr);
      }
    }

    res.json({ success: true, message: "✅ Cập nhật vé thành công!", booking });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ success: false, error: err.message });
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

    const wasPreviouslyPaid = isPaidStatus(booking.status);

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

    if (isPaidStatus(booking.status) && !wasPreviouslyPaid) {
      await recordBookingLedgerImpact({
        partnerId: booking.partnerId,
        bookingId: String(booking._id),
        grossAmount: booking.finalTotal ?? booking.totalPrice ?? 0,
        serviceFeeAmount: booking.serviceFeeAmount ?? 0,
        discountAmount: booking.discountAmount ?? 0,
        occurredAt: booking.updatedAt ?? new Date(),
      });
    }

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

/**
 * ===================================================
 * 🆕 LẤY DANH SÁCH VÉ THEO partnerId
 * ===================================================
 */
export const getBookingsByPartner = async (req, res) => {
  try {
    const { partnerId } = req.params;

    if (!partnerId) {
      return res.status(400).json({ success: false, message: "partnerId is required" });
    }

    // Lấy tất cả booking
    const bookings = await Booking.find({ partnerId })
      .populate("tripId")
      .sort({ createdAt: -1 });

    if (!bookings || bookings.length === 0) {
      return res.status(200).json({
        success: true,
        bookings: [],
        message: "Không có booking nào"
      });
    }

    // ✅ Map dữ liệu - ĐẢM BẢO RETURN ĐÚNG FIELD
    const formatted = bookings.map((b) => {
      const price = b.finalTotal || b.totalPrice || 0;
      // ✅ LẤY feePercent - ưu tiên feePercent, nếu không có lấy feeApplied
      const feePercent = b.feePercent !== undefined ? b.feePercent : (b.feeApplied || 0);
      const serviceFee = b.serviceFeeAmount || (price * (feePercent / 100));

      return {
        _id: b._id,
        userId: b.userId,
        partnerId: b.partnerId,
        tripId: b.tripId?._id || null,

        hoTen: b.hoTen,
        sdt: b.sdt,
        soGhe: b.soGhe || [],

        totalPrice: price,
        discountAmount: b.discountAmount || 0,
        finalTotal: b.finalTotal || b.totalPrice || 0,

        diemDonChiTiet: b.diemDonChiTiet,
        status: b.status,
        paymentMethod: b.paymentMethod,
        voucherCode: b.voucherCode,
        isFoodService: b.isFoodService,

        // ✅ QUAN TRỌNG: Đảm bảo return các field phí này
        feePercent: feePercent,
        feeApplied: feePercent,
        serviceFeeAmount: serviceFee,
        feeAppliedAt: b.feeAppliedAt,

        tenChuyen: b.tenChuyen || b.tripId?.tenChuyen || "N/A",
        ngayKhoiHanh: b.ngayKhoiHanh || b.tripId?.ngayKhoiHanh || "",
        gioKhoiHanh: b.gioKhoiHanh || b.tripId?.gioKhoiHanh || "",
        maTai: b.maTai || b.tripId?.maTai || "",
        bienSo: b.bienSo || b.tripId?.bienSo || "",

        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      };
    });

    console.log("✅ getBookingsByPartner response:", {
      count: formatted.length,
      firstBooking: formatted[0],
    });

    return res.status(200).json({
      success: true,
      count: formatted.length,
      bookings: formatted,
    });

  } catch (error) {
    console.error("❌ Lỗi getBookingsByPartner:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message
    });
  }
};
