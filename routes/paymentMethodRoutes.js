// 📁 routes/paymentMethodRoutes.js

import express from "express";
import { getPaymentStatus, updatePaymentStatus } from "../controllers/paymentMethodController.js";

const router = express.Router();

// Lấy trạng thái thanh toán
router.get("/:bookingId", getPaymentStatus);

// Cập nhật trạng thái thanh toán
// Dòng này sẽ xử lý: PUT http://localhost:5000/api/payment/Booking-ID-123
router.put("/:bookingId", updatePaymentStatus);

export default router;