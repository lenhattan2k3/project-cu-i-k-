import express from "express";
import { io } from "../server.js";
import FeeConfig from "../models/FeeConfig.js";
import FeeHistory from "../models/FeeHistory.js";
import Booking from "../models/Booking.js";
import mongoose from "mongoose";

const router = express.Router();

// GET /api/fees/config - Lấy phí hiện tại
router.get("/config", async (req, res) => {
  try {
    // ✅ Lấy bản ghi mới nhất theo createdAt
    const latestFee = await FeeHistory.findOne()
      .sort({ createdAt: -1 })
      .lean();

    console.log("✅ [GET /config] Latest fee:", {
      percent: latestFee?.newPercent,
      createdAt: latestFee?.createdAt,
      _id: latestFee?._id,
    });

    const currentPercent = latestFee?.newPercent || 0;

    res.json({
      success: true,
      fee: {
        percent: currentPercent,
        appliedAt: latestFee?.appliedAt || null
      }
    });
  } catch (err) {
    console.error("❌ [GET /config] Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/fees/update - Cập nhật phí + emit event
router.put("/update", async (req, res) => {
  try {
    const { newPercent, adminId, appliedAt } = req.body;
    
    console.log("🚀 [PUT /update] REQUEST:", { newPercent, adminId, appliedAt });

    const lastFee = await FeeHistory.findOne().sort({ createdAt: -1 }).lean();
    
    const newFeeRecord = new FeeHistory({
      oldPercent: lastFee?.newPercent || 0,
      newPercent,
      appliedAt: new Date(appliedAt),
      updatedBy: adminId || "admin",
    });

    await newFeeRecord.save();
    
    console.log("✅ [SAVED]:", {
      _id: newFeeRecord._id,
      newPercent: newFeeRecord.newPercent,
      createdAt: newFeeRecord.createdAt,
    });

    res.json({
      success: true,
      message: "Cập nhật phí thành công!",
      fee: { percent: newPercent }
    });
  } catch (err) {
    console.error("❌ ERROR:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/fees/history - Lấy lịch sử phí
router.get("/history", async (req, res) => {
  try {
    const history = await FeeHistory.find()
      .sort({ appliedAt: -1 })
      .limit(50);

    return res.json({
      success: true,
      history
    });
  } catch (err) {
    console.error("❌ [GET /history] Error:", err.message);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// GET /api/fees/bookings/:percent - Lấy booking theo % phí
router.get("/bookings/:percent", async (req, res) => {
  try {
    const { percent } = req.params;
    const feePercent = parseFloat(percent);

    console.log(`🔍 Fetching bookings with feePercent: ${feePercent}`);

    if (isNaN(feePercent)) {
      return res.status(400).json({
        success: false,
        message: "Phần trăm phí không hợp lệ"
      });
    }

    const bookings = await Booking.find({ feePercent: feePercent })
      .populate("tripId")
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Found ${bookings.length} bookings with fee ${feePercent}%`);

    const formatted = bookings.map(b => {
      const price = b.finalTotal || b.totalPrice || 0;
      const serviceFee = b.serviceFeeAmount || (price * (feePercent / 100));

      return {
        _id: b._id,
        hoTen: b.hoTen || b.name,
        name: b.name,
        sdt: b.sdt,
        soGhe: b.soGhe || [],
        totalPrice: b.totalPrice || 0,
        finalTotal: price,
        serviceFeeAmount: serviceFee,
        feePercent: feePercent,
        status: b.status || "pending",
        paymentMethod: b.paymentMethod || "unknown",
        tenChuyen: b.tripId?.tenChuyen || "N/A",
        ngayKhoiHanh: b.tripId?.ngayKhoiHanh || "N/A",
        gioKhoiHanh: b.tripId?.gioKhoiHanh || "N/A",
        feeAppliedAt: b.feeAppliedAt || b.createdAt,
        createdAt: b.createdAt
      };
    });

    return res.json({
      success: true,
      percent: feePercent,
      bookings: formatted,
      total: formatted.length
    });
  } catch (err) {
    console.error("❌ [GET /bookings/:percent] Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy dữ liệu",
      error: err.message
    });
  }
});

export default router;
