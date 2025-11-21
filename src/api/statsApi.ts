// 📁 src/api/statsApi.ts
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/stats", // trỏ đến statsController
});

// ✅ Lấy dashboard tổng doanh thu + tổng vé partner
export const getPartnerDashboard = async (partnerId: string) => {
  try {
    const res = await API.get(`/dashboard/${partnerId}`);
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi getPartnerDashboard:", error);
    throw error;
  }
};

// ✅ Có thể thêm các API khác sau này
export const getPartnerTotalRevenue = async (partnerId: string) => {
  try {
    const res = await API.get(`/total/${partnerId}`);
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi getPartnerTotalRevenue:", error);
    throw error;
  }
};
