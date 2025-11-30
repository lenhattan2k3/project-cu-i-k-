import Trip from "../models/tripModel.js";
import Booking from "../models/Booking.js";

// 🔍 Lấy tất cả chuyến xe
export const getAllTrips = async (req, res) => {
  try {
    const { partnerId } = req.query;
    const query = partnerId ? { partnerId } : {};
    
    // Use lean() to get plain JavaScript objects
    let trips = await Trip.find(query).sort({ createdAt: -1 }).lean();

    // Fetch all bookings for these trips
    const tripIds = trips.map(t => t._id);
    const bookings = await Booking.find({ tripId: { $in: tripIds } }).select('tripId soGhe');

    // Calculate booked seats for each trip
    const bookingMap = {};
    bookings.forEach(b => {
      if (!bookingMap[b.tripId]) bookingMap[b.tripId] = new Set();
      if (Array.isArray(b.soGhe)) {
        b.soGhe.forEach(seat => bookingMap[b.tripId].add(seat));
      }
    });

    // Add availableSeats to each trip
    trips = trips.map(trip => {
      const bookedCount = bookingMap[trip._id] ? bookingMap[trip._id].size : 0;
      const totalSeats = trip.tongSoGhe || trip.soLuongGhe || 0;
      return {
        ...trip,
        bookedSeatCount: bookedCount,
        availableSeats: Math.max(0, totalSeats - bookedCount)
      };
    });

    res.status(200).json(trips);
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách chuyến xe:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách chuyến xe", error });
  }
};

// 🆕 Tạo chuyến xe mới
// 🆕 Tạo chuyến xe mới
export const createTrip = async (req, res) => {
  try {
    const {
      tenChuyen,
      maTai,
      loaiXe,
      hangXe,
      mauSac,
      tu,
      den,
      ngayKhoiHanh,
      gioKhoiHanh,
      giaVe,
      soLuongGhe,
      nhaXe,
      partnerId,   // Firebase UID
      trangThai,
      hinhAnh,
    } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!tenChuyen || !tu || !den || !giaVe || !soLuongGhe || !nhaXe) {
      return res.status(400).json({ message: "Vui lòng nhập đủ thông tin bắt buộc" });
    }

    // ❗ BẮT BUỘC: partnerId phải có
    if (!partnerId || partnerId.trim() === "") {
      return res.status(400).json({
        message: "Thiếu partnerId (Firebase UID của nhà xe)!",
      });
    }

    const newTrip = new Trip({
      tenChuyen,
      maTai,
      loaiXe,
      hangXe,
      mauSac,
      tu,
      den,
      ngayKhoiHanh,
      gioKhoiHanh,
      giaVe,
      soLuongGhe,
      nhaXe,
      partnerId: String(partnerId), // đảm bảo luôn string
      trangThai,
      hinhAnh,
    });

    await newTrip.save();
    res.status(201).json(newTrip);
  } catch (error) {
    console.error("❌ Lỗi khi tạo chuyến xe:", error);
    res.status(500).json({ message: "Lỗi khi tạo chuyến xe", error });
  }
};

// ✏️ Cập nhật chuyến xe
export const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTrip = await Trip.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedTrip) return res.status(404).json({ message: "Không tìm thấy chuyến xe" });
    res.status(200).json(updatedTrip);
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật chuyến xe:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật chuyến xe", error });
  }
};

// ❌ Xóa chuyến xe
export const deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findByIdAndDelete(req.params.id);
    if (!trip) return res.status(404).json({ message: "Không tìm thấy chuyến xe" });
    res.json({ message: "Đã xóa chuyến xe thành công" });
  } catch (error) {
    console.error("❌ Lỗi khi xóa chuyến xe:", error);
    res.status(500).json({ message: "Lỗi khi xóa chuyến xe", error });
  }
};

// 🔍 Lấy chuyến theo ID
export const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: "Không tìm thấy chuyến xe" });
    res.status(200).json(trip);
  } catch (error) {
    console.error("❌ Lỗi khi lấy chi tiết chuyến xe:", error);
    res.status(500).json({ message: "Lỗi khi lấy chi tiết chuyến xe", error });
  }
};
