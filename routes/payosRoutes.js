import express from "express";
import { createPayment, payosWebhook } from "../controllers/payosController.js";

const router = express.Router();

router.post("/create-payment", createPayment);
router.post("/webhook", payosWebhook);

export default router;
