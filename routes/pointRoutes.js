import express from "express";
import {
  getPointsByUser,
  addPoints,
  subtractPoints,
} from "../controllers/pointController.js";

const router = express.Router();

router.get("/:userId", getPointsByUser); // Lấy điểm theo userId
router.post("/add", addPoints);          // Cộng điểm
router.post("/subtract", subtractPoints);// Trừ điểm

export default router;
