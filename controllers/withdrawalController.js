import mongoose from "mongoose";
import { io, onlineUsers } from "../server.js";
import { recordWithdrawalLedgerImpact } from "./ledgerController.js";
import PartnerLedger from "../models/PartnerLedger.js";

export const getAdminDebtReport = async (req, res) => {
  try {
    if (!mongoose?.connection) {
      return res.status(500).json({ success: false, error: "MongoDB connection unavailable" });
    }

    const bookingsColl = mongoose.connection.collection("bookings");
    const withdrawalsColl = mongoose.connection.collection("withdrawals");
    const tripsColl = mongoose.connection.collection("trips");
    const statusFilter = ["paid", "completed", "done"];

    const bookingAgg = await bookingsColl
      .aggregate([
        {
          $match: {
            partnerId: { $nin: [null, ""] },
            status: { $in: statusFilter },
          },
        },
        {
          $addFields: {
            effectiveRevenue: {
              $ifNull: ["$finalTotal", { $ifNull: ["$totalPrice", 0] }],
            },
            feeSourcePercent: {
              $ifNull: ["$feePercent", { $ifNull: ["$feeApplied", 0] }],
            },
            seatsCount: {
              $cond: [{ $isArray: "$soGhe" }, { $size: "$soGhe" }, 0],
            },
          },
        },
        {
          $addFields: {
            effectiveServiceFee: {
              $cond: [
                { $gt: ["$serviceFeeAmount", 0] },
                "$serviceFeeAmount",
                {
                  $cond: [
                    { $gt: ["$feeSourcePercent", 0] },
                    {
                      $multiply: [
                        "$effectiveRevenue",
                        {
                          $divide: ["$feeSourcePercent", 100],
                        },
                      ],
                    },
                    0,
                  ],
                },
              ],
            },
          },
        },
        {
          $group: {
            _id: "$partnerId",
            totalRevenue: { $sum: "$effectiveRevenue" },
            totalServiceFee: { $sum: "$effectiveServiceFee" },
            totalBookings: { $sum: 1 },
            totalSeats: { $sum: "$seatsCount" },
            latestBooking: { $max: "$createdAt" },
          },
        },
        { $sort: { totalRevenue: -1 } },
      ])
      .toArray();

    const ledgers = await PartnerLedger.find().lean();
    const ledgerPartnerIds = ledgers.map((ledger) => ledger.partnerId).filter(Boolean);
    const partnerIdsFromBookings = bookingAgg.map((item) => item._id).filter(Boolean);
    const allPartnerIds = Array.from(new Set([...partnerIdsFromBookings, ...ledgerPartnerIds]));

    const ledgerMap = new Map();
    ledgers.forEach((ledger) => {
      if (ledger?.partnerId) {
        ledgerMap.set(String(ledger.partnerId), ledger);
      }
    });

    const nameRows = allPartnerIds.length
      ? await tripsColl
          .aggregate([
            { $match: { partnerId: { $in: allPartnerIds } } },
            {
              $group: {
                _id: "$partnerId",
                partnerName: { $first: "$nhaXe" },
                fallbackName: { $first: "$tenChuyen" },
              },
            },
          ])
          .toArray()
      : [];

    const partnerNameMap = {};
    nameRows.forEach((row) => {
      const key = String(row._id || "").trim();
      partnerNameMap[key] = row.partnerName || row.fallbackName || `Partner ${key.slice(-4)}`;
    });

    const feeWithdrawalRows = await withdrawalsColl
      .aggregate([
        { $match: { status: "success", deductFrom: "fee" } },
        {
          $group: {
            _id: "$partnerId",
            feePaid: { $sum: { $ifNull: ["$amount", 0] } },
          },
        },
      ])
      .toArray();

    const feePaidMap = {};
    feeWithdrawalRows.forEach((row) => {
      feePaidMap[String(row._id || "")] = Number(row.feePaid || 0);
    });

    const receivableWithdrawalRows = await withdrawalsColl
      .aggregate([
        { $match: { status: "success", $or: [{ deductFrom: { $exists: false } }, { deductFrom: { $ne: "fee" } }] } },
        {
          $group: {
            _id: "$partnerId",
            receivablePaid: { $sum: { $ifNull: ["$amount", 0] } },
          },
        },
      ])
      .toArray();

    const receivablePaidMap = {};
    receivableWithdrawalRows.forEach((row) => {
      receivablePaidMap[String(row._id || "")] = Number(row.receivablePaid || 0);
    });

    const tolerance = 1; // Reduced tolerance to 1 VND to catch small debts
    const partners = bookingAgg.map((item) => {
      const partnerId = String(item._id || "");
      const ledgerDoc = ledgerMap.get(partnerId);
      const totalRevenue = ledgerDoc
        ? Number(ledgerDoc.totalRevenue ?? 0)
        : Number(item.totalRevenue || 0);
      const totalServiceFee = ledgerDoc
        ? Number(ledgerDoc.totalServiceFee ?? 0)
        : Number(item.totalServiceFee || 0);
      const serviceFeeBalanceFromLedger =
        ledgerDoc && ledgerDoc.serviceFeeBalance != null
          ? Number(ledgerDoc.serviceFeeBalance)
          : null;
      const receivableBalanceFromLedger =
        ledgerDoc && ledgerDoc.receivableBalance != null
          ? Number(ledgerDoc.receivableBalance)
          : null;
      const totalWithdrawnFee = ledgerDoc
        ? Number(
            ledgerDoc.totalWithdrawnFee ??
              (ledgerDoc.totalServiceFee != null && ledgerDoc.serviceFeeBalance != null
                ? ledgerDoc.totalServiceFee - ledgerDoc.serviceFeeBalance
                : 0)
          )
        : Number(feePaidMap[partnerId] || 0);
      const totalWithdrawnReceivable = ledgerDoc
        ? Number(ledgerDoc.totalWithdrawnReceivable ?? 0)
        : Number(receivablePaidMap[partnerId] || 0);
      const feeOutstandingRaw =
        serviceFeeBalanceFromLedger != null
          ? serviceFeeBalanceFromLedger
          : totalServiceFee - totalWithdrawnFee;
      const isSettled = feeOutstandingRaw <= tolerance;
      const feeOutstanding = isSettled ? 0 : Math.max(0, feeOutstandingRaw);
      const hasPartial = !isSettled && totalWithdrawnFee > 0;
      const feeStatus = isSettled ? "settled" : hasPartial ? "partial" : "due";
      const receivableOutstanding =
        receivableBalanceFromLedger != null
          ? Math.max(0, receivableBalanceFromLedger)
          : Math.max(0, totalRevenue - totalServiceFee - totalWithdrawnReceivable);
      const lastWithdrawalAt =
        ledgerDoc?.lastWithdrawalAt ? new Date(ledgerDoc.lastWithdrawalAt).toISOString() : null;
      const latestBooking =
        ledgerDoc?.lastBookingAt
          ? new Date(ledgerDoc.lastBookingAt).toISOString()
          : item.latestBooking || null;

      return {
        partnerId,
        partnerName: partnerNameMap[partnerId] || partnerId,
        totalRevenue,
        totalServiceFee,
        feePaid: totalWithdrawnFee,
        feeOutstanding,
        serviceFeeBalance: feeOutstanding,
        receivableBalance: receivableOutstanding,
        netReceivable: receivableOutstanding,
        totalBookings: Number(item.totalBookings || 0),
        totalSeats: Number(item.totalSeats || 0),
        latestBooking,
        lastWithdrawalAt,
        totalWithdrawnFee,
        totalWithdrawnReceivable,
        feeStatus,
      };
    });

    // Include partners that exist only in ledger but not in booking aggregation
    ledgerMap.forEach((ledgerDoc, partnerId) => {
      const hasExisting = partners.some((p) => p.partnerId === partnerId);
      if (hasExisting) return;

      const totalRevenue = Number(ledgerDoc.totalRevenue ?? 0);
      const totalServiceFee = Number(ledgerDoc.totalServiceFee ?? 0);
      const feePaid = Number(ledgerDoc.totalWithdrawnFee ?? 0);
      const feeOutstandingRaw = Number(
        ledgerDoc.serviceFeeBalance ?? totalServiceFee - feePaid
      );
      const isSettled = feeOutstandingRaw <= tolerance;
      const feeOutstanding = isSettled ? 0 : Math.max(0, feeOutstandingRaw);
      const hasPartial = !isSettled && feePaid > 0;
      const feeStatus = isSettled ? "settled" : hasPartial ? "partial" : "due";
      const receivableOutstanding = Math.max(0, Number(ledgerDoc.receivableBalance ?? 0));
      const latestBooking = ledgerDoc.lastBookingAt
        ? new Date(ledgerDoc.lastBookingAt).toISOString()
        : null;
      const lastWithdrawalAt = ledgerDoc.lastWithdrawalAt
        ? new Date(ledgerDoc.lastWithdrawalAt).toISOString()
        : null;

      partners.push({
        partnerId,
        partnerName: partnerNameMap[partnerId] || partnerId,
        totalRevenue,
        totalServiceFee,
        feePaid,
        feeOutstanding,
        serviceFeeBalance: feeOutstanding,
        receivableBalance: receivableOutstanding,
        netReceivable: Math.max(0, receivableOutstanding),
        totalBookings: 0,
        totalSeats: 0,
        latestBooking,
        lastWithdrawalAt,
        totalWithdrawnFee: feePaid,
        totalWithdrawnReceivable: Number(ledgerDoc.totalWithdrawnReceivable ?? 0),
        feeStatus,
      });
    });

    partners.sort((a, b) => b.totalRevenue - a.totalRevenue);

    const summary = partners.reduce(
      (acc, partner) => {
        acc.totalPartners += 1;
        acc.totalRevenue += partner.totalRevenue;
        acc.totalServiceFee += partner.totalServiceFee;
        acc.feePaid += partner.feePaid;
        acc.feeOutstanding += partner.feeOutstanding;
        acc.receivableOutstanding += partner.netReceivable;
        if (partner.feeStatus === "settled") acc.fullySettled += 1;
        if (partner.feeStatus === "partial") acc.partial += 1;
        if (partner.feeStatus === "due") acc.overdue += 1;
        return acc;
      },
      {
        totalPartners: 0,
        totalRevenue: 0,
        totalServiceFee: 0,
        feePaid: 0,
        feeOutstanding: 0,
        receivableOutstanding: 0,
        fullySettled: 0,
        partial: 0,
        overdue: 0,
      }
    );

    const revenueTop = partners.slice(0, 8).map((partner) => ({
      name: partner.partnerName,
      revenue: partner.totalRevenue,
    }));

    const feeStatusCounts = {
      settled: summary.fullySettled,
      partial: summary.partial,
      due: summary.overdue,
    };

    const charts = {
      revenueTop,
      feeStatus: [
        { status: "Đã thanh toán", value: feeStatusCounts.settled, color: "#16a34a" },
        { status: "Thanh toán dở dang", value: feeStatusCounts.partial, color: "#f97316" },
        { status: "Còn nợ", value: feeStatusCounts.due, color: "#dc2626" },
      ].filter((item) => item.value > 0),
    };

    return res.json({
      success: true,
      summary,
      partners,
      charts,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("getAdminDebtReport ERROR:", err);
    return res.status(500).json({ success: false, error: err?.message || "Server error" });
  }
};

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
      // FORCE 'fee' if paymentMethod is 'payos' to avoid frontend mistakes
      deductFrom: (paymentMethod === "payos") ? "fee" : (req.body.deductFrom || "received"),
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

      if (doc.status === "success") {
        await recordWithdrawalLedgerImpact({
          partnerId: doc.partnerId,
          withdrawalId: String(doc._id),
          amount: doc.amount,
          bucket: doc.deductFrom,
          occurredAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
        });
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
          if (doc.status === "success") {
            await recordWithdrawalLedgerImpact({
              partnerId: doc.partnerId,
              withdrawalId: String(doc._id),
              amount: doc.amount,
              bucket: doc.deductFrom,
              occurredAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
            });
          }
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

    if (before?.status !== "success" && value?.status === "success") {
      await recordWithdrawalLedgerImpact({
        partnerId: value.partnerId,
        withdrawalId: String(value._id),
        amount: value.amount,
        bucket: value.deductFrom,
        occurredAt: value.updatedAt ? new Date(value.updatedAt) : new Date(),
      });
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

    // Force deductFrom='fee' if it's a PayOS transaction (safety check)
    if (value && value.paymentMethod === 'payos' && value.deductFrom !== 'fee') {
      console.log("Fixing deductFrom for PayOS withdrawal:", value._id);
      await withdrawalsColl.updateOne({ _id: value._id }, { $set: { deductFrom: 'fee' } });
      value.deductFrom = 'fee';
    }

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

    if (value) {
      await recordWithdrawalLedgerImpact({
        partnerId: value.partnerId,
        withdrawalId: String(value._id),
        amount: value.amount,
        bucket: value.deductFrom,
        occurredAt: value.updatedAt ? new Date(value.updatedAt) : new Date(),
      });
    }

    return res.json({ success: true, withdrawal: value });
  } catch (err) {
    console.error('confirmWithdrawal ERROR:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
};

/**
 * POST /api/withdrawals/reset-financials
 * DANGER: Deletes all bookings, withdrawals, and ledgers.
 */
export const resetFinancials = async (req, res) => {
  try {
    if (!mongoose.connection) {
      return res.status(500).json({ success: false, error: "MongoDB connection unavailable" });
    }

    console.log("⚠️ RESETTING ALL FINANCIAL DATA...");

    // 1. Delete all bookings
    await mongoose.connection.collection("bookings").deleteMany({});
    
    // 2. Delete all withdrawals
    await mongoose.connection.collection("withdrawals").deleteMany({});
    
    // 3. Delete all partner ledgers
    await PartnerLedger.deleteMany({});

    // 4. Delete all payments (PayOS logs)
    await mongoose.connection.collection("payments").deleteMany({});

    // 5. Delete all invoices
    await mongoose.connection.collection("invoices").deleteMany({});

    console.log("✅ Financial data reset complete.");
    return res.json({ success: true, message: "Toàn bộ dữ liệu tài chính (Bookings, Withdrawals, Ledgers, Payments, Invoices) đã được xóa." });
  } catch (err) {
    console.error("resetFinancials ERROR:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};