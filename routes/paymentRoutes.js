import express from "express";
import { markAsPaid, getUserPayments, deleteAllPayments } from "../controllers/paymentController.js";

const router = express.Router();

// User thanh toán
router.patch("/mark-paid/:bookingId", markAsPaid);

// Xem danh sách thanh toán
router.get("/user/:userId", getUserPayments);

// Xóa toàn bộ thanh toán (admin)
router.delete("/all", deleteAllPayments);

export default router;
