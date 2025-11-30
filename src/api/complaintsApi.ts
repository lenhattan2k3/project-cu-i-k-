// src/api/complaintsApi.ts
import axios from "axios";

const API_URL = "http://localhost:5000/api/complaints"; // 🔹 URL backend của bạn

// 🟢 Gửi khiếu nại mới
export const sendComplaint = async (data: {
  senderId: string;
  senderRole: "admin" | "partner" | "user";
  receiverRole: "admin" | "partner" | "user";
  receiverId?: string;
  message: string;
}) => {
  const res = await axios.post(API_URL, data);
  return res.data;
};

// 🟢 Lấy danh sách khiếu nại theo role hoặc receiverId
export const getComplaintsByRole = async (
  role: "admin" | "partner" | "user" | string,
  options?: { senderId?: string }
) => {
  const params = new URLSearchParams();
  if (options?.senderId) {
    params.append("senderId", options.senderId);
  }

  const query = params.toString();
  const res = await axios.get(`${API_URL}/${role}${query ? `?${query}` : ""}`);
  return res.data;
};

// 🟢 Phản hồi khiếu nại
export const replyComplaint = async (
  complaintId: string,
  data: {
    senderId: string;
    senderRole: "admin" | "partner" | "user";
    message: string;
  }
) => {
  const res = await axios.post(`${API_URL}/${complaintId}/reply`, data);
  return res.data;
};
