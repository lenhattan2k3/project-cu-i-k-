import mongoose from "mongoose";

const tripSchema = new mongoose.Schema({
  tenChuyen: { type: String, required: true },
  tu: { type: String, required: true },
  den: { type: String, required: true },
  ngayKhoiHanh: String,
  gioKhoiHanh: String,
  giaVe: { type: Number, required: true },
  soLuongGhe: { type: Number, required: true },
  nhaXe: { type: String, required: true },
  trangThai: { type: String, default: "Hoạt động" },
  hinhAnh: String, // lưu đường dẫn ảnh
});

const Trip = mongoose.model("Trip", tripSchema);
export default Trip;
