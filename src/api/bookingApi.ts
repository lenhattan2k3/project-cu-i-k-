// 📁 src/api/bookingApi.ts
import axios from "axios";

const API_URL = "http://localhost:5000/api/bookings";

// ✅ Đặt vé
export const bookTicket = async (data: any) => {
  try {
    console.log("🚀 [bookTicket] Dữ liệu gửi lên:", data);
    
    if (!data.userId) {
      console.error("❌ Lỗi: Thiếu userId");
      throw new Error("userId không tồn tại");
    }
    if (!data.tripId) {
      console.error("❌ Lỗi: Thiếu tripId");
      throw new Error("tripId không tồn tại");
    }
    if (!data.soGhe || data.soGhe.length === 0) {
      console.error("❌ Lỗi: Thiếu soGhe");
      throw new Error("soGhe không tồn tại");
    }

    const requestData: any = { ...data };
    
    if (data.soGhe !== undefined) {
      requestData.soGhe = Array.isArray(data.soGhe)
        ? data.soGhe.map((seat: any) => {
            const num = Number(seat);
            return Number.isFinite(num) && num > 0 ? num : seat;
          })
        : [Number(data.soGhe)];
    }
    
    console.log("✅ [bookTicket] Request data đã chuẩn bị:", requestData);
    
    const res = await axios.post(`${API_URL}/book`, requestData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log("✅ [bookTicket] Thành công! Response:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("❌ [bookTicket] Lỗi:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

// ✅ Lấy vé theo userId
export const getBookingsByUser = async (userId: string) => {
  const res = await axios.get(`${API_URL}/user/${userId}`);
  return res.data;
};
// ✅ Lấy thông tin 1 vé theo ID
// ✅ Lấy thông tin 1 vé theo ID (trả về object vé trực tiếp)
export const getBookingById = async (id: string) => {
  const res = await axios.get(`${API_URL}/${id}`);
  return res.data; // backend trả object nên trả thẳng
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

// ✅ Lấy danh sách ghế đã đặt (loại trừ booking đánh dấu)
export const getBookedSeats = async (tripId: string): Promise<string[]> => {
  if (!tripId) return [];

  try {
    const res = await axios.get(`${API_URL}/trip/${tripId}/seats`);
    const data = res.data;

    // 🟢 Backend trả về { bookedSeats: [...] }
    if (data && Array.isArray(data.bookedSeats)) {
      return data.bookedSeats.map(String);
    }

    // 🟢 Backend trả về mảng [{ soGhe: [...] }, ...]
    if (Array.isArray(data)) {
      // Loại trừ booking đánh dấu (marked seats) - chỉ lấy booking thật
      const realBookings = data.filter((item: any) => 
        !(item.hoTen === "_MARKED_SEATS_" && item.sdt === "_PARTNER_MARKED_")
      );
      
      const seats = realBookings.flatMap((item) =>
        Array.isArray(item.soGhe) ? item.soGhe.map(String) : []
      );
      return Array.from(new Set(seats)); // loại trùng
    }

    return [];
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách ghế đã đặt:", error);
    return [];
  }
};

// ✅ Lấy toàn bộ vé (cho Partner/Admin)
export const getAllBookings = async () => {
  const res = await axios.get(`${API_URL}`);
  return res.data;
};

// ✅ Cập nhật booking (ghế, tổng tiền, etc.)
export const updateBooking = async (id: string, data: { soGhe?: string[]; totalPrice?: number; userId?: string }) => {
  try {
    // Đảm bảo dữ liệu đúng format
    const requestData: any = {};
    
    if (data.soGhe !== undefined) {
      // Đảm bảo soGhe là array và convert to string array
      requestData.soGhe = Array.isArray(data.soGhe) 
        ? data.soGhe.map(String) 
        : [String(data.soGhe)];
    }
    
    if (data.totalPrice !== undefined) {
      requestData.totalPrice = Number(data.totalPrice);
    }

    // Backend yêu cầu userId khi update (validation)
    if (data.userId !== undefined) {
      requestData.userId = String(data.userId);
    }
    
    console.log("📤 Gửi dữ liệu cập nhật booking:", { id, data: requestData });
    
    const res = await axios.put(`${API_URL}/${id}`, requestData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log("✅ Cập nhật booking thành công:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("❌ Lỗi cập nhật booking:", error);
    console.error("❌ Response data:", error?.response?.data);
    console.error("❌ Request data:", error?.config?.data);
    throw error;
  }
};

// ✅ Lấy ghế đánh dấu cho trip (marked seats - partner đánh dấu ghế)
// Strategy: Lấy từ endpoint chuyên dụng hoặc từ booking đặc biệt
export const getMarkedSeats = async (tripId: string): Promise<string[]> => {
  if (!tripId) return [];

  try {
    // Strategy 1: Thử endpoint chuyên dụng (nếu backend đã implement)
    // Sử dụng validateStatus để không throw error cho 404 (expected behavior)
    try {
      const res = await axios.get(`${API_URL}/trip/${tripId}/marked-seats`, {
        validateStatus: (status) => status === 200 || status === 404 // Chỉ throw error nếu không phải 200 hoặc 404
      });
      
      // Nếu status 404, endpoint chưa có -> fallback
      if (res.status === 404) {
        throw { response: { status: 404 } };
      }
      
      const data = res.data;

      // Backend có thể trả về { markedSeats: [...] } hoặc array trực tiếp
      if (data && Array.isArray(data.markedSeats)) {
        return data.markedSeats.map(String);
      }

      if (Array.isArray(data)) {
        return data.map(String);
      }

      return [];
    } catch (endpointError: any) {
      // Nếu endpoint chuyên dụng chưa tồn tại (404), dùng Strategy 2
      // Đây là expected behavior, không phải lỗi - chỉ suppress error log
      if (endpointError?.response?.status === 404) {
        // Strategy 2: Tìm booking đặc biệt cho marked seats (fallback)
        try {
          const allBookings = await getAllBookings();
          const bookingsArray = Array.isArray(allBookings) ? allBookings : [];
          
          // Tìm booking đặc biệt cho marked seats
          const markedSeatsBooking = bookingsArray.find((b: any) => {
            const bookingTripId = (b.tripId as any)?._id || (b.tripId as any);
            return bookingTripId === tripId && 
                   b.hoTen === "_MARKED_SEATS_" && 
                   b.sdt === "_PARTNER_MARKED_";
          });

          if (markedSeatsBooking && Array.isArray(markedSeatsBooking.soGhe)) {
            const seats = markedSeatsBooking.soGhe.map(String);
            // Chỉ log khi có dữ liệu để tránh spam console
            if (seats.length > 0) {
              console.log("✅ Lấy ghế đánh dấu từ booking đặc biệt:", seats);
            }
            return seats;
          }
          
          return [];
        } catch (bookingError: any) {
          console.error("❌ Lỗi khi lấy booking đánh dấu:", bookingError);
          return [];
        }
      } else {
        // Lỗi khác (không phải 404), return empty array
        console.error("❌ Lỗi khi lấy ghế đánh dấu:", endpointError);
        return [];
      }
    }
  } catch (error) {
    // Chỉ log error thật sự (không phải 404 expected)
    console.error("❌ Lỗi khi lấy ghế đánh dấu:", error);
    return [];
  }
};

// ✅ Lưu ghế đánh dấu cho trip (mark seats - partner đánh dấu ghế)
// Strategy: Tạo/cập nhật một booking đặc biệt với hoTen = "_MARKED_SEATS_" để lưu marked seats
export const saveMarkedSeats = async (tripId: string, markedSeats: string[]) => {
  try {
    // Đảm bảo markedSeats là array và convert to string array
    const seatsToSave = Array.isArray(markedSeats) 
      ? markedSeats.map(String).filter(seat => seat && seat.trim() !== '')
      : [];
    
    console.log("📤 Gửi request lưu ghế đánh dấu:", {
      tripId,
      markedSeats: seatsToSave,
      count: seatsToSave.length,
    });
    
    // Strategy 1: Thử endpoint chuyên dụng (nếu backend đã implement)
    try {
      const res = await axios.post(`${API_URL}/trip/${tripId}/marked-seats`, 
        { markedSeats: seatsToSave },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      console.log("✅ Lưu ghế đánh dấu thành công (endpoint chuyên dụng):", res.data);
      return res.data;
    } catch (endpointError: any) {
      // Nếu endpoint chuyên dụng chưa tồn tại (404), dùng Strategy 2
      if (endpointError?.response?.status === 404) {
        console.log("⚠️ Endpoint chuyên dụng chưa có, dùng booking đặc biệt...");
        
        // Strategy 2: Tạo/cập nhật booking đặc biệt để lưu marked seats
        try {
          // Lấy tất cả bookings của trip
          const allBookings = await getAllBookings();
          const bookingsArray = Array.isArray(allBookings) ? allBookings : [];
          
          // Tìm booking đặc biệt cho marked seats (nếu có)
          const markedSeatsBooking = bookingsArray.find((b: any) => {
            const bookingTripId = (b.tripId as any)?._id || (b.tripId as any);
            return bookingTripId === tripId && 
                   b.hoTen === "_MARKED_SEATS_" && 
                   b.sdt === "_PARTNER_MARKED_";
          });

          if (markedSeatsBooking) {
            // Cập nhật booking đặc biệt đã tồn tại
            console.log("🔄 Cập nhật booking đánh dấu đã tồn tại:", markedSeatsBooking._id);
            const updateRes = await updateBooking(markedSeatsBooking._id, {
              soGhe: seatsToSave,
              totalPrice: 0, // Marked seats không tính tiền
              userId: markedSeatsBooking.userId || "PARTNER_MARKED", // Fallback userId
            });
            console.log("✅ Cập nhật booking đánh dấu thành công:", updateRes);
            return updateRes;
          } else {
            // Tạo booking đặc biệt mới
            console.log("➕ Tạo booking đánh dấu mới...");
            const createRes = await bookTicket({
              tripId: tripId,
              hoTen: "_MARKED_SEATS_", // Flag để nhận biết đây là booking đánh dấu
              sdt: "_PARTNER_MARKED_", // Flag để nhận biết
              soGhe: seatsToSave,
              userId: "PARTNER_MARKED", // Hoặc lấy từ session/context
              totalPrice: 0, // Marked seats không tính tiền
              status: "marked", // Trạng thái đặc biệt
            });
            console.log("✅ Tạo booking đánh dấu thành công:", createRes);
            return createRes;
          }
        } catch (bookingError: any) {
          console.error("❌ Lỗi khi tạo/cập nhật booking đánh dấu:", bookingError);
          throw bookingError;
        }
      } else {
        // Lỗi khác (không phải 404), throw error
        throw endpointError;
      }
    }
  } catch (error: any) {
    console.error("❌ Lỗi lưu ghế đánh dấu:", error);
    console.error("❌ Response data:", error?.response?.data);
    throw error;
  }
};
// ✅ Cập nhật trạng thái thanh toán (bank / cash)
export const updateBookingPayment = async (id: string, method: "bank" | "cash") => {
  try {
    console.log("📤 Gửi yêu cầu cập nhật thanh toán:", { id, method });

    const res = await axios.put(`${API_URL}/payment/${id}`, { method });

    console.log("✅ Cập nhật thanh toán thành công:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("❌ Lỗi khi cập nhật thanh toán:", error);
    console.error("❌ Response:", error?.response?.data);
    throw error;
  }
};
// ✅ Lấy danh sách vé theo partnerId (tính doanh thu)
// ✅ Lấy danh sách vé theo partnerId (tính doanh thu)
export const getBookingsByPartnerId = async (partnerId: string) => {
  try {
    const res = await axios.get(`${API_URL}/partner/${partnerId}`);
    return res.data.bookings || res.data;
  } catch (error) {
    console.error("❌ Error fetching bookings:", error);
    throw error;
  }
};

export default {
  getBookingsByPartnerId,
  updateBookingStatus,
};
