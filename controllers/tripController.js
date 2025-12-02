import Trip from "../models/tripModel.js";
import Booking from "../models/Booking.js";
import NhaXe from "../models/NhaXe.js";

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
const normalizeCarrierName = (value = "") => value.trim();

export const createTrip = async (req, res) => {
  try {
    const {
      maTai,
      bienSo,
      tienIch,
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
      partnerId, // Firebase UID
      trangThai,
      hinhAnh,
    } = req.body;

    if (!tu || !den || !giaVe || !soLuongGhe) {
      return res.status(400).json({ message: "Vui lòng nhập đủ thông tin bắt buộc" });
    }

    const normalizedPartnerId = String(partnerId || "").trim();
    if (!normalizedPartnerId) {
      return res.status(400).json({
        message: "Thiếu partnerId (Firebase UID của nhà xe)!",
      });
    }

    const requestedName = normalizeCarrierName(nhaXe);
    let carrierRecord = await NhaXe.findOne({ partnerId: normalizedPartnerId });

    if (!carrierRecord) {
      if (!requestedName) {
        return res.status(400).json({
          message: "Chưa cấu hình tên nhà xe cho tài khoản này. Vui lòng cung cấp tên hợp lệ lần đầu tiên hoặc cập nhật hồ sơ đối tác.",
        });
      }
      carrierRecord = await NhaXe.create({
        partnerId: normalizedPartnerId,
        name: requestedName,
        slug: requestedName.toLowerCase().replace(/\s+/g, "-"),
      });
    } else if (requestedName && requestedName !== carrierRecord.name) {
      return res.status(400).json({
        message: `Tên nhà xe cho tài khoản này đã được cố định là "${carrierRecord.name}". Không thể tự ý thay đổi khi tạo chuyến.`,
      });
    }

    const resolvedCarrierName = carrierRecord?.name || requestedName;

    const tripName = carrierRecord?.name;
    if (!tripName) {
      return res.status(400).json({
        message: "Không xác định được tên chuyến cho tài khoản này. Vui lòng liên hệ quản trị viên.",
      });
    }

    const newTrip = new Trip({
      tenChuyen: tripName,
      maTai,
      bienSo,
      tienIch,
      loaiXe,
      hangXe,
      mauSac,
      tu,
      den,
      ngayKhoiHanh,
      gioKhoiHanh,
      giaVe,
      soLuongGhe,
      nhaXe: resolvedCarrierName,
      partnerId: normalizedPartnerId,
      trangThai,
      hinhAnh,
    });

    await newTrip.save();
    res.status(201).json(newTrip);
  } catch (error) {
    console.error("❌ Lỗi khi tạo chuyến xe:", error);
    res.status(500).json({ message: "Lỗi khi tạo chuyến xe", error: error.message });
  }
};

// ✏️ Cập nhật chuyến xe
export const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const existingTrip = await Trip.findById(id);
    if (!existingTrip) {
      return res.status(404).json({ message: "Không tìm thấy chuyến xe" });
    }

    if (req.body.partnerId && req.body.partnerId !== existingTrip.partnerId) {
      return res.status(400).json({ message: "Không thể thay đổi chủ sở hữu của chuyến" });
    }

    if (req.body.nhaXe && normalizeCarrierName(req.body.nhaXe) !== existingTrip.nhaXe) {
      return res.status(400).json({ message: "Tên nhà xe đã bị khóa theo tài khoản, không thể chỉnh sửa tại đây" });
    }

    if (req.body.tenChuyen && normalizeCarrierName(req.body.tenChuyen) !== existingTrip.tenChuyen) {
      return res.status(400).json({ message: "Tên chuyến được gắn cố định với tài khoản, không thể chỉnh sửa" });
    }

    const updateData = {
      ...req.body,
      tenChuyen: existingTrip.tenChuyen,
      nhaXe: existingTrip.nhaXe,
      partnerId: existingTrip.partnerId,
    };

    const updatedTrip = await Trip.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

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
