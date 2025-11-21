import axios from "axios";

const API_URL = "http://localhost:5000/api/points";

// Lấy điểm hiện tại của user
export const getPointsByUser = async (userId: string) => {
  try {
    const res = await axios.get(`${API_URL}/${userId}`);
    return res.data;
  } catch (err) {
    console.error("❌ Lỗi khi lấy điểm:", err);
    throw err;
  }
};

// Cộng điểm cho user
export const addPoints = async (userId: string, pointsToAdd: number) => {
  try {
    const res = await axios.post(`${API_URL}/add`, { userId, pointsToAdd });
    return res.data;
  } catch (err) {
    console.error("❌ Lỗi khi cộng điểm:", err);
    throw err;
  }
};

// Trừ điểm của user
export const subtractPoints = async (userId: string, pointsToSubtract: number) => {
  try {
    const res = await axios.post(`${API_URL}/subtract`, { userId, pointsToSubtract });
    return res.data;
  } catch (err) {
    console.error("❌ Lỗi khi trừ điểm:", err);
    throw err;
  }
};
