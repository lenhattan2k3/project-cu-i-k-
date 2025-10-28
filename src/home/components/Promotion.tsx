import { useState } from 'react';

interface PromotionItem {
  id: string;
  code: string;
  title: string;
  description: string;
  discount: number;
  validUntil: string;
}

export default function Promotion() {
  const [promotions] = useState<PromotionItem[]>([
    {
      id: '1',
      code: 'SUMMER2025',
      title: 'Khuyến mãi Hè 2025',
      description: 'Giảm 20% cho tất cả các chuyến xe trong tháng 6',
      discount: 20,
      validUntil: '2025-06-30'
    },
    {
      id: '2',
      code: 'NEWUSER',
      title: 'Ưu đãi người dùng mới',
      description: 'Giảm 50K cho lần đặt vé đầu tiên',
      discount: 50000,
      validUntil: '2025-12-31'
    }
  ]);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('Đã sao chép mã khuyến mãi!');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">🎁 Khuyến mãi</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {promotions.map((promo) => (
          <div key={promo.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
            <div className="bg-blue-600 text-white p-4">
              <h3 className="text-xl font-bold">{promo.title}</h3>
              <p className="text-blue-100 mt-1">{promo.description}</p>
            </div>
            
            <div className="p-4 bg-white">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gray-100 px-3 py-2 rounded">
                  <code className="text-lg font-bold text-blue-600">{promo.code}</code>
                </div>
                <button
                  onClick={() => copyToClipboard(promo.code)}
                  className="px-4 py-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition"
                >
                  Sao chép mã
                </button>
              </div>
              
              <p className="text-sm text-gray-600">
                Có hiệu lực đến: {new Date(promo.validUntil).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
