import mongoose from "mongoose";
import { io, onlineUsers } from "../server.js";

/**
 * GET /api/withdraws/amount/:partnerId
 */
export const getWithdrawableAmount = async (req, res) => {
  try {
    const { partnerId } = req.params;
    if (!partnerId) return res.status(400).json({ success: false, error: "partnerId required" });

    const bookingsColl = mongoose.connection.collection("bookings");
    const withdrawalsColl = mongoose.connection.collection("withdrawals");

    const bookAgg = await bookingsColl
      .aggregate([
        { $match: { partnerId, status: "paid" } },
        {
          $group: {
            _id: null,
            totalPaid: { $sum: { $ifNull: ["$finalTotal", "$totalPrice", 0] } },
            totalServiceFee: { $sum: { $ifNull: ["$serviceFeeAmount", 0] } },
          },
        },
      ])
      .toArray();

    const totals = bookAgg[0] || { totalPaid: 0, totalServiceFee: 0, totalDiscounts: 0 };

    const totalPaid = Number(totals.totalPaid || 0);
    const totalServiceFee = Number(totals.totalServiceFee || 0);
    const totalDiscounts = Number(totals.totalDiscounts || 0);

    // Gross amount partner should receive after fees & discounts
    const amountAfterFeeGross = Math.max(0, totalPaid - totalServiceFee - totalDiscounts);

    // Now compute how much has been withdrawn from each bucket (only 'success')
    const withdrawAggByBucket = await withdrawalsColl
      .aggregate([
        { $match: { partnerId, status: "success" } },
        { $group: { _id: "$deductFrom", total: { $sum: { $ifNull: ["$amount", 0] } } } },
      ])
      .toArray();

    const withdrawnByBucket = {};
    (withdrawAggByBucket || []).forEach((r) => { withdrawnByBucket[r._id || "received"] = Number(r.total || 0); });

    const withdrawnFromFee = Number(withdrawnByBucket["fee"] || 0);
    const withdrawnFromReceived = Number(withdrawnByBucket["received"] || 0);

    const availableFee = Math.max(0, totalServiceFee - withdrawnFromFee);
    const availableReceived = Math.max(0, amountAfterFeeGross - withdrawnFromReceived);

    const withdrawableAmount = Number((availableFee + availableReceived) || 0);

    return res.json({
      withdrawableAmount,
      breakdown: {
        totalPaid,
        totalServiceFee,
        totalDiscounts,
        amountAfterFeeGross,
        withdrawnFromFee,
        withdrawnFromReceived,
        availableFee,
        availableReceived,
      },
    });
  } catch (err) {
    console.error("getWithdrawableAmount ERROR:", err);
    return res.status(500).json({ success: false, error: err?.message || "Server error" });
  }
};

export const getAvailableFallback = (req, res) => getWithdrawableAmount(req, res);

/**
 * GET /api/withdrawals?partnerId=...
 */
export const listWithdrawals = async (req, res) => {
  try {
    const partnerId = req.query.partnerId;
    const withdrawalsColl = mongoose.connection.collection("withdrawals");
    const q = partnerId ? { partnerId } : {};
    const rows = await withdrawalsColl.find(q).sort({ createdAt: -1 }).toArray();
    return res.json({ withdrawals: rows });
  } catch (err) {
    console.error("listWithdrawals ERROR:", err);
    return res.status(500).json({ success: false, error: err?.message || "Server error" });
  }
};

/**
 * POST /api/withdrawals
 */
export const createWithdrawal = async (req, res) => {
  try {
    console.log("POST /api/withdrawals body:", JSON.stringify(req.body));
    const { partnerId, amount, paymentMethod, details } = req.body ?? {};

    if (!partnerId) return res.status(400).json({ success: false, error: "partnerId is required" });
    if (amount == null || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: "amount must be a positive number" });
    }

    if (!mongoose.connection || !mongoose.connection.db) {
      console.error("MongoDB not connected");
      return res.status(500).json({ success: false, error: "MongoDB not connected" });
    }

    const withdrawalsColl = mongoose.connection.collection("withdrawals");
    // Ensure orderCode is present and unique-ish (some environments have a unique index on orderCode)
    let orderCode = (details && details.orderCode) || `WD-${partnerId}-${Date.now()}`;

    const doc = {
      partnerId: String(partnerId),
      amount: Number(amount),
      paymentMethod: paymentMethod || "unknown",
      details: details || null,
      // Allow caller to provide initial status (e.g., 'success'), default to 'pending'
      status: req.body.status || "pending",
      // Which bucket to deduct from: 'fee' (service fee) or 'received' (after-fee amount)
      deductFrom: req.body.deductFrom || (paymentMethod === "payos" ? "fee" : "received"),
      orderCode,
      createdAt: new Date().toISOString(),
    };

    try {
      const r = await withdrawalsColl.insertOne(doc);
      doc._id = r.insertedId;
      console.log("Withdrawal created:", doc);
        // If withdrawal is immediately marked success, notify partner via socket
        try {
          if (doc.status === "success" && doc.partnerId) {
            const socketId = onlineUsers.get(String(doc.partnerId));
            const payload = { amount: doc.amount, partnerId: doc.partnerId, withdrawal: doc };
            if (socketId) io.to(socketId).emit("withdrawalSuccess", payload);
            else io.emit("withdrawalSuccess", payload); // fallback broadcast
          }
        } catch (emitErr) {
          console.warn("Failed to emit withdrawalSuccess:", emitErr);
        }

      return res.status(201).json({ success: true, withdrawal: doc });
    } catch (insertErr) {
      // Handle duplicate orderCode (E11000) by regenerating and retrying once
      if (insertErr && insertErr.code === 11000) {
        console.warn("Duplicate orderCode detected, retrying with new orderCode");
        orderCode = `WD-${partnerId}-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;
        doc.orderCode = orderCode;
        try {
          const r2 = await withdrawalsColl.insertOne(doc);
          doc._id = r2.insertedId;
          console.log("Withdrawal created after retry:", doc);
          return res.status(201).json({ success: true, withdrawal: doc });
        } catch (err2) {
          console.error("createWithdrawal INSERT retry ERROR:", err2);
          return res.status(500).json({ success: false, error: err2?.message || "Insert retry failed", stack: err2?.stack });
        }
      }

      console.error("createWithdrawal ERROR:", insertErr);
      return res.status(500).json({ success: false, error: insertErr?.message || "Internal server error", stack: insertErr?.stack });
    }
  } catch (err) {
    console.error("createWithdrawal ERROR:", err);
    return res.status(500).json({ success: false, error: err?.message || "Internal server error", stack: err?.stack });
  }
};

/**
 * PATCH /api/withdrawals/:id
 * Update withdrawal fields such as status. When status becomes 'success',
 * it will be counted in the withdrawable calculation (handled by aggregation).
 */
export const updateWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body || {};
    if (!id) return res.status(400).json({ success: false, error: "id required" });

    const withdrawalsColl = mongoose.connection.collection("withdrawals");
    // read current document before update so we can detect status changes
    const before = await withdrawalsColl.findOne({ _id: new mongoose.Types.ObjectId(id) });
    const { value } = await withdrawalsColl.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: update },
      { returnDocument: "after" }
    );

    if (!value) return res.status(404).json({ success: false, error: "Withdrawal not found" });
      // If status changed to 'success', notify partner via socket
      try {
        const prevStatus = before?.status;
        const newStatus = value?.status;
        if (prevStatus !== "success" && newStatus === "success" && value.partnerId) {
          const socketId = onlineUsers.get(String(value.partnerId));
          const payload = { amount: value.amount, partnerId: value.partnerId, withdrawal: value };
          if (socketId) io.to(socketId).emit("withdrawalSuccess", payload);
          else io.emit("withdrawalSuccess", payload);
        }
      } catch (emitErr) {
        console.warn("Failed to emit withdrawalSuccess on update:", emitErr);
      }

    return res.json({ success: true, withdrawal: value });
  } catch (err) {
    console.error("updateWithdrawal ERROR:", err);
    return res.status(500).json({ success: false, error: err?.message || "Server error" });
  }
};

/**
 * DELETE /api/withdrawals/:id
 */
export const deleteWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: "id required" });

    const withdrawalsColl = mongoose.connection.collection("withdrawals");
    const result = await withdrawalsColl.deleteOne({ _id: new mongoose.Types.ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ success: false, error: "Not found" });
    return res.json({ success: true, deletedId: id });
  } catch (err) {
    console.error("deleteWithdrawal ERROR:", err);
    return res.status(500).json({ success: false, error: err?.message || "Server error" });
  }
};

/**
 * POST /api/withdrawals/confirm
 * Body: { orderCode?: string, id?: string }
 * Marks the matching withdrawal as success and emits socket event.
 */
export const confirmWithdrawal = async (req, res) => {
  try {
    const { orderCode, id } = req.body ?? {};
    if (!orderCode && !id) return res.status(400).json({ success: false, error: 'orderCode or id required' });

    const withdrawalsColl = mongoose.connection.collection('withdrawals');
    const query = orderCode ? { orderCode } : { _id: new mongoose.Types.ObjectId(id) };

    const before = await withdrawalsColl.findOne(query);
    if (!before) return res.status(404).json({ success: false, error: 'Withdrawal not found' });

    if (String(before.status) === 'success') return res.json({ success: true, withdrawal: before });

    const { value } = await withdrawalsColl.findOneAndUpdate(query, { $set: { status: 'success' } }, { returnDocument: 'after' });

    // Emit socket event
    try {
      if (value && value.partnerId) {
        const socketId = onlineUsers.get(String(value.partnerId));
        const payload = { amount: value.amount, partnerId: value.partnerId, withdrawal: value };
        if (socketId) io.to(socketId).emit('withdrawalSuccess', payload);
        else io.emit('withdrawalSuccess', payload);
      }
    } catch (emitErr) {
      console.warn('Failed to emit withdrawalSuccess on confirm:', emitErr);
    }

    return res.json({ success: true, withdrawal: value });
  } catch (err) {
    console.error('confirmWithdrawal ERROR:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
};