import { useState } from 'react';

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
}

export default function Payment() {
  const [selectedMethod, setSelectedMethod] = useState('');

  const paymentMethods: PaymentMethod[] = [
    { id: 'momo', name: 'Ví MoMo', icon: '💰' },
    { id: 'banking', name: 'Chuyển khoản ngân hàng', icon: '🏦' },
    { id: 'card', name: 'Thẻ tín dụng/ghi nợ', icon: '💳' },
    { id: 'cash', name: 'Tiền mặt', icon: '💵' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Xử lý thanh toán
    console.log('Processing payment with method:', selectedMethod);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">💳 Thanh toán</h2>

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold mb-2">Tổng thanh toán</h3>
        <p className="text-2xl font-bold text-blue-600">500,000đ</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`p-4 border rounded-lg cursor-pointer ${
                selectedMethod === method.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => setSelectedMethod(method.id)}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{method.icon}</span>
                <span className="font-medium">{method.name}</span>
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={!selectedMethod}
          className={`w-full py-2 px-4 rounded-md transition duration-200 ${
            selectedMethod
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Xác nhận thanh toán
        </button>
      </form>
    </div>
  );
}
