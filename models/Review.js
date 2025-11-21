import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: { type: String, enum: ["user", "partner"], required: true },
    text: { type: String, default: "" },
    imageUrl: { type: String },
    createdAt: { type: Date, default: Date.now },
    senderId: { type: String },       // Firebase UID
    senderName: { type: String },
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    bookingId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Booking", 
      required: true 
    },

    userId: { type: String, required: true },  // Firebase UID

    partnerId: { 
      type: String,  // 🔥 Firebase UID dạng string
      required: true
    },

    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, default: "" },

    hoTen: String,
    sdt: String,
    tenChuyen: String,
    ngayKhoiHanh: String,
    gioKhoiHanh: String,

    soGhe: [String],

    totalPrice: Number,
    tu: String,
    den: String,

    tripId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Trip" 
    },

    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Review", reviewSchema);
