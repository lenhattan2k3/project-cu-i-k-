import express from "express";
import { sendMessage, getMessagesByConversation } from "../controllers/messagesController.js";

const router = express.Router();

router.post("/", sendMessage);
router.get("/:id", getMessagesByConversation);

export default router;
