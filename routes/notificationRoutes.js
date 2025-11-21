    import express from "express";
    import {
    createNotification,
    getNotificationsByRole,
    deleteNotification,
    } from "../controllers/notificationController.js";

    const router = express.Router();

    // 🟢 Tạo thông báo mới
    router.post("/", createNotification);

    // 🟢 Lấy thông báo theo role (user / partner / all)
    router.get("/:role", getNotificationsByRole);

    // 🟠 Xóa thông báo
    router.delete("/:id", deleteNotification);

    export default router;
