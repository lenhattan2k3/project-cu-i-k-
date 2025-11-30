import mongoose from "mongoose";
import PartnerLedger from "../models/PartnerLedger.js";
import Booking from "../models/Booking.js";

const paidStatuses = ["paid", "completed", "done"];

const toNumber = (value, fallback = 0) => {
  if (value == null) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const ensureLedgerShape = (partnerId) => ({
  partnerId,
  serviceFeeBalance: 0,
  receivableBalance: 0,
  totalRevenue: 0,
  totalServiceFee: 0,
  totalDiscounts: 0,
  totalWithdrawnFee: 0,
  totalWithdrawnReceivable: 0,
  lastBookingAt: null,
  lastWithdrawalAt: null,
  meta: { lastBookingId: null, lastWithdrawalId: null },
  createdAt: null,
  updatedAt: null,
});

const getReceivedAmount = ({ grossAmount, serviceFeeAmount, discountAmount, receivedAmount }) => {
  if (receivedAmount != null) return toNumber(receivedAmount);
  const gross = toNumber(grossAmount);
  const fee = toNumber(serviceFeeAmount);
  const discount = toNumber(discountAmount);
  return Math.max(0, gross - fee - discount);
};

const aggregateBookingsForPartner = async (partnerId) => {
  if (!partnerId) return null;
  const rows = await Booking.aggregate([
    { $match: { partnerId, status: { $in: paidStatuses } } },
    {
      $addFields: {
        grossAmount: {
          $ifNull: ["$finalTotal", { $ifNull: ["$totalPrice", 0] }],
        },
        discountAmount: { $ifNull: ["$discountAmount", 0] },
        feePercentSource: {
          $ifNull: ["$feePercent", { $ifNull: ["$feeApplied", 0] }],
        },
        bookingMoment: {
          $ifNull: ["$updatedAt", { $ifNull: ["$createdAt", null] }],
        },
      },
    },
    {
      $addFields: {
        serviceFeeAmount: {
          $cond: [
            { $gt: ["$serviceFeeAmount", 0] },
            "$serviceFeeAmount",
            {
              $multiply: [
                "$grossAmount",
                {
                  $divide: [
                    { $ifNull: ["$feePercentSource", 0] },
                    100,
                  ],
                },
              ],
            },
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: { $ifNull: ["$grossAmount", 0] } },
        totalServiceFee: { $sum: { $ifNull: ["$serviceFeeAmount", 0] } },
        totalDiscounts: { $sum: { $ifNull: ["$discountAmount", 0] } },
        lastBookingAt: { $max: "$bookingMoment" },
      },
    },
  ]);

  if (!rows || !rows.length) {
    return {
      totalRevenue: 0,
      totalServiceFee: 0,
      totalDiscounts: 0,
      lastBookingAt: null,
    };
  }

  const doc = rows[0];
  return {
    totalRevenue: toNumber(doc.totalRevenue),
    totalServiceFee: toNumber(doc.totalServiceFee),
    totalDiscounts: toNumber(doc.totalDiscounts),
    lastBookingAt: doc.lastBookingAt ? new Date(doc.lastBookingAt) : null,
  };
};

const aggregateWithdrawalsForPartner = async (partnerId) => {
  if (!partnerId || !mongoose?.connection) {
    return {
      totalWithdrawnFee: 0,
      totalWithdrawnReceivable: 0,
      lastWithdrawalAt: null,
    };
  }

  const withdrawalsColl = mongoose.connection.collection("withdrawals");
  const rows = await withdrawalsColl
    .aggregate([
      { $match: { partnerId, status: "success" } },
      {
        $group: {
          _id: "$deductFrom",
          total: { $sum: { $ifNull: ["$amount", 0] } },
          lastWithdrawalAt: {
            $max: {
              $ifNull: ["$updatedAt", { $ifNull: ["$createdAt", null] }],
            },
          },
        },
      },
    ])
    .toArray();

  let totalWithdrawnFee = 0;
  let totalWithdrawnReceivable = 0;
  let lastWithdrawalAt = null;

  rows.forEach((row) => {
    const bucket = row._id === "fee" ? "fee" : "received";
    if (bucket === "fee") {
      totalWithdrawnFee += toNumber(row.total);
    } else {
      totalWithdrawnReceivable += toNumber(row.total);
    }
    const candidate = row.lastWithdrawalAt ? new Date(row.lastWithdrawalAt) : null;
    if (candidate && (!lastWithdrawalAt || candidate > lastWithdrawalAt)) {
      lastWithdrawalAt = candidate;
    }
  });

  return { totalWithdrawnFee, totalWithdrawnReceivable, lastWithdrawalAt };
};

const rebuildLedgerForPartner = async (partnerId) => {
  if (!partnerId) return null;
  const bookingAgg = await aggregateBookingsForPartner(partnerId);
  const withdrawalAgg = await aggregateWithdrawalsForPartner(partnerId);

  const totalRevenue = bookingAgg.totalRevenue;
  const totalServiceFee = bookingAgg.totalServiceFee;
  const totalDiscounts = bookingAgg.totalDiscounts;
  const totalReceivable = Math.max(0, totalRevenue - totalServiceFee - totalDiscounts);

  const totalWithdrawnFee = withdrawalAgg.totalWithdrawnFee;
  const totalWithdrawnReceivable = withdrawalAgg.totalWithdrawnReceivable;

  const serviceFeeBalance = Math.max(0, totalServiceFee - totalWithdrawnFee);
  const receivableBalance = Math.max(0, totalReceivable - totalWithdrawnReceivable);

  return PartnerLedger.findOneAndUpdate(
    { partnerId },
    {
      $set: {
        totalRevenue,
        totalServiceFee,
        totalDiscounts,
        serviceFeeBalance,
        receivableBalance,
        totalWithdrawnFee,
        totalWithdrawnReceivable,
        lastBookingAt: bookingAgg.lastBookingAt,
        lastWithdrawalAt: withdrawalAgg.lastWithdrawalAt,
        "meta.lastBookingId": null,
        "meta.lastWithdrawalId": null,
      },
      $setOnInsert: {
        meta: { lastBookingId: null, lastWithdrawalId: null },
      },
    },
    { new: true, upsert: true }
  );
};

const collectPartnerUniverse = async () => {
  const ids = new Set();
  const fromBookings = await Booking.distinct("partnerId", { partnerId: { $nin: [null, ""] } });
  fromBookings.forEach((id) => id && ids.add(String(id)));
  const fromLedgers = await PartnerLedger.distinct("partnerId");
  fromLedgers.forEach((id) => id && ids.add(String(id)));
  if (mongoose?.connection) {
    const withdrawalsColl = mongoose.connection.collection("withdrawals");
    const fromWithdrawals = await withdrawalsColl.distinct("partnerId");
    fromWithdrawals.forEach((id) => id && ids.add(String(id)));
  }
  return Array.from(ids);
};

export const recordBookingLedgerImpact = async ({
  partnerId,
  bookingId,
  grossAmount,
  serviceFeeAmount,
  discountAmount,
  receivedAmount,
  occurredAt,
}) => {
  if (!partnerId) return null;
  const gross = toNumber(grossAmount);
  const fee = toNumber(serviceFeeAmount);
  const discount = toNumber(discountAmount);
  const receivable = getReceivedAmount({ grossAmount: gross, serviceFeeAmount: fee, discountAmount: discount, receivedAmount });

  return PartnerLedger.findOneAndUpdate(
    { partnerId },
    {
      $inc: {
        totalRevenue: gross,
        totalServiceFee: fee,
        totalDiscounts: discount,
        serviceFeeBalance: fee,
        receivableBalance: receivable,
      },
      $set: {
        lastBookingAt: occurredAt || new Date(),
        "meta.lastBookingId": bookingId || null,
      },
    },
    { new: true, upsert: true }
  );
};

export const recordWithdrawalLedgerImpact = async ({
  partnerId,
  withdrawalId,
  amount,
  bucket,
  occurredAt,
}) => {
  if (!partnerId) return null;
  const amt = Math.abs(toNumber(amount));
  const targetBucket = bucket === "fee" ? "fee" : "received";
  const balanceField = targetBucket === "fee" ? "serviceFeeBalance" : "receivableBalance";
  const totalField = targetBucket === "fee" ? "totalWithdrawnFee" : "totalWithdrawnReceivable";

  await PartnerLedger.updateOne(
    { partnerId },
    {
      $setOnInsert: {
        serviceFeeBalance: 0,
        receivableBalance: 0,
        totalRevenue: 0,
        totalServiceFee: 0,
        totalDiscounts: 0,
        totalWithdrawnFee: 0,
        totalWithdrawnReceivable: 0,
        meta: { lastBookingId: null, lastWithdrawalId: null },
      },
    },
    { upsert: true }
  );

  return PartnerLedger.findOneAndUpdate(
    { partnerId },
    {
      $inc: {
        [balanceField]: -amt,
        [totalField]: amt,
      },
      $set: {
        lastWithdrawalAt: occurredAt || new Date(),
        "meta.lastWithdrawalId": withdrawalId || null,
      },
    },
    { new: true }
  );
};

export const listLedgers = async (_req, res) => {
  try {
    const ledgers = await PartnerLedger.find().sort({ updatedAt: -1 }).limit(200).lean();
    return res.json({ success: true, ledgers });
  } catch (err) {
    console.error("listLedgers ERROR:", err);
    return res.status(500).json({ success: false, error: err?.message || "Server error" });
  }
};

export const getLedger = async (req, res) => {
  try {
    const { partnerId } = req.params;
    if (!partnerId) return res.status(400).json({ success: false, error: "partnerId required" });
    const ledger = await PartnerLedger.findOne({ partnerId }).lean();
    return res.json({ success: true, ledger: ledger || ensureLedgerShape(partnerId) });
  } catch (err) {
    console.error("getLedger ERROR:", err);
    return res.status(500).json({ success: false, error: err?.message || "Server error" });
  }
};

export const getLedgerActivity = async (req, res) => {
  try {
    const { partnerId } = req.params;
    if (!partnerId) return res.status(400).json({ success: false, error: "partnerId required" });
    const limitRaw = parseInt(String(req.query?.limit ?? "100"), 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 100;

    const ledger = await PartnerLedger.findOne({ partnerId }).lean();

    if (!mongoose?.connection) {
      return res.json({ success: true, ledger: ledger || ensureLedgerShape(partnerId), withdrawals: [] });
    }

    const withdrawalsColl = mongoose.connection.collection("withdrawals");
    const withdrawals = await withdrawalsColl
      .find({ partnerId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return res.json({
      success: true,
      ledger: ledger || ensureLedgerShape(partnerId),
      withdrawals,
    });
  } catch (err) {
    console.error("getLedgerActivity ERROR:", err);
    return res.status(500).json({ success: false, error: err?.message || "Server error" });
  }
};

export const applyBookingLedgerEndpoint = async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];
    const results = [];
    for (const entry of payload) {
      if (!entry?.partnerId) continue;
      const ledger = await recordBookingLedgerImpact(entry);
      results.push(ledger);
    }
    return res.json({ success: true, ledgers: results });
  } catch (err) {
    console.error("applyBookingLedgerEndpoint ERROR:", err);
    return res.status(500).json({ success: false, error: err?.message || "Server error" });
  }
};

export const applyWithdrawalLedgerEndpoint = async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];
    const results = [];
    for (const entry of payload) {
      if (!entry?.partnerId) continue;
      const ledger = await recordWithdrawalLedgerImpact(entry);
      results.push(ledger);
    }
    return res.json({ success: true, ledgers: results });
  } catch (err) {
    console.error("applyWithdrawalLedgerEndpoint ERROR:", err);
    return res.status(500).json({ success: false, error: err?.message || "Server error" });
  }
};

export const adjustLedger = async (req, res) => {
  try {
    const { partnerId } = req.params;
    if (!partnerId) return res.status(400).json({ success: false, error: "partnerId required" });
    const serviceFeeDelta = toNumber(req.body?.serviceFeeDelta);
    const receivableDelta = toNumber(req.body?.receivableDelta);

    const ledger = await PartnerLedger.findOneAndUpdate(
      { partnerId },
      {
        $inc: {
          serviceFeeBalance: serviceFeeDelta,
          receivableBalance: receivableDelta,
        },
        $setOnInsert: {
          totalRevenue: 0,
          totalServiceFee: 0,
          totalDiscounts: 0,
          totalWithdrawnFee: 0,
          totalWithdrawnReceivable: 0,
          meta: { lastBookingId: null, lastWithdrawalId: null },
        },
      },
      { new: true, upsert: true }
    );

    return res.json({ success: true, ledger });
  } catch (err) {
    console.error("adjustLedger ERROR:", err);
    return res.status(500).json({ success: false, error: err?.message || "Server error" });
  }
};

export const resetLedger = async (req, res) => {
  try {
    const { partnerId } = req.params;
    if (!partnerId) return res.status(400).json({ success: false, error: "partnerId required" });

    const ledger = await PartnerLedger.findOneAndUpdate(
      { partnerId },
      {
        $set: {
          serviceFeeBalance: 0,
          receivableBalance: 0,
        },
      },
      { new: true, upsert: true }
    );

    return res.json({ success: true, ledger });
  } catch (err) {
    console.error("resetLedger ERROR:", err);
    return res.status(500).json({ success: false, error: err?.message || "Server error" });
  }
};

export const rebuildLedger = async (req, res) => {
  try {
    const routePartner = req.params?.partnerId;
    const bodyPartnerIds = Array.isArray(req.body?.partnerIds) ? req.body.partnerIds : [];
    const explicitAll = routePartner === "all" || req.body?.partnerId === "all";

    let targetPartnerIds = [];
    if (routePartner && routePartner !== "all") {
      targetPartnerIds = [routePartner];
    } else if (bodyPartnerIds.length) {
      targetPartnerIds = bodyPartnerIds.filter(Boolean);
    } else if (!routePartner && req.body?.partnerId && req.body.partnerId !== "all") {
      targetPartnerIds = [req.body.partnerId];
    } else if (explicitAll || !routePartner) {
      targetPartnerIds = await collectPartnerUniverse();
    }

    if (!targetPartnerIds.length) {
      return res.json({ success: true, count: 0, ledgers: [] });
    }

    const ledgers = [];
    for (const partnerId of targetPartnerIds) {
      const ledger = await rebuildLedgerForPartner(partnerId);
      if (ledger) ledgers.push(ledger);
    }

    return res.json({ success: true, count: ledgers.length, ledgers });
  } catch (err) {
    console.error("rebuildLedger ERROR:", err);
    return res.status(500).json({ success: false, error: err?.message || "Server error" });
  }
};
