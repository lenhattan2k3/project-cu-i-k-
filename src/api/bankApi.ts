import axios from "axios";

const API_URL = "http://localhost:5000/api/bank";

// 🏦 Liên kết ngân hàng
export const linkBank = async (data: {
  userId: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}) => {
  const res = await axios.post(`${API_URL}/link`, data);
  return res.data;
};

// 🔍 Lấy thông tin ngân hàng theo userId
export const getBankByUser = async (userId: string) => {
  const res = await axios.get(`${API_URL}/${userId}`);
  return res.data;
};

// ❌ Hủy liên kết ngân hàng
export const unlinkBank = async (userId: string) => {
  const res = await axios.patch(`${API_URL}/unlink/${userId}`);
  return res.data;
};
