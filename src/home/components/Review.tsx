import { useState } from 'react';
import { FaStar } from 'react-icons/fa';

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export default function Review() {
  const [reviews] = useState<Review[]>([
    {
      id: '1',
      userName: 'Nguyễn Văn A',
      rating: 5,
      comment: 'Dịch vụ rất tốt, xe sạch sẽ và đúng giờ',
      date: '2025-10-20'
    },
    {
      id: '2',
      userName: 'Trần Thị B',
      rating: 4,
      comment: 'Nhân viên phục vụ nhiệt tình, tuy nhiên xe hơi cũ',
      date: '2025-10-19'
    }
  ]);

  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting review:', newReview);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">⭐ Đánh giá</h2>

      {/* Form đánh giá mới */}
      <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 p-6 rounded-lg">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Đánh giá của bạn
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setNewReview({...newReview, rating: star})}
                className={`text-2xl ${
                  star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'
                }`}
              >
                <FaStar />
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nhận xét của bạn
          </label>
          <textarea
            value={newReview.comment}
            onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={4}
            placeholder="Chia sẻ trải nghiệm của bạn..."
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
        >
          Gửi đánh giá
        </button>
      </form>

      {/* Danh sách đánh giá */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">{review.userName}</h3>
                <div className="flex text-yellow-400 mt-1">
                  {[...Array(review.rating)].map((_, i) => (
                    <FaStar key={i} />
                  ))}
                </div>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(review.date).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-600">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
