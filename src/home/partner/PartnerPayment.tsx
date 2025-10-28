import React from "react";

export default function PartnerPayment() {
  return (
    <div className="p-8 bg-white shadow-md rounded-xl mt-8">
      <h2 className="text-2xl font-bold text-blue-700 mb-4">💳 Quản lý thanh toán</h2>
      <ul className="space-y-3 text-gray-700">
        <li>✔️ Tích hợp thanh toán qua Momo / ZaloPay / Banking</li>
        <li>✔️ Theo dõi giao dịch và hoàn tiền</li>
        <li>✔️ Tự động hủy vé nếu quá hạn</li>
        <li>✔️ Xuất hóa đơn điện tử</li>
      </ul>
    </div>
  );
}
