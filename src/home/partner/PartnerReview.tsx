import React from "react";

export default function PartnerReview() {
  const reviews = [
    { id: 1, user: "Nguyễn Văn A", rating: 5, comment: "Rất tốt!" },
    { id: 2, user: "Trần Thị B", rating: 3, comment: "Xe hơi trễ giờ" },
  ];

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-blue-700 mb-4">⭐ Đánh giá khách hàng</h2>
      {reviews.map((r) => (
        <div key={r.id} className="border p-4 rounded-lg mb-3 bg-white shadow">
          <p className="font-bold">{r.user}</p>
          <p>Đánh giá: {r.rating} ⭐</p>
          <p className="text-gray-600 italic">{r.comment}</p>
        </div>
      ))}
    </div>
  );
}
