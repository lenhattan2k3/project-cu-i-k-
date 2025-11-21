import mongoose from "mongoose";

const promotionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    discountType: { type: String, enum: ["percentage", "amount"], required: true },
    discountValue: { type: Number, required: true },
    maxUsage: { type: Number, default: 1 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Promotion", promotionSchema);
