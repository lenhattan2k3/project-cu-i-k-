import mongoose from "mongoose";

const tripInfoSchema = new mongoose.Schema(
  {
    name: String,
    from: String,
    to: String,
    departDate: String,
    departTime: String,
    vehicleType: String,
    partnerName: String,
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceCode: { type: String, required: true, unique: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    userId: { type: String, required: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip" },
    partnerId: { type: String },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, default: "unknown" },
    status: { type: String, default: "paid" },
    seats: { type: [String], default: [] },
    passengerName: String,
    passengerPhone: String,
    checkInCode: { type: String, required: true },
    tripInfo: tripInfoSchema,
    metadata: { type: Object },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Invoice", invoiceSchema);
