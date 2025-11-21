import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import { io, onlineUsers } from "../server.js";

// ✅ Thanh toán vé
export const markAsPaid = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: "Không tìm thấy vé" });

    // Cập nhật trạng thái thanh toán
    booking.paymentStatus = "paid";
    await booking.save();

    // Lưu chi tiết thanh toán vào collection Payment
    const payment = new Payment({
      userId: booking.userId,
      bookingId: booking._id,
      amount: booking.totalAmount || 0, // đảm bảo Booking có totalAmount
      method: "bank",
      status: "success",
    });
    await payment.save();

    // 🔔 Gửi socket thông báo cho partner (nếu đang online)
    const partnerSocket = onlineUsers.get(booking.partnerId);
    if (partnerSocket) {
      io.to(partnerSocket).emit("paymentUpdate", {
        message: `Vé ${bookingId} đã được thanh toán`,
        bookingId,
      });
    }

    res.json({ success: true, message: "Thanh toán thành công", payment });
  } catch (err) {
    console.error("❌ Lỗi markAsPaid:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Xem danh sách thanh toán của user
export const getUserPayments = async (req, res) => {
  try {
    const { userId } = req.params;
    const payments = await Payment.find({ userId }).sort({ paidAt: -1 });
    res.json(payments);
  } catch (err) {
    console.error("❌ Lỗi getUserPayments:", err);
    res.status(500).json({ error: err.message });
  }
};
