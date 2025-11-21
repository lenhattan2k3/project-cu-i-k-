import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getMessages, sendMessage } from "../../api/messagesApi";

interface MessageItem {
  _id: string;
  sender: string;
  content: string;
  createdAt: string;
}

export default function UserMessages() {
  const [partnerId, setPartnerId] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [text, setText] = useState("");

  const load = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user || !partnerId) return;
    const data = await getMessages(user.uid, partnerId);
    setMessages(data);
  };

  useEffect(() => {
    if (partnerId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId]);

  const handleSend = async () => {
    if (!text.trim() || !partnerId) return;
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
    await sendMessage({
      senderId: user.uid,
      senderRole: "user",
      receiverId: partnerId,
      receiverRole: "partner",
      content: text,
    });
    setText("");
    await load();
  };

  return (
    <div className="bg-white shadow rounded p-4">
      <h2 className="text-lg font-semibold mb-3">💬 Chat với Nhà xe</h2>
      <div className="mb-3 flex gap-2">
        <input
          className="border rounded p-2 flex-1"
          placeholder="Nhập Partner ID"
          value={partnerId}
          onChange={(e) => setPartnerId(e.target.value)}
        />
        <button className="px-3 py-2 bg-emerald-600 text-white rounded" onClick={load}>
          Tải chat
        </button>
      </div>

      <div className="h-64 overflow-y-auto border rounded p-3 mb-3">
        {messages.map((m) => (
          <div key={m._id} className="mb-2">
            <div className="text-sm text-gray-500">
              {new Date(m.createdAt).toLocaleString()}
            </div>
            <div>
              <b>{m.sender}:</b> {m.content}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="border rounded p-2 flex-1"
          placeholder="Nhập tin nhắn..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={handleSend}>
          Gửi
        </button>
      </div>
    </div>
  );
}
