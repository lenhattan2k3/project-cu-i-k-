import mongoose from "mongoose";

const FeeConfigSchema = new mongoose.Schema(
  {
    percent: {
      type: Number,
      required: true,
      default: 5,
    },
    updatedBy: {
      type: String,
    },
  },
  { timestamps: true }
);

const FeeConfig = mongoose.model("FeeConfig", FeeConfigSchema);
export default FeeConfig;
