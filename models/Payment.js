import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  bookingId: { type: String, required: true },
  amount: { type: Number, required: true },
  method: { type: String, default: "bank" },
  status: { type: String, default: "success" },
  paidAt: { type: Date, default: Date.now },
});

export default mongoose.model("Payment", paymentSchema);
