import mongoose from "mongoose";

const pointSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    points: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Point = mongoose.model("Point", pointSchema);
