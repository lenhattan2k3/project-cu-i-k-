// 📌 Kiểu dữ liệu gửi lên backend khi thêm review
export interface ReviewFormProps {
  bookingId: string;
  tripId: string;
  userId: string;
  hoTen: string;
  rating: number;
  comment: string;
}
