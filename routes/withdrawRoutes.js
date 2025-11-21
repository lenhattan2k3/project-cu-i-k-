// routes/withdrawRoutes.js
import express from "express";
import {
  createWithdraw,
  getWithdrawHistory,
} from "../controllers/withdrawController.js";

const router = express.Router();

router.post("/create", createWithdraw);
router.get("/history/:partnerId", getWithdrawHistory);

export default router;
