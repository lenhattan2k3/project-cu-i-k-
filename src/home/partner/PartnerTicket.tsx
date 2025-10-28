import React from "react";

export default function PartnerTicket() {
  const tickets = [
    { id: 1, user: "Nguyễn Văn A", trip: "TP.HCM - Đà Lạt", status: "Đã thanh toán" },
    { id: 2, user: "Trần Thị B", trip: "Hà Nội - Hải Phòng", status: "Chờ thanh toán" },
  ];

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-blue-700 mb-4">🎫 Quản lý vé</h2>
      <table className="w-full border">
        <thead className="bg-blue-100">
          <tr>
            <th>Khách hàng</th>
            <th>Chuyến</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id} className="text-center border-t">
              <td>{t.user}</td>
              <td>{t.trip}</td>
              <td>{t.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
