// 📁 models/Booking.js
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: { 
      type: String, 
      required: true 
    },

    partnerId: { 
      type: String,   // Firebase UID
      required: true
    },

    tripId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Trip", 
      required: true 
    },

    hoTen: { 
      type: String, 
      required: true 
    },

    sdt: { 
      type: String, 
      required: true 
    },

    soGhe: { 
      type: [String],
      required: true 
    },

    totalPrice: { 
      type: Number, 
      required: true 
    },

    diemDonChiTiet: {
      type: String,
      trim: true,
      default: null,
    },

    // --- TRẠNG THÁI VÉ ---
    status: {
      type: String,
      enum: ["pending", "paid", "completed", "done", "cancelled", "refunded"],
      default: "pending",
    },

    // --- PHƯƠNG THỨC THANH TOÁN ---
    paymentMethod: {
      type: String,
      enum: ["card", "bank", "cash", "unknown"],
      default: "unknown",
    },

    // --- THÔNG TIN VOUCHER ---
    voucherCode: {
      type: String,
      default: null
    },

    discountAmount: {
      type: Number,
      default: 0
    },

    finalTotal: {
      type: Number,
      default: 0
    },

    // --- THÔNG TIN CHUYẾN (FE đang dùng) ---
    tenChuyen: {
      type: String,
      default: ""
    },

    ngayKhoiHanh: {
      type: String,
      default: ""
    },

    gioKhoiHanh: {
      type: String,
      default: ""
    }
  },

  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
