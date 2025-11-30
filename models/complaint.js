import mongoose from "mongoose";

const replySchema = new mongoose.Schema(
  {
    senderId: { type: String, default: "" },
    senderRole: { type: String, default: "user" },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    senderId: { type: String, default: "" },
    senderRole: { type: String, enum: ["admin", "partner", "user"], default: "user" },
    receiverId: { type: String, default: "" },
    receiverRole: { type: String, enum: ["admin", "partner", "user"], default: "admin" },
    message: { type: String, required: true },
    status: { type: String, enum: ["open", "resolved"], default: "open" },
    responses: { type: [replySchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Complaint", complaintSchema);
