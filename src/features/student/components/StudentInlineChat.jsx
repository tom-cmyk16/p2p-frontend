import { useEffect, useRef, useState } from "react";
import {
  FileText,
  Paperclip,
  Send,
  AlertCircle,
  Loader2,
  Star,
  ShieldAlert,
} from "lucide-react";
import { useAuthContext } from "../../../context/AuthContext";
import { useChat } from "../../chat/hooks/useChat";
import { chatService } from "../../chat/services/chat.service";
import ChatMessageBubble from "../../chat/components/ChatMessageBubble";
import RateTutorModal from "../../ratings/components/RateTutorModal";
import ReportTutorModal from "../../reports/components/ReportTutorModal";

export default function StudentInlineChat({ mentor, initialConversationId }) {
  const { user } = useAuthContext();
  const [activeConversationId, setActiveConversationId] = useState(
    initialConversationId || null
  );
  const [initError, setInitError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [text, setText] = useState("");
  const [fileError, setFileError] = useState(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isReportingModalOpen, setIsReportingModalOpen] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const {
    conversations,
    messages,
    isLoading: isLoadingMessages,
    isSending,
    error: chatError,
    sendText,
    sendFile,
  } = useChat(activeConversationId);

  // Find or create conversation if not supplied
  useEffect(() => {
    if (initialConversationId) {
      setActiveConversationId(initialConversationId);
      return;
    }

    if (activeConversationId) {
      return;
    }

    const mentorId = mentor?.userId || mentor?.id || mentor?.tutorId;
    if (!mentorId) return;

    // Check if we already have this conversation loaded in cached list
    const existing = conversations.find(
      (c) => c.tutorId === mentorId || c.studentId === mentorId
    );
    if (existing) {
      setActiveConversationId(existing.id);
      return;
    }

    // Auto-create/get conversation
    let active = true;
    setIsInitializing(true);
    setInitError(null);

    chatService
      .getOrCreateConversation(mentorId)
      .then((conv) => {
        if (active && conv?.id) {
          setActiveConversationId(conv.id);
        }
      })
      .catch((err) => {
        if (active) {
          console.error("[StudentInlineChat] Chat init error:", err);
          setInitError(
            err.response?.data?.error?.message ||
              "Unable to initialize chat with mentor."
          );
        }
      })
      .finally(() => {
        if (active) setIsInitializing(false);
      });

    return () => {
      active = false;
    };
  }, [initialConversationId, mentor?.userId, mentor?.id, mentor?.tutorId, conversations, activeConversationId]);

  const retryConnect = () => {
    setActiveConversationId(null);
    setInitError(null);
    const mentorId = mentor?.userId || mentor?.id || mentor?.tutorId;
    if (!mentorId) return;

    setIsInitializing(true);
    chatService
      .getOrCreateConversation(mentorId)
      .then((conv) => {
        if (conv?.id) setActiveConversationId(conv.id);
      })
      .catch((err) => {
        setInitError(
          err.response?.data?.error?.message ||
            "Unable to initialize chat with mentor."
        );
      })
      .finally(() => {
        setIsInitializing(false);
      });
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendText = async (e) => {
    e.preventDefault();
    if (!text.trim() || isSending || !activeConversationId) return;

    try {
      await sendText(text);
      setText("");
    } catch {
      // Error handled in useChat
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversationId) return;

    setFileError(null);

    // Validate type: JPG, PNG, PDF
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setFileError("Only photos (JPG, PNG) and PDF documents are supported.");
      e.target.value = "";
      return;
    }

    // Validate size: 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      setFileError("Attachment file size must be less than 10 MB.");
      e.target.value = "";
      return;
    }

    try {
      await sendFile(file);
    } catch (err) {
      setFileError(err.message || "Failed to upload file attachment.");
    } finally {
      e.target.value = "";
    }
  };

  const mentorName = mentor?.fullName || mentor?.user?.fullName || "Your Mentor";

  return (
    <div className="flex h-[560px] flex-col rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden text-left">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#013638] text-white font-bold shadow-xs">
            {mentorName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{mentorName}</h3>
            <p className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Direct 1-on-1 Mentorship</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeConversationId && (
            <button
              type="button"
              onClick={() => setIsRatingModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-850 hover:bg-amber-100 transition shadow-xs text-amber-900"
              title="Rate your mentor"
            >
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
              <span className="hidden sm:inline">Rate</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsReportingModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition shadow-xs"
            title="Report mentor to platform administration"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
            <span className="hidden sm:inline">Report</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40">
        {isInitializing || (isLoadingMessages && messages.length === 0) ? (
          <div className="flex h-full items-center justify-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-[#013638]" />
            <span>Connecting to chat...</span>
          </div>
        ) : initError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-xs text-rose-800 space-y-2">
            <AlertCircle className="mx-auto h-6 w-6 text-rose-600" />
            <p className="font-bold text-sm">Chat Connection Error</p>
            <p className="text-slate-600 max-w-sm mx-auto">{initError}</p>
            <button
              type="button"
              onClick={retryConnect}
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition"
            >
              <span>Retry Connecting</span>
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
            <div className="rounded-full bg-slate-100 p-3 text-slate-500">
              <FileText className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">No messages yet</p>
            <p className="text-xs text-slate-500 max-w-xs">
              Say hello to {mentorName}! You can ask questions, share exercise photos, or send PDF documents for review.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessageBubble
              key={message.id}
              message={message}
              currentUserId={user?.id}
              partnerName={mentorName}
              partnerRole="TUTOR"
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Banners */}
      {(fileError || chatError) && (
        <div className="flex items-center gap-2 border-t border-rose-100 bg-rose-50 px-4 py-2 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{fileError || chatError}</span>
        </div>
      )}

      {/* Input / Attachment Controls */}
      <form
        onSubmit={handleSendText}
        className="flex items-center gap-2 border-t border-slate-200 bg-white p-3 sm:p-4"
      >
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          disabled={isSending || !activeConversationId}
        />

        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending || !activeConversationId}
          title="Attach PDF Document or Photo"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-[#013638] disabled:opacity-50"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        {/* Text Input */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Message ${mentorName}...`}
          disabled={isSending || !activeConversationId}
          className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/15"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={isSending || !text.trim() || !activeConversationId}
          className="flex h-10 w-10 sm:w-auto sm:px-5 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#013638] text-white text-xs font-bold transition hover:bg-[#024e51] disabled:opacity-50 shadow-xs"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <span className="hidden sm:inline">Send</span>
              <Send className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Rate Tutor Modal */}
      {isRatingModalOpen && activeConversationId && (
        <RateTutorModal
          isOpen={isRatingModalOpen}
          onClose={() => setIsRatingModalOpen(false)}
          conversationId={activeConversationId}
          tutorName={mentorName}
          courseName="Direct Mentorship"
        />
      )}

      {/* Report Tutor Modal */}
      {isReportingModalOpen && (
        <ReportTutorModal
          isOpen={isReportingModalOpen}
          onClose={() => setIsReportingModalOpen(false)}
          tutorId={mentor?.userId || mentor?.id || mentor?.tutorId}
          tutorName={mentorName}
          courseName="Direct Mentorship"
          conversationId={activeConversationId}
        />
      )}
    </div>
  );
}
