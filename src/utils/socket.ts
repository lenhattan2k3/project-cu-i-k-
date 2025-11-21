import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:5000"; 
// Nếu deploy => đổi thành: "https://api.vexe.pro" (ví dụ)

export const socket = io(SERVER_URL, {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  timeout: 20000,
  autoConnect: true,
});

// 📌 Gửi userId lên server để đăng ký socket
export function registerUser(userId: string) {
  if (!userId) return;
  console.log("🔗 Register user socket:", userId);
  socket.emit("registerUser", userId);
}
