// src/api/messagesApi.ts
import axios from "axios";
import { getAuth } from "firebase/auth";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/messages";

async function authHeaders() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export const getMessages = async (user1: string, user2: string) => {
  const headers = await authHeaders();
  const res = await axios.get(`${BASE}/${user1}/${user2}`, { headers });
  return res.data;
};

export const getConversations = async () => {
  const headers = await authHeaders();
  const res = await axios.get(`${BASE}/conversations`, { headers });
  return res.data;
};

export const getMessagesByConversation = async (conversationId: string) => {
  const headers = await authHeaders();
  const res = await axios.get(`${BASE}/conversation/${conversationId}`, { headers });
  return res.data;
};

export const sendMessage = async (
  payload:
    | {
        senderId: string;
        senderRole: string;
        receiverId: string;
        receiverRole: string;
        content: string;
        conversationId?: string;
      }
    | {
        conversationId: string;
        sender: string;
        content: string;
      }
) => {
  const headers = await authHeaders();
  const res = await axios.post(BASE, payload as any, { headers });
  return res.data;
};
