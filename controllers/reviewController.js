import mongoose from "mongoose";
import Review from "../models/Review.js";
import Booking from "../models/Booking.js";

// ⭐ Import Socket.IO từ server
import { io, onlineUsers } from "../server.js";

const ObjectId = mongoose.Types.ObjectId;

/* ============================================================
   1) USER ADD REVIEW
============================================================ */
export const addReview = async (req, res) => {
  try {
    console.log("BE (Controller) nhận được bookingId:", req.body.bookingId);
    const {
      bookingId,
      userId,
      rating,
      comment,
      imageUrl,
      hoTen,
      sdt,
      tenChuyen,
      ngayKhoiHanh,
      gioKhoiHanh,
      soGhe,
      totalPrice,
      tu,
      den,
      tripId,
      initialMessages,
    } = req.body;

    if (!bookingId || !userId) {
      return res.status(400).json({ message: "Thiếu bookingId hoặc userId" });
    }

    /* ⭐ Lấy partnerId từ booking */
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking không tồn tại" });
    }

    const newReview = new Review({
      bookingId,
      userId,
      partnerId: booking.partnerId,
      rating: Number(rating) || 0,
      comment: comment || "",
      hoTen,
      sdt,
      tenChuyen,
      ngayKhoiHanh,
      gioKhoiHanh,
      soGhe: Array.isArray(soGhe) ? soGhe.map(String) : [],
      totalPrice,
      tu,
      den,
      tripId: tripId ? new ObjectId(tripId) : null,
    });

    /* ⭐ Tin nhắn mặc định khi tạo review */
    if (comment?.trim() || imageUrl) {
      newReview.messages.push({
        sender: "user",
        text: comment || "",
        imageUrl: imageUrl || null,
        createdAt: new Date(),
        senderId: userId,
        senderName: hoTen,
      });
    }

    /* ⭐ Messages thêm từ FE */
    if (Array.isArray(initialMessages)) {
      initialMessages.forEach((m) =>
        newReview.messages.push({
          sender: m.sender,
          text: m.text || "",
          imageUrl: m.imageUrl || null,
          createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
          senderId: m.senderId,
          senderName: m.senderName,
        })
      );
    }

    await newReview.save();

    /* ⭐ Gửi socket cho partner khi user tạo review */
    const partnerSocket = onlineUsers.get(booking.partnerId);
    if (partnerSocket) {
      io.to(partnerSocket).emit("review:new-message", newReview);
    }

    res.status(201).json(newReview);

  } catch (err) {
    console.error("❌ addReview:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   2) GET REVIEWS
============================================================ */
export const getAllReviews = async (_, res) => {
  try {
    const reviews = await Review.find().lean();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getReviewByBooking = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;

    const review = await Review.findOne({ bookingId });
    res.json(review || null);

  } catch (err) {
    console.error("❌ getReviewByBooking:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getReviewByUserBooking = async (req, res) => {
  try {
    const { bookingId, userId } = req.params;

    const review = await Review.findOne({
      bookingId,
      userId,
    });

    res.json(review || null);

  } catch (err) {
    console.error("❌ getReviewByUserBooking:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getReviewByUserId = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.params.userId }).lean();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ⭐ partnerId dùng string */
export const getReviewByPartnerId = async (req, res) => {
  try {
    const partnerId = req.params.partnerId;

    const reviews = await Review.find({ partnerId }).lean();
    res.json(reviews);

  } catch (err) {
    console.error("❌ getReviewByPartnerId:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   3) DELETE REVIEW
============================================================ */
export const deleteReview = async (req, res) => {
  try {
    const deleted = await Review.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ message: "Không tìm thấy review" });

    res.json({ message: "Đã xoá review" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   4) PARTNER REPLY (Socket realtime)
============================================================ */
export const partnerReplyReview = async (req, res) => {
  try {
    const { text, imageUrl, partnerId, partnerName } = req.body;

    if (!text?.trim() && !imageUrl) {
      return res.status(400).json({ message: "Nội dung trống" });
    }

    const review = await Review.findById(req.params.id);
    if (!review)
      return res.status(404).json({ message: "Không tìm thấy review" });

    review.messages.push({
      sender: "partner",
      text: text || "",
      imageUrl: imageUrl || null,
      createdAt: new Date(),
      senderId: partnerId,
      senderName: partnerName,
    });

    await review.save();

    /* ⭐ Gửi socket cho USER */
    const userSocket = onlineUsers.get(review.userId);
    if (userSocket) {
      io.to(userSocket).emit("review:new-message", review);
    }

    res.json({ data: review });

  } catch (err) {
    console.log("❌ partnerReply:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   5) USER REPLY (Socket realtime)
============================================================ */
export const userReplyReview = async (req, res) => {
  try {
    const { text, imageUrl, userId, userName } = req.body;

    if (!text?.trim() && !imageUrl) {
      return res.status(400).json({ message: "Nội dung trống" });
    }

    const review = await Review.findById(req.params.id);
    if (!review)
      return res.status(404).json({ message: "Không tìm thấy review" });

    review.messages.push({
      sender: "user",
      text: text || "",
      imageUrl: imageUrl || null,
      createdAt: new Date(),
      senderId: userId,
      senderName: userName,
    });

    await review.save();

    /* ⭐ Gửi socket cho PARTNER */
    const partnerSocket = onlineUsers.get(review.partnerId);
    if (partnerSocket) {
      io.to(partnerSocket).emit("review:new-message", review);
    }

    res.json({ data: review });

  } catch (err) {
    console.log("❌ userReply:", err);
    res.status(500).json({ message: "Server error" });
  }
};
