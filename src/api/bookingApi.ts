// 📁 src/api/bookingApi.ts
import axios from "axios";

const API_URL = "http://localhost:5000/api/bookings";

// ✅ Đặt vé
export const bookTicket = async (data: any) => {
  const res = await axios.post(`${API_URL}/book`, data);
  return res.data;
};

// ✅ Lấy vé theo userId
export const getBookingsByUser = async (userId: string) => {
  const res = await axios.get(`${API_URL}/user/${userId}`);
  return res.data;
};

// ✅ Hủy vé
export const cancelBooking = async (id: string) => {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.data;
};

// ✅ Cập nhật trạng thái vé
export const updateBookingStatus = async (id: string, status: string) => {
  const res = await axios.put(`${API_URL}/status/${id}`, { status });
  return res.data;
};

// ✅ Lấy danh sách ghế đã đặt
export const getBookedSeats = async (tripId: string) => {
  const res = await axios.get(`${API_URL}/trip/${tripId}/seats`);
  return res.data;
};
