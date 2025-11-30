import express from "express";
import { createPayment, payosWebhook, confirmPaymentReturn } from "../controllers/payosController.js";

const router = express.Router();

router.post("/create-payment", createPayment);
router.post("/webhook", payosWebhook);
router.post("/confirm-return", confirmPaymentReturn);

export default router;
