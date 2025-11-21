import mongoose from "mongoose";

const bankLinkSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  bankName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  accountHolder: { type: String, required: true },
  linkedAt: { type: Date, default: Date.now },
  active: { type: Boolean, default: true },
});

export default mongoose.model("BankLink", bankLinkSchema);
