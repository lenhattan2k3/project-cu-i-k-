// models/Withdraw.js
import mongoose from "mongoose";

const withdrawSchema = new mongoose.Schema(
  {
    partnerId: { type: String, required: true }, // Firebase UID của nhà xe

    amount: { type: Number, required: true },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Withdraw", withdrawSchema);
