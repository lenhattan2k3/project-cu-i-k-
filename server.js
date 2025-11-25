import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import tripRoutes from "./routes/tripRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import promotionRoutes from "./routes/promotionRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import messagesRoutes from "./routes/messagesRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import bankRoutes from "./routes/bankRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import pointRoutes from "./routes/pointRoutes.js";
import paymentMethodRoutes from "./routes/paymentMethodRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import feeRoutes from "./routes/feeRoutes.js";
import payosRoutes from "./routes/payosRoutes.js";
import withdrawalRoutes from "./routes/withdrawalRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
// Default JSON parser for most routes
app.use(express.json());

// ⚙️ HTTP + Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// 🟩 Lưu socketId theo userId
const onlineUsers = new Map();

// 🚀 SOCKET IO CONNECTION
io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  socket.on("registerUser", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`✔ User ${userId} registered with socket: ${socket.id}`);
  });

  socket.on("disconnect", () => {
    for (const [uid, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        onlineUsers.delete(uid);
        console.log(`🔴 User ${uid} disconnected`);
        break;
      }
    }
  });
});

// EXPORT socket cho controller sử dụng
export { io, onlineUsers };

// MongoDB
mongoose
  .connect(process.env.MONGO_URI, { dbName: "ve_xe" })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// Simple request logger
app.use((req, _, next) => {
  console.log(`📍 ${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api/trips", tripRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/bank", bankRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/points", pointRoutes);
app.use("/api/payment-method", paymentMethodRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/stats", statsRoutes);

app.use("/api/fees", feeRoutes);

app.use("/api/payos", payosRoutes);

// add these two so FE requests match both paths
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/withdraws", withdrawalRoutes); // compatibility with frontend

// Fallback route
app.use((req, res) => res.status(404).json({ message: "Not found" }));

// Run server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
