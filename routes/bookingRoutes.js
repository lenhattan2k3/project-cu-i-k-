import express from "express";
import {
  bookTicket,
  getAllBookings,
  getBookingsByUser,
  getBookingsByPhone,
  getBookedSeats,
  updateBookingStatus,
  cancelBooking,
  updateBooking,
  getBookingsByRole,
  updatePaymentStatus,
  getBookingById,
  getBookingsByPartner,   // ✔ đúng tên hàm
} from "../controllers/bookingController.js";

const router = express.Router();

// ==========================
// 1️⃣ ROUTES CỤ THỂ → ĐẶT TRƯỚC
// ==========================

// Đặt vé mới
router.post("/book", bookTicket);

// Lấy vé theo userId
router.get("/user/:userId", getBookingsByUser);

// Lấy vé theo số điện thoại
router.get("/phone/:sdt", getBookingsByPhone);

// Lấy ghế đã đặt theo tripId
router.get("/trip/:tripId/seats", getBookedSeats);

// ⭐ Lấy vé theo partnerId (doanh thu Partner)
router.get("/partner/:partnerId", getBookingsByPartner);

// Lấy vé theo role (admin/partner/user)
router.get("/role/:role", getBookingsByRole);

// Cập nhật trạng thái vé
router.put("/status/:id", updateBookingStatus);

// Cập nhật trạng thái thanh toán
router.put("/payment/:id", updatePaymentStatus);

// Cập nhật thông tin vé
router.put("/:id", updateBooking);

// Hủy vé
router.delete("/:id", cancelBooking);

// ==========================
// 2️⃣ ROUTES DANH SÁCH / GET ALL
// ==========================
router.get("/", getAllBookings);

// ==========================
// 3️⃣ VÉ THEO ID — ĐẶT CUỐI
// ==========================
router.get("/:id", getBookingById);

export default router;
