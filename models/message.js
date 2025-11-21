import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  conversationId: { type: String, required: true }, // 🟢 thêm trường này
  senderId: String,
  receiverId: String,
  senderRole: String, // admin | partner | user
  receiverRole: String,
  content: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Message", messageSchema);
