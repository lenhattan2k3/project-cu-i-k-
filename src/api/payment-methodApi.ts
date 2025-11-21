import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/payment-method"; // đổi theo URL backend của bạn

export interface PaymentStatus {
  _id: string;
  bookingId: string;
  status: "pending" | "paid" | "cancelled" | "refunded";
  paymentMethod: "card" | "bank" | "cash";
  reason?: string;
  updatedAt: string;
}

export interface UpdatePaymentStatusData {
  status: "pending" | "paid" | "cancelled" | "refunded";
  paymentMethod: "card" | "bank" | "cash";
  reason?: string;
}

// Lấy trạng thái thanh toán của booking
export const getPaymentStatus = async (bookingId: string): Promise<PaymentStatus> => {
  const res = await axios.get(`${API_BASE_URL}/${bookingId}`);
  if (!res.data.success) {
    throw new Error(res.data.message || "Lỗi khi lấy trạng thái thanh toán");
  }

  // nếu paymentMethod null, mặc định cash
  const paymentData: PaymentStatus = {
    ...res.data.data,
    paymentMethod: res.data.data.paymentMethod || "cash",
  };

  return paymentData;
};

// Cập nhật trạng thái thanh toán
export const updatePaymentStatus = async (
  bookingId: string,
  data: UpdatePaymentStatusData
): Promise<PaymentStatus> => {
  const res = await axios.put(`${API_BASE_URL}/${bookingId}`, data);
  if (!res.data.success) {
    throw new Error(res.data.message || "Lỗi khi cập nhật trạng thái thanh toán");
  }

  // nếu paymentMethod null, mặc định cash
  const updatedData: PaymentStatus = {
    ...res.data.bookingStatus,
    paymentMethod: res.data.bookingStatus.paymentMethod || "cash",
  };

  return updatedData;
};
