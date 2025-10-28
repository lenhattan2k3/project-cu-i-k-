import React from "react";

export default function PartnerNotification() {
  const noti = [
    { id: 1, msg: "Khách hàng Nguyễn Văn A đã đặt vé thành công!" },
    { id: 2, msg: "Chuyến xe Đà Lạt - TP.HCM còn 2 ghế trống." },
  ];

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-blue-700 mb-4">🔔 Thông báo</h2>
      {noti.map((n) => (
        <div key={n.id} className="bg-blue-50 p-3 rounded-md mb-2 border-l-4 border-blue-600">
          {n.msg}
        </div>
      ))}
    </div>
  );
}
