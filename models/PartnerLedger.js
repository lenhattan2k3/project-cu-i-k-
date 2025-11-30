import mongoose from "mongoose";

const PartnerLedgerSchema = new mongoose.Schema(
  {
    partnerId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    serviceFeeBalance: {
      type: Number,
      default: 0,
    },
    receivableBalance: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    totalServiceFee: {
      type: Number,
      default: 0,
    },
    totalDiscounts: {
      type: Number,
      default: 0,
    },
    totalWithdrawnFee: {
      type: Number,
      default: 0,
    },
    totalWithdrawnReceivable: {
      type: Number,
      default: 0,
    },
    lastBookingAt: {
      type: Date,
    },
    lastWithdrawalAt: {
      type: Date,
    },
    meta: {
      lastBookingId: {
        type: String,
        default: null,
      },
      lastWithdrawalId: {
        type: String,
        default: null,
      },
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

export default mongoose.model("PartnerLedger", PartnerLedgerSchema);
