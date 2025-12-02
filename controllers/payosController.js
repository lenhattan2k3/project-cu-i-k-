import mongoose from "mongoose";
import { PayOS } from "@payos/node";
import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import { io, onlineUsers } from "../server.js";
import { recordBookingLedgerImpact, recordWithdrawalLedgerImpact } from "./ledgerController.js";
import { ensureInvoiceForBooking } from "./invoiceController.js";

// instantiate PayOS client using options object (library expects an options bag)
const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});

const markBookingPaidFromPayment = async (paymentDoc, { finalAmount } = {}) => {
  try {
    if (!paymentDoc?.bookingId) return null;
    const booking = await Booking.findById(paymentDoc.bookingId);
    if (!booking) return null;

    const wasPaid = booking.status === "paid";
    booking.status = "paid";
    booking.paymentMethod = "payos";

    const normalizedAmount = finalAmount ?? paymentDoc.amount;
    if (normalizedAmount != null && Number.isFinite(Number(normalizedAmount))) {
      booking.finalTotal = Number(normalizedAmount);
    }

    booking.paidAt = booking.paidAt || new Date();
    await booking.save();

    if (!wasPaid) {
      await recordBookingLedgerImpact({
        partnerId: booking.partnerId,
        bookingId: String(booking._id),
        grossAmount: booking.finalTotal ?? booking.totalPrice ?? 0,
        serviceFeeAmount: booking.serviceFeeAmount ?? 0,
        discountAmount: booking.discountAmount ?? 0,
        occurredAt: booking.updatedAt ?? new Date(),
      });
    }

    try {
      await ensureInvoiceForBooking(booking);
    } catch (invoiceErr) {
      console.error("Failed to ensure invoice for PayOS booking", invoiceErr);
    }

    return booking;
  } catch (err) {
    console.error("markBookingPaidFromPayment error", err);
    return null;
  }
};

// Tạo link thanh toán
export const createPayment = async (req, res) => {
  try {
    const { userId, bookingId, amount, description, orderCode, returnUrl: reqReturnUrl, cancelUrl: reqCancelUrl } = req.body;

    if (!userId || !bookingId || !amount || !orderCode)
      return res.status(400).json({ error: "userId, bookingId, amount, orderCode required" });

    const returnUrl = reqReturnUrl || "http://localhost:3000/payment-success";
    const cancelUrl = reqCancelUrl || "http://localhost:3000/payment-cancel";

    // Use the v2 paymentRequests API provided by the SDK
    const paymentLink = await payos.paymentRequests.create({
      orderCode,
      amount: Math.round(amount), // Ensure integer
      description,
      returnUrl,
      cancelUrl,
    });

    const payment = await Payment.create({
      userId,
      bookingId,
      orderCode,
      amount: Math.round(amount),
      method: "payos",
      status: "pending",
      payosData: paymentLink,
    });

    // Normalize checkout URL from potential response shapes
    const checkoutUrl = paymentLink?.checkoutUrl || paymentLink?.checkout_url || paymentLink?.paymentLink || paymentLink?.url || null;

    const paymentInfo = {
      orderCode: paymentLink?.orderCode || orderCode,
      amount: paymentLink?.amount || amount,
      description: paymentLink?.description || description,
      checkoutUrl,
      qrCode: paymentLink?.qrCode || paymentLink?.qrCodeUrl || paymentLink?.qrCodeURL || paymentLink?.qrcode || null,
      accountNumber: paymentLink?.accountNumber || paymentLink?.account_no || paymentLink?.accountNo || null,
      accountName: paymentLink?.accountName || paymentLink?.account_name || null,
      bankBin: paymentLink?.bin || paymentLink?.bankBin || null,
      shortLink: paymentLink?.shortLink || paymentLink?.short_url || null,
      expiredAt: paymentLink?.expiredAt || paymentLink?.expiresAt || paymentLink?.expiredTime || null,
    };

    res.json({ success: true, paymentInfo, payment, paymentLink: checkoutUrl });
  } catch (err) {
    console.error("PayOS Create Payment Error:", err);
    res.status(500).json({ error: err.message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined });
  }
};

// Webhook PayOS
const settleWithdrawalFromPayment = async (paymentDoc) => {
  try {
    if (!paymentDoc?.bookingId || !mongoose?.connection) return;
    const { bookingId } = paymentDoc;
    if (!mongoose.Types.ObjectId.isValid(bookingId)) return;

    const withdrawalsColl = mongoose.connection.collection("withdrawals");
    const lookupId = new mongoose.Types.ObjectId(bookingId);
    const existing = await withdrawalsColl.findOne({ _id: lookupId });
    if (!existing) return;
    if (existing.status === "success") return;

    const now = new Date();
    const { value: updated } = await withdrawalsColl.findOneAndUpdate(
      { _id: lookupId },
      { $set: { status: "success", updatedAt: now, confirmedAt: now } },
      { returnDocument: "after" }
    );

    const withdrawal = updated || { ...existing, status: "success", updatedAt: now, confirmedAt: now };

    await recordWithdrawalLedgerImpact({
      partnerId: withdrawal.partnerId,
      withdrawalId: String(withdrawal._id),
      amount: withdrawal.amount,
      bucket: withdrawal.deductFrom,
      occurredAt: withdrawal.updatedAt ? new Date(withdrawal.updatedAt) : now,
    });

    try {
      const payload = { amount: withdrawal.amount, partnerId: withdrawal.partnerId, withdrawal };
      const socketId = onlineUsers.get(String(withdrawal.partnerId));
      if (socketId) io.to(socketId).emit("withdrawalSuccess", payload);
      else io.emit("withdrawalSuccess", payload);
    } catch (emitErr) {
      console.warn("Failed to emit withdrawalSuccess from PayOS webhook:", emitErr);
    }
  } catch (err) {
    console.error("Failed to settle withdrawal from PayOS payment:", err);
  }
};

export const payosWebhook = async (req, res) => {
  try {
    const data = req.body;
    console.log("PayOS Webhook:", data);

    const valid = payos.verifyPaymentWebhookData(data);
    if (!valid) return res.status(400).send("Invalid signature");

    const orderCode = data?.data?.orderCode;
    const status = data?.data?.status;

    if (!orderCode) return res.status(400).send("No orderCode");

    const payment = await Payment.findOne({ orderCode });
    if (!payment) return res.status(404).send("Payment not found");

    if (status === "PAID" && payment.status !== "paid") {
      payment.status = "paid";
      payment.paidAt = new Date();
      payment.amount = data?.data?.amount ?? payment.amount;
      await payment.save();

      await markBookingPaidFromPayment(payment, { finalAmount: data?.data?.amount });
      await settleWithdrawalFromPayment(payment);
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("PayOS Webhook Error:", err);
    res.status(500).send("Webhook Error");
  }
};

export const confirmPaymentReturn = async (req, res) => {
  try {
    const { orderCode, status, amount } = req.body || {};
    if (!orderCode) {
      return res.status(400).json({ success: false, message: "Thiếu orderCode" });
    }

    const payment = await Payment.findOne({ orderCode });
    if (!payment) {
      return res.status(404).json({ success: false, message: "Không tìm thấy giao dịch" });
    }

    const normalizedStatus = String(status || "").toUpperCase();
    const isPaidSignal = normalizedStatus === "PAID" || normalizedStatus === "SUCCESS";
    const amountNumber = amount == null ? undefined : Number(amount);

    if (isPaidSignal || payment.status === "paid") {
      if (payment.status !== "paid") {
        payment.status = "paid";
        payment.paidAt = new Date();
        if (Number.isFinite(amountNumber)) {
          payment.amount = amountNumber;
        }
        await payment.save();
      }

      const booking = await markBookingPaidFromPayment(payment, { finalAmount: amountNumber });
      
      // Also attempt to settle withdrawal if this payment was for a withdrawal
      await settleWithdrawalFromPayment(payment);

      return res.json({ success: true, paymentStatus: "paid", booking });
    }

    return res.json({ success: true, paymentStatus: payment.status, booking: null });
  } catch (err) {
    console.error("confirmPaymentReturn error", err);
    return res.status(500).json({ success: false, message: "Lỗi server", error: err?.message });
  }
};
