import express from "express";
import multer from "multer";
import Trip from "../models/tripModel.js";

const router = express.Router();

// ⚙️ Cấu hình Multer để lưu ảnh
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname),
});
const upload = multer({ storage });

/* ============================
 🟢 1. Thêm chuyến xe mới
============================ */
router.post("/", upload.single("hinhAnh"), async (req, res) => {
  try {
    const { tenChuyen, tu, den, ngayKhoiHanh, gioKhoiHanh, giaVe, soLuongGhe, nhaXe, trangThai } = req.body;
    const hinhAnh = req.file ? `/uploads/${req.file.filename}` : null;

    const trip = new Trip({
      tenChuyen,
      tu,
      den,
      ngayKhoiHanh,
      gioKhoiHanh,
      giaVe,
      soLuongGhe,
      nhaXe,
      trangThai,
      hinhAnh,
    });

    await trip.save();
    res.status(201).json(trip);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi thêm chuyến xe", error });
  }
});

/* ============================
 🟢 2. Lấy tất cả chuyến xe
============================ */
router.get("/", async (req, res) => {
  try {
    const trips = await Trip.find();
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy chuyến xe", error });
  }
});

/* ============================
 🟢 3. Lấy 1 chuyến xe theo ID
============================ */
router.get("/:id", async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: "Không tìm thấy chuyến xe" });
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy chi tiết chuyến xe", error });
  }
});

/* ============================
 🟡 4. Cập nhật chuyến xe
============================ */
router.put("/:id", upload.single("hinhAnh"), async (req, res) => {
  try {
    const { tenChuyen, tu, den, ngayKhoiHanh, gioKhoiHanh, giaVe, soLuongGhe, nhaXe, trangThai } = req.body;
    const hinhAnh = req.file ? `/uploads/${req.file.filename}` : req.body.hinhAnh;

    const updatedTrip = await Trip.findByIdAndUpdate(
      req.params.id,
      { tenChuyen, tu, den, ngayKhoiHanh, gioKhoiHanh, giaVe, soLuongGhe, nhaXe, trangThai, hinhAnh },
      { new: true }
    );

    if (!updatedTrip) return res.status(404).json({ message: "Không tìm thấy chuyến xe để cập nhật" });
    res.json(updatedTrip);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật chuyến xe", error });
  }
});

/* ============================
 🔴 5. Xóa chuyến xe
============================ */
router.delete("/:id", async (req, res) => {
  try {
    const deletedTrip = await Trip.findByIdAndDelete(req.params.id);
    if (!deletedTrip) return res.status(404).json({ message: "Không tìm thấy chuyến xe để xóa" });
    res.json({ message: "Xóa chuyến xe thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa chuyến xe", error });
  }
});

export default router;
