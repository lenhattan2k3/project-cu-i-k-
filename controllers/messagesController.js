import Message from "../models/message.js";
import { io, onlineUsers } from "../server.js";

// 🟢 Gửi tin nhắn mới
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, senderId, receiverId, senderRole, receiverRole, content } = req.body;

    const message = new Message({
      conversationId,
      senderId,
      receiverId,
      senderRole,
      receiverRole,
      content,
    });

    await message.save();

    // Nếu receiver đang online thì gửi realtime
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", message);
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🟢 Lấy tin nhắn theo ID cuộc trò chuyện
export const getMessagesByConversation = async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.id }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
