// src/api/feeApi.ts
import axios from "axios";

const API_URL = "http://localhost:5000/api/fees"; 
// Nếu bạn mount router khác (vd: /api/v1/fee), sửa lại đường dẫn trên

// ✅ Lấy phí hiện tại
export const getFeeConfig = async () => {
  try {
    const res = await axios.get(`${API_URL}/config`);
    console.log("✅ getFeeConfig:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("❌ Lỗi lấy phí:", error);
    throw error;
  }
};

// ✅ Cập nhật phí
export const updateFeeConfig = async (
  newPercent: number,
  adminId: string,
  appliedDate: string
) => {
  try {
    console.log("🚀 updateFeeConfig request:", { 
      newPercent, 
      adminId, 
      appliedDate,
      endpoint: `${API_URL}/update`
    });
    
    const res = await axios.put(`${API_URL}/update`, {
      newPercent,
      adminId,
      appliedAt: appliedDate  // ⚠️ Must be "appliedAt" not "appliedDate"
    });
    
    console.log("✅ updateFeeConfig response:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("❌ Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
};

// ✅ Lấy lịch sử phí
export const getFeeHistory = async () => {
  try {
    const res = await axios.get(`${API_URL}/history`);
    console.log("✅ getFeeHistory:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("❌ Lỗi lấy lịch sử phí:", error);
    throw error;
  }
};

// ✅ Lấy booking theo % phí (FIX: Sử dụng /bookings/:percent)
export const getBookingsByPercent = async (percent: number) => {
  try {
    console.log("🚀 getBookingsByPercent - Request với percent:", percent);
    
    const res = await axios.get(`${API_URL}/bookings/${percent}`);
    
    console.log("✅ getBookingsByPercent response:", {
      status: res.status,
      data: res.data,
      bookingsCount: res.data?.bookings?.length || 0
    });
    
    return res.data;
  } catch (error: any) {
    console.error("❌ Lỗi lấy booking theo phí:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
};

export default {
  getFeeConfig,
  updateFeeConfig,
  getFeeHistory,
  getBookingsByPercent,
};
