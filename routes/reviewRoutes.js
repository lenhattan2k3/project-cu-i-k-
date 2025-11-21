import express from "express";
import {
  addReview,
  getAllReviews,
  getReviewByBooking,
  getReviewByUserBooking,
  getReviewByUserId,
  getReviewByPartnerId,
  deleteReview,
  partnerReplyReview,
  userReplyReview,
} from "../controllers/reviewController.js";

const router = express.Router();

/* ============================================================
   CREATE REVIEW
============================================================ */
router.post("/", addReview);

/* ============================================================
   GET REVIEWS
============================================================ */
router.get("/", getAllReviews);

/* Lấy review theo Booking */
router.get("/booking/:bookingId", getReviewByBooking);

/* Lấy tất cả review của User */
router.get("/user/:userId", getReviewByUserId);

/* Lấy tất cả review của Partner */
router.get("/partner/:partnerId", getReviewByPartnerId);

/* Lấy review theo Booking + UserId (xem chi tiết 1 review duy nhất) */
router.get("/:bookingId/user/:userId", getReviewByUserBooking);

/* ============================================================
   DELETE REVIEW
============================================================ */
router.delete("/:id", deleteReview);

/* ============================================================
   REPLY REVIEW (USER & PARTNER)
============================================================ */
router.post("/:id/partner-reply", partnerReplyReview);
router.post("/:id/user-reply", userReplyReview);

export default router;
