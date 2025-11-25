import mongoose from "mongoose";

const FeeHistorySchema = new mongoose.Schema(
  {
    oldPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    newPercent: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100
    },
    appliedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    updatedBy: {
      type: String,
      default: "admin"
    }
  },
  { timestamps: true }
);

const FeeHistory = mongoose.model("FeeHistory", FeeHistorySchema);
export default FeeHistory;
