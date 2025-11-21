import express from "express";
import { sendComplaint, getComplaintsByReceiver } from "../controllers/complaintController.js";

const router = express.Router();

router.post("/", sendComplaint);
router.get("/:receiverId", getComplaintsByReceiver);

export default router;
