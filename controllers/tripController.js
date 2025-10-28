const express = require("express");
const router = express.Router();
const multer = require("multer");
const Trip = require("../models/tripModel");

// ========================
// ⚙️ Cấu hình Multer (upload ảnh)
// ========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // thư mục lưu ảnh
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ storage });

// ========================
// 🟢 1️⃣ Lấy danh sách chuyến xe
// ========================
router.get("/", async (req, res) => {
  try {
    const trips = await Trip.find();
    res.json(trips);
  } catch (error) {
    console.error("❌ Error getting trips:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách chuyến xe" });
  }
});

// ========================
// 🟢 2️⃣ Xem chi tiết 1 chuyến xe
// ========================
router.get("/:id", async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: "Không tìm thấy chuyến xe" });
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy chi tiết chuyến xe" });
  }
});

// ========================
// 🟢 3️⃣ Thêm chuyến xe mới (có upload ảnh)
// ========================
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { tenChuyen, tu, den, ngayKhoiHanh, gioKhoiHanh, giaVe, soLuongGhe, nhaXe } = req.body;
    const imagePath = req.file ? req.file.path : null;

    const newTrip = new Trip({
      tenChuyen,
      tu,
      den,
      ngayKhoiHanh,
      gioKhoiHanh,
      giaVe,
      soLuongGhe,
      nhaXe,
      image: imagePath,
      trangThai: "Hoạt động",
    });

    await newTrip.save();
    res.status(201).json(newTrip);
  } catch (error) {
    console.error("❌ Error creating trip:", error);
    res.status(500).json({ message: "Lỗi khi tạo chuyến xe" });
  }
});

// ========================
// 🟢 4️⃣ Cập nhật chuyến xe (cho phép đổi ảnh mới)
// ========================
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { tenChuyen, tu, den, ngayKhoiHanh, gioKhoiHanh, giaVe, soLuongGhe, nhaXe, trangThai } = req.body;

    const updateData = {
      tenChuyen,
      tu,
      den,
      ngayKhoiHanh,
      gioKhoiHanh,
      giaVe,
      soLuongGhe,
      nhaXe,
      trangThai,
    };

    // Nếu có ảnh mới thì cập nhật đường dẫn ảnh
    if (req.file) updateData.image = req.file.path;

    const updatedTrip = await Trip.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!updatedTrip)
      return res.status(404).json({ message: "Không tìm thấy chuyến xe" });

    res.json(updatedTrip);
  } catch (error) {
    console.error("❌ Error updating trip:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật chuyến xe" });
  }
});

// ========================
// 🟢 5️⃣ Xóa chuyến xe
// ========================
router.delete("/:id", async (req, res) => {
  try {
    const deletedTrip = await Trip.findByIdAndDelete(req.params.id);
    if (!deletedTrip)
      return res.status(404).json({ message: "Không tìm thấy chuyến xe" });
    res.json({ message: "Đã xóa chuyến xe thành công" });
  } catch (error) {
    console.error("❌ Error deleting trip:", error);
    res.status(500).json({ message: "Lỗi khi xóa chuyến xe" });
  }
});

module.exports = router;
