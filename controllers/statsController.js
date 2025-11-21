// 📁 controllers/statsController.js
import Booking from "../models/Booking.js";

/* ============================================================
   1) DOANH THU TỔNG THEO PARTNER
============================================================ */
export const getPartnerTotalRevenue = async (req, res) => {
  try {
    const partnerId = req.params.partnerId;

    const bookings = await Booking.find({
      partnerId,
      status: { $in: ["paid", "completed", "done"] },
      paymentMethod: { $in: ["bank", "cash"] }
    });

    const totalRevenue = bookings.reduce((sum, b) => {
      return sum + (Number(b.finalTotal || b.totalPrice) || 0);
    }, 0);

    res.json({
      success: true,
      totalRevenue,
      totalBookings: bookings.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi lấy doanh thu tổng (partner)",
      error: error.message,
    });
  }
};

/* ============================================================
   2) DOANH THU THEO THÁNG (PARTNER)
============================================================ */
export const getPartnerMonthlyRevenue = async (req, res) => {
  try {
    const partnerId = req.params.partnerId;

    const bookings = await Booking.find({
      partnerId,
      status: { $in: ["paid", "completed", "done"] },
    });

    const months = Array(12).fill(0);

    bookings.forEach((b) => {
      const month = new Date(b.createdAt).getMonth();
      months[month] += Number(b.finalTotal || b.totalPrice) || 0;
    });

    res.json({
      success: true,
      monthlyRevenue: months,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi doanh thu tháng (partner)",
      error: error.message,
    });
  }
};

/* ============================================================
   3) DOANH THU THEO NGÀY (PARTNER)
============================================================ */
export const getPartnerDailyRevenue = async (req, res) => {
  try {
    const partnerId = req.params.partnerId;

    const bookings = await Booking.find({
      partnerId,
      status: { $in: ["paid", "completed", "done"] },
    });

    const daily = {};

    bookings.forEach((b) => {
      const day = new Date(b.createdAt).toISOString().split("T")[0];
      daily[day] = (daily[day] || 0) + (Number(b.finalTotal || b.totalPrice) || 0);
    });

    res.json({
      success: true,
      dailyRevenue: daily,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi doanh thu ngày (partner)",
      error: error.message,
    });
  }
};

/* ============================================================
   4) SỐ VÉ ĐÃ BÁN (PARTNER)
============================================================ */
export const getPartnerSoldTickets = async (req, res) => {
  try {
    const partnerId = req.params.partnerId;

    const bookings = await Booking.find({
      partnerId,
      status: { $in: ["paid", "completed", "done"] }
    });

    const totalTickets = bookings.reduce((sum, b) => {
      return sum + (b.soGhe?.length || 0);
    }, 0);

    res.json({
      success: true,
      totalTickets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi lấy vé đã bán (partner)",
      error: error.message,
    });
  }
};

/* ============================================================
   5) DASHBOARD TỔNG HỢP (PARTNER)
============================================================ */
export const getPartnerDashboard = async (req, res) => {
  const { partnerId } = req.params;

  try {
    // ví dụ query mongodb
    const bookings = await Booking.find({ partnerId, paymentStatus: "paid" });

    const totalRevenue = bookings.reduce((t, b) => t + b.totalPrice, 0);
    const totalTickets = bookings.length;

    return res.json({
      totalRevenue,
      totalTickets,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};
