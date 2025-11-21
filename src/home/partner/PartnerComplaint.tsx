import { useState } from "react";
import { sendComplaint } from "../../api/complaintsApi";

export default function PartnerComplaint() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      await sendComplaint({ senderId: "partner", receiverRole: "admin", message });
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
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-3">Gửi khiếu nại đến Admin</h2>
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
