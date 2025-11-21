import express from "express";
import { linkBank, getBankByUser, unlinkBank } from "../controllers/bankController.js";

const router = express.Router();

router.post("/link", linkBank);
router.get("/:userId", getBankByUser);
router.patch("/unlink/:userId", unlinkBank);

export default router;
