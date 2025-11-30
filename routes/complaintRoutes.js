import express from "express";
import {
	sendComplaint,
	getComplaintsByReceiver,
	replyComplaint,
} from "../controllers/complaintController.js";

const router = express.Router();

router.post("/", sendComplaint);
router.get("/:receiverId", getComplaintsByReceiver);
router.post("/:id/reply", replyComplaint);

export default router;
