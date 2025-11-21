import express from "express";
import multer from "multer";
import {
  createPromotion,
  getPromotions,
  deletePromotion,
  applyPromotion,
} from "../controllers/promotionController.js";

const router = express.Router();
const storage = multer.memoryStorage(); // ✅ Dùng memoryStorage thay vì dest
const upload = multer({ storage });

router.post("/", upload.single("image"), createPromotion);
router.get("/", getPromotions);
router.delete("/:id", deletePromotion);
router.post("/apply", applyPromotion);

export default router;
