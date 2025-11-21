// 📁 controllers/paymentMethodController.js
// (Code này của bạn đã ĐÚNG)

import Booking from '../models/Booking.js'; // ✅ Đảm bảo import Booking

// Lấy trạng thái
export const getPaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy booking' });
    }
    res.json({
      success: true,
      data: {
        _id: booking._id,
        bookingId: booking._id,
        status: booking.status,
        paymentMethod: booking.paymentMethod,
        updatedAt: booking.updatedAt
      }
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật trạng thái
export const updatePaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, paymentMethod } = req.body;

    const validStatuses = ['pending', 'paid', 'cancelled', 'refunded'];
    const validMethods = ['card', 'bank', 'cash', null];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }
    // Sửa lỗi validation nhỏ:
    if (paymentMethod && !validMethods.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Phương thức thanh toán không hợp lệ' });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        $set: {
          status: status,
          paymentMethod: paymentMethod,
          updatedAt: new Date()
        }
      },
      { new: true } 
    );

    if (!updatedBooking) {
      return res.status(404).json({ success: false, message: "Không tìm thấy booking để cập nhật" });
    }

    res.json({
      success: true,
      message: 'Cập nhật trạng thái thanh toán thành công',
      bookingStatus: updatedBooking 
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};