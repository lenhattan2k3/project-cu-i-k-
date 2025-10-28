// 📁 routes/bookingRoutes.js
import express from "express";
import {
  bookTicket,
  getAllBookings,
  getBookingsByUser,
  getBookingsByPhone,
  getBookedSeats,
  updateBookingStatus,
  cancelBooking,
} from "../controllers/bookingController.js";

const router = express.Router();

router.post("/book", bookTicket);
router.get("/", getAllBookings);
router.get("/user/:userId", getBookingsByUser);
router.get("/phone/:sdt", getBookingsByPhone);
router.get("/trip/:tripId/seats", getBookedSeats);
router.put("/status/:id", updateBookingStatus);
router.delete("/:id", cancelBooking);

export default router;
