import FeeHistory from "../models/FeeHistory.js";
import Booking from "../models/Booking.js";

export const setFeeConfig = async (req, res) => {
  try {
    const { newPercent, adminId, appliedAt } = req.body;

    console.log("📥 [setFeeConfig] Request:", { newPercent, adminId, appliedAt });

    if (newPercent === undefined || newPercent < 0 || newPercent > 100) {
      return res.status(400).json({
        success: false,
        message: "Phí phải từ 0-100%"
      });
    }

    const lastFee = await FeeHistory.findOne().sort({ appliedAt: -1 });
    const oldPercent = lastFee?.newPercent || 0;

    const feeRecord = new FeeHistory({
      oldPercent,
      newPercent,
      appliedAt: appliedAt ? new Date(appliedAt) : new Date(),
      updatedBy: adminId || "admin"
    });

    await feeRecord.save();

    console.log("✅ [setFeeConfig] Fee saved:", feeRecord);

    return res.json({
      success: true,
      message: "Cập nhật phí thành công!",
      fee: {
        percent: newPercent,
        appliedAt: feeRecord.appliedAt
      }
    });

  } catch (err) {
    console.error("❌ [setFeeConfig] Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: err.message
    });
  }
};

export const getFeeConfig = async (req, res) => {
  try {
    const latestFee = await FeeHistory.findOne()
      .sort({ createdAt: -1 })  // ✅ Sort by createdAt (lúc insert)
      .lean();

    const currentPercent = latestFee?.newPercent || 0;

    console.log("✅ [getFeeConfig] Current fee:", currentPercent);

    return res.json({
      success: true,
      fee: {
        percent: currentPercent,
        appliedAt: latestFee?.appliedAt || null
      }
    });

  } catch (err) {
    console.error("❌ [getFeeConfig] Error:", err.message);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

export const getFeeHistory = async (req, res) => {
  try {
    const history = await FeeHistory.find()
      .sort({ appliedAt: -1 })
      .limit(50);

    console.log("✅ [getFeeHistory] Found records:", history.length);

    return res.json({
      success: true,
      history
    });

  } catch (err) {
    console.error("❌ [getFeeHistory] Error:", err.message);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// ✅ QUAN TRỌNG: Lấy booking theo % phí
export const getBookingsByFeePercent = async (req, res) => {
  try {
    const { percent } = req.params;
    const feePercent = parseFloat(percent);

    console.log("📥 [getBookingsByFeePercent] Request với percent:", percent);

    if (isNaN(feePercent)) {
      return res.status(400).json({
        success: false,
        message: "Phí không hợp lệ"
      });
    }

    // ✅ Tìm booking có feePercent = percent này
    const bookings = await Booking.find({ feePercent })
      .populate("tripId", "tenChuyen ngayKhoiHanh gioKhoiHanh")
      .sort({ createdAt: -1 })
      .lean();  // ← Dùng .lean() để tăng tốc độ

    console.log(`✅ [getBookingsByFeePercent] Found ${bookings.length} bookings with fee ${feePercent}%`);

    // ✅ Format dữ liệu trả về
    const formattedBookings = bookings.map(b => ({
      _id: b._id?.toString() || "",
      userId: b.userId,
      hoTen: b.hoTen,
      name: b.hoTen,
      sdt: b.sdt,
      soGhe: b.soGhe || [],
      totalPrice: b.totalPrice || 0,
      finalTotal: b.finalTotal || b.totalPrice || 0,
      serviceFeeAmount: b.serviceFeeAmount || 0,
      feePercent: b.feePercent || 0,
      status: b.status || "pending",
      paymentMethod: b.paymentMethod || "unknown",
      tenChuyen: b.tripId?.tenChuyen || "N/A",
      ngayKhoiHanh: b.tripId?.ngayKhoiHanh || "N/A",
      gioKhoiHanh: b.tripId?.gioKhoiHanh || "N/A",
      feeAppliedAt: b.feeAppliedAt || b.createdAt,
      createdAt: b.createdAt
    }));

    return res.json({
      success: true,
      percent: feePercent,
      bookings: formattedBookings,
      total: formattedBookings.length
    });

  } catch (err) {
    console.error("❌ [getBookingsByFeePercent] Error:", err.message);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
