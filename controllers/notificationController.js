// controllers/notificationController.js
import Notification from "../models/Notification.js";
import { io } from "../server.js";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";

dotenv.config();

// ⚙️ Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ⚙️ Cấu hình Multer để lưu file tạm
const upload = multer({ dest: "uploads/" });

// 🟢 Tạo thông báo (có thể kèm ảnh)
// 🟢 Tạo thông báo (có thể kèm ảnh)
export const createNotification = [
  upload.single("image"), // Nhận file ảnh từ form-data
  async (req, res) => {
    try {
      const { title, content, sender, receivers } = req.body;
      let imageUrl = null;

      // Nếu có ảnh thì upload lên Cloudinary
      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "notifications",
        });
        imageUrl = result.secure_url;
        fs.unlinkSync(req.file.path); // Xóa file tạm
      }

      // ✅ Xử lý receivers an toàn (có thể là chuỗi hoặc mảng)
      let receiversArray = [];
      if (typeof receivers === "string") {
        receiversArray = receivers.split(",").map((r) => r.trim());
      } else if (Array.isArray(receivers)) {
        receiversArray = receivers;
      } else {
        receiversArray = ["all"];
      }

      // 1️⃣ Lưu vào MongoDB
      const newNotification = await Notification.create({
        title,
        content,
        sender,
        receivers: receiversArray,
        image: imageUrl,
        createdAt: new Date(),
      });

      // 2️⃣ Gửi realtime đến client
      io.emit("receive_notification", newNotification);

      res.status(201).json(newNotification);
    } catch (error) {
      console.error("❌ Error creating notification:", error);
      res.status(500).json({
        message: "Lỗi khi gửi thông báo",
        error: error.message,
      });
    }
  },
];

// 🟢 Lấy thông báo theo role
export const getNotificationsByRole = async (req, res) => {
  try {
    const { role } = req.params;

    const list = await Notification.find({
      $or: [{ receivers: role }, { receivers: "all" }],
    }).sort({ createdAt: -1 });

    res.json(list);
  } catch (error) {
    console.error("❌ Error getting notifications:", error);
    res.status(500).json({ message: "Lỗi khi lấy thông báo" });
  }
};

// 🟠 Xóa thông báo
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Notification.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ message: "Không tìm thấy thông báo" });

    res.json({ message: "Đã xóa thông báo" });
  } catch (error) {
    console.error("❌ Error deleting notification:", error);
    res.status(500).json({ message: "Lỗi khi xóa thông báo" });
  }
};
