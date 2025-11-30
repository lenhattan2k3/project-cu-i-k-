import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
const API_URL = `${API_BASE}/api/payment`;

// User thanh toán
export const markAsPaid = async (bookingId: string) => {
  const res = await axios.patch(`${API_URL}/mark-paid/${bookingId}`);
  return res.data;
};

// Lấy danh sách thanh toán của user
export const getUserPayments = async (userId: string) => {
  const res = await axios.get(`${API_URL}/user/${userId}`);
  return res.data;
};
