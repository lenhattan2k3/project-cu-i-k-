import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  sender: { type: String, required: true },
  receivers: [{ type: String, default: ["all"] }], // "user", "partner", "all"
  image: { type: String, default: "" }, // 🖼️ Thêm trường lưu URL ảnh Cloudinary
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Notification", notificationSchema);
