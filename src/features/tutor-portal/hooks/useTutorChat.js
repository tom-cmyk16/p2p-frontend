import { useCallback, useEffect, useState } from "react";
import { tutorChatService } from "../services/tutorChat.service";

const getErrorMessage = (error, fallback) =>
  error.response?.data?.error?.message ||
  error.message ||
  fallback;

export function useTutorChat(conversationId, tutorId) {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(Boolean(conversationId));
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    setError(null);

    try {
      const response = await tutorChatService.getConversations();
      const tutorSessions = response.filter(
        (conversation) => conversation.tutorId === tutorId
      );
      setConversations(tutorSessions);
      return tutorSessions;
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Failed to load chat sessions"));
      return [];
    } finally {
      setIsLoadingConversations(false);
    }
  }, [tutorId]);

  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setIsLoadingMessages(false);
      return [];
    }

    setIsLoadingMessages(true);
    setError(null);

    try {
      const firstPage = await tutorChatService.getMessages(conversationId, {
        page: 1,
        limit: 100,
      });
      const result = [...(firstPage.items || [])];
      const pageCount = Math.ceil((firstPage.total || 0) / 100);

      for (let page = 2; page <= pageCount; page += 1) {
        const response = await tutorChatService.getMessages(conversationId, {
          page,
          limit: 100,
        });
        result.push(...(response.items || []));
      }

      result.sort(
        (first, second) => new Date(first.sentAt) - new Date(second.sentAt)
      );
      setMessages(result);
      return result;
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Failed to load messages"));
      return [];
    } finally {
      setIsLoadingMessages(false);
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

    const socket = tutorChatService.connect();
    const joinConversation = () => {
      socket.emit("conversation:join", conversationId);
    };
    const receiveMessage = (message) => {
      if (message.conversationId !== conversationId) {
        return;
      }

      setMessages((currentMessages) =>
        currentMessages.some((currentMessage) => currentMessage.id === message.id)
          ? currentMessages
          : [...currentMessages, message]
      );
    };
    const updateMessageStatus = ({ messageId, status }) => {
      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === messageId ? { ...message, status } : message
        )
      );
    };
    const receiveSocketError = (socketError) => {
      setError(socketError?.message || "The live chat connection reported an error.");
    };

    socket.on("connect", joinConversation);
    socket.on("message:new", receiveMessage);
    socket.on("message:statusUpdate", updateMessageStatus);
    socket.on("error", receiveSocketError);

    return () => {
      socket.off("connect", joinConversation);
      socket.off("message:new", receiveMessage);
      socket.off("message:statusUpdate", updateMessageStatus);
      socket.off("error", receiveSocketError);
      if (socket.connected) {
        socket.emit("conversation:leave", conversationId);
      }
      socket.disconnect();
    };
  }, [conversationId]);

  const sendText = useCallback(
    async (textContent) => {
      setIsSending(true);
      setError(null);

      try {
        const message = await tutorChatService.sendTextMessage(
          conversationId,
          textContent.trim()
        );
        setMessages((currentMessages) =>
          currentMessages.some((currentMessage) => currentMessage.id === message.id)
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
        const message = await tutorChatService.sendFileMessage(conversationId, file);
        setMessages((currentMessages) =>
          currentMessages.some((currentMessage) => currentMessage.id === message.id)
            ? currentMessages
            : [...currentMessages, message]
        );
        return message;
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Failed to upload file"));
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
    isLoadingConversations,
    isLoadingMessages,
    isSending,
    error,
    loadConversations,
    loadMessages,
    sendText,
    sendFile,
  };
}
