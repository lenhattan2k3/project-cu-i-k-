import Booking from "../models/Booking.js";
import Trip from "../models/tripModel.js";

// ✅ Đặt vé
export const bookTicket = async (req, res) => {
  try {
    const { userId, tripId, hoTen, sdt, soGhe, totalPrice } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!userId || !tripId) {
      return res.status(400).json({ message: "❌ Thiếu thông tin người dùng hoặc chuyến!" });
    }

    // Kiểm tra chuyến đi có tồn tại không
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: "Không tìm thấy chuyến đi" });
    }

    // Kiểm tra ghế đã đặt chưa
    const existingBookings = await Booking.find({ tripId });
    const bookedSeats = existingBookings.flatMap(b => b.soGhe);
    const conflict = soGhe.some(seat => bookedSeats.includes(seat));

    if (conflict) {
      return res.status(400).json({ message: "Ghế đã được đặt, vui lòng chọn ghế khác" });
    }

    // ✅ Tạo vé mới
    const newBooking = new Booking({
      userId: String(userId), // 🔹 luôn lưu dưới dạng string
      tripId,
      hoTen,
      sdt,
      soGhe,
      totalPrice,
    });

    await newBooking.save();

    return res.status(201).json({
      message: "✅ Đặt vé thành công!",
      booking: newBooking,
    });
  } catch (err) {
    console.error("❌ Lỗi khi đặt vé:", err);
    return res.status(500).json({ message: "Lỗi server khi đặt vé", error: err.message });
  }
};

// ✅ Lấy tất cả vé
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate("tripId");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách vé", error: err.message });
  }
};

// ✅ Lấy vé theo userId
export const getBookingsByUser = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: String(req.params.userId) }).populate("tripId");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy vé theo user", error: err.message });
  }
};

// ✅ Lấy ghế đã đặt của 1 chuyến đi
export const getBookedSeats = async (req, res) => {
  try {
    const bookings = await Booking.find({ tripId: req.params.tripId });
    const bookedSeats = bookings.flatMap(b => b.soGhe);
    res.json({ bookedSeats });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách ghế đã đặt", error: err.message });
  }
};

// ✅ Lấy vé theo số điện thoại
export const getBookingsByPhone = async (req, res) => {
  try {
    const bookings = await Booking.find({ sdt: req.params.sdt }).populate("tripId");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy vé theo số điện thoại", error: err.message });
  }
};

// ✅ Cập nhật trạng thái vé
export const updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy vé" });
    }
    res.json({ message: "Cập nhật trạng thái thành công", booking });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi cập nhật trạng thái vé", error: err.message });
  }
};

// ✅ Hủy vé
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy vé để hủy!" });
    }
    res.json({ message: "Đã hủy vé thành công!", booking });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi hủy vé", error: err.message });
  }
};
