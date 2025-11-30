// File: src/api/reviewApi.ts

import axios from "axios";

const API_URL = "http://localhost:5000/api/review";

/* ============================================================
   TYPES
============================================================ */
export interface Message {
  sender: "user" | "partner";
  senderName?: string;
  text: string;
  imageUrl?: string;
  createdAt?: string;
  senderId?: string;
  _id?: string;
}

export interface Review {
  _id?: string;
  bookingId: string;
  userId: string;
  tripId: string;
  partnerId?: string;
  rating: number;
  comment: string;
  createdAt?: string;

  hoTen?: string;
  sdt?: string;
  tenChuyen?: string;
  ngayKhoiHanh?: string;
  gioKhoiHanh?: string;
  soGhe?: number[];
  totalPrice?: number;
  tu?: string;
  den?: string;

  messages?: Message[];
  reply?: string;

  imageUrl?: string;
}

/* ============================================================
   HELP ERROR
============================================================ */
const handleError = (error: any, defaultMessage: string) => {
  const message = error?.response?.data?.message || defaultMessage;
  console.error("❌ API ERROR:", message, error);
  throw { message };
};

/* ============================================================
   1) ADD REVIEW
============================================================ */
export const addReview = async (reviewData: Review) => {
  try {
    const res = await axios.post(API_URL, reviewData);
    return res.data;
 // FIXED
  } catch (error) {
    handleError(error, "Lỗi khi thêm đánh giá");
  }
};

/* ============================================================
   2) GET ALL REVIEWS
============================================================ */
export const getAllReviews = async () => {
  try {
    const res = await axios.get(API_URL);
     return res.data;
// FIXED
  } catch (error) {
    handleError(error, "Lỗi lấy tất cả đánh giá");
  }
};

/* ============================================================
   3) GET REVIEW BY BOOKING
============================================================ */
export const getReviewByBooking = async (bookingId: string) => {
  try {
    const res = await axios.get(`${API_URL}/booking/${bookingId}`);
    return res.data;   // FIXED
  } catch (error) {
    handleError(error, "Lỗi lấy theo booking");
  }
};


/* ============================================================
   4) GET REVIEW BY USER + BOOKING
============================================================ */
export const getReviewByUserBooking = async (bookingId: string, userId: string) => {
  try {
    const res = await axios.get(`${API_URL}/${bookingId}/user/${userId}`);
   return res.data;
 // FIXED
  } catch (error) {
    handleError(error, "Lỗi lấy đánh giá theo user + booking");
  }
};

/* ============================================================
   5) GET REVIEW BY USER ID
============================================================ */
export const getReviewByUserId = async (userId: string) => {
  try {
    const res = await axios.get(`${API_URL}/user/${userId}`);
    return res.data;   // FIXED
  } catch (error) {
    handleError(error, "Lỗi lấy đánh giá theo userId");
  }
};


/* ============================================================
   6) GET REVIEW BY PARTNER ID
============================================================ */
export const getReviewByPartnerId = async (partnerId: string) => {
  try {
    const res = await axios.get(`${API_URL}/partner/${partnerId}`);
    return res.data;   // FIXED
  } catch (error) {
    handleError(error, "Lỗi lấy đánh giá theo partnerId");
  }
};


/* ============================================================
   7) DELETE REVIEW
============================================================ */
export const deleteReview = async (id: string) => {
  try {
    const res = await axios.delete(`${API_URL}/${id}`);
   return res.data;
 // FIXED
  } catch (error) {
    handleError(error, "Lỗi khi xoá đánh giá");
  }
};

/* ============================================================
   8) PARTNER REPLY
============================================================ */
export const partnerReply = async (
  reviewId: string,
  text: string,
  imageUrl?: string,
  partnerId?: string,
  partnerName?: string
) => {
  try {
    const payload = { text, imageUrl, partnerId, partnerName };
    const res = await axios.post(`${API_URL}/${reviewId}/partner-reply`, payload);
    return res.data;
 // FIXED
  } catch (error) {
    handleError(error, "Lỗi khi partner trả lời");
  }
};

/* ============================================================
   9) USER REPLY
============================================================ */
export const userReply = async (
  reviewId: string,
  text: string,
  imageUrl?: string,
  userId?: string,
  userName?: string
) => {
  try {
    const payload = { text, imageUrl, userId, userName };
    const res = await axios.post(`${API_URL}/${reviewId}/user-reply`, payload);
   return res.data;
 // FIXED
  } catch (error) {
    handleError(error, "Lỗi khi user trả lời");
  }
};

/* ============================================================
   10) RECALL MESSAGE
============================================================ */
export const recallReviewMessage = async (
  reviewId: string,
  messageId: string,
  userId: string,
  createdAt?: string
) => {
  try {
    const payload = { messageId, userId, createdAt };
    const res = await axios.post(`${API_URL}/${reviewId}/recall`, payload);
    return res.data;
  } catch (error) {
    handleError(error, "Lỗi khi thu hồi tin nhắn");
  }
};
