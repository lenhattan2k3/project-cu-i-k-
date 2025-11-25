// config/payos.js
import { PayOS } from "@payos/node";
import dotenv from "dotenv";

dotenv.config();

const {
  PAYOS_CLIENT_ID,
  PAYOS_API_KEY,
  PAYOS_CHECKSUM_KEY
} = process.env;

if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY || !PAYOS_CHECKSUM_KEY) {
  throw new Error("❌ Missing PayOS environment variables");
}

// Khởi tạo PayOS ĐÚNG CHUẨN
const payos = new PayOS(
  PAYOS_CLIENT_ID,
  PAYOS_API_KEY,
  PAYOS_CHECKSUM_KEY
);

export default payos;
