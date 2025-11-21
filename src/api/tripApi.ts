import axios from "axios";

const API_URL = "http://localhost:5000/api/trips";

// ✅ Lấy tất cả chuyến xe
export const getAllTrips = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

// ✅ Tạo chuyến xe (gửi JSON, không dùng FormData)
export const createTrip = async (tripData: any) => {
  const res = await axios.post(API_URL, tripData); // gửi JSON
  return res.data;
};

// ✅ Cập nhật chuyến xe
export const updateTrip = async (id: string, tripData: any) => {
  const res = await axios.put(`${API_URL}/${id}`, tripData); // gửi JSON
  return res.data;
};

// ✅ Cập nhật bookedSeats (giữ nguyên)
export const updateTripBookedSeats = async (id: string, bookedSeats: string[]) => {
  console.log("📤 Gửi request cập nhật bookedSeats:", {
    id,
    bookedSeats,
    type: typeof bookedSeats,
    isArray: Array.isArray(bookedSeats),
  });

  const res = await axios.put(`${API_URL}/${id}`, { bookedSeats });

  console.log("📥 Response từ backend:", {
    status: res.status,
    data: res.data,
    bookedSeatsInResponse: res.data?.bookedSeats,
  });

  return res.data;
};

// ✅ Xóa chuyến xe
export const deleteTrip = async (id: string) => {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.data;
};

// ✅ Lấy chi tiết chuyến (để lấy partnerId của chuyến)
export const getTripById = async (id: string) => {
  const res = await axios.get(`${API_URL}/${id}`);
  return res.data;
};
