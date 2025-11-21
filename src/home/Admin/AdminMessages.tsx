import React from "react";
import { Link } from "react-router-dom";

export default function AdminMessages() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Tin nhắn (Admin)</h2>
      <p className="mb-3">Vui lòng sử dụng màn hình phản hồi khiếu nại để trò chuyện với nhà xe.</p>
      <Link to="/homeadmin" className="text-blue-600 underline">Quay lại Trang Admin</Link>
    </div>
  );
}
