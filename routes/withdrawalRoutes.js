import express from "express";
import {
  getAdminDebtReport,
  getWithdrawableAmount,
  getAvailableFallback,
  listWithdrawals,
  createWithdrawal,
  updateWithdrawal,
  deleteWithdrawal,
  confirmWithdrawal,
} from "../controllers/withdrawalController.js";

const router = express.Router();

router.get("/report/debts", getAdminDebtReport);
router.get("/amount/:partnerId", getWithdrawableAmount);
router.get("/available/:partnerId", getAvailableFallback);
router.get("/", listWithdrawals);
router.post("/", createWithdrawal);
router.patch("/:id", updateWithdrawal);
router.delete("/:id", deleteWithdrawal);
router.post("/confirm", confirmWithdrawal);

export default router;
