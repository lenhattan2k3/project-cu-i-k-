import React from "react";

export default function PartnerReport() {
  const report = {
    totalRevenue: 50000000,
    platformFee: 5000000,
    netIncome: 45000000,
  };

  return (
    <div className="p-8 bg-white rounded-2xl shadow-md mt-8">
      <h2 className="text-2xl font-bold text-blue-700 mb-4">📊 Báo cáo công nợ</h2>
      <div className="space-y-2 text-gray-700">
        <p>Tổng doanh thu: <b>{report.totalRevenue.toLocaleString()}₫</b></p>
        <p>Phí sàn: <b>{report.platformFee.toLocaleString()}₫</b></p>
        <p>Lợi nhuận ròng: <b>{report.netIncome.toLocaleString()}₫</b></p>
      </div>
    </div>
  );
}
