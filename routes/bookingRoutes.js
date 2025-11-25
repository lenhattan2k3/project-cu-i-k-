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
  getBookingsByPartner,
} from "../controllers/bookingController.js";

const router = express.Router();

// ==========================
// 1️⃣ ROUTES CỤ THỂ (ĐẶT TRƯỚC)
// ==========================

// POST routes
router.post("/book", bookTicket);

// GET routes với path cụ thể
router.get("/user/:userId", getBookingsByUser);
router.get("/phone/:sdt", getBookingsByPhone);
router.get("/trip/:tripId/seats", getBookedSeats);
router.get("/partner/:partnerId", getBookingsByPartner);
router.get("/role/:role", getBookingsByRole);

// PUT routes
router.put("/status/:id", updateBookingStatus);
router.put("/payment/:id", updatePaymentStatus);
router.put("/:id", updateBooking);  // ✅ Gọi function từ controller

// DELETE routes
router.delete("/:id", cancelBooking);

// ==========================
// 2️⃣ ROUTES GENERIC (ĐẶT CUỐI)
// ==========================
router.get("/", getAllBookings);          // ⚠️ GET all - CUỐI CÙNG
router.get("/:id", getBookingById);       // ⚠️ GET by ID - CUỐI CÙNG

export default router;
