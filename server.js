import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import tripRoutes from "./routes/tripRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// static folder để phục vụ ảnh
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// routes
app.use("/api/trips", tripRoutes);
app.use("/api/bookings", bookingRoutes);
// connect Mongo
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
