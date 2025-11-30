  import Complaint from "../models/complaint.js";
  import { io } from "../server.js";

  // 🟢 Gửi khiếu nại mới
  export const sendComplaint = async (req, res) => {
    try {
      const {
        senderId = "",
        senderRole = "user",
        receiverId = "",
        receiverRole = "admin",
        message,
      } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({ message: "Nội dung khiếu nại không được để trống" });
      }

      const complaint = await Complaint.create({
        senderId,
        senderRole,
        receiverId,
        receiverRole,
        message: message.trim(),
      });

      io.emit("complaint:new", complaint);

      res.status(201).json(complaint);
    } catch (error) {
      console.error("❌ sendComplaint error", error);
      res.status(500).json({ error: error.message });
    }
  };

  // 🟢 Lấy danh sách khiếu nại theo người nhận (theo id hoặc role)
  export const getComplaintsByReceiver = async (req, res) => {
    try {
      const { receiverId } = req.params;
        const { senderId } = req.query;
      const normalized = String(receiverId || "").toLowerCase();

      const roleTargets = ["admin", "partner", "user"];
        const filter = roleTargets.includes(normalized)
          ? { receiverRole: normalized }
          : { receiverId: receiverId };

        if (senderId) {
          filter.senderId = senderId;
        }

      const complaints = await Complaint.find(filter).sort({ createdAt: -1 });
      res.json(complaints);
    } catch (error) {
      console.error("❌ getComplaintsByReceiver error", error);
      res.status(500).json({ error: error.message });
    }
  };

  // 🟢 Admin / Partner phản hồi khiếu nại
  export const replyComplaint = async (req, res) => {
    try {
      const { id } = req.params;
      const { senderId = "", senderRole = "admin", message } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({ message: "Nội dung phản hồi không được để trống" });
      }

      const complaint = await Complaint.findById(id);
      if (!complaint) {
        return res.status(404).json({ message: "Không tìm thấy khiếu nại" });
      }

      complaint.responses.push({
        senderId,
        senderRole,
        message: message.trim(),
        createdAt: new Date(),
      });

      await complaint.save();

      io.emit("complaint:updated", complaint);

      res.json(complaint);
    } catch (error) {
      console.error("❌ replyComplaint error", error);
      res.status(500).json({ error: error.message });
    }
  };
