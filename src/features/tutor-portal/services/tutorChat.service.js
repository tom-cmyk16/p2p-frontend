import { io } from "socket.io-client";
import apiClient from "../../../lib/apiClient";

export const MAX_CHAT_FILE_SIZE = 5 * 1024 * 1024;
export const CHAT_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
];

const getConversationUrl = (conversationId) =>
  `/conversations/${encodeURIComponent(conversationId)}`;

export const tutorChatService = {
  getConversations: () =>
    apiClient.get("/conversations").then((response) => response.data),
  getMessages: (conversationId, params = {}) =>
    apiClient
      .get(`${getConversationUrl(conversationId)}/messages`, { params })
      .then((response) => response.data),
  sendTextMessage: (conversationId, textContent) =>
    apiClient
      .post(`${getConversationUrl(conversationId)}/messages`, {
        type: "TEXT",
        textContent,
      })
      .then((response) => response.data),
  sendFileMessage: (conversationId, file) => {
    if (!CHAT_FILE_TYPES.includes(file.type)) {
      throw new Error("Choose a JPG, PNG, or PDF file.");
    }

    if (file.size > MAX_CHAT_FILE_SIZE) {
      throw new Error("Files must be 5 MB or smaller.");
    }

    const formData = new FormData();
    formData.append("file", file);

    return apiClient
      .post(`${getConversationUrl(conversationId)}/messages/file`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((response) => response.data);
  },
  connect: () =>
    io(import.meta.env.VITE_SOCKET_URL || "http://localhost:3000", {
      auth: { token: localStorage.getItem("token") },
    }),
};
