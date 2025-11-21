import axios from "axios";
import { socket } from "../utils/socket"; // ✅ import thêm

const API_URL = "http://localhost:5000/api/notifications";

// 🟢 Gửi thông báo mới (Admin)
// Flow: Admin tạo → Lưu vào BE → Backend emit realtime → User/Partner nhận được
export const createNotification = async (data: {
  title: string;
  content: string;
   image?: string; // ✅ thêm dòng này
  sender: string;
  receivers?: string[]; // ["user"], ["partner"], ["admin"], ["all"]
}) => {
  // 1️⃣ Gửi lưu vào MongoDB qua API
  const res = await axios.post(API_URL, data);

  // 2️⃣ Gửi realtime qua Socket.IO
  // Backend sẽ nhận event "send_notification" và emit "receive_notification" cho tất cả clients
  socket.emit("send_notification", res.data); // 🔥 trigger realtime notification

  return res.data;
};

// 🟢 Lấy thông báo cho từng role
export const getNotificationsByRole = async (role: string) => {
  const res = await axios.get(`${API_URL}/${role}`);
  return res.data;
};

// 🟢 Alias
export const getNotifications = async (role: string) => {
  return getNotificationsByRole(role);
};

// 🟠 Xóa thông báo
export const deleteNotification = async (id: string) => {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.data;
};
