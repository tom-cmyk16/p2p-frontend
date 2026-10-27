import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { chatService } from "../services/chat.service";

const getErrorMessage = (error, fallback) =>
  error.response?.data?.error?.message ||
  error.message ||
  fallback;

export function useChat(conversationId) {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(conversationId));
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);

    try {
      const results = await chatService.getConversations();
      setConversations(results);
      return results;
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Failed to load conversations"));
      return [];
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setIsLoading(false);
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await chatService.getMessages(conversationId);
      const loadedMessages = Array.isArray(result.items)
        ? [...result.items].reverse()
        : [];
      setMessages(loadedMessages);
      return loadedMessages;
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Failed to load messages"));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!conversationId) {
      return undefined;
    }

    const socket = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:3000",
      {
        auth: { token: localStorage.getItem("token") },
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        timeout: 10000,
      }
    );

    const joinConversation = () => {
      socket.emit("conversation:join", conversationId);
    };

    const handleNewMessage = (message) => {
      if (message.conversationId !== conversationId) {
        return;
      }

      setMessages((currentMessages) =>
        currentMessages.some((existing) => existing.id === message.id)
          ? currentMessages
          : [...currentMessages, message]
      );
    };

    const handleMessageStatusUpdate = ({ messageId, status }) => {
      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === messageId ? { ...message, status } : message
        )
      );
    };

    const handleSocketError = (socketError) => {
      console.warn("[useChat Socket] Error:", socketError);
      setError(socketError?.message || "Live chat connection error");
    };

    const handleConnectError = (connectError) => {
      console.warn("[useChat Socket] Connect error:", connectError?.message);
    };

    if (socket.connected) {
      joinConversation();
    } else {
      socket.on("connect", joinConversation);
    }

    socket.on("connect_error", handleConnectError);
    socket.on("message:new", handleNewMessage);
    socket.on("message:statusUpdate", handleMessageStatusUpdate);
    socket.on("error", handleSocketError);

    return () => {
      socket.off("connect", joinConversation);
      socket.off("connect_error", handleConnectError);
      socket.off("message:new", handleNewMessage);
      socket.off("message:statusUpdate", handleMessageStatusUpdate);
      socket.off("error", handleSocketError);
      if (socket.connected) {
        socket.emit("conversation:leave", conversationId);
      }
      socket.disconnect();
    };
  }, [conversationId]);

  const sendText = useCallback(
    async (text) => {
      setIsSending(true);
      setError(null);

      try {
        const message = await chatService.sendTextMessage(
          conversationId,
          text.trim()
        );
        setMessages((currentMessages) =>
          currentMessages.some((existing) => existing.id === message.id)
            ? currentMessages
            : [...currentMessages, message]
        );
        return message;
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Failed to send message"));
        throw requestError;
      } finally {
        setIsSending(false);
      }
    },
    [conversationId]
  );

  const sendFile = useCallback(
    async (file) => {
      setIsSending(true);
      setError(null);

      try {
        const message = await chatService.sendFileMessage(conversationId, file);
        setMessages((currentMessages) =>
          currentMessages.some((existing) => existing.id === message.id)
            ? currentMessages
            : [...currentMessages, message]
        );
        return message;
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Failed to send file"));
        throw requestError;
      } finally {
        setIsSending(false);
      }
    },
    [conversationId]
  );

  return {
    conversations,
    messages,
    isLoading,
    isLoadingConversations,
    isSending,
    error,
    loadConversations,
    loadMessages,
    sendText,
    sendFile,
  };
}
