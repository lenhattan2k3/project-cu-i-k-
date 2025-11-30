import express from "express";
import { getInvoicesByUser, getInvoiceDetail } from "../controllers/invoiceController.js";

const router = express.Router();

router.get("/user/:userId", getInvoicesByUser);
router.get("/:id", getInvoiceDetail);

export default router;
