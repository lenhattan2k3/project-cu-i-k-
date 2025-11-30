import express from "express";
import {
  listLedgers,
  getLedger,
  getLedgerActivity,
  applyBookingLedgerEndpoint,
  applyWithdrawalLedgerEndpoint,
  adjustLedger,
  resetLedger,
  rebuildLedger,
} from "../controllers/ledgerController.js";

const router = express.Router();

router.get("/ledger", listLedgers);
router.get("/ledger/:partnerId", getLedger);
router.get("/ledger/:partnerId/activity", getLedgerActivity);
router.post("/ledger/bookings", applyBookingLedgerEndpoint);
router.post("/ledger/withdrawals", applyWithdrawalLedgerEndpoint);
router.patch("/ledger/:partnerId/adjust", adjustLedger);
router.post("/ledger/:partnerId/reset", resetLedger);
router.post("/ledger/:partnerId/rebuild", rebuildLedger);
router.post("/ledger/rebuild", rebuildLedger);

export default router;
