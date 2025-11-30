import axios from "axios";

// 🔹 URL gốc backend
const API_URL = "http://localhost:5000/api/promotions";

// 🟢 [GET] Lấy tất cả mã giảm giá (có thể lọc theo nhà xe)
export const getPromotions = async (partnerId?: string) => {
  try {
    const res = await axios.get(API_URL, {
      params: partnerId ? { partnerId } : undefined,
    });
    return res.data; // Trả về mảng promotions
  } catch (err: any) {
    console.error("❌ Lỗi khi lấy danh sách khuyến mãi:", err.response?.data || err.message);
    throw err;
  }
};

// 🟢 [POST] Tạo khuyến mãi mới (có upload ảnh)
export const createPromotion = async (promotionData: FormData) => {
  try {
    const res = await axios.post(API_URL, promotionData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data; // { message, promotion }
  } catch (err: any) {
    console.error("❌ Lỗi khi tạo khuyến mãi:", err.response?.data || err.message);
    throw err;
  }
};

export const generatePromotionPreview = async (payload: {
  code: string;
  discountType: "percentage" | "amount";
  discountValue: number;
  maxUsage: number;
  startDate: string;
  endDate: string;
  description: string;
  partnerName: string;
  autoImage: boolean;
  autoDescription: boolean;
  descriptionHint: string;
}) => {
  const res = await axios.post(`${API_URL}/preview`, payload);
  return res.data;
};

// 🗑️ [DELETE] Xóa khuyến mãi theo ID
export const deletePromotion = async (id: string, partnerId?: string) => {
  try {
    const res = await axios.delete(`${API_URL}/${id}`, {
      params: partnerId ? { partnerId } : undefined,
    });
    return res.data; // { message: "✅ Xóa khuyến mãi thành công" }
  } catch (err: any) {
    console.error("❌ Lỗi khi xóa khuyến mãi:", err.response?.data || err.message);
    throw err;
  }
};
// 🎟️ [POST] Áp dụng mã khuyến mãi
export const applyPromotion = async (
  code: string,
  totalAmount: number,
  partnerId: string
) => {
  try {
    const res = await axios.post(`${API_URL}/apply`, {
      code,
      totalAmount,
      partnerId,
    });
    return res.data; 
    // Trả về: { message, code, discount, newTotal }
  } catch (err: any) {
    console.error("❌ Lỗi khi áp dụng khuyến mãi:", err.response?.data || err.message);
    throw err;
  }
};
