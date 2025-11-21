import express from "express";
import { markAsPaid, getUserPayments } from "../controllers/paymentController.js";

const router = express.Router();

// User thanh toán
router.patch("/mark-paid/:bookingId", markAsPaid);

// Xem danh sách thanh toán
router.get("/user/:userId", getUserPayments);

export default router;
