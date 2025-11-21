import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    senderId: String,
    receiverId: String,
    role: String, // 'admin' | 'partner' | 'user'
    message: String,
  },
  { timestamps: true }
);

export default mongoose.model("Complaint", complaintSchema);
