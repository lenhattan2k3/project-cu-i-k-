// File: src/api/payosApi.ts
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================
// 1. Tạo link thanh toán PayOS
// ============================
export const createPaymentLink = async (
  userId: string,      // người thanh toán
  bookingId: string,   // booking liên quan
  amount: number,
  description: string,
  orderCode: number
) => {
  try {
    const res = await API.post("/payos/create-payment", {
      userId,
      bookingId,
      amount,
      description,
      orderCode,
    });

    return res.data; // BE trả về { success, paymentLink, payment }
  } catch (error: any) {
    console.error("❌ createPaymentLink Error:", error.response?.data || error.message);
    throw error;
  }
};

// ============================
// 2. Kiểm tra trạng thái thanh toán (nếu cần)
// ============================
export const getPaymentStatus = async (orderCode: number) => {
  try {
    const res = await API.get(`/payos/payment-status/${orderCode}`);
    return res.data;
  } catch (error: any) {
    console.error("❌ getPaymentStatus Error:", error.response?.data || error.message);
    throw error;
  }
};

// ============================
// 3. API rút tiền (nếu backend có /withdraw)
// ============================
export const requestWithdraw = async (
  partnerId: string,
  amount: number,
  bankAccount: string
) => {
  try {
    const res = await API.post("/payos/withdraw", {
      partnerId,
      amount,
      bankAccount,
    });

    return res.data;
  } catch (error: any) {
    console.error("❌ requestWithdraw Error:", error.response?.data || error.message);
    throw error;
  }
};
