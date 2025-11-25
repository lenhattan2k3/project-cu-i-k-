import { PayOS } from "@payos/node";
import Payment from "../models/Payment.js";

// instantiate PayOS client using options object (library expects an options bag)
const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});

// Tạo link thanh toán
export const createPayment = async (req, res) => {
  try {
    const { userId, bookingId, amount, description, orderCode } = req.body;

    if (!userId || !bookingId || !amount || !orderCode)
      return res.status(400).json({ error: "userId, bookingId, amount, orderCode required" });

    const returnUrl = "http://localhost:3000/payment-success";
    const cancelUrl = "http://localhost:3000/payment-cancel";

    // Use the v2 paymentRequests API provided by the SDK
    const paymentLink = await payos.paymentRequests.create({
      orderCode,
      amount,
      description,
      returnUrl,
      cancelUrl,
    });

    const payment = await Payment.create({
      userId,
      bookingId,
      orderCode,
      amount,
      method: "payos",
      status: "pending",
      payosData: paymentLink,
    });

    // Normalize checkout URL from potential response shapes
    const checkoutUrl = paymentLink?.checkoutUrl || paymentLink?.checkout_url || paymentLink?.paymentLink || paymentLink?.url || null;

    res.json({ success: true, paymentLink: checkoutUrl, payment });
  } catch (err) {
    console.error("PayOS Create Payment Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Webhook PayOS
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
      await payment.save();
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("PayOS Webhook Error:", err);
    res.status(500).send("Webhook Error");
  }
};
