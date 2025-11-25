import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  userId: { type: String, required: true },        // người thanh toán
  bookingId: { type: String, required: true },     // booking liên quan
  orderCode: { type: Number, required: true, unique: true }, // mã đơn hàng PayOS
  amount: { type: Number, required: true },
  method: { type: String, default: "payos" },     // phương thức thanh toán
  status: { type: String, enum: ["pending","paid","failed"], default: "pending" }, 
  payosData: { type: Object },                     // lưu thông tin trả về từ PayOS
  paidAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Payment", paymentSchema);
