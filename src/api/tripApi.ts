// 📁 src/api/tripApi.ts
import axios from "axios";

const API_URL = "http://localhost:5000/api/trips"; // ✅ đúng port backend

// 🔹 Lấy tất cả chuyến
export const getAllTrips = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

// 🔍 Lấy chuyến theo id
export const getTripById = async (id: string) => {
  return axios.get(`${API_URL}/${id}`);
};
// 🔹 Tạo chuyến mới
export const createTrip = async (tripData: any, isFormData = false) => {
  const headers = isFormData ? { "Content-Type": "multipart/form-data" } : {};
  const res = await axios.post(API_URL, tripData, { headers });
  return res.data;
};

// 🔹 Cập nhật chuyến
export const updateTrip = async (
  id: string,
  tripData: any,
  isFormData = false
) => {
  const headers = isFormData ? { "Content-Type": "multipart/form-data" } : {};
  const res = await axios.put(`${API_URL}/${id}`, tripData, { headers });
  return res.data;
};

// 🔹 Xóa chuyến
export const deleteTrip = async (id: string) => {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.data;
};

// 🔹 Tìm chuyến theo điểm đi, điểm đến, ngày
export const searchTrips = async (from: string, to: string, date: string) => {
  try {
    const res = await axios.get(API_URL, {
      params: { from, to, date },
    });
    return res.data;
  } catch (error: any) {
    console.error("❌ Lỗi khi tìm chuyến:", error.response?.data || error.message);
    throw error;
  }
};
