import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // ✅ để lưu userId dạng chuỗi (vd: "8")
      required: true,
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    hoTen: { type: String, required: true },
    sdt: { type: String, required: true },
    soGhe: { type: [Number], required: true },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["booked", "cancelled"],
      default: "booked",
    },
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
