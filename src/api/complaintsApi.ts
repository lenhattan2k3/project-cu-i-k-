// src/api/complaintsApi.ts
import axios from "axios";

const API_URL = "http://localhost:5000/api/complaints"; // 🔹 URL backend của bạn

// 🟢 Gửi khiếu nại mới
export const sendComplaint = async (data: {
  senderId: string;
  receiverRole: "admin" | "partner";
  message: string;
}) => {
  const res = await axios.post(API_URL, data);
  return res.data;
};

// 🟢 Lấy danh sách khiếu nại theo role
export const getComplaintsByRole = async (role: "admin" | "partner" | "user") => {
  const res = await axios.get(`${API_URL}/${role}`);
  return res.data;
};
