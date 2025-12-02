import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
  {
    tenChuyen: { type: String, required: true },
    maTai: { type: String, default: "" },      // Mã tài
    bienSo: { type: String, default: "" },     // Biển số xe
    tienIch: { type: String, default: "" },    // Tiện ích (Wifi, Điều hòa...)
    loaiXe: { type: String, default: "" },     // Loại xe
    hangXe: { type: String, default: "" },     // Hãng xe
    mauSac: { type: String, default: "" },     // Màu sắc
    tu: { type: String, required: true },
    den: { type: String, required: true },
    ngayKhoiHanh: { type: String },
    gioKhoiHanh: { type: String },
    giaVe: { type: Number, required: true },
    soLuongGhe: { type: Number, required: true },
    nhaXe: { type: String, required: true },
    trangThai: { type: String, default: "Hoạt động" },
    hinhAnh: { type: String },                 // URL Cloudinary
    partnerId: { type: String, default: "" },  // Liên kết Firebase Auth UID
    
    // ✅ Thêm trường để quản lý ghế đã đặt
    bookedSeats: { type: [String], default: [] },
  },
  { timestamps: true }
);

const Trip = mongoose.model("Trip", tripSchema);
export default Trip;
