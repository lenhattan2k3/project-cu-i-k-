  import Complaint from "../models/complaint.js";

  // 🟢 Gửi khiếu nại mới
  export const sendComplaint = async (req, res) => {
    try {
      const { senderId, receiverId, role, message } = req.body;
      const complaint = new Complaint({ senderId, receiverId, role, message });
      await complaint.save();
      res.status(201).json(complaint);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // 🟢 Lấy danh sách khiếu nại theo người nhận
  export const getComplaintsByReceiver = async (req, res) => {
    try {
      const { receiverId } = req.params;
      const complaints = await Complaint.find({ receiverId }).sort({ createdAt: -1 });
      res.json(complaints);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
