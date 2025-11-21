import React, { useState } from "react";
import { sendComplaint } from "../../api/complaintsApi";

export default function UserComplaint() {
  const [message, setMessage] = useState("");
  const [receiverRole, setReceiverRole] = useState<"admin" | "partner">("partner");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return alert("Vui lòng nhập nội dung!");
    setLoading(true);
    try {
      await sendComplaint({ senderId: "user", receiverRole, message });
      alert("✅ Gửi khiếu nại thành công!");
      setMessage("");
    } catch (e) {
      console.error(e);
      alert("❌ Không thể gửi khiếu nại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded p-4">
      <h2 className="text-lg font-semibold mb-3">📝 Gửi khiếu nại</h2>
      <div className="mb-3">
        <label className="mr-2">Gửi đến:</label>
        <select
          className="border rounded p-2"
          value={receiverRole}
          onChange={(e) => setReceiverRole(e.target.value as any)}
        >
          <option value="partner">Nhà xe</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <textarea
        className="w-full border rounded p-3"
        rows={5}
        placeholder="Nhập nội dung khiếu nại..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Đang gửi..." : "Gửi khiếu nại"}
      </button>
    </div>
  );
}
