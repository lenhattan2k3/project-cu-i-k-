import express from "express";
import {
  getAllTrips,
  createTrip,
  updateTrip,
  deleteTrip,
  getTripById,
} from "../controllers/tripController.js";

const router = express.Router();

// 🆕 Thêm chuyến xe
router.post("/", createTrip);

// ✏️ Cập nhật chuyến xe
router.put("/:id", updateTrip);

// 🔍 Lấy tất cả chuyến xe
router.get("/", getAllTrips);

// 🔍 Lấy chuyến theo ID
router.get("/:id", getTripById);

// ❌ Xóa chuyến xe
router.delete("/:id", deleteTrip);

export default router;
