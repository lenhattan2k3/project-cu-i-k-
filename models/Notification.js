import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  sender: { type: String, required: true },
  receivers: { type: [String], default: ["all"] }, // "user", "partner", "all" hoặc userId cụ thể
  image: { type: String, default: "" },
  partnerId: { type: String, default: "" },
  targetUserIds: { type: [String], default: [] },
  targetScope: { type: String, default: "general" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Notification", notificationSchema);
